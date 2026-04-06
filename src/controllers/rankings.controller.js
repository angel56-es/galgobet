const Ranking = require('../models/Ranking');
const Resultado = require('../models/Resultado');
const Apuesta = require('../models/Apuesta');

const getRanking = async (req, res) => {
  try {
    const temporada = req.query.temporada || new Date().getFullYear().toString();

    const ranking = await Ranking.findOne({ temporada })
      .populate('clasificacion.galgo_id', 'nombre raza entrenador cuota_actual estado');

    if (!ranking) {
      return res.json({ temporada, clasificacion: [], mensaje: 'No hay ranking para esta temporada' });
    }

    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ranking', detalle: error.message });
  }
};

const getRankingVueltaRapida = async (req, res) => {
  try {
    const resultado = await Resultado.aggregate([
      {
        $group: {
          _id: '$galgo_id',
          mejor_tiempo: { $min: '$tiempo_total_ms' },
          total_vueltas: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'galgos',
          localField: '_id',
          foreignField: '_id',
          as: 'galgo'
        }
      },
      { $unwind: '$galgo' },
      {
        $project: {
          _id: 0,
          galgo_id: '$_id',
          nombre: '$galgo.nombre',
          raza: '$galgo.raza',
          entrenador: '$galgo.entrenador',
          mejor_tiempo: 1,
          total_vueltas: 1
        }
      },
      { $sort: { mejor_tiempo: 1 } }
    ]);

    const rankingConPosicion = resultado.map((item, index) => ({
      posicion: index + 1,
      ...item
    }));

    res.json(rankingConPosicion);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ranking de vuelta rápida', detalle: error.message });
  }
};

const getRankingApostadores = async (req, res) => {
  try {
    const resultado = await Apuesta.aggregate([
      {
        $group: {
          _id: '$usuario_id',
          total_apostado: { $sum: '$cantidad_apostada' },
          total_ganancia_real: { $sum: '$ganancia_real' },
          apuestas_totales: { $sum: 1 },
          apuestas_ganadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'ganada'] }, 1, 0] }
          },
          apuestas_perdidas: {
            $sum: { $cond: [{ $eq: ['$estado', 'perdida'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'usuario'
        }
      },
      { $unwind: '$usuario' },
      {
        $project: {
          _id: 0,
          usuario_id: '$_id',
          nombre: '$usuario.nombre',
          total_apostado: 1,
          total_ganancia_real: 1,
          apuestas_totales: 1,
          apuestas_ganadas: 1,
          apuestas_perdidas: 1,
          beneficio_neto: { $subtract: ['$total_ganancia_real', '$total_apostado'] }
        }
      },
      { $sort: { total_ganancia_real: -1 } }
    ]);

    const rankingConPosicion = resultado.map((item, index) => ({
      posicion: index + 1,
      ...item
    }));

    res.json(rankingConPosicion);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ranking de apostadores', detalle: error.message });
  }
};

module.exports = { getRanking, getRankingVueltaRapida, getRankingApostadores };

const Incidente = require('../models/Incidente');

const getAll = async (req, res) => {
  try {
    const { galgo_id, carrera_id, tipo, gravedad } = req.query;
    const filtro = {};

    if (galgo_id) filtro.galgo_id = galgo_id;
    if (carrera_id) filtro.carrera_id = carrera_id;
    if (tipo) filtro.tipo = tipo;
    if (gravedad) filtro.gravedad = gravedad;

    const incidentes = await Incidente.find(filtro)
      .populate('galgo_id', 'nombre raza')
      .populate('carrera_id', 'fecha')
      .sort({ createdAt: -1 });

    res.json(incidentes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener incidentes', detalle: error.message });
  }
};

const getByGalgo = async (req, res) => {
  try {
    const incidentes = await Incidente.find({ galgo_id: req.params.id })
      .populate('carrera_id', 'fecha pista_id')
      .sort({ createdAt: -1 });

    res.json(incidentes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener incidentes del galgo', detalle: error.message });
  }
};

const getEstadisticas = async (req, res) => {
  try {
    const totalIncidentes = await Incidente.countDocuments();

    const galgoMasAccidentes = await Incidente.aggregate([
      { $group: { _id: '$galgo_id', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 1 },
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
          total_accidentes: '$total'
        }
      }
    ]);

    const tramoPeligroso = await Incidente.aggregate([
      {
        $group: {
          _id: { tramo_numero: '$tramo_numero', tramo_tipo: '$tramo_tipo' },
          total: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 1 },
      {
        $project: {
          _id: 0,
          tramo_numero: '$_id.tramo_numero',
          tramo_tipo: '$_id.tramo_tipo',
          total_incidentes: '$total'
        }
      }
    ]);

    const porTipo = await Incidente.aggregate([
      { $group: { _id: '$tipo', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $project: { _id: 0, tipo: '$_id', total: 1 } }
    ]);

    const porCausa = await Incidente.aggregate([
      { $group: { _id: '$causa', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $project: { _id: 0, causa: '$_id', total: 1 } }
    ]);

    const porGravedad = await Incidente.aggregate([
      { $group: { _id: '$gravedad', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $project: { _id: 0, gravedad: '$_id', total: 1 } }
    ]);

    const mediaPenalizacionPorTipo = await Incidente.aggregate([
      {
        $group: {
          _id: '$tipo',
          media_penalizacion_ms: { $avg: '$tiempo_penalizacion_ms' },
          total: { $sum: 1 }
        }
      },
      { $sort: { media_penalizacion_ms: -1 } },
      {
        $project: {
          _id: 0,
          tipo: '$_id',
          media_penalizacion_ms: { $round: ['$media_penalizacion_ms', 0] },
          total: 1
        }
      }
    ]);

    res.json({
      total_incidentes: totalIncidentes,
      galgo_mas_accidentes: galgoMasAccidentes[0] || null,
      tramo_mas_peligroso: tramoPeligroso[0] || null,
      incidentes_por_tipo: porTipo,
      incidentes_por_causa: porCausa,
      incidentes_por_gravedad: porGravedad,
      media_penalizacion_por_tipo: mediaPenalizacionPorTipo
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas de incidentes', detalle: error.message });
  }
};

module.exports = { getAll, getByGalgo, getEstadisticas };

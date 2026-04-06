const Carrera = require('../models/Carrera');
const Resultado = require('../models/Resultado');
const Galgo = require('../models/Galgo');
const Pista = require('../models/Pista');
const { simularCarrera } = require('../services/simulacion.service');
const { obtenerCuotasCarrera } = require('../services/cuotas.service');

const ASIGNACION_GALGOS = {
  'Canódromo de Madrid': ['Rayo', 'Centella', 'Trueno', 'Relámpago'],
  'Canódromo de Barcelona': ['Veloz', 'Sombra', 'Tormenta', 'Cometa'],
  'Canódromo de Sevilla': ['Flecha', 'Meteoro', 'Tornado', 'Huracán']
};

const VUELTAS_POR_PISTA = {
  'Canódromo de Madrid': 3,
  'Canódromo de Barcelona': 3,
  'Canódromo de Sevilla': 3
};

const prepararJornada = async (req, res) => {
  try {
    const pistas = await Pista.find().sort({ nombre: 1 });
    const pistaNames = pistas.map(p => p.nombre);

    const programadas = await Carrera.find({ estado: 'programada' })
      .populate('pista_id', 'nombre longitud_total_m superficie num_tramos')
      .populate('galgos_participantes', 'nombre raza cuota_actual estadisticas caracteristicas');

    const pistasConCarrera = {};
    const carrerasValidas = [];

    for (const c of programadas) {
      const pistaNombre = c.pista_id ? c.pista_id.nombre : null;
      if (pistaNombre && ASIGNACION_GALGOS[pistaNombre]) {
        const nombresEsperados = ASIGNACION_GALGOS[pistaNombre];
        const nombresActuales = (c.galgos_participantes || []).map(g => g.nombre);
        const coincide = nombresEsperados.every(n => nombresActuales.includes(n)) &&
                         nombresActuales.every(n => nombresEsperados.includes(n));

        if (coincide && !pistasConCarrera[pistaNombre]) {
          pistasConCarrera[pistaNombre] = true;
          carrerasValidas.push(c);
        } else {
          const Apuesta = require('../models/Apuesta');
          const apuestas = await Apuesta.countDocuments({ carrera_id: c._id, estado: 'pendiente' });
          if (apuestas === 0) {
            await Carrera.findByIdAndDelete(c._id);
          }
        }
      } else {
        const Apuesta = require('../models/Apuesta');
        const apuestas = await Apuesta.countDocuments({ carrera_id: c._id, estado: 'pendiente' });
        if (apuestas === 0) {
          await Carrera.findByIdAndDelete(c._id);
        }
      }
    }

    if (carrerasValidas.length === pistas.length) {
      return res.json({ mensaje: 'Jornada en curso', carreras: carrerasValidas });
    }

    for (const pista of pistas) {
      if (pistasConCarrera[pista.nombre]) continue;

      const nombresGalgos = ASIGNACION_GALGOS[pista.nombre];
      if (!nombresGalgos) continue;

      const galgos = await Galgo.find({ nombre: { $in: nombresGalgos }, estado: 'activo' });
      if (galgos.length < 2) continue;

      const cuotasPreCarrera = galgos.map(g => ({ galgo_id: g._id, cuota: g.cuota_actual }));
      const numVueltas = VUELTAS_POR_PISTA[pista.nombre] || 3;

      const carrera = await Carrera.create({
        pista_id: pista._id,
        estado: 'programada',
        num_vueltas: numVueltas,
        galgos_participantes: galgos.map(g => g._id),
        cuotas_pre_carrera: cuotasPreCarrera
      });

      const carreraPopulada = await Carrera.findById(carrera._id)
        .populate('pista_id', 'nombre longitud_total_m superficie num_tramos')
        .populate('galgos_participantes', 'nombre raza cuota_actual estadisticas caracteristicas');

      carrerasValidas.push(carreraPopulada);
    }

    carrerasValidas.sort((a, b) => {
      const nA = a.pista_id ? a.pista_id.nombre : '';
      const nB = b.pista_id ? b.pista_id.nombre : '';
      return nA.localeCompare(nB);
    });

    res.status(201).json({ mensaje: 'Jornada preparada', carreras: carrerasValidas });
  } catch (error) {
    res.status(500).json({ error: 'Error al preparar jornada', detalle: error.message });
  }
};

const correrCarrera = async (req, res) => {
  try {
    const { carrera_id } = req.body;
    if (!carrera_id) {
      return res.status(400).json({ error: 'carrera_id es obligatorio' });
    }

    const carreraProgramada = await Carrera.findById(carrera_id);
    if (!carreraProgramada) {
      return res.status(404).json({ error: 'Carrera no encontrada' });
    }
    if (carreraProgramada.estado !== 'programada') {
      return res.status(400).json({ error: 'La carrera ya fue corrida' });
    }

    const resultado = await simularCarrera(
      carreraProgramada.pista_id,
      carreraProgramada.galgos_participantes,
      carreraProgramada.num_vueltas,
      carrera_id
    );

    const galgosActualizados = await Galgo.find({ estado: 'activo' })
      .select('nombre cuota_actual estadisticas');

    const cuotasActualizadas = {};
    for (const g of galgosActualizados) {
      cuotasActualizadas[g._id.toString()] = {
        nombre: g.nombre,
        cuota_actual: g.cuota_actual,
        carreras_corridas: g.estadisticas.carreras_corridas,
        victorias: g.estadisticas.victorias,
        podios: g.estadisticas.podios,
        accidentes: g.estadisticas.accidentes
      };
    }

    res.json({
      ...resultado.toObject(),
      cuotas_actualizadas: cuotasActualizadas
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al correr carrera', detalle: error.message });
  }
};

const simular = async (req, res) => {
  try {
    const { pista_id, galgo_ids, num_vueltas } = req.body;

    if (!pista_id || !galgo_ids || !num_vueltas) {
      return res.status(400).json({ error: 'pista_id, galgo_ids y num_vueltas son obligatorios' });
    }

    const carrera = await simularCarrera(pista_id, galgo_ids, num_vueltas);

    const galgosActualizados = await Galgo.find({ _id: { $in: galgo_ids } })
      .select('nombre cuota_actual estadisticas');

    const cuotasActualizadas = {};
    for (const g of galgosActualizados) {
      cuotasActualizadas[g._id.toString()] = {
        nombre: g.nombre,
        cuota_actual: g.cuota_actual,
        carreras_corridas: g.estadisticas.carreras_corridas,
        victorias: g.estadisticas.victorias,
        podios: g.estadisticas.podios,
        accidentes: g.estadisticas.accidentes
      };
    }

    res.status(201).json({
      ...carrera.toObject(),
      cuotas_actualizadas: cuotasActualizadas
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al simular carrera', detalle: error.message });
  }
};

const programar = async (req, res) => {
  try {
    const { pista_id, galgo_ids, num_vueltas } = req.body;

    if (!pista_id || !galgo_ids || !num_vueltas) {
      return res.status(400).json({ error: 'pista_id, galgo_ids y num_vueltas son obligatorios' });
    }

    const galgos = await Galgo.find({ _id: { $in: galgo_ids }, estado: 'activo' });
    if (galgos.length < 2) {
      return res.status(400).json({ error: 'Se necesitan al menos 2 galgos activos' });
    }

    const cuotasPreCarrera = galgos.map(g => ({
      galgo_id: g._id,
      cuota: g.cuota_actual
    }));

    const carrera = await Carrera.create({
      pista_id,
      estado: 'programada',
      num_vueltas,
      galgos_participantes: galgos.map(g => g._id),
      cuotas_pre_carrera: cuotasPreCarrera
    });

    const carreraPopulada = await Carrera.findById(carrera._id)
      .populate('pista_id', 'nombre longitud_total_m superficie')
      .populate('galgos_participantes', 'nombre raza cuota_actual estadisticas');

    const cuotas = await obtenerCuotasCarrera(galgos.map(g => g._id));

    res.status(201).json({
      carrera: carreraPopulada,
      cuotas
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al programar carrera', detalle: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const { estado, pista_id } = req.query;
    const filtro = {};

    if (estado) {
      filtro.estado = estado;
    }
    if (pista_id) {
      filtro.pista_id = pista_id;
    }

    const carreras = await Carrera.find(filtro)
      .populate('pista_id', 'nombre')
      .populate('ganador', 'nombre')
      .sort({ fecha: -1 });

    res.json(carreras);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener carreras', detalle: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const carrera = await Carrera.findById(req.params.id)
      .populate('pista_id')
      .populate('galgos_participantes', 'nombre raza cuota_actual estadisticas caracteristicas')
      .populate('ganador', 'nombre raza cuota_actual estadisticas')
      .populate('resultados.galgo_id', 'nombre raza');

    if (!carrera) {
      return res.status(404).json({ error: 'Carrera no encontrada' });
    }

    res.json(carrera);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener carrera', detalle: error.message });
  }
};

const getVueltas = async (req, res) => {
  try {
    const { galgo_id } = req.query;
    const filtro = { carrera_id: req.params.id };

    if (galgo_id) {
      filtro.galgo_id = galgo_id;
    }

    const vueltas = await Resultado.find(filtro)
      .populate('galgo_id', 'nombre raza')
      .sort({ numero_vuelta: 1 });

    res.json(vueltas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener vueltas', detalle: error.message });
  }
};

module.exports = { simular, programar, getAll, getById, getVueltas, prepararJornada, correrCarrera };

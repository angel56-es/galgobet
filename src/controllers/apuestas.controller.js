const Apuesta = require('../models/Apuesta');
const { realizarApuesta } = require('../services/apuestas.service');

const apostar = async (req, res) => {
  try {
    const { carrera_id, galgo_id, cantidad, tipo_apuesta } = req.body;

    if (!carrera_id || !galgo_id || !cantidad || !tipo_apuesta) {
      return res.status(400).json({ error: 'carrera_id, galgo_id, cantidad y tipo_apuesta son obligatorios' });
    }

    const resultado = await realizarApuesta(
      req.usuario.id,
      carrera_id,
      galgo_id,
      cantidad,
      tipo_apuesta
    );

    res.status(201).json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getMisApuestas = async (req, res) => {
  try {
    const { estado, tipo } = req.query;
    const filtro = { usuario_id: req.usuario.id };

    if (estado) {
      filtro.estado = estado;
    }
    if (tipo) {
      filtro.tipo_apuesta = tipo;
    }

    const apuestas = await Apuesta.find(filtro)
      .populate({ path: 'carrera_id', select: 'fecha estado pista_id ganador', populate: { path: 'pista_id', select: 'nombre' } })
      .populate('galgo_id', 'nombre raza cuota_actual')
      .sort({ fecha_apuesta: -1 });

    res.json(apuestas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener apuestas', detalle: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const apuesta = await Apuesta.findById(req.params.id)
      .populate('carrera_id', 'fecha estado pista_id ganador resultados')
      .populate('galgo_id', 'nombre raza cuota_actual');

    if (!apuesta) {
      return res.status(404).json({ error: 'Apuesta no encontrada' });
    }

    if (apuesta.usuario_id.toString() !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta apuesta' });
    }

    res.json(apuesta);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener apuesta', detalle: error.message });
  }
};

module.exports = { apostar, getMisApuestas, getById };

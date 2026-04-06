const Pista = require('../models/Pista');

const getAll = async (req, res) => {
  try {
    const pistas = await Pista.find()
      .populate({
        path: 'galgos_asignados',
        select: 'nombre raza entrenador cuota_actual caracteristicas estadisticas estado'
      })
      .sort({ nombre: 1 });
    res.json(pistas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pistas', detalle: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const pista = await Pista.findById(req.params.id)
      .populate({
        path: 'galgos_asignados',
        select: 'nombre raza entrenador cuota_actual caracteristicas estadisticas estado'
      })
      .populate('record_galgo', 'nombre raza');
    if (!pista) {
      return res.status(404).json({ error: 'Pista no encontrada' });
    }
    res.json(pista);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pista', detalle: error.message });
  }
};

const create = async (req, res) => {
  try {
    const pista = await Pista.create(req.body);
    res.status(201).json(pista);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear pista', detalle: error.message });
  }
};

module.exports = { getAll, getById, create };

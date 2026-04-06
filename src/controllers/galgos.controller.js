const Galgo = require('../models/Galgo');

const getAll = async (req, res) => {
  try {
    const { estado, orden } = req.query;
    const filtro = {};

    if (estado) {
      filtro.estado = estado;
    }

    let query = Galgo.find(filtro);

    if (orden === 'cuota') {
      query = query.sort({ cuota_actual: 1 });
    } else if (orden === 'victorias') {
      query = query.sort({ 'estadisticas.victorias': -1 });
    } else {
      query = query.sort({ nombre: 1 });
    }

    const galgos = await query;
    res.json(galgos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener galgos', detalle: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const galgo = await Galgo.findById(req.params.id);
    if (!galgo) {
      return res.status(404).json({ error: 'Galgo no encontrado' });
    }
    res.json(galgo);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener galgo', detalle: error.message });
  }
};

const create = async (req, res) => {
  try {
    const galgo = await Galgo.create(req.body);
    res.status(201).json(galgo);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear galgo', detalle: error.message });
  }
};

const update = async (req, res) => {
  try {
    const galgo = await Galgo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!galgo) {
      return res.status(404).json({ error: 'Galgo no encontrado' });
    }
    res.json(galgo);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar galgo', detalle: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const galgo = await Galgo.findByIdAndDelete(req.params.id);
    if (!galgo) {
      return res.status(404).json({ error: 'Galgo no encontrado' });
    }
    res.json({ mensaje: 'Galgo eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar galgo', detalle: error.message });
  }
};

module.exports = { getAll, getById, create, update, remove };

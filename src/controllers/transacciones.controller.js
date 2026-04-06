const Transaccion = require('../models/Transaccion');

const getMisMovimientos = async (req, res) => {
  try {
    const { tipo } = req.query;
    const filtro = { usuario_id: req.usuario.id };

    if (tipo) {
      filtro.tipo = tipo;
    }

    const transacciones = await Transaccion.find(filtro)
      .populate('referencia_apuesta')
      .sort({ fecha: -1 });

    res.json(transacciones);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener movimientos', detalle: error.message });
  }
};

module.exports = { getMisMovimientos };

const mongoose = require('mongoose');

const transaccionSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  tipo: {
    type: String,
    enum: ['deposito_inicial', 'apuesta', 'ganancia', 'devolucion'],
    required: true
  },
  cantidad: {
    type: Number,
    required: true
  },
  saldo_anterior: {
    type: Number,
    required: true
  },
  saldo_posterior: {
    type: Number,
    required: true
  },
  descripcion: {
    type: String,
    default: ''
  },
  referencia_apuesta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Apuesta',
    default: null
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaccion', transaccionSchema);

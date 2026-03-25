const mongoose = require('mongoose');

const apuestaSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  carrera_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrera',
    required: true
  },
  galgo_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Galgo',
    required: true
  },
  cantidad_apostada: {
    type: Number,
    required: true,
    min: 1
  },
  cuota_momento: {
    type: Number,
    required: true
  },
  tipo_apuesta: {
    type: String,
    enum: ['ganador', 'podio', 'ultimo'],
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'ganada', 'perdida'],
    default: 'pendiente'
  },
  ganancia_potencial: {
    type: Number,
    required: true
  },
  ganancia_real: {
    type: Number,
    default: 0
  },
  fecha_apuesta: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Apuesta', apuestaSchema);

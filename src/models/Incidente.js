const mongoose = require('mongoose');

const incidenteSchema = new mongoose.Schema({
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
  numero_vuelta: {
    type: Number,
    required: true
  },
  tramo_numero: {
    type: Number,
    required: true
  },
  tramo_tipo: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['caida', 'lesion', 'salida_pista', 'colision', 'tropiezo'],
    required: true
  },
  causa: {
    type: String,
    enum: ['fatiga', 'exceso_velocidad', 'obstaculo', 'colision_galgo', 'mal_apoyo', 'distraccion'],
    required: true
  },
  gravedad: {
    type: String,
    enum: ['leve', 'media', 'grave'],
    required: true
  },
  tiempo_penalizacion_ms: {
    type: Number,
    required: true
  },
  descripcion: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Incidente', incidenteSchema);

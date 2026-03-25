const mongoose = require('mongoose');

const galgoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  edad: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  peso_kg: {
    type: Number,
    required: true,
    min: 20,
    max: 40
  },
  raza: {
    type: String,
    required: true
  },
  entrenador: {
    type: String,
    required: true
  },
  estado: {
    type: String,
    enum: ['activo', 'lesionado', 'retirado'],
    default: 'activo'
  },
  pista_asignada: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pista',
    default: null
  },
  caracteristicas: {
    velocidad_base: { type: Number, required: true, min: 1, max: 100 },
    resistencia: { type: Number, required: true, min: 1, max: 100 },
    aceleracion: { type: Number, required: true, min: 1, max: 100 },
    experiencia: { type: Number, min: 1, max: 100, default: 50 }
  },
  estadisticas: {
    carreras_corridas: { type: Number, default: 0 },
    victorias: { type: Number, default: 0 },
    podios: { type: Number, default: 0 },
    accidentes: { type: Number, default: 0 },
    mejor_tiempo_ms: { type: Number, default: null },
    puntos_totales: { type: Number, default: 0 }
  },
  cuota_actual: {
    type: Number,
    default: 3.00
  }
}, { timestamps: true });

module.exports = mongoose.model('Galgo', galgoSchema);

const mongoose = require('mongoose');

const tiempoTramoSchema = new mongoose.Schema({
  tramo_numero: { type: Number, required: true },
  tramo_tipo: { type: String, required: true },
  tiempo_ms: { type: Number, required: true },
  velocidad_media: { type: Number, required: true },
  dificultad_tramo: { type: Number, required: true },
  hubo_incidente: { type: Boolean, default: false }
}, { _id: false });

const resultadoSchema = new mongoose.Schema({
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
  tiempo_total_ms: {
    type: Number,
    required: true
  },
  tiempos_tramos: [tiempoTramoSchema],
  es_mejor_vuelta: {
    type: Boolean,
    default: false
  },
  hubo_incidente: {
    type: Boolean,
    default: false
  },
  fatiga_acumulada: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Resultado', resultadoSchema);

const mongoose = require('mongoose');

const clasificacionSchema = new mongoose.Schema({
  posicion: { type: Number, required: true },
  galgo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Galgo', required: true },
  puntos: { type: Number, default: 0 },
  victorias: { type: Number, default: 0 },
  podios: { type: Number, default: 0 },
  carreras_disputadas: { type: Number, default: 0 },
  mejor_tiempo_ms: { type: Number, default: null },
  accidentes: { type: Number, default: 0 }
}, { _id: false });

const rankingSchema = new mongoose.Schema({
  temporada: {
    type: String,
    required: true,
    unique: true
  },
  clasificacion: [clasificacionSchema],
  ultima_actualizacion: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Ranking', rankingSchema);

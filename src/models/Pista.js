const mongoose = require('mongoose');

const tramoSchema = new mongoose.Schema({
  numero: { type: Number, required: true },
  nombre: { type: String, required: true },
  tipo: {
    type: String,
    enum: ['recta', 'curva_suave', 'curva_cerrada', 'obstaculo', 'salto', 'chicane'],
    required: true
  },
  longitud_m: { type: Number, required: true, min: 10 },
  dificultad: { type: Number, required: true, min: 1, max: 10 },
  riesgo_lesion: { type: Number, required: true, min: 0, max: 1 }
}, { _id: false });

const pistaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  descripcion: {
    type: String,
    default: ''
  },
  longitud_total_m: {
    type: Number,
    required: true
  },
  superficie: {
    type: String,
    enum: ['arena', 'hierba', 'sintetico'],
    default: 'arena'
  },
  tramos: {
    type: [tramoSchema],
    validate: {
      validator: function (v) {
        return v.length >= 3;
      },
      message: 'La pista debe tener al menos 3 tramos'
    }
  },
  num_tramos: {
    type: Number,
    required: true
  },
  galgos_asignados: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Galgo'
  }],
  record_tiempo_ms: {
    type: Number,
    default: null
  },
  record_galgo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Galgo',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Pista', pistaSchema);

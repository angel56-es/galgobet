const mongoose = require('mongoose');

const resultadoCarreraSchema = new mongoose.Schema({
  galgo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Galgo', required: true },
  posicion_final: { type: Number, required: true },
  tiempo_total_ms: { type: Number, required: true },
  mejor_vuelta_ms: { type: Number, required: true },
  num_incidentes: { type: Number, default: 0 },
  puntos_obtenidos: { type: Number, default: 0 }
}, { _id: false });

const carreraSchema = new mongoose.Schema({
  pista_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pista',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['programada', 'en_curso', 'finalizada'],
    default: 'programada'
  },
  num_vueltas: {
    type: Number,
    required: true,
    min: 1
  },
  galgos_participantes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Galgo'
  }],
  resultados: [resultadoCarreraSchema],
  ganador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Galgo',
    default: null
  },
  cuotas_pre_carrera: [{
    galgo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Galgo' },
    cuota: { type: Number }
  }],
  vuelta_rapida: {
    galgo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Galgo' },
    tiempo_ms: { type: Number },
    numero_vuelta: { type: Number }
  }
}, { timestamps: true });

module.exports = mongoose.model('Carrera', carreraSchema);

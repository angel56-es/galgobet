const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  creditos: {
    type: Number,
    default: 500
  },
  fecha_registro: {
    type: Date,
    default: Date.now
  },
  rol: {
    type: String,
    enum: ['usuario', 'admin'],
    default: 'usuario'
  },
  estadisticas: {
    total_apostado: { type: Number, default: 0 },
    total_ganado: { type: Number, default: 0 },
    apuestas_realizadas: { type: Number, default: 0 },
    apuestas_ganadas: { type: Number, default: 0 },
    apuestas_perdidas: { type: Number, default: 0 },
    mejor_ganancia: { type: Number, default: 0 }
  }
}, { timestamps: true });

usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

usuarioSchema.methods.compararPassword = async function (candidata) {
  return await bcrypt.compare(candidata, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);

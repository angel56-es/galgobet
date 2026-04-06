const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Transaccion = require('../models/Transaccion');

const register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y password son obligatorios' });
    }

    const existente = await Usuario.findOne({ email });
    if (existente) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const creditosIniciales = parseInt(process.env.CREDITOS_INICIALES) || 500;

    const usuario = await Usuario.create({
      nombre,
      email,
      password,
      creditos: creditosIniciales
    });

    await Transaccion.create({
      usuario_id: usuario._id,
      tipo: 'deposito_inicial',
      cantidad: creditosIniciales,
      saldo_anterior: 0,
      saldo_posterior: creditosIniciales,
      descripcion: 'Depósito inicial de bienvenida'
    });

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        creditos: usuario.creditos
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario', detalle: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios' });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        creditos: usuario.creditos
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al hacer login', detalle: error.message });
  }
};

const getPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-password');
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      creditos: usuario.creditos,
      fecha_registro: usuario.fecha_registro,
      rol: usuario.rol,
      estadisticas: {
        total_apostado: usuario.estadisticas.total_apostado,
        total_ganado: usuario.estadisticas.total_ganado,
        apuestas_realizadas: usuario.estadisticas.apuestas_realizadas,
        apuestas_ganadas: usuario.estadisticas.apuestas_ganadas,
        apuestas_perdidas: usuario.estadisticas.apuestas_perdidas,
        mejor_ganancia: usuario.estadisticas.mejor_ganancia
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil', detalle: error.message });
  }
};

module.exports = { register, login, getPerfil };

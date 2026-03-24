require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const conectarDB = require('./config/database');

const authRoutes = require('./routes/auth.routes');
const galgosRoutes = require('./routes/galgos.routes');
const pistasRoutes = require('./routes/pistas.routes');
const carrerasRoutes = require('./routes/carreras.routes');
const apuestasRoutes = require('./routes/apuestas.routes');
const rankingsRoutes = require('./routes/rankings.routes');
const incidentesRoutes = require('./routes/incidentes.routes');
const transaccionesRoutes = require('./routes/transacciones.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/galgos', galgosRoutes);
app.use('/api/pistas', pistasRoutes);
app.use('/api/carreras', carrerasRoutes);
app.use('/api/apuestas', apuestasRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use('/api/incidentes', incidentesRoutes);
app.use('/api/transacciones', transaccionesRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
});

const iniciar = async () => {
  await conectarDB();
  app.listen(PORT, () => {
    console.log(`Servidor GalgoBet corriendo en puerto ${PORT}`);
  });
};

iniciar();

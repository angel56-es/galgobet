require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Galgo = require('../models/Galgo');
const Pista = require('../models/Pista');
const Carrera = require('../models/Carrera');
const Resultado = require('../models/Resultado');
const Incidente = require('../models/Incidente');
const Apuesta = require('../models/Apuesta');
const Transaccion = require('../models/Transaccion');
const Ranking = require('../models/Ranking');
const { simularCarrera } = require('../services/simulacion.service');
const { recalcularCuotas } = require('../services/cuotas.service');

const ASIGNACION_PISTAS = {
  'Canódromo de Madrid': ['Rayo', 'Centella', 'Trueno', 'Relámpago'],
  'Canódromo de Barcelona': ['Veloz', 'Sombra', 'Tormenta', 'Cometa'],
  'Canódromo de Sevilla': ['Flecha', 'Meteoro', 'Tornado', 'Huracán']
};

const elegirAleatorio = (arr) => arr[Math.floor(Math.random() * arr.length)];

const elegirNAleatorios = (arr, n) => {
  const copia = [...arr];
  const resultado = [];
  for (let i = 0; i < n && copia.length > 0; i++) {
    const idx = Math.floor(Math.random() * copia.length);
    resultado.push(copia.splice(idx, 1)[0]);
  }
  return resultado;
};

const seed = async () => {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    console.log('\nLimpiando colecciones...');
    await Usuario.deleteMany({});
    await Galgo.deleteMany({});
    await Pista.deleteMany({});
    await Carrera.deleteMany({});
    await Resultado.deleteMany({});
    await Incidente.deleteMany({});
    await Apuesta.deleteMany({});
    await Transaccion.deleteMany({});
    await Ranking.deleteMany({});
    console.log('Colecciones limpiadas');

    console.log('\n--- Creando Pistas ---');

    const pistasData = [
      {
        nombre: 'Canódromo de Madrid',
        descripcion: 'Pista profesional de arena con curvas técnicas y una recta de meta espectacular',
        longitud_total_m: 780,
        superficie: 'arena',
        num_tramos: 8,
        tramos: [
          { numero: 1, nombre: 'Recta de Salida', tipo: 'recta', longitud_m: 120, dificultad: 2, riesgo_lesion: 0.02 },
          { numero: 2, nombre: 'Curva del Retiro', tipo: 'curva_suave', longitud_m: 80, dificultad: 4, riesgo_lesion: 0.05 },
          { numero: 3, nombre: 'Chicane de Cibeles', tipo: 'chicane', longitud_m: 60, dificultad: 7, riesgo_lesion: 0.15 },
          { numero: 4, nombre: 'Recta de Gran Vía', tipo: 'recta', longitud_m: 150, dificultad: 2, riesgo_lesion: 0.01 },
          { numero: 5, nombre: 'Curva Cerrada del Sol', tipo: 'curva_cerrada', longitud_m: 70, dificultad: 8, riesgo_lesion: 0.25 },
          { numero: 6, nombre: 'Obstáculo de Atocha', tipo: 'obstaculo', longitud_m: 50, dificultad: 9, riesgo_lesion: 0.35 },
          { numero: 7, nombre: 'Curva de Bernabéu', tipo: 'curva_suave', longitud_m: 100, dificultad: 5, riesgo_lesion: 0.08 },
          { numero: 8, nombre: 'Recta de Meta', tipo: 'recta', longitud_m: 150, dificultad: 1, riesgo_lesion: 0.01 }
        ]
      },
      {
        nombre: 'Canódromo de Barcelona',
        descripcion: 'Circuito moderno sobre hierba con curvas fluidas y un salto desafiante',
        longitud_total_m: 650,
        superficie: 'hierba',
        num_tramos: 7,
        tramos: [
          { numero: 1, nombre: 'Recta de las Ramblas', tipo: 'recta', longitud_m: 130, dificultad: 2, riesgo_lesion: 0.02 },
          { numero: 2, nombre: 'Curva de Gaudí', tipo: 'curva_suave', longitud_m: 90, dificultad: 4, riesgo_lesion: 0.06 },
          { numero: 3, nombre: 'Salto del Tibidabo', tipo: 'salto', longitud_m: 40, dificultad: 8, riesgo_lesion: 0.30 },
          { numero: 4, nombre: 'Recta Olímpica', tipo: 'recta', longitud_m: 140, dificultad: 2, riesgo_lesion: 0.01 },
          { numero: 5, nombre: 'Curva Cerrada de Montjuïc', tipo: 'curva_cerrada', longitud_m: 60, dificultad: 7, riesgo_lesion: 0.20 },
          { numero: 6, nombre: 'Obstáculo del Born', tipo: 'obstaculo', longitud_m: 50, dificultad: 8, riesgo_lesion: 0.28 },
          { numero: 7, nombre: 'Recta de Meta Camp Nou', tipo: 'recta', longitud_m: 140, dificultad: 1, riesgo_lesion: 0.01 }
        ]
      },
      {
        nombre: 'Canódromo de Sevilla',
        descripcion: 'Pista sintética con tramos variados, chicanes exigentes y un doble salto final',
        longitud_total_m: 880,
        superficie: 'sintetico',
        num_tramos: 9,
        tramos: [
          { numero: 1, nombre: 'Recta de la Giralda', tipo: 'recta', longitud_m: 110, dificultad: 2, riesgo_lesion: 0.02 },
          { numero: 2, nombre: 'Curva del Guadalquivir', tipo: 'curva_suave', longitud_m: 85, dificultad: 4, riesgo_lesion: 0.05 },
          { numero: 3, nombre: 'Chicane de Triana', tipo: 'chicane', longitud_m: 55, dificultad: 7, riesgo_lesion: 0.18 },
          { numero: 4, nombre: 'Recta del Alcázar', tipo: 'recta', longitud_m: 160, dificultad: 3, riesgo_lesion: 0.02 },
          { numero: 5, nombre: 'Curva Cerrada de la Maestranza', tipo: 'curva_cerrada', longitud_m: 65, dificultad: 8, riesgo_lesion: 0.22 },
          { numero: 6, nombre: 'Salto de la Feria', tipo: 'salto', longitud_m: 45, dificultad: 9, riesgo_lesion: 0.40 },
          { numero: 7, nombre: 'Obstáculo de los Naranjos', tipo: 'obstaculo', longitud_m: 50, dificultad: 8, riesgo_lesion: 0.30 },
          { numero: 8, nombre: 'Chicane del Betis', tipo: 'chicane', longitud_m: 60, dificultad: 6, riesgo_lesion: 0.12 },
          { numero: 9, nombre: 'Recta Final Nervión', tipo: 'recta', longitud_m: 200, dificultad: 1, riesgo_lesion: 0.01 }
        ]
      }
    ];

    const pistas = await Pista.insertMany(pistasData);
    console.log(`Creadas ${pistas.length} pistas`);
    pistas.forEach(p => console.log(`  - ${p.nombre} (${p.num_tramos} tramos, ${p.longitud_total_m}m)`));

    console.log('\n--- Creando Galgos ---');

    const galgosData = [
      {
        nombre: 'Rayo',
        edad: 3,
        peso_kg: 28,
        raza: 'Greyhound',
        entrenador: 'Carlos Martínez',
        caracteristicas: { velocidad_base: 92, resistencia: 65, aceleracion: 88, experiencia: 70 }
      },
      {
        nombre: 'Centella',
        edad: 4,
        peso_kg: 30,
        raza: 'Greyhound',
        entrenador: 'Ana López',
        caracteristicas: { velocidad_base: 88, resistencia: 80, aceleracion: 82, experiencia: 85 }
      },
      {
        nombre: 'Trueno',
        edad: 2,
        peso_kg: 26,
        raza: 'Whippet',
        entrenador: 'Miguel Fernández',
        caracteristicas: { velocidad_base: 85, resistencia: 70, aceleracion: 95, experiencia: 40 }
      },
      {
        nombre: 'Relámpago',
        edad: 5,
        peso_kg: 32,
        raza: 'Greyhound',
        entrenador: 'Carlos Martínez',
        caracteristicas: { velocidad_base: 90, resistencia: 75, aceleracion: 80, experiencia: 90 }
      },
      {
        nombre: 'Veloz',
        edad: 3,
        peso_kg: 25,
        raza: 'Galgo Español',
        entrenador: 'Laura García',
        caracteristicas: { velocidad_base: 86, resistencia: 82, aceleracion: 84, experiencia: 60 }
      },
      {
        nombre: 'Sombra',
        edad: 4,
        peso_kg: 29,
        raza: 'Galgo Español',
        entrenador: 'Laura García',
        caracteristicas: { velocidad_base: 78, resistencia: 90, aceleracion: 75, experiencia: 80 }
      },
      {
        nombre: 'Tormenta',
        edad: 3,
        peso_kg: 27,
        raza: 'Whippet',
        entrenador: 'Pedro Sánchez',
        caracteristicas: { velocidad_base: 82, resistencia: 68, aceleracion: 90, experiencia: 55 }
      },
      {
        nombre: 'Cometa',
        edad: 6,
        peso_kg: 33,
        raza: 'Greyhound',
        entrenador: 'Ana López',
        caracteristicas: { velocidad_base: 84, resistencia: 88, aceleracion: 72, experiencia: 95 }
      },
      {
        nombre: 'Flecha',
        edad: 2,
        peso_kg: 24,
        raza: 'Galgo Italiano',
        entrenador: 'Miguel Fernández',
        caracteristicas: { velocidad_base: 80, resistencia: 60, aceleracion: 92, experiencia: 35 }
      },
      {
        nombre: 'Meteoro',
        edad: 5,
        peso_kg: 31,
        raza: 'Greyhound',
        entrenador: 'Pedro Sánchez',
        caracteristicas: { velocidad_base: 87, resistencia: 78, aceleracion: 83, experiencia: 82 }
      },
      {
        nombre: 'Tornado',
        edad: 4,
        peso_kg: 34,
        raza: 'Galgo Afgano',
        entrenador: 'Carlos Martínez',
        caracteristicas: { velocidad_base: 76, resistencia: 92, aceleracion: 70, experiencia: 75 }
      },
      {
        nombre: 'Huracán',
        edad: 3,
        peso_kg: 29,
        raza: 'Greyhound',
        entrenador: 'Laura García',
        caracteristicas: { velocidad_base: 94, resistencia: 55, aceleracion: 91, experiencia: 45 }
      }
    ];

    const galgos = await Galgo.insertMany(galgosData);
    console.log(`Creados ${galgos.length} galgos`);
    galgos.forEach(g => console.log(`  - ${g.nombre} (${g.raza}) - Vel:${g.caracteristicas.velocidad_base} Res:${g.caracteristicas.resistencia} Ace:${g.caracteristicas.aceleracion}`));

    console.log('\n--- Asignando Galgos a Pistas ---');
    for (const pista of pistas) {
      const nombresGalgos = ASIGNACION_PISTAS[pista.nombre];
      if (!nombresGalgos) continue;
      const galgosDeEstaPista = galgos.filter(g => nombresGalgos.includes(g.nombre));
      const galgoIds = galgosDeEstaPista.map(g => g._id);
      await Pista.findByIdAndUpdate(pista._id, { galgos_asignados: galgoIds });
      for (const galgo of galgosDeEstaPista) {
        await Galgo.findByIdAndUpdate(galgo._id, { pista_asignada: pista._id });
      }
      console.log(`  ${pista.nombre} ← ${galgosDeEstaPista.map(g => g.nombre).join(', ')} (${galgoIds.length} galgos)`);
    }

    const pistasVerificacion = await Pista.find().select('nombre galgos_asignados');
    for (const p of pistasVerificacion) {
      console.log(`  Verificacion: ${p.nombre} tiene ${p.galgos_asignados.length} galgos asignados`);
    }

    console.log('\n--- Creando Usuarios ---');

    const usuariosData = [
      { nombre: 'Administrador', email: 'admin@galgobet.com', password: 'admin123', rol: 'admin' },
      { nombre: 'Juan Pérez', email: 'juan@test.com', password: '123456', rol: 'usuario' },
      { nombre: 'María García', email: 'maria@test.com', password: '123456', rol: 'usuario' },
      { nombre: 'Pedro López', email: 'pedro@test.com', password: '123456', rol: 'usuario' },
      { nombre: 'Ana Martínez', email: 'ana@test.com', password: '123456', rol: 'usuario' }
    ];

    const usuarios = [];
    for (const data of usuariosData) {
      const usuario = await Usuario.create(data);
      await Transaccion.create({
        usuario_id: usuario._id,
        tipo: 'deposito_inicial',
        cantidad: 500,
        saldo_anterior: 0,
        saldo_posterior: 500,
        descripcion: 'Depósito inicial de bienvenida'
      });
      usuarios.push(usuario);
    }
    console.log(`Creados ${usuarios.length} usuarios`);
    usuarios.forEach(u => console.log(`  - ${u.nombre} (${u.email}) - Rol: ${u.rol} - Créditos: ${u.creditos}`));

    console.log('\n--- Simulando 6 Carreras (2 por pista con galgos fijos) ---');

    const vueltasPorPista = { 'Canódromo de Madrid': 3, 'Canódromo de Barcelona': 3, 'Canódromo de Sevilla': 3 };
    const carrerasSimuladas = [];
    let numCarrera = 1;

    for (let ronda = 0; ronda < 2; ronda++) {
      for (const pista of pistas) {
        const nombresGalgos = ASIGNACION_PISTAS[pista.nombre];
        const galgosDeEstaPista = galgos.filter(g => nombresGalgos.includes(g.nombre));
        const numVueltas = vueltasPorPista[pista.nombre] || 3;

        console.log(`\nCarrera ${numCarrera}: ${pista.nombre} (Ronda ${ronda + 1})`);
        console.log(`  Galgos: ${galgosDeEstaPista.map(g => g.nombre).join(', ')}`);
        console.log(`  Vueltas: ${numVueltas}`);

        const carrera = await simularCarrera(
          pista._id,
          galgosDeEstaPista.map(g => g._id),
          numVueltas
        );

        carrerasSimuladas.push(carrera);

        const ganador = carrera.resultados.find(r => r.posicion_final === 1);
        const galgoGanador = await Galgo.findById(ganador.galgo_id);
        const incidentesCarrera = await Incidente.countDocuments({ carrera_id: carrera._id });

        console.log(`  Ganador: ${galgoGanador.nombre} (${ganador.tiempo_total_ms}ms)`);
        console.log(`  Incidentes: ${incidentesCarrera}`);
        console.log(`  Resultados:`);
        for (const res of carrera.resultados) {
          const g = await Galgo.findById(res.galgo_id);
          console.log(`    ${res.posicion_final}° ${g.nombre} - ${res.tiempo_total_ms}ms - ${res.puntos_obtenidos}pts`);
        }
        numCarrera++;
      }
    }

    console.log('\n--- Recalculando cuotas finales ---');
    await recalcularCuotas(galgos.map(g => g._id));
    console.log('Cuotas recalculadas para los 12 galgos');

    console.log('\n--- Programando carreras para la jornada ---');
    const galgosRefrescados = await Galgo.find();
    for (const pista of pistas) {
      const nombresGalgos = ASIGNACION_PISTAS[pista.nombre];
      if (!nombresGalgos) continue;
      const galgosDeEstaPista = galgosRefrescados.filter(g => nombresGalgos.includes(g.nombre));
      if (galgosDeEstaPista.length < 2) continue;
      const cuotasPreCarrera = galgosDeEstaPista.map(g => ({ galgo_id: g._id, cuota: g.cuota_actual }));
      const numVueltas = vueltasPorPista[pista.nombre] || 3;
      await Carrera.create({
        pista_id: pista._id,
        estado: 'programada',
        num_vueltas: numVueltas,
        galgos_participantes: galgosDeEstaPista.map(g => g._id),
        cuotas_pre_carrera: cuotasPreCarrera
      });
      console.log(`  Carrera programada: ${pista.nombre} (${galgosDeEstaPista.length} galgos, ${numVueltas} vueltas)`);
    }

    console.log('\n========================================');
    console.log('         RESUMEN DEL SEED');
    console.log('========================================');

    const conteos = {
      usuarios: await Usuario.countDocuments(),
      galgos: await Galgo.countDocuments(),
      pistas: await Pista.countDocuments(),
      carreras: await Carrera.countDocuments(),
      resultados: await Resultado.countDocuments(),
      incidentes: await Incidente.countDocuments(),
      apuestas: await Apuesta.countDocuments(),
      transacciones: await Transaccion.countDocuments(),
      rankings: await Ranking.countDocuments()
    };

    console.log('\nDocumentos por colección:');
    for (const [col, count] of Object.entries(conteos)) {
      console.log(`  ${col}: ${count}`);
    }

    console.log('\n--- Ranking Final ---');
    const temporada = new Date().getFullYear().toString();
    const ranking = await Ranking.findOne({ temporada }).populate('clasificacion.galgo_id', 'nombre raza');
    if (ranking) {
      for (const c of ranking.clasificacion) {
        console.log(`  ${c.posicion}° ${c.galgo_id.nombre} - ${c.puntos}pts (V:${c.victorias} P:${c.podios} C:${c.carreras_disputadas})`);
      }
    }

    console.log('\n--- Cuotas Actualizadas ---');
    const todosGalgos = await Galgo.find().sort({ cuota_actual: 1 });
    for (const g of todosGalgos) {
      console.log(`  ${g.nombre}: ${g.cuota_actual.toFixed(2)} (${g.estadisticas.victorias}V/${g.estadisticas.carreras_corridas}C)`);
    }

    console.log('\n========================================');
    console.log('  Seed completado exitosamente');
    console.log('========================================');

    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error en el seed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();

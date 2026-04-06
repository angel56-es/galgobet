const Pista = require('../models/Pista');
const Galgo = require('../models/Galgo');
const Carrera = require('../models/Carrera');
const Resultado = require('../models/Resultado');
const Incidente = require('../models/Incidente');
const Ranking = require('../models/Ranking');
const { recalcularCuotas } = require('./cuotas.service');
const { resolverApuestasCarrera } = require('./apuestas.service');

const PUNTOS_POSICION = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

const PENALIZACIONES = {
  caida: 5000,
  lesion: 8000,
  salida_pista: 4000,
  colision: 3000,
  tropiezo: 2000
};

const FATIGA_POR_VUELTA = 3;

const randomEntre = (min, max) => {
  return Math.random() * (max - min) + min;
};

const elegirAleatorio = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const simularTramo = (tramo, galgo, fatigaAcumulada) => {
  const carreras = galgo.estadisticas.carreras_corridas || 0;
  const victorias = galgo.estadisticas.victorias || 0;

  var pctVictorias = carreras > 0 ? victorias / carreras : 0.5;

  const factorVelocidad = galgo.caracteristicas.velocidad_base / 100;
  const factorAceleracion = galgo.caracteristicas.aceleracion / 100;
  const factorResistencia = galgo.caracteristicas.resistencia / 100;
  const factorExperiencia = galgo.caracteristicas.experiencia / 100;

  const factorCaracteristicas =
    (factorVelocidad * 0.4) +
    (factorAceleracion * 0.25) +
    (factorResistencia * 0.2) +
    (factorExperiencia * 0.15);

  const factorHistorial = 0.85 + (pctVictorias * 0.30);

  const reduccionDificultad = 1 - (tramo.dificultad / 100);
  const reduccionFatiga = 1 - (fatigaAcumulada / 100);

  const velocidadMinGalgo = 45;
  const velocidadMaxGalgo = 72;

  let velocidadCalculada = velocidadMinGalgo +
    (velocidadMaxGalgo - velocidadMinGalgo) *
    factorCaracteristicas *
    factorHistorial *
    reduccionDificultad *
    reduccionFatiga;

  const ruido = (Math.random() - 0.5) * 10;
  velocidadCalculada += ruido;

  const velocidadFinal = Math.max(Math.min(velocidadCalculada, velocidadMaxGalgo), 25);

  const velocidadMs = velocidadFinal * (1000 / 3600);
  let tiempoMs = Math.round((tramo.longitud_m / velocidadMs) * 1000);

  let huboIncidente = false;
  let incidenteData = null;

  if (tramo.dificultad >= 5) {
    let probabilidad =
      tramo.riesgo_lesion *
      (1 - factorResistencia * 0.6) *
      (1 + fatigaAcumulada / 150) *
      (1.2 - pctVictorias * 0.4);

    probabilidad = Math.max(0.01, Math.min(probabilidad, 0.60));

    if (Math.random() < probabilidad) {
      huboIncidente = true;

      const tipos = ['caida', 'tropiezo', 'salida_pista'];
      if (fatigaAcumulada > 30) tipos.push('lesion');
      const tipo = elegirAleatorio(tipos);

      const gravedades = {
        tropiezo: 'leve',
        caida: 'leve',
        salida_pista: 'media',
        lesion: 'grave',
        colision: 'media'
      };
      const gravedad = gravedades[tipo] || 'leve';

      let causa;
      if (fatigaAcumulada > 40) {
        causa = 'fatiga';
      } else if (tramo.dificultad >= 8) {
        causa = 'obstaculo';
      } else if (tramo.tipo.includes('curva')) {
        causa = 'exceso_velocidad';
      } else {
        causa = elegirAleatorio(['mal_apoyo', 'distraccion', 'exceso_velocidad']);
      }

      const penalizacion = PENALIZACIONES[tipo] || 3000;
      tiempoMs += penalizacion;

      incidenteData = {
        tipo,
        causa,
        gravedad,
        tiempo_penalizacion_ms: penalizacion,
        descripcion: galgo.nombre + ' sufrio ' + tipo.replace(/_/g, ' ') + ' en tramo ' + tramo.numero + ' (' + tramo.nombre + ') por ' + causa.replace(/_/g, ' ') + '. Gravedad: ' + gravedad,
        tramo_numero: tramo.numero,
        tramo_tipo: tramo.tipo
      };
    }
  }

  return {
    tramo_numero: tramo.numero,
    tramo_tipo: tramo.tipo,
    tiempo_ms: tiempoMs,
    velocidad_media: Math.round(velocidadFinal * 100) / 100,
    dificultad_tramo: tramo.dificultad,
    hubo_incidente: huboIncidente,
    incidenteData
  };
};

const simularVuelta = (pista, galgo, numeroVuelta, fatigaAcumulada) => {
  const tiemposTramos = [];
  const incidentes = [];
  let tiempoTotal = 0;
  let huboIncidenteVuelta = false;

  for (const tramo of pista.tramos) {
    const resultado = simularTramo(tramo, galgo, fatigaAcumulada);
    tiemposTramos.push({
      tramo_numero: resultado.tramo_numero,
      tramo_tipo: resultado.tramo_tipo,
      tiempo_ms: resultado.tiempo_ms,
      velocidad_media: resultado.velocidad_media,
      dificultad_tramo: resultado.dificultad_tramo,
      hubo_incidente: resultado.hubo_incidente
    });
    tiempoTotal += resultado.tiempo_ms;

    if (resultado.hubo_incidente && resultado.incidenteData) {
      huboIncidenteVuelta = true;
      incidentes.push(resultado.incidenteData);
    }
  }

  return {
    numero_vuelta: numeroVuelta,
    tiempo_total_ms: tiempoTotal,
    tiempos_tramos: tiemposTramos,
    hubo_incidente: huboIncidenteVuelta,
    incidentes,
    fatiga_acumulada: fatigaAcumulada
  };
};

const simularCarrera = async (pistaId, galgoIds, numVueltas, carreraProgramadaId) => {
  const pista = await Pista.findById(pistaId);
  if (!pista) {
    throw new Error('Pista no encontrada');
  }

  if (galgoIds.length < 2) {
    throw new Error('Se necesitan al menos 2 galgos para una carrera');
  }

  const galgos = await Galgo.find({ _id: { $in: galgoIds }, estado: 'activo' });
  if (galgos.length < 2) {
    throw new Error('Se necesitan al menos 2 galgos activos');
  }

  let carrera;

  if (carreraProgramadaId) {
    carrera = await Carrera.findById(carreraProgramadaId);
    if (!carrera) {
      throw new Error('Carrera programada no encontrada');
    }
    carrera.estado = 'en_curso';
    await carrera.save();
  } else {
    const cuotasPreCarrera = galgos.map(g => ({
      galgo_id: g._id,
      cuota: g.cuota_actual
    }));

    carrera = await Carrera.create({
      pista_id: pistaId,
      estado: 'en_curso',
      num_vueltas: numVueltas,
      galgos_participantes: galgos.map(g => g._id),
      cuotas_pre_carrera: cuotasPreCarrera
    });
  }

  const tiemposTotales = {};
  const incidentesTotales = {};
  const mejoresVueltas = {};
  let vueltaRapidaGlobal = { galgo_id: null, tiempo_ms: Infinity, numero_vuelta: 0 };

  for (const galgo of galgos) {
    tiemposTotales[galgo._id.toString()] = 0;
    incidentesTotales[galgo._id.toString()] = 0;
    mejoresVueltas[galgo._id.toString()] = Infinity;
  }

  for (let vuelta = 1; vuelta <= numVueltas; vuelta++) {
    for (const galgo of galgos) {
      const baseFatiga = FATIGA_POR_VUELTA * (vuelta - 1);
      const fatiga = Math.min(baseFatiga * (1 - galgo.caracteristicas.resistencia / 150), 50);

      const resultadoVuelta = simularVuelta(pista, galgo, vuelta, fatiga);

      const esMejorVuelta = resultadoVuelta.tiempo_total_ms < mejoresVueltas[galgo._id.toString()];
      if (esMejorVuelta) {
        mejoresVueltas[galgo._id.toString()] = resultadoVuelta.tiempo_total_ms;
      }

      if (resultadoVuelta.tiempo_total_ms < vueltaRapidaGlobal.tiempo_ms) {
        vueltaRapidaGlobal = {
          galgo_id: galgo._id,
          tiempo_ms: resultadoVuelta.tiempo_total_ms,
          numero_vuelta: vuelta
        };
      }

      await Resultado.create({
        carrera_id: carrera._id,
        galgo_id: galgo._id,
        numero_vuelta: vuelta,
        tiempo_total_ms: resultadoVuelta.tiempo_total_ms,
        tiempos_tramos: resultadoVuelta.tiempos_tramos,
        es_mejor_vuelta: esMejorVuelta,
        hubo_incidente: resultadoVuelta.hubo_incidente,
        fatiga_acumulada: resultadoVuelta.fatiga_acumulada
      });

      for (const inc of resultadoVuelta.incidentes) {
        await Incidente.create({
          carrera_id: carrera._id,
          galgo_id: galgo._id,
          numero_vuelta: vuelta,
          tramo_numero: inc.tramo_numero,
          tramo_tipo: inc.tramo_tipo,
          tipo: inc.tipo,
          causa: inc.causa,
          gravedad: inc.gravedad,
          tiempo_penalizacion_ms: inc.tiempo_penalizacion_ms,
          descripcion: inc.descripcion
        });
        incidentesTotales[galgo._id.toString()]++;
      }

      tiemposTotales[galgo._id.toString()] += resultadoVuelta.tiempo_total_ms;
    }
  }

  const clasificacion = galgos
    .map(galgo => ({
      galgo_id: galgo._id,
      tiempo_total_ms: tiemposTotales[galgo._id.toString()],
      mejor_vuelta_ms: mejoresVueltas[galgo._id.toString()],
      num_incidentes: incidentesTotales[galgo._id.toString()]
    }))
    .sort((a, b) => a.tiempo_total_ms - b.tiempo_total_ms);

  const resultadosCarrera = clasificacion.map((item, index) => ({
    galgo_id: item.galgo_id,
    posicion_final: index + 1,
    tiempo_total_ms: item.tiempo_total_ms,
    mejor_vuelta_ms: item.mejor_vuelta_ms,
    num_incidentes: item.num_incidentes,
    puntos_obtenidos: PUNTOS_POSICION[index] || 0
  }));

  const ganadorId = resultadosCarrera[0].galgo_id;

  carrera.estado = 'finalizada';
  carrera.resultados = resultadosCarrera;
  carrera.ganador = ganadorId;
  if (vueltaRapidaGlobal.galgo_id) {
    carrera.vuelta_rapida = vueltaRapidaGlobal;
  }
  await carrera.save();

  for (const resultado of resultadosCarrera) {
    const galgo = await Galgo.findById(resultado.galgo_id);
    if (!galgo) continue;

    galgo.estadisticas.carreras_corridas += 1;
    if (resultado.posicion_final === 1) {
      galgo.estadisticas.victorias += 1;
    }
    if (resultado.posicion_final <= 3) {
      galgo.estadisticas.podios += 1;
    }
    galgo.estadisticas.accidentes += resultado.num_incidentes;
    galgo.estadisticas.puntos_totales += resultado.puntos_obtenidos;

    if (
      galgo.estadisticas.mejor_tiempo_ms === null ||
      resultado.mejor_vuelta_ms < galgo.estadisticas.mejor_tiempo_ms
    ) {
      galgo.estadisticas.mejor_tiempo_ms = resultado.mejor_vuelta_ms;
    }

    await galgo.save();
  }

  const temporada = new Date().getFullYear().toString();
  let ranking = await Ranking.findOne({ temporada });

  if (!ranking) {
    ranking = await Ranking.create({
      temporada,
      clasificacion: []
    });
  }

  for (const resultado of resultadosCarrera) {
    const galgo = await Galgo.findById(resultado.galgo_id);
    if (!galgo) continue;

    const idx = ranking.clasificacion.findIndex(
      c => c.galgo_id.toString() === resultado.galgo_id.toString()
    );

    if (idx >= 0) {
      ranking.clasificacion[idx].puntos += resultado.puntos_obtenidos;
      ranking.clasificacion[idx].carreras_disputadas += 1;
      if (resultado.posicion_final === 1) {
        ranking.clasificacion[idx].victorias += 1;
      }
      if (resultado.posicion_final <= 3) {
        ranking.clasificacion[idx].podios += 1;
      }
      ranking.clasificacion[idx].accidentes += resultado.num_incidentes;
      if (
        ranking.clasificacion[idx].mejor_tiempo_ms === null ||
        resultado.mejor_vuelta_ms < ranking.clasificacion[idx].mejor_tiempo_ms
      ) {
        ranking.clasificacion[idx].mejor_tiempo_ms = resultado.mejor_vuelta_ms;
      }
    } else {
      ranking.clasificacion.push({
        posicion: 0,
        galgo_id: resultado.galgo_id,
        puntos: resultado.puntos_obtenidos,
        victorias: resultado.posicion_final === 1 ? 1 : 0,
        podios: resultado.posicion_final <= 3 ? 1 : 0,
        carreras_disputadas: 1,
        mejor_tiempo_ms: resultado.mejor_vuelta_ms,
        accidentes: resultado.num_incidentes
      });
    }
  }

  ranking.clasificacion.sort((a, b) => b.puntos - a.puntos);
  ranking.clasificacion.forEach((c, i) => {
    c.posicion = i + 1;
  });
  ranking.ultima_actualizacion = new Date();
  await ranking.save();

  await recalcularCuotas(galgos.map(g => g._id));

  try {
    await resolverApuestasCarrera(carrera._id);
  } catch (err) {
    // sin apuestas pendientes
  }

  const carreraCompleta = await Carrera.findById(carrera._id)
    .populate('pista_id', 'nombre longitud_total_m superficie num_tramos')
    .populate('galgos_participantes', 'nombre raza cuota_actual')
    .populate('ganador', 'nombre raza cuota_actual estadisticas')
    .populate('resultados.galgo_id', 'nombre raza');

  return carreraCompleta;
};

module.exports = { simularCarrera, simularVuelta, simularTramo };

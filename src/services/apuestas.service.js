const Usuario = require('../models/Usuario');
const Carrera = require('../models/Carrera');
const Galgo = require('../models/Galgo');
const Apuesta = require('../models/Apuesta');
const Transaccion = require('../models/Transaccion');

const realizarApuesta = async (usuarioId, carreraId, galgoId, cantidad, tipoApuesta) => {
  const usuario = await Usuario.findById(usuarioId);
  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  const carrera = await Carrera.findById(carreraId);
  if (!carrera) {
    throw new Error('Carrera no encontrada');
  }
  if (carrera.estado !== 'programada') {
    throw new Error('Solo se puede apostar en carreras programadas');
  }

  const galgo = await Galgo.findById(galgoId);
  if (!galgo) {
    throw new Error('Galgo no encontrado');
  }

  const participaEnCarrera = carrera.galgos_participantes.some(
    id => id.toString() === galgoId.toString()
  );
  if (!participaEnCarrera) {
    throw new Error('El galgo no participa en esta carrera');
  }

  if (cantidad < 1) {
    throw new Error('La cantidad mínima de apuesta es 1 crédito');
  }
  if (cantidad > usuario.creditos) {
    throw new Error('Saldo insuficiente');
  }

  const cuota = galgo.cuota_actual;
  let gananciaPotencial;

  if (tipoApuesta === 'ganador') {
    gananciaPotencial = cantidad * cuota;
  } else if (tipoApuesta === 'podio') {
    gananciaPotencial = cantidad * (cuota * 0.4);
  } else if (tipoApuesta === 'ultimo') {
    gananciaPotencial = cantidad * (cuota * 0.6);
  } else {
    throw new Error('Tipo de apuesta no válido');
  }

  gananciaPotencial = Math.round(gananciaPotencial * 100) / 100;

  const apuesta = await Apuesta.create({
    usuario_id: usuarioId,
    carrera_id: carreraId,
    galgo_id: galgoId,
    cantidad_apostada: cantidad,
    cuota_momento: cuota,
    tipo_apuesta: tipoApuesta,
    ganancia_potencial: gananciaPotencial
  });

  const saldoAnterior = usuario.creditos;
  usuario.creditos -= cantidad;
  usuario.estadisticas.total_apostado += cantidad;
  usuario.estadisticas.apuestas_realizadas += 1;
  await usuario.save();

  await Transaccion.create({
    usuario_id: usuarioId,
    tipo: 'apuesta',
    cantidad: -cantidad,
    saldo_anterior: saldoAnterior,
    saldo_posterior: usuario.creditos,
    descripcion: `Apuesta tipo ${tipoApuesta} en carrera`,
    referencia_apuesta: apuesta._id
  });

  return {
    apuesta,
    usuario: {
      id: usuario._id,
      nombre: usuario.nombre,
      creditos: usuario.creditos
    }
  };
};

const resolverApuestasCarrera = async (carreraId) => {
  const carrera = await Carrera.findById(carreraId);
  if (!carrera || carrera.estado !== 'finalizada') {
    throw new Error('La carrera no está finalizada');
  }

  const apuestasPendientes = await Apuesta.find({
    carrera_id: carreraId,
    estado: 'pendiente'
  });

  let totalApuestas = apuestasPendientes.length;
  let ganadas = 0;
  let perdidas = 0;
  let totalPagado = 0;

  for (const apuesta of apuestasPendientes) {
    const resultadoGalgo = carrera.resultados.find(
      r => r.galgo_id.toString() === apuesta.galgo_id.toString()
    );

    if (!resultadoGalgo) {
      apuesta.estado = 'perdida';
      apuesta.ganancia_real = 0;
      await apuesta.save();
      perdidas++;
      continue;
    }

    let gano = false;

    if (apuesta.tipo_apuesta === 'ganador') {
      gano = resultadoGalgo.posicion_final === 1;
    } else if (apuesta.tipo_apuesta === 'podio') {
      gano = resultadoGalgo.posicion_final <= 3;
    } else if (apuesta.tipo_apuesta === 'ultimo') {
      const ultimaPosicion = carrera.resultados.length;
      gano = resultadoGalgo.posicion_final === ultimaPosicion;
    }

    const usuario = await Usuario.findById(apuesta.usuario_id);

    if (gano) {
      apuesta.estado = 'ganada';
      apuesta.ganancia_real = apuesta.ganancia_potencial;
      ganadas++;
      totalPagado += apuesta.ganancia_potencial;

      if (usuario) {
        const saldoAnterior = usuario.creditos;
        usuario.creditos += apuesta.ganancia_potencial;
        usuario.estadisticas.total_ganado += apuesta.ganancia_potencial;
        usuario.estadisticas.apuestas_ganadas += 1;

        if (apuesta.ganancia_potencial > usuario.estadisticas.mejor_ganancia) {
          usuario.estadisticas.mejor_ganancia = apuesta.ganancia_potencial;
        }

        await usuario.save();

        await Transaccion.create({
          usuario_id: usuario._id,
          tipo: 'ganancia',
          cantidad: apuesta.ganancia_potencial,
          saldo_anterior: saldoAnterior,
          saldo_posterior: usuario.creditos,
          descripcion: `Ganancia por apuesta tipo ${apuesta.tipo_apuesta}`,
          referencia_apuesta: apuesta._id
        });
      }
    } else {
      apuesta.estado = 'perdida';
      apuesta.ganancia_real = 0;
      perdidas++;

      if (usuario) {
        usuario.estadisticas.apuestas_perdidas += 1;
        await usuario.save();
      }
    }

    await apuesta.save();
  }

  return {
    total_apuestas: totalApuestas,
    ganadas,
    perdidas,
    total_pagado: Math.round(totalPagado * 100) / 100
  };
};

module.exports = { realizarApuesta, resolverApuestasCarrera };

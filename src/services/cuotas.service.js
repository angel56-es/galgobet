const Galgo = require('../models/Galgo');

const calcularCuota = (galgo) => {
  const stats = galgo.estadisticas;
  const carac = galgo.caracteristicas;
  const carreras = stats.carreras_corridas || 0;
  const victorias = stats.victorias || 0;
  const podios = stats.podios || 0;

  const vel = (carac.velocidad_base || 50) / 100;
  const res = (carac.resistencia || 50) / 100;
  const ace = (carac.aceleracion || 50) / 100;
  const exp = (carac.experiencia || 50) / 100;
  const potencialBase = (vel * 0.4) + (ace * 0.25) + (res * 0.2) + (exp * 0.15);

  let probabilidad;

  if (carreras === 0) {
    probabilidad = potencialBase * 0.3;
  } else if (carreras <= 2) {
    const winRate = victorias / carreras;
    const podioRate = podios / carreras;
    const rendimiento = (winRate * 0.6) + (podioRate * 0.3) + 0.1;
    probabilidad = (potencialBase * 0.4 + rendimiento * 0.6) * 0.5;
  } else {
    const winRate = victorias / carreras;
    const podioRate = podios / carreras;
    const rendimiento = (winRate * 0.6) + (podioRate * 0.3) + 0.1;
    const pesoHistorial = Math.min(carreras / 10, 0.85);
    const pesoCaract = 1 - pesoHistorial;
    probabilidad = (potencialBase * pesoCaract + rendimiento * pesoHistorial) * 0.5;
  }

  probabilidad = Math.max(probabilidad, 0.04);
  probabilidad = Math.min(probabilidad, 0.85);

  let cuota = 1 / probabilidad;
  cuota = Math.max(cuota, 1.10);
  cuota = Math.min(cuota, 20.00);
  cuota = Math.round(cuota * 100) / 100;

  return cuota;
};

const recalcularCuotas = async (galgoIds) => {
  const resultados = [];

  for (const galgoId of galgoIds) {
    const galgo = await Galgo.findById(galgoId);
    if (!galgo) continue;

    const cuotaAnterior = galgo.cuota_actual;
    const cuotaNueva = calcularCuota(galgo);

    galgo.cuota_actual = cuotaNueva;
    await galgo.save();

    resultados.push({
      galgo_id: galgo._id,
      nombre: galgo.nombre,
      cuota_anterior: cuotaAnterior,
      cuota_nueva: cuotaNueva
    });
  }

  return resultados;
};

const obtenerCuotasCarrera = async (galgoIds) => {
  const galgos = await Galgo.find({ _id: { $in: galgoIds } });

  return galgos.map(galgo => ({
    galgo_id: galgo._id,
    nombre: galgo.nombre,
    cuota_actual: galgo.cuota_actual,
    estadisticas: galgo.estadisticas
  }));
};

module.exports = { calcularCuota, recalcularCuotas, obtenerCuotasCarrera };

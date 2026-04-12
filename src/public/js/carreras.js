var pistasData = [];
var pistasDataMap = {};
var resultadosPendientes = null;

async function cargarCarreras() {
  var contenido = document.getElementById('contenido-principal');
  contenido.innerHTML = '<div class="spinner-container"><div class="spinner"></div><div class="loading-text">Cargando canodromos...</div></div>';

  try {
    var pistas = await ApiService.getPistas();
    pistasData = pistas;

    var carrerasPorPista = {};
    if (!modoSinApuesta) {
      try {
        var jornada = await ApiService.prepararJornada();
        var carrerasProgr = jornada.carreras || [];
        for (var c = 0; c < carrerasProgr.length; c++) {
          var carr = carrerasProgr[c];
          var pid = carr.pista_id ? (typeof carr.pista_id === 'object' ? carr.pista_id._id : carr.pista_id) : '';
          carrerasPorPista[pid] = carr;
        }
      } catch (e) { /* no pasa nada */ }
    }

    pistasDataMap = {};
    for (var i = 0; i < pistas.length; i++) {
      var p = pistas[i];
      var galgos = p.galgos_asignados || [];
      pistasDataMap[p._id] = {
        nombre: p.nombre,
        galgoIds: galgos.map(function (g) { return g._id; }),
        carreraId: carrerasPorPista[p._id] ? carrerasPorPista[p._id]._id : null
      };
    }

    var numApuestas = 0;
    if (!modoSinApuesta) {
      try {
        var pendientes = await ApiService.getMisApuestas({ estado: 'pendiente' });
        numApuestas = pendientes.length;
      } catch (e) { numApuestas = 0; }
    }

    var historial = [];
    try {
      historial = await ApiService.getCarreras({ estado: 'finalizada' });
    } catch (e) { historial = []; }

    var html = '<h2 class="section-title">&#127937; Carreras</h2>';

    if (modoSinApuesta) {
      html += '<div class="banner-modo banner-espectador">&#127937; Modo espectador - Las carreras no afectan a tu saldo</div>';
    } else if (numApuestas > 0) {
      html += '<div class="banner-modo banner-apuestas">&#128176; Tienes ' + numApuestas + ' apuesta(s) activa(s) - &#161;Buena suerte!</div>';
    } else {
      html += '<div class="banner-modo banner-resueltas">&#9989; Tus apuestas han sido resueltas - Simula otra carrera o ve a apostar de nuevo</div>';
    }

    for (var j = 0; j < pistas.length; j++) {
      html += renderizarPistaCard(pistas[j]);
    }

    var hayGalgosSuficientes = true;
    for (var k = 0; k < pistas.length; k++) {
      if ((pistas[k].galgos_asignados || []).length < 2) {
        hayGalgosSuficientes = false;
        break;
      }
    }

    if (pistas.length >= 3 && hayGalgosSuficientes) {
      html += '<div class="boton-correr-container">';
      html += '<button class="btn-correr-todas" id="btn-correr-todas" onclick="correrTodasLasCarreras()">';
      html += '&#127937;&#127937;&#127937; CORRER LAS 3 CARRERAS &#127937;&#127937;&#127937;';
      html += '</button>';
      html += '<p class="btn-correr-subtexto">Se simularan 3 vueltas en cada canodromo | 12 galgos correran simultaneamente</p>';
      html += '</div>';
    }

    html += '<div class="card mt-2">';
    html += '<div class="card-header">&#9472;&#9472; HISTORIAL DE CARRERAS ANTERIORES &#9472;&#9472;</div>';
    html += renderizarHistorial(historial);
    html += '</div>';

    contenido.innerHTML = html;

  } catch (error) {
    contenido.innerHTML = '<div class="card card-empty"><p>Error al cargar carreras: ' + error.message + '</p></div>';
  }
}

function renderizarPistaCard(pista) {
  var galgos = pista.galgos_asignados || [];
  var nombre = pista.nombre || 'Pista';
  var superficie = pista.superficie || '—';
  var tramos = pista.num_tramos || 0;
  var longitud = pista.longitud_total_m || 0;

  var html = '<div class="card pista-card">';
  html += '<div class="card-header">';
  html += '<span>&#127967;&#65039; ' + nombre + '</span>';
  html += '<span class="badge badge-info" style="margin-left:auto">&#128205; ' + superficie + ' | ' + tramos + ' tramos | ' + longitud + 'm</span>';
  html += '</div>';
  html += '<div class="card-body">';
  html += '<p class="text-muted" style="margin-bottom:8px">&#128260; Vueltas: <strong>3</strong></p>';

  if (galgos.length === 0) {
    html += '<p class="text-muted">No hay galgos asignados a esta pista.</p>';
  } else {
    html += '<div class="galgo-seccion-titulo" style="margin-bottom:10px">&#9472;&#9472; GALGOS PARTICIPANTES &#9472;&#9472;</div>';
    for (var i = 0; i < galgos.length; i++) {
      html += renderizarGalgoEnCard(galgos[i]);
    }
  }

  html += '</div></div>';
  return html;
}

function renderizarGalgoEnCard(galgo) {
  if (!galgo || !galgo.nombre) return '';

  var carreras = (galgo.estadisticas && galgo.estadisticas.carreras_corridas) || 0;
  var victorias = (galgo.estadisticas && galgo.estadisticas.victorias) || 0;
  var podios = (galgo.estadisticas && galgo.estadisticas.podios) || 0;
  var accidentes = (galgo.estadisticas && galgo.estadisticas.accidentes) || 0;
  var puntos = (galgo.estadisticas && galgo.estadisticas.puntos_totales) || 0;

  var pctVictorias = carreras > 0 ? Math.round((victorias / carreras) * 100) : 0;
  var pctPodios = carreras > 0 ? Math.round((podios / carreras) * 100) : 0;

  var colorVictorias = pctVictorias >= 60 ? 'high' : (pctVictorias >= 30 ? 'medium' : 'low');
  var colorPodios = pctPodios >= 60 ? 'high' : (pctPodios >= 30 ? 'medium' : 'low');

  var cuota = (galgo.cuota_actual || 3).toFixed(2);
  var vel = (galgo.caracteristicas && galgo.caracteristicas.velocidad_base) || 0;
  var res = (galgo.caracteristicas && galgo.caracteristicas.resistencia) || 0;
  var ace = (galgo.caracteristicas && galgo.caracteristicas.aceleracion) || 0;
  var exp = (galgo.caracteristicas && galgo.caracteristicas.experiencia) || 0;
  var entrenador = galgo.entrenador || '—';

  var html = '<div class="galgo-stats-card">';

  html += '<div class="galgo-header-row">';
  html += '<div class="galgo-nombre-section">';
  html += '<span class="galgo-emoji">&#128021;</span>';
  html += '<span class="galgo-nombre">' + galgo.nombre + '</span>';
  html += '</div>';
  html += '<div class="galgo-cuota-badge">&#11088; ' + cuota + '</div>';
  html += '</div>';

  html += '<div class="galgo-raza">' + (galgo.raza || '') + ' | Entrenador: ' + entrenador + '</div>';

  html += '<div class="galgo-seccion">';
  html += '<div class="galgo-seccion-titulo">&#128202; Estadisticas:</div>';
  html += '<div class="stats-grid">';
  html += '<span class="stat-item">Carreras: ' + carreras + '</span>';
  html += '<span class="stat-item">Victorias: ' + victorias + '</span>';
  html += '<span class="stat-item">Podios: ' + podios + '</span>';
  html += '<span class="stat-item">Accidentes: ' + accidentes + '</span>';
  html += '<span class="stat-item">Puntos: ' + puntos + '</span>';
  html += '</div>';
  html += '</div>';

  html += '<div class="galgo-seccion">';
  html += '<div class="galgo-seccion-titulo">&#128200; Porcentajes:</div>';
  html += '<div class="porcentaje-row">';
  html += '<span class="porcentaje-label">% Victorias: ' + pctVictorias + '%</span>';
  html += '<div class="progress-bar-container"><div class="progress-bar-fill ' + colorVictorias + '" style="width:' + pctVictorias + '%"></div></div>';
  html += '</div>';
  html += '<div class="porcentaje-row">';
  html += '<span class="porcentaje-label">% Podios: ' + pctPodios + '%</span>';
  html += '<div class="progress-bar-container"><div class="progress-bar-fill ' + colorPodios + '" style="width:' + pctPodios + '%"></div></div>';
  html += '</div>';
  html += '</div>';

  html += '<div class="galgo-seccion">';
  html += '<div class="galgo-seccion-titulo">&#128170; Caracteristicas:</div>';
  html += '<div class="caracteristica-row">';
  html += '<span class="caract-label">VEL: ' + vel + '</span>';
  html += '<div class="progress-bar-container mini"><div class="progress-bar-fill caract" style="width:' + vel + '%"></div></div>';
  html += '</div>';
  html += '<div class="caracteristica-row">';
  html += '<span class="caract-label">RES: ' + res + '</span>';
  html += '<div class="progress-bar-container mini"><div class="progress-bar-fill caract" style="width:' + res + '%"></div></div>';
  html += '</div>';
  html += '<div class="caracteristica-row">';
  html += '<span class="caract-label">ACE: ' + ace + '</span>';
  html += '<div class="progress-bar-container mini"><div class="progress-bar-fill caract" style="width:' + ace + '%"></div></div>';
  html += '</div>';
  html += '<div class="caracteristica-row">';
  html += '<span class="caract-label">EXP: ' + exp + '</span>';
  html += '<div class="progress-bar-container mini"><div class="progress-bar-fill caract" style="width:' + exp + '%"></div></div>';
  html += '</div>';
  html += '</div>';

  html += '</div>';
  return html;
}

function mostrarSpinnerCarreras() {
  var contenido = document.getElementById('contenido-principal');
  contenido.innerHTML = '<div class="spinner-carreras">' +
    '<div class="spinner"></div>' +
    '<div class="loading-text">&#127937; Los galgos estan corriendo en los 3 canodromos...</div>' +
    '<p class="text-muted mt-1">Simulando 3 vueltas en cada pista</p>' +
    '</div>';
}

async function correrTodasLasCarreras() {
  mostrarSpinnerCarreras();

  var resultados = [];

  try {
    for (var i = 0; i < pistasData.length; i++) {
      var pista = pistasData[i];
      var data = pistasDataMap[pista._id];
      if (!data || data.galgoIds.length < 2) continue;

      var resultado;

      if (modoSinApuesta) {
        resultado = await ApiService.simularCarrera(pista._id, data.galgoIds, 3);
      } else {
        if (data.carreraId) {
          resultado = await ApiService.correrCarrera(data.carreraId);
        } else {
          resultado = await ApiService.simularCarrera(pista._id, data.galgoIds, 3);
        }
      }

      resultados.push({
        pista: pista,
        resultado: resultado
      });
    }

    await actualizarHeader();

    await mostrarResultados3Carreras(resultados);

  } catch (error) {
    mostrarNotificacion('Error al simular las carreras: ' + error.message, 'error');
    cargarCarreras();
  }
}

async function mostrarResultados3Carreras(resultados) {
  var contenido = document.getElementById('contenido-principal');

  var html = '<h2 class="resultados-titulo">&#127942; RESULTADOS DE LAS CARRERAS</h2>';

  for (var i = 0; i < resultados.length; i++) {
    var item = resultados[i];
    html += await renderizarResultadoCarrera(item.pista, item.resultado);
  }

  html += await renderizarResultadoApuestas(resultados);

  html += '<div class="botones-post-carrera">';
  html += '<button class="btn btn-primary btn-lg" onclick="volverACanodromos()">&#128260; Volver a ver los canodromos</button>';
  html += '<button class="btn-correr-todas" style="padding:14px 30px;font-size:1.1em" onclick="otraRondaCarreras()">&#127937; Correr otra ronda de carreras</button>';
  html += '</div>';

  contenido.innerHTML = html;
  contenido.scrollTop = 0;
  window.scrollTo(0, 0);
}

async function renderizarResultadoCarrera(pista, resultado) {
  var pistaNombre = pista.nombre || 'Pista';
  var resultadosClasif = resultado.resultados || [];

  var html = '<div class="resultado-carrera-card">';
  html += '<div class="resultado-carrera-titulo">&#127967;&#65039; RESULTADO: ' + pistaNombre.toUpperCase() + '</div>';

  html += '<div style="margin-bottom:12px"><strong style="color:var(--texto-claro)">CLASIFICACION:</strong></div>';
  for (var i = 0; i < resultadosClasif.length; i++) {
    var r = resultadosClasif[i];
    var galgoNombre = r.galgo_id ? (typeof r.galgo_id === 'object' ? r.galgo_id.nombre : 'Galgo') : 'Galgo';
    var pos = r.posicion_final;
    var posIcon = pos === 1 ? '&#129351;' : (pos === 2 ? '&#129352;' : (pos === 3 ? '&#129353;' : pos + 'o'));
    var tiempo = (r.tiempo_total_ms / 1000).toFixed(3) + 's';
    var incidText = r.num_incidentes > 0 ? r.num_incidentes + ' incid.' : '0 incid.';

    html += '<div class="clasificacion-fila">';
    html += '<span class="clasificacion-pos">' + posIcon + '</span>';
    html += '<span class="clasificacion-nombre">&#128021; ' + galgoNombre + '</span>';
    html += '<span class="clasificacion-tiempo">' + tiempo + '</span>';
    html += '<span class="clasificacion-puntos">+' + r.puntos_obtenidos + ' pts</span>';
    html += '<span class="clasificacion-incidentes">' + incidText + '</span>';
    html += '</div>';
  }

  if (resultado.vuelta_rapida && resultado.vuelta_rapida.galgo_id) {
    var vrNombre = typeof resultado.vuelta_rapida.galgo_id === 'object' ? resultado.vuelta_rapida.galgo_id.nombre : 'Galgo';
    var vrTiempo = (resultado.vuelta_rapida.tiempo_ms / 1000).toFixed(3);
    html += '<div class="vuelta-rapida" style="margin:12px 0">&#9889; Vuelta rapida: ' + vrNombre + ' - V' + resultado.vuelta_rapida.numero_vuelta + ' - ' + vrTiempo + 's</div>';
  }

  try {
    var vueltas = await ApiService.getVueltas(resultado._id);
    if (vueltas && vueltas.length > 0) {
      html += renderizarTablaTiempos(vueltas, resultado.vuelta_rapida);
    }
  } catch (e) { /* sin datos de vueltas */ }

  try {
    var incidentes = await ApiService.getIncidentes({ carrera_id: resultado._id });
    if (incidentes && incidentes.length > 0) {
      html += '<div style="margin-top:12px"><strong style="color:var(--texto-claro)">&#128165; INCIDENTES:</strong></div>';
      for (var j = 0; j < incidentes.length; j++) {
        var inc = incidentes[j];
        var incGalgo = inc.galgo_id ? (typeof inc.galgo_id === 'object' ? inc.galgo_id.nombre : 'Galgo') : 'Galgo';
        var penaliz = inc.tiempo_penalizacion_ms ? (inc.tiempo_penalizacion_ms / 1000).toFixed(3) : '0.000';
        html += '<div class="incidente-resultado">';
        html += 'V' + inc.numero_vuelta + '-T' + inc.tramo_numero + ': <strong>' + incGalgo + '</strong> - ' + (inc.tipo || '').replace(/_/g, ' ');
        html += ' | Causa: ' + (inc.causa || '').replace(/_/g, ' ') + ' | Penaliz: +' + penaliz + 's';
        html += '</div>';
      }
    } else {
      html += '<div style="margin-top:8px;color:var(--verde-badge)">&#9989; Carrera limpia - Sin incidentes</div>';
    }
  } catch (e) {
    /* sin datos de incidentes */
  }

  if (resultado.cuotas_actualizadas) {
    html += '<div style="margin-top:12px"><strong style="color:var(--texto-claro)">&#128201; CAMBIO DE CUOTAS:</strong></div>';
    var cuotasPre = resultado.cuotas_pre_carrera || [];
    for (var key in resultado.cuotas_actualizadas) {
      var info = resultado.cuotas_actualizadas[key];
      var cuotaAnterior = null;
      for (var cp = 0; cp < cuotasPre.length; cp++) {
        var preId = cuotasPre[cp].galgo_id ? cuotasPre[cp].galgo_id.toString() : '';
        if (preId === key) {
          cuotaAnterior = cuotasPre[cp].cuota;
          break;
        }
      }
      var cuotaNueva = info.cuota_actual;
      var flecha = '';
      var claseNueva = '';
      if (cuotaAnterior !== null) {
        if (cuotaNueva < cuotaAnterior) {
          flecha = '&#8595;';
          claseNueva = 'cuota-nueva-bajada';
        } else if (cuotaNueva > cuotaAnterior) {
          flecha = '&#8593;';
          claseNueva = 'cuota-nueva-subida';
        } else {
          flecha = '=';
          claseNueva = '';
        }
      }

      html += '<div class="cuota-cambio-row">';
      html += '<strong>' + info.nombre + ':</strong> ';
      if (cuotaAnterior !== null) {
        html += '<span class="cuota-anterior">' + cuotaAnterior.toFixed(2) + '</span>';
        html += ' <span class="cuota-flecha">' + flecha + '</span> ';
      }
      html += '<span class="' + claseNueva + '">' + cuotaNueva.toFixed(2) + '</span>';
      html += '</div>';
    }
  }

  html += '</div>';
  return html;
}

function renderizarTablaTiempos(vueltas, vueltaRapida) {
  var galgoMap = {};
  var maxVuelta = 0;

  for (var i = 0; i < vueltas.length; i++) {
    var v = vueltas[i];
    var gId = v.galgo_id ? (typeof v.galgo_id === 'object' ? v.galgo_id._id : v.galgo_id) : '';
    var gNombre = v.galgo_id ? (typeof v.galgo_id === 'object' ? v.galgo_id.nombre : 'Galgo') : 'Galgo';

    if (!galgoMap[gId]) {
      galgoMap[gId] = { nombre: gNombre, vueltas: {} };
    }
    galgoMap[gId].vueltas[v.numero_vuelta] = v.tiempo_total_ms;
    if (v.numero_vuelta > maxVuelta) maxVuelta = v.numero_vuelta;
  }

  var vrGalgoId = '';
  var vrVuelta = 0;
  if (vueltaRapida && vueltaRapida.galgo_id) {
    vrGalgoId = typeof vueltaRapida.galgo_id === 'object' ? vueltaRapida.galgo_id._id || vueltaRapida.galgo_id : vueltaRapida.galgo_id;
    if (typeof vrGalgoId === 'object' && vrGalgoId.toString) vrGalgoId = vrGalgoId.toString();
    vrVuelta = vueltaRapida.numero_vuelta;
  }

  var html = '<div style="margin-top:12px"><strong style="color:var(--texto-claro)">TIEMPOS POR VUELTA:</strong></div>';
  html += '<table class="tabla-tiempos">';
  html += '<thead><tr><th>Galgo</th>';
  for (var nv = 1; nv <= maxVuelta; nv++) {
    html += '<th>Vuelta ' + nv + '</th>';
  }
  html += '</tr></thead><tbody>';

  for (var gIdKey in galgoMap) {
    var gData = galgoMap[gIdKey];
    html += '<tr>';
    html += '<td style="font-weight:bold;text-align:left">' + gData.nombre + '</td>';
    for (var nv2 = 1; nv2 <= maxVuelta; nv2++) {
      var tMs = gData.vueltas[nv2];
      var tStr = tMs ? (tMs / 1000).toFixed(3) + 's' : '—';
      var esVR = (gIdKey === vrGalgoId || gIdKey.toString() === vrGalgoId.toString()) && nv2 === vrVuelta;
      html += '<td class="' + (esVR ? 'vuelta-rapida' : '') + '">' + tStr + (esVR ? '&#9889;' : '') + '</td>';
    }
    html += '</tr>';
  }

  html += '</tbody></table>';
  return html;
}

async function renderizarResultadoApuestas(resultados) {
  var html = '<div class="resultado-carrera-card" style="margin-top:20px">';

  if (modoSinApuesta) {
    html += '<div class="apuesta-resultado-card apuesta-resultado-espectador" style="text-align:center;padding:20px">';
    html += '<div style="font-size:1.2em;font-weight:bold;margin-bottom:8px">&#127937; Carreras simuladas en modo espectador</div>';
    html += '<div>Tu saldo no se ha modificado</div>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  html += '<div class="resultado-carrera-titulo">&#128176; RESULTADO DE TUS APUESTAS</div>';

  try {
    var misApuestas = await ApiService.getMisApuestas();

    var carreraIds = [];
    for (var i = 0; i < resultados.length; i++) {
      if (resultados[i].resultado && resultados[i].resultado._id) {
        carreraIds.push(resultados[i].resultado._id);
      }
    }

    var apuestasResueltas = misApuestas.filter(function (a) {
      var cId = a.carrera_id ? (typeof a.carrera_id === 'object' ? a.carrera_id._id : a.carrera_id) : '';
      return carreraIds.indexOf(cId) !== -1 && (a.estado === 'ganada' || a.estado === 'perdida');
    });

    if (apuestasResueltas.length === 0) {
      html += '<div class="text-muted" style="padding:16px;text-align:center">No tenias apuestas activas en estas carreras</div>';
    } else {
      var balanceTotal = 0;
      for (var j = 0; j < apuestasResueltas.length; j++) {
        var ap = apuestasResueltas[j];
        var apGalgo = ap.galgo_id ? (typeof ap.galgo_id === 'object' ? ap.galgo_id.nombre : 'Galgo') : 'Galgo';

        if (ap.estado === 'ganada') {
          var ganancia = ap.ganancia_real || 0;
          balanceTotal += ganancia;
          html += '<div class="apuesta-resultado-card apuesta-resultado-ganada">';
          html += '&#127881; Apuesta a <strong>' + apGalgo + '</strong> (' + ap.tipo_apuesta + ') - ' + ap.cantidad_apostada + '&#8364; x ' + ap.cuota_momento.toFixed(2) + ' = <strong>+' + ganancia.toFixed(2) + '&#8364;</strong>';
          html += '</div>';
        } else {
          balanceTotal -= ap.cantidad_apostada;
          html += '<div class="apuesta-resultado-card apuesta-resultado-perdida">';
          html += '&#128532; Apuesta a <strong>' + apGalgo + '</strong> (' + ap.tipo_apuesta + ') - ' + ap.cantidad_apostada + '&#8364; = <strong>Perdida</strong>';
          html += '</div>';
        }
      }

      var balanceColor = balanceTotal >= 0 ? 'var(--verde-badge)' : 'var(--rojo)';
      var balanceSign = balanceTotal >= 0 ? '+' : '';

      try {
        var perfil = await ApiService.getPerfil();
        html += '<div style="margin-top:16px;padding:14px 20px;background:rgba(212,175,55,0.1);border:1px solid var(--dorado);border-radius:8px;text-align:center">';
        html += '<div style="margin-bottom:4px">Balance: <strong style="color:' + balanceColor + '">' + balanceSign + balanceTotal.toFixed(2) + '&#8364;</strong></div>';
        html += '<div>Nuevo saldo: <strong class="text-dorado">' + perfil.creditos.toFixed(2) + '&#8364;</strong></div>';
        html += '</div>';
      } catch (e) { /* sin perfil */ }
    }
  } catch (e) {
    html += '<div class="text-muted" style="padding:16px;text-align:center">No se pudieron cargar los resultados de apuestas</div>';
  }

  html += '</div>';
  return html;
}

async function volverACanodromos() {
  await cargarCarreras();
}

async function otraRondaCarreras() {
  verificarAntesDeCarreras();
}

function renderizarHistorial(carreras) {
  var html = '<div class="card-body">';
  if (!carreras || carreras.length === 0) {
    html += '<p class="text-muted">No hay carreras finalizadas aun.</p>';
    return html + '</div>';
  }

  var max = Math.min(carreras.length, 15);
  for (var i = 0; i < max; i++) {
    var c = carreras[i];
    var fecha = new Date(c.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    var pistaNombre = c.pista_id ? (typeof c.pista_id === 'object' ? c.pista_id.nombre : 'Pista') : 'Pista';
    var ganadorNombre = c.ganador ? (typeof c.ganador === 'object' ? c.ganador.nombre : 'Galgo') : '—';

    html += '<div class="carrera-historial-item" onclick="verDetalleHistorial(\'' + c._id + '\')">';
    html += '<span class="carrera-fecha">&#128197; ' + fecha + '</span>';
    html += '<span class="carrera-pista">' + pistaNombre + '</span>';
    html += '<span class="carrera-ganador">&#127942; ' + ganadorNombre + '</span>';
    html += '<button class="btn btn-secondary btn-sm">Ver detalle</button>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

async function verDetalleHistorial(carreraId) {
  mostrarModal(
    '&#8987; Cargando...',
    '<div class="spinner-container" style="padding:10px"><div class="spinner"></div></div>',
    []
  );

  try {
    var carrera = await ApiService.getCarrera(carreraId);
    cerrarModal();

    var pistaNombre = carrera.pista_id ? (typeof carrera.pista_id === 'object' ? carrera.pista_id.nombre : 'Pista') : 'Pista';
    var resultados = carrera.resultados || [];

    var bodyHtml = '';
    for (var i = 0; i < resultados.length; i++) {
      var r = resultados[i];
      var galgoNombre = r.galgo_id ? (typeof r.galgo_id === 'object' ? r.galgo_id.nombre : 'Galgo') : 'Galgo';
      var pos = r.posicion_final;
      var posIcon = pos === 1 ? '&#129351;' : (pos === 2 ? '&#129352;' : (pos === 3 ? '&#129353;' : pos + 'o'));
      var tiempo = (r.tiempo_total_ms / 1000).toFixed(3) + 's';

      bodyHtml += '<div style="display:flex;align-items:center;gap:12px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05)">';
      bodyHtml += '<strong style="min-width:35px;font-size:1.1rem">' + posIcon + '</strong>';
      bodyHtml += '<span style="flex:1">&#128021; ' + galgoNombre + '</span>';
      bodyHtml += '<span style="color:var(--texto-muted);font-family:monospace">' + tiempo + '</span>';
      bodyHtml += '<span style="color:var(--dorado);font-weight:700;min-width:55px;text-align:right">+' + r.puntos_obtenidos + 'pts</span>';
      bodyHtml += '</div>';
    }

    if (carrera.vuelta_rapida && carrera.vuelta_rapida.galgo_id) {
      var vrNombre = typeof carrera.vuelta_rapida.galgo_id === 'object' ? carrera.vuelta_rapida.galgo_id.nombre : 'Galgo';
      var vrTiempo = (carrera.vuelta_rapida.tiempo_ms / 1000).toFixed(3);
      bodyHtml += '<div class="vuelta-rapida" style="margin-top:12px;font-size:0.9rem">&#9889; Vuelta rapida: ' + vrNombre + ' - V' + carrera.vuelta_rapida.numero_vuelta + ' - ' + vrTiempo + 's</div>';
    }

    mostrarModal(
      '&#127942; ' + pistaNombre + ' — ' + new Date(carrera.fecha).toLocaleDateString('es-ES'),
      bodyHtml,
      [{ texto: 'Cerrar', clase: 'btn-secondary', callback: function () { cerrarModal(); } }]
    );
  } catch (error) {
    cerrarModal();
    mostrarNotificacion('Error al cargar detalle: ' + error.message, 'error');
  }
}

async function cargarApuestas() {
  var contenido = document.getElementById('contenido-principal');
  contenido.innerHTML = '<div class="spinner-container"><div class="spinner"></div><div class="loading-text">Preparando jornada de carreras...</div></div>';

  try {
    var jornada = await ApiService.prepararJornada();
    var carrerasProgramadas = jornada.carreras || [];
    var misApuestas = await ApiService.getMisApuestas();

    var html = '<h2 class="section-title">🎰 Apuestas — Jornada de Carreras</h2>';
    html += '<p class="text-muted" style="margin-bottom:20px">Cada pista tiene sus galgos asignados. Apuesta antes de correr las carreras en la sección "Ver Carreras".</p>';

    if (carrerasProgramadas.length === 0) {
      html += '<div class="card card-empty"><p>No se pudieron preparar carreras. Ejecuta el seed primero.</p></div>';
    } else {
      for (var i = 0; i < carrerasProgramadas.length; i++) {
        html += renderizarCarreraProgramada(carrerasProgramadas[i], misApuestas);
      }
    }

    var pendientes = misApuestas.filter(function (a) { return a.estado === 'pendiente'; });
    var resueltas = misApuestas.filter(function (a) { return a.estado !== 'pendiente'; });

    html += '<h3 class="section-subtitle">🎫 Mis Apuestas Activas (' + pendientes.length + ')</h3>';
    if (pendientes.length === 0) {
      html += '<div class="card card-empty"><p>No tienes apuestas pendientes.</p></div>';
    } else {
      html += '<div class="card"><div class="card-body">';
      for (var j = 0; j < pendientes.length; j++) {
        html += renderizarApuestaItem(pendientes[j]);
      }
      html += '</div></div>';
    }

    html += '<h3 class="section-subtitle">📜 Historial de Apuestas</h3>';
    if (resueltas.length === 0) {
      html += '<div class="card card-empty"><p>Aún no tienes apuestas resueltas.</p></div>';
    } else {
      html += '<div class="card"><div class="card-body">';
      for (var k = 0; k < resueltas.length; k++) {
        html += renderizarApuestaItem(resueltas[k]);
      }
      html += '</div></div>';
    }

    contenido.innerHTML = html;
  } catch (error) {
    contenido.innerHTML = '<div class="card card-empty"><p>Error al cargar apuestas: ' + error.message + '</p></div>';
  }
}

function renderizarCarreraProgramada(carrera, misApuestas) {
  var pista = carrera.pista_id;
  var pistaNombre = pista ? (pista.nombre || pista) : 'Pista desconocida';
  var pistaInfo = pista ? (pista.superficie + ' | ' + pista.longitud_total_m + 'm | ' + pista.num_tramos + ' tramos') : '';
  var galgos = carrera.galgos_participantes || [];

  var apuestasEnEstaCarrera = misApuestas.filter(function (a) {
    var aCarreraId = a.carrera_id ? (typeof a.carrera_id === 'object' ? a.carrera_id._id : a.carrera_id) : '';
    return aCarreraId === carrera._id && a.estado === 'pendiente';
  });

  var html = '<div class="card">';
  html += '<div class="card-header">';
  html += '<span>🏟️ ' + pistaNombre + '</span>';
  if (pistaInfo) {
    html += '<span class="badge badge-info" style="margin-left:auto;font-size:0.8rem">' + pistaInfo + '</span>';
  }
  html += '</div>';
  html += '<div class="card-body">';
  html += '<p class="text-muted mb-2">Vueltas: ' + carrera.num_vueltas + ' | <span class="badge badge-pendiente">Abierta para apuestas</span></p>';

  if (apuestasEnEstaCarrera.length > 0) {
    html += '<div style="background:rgba(212,175,55,0.1);border:1px solid var(--dorado);border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:0.9rem">';
    html += '✅ Ya tienes ' + apuestasEnEstaCarrera.length + ' apuesta(s) en esta carrera';
    html += '</div>';
  }

  for (var j = 0; j < galgos.length; j++) {
    var g = galgos[j];
    if (!g || !g.nombre) continue;
    var stats = g.estadisticas || {};
    var carac = g.caracteristicas || {};
    var carreras = stats.carreras_corridas || 0;
    var victorias = stats.victorias || 0;
    var podios = stats.podios || 0;
    var derrotas = carreras - victorias;
    var pctVic = carreras > 0 ? Math.round((victorias / carreras) * 100) : 0;
    var cuota = g.cuota_actual || 3;

    html += '<div class="galgo-card">';
    html += '<div class="galgo-info">';
    html += '<div class="galgo-nombre">🐕 ' + g.nombre + '</div>';
    html += '<div class="galgo-raza">' + g.raza + '</div>';

    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:4px 0">';
    html += '<span style="font-size:0.75rem;padding:2px 6px;border-radius:4px;background:rgba(76,175,80,0.2);color:#4caf50">' + victorias + 'V</span>';
    html += '<span style="font-size:0.75rem;padding:2px 6px;border-radius:4px;background:rgba(255,152,0,0.2);color:#ff9800">' + podios + 'P</span>';
    html += '<span style="font-size:0.75rem;padding:2px 6px;border-radius:4px;background:rgba(244,67,54,0.2);color:#f44336">' + derrotas + 'D</span>';
    html += '<span style="font-size:0.75rem;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.1);color:var(--texto-muted)">' + carreras + 'C</span>';
    html += '</div>';

    html += '<div style="display:flex;gap:4px;align-items:center;margin:4px 0">';
    html += '<div style="flex:1;background:rgba(255,255,255,0.05);border-radius:4px;height:8px;overflow:hidden">';
    html += '<div style="display:flex;height:100%">';
    if (carreras > 0) {
      var pctWin = Math.round((victorias / carreras) * 100);
      var pctLoss = 100 - pctWin;
      html += '<div style="width:' + pctWin + '%;background:#4caf50;height:100%"></div>';
      html += '<div style="width:' + pctLoss + '%;background:#f44336;height:100%"></div>';
    } else {
      html += '<div style="width:100%;background:rgba(255,255,255,0.1);height:100%"></div>';
    }
    html += '</div></div>';
    html += '<span style="font-size:0.75rem;color:var(--dorado);min-width:35px;text-align:right">' + pctVic + '%</span>';
    html += '</div>';

    html += '<div class="galgo-stats" style="font-size:0.75rem">';
    html += 'Vel:' + (carac.velocidad_base || '-');
    html += ' Res:' + (carac.resistencia || '-');
    html += ' Ace:' + (carac.aceleracion || '-');
    html += ' Exp:' + (carac.experiencia || '-');
    html += '</div>';
    html += '</div>';

    html += '<div class="galgo-cuota">';
    html += '<div class="galgo-cuota-valor">' + cuota.toFixed(2) + '</div>';
    html += '<div class="galgo-cuota-label">cuota</div>';
    if (cuota <= 2) {
      html += '<div style="font-size:0.65rem;color:#4caf50">Favorito</div>';
    } else if (cuota >= 8) {
      html += '<div style="font-size:0.65rem;color:#f44336">Riesgo alto</div>';
    }
    html += '</div>';

    html += '<div class="galgo-apuesta">';
    html += '<input type="number" id="cant-' + carrera._id + '-' + g._id + '" min="1" value="50" onchange="calcularGananciaPotencial(\'' + carrera._id + '\',\'' + g._id + '\',' + cuota + ')" oninput="calcularGananciaPotencial(\'' + carrera._id + '\',\'' + g._id + '\',' + cuota + ')">';
    html += '<select id="tipo-' + carrera._id + '-' + g._id + '" onchange="calcularGananciaPotencial(\'' + carrera._id + '\',\'' + g._id + '\',' + cuota + ')">';
    html += '<option value="ganador">Ganador</option>';
    html += '<option value="podio">Podio</option>';
    html += '<option value="ultimo">Último</option>';
    html += '</select>';
    html += '<button class="btn btn-dorado btn-sm" onclick="realizarApuesta(\'' + carrera._id + '\',\'' + g._id + '\',\'' + g.nombre + '\',' + cuota + ')">APOSTAR</button>';
    html += '<div class="ganancia-potencial" id="ganancia-' + carrera._id + '-' + g._id + '">+' + (50 * cuota).toFixed(2) + '€</div>';
    html += '</div>';
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

function calcularGananciaPotencial(carreraId, galgoId, cuota) {
  var cantInput = document.getElementById('cant-' + carreraId + '-' + galgoId);
  var tipoSelect = document.getElementById('tipo-' + carreraId + '-' + galgoId);
  var gananciaEl = document.getElementById('ganancia-' + carreraId + '-' + galgoId);

  if (!cantInput || !tipoSelect || !gananciaEl) return;

  var cantidad = parseFloat(cantInput.value) || 0;
  var tipo = tipoSelect.value;
  var ganancia = 0;

  if (tipo === 'ganador') {
    ganancia = cantidad * cuota;
  } else if (tipo === 'podio') {
    ganancia = cantidad * (cuota * 0.4);
  } else if (tipo === 'ultimo') {
    ganancia = cantidad * (cuota * 0.6);
  }

  gananciaEl.textContent = '+' + ganancia.toFixed(2) + '€';
}

async function realizarApuesta(carreraId, galgoId, galgoNombre, cuota) {
  var cantInput = document.getElementById('cant-' + carreraId + '-' + galgoId);
  var tipoSelect = document.getElementById('tipo-' + carreraId + '-' + galgoId);

  var cantidad = parseFloat(cantInput.value);
  var tipo = tipoSelect.value;

  if (!cantidad || cantidad < 1) {
    mostrarNotificacion('La cantidad debe ser al menos 1 crédito', 'error');
    return;
  }

  var creditosActuales = 0;
  try {
    var perfil = await ApiService.getPerfil();
    creditosActuales = perfil.creditos || 0;
  } catch (e) {
    mostrarNotificacion('Error al verificar saldo', 'error');
    return;
  }
  if (cantidad > creditosActuales) {
    mostrarNotificacion('Saldo insuficiente. Tienes ' + creditosActuales.toFixed(2) + '€', 'error');
    return;
  }

  var ganancia = 0;
  if (tipo === 'ganador') ganancia = cantidad * cuota;
  else if (tipo === 'podio') ganancia = cantidad * (cuota * 0.4);
  else ganancia = cantidad * (cuota * 0.6);

  var tipoTexto = tipo.charAt(0).toUpperCase() + tipo.slice(1);

  mostrarModal(
    '🎰 Confirmar Apuesta',
    '¿Apostar <strong>' + cantidad + '€</strong> a <strong>' + galgoNombre + '</strong> como <strong>' + tipoTexto + '</strong>?<br><br>Cuota: <strong>' + cuota.toFixed(2) + '</strong><br>Ganancia potencial: <strong class="text-dorado">+' + ganancia.toFixed(2) + '€</strong>',
    [
      {
        texto: 'Confirmar Apuesta',
        clase: 'btn-dorado',
        callback: async function () {
          cerrarModal();
          try {
            await ApiService.apostar(carreraId, galgoId, cantidad, tipo);
            await actualizarHeader();
            mostrarNotificacion('Apuesta realizada: ' + cantidad + '€ a ' + galgoNombre + ' (' + tipoTexto + ')', 'exito');
            cargarApuestas();
          } catch (error) {
            mostrarNotificacion(error.message, 'error');
          }
        }
      },
      {
        texto: 'Cancelar',
        clase: 'btn-secondary',
        callback: function () { cerrarModal(); }
      }
    ]
  );
}

function renderizarApuestaItem(apuesta) {
  var estadoBadge = '';
  var resultadoTexto = '';
  var resultadoClase = '';

  if (apuesta.estado === 'ganada') {
    estadoBadge = '<span class="badge badge-ganada">GANADA</span>';
    resultadoTexto = '+' + apuesta.ganancia_real.toFixed(2) + '€';
    resultadoClase = 'ganada';
  } else if (apuesta.estado === 'perdida') {
    estadoBadge = '<span class="badge badge-perdida">PERDIDA</span>';
    resultadoTexto = '-' + apuesta.cantidad_apostada.toFixed(2) + '€';
    resultadoClase = 'perdida';
  } else {
    estadoBadge = '<span class="badge badge-pendiente">PENDIENTE</span>';
    resultadoTexto = 'Potencial: +' + apuesta.ganancia_potencial.toFixed(2) + '€';
    resultadoClase = 'pendiente';
  }

  var galgoNombre = apuesta.galgo_id ? (apuesta.galgo_id.nombre || 'Galgo') : 'Galgo';
  var tipoTexto = apuesta.tipo_apuesta.charAt(0).toUpperCase() + apuesta.tipo_apuesta.slice(1);
  var fecha = new Date(apuesta.fecha_apuesta).toLocaleDateString('es-ES');
  var pistaNombre = '';
  if (apuesta.carrera_id && typeof apuesta.carrera_id === 'object' && apuesta.carrera_id.pista_id) {
    pistaNombre = typeof apuesta.carrera_id.pista_id === 'object' ? apuesta.carrera_id.pista_id.nombre : '';
  }

  var html = '<div class="apuesta-item">';
  html += '<div class="apuesta-info">';
  html += '<div class="apuesta-galgo">🐕 ' + galgoNombre + ' - ' + tipoTexto + ' ' + estadoBadge + '</div>';
  html += '<div class="apuesta-detalle">' + apuesta.cantidad_apostada + '€ | Cuota: ' + apuesta.cuota_momento.toFixed(2);
  if (pistaNombre) html += ' | ' + pistaNombre;
  html += ' | ' + fecha + '</div>';
  html += '</div>';
  html += '<div class="apuesta-resultado-texto ' + resultadoClase + '">' + resultadoTexto + '</div>';
  html += '</div>';
  return html;
}

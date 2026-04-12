async function cargarRankings() {
  var contenido = document.getElementById('contenido-principal');
  contenido.innerHTML = '<div class="spinner-container"><div class="spinner"></div><div class="loading-text">Cargando clasificación...</div></div>';

  try {
    var rankingData = await ApiService.getRanking();
    var galgos = await ApiService.getGalgos();
    var apostadores = [];
    try {
      apostadores = await ApiService.getRankingApostadores();
    } catch (e) {
      apostadores = [];
    }

    var clasificacion = rankingData.clasificacion || [];
    var galgosMap = {};
    for (var i = 0; i < galgos.length; i++) {
      galgosMap[galgos[i]._id] = galgos[i];
    }

    var html = '<h2 class="section-title">🏆 Clasificación</h2>';

    html += renderizarPodium(clasificacion, galgosMap);
    html += renderizarTablaGalgos(clasificacion, galgosMap);
    html += renderizarTopApostadores(apostadores);

    contenido.innerHTML = html;
  } catch (error) {
    contenido.innerHTML = '<div class="card card-empty"><p>Error al cargar rankings: ' + error.message + '</p></div>';
  }
}

function renderizarPodium(clasificacion, galgosMap) {
  if (clasificacion.length < 3) {
    return '<div class="card card-empty"><p>Se necesitan al menos 3 galgos en el ranking para mostrar el podio.</p></div>';
  }

  var top3 = clasificacion.slice(0, 3);
  var html = '<div class="card"><div class="podium">';

  for (var i = 0; i < 3; i++) {
    var item = top3[i];
    var galgoId = item.galgo_id ? (typeof item.galgo_id === 'object' ? item.galgo_id._id : item.galgo_id) : '';
    var galgoNombre = '';
    if (item.galgo_id && typeof item.galgo_id === 'object' && item.galgo_id.nombre) {
      galgoNombre = item.galgo_id.nombre;
    } else if (galgosMap[galgoId]) {
      galgoNombre = galgosMap[galgoId].nombre;
    } else {
      galgoNombre = 'Galgo #' + (i + 1);
    }

    var medalla = i === 0 ? '🥇' : (i === 1 ? '🥈' : '🥉');
    var clasePos = 'podium-' + (i + 1);

    html += '<div class="podium-place ' + clasePos + '">';
    html += '<div class="podium-medal">' + medalla + '</div>';
    html += '<div class="podium-name">' + galgoNombre + '</div>';
    html += '<div class="podium-points">' + item.puntos + ' pts</div>';
    html += '<div class="podium-stats">' + item.victorias + 'V | ' + item.podios + 'P | ' + item.carreras_disputadas + 'C</div>';
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

function renderizarTablaGalgos(clasificacion, galgosMap) {
  var html = '<h3 class="section-subtitle">📊 Tabla Completa</h3>';
  html += '<div class="card"><div class="table-container"><table>';
  html += '<thead><tr>';
  html += '<th>POS</th><th>GALGO</th><th>PUNTOS</th><th>W</th><th>L</th><th>%W</th><th>CUOTA</th>';
  html += '</tr></thead><tbody>';

  for (var i = 0; i < clasificacion.length; i++) {
    var item = clasificacion[i];
    var galgoId = item.galgo_id ? (typeof item.galgo_id === 'object' ? item.galgo_id._id : item.galgo_id) : '';
    var galgoNombre = '';
    var galgoRaza = '';
    var cuotaActual = 3.00;

    if (item.galgo_id && typeof item.galgo_id === 'object' && item.galgo_id.nombre) {
      galgoNombre = item.galgo_id.nombre;
      galgoRaza = item.galgo_id.raza || '';
      cuotaActual = item.galgo_id.cuota_actual || 3.00;
    } else if (galgosMap[galgoId]) {
      galgoNombre = galgosMap[galgoId].nombre;
      galgoRaza = galgosMap[galgoId].raza || '';
      cuotaActual = galgosMap[galgoId].cuota_actual || 3.00;
    } else {
      galgoNombre = 'Desconocido';
    }

    var derrotas = item.carreras_disputadas - item.victorias;
    var pctVic = item.carreras_disputadas > 0 ? Math.round((item.victorias / item.carreras_disputadas) * 100) : 0;

    var rowClass = '';
    if (i === 0) rowClass = 'top-1';
    else if (i === 1) rowClass = 'top-2';
    else if (i === 2) rowClass = 'top-3';

    html += '<tr class="' + rowClass + '">';
    html += '<td><strong>' + (i + 1) + '</strong></td>';
    html += '<td>🐕 <strong>' + galgoNombre + '</strong> <span class="text-muted" style="font-size:0.85rem">' + galgoRaza + '</span></td>';
    html += '<td><strong class="text-dorado">' + item.puntos + '</strong></td>';
    html += '<td>' + item.victorias + '</td>';
    html += '<td>' + derrotas + '</td>';
    html += '<td>' + pctVic + '%</td>';
    html += '<td><strong>' + cuotaActual.toFixed(2) + '</strong></td>';
    html += '</tr>';
  }

  html += '</tbody></table></div></div>';
  return html;
}

function renderizarTopApostadores(apostadores) {
  var html = '<h3 class="section-subtitle">💰 Top Apostadores</h3>';

  if (!apostadores || apostadores.length === 0) {
    html += '<div class="card card-empty"><p>Aún no hay datos de apostadores.</p></div>';
    return html;
  }

  html += '<div class="card"><div class="table-container"><table>';
  html += '<thead><tr>';
  html += '<th>#</th><th>USUARIO</th><th>GANANCIAS</th><th>APOSTADO</th><th>APUESTAS GANADAS</th>';
  html += '</tr></thead><tbody>';

  for (var i = 0; i < apostadores.length; i++) {
    var a = apostadores[i];
    var ratio = a.apuestas_totales > 0
      ? a.apuestas_ganadas + '/' + a.apuestas_totales + ' (' + Math.round((a.apuestas_ganadas / a.apuestas_totales) * 100) + '%)'
      : '0/0';
    var beneficio = (a.total_ganancia_real - a.total_apostado).toFixed(2);
    var beneficioColor = beneficio >= 0 ? 'color:var(--verde-badge)' : 'color:var(--rojo)';

    html += '<tr>';
    html += '<td><strong>' + (i + 1) + '</strong></td>';
    html += '<td>' + (a.nombre || 'Anónimo') + '</td>';
    html += '<td style="' + beneficioColor + ';font-weight:700">' + (beneficio >= 0 ? '+' : '') + beneficio + '€</td>';
    html += '<td>' + a.total_apostado.toFixed(2) + '€</td>';
    html += '<td>' + ratio + '</td>';
    html += '</tr>';
  }

  html += '</tbody></table></div></div>';
  return html;
}

var seccionActual = 'apuestas';
var modoSinApuesta = true;

function initDashboard() {
  var token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/index.html';
    return;
  }

  ApiService.getPerfil().then(function (perfil) {
    actualizarHeaderConPerfil(perfil);
    document.getElementById('btn-tab-apuestas').addEventListener('click', function () {
      navegarA('apuestas');
    });
    document.getElementById('btn-tab-rankings').addEventListener('click', function () {
      navegarA('rankings');
    });
    document.getElementById('btn-tab-carreras').addEventListener('click', function () {
      navegarA('carreras');
    });
    document.getElementById('btn-logout').addEventListener('click', cerrarSesion);
    navegarA('apuestas');
  }).catch(function () {
    limpiarSesion();
    window.location.href = '/index.html';
  });
}

function actualizarHeaderConPerfil(perfil) {
  document.getElementById('header-creditos').textContent = perfil.creditos.toFixed(2) + '€';
  document.getElementById('header-nombre').textContent = perfil.nombre;
}

async function actualizarHeader() {
  try {
    var perfil = await ApiService.getPerfil();
    actualizarHeaderConPerfil(perfil);
  } catch (error) {
    var nombre = localStorage.getItem('usuario_nombre') || 'Usuario';
    document.getElementById('header-nombre').textContent = nombre;
  }
}

function cerrarSesion() {
  limpiarSesion();
  window.location.href = '/index.html';
}

function navegarA(seccion) {
  if (seccion === 'carreras') {
    verificarAntesDeCarreras();
    return;
  }

  seccionActual = seccion;
  actualizarTabs(seccion);

  if (seccion === 'apuestas') {
    cargarApuestas();
  } else if (seccion === 'rankings') {
    cargarRankings();
  }
}

function actualizarTabs(seccion) {
  var tabs = document.querySelectorAll('.nav-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove('active');
  }
  var tabMap = {
    apuestas: 'btn-tab-apuestas',
    rankings: 'btn-tab-rankings',
    carreras: 'btn-tab-carreras'
  };
  var activeTab = document.getElementById(tabMap[seccion]);
  if (activeTab) {
    activeTab.classList.add('active');
  }
}

async function verificarAntesDeCarreras() {
  try {
    var apuestasPendientes = await ApiService.getMisApuestas({ estado: 'pendiente' });

    if (apuestasPendientes.length === 0) {
      mostrarModal(
        '⚠️ No has apostado todavía',
        'No tienes ninguna apuesta activa.<br>¿Quieres ir a apostar antes de ver las carreras?',
        [
          {
            texto: 'SÍ, IR A APOSTAR',
            clase: 'btn-dorado',
            callback: function () {
              cerrarModal();
              seccionActual = 'apuestas';
              actualizarTabs('apuestas');
              cargarApuestas();
            }
          },
          {
            texto: 'NO, VER CARRERAS',
            clase: 'btn-secondary',
            callback: function () {
              cerrarModal();
              modoSinApuesta = true;
              seccionActual = 'carreras';
              actualizarTabs('carreras');
              cargarCarreras();
            }
          }
        ]
      );
    } else {
      var listaHtml = '<p><strong>Tus apuestas pendientes:</strong></p><ul style="margin:12px 0;padding-left:20px">';
      for (var i = 0; i < apuestasPendientes.length; i++) {
        var ap = apuestasPendientes[i];
        var galgoNombre = ap.galgo_id ? (ap.galgo_id.nombre || 'Galgo') : 'Galgo';
        var tipoTexto = ap.tipo_apuesta ? ap.tipo_apuesta.charAt(0).toUpperCase() + ap.tipo_apuesta.slice(1) : '';
        listaHtml += '<li>' + ap.cantidad_apostada + '€ a ' + galgoNombre + ' (' + tipoTexto + ') - Cuota ' + ap.cuota_momento.toFixed(2) + '</li>';
      }
      listaHtml += '</ul><p>¿Quieres apostar más antes de correr las carreras?</p>';

      mostrarModal(
        '✅ Tienes apuestas activas',
        listaHtml,
        [
          {
            texto: 'SÍ, APOSTAR MÁS',
            clase: 'btn-dorado',
            callback: function () {
              cerrarModal();
              seccionActual = 'apuestas';
              actualizarTabs('apuestas');
              cargarApuestas();
            }
          },
          {
            texto: 'NO, VER CARRERAS',
            clase: 'btn-secondary',
            callback: function () {
              cerrarModal();
              modoSinApuesta = false;
              seccionActual = 'carreras';
              actualizarTabs('carreras');
              cargarCarreras();
            }
          }
        ]
      );
    }
  } catch (error) {
    mostrarNotificacion('Error al verificar apuestas: ' + error.message, 'error');
  }
}

function mostrarModal(titulo, mensaje, botones) {
  cerrarModal();

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';

  var modal = document.createElement('div');
  modal.className = 'modal';

  var tituloEl = document.createElement('div');
  tituloEl.className = 'modal-title';
  tituloEl.textContent = titulo;

  var bodyEl = document.createElement('div');
  bodyEl.className = 'modal-body';
  bodyEl.innerHTML = mensaje;

  var botonesEl = document.createElement('div');
  botonesEl.className = 'modal-buttons';

  for (var i = 0; i < botones.length; i++) {
    var btnData = botones[i];
    var btn = document.createElement('button');
    btn.className = 'btn ' + btnData.clase;
    btn.textContent = btnData.texto;
    btn.addEventListener('click', btnData.callback);
    botonesEl.appendChild(btn);
  }

  modal.appendChild(tituloEl);
  modal.appendChild(bodyEl);
  modal.appendChild(botonesEl);
  overlay.appendChild(modal);

  document.body.appendChild(overlay);
}

function cerrarModal() {
  var overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.remove();
  }
}

function mostrarNotificacion(mensaje, tipo) {
  var container = document.getElementById('notificaciones');
  if (!container) {
    container = document.createElement('div');
    container.className = 'notification-container';
    container.id = 'notificaciones';
    document.body.appendChild(container);
  }

  var iconos = {
    exito: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  var notif = document.createElement('div');
  notif.className = 'notification notification-' + tipo;
  notif.innerHTML = (iconos[tipo] || '') + ' ' + mensaje;

  container.appendChild(notif);

  setTimeout(function () {
    notif.classList.add('fadeOut');
    setTimeout(function () {
      notif.remove();
    }, 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', initDashboard);

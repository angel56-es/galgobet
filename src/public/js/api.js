var API_URL = '/api';

function limpiarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario_id');
  localStorage.removeItem('usuario_nombre');
  localStorage.removeItem('usuario_email');
}

var ApiService = {
  getToken: function () {
    return localStorage.getItem('token');
  },

  getHeaders: function (auth) {
    var headers = { 'Content-Type': 'application/json' };
    if (auth) {
      var token = this.getToken();
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }
    }
    return headers;
  },

  handleResponse: async function (response) {
    var data = await response.json();
    if (response.status === 401) {
      limpiarSesion();
      window.location.href = '/index.html';
      throw new Error('Sesión expirada');
    }
    if (!response.ok) {
      throw new Error(data.error || data.detalle || 'Error en la petición');
    }
    return data;
  },

  register: async function (nombre, email, password) {
    var response = await fetch(API_URL + '/auth/register', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ nombre: nombre, email: email, password: password })
    });
    return this.handleResponse(response);
  },

  login: async function (email, password) {
    var response = await fetch(API_URL + '/auth/login', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email: email, password: password })
    });
    return this.handleResponse(response);
  },

  getPerfil: async function () {
    var response = await fetch(API_URL + '/auth/perfil', {
      headers: this.getHeaders(true)
    });
    return this.handleResponse(response);
  },

  getGalgos: async function () {
    var response = await fetch(API_URL + '/galgos', {
      headers: this.getHeaders(false)
    });
    return this.handleResponse(response);
  },

  getGalgo: async function (id) {
    var response = await fetch(API_URL + '/galgos/' + id, {
      headers: this.getHeaders(false)
    });
    return this.handleResponse(response);
  },

  getPistas: async function () {
    var response = await fetch(API_URL + '/pistas', {
      headers: this.getHeaders(false)
    });
    return this.handleResponse(response);
  },

  simularCarrera: async function (pista_id, galgo_ids, num_vueltas) {
    var response = await fetch(API_URL + '/carreras/simular', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ pista_id: pista_id, galgo_ids: galgo_ids, num_vueltas: num_vueltas })
    });
    return this.handleResponse(response);
  },

  programarCarrera: async function (pista_id, galgo_ids, num_vueltas) {
    var response = await fetch(API_URL + '/carreras/programar', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ pista_id: pista_id, galgo_ids: galgo_ids, num_vueltas: num_vueltas })
    });
    return this.handleResponse(response);
  },

  prepararJornada: async function () {
    var response = await fetch(API_URL + '/carreras/preparar-jornada', {
      method: 'POST',
      headers: this.getHeaders(false)
    });
    return this.handleResponse(response);
  },

  correrCarrera: async function (carrera_id) {
    var response = await fetch(API_URL + '/carreras/correr', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ carrera_id: carrera_id })
    });
    return this.handleResponse(response);
  },

  getCarreras: async function (filtros) {
    var query = '';
    if (filtros) {
      var params = [];
      if (filtros.estado) params.push('estado=' + filtros.estado);
      if (filtros.pista_id) params.push('pista_id=' + filtros.pista_id);
      if (params.length > 0) query = '?' + params.join('&');
    }
    var response = await fetch(API_URL + '/carreras' + query, {
      headers: this.getHeaders(false)
    });
    return this.handleResponse(response);
  },

  getCarrera: async function (id) {
    var response = await fetch(API_URL + '/carreras/' + id, {
      headers: this.getHeaders(false)
    });
    return this.handleResponse(response);
  },

  getVueltas: async function (carreraId, galgoId) {
    var query = galgoId ? '?galgo_id=' + galgoId : '';
    var response = await fetch(API_URL + '/carreras/' + carreraId + '/vueltas' + query, {
      headers: this.getHeaders(false)
    });
    return this.handleResponse(response);
  },

  apostar: async function (carrera_id, galgo_id, cantidad, tipo_apuesta) {
    var response = await fetch(API_URL + '/apuestas', {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({
        carrera_id: carrera_id,
        galgo_id: galgo_id,
        cantidad: cantidad,
        tipo_apuesta: tipo_apuesta
      })
    });
    return this.handleResponse(response);
  },

  getMisApuestas: async function (filtros) {
    var query = '';
    if (filtros) {
      var params = [];
      if (filtros.estado) params.push('estado=' + filtros.estado);
      if (filtros.tipo) params.push('tipo=' + filtros.tipo);
      if (params.length > 0) query = '?' + params.join('&');
    }
    var response = await fetch(API_URL + '/apuestas/mis-apuestas' + query, {
      headers: this.getHeaders(true)
    });
    return this.handleResponse(response);
  },

  getApuesta: async function (id) {
    var response = await fetch(API_URL + '/apuestas/' + id, {
      headers: this.getHeaders(true)
    });
    return this.handleResponse(response);
  },

  getRanking: async function (temporada) {
    var query = temporada ? '?temporada=' + temporada : '';
    var response = await fetch(API_URL + '/rankings' + query, {
      headers: this.getHeaders(false)
    });
    return this.handleResponse(response);
  },

  getRankingVueltaRapida: async function () {
    var response = await fetch(API_URL + '/rankings/vuelta-rapida', {
      headers: this.getHeaders(false)
    });
    return this.handleResponse(response);
  },

  getRankingApostadores: async function () {
    var response = await fetch(API_URL + '/rankings/apostadores', {
      headers: this.getHeaders(false)
    });
    return this.handleResponse(response);
  },

  getIncidentes: async function (filtros) {
    var query = '';
    if (filtros) {
      var params = [];
      if (filtros.galgo_id) params.push('galgo_id=' + filtros.galgo_id);
      if (filtros.carrera_id) params.push('carrera_id=' + filtros.carrera_id);
      if (filtros.tipo) params.push('tipo=' + filtros.tipo);
      if (filtros.gravedad) params.push('gravedad=' + filtros.gravedad);
      if (params.length > 0) query = '?' + params.join('&');
    }
    var response = await fetch(API_URL + '/incidentes' + query, {
      headers: this.getHeaders(false)
    });
    return this.handleResponse(response);
  },

  getEstadisticasIncidentes: async function () {
    var response = await fetch(API_URL + '/incidentes/estadisticas', {
      headers: this.getHeaders(false)
    });
    return this.handleResponse(response);
  },

  getMisMovimientos: async function (filtros) {
    var query = '';
    if (filtros && filtros.tipo) {
      query = '?tipo=' + filtros.tipo;
    }
    var response = await fetch(API_URL + '/transacciones/mis-movimientos' + query, {
      headers: this.getHeaders(true)
    });
    return this.handleResponse(response);
  }
};

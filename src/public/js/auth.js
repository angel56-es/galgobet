var isLoginMode = true;

function initAuth() {
  var token = localStorage.getItem('token');
  if (token) {
    ApiService.getPerfil().then(function () {
      window.location.href = '/dashboard.html';
    }).catch(function () {
      limpiarSesion();
    });
  }

  document.getElementById('btn-toggle-login').addEventListener('click', function () {
    setMode(true);
  });
  document.getElementById('btn-toggle-register').addEventListener('click', function () {
    setMode(false);
  });

  document.getElementById('form-login').addEventListener('submit', function (e) {
    e.preventDefault();
    handleLogin();
  });
  document.getElementById('form-register').addEventListener('submit', function (e) {
    e.preventDefault();
    handleRegister();
  });
}

function setMode(loginMode) {
  isLoginMode = loginMode;
  var loginForm = document.getElementById('form-login');
  var registerForm = document.getElementById('form-register');
  var btnLogin = document.getElementById('btn-toggle-login');
  var btnRegister = document.getElementById('btn-toggle-register');
  var errorMsg = document.getElementById('error-message');

  errorMsg.classList.remove('visible');
  errorMsg.textContent = '';

  if (isLoginMode) {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    btnLogin.classList.add('active');
    btnRegister.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    btnLogin.classList.remove('active');
    btnRegister.classList.add('active');
  }
}

function showError(msg) {
  var el = document.getElementById('error-message');
  el.textContent = msg;
  el.classList.add('visible');
}

function guardarSesion(token, usuario) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario_id', usuario.id || usuario._id);
  localStorage.setItem('usuario_nombre', usuario.nombre || '');
  localStorage.setItem('usuario_email', usuario.email || '');
}

async function handleLogin() {
  var email = document.getElementById('login-email').value.trim();
  var password = document.getElementById('login-password').value;

  if (!email || !password) {
    showError('Completa todos los campos');
    return;
  }

  try {
    var btnSubmit = document.querySelector('#form-login .btn-primary');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Entrando...';

    var data = await ApiService.login(email, password);
    guardarSesion(data.token, data.usuario);
    window.location.href = '/dashboard.html';
  } catch (error) {
    showError(error.message);
    var btnSubmit = document.querySelector('#form-login .btn-primary');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Iniciar Sesión';
  }
}

async function handleRegister() {
  var nombre = document.getElementById('register-nombre').value.trim();
  var email = document.getElementById('register-email').value.trim();
  var password = document.getElementById('register-password').value;
  var confirmPassword = document.getElementById('register-confirm').value;

  if (!nombre || !email || !password || !confirmPassword) {
    showError('Completa todos los campos');
    return;
  }
  if (password !== confirmPassword) {
    showError('Las contraseñas no coinciden');
    return;
  }
  if (password.length < 6) {
    showError('La contraseña debe tener al menos 6 caracteres');
    return;
  }

  try {
    var btnSubmit = document.querySelector('#form-register .btn-primary');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Registrando...';

    var data = await ApiService.register(nombre, email, password);
    guardarSesion(data.token, data.usuario);
    window.location.href = '/dashboard.html';
  } catch (error) {
    showError(error.message);
    var btnSubmit = document.querySelector('#form-register .btn-primary');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Registrarse';
  }
}

document.addEventListener('DOMContentLoaded', initAuth);

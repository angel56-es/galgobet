const { Router } = require('express');
const { register, login, getPerfil } = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/perfil', verificarToken, getPerfil);

module.exports = router;

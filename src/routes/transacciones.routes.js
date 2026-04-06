const { Router } = require('express');
const { getMisMovimientos } = require('../controllers/transacciones.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/mis-movimientos', verificarToken, getMisMovimientos);

module.exports = router;

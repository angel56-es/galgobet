const { Router } = require('express');
const { apostar, getMisApuestas, getById } = require('../controllers/apuestas.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/', verificarToken, apostar);
router.get('/mis-apuestas', verificarToken, getMisApuestas);
router.get('/:id', verificarToken, getById);

module.exports = router;

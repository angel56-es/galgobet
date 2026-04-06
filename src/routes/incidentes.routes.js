const { Router } = require('express');
const { getAll, getEstadisticas, getByGalgo } = require('../controllers/incidentes.controller');

const router = Router();

router.get('/', getAll);
router.get('/estadisticas', getEstadisticas);
router.get('/galgo/:id', getByGalgo);

module.exports = router;

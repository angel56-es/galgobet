const { Router } = require('express');
const { simular, programar, getAll, getById, getVueltas, prepararJornada, correrCarrera } = require('../controllers/carreras.controller');

const router = Router();

router.get('/', getAll);
router.post('/preparar-jornada', prepararJornada);
router.post('/correr', correrCarrera);
router.post('/simular', simular);
router.post('/programar', programar);
router.get('/:id', getById);
router.get('/:id/vueltas', getVueltas);

module.exports = router;

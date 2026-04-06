const { Router } = require('express');
const { getRanking, getRankingVueltaRapida, getRankingApostadores } = require('../controllers/rankings.controller');

const router = Router();

router.get('/', getRanking);
router.get('/vuelta-rapida', getRankingVueltaRapida);
router.get('/apostadores', getRankingApostadores);

module.exports = router;

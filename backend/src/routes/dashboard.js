const express = require('express');
const router = express.Router();
console.log('Dashboard Routes: Arquivo carregado');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, dashboardController.getDashboard);
router.get('/monthly-summary', authMiddleware, dashboardController.getMonthlySummary);

module.exports = router;
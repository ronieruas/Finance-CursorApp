const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

// Dashboard Analítico
router.get('/dashboard', authMiddleware, analyticsController.getAnalyticsDashboard);

module.exports = router; 
const express = require('express');
const router = express.Router();
console.log('exportRoutes.js loaded and routes being registered');
const exportController = require('../controllers/exportController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/statement', (req, res, next) => {
  console.log('Request to /export/statement received.');
  next();
}, exportController.exportAccountStatement);
router.get('/expenses', authMiddleware, exportController.exportExpenses);
router.get('/credit-card-expenses', exportController.exportCreditCardExpenses);

module.exports = router;
const express = require('express');
const router = express.Router();
const resumoController = require('../controllers/resumoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, resumoController.getResumo);

module.exports = router; 
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, notificationController.list);
router.put('/:id/read', authMiddleware, notificationController.markAsRead);

module.exports = router; 
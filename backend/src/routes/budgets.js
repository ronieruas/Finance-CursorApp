const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const budgetController = require('../controllers/budgetController');

router.get('/', authMiddleware, budgetController.list);
router.post('/', authMiddleware, budgetController.create);
router.put('/:id', authMiddleware, budgetController.update);
router.delete('/:id', authMiddleware, budgetController.remove);

module.exports = router; 
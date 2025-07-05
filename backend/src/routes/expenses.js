const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const expenseController = require('../controllers/expenseController');

router.get('/', authMiddleware, expenseController.list);
router.post('/', authMiddleware, expenseController.create);
router.put('/:id', authMiddleware, expenseController.update);
router.delete('/:id', authMiddleware, expenseController.remove);

module.exports = router; 
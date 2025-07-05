const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const incomeController = require('../controllers/incomeController');

router.get('/', authMiddleware, incomeController.list);
router.post('/', authMiddleware, incomeController.create);
router.put('/:id', authMiddleware, incomeController.update);
router.delete('/:id', authMiddleware, incomeController.remove);

module.exports = router; 
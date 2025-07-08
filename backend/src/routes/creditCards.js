const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const creditCardController = require('../controllers/creditCardController');

router.get('/', authMiddleware, creditCardController.list);
router.post('/', authMiddleware, creditCardController.create);
router.put('/:id', authMiddleware, creditCardController.update);
router.delete('/:id', authMiddleware, creditCardController.remove);
router.get('/limits', authMiddleware, creditCardController.limits);

module.exports = router; 
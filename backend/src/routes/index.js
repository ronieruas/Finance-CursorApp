const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');
const notificationController = require('../controllers/notificationController');

// Importar rotas de módulos
router.use('/auth', require('./auth'));
router.use('/accounts', require('./accounts'));
router.use('/users', require('./users'));
// router.use('/transactions', require('./transactions'));
router.use('/incomes', require('./incomes'));
router.use('/expenses', require('./expenses'));
router.use('/creditCards', require('./creditCards'));
router.use('/budgets', require('./budgets'));
router.use('/transfers', require('./transfers'));

router.get('/', (req, res) => {
  res.json({ status: 'API online' });
});

// Exemplo de rota protegida
router.get('/protegida', authMiddleware, (req, res) => {
  res.json({ mensagem: `Olá, usuário ${req.user.id}! Esta rota é protegida.` });
});

router.get('/dashboard', authMiddleware, dashboardController.getDashboard);
router.get('/notifications', authMiddleware, notificationController.list);
router.patch('/notifications/:id/read', authMiddleware, notificationController.markAsRead);

module.exports = router;
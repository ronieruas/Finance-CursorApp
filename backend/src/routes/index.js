const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');
const notificationController = require('../controllers/notificationController');

// Rotas públicas
router.use('/auth', require('./auth'));

// Middleware de autenticação para todas as rotas subsequentes
router.use(authMiddleware);

// Rotas protegidas
router.use('/accounts', require('./accounts'));
router.use('/users', require('./users'));
// router.use('/transactions', require('./transactions'));
router.use('/incomes', require('./incomes'));
router.use('/expenses', require('./expenses'));
router.use('/creditCards', require('./creditCards'));
router.use('/budgets', require('./budgets'));
router.use('/transfers', require('./transfers'));
router.use('/analytics', require('./analytics'));
router.use('/resumo', require('./resumo'));
router.use('/export', require('./exportRoutes'));
router.use('/dashboard', require('./dashboard'));

router.get('/notifications', notificationController.list);
router.patch('/notifications/:id/read', notificationController.markAsRead);

router.get('/test-export', (req, res) => {
  res.json({ status: 'Test export route is working' });
});

router.get('/', (req, res) => {
  res.json({ status: 'API online' });
});

// Exemplo de rota protegida
router.get('/protegida', (req, res) => {
  res.json({ mensagem: `Olá, usuário ${req.user.id}! Esta rota é protegida.` });
});

module.exports = router;
const express = require('express');
const router = express.Router();
console.log('Index Routes: Arquivo carregado');

const authMiddleware = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');
const notificationController = require('../controllers/notificationController');

// Rotas públicas
router.use('/auth', require('./auth'));



// Rotas protegidas
router.use('/accounts', authMiddleware, require('./accounts'));
router.use('/users', authMiddleware, require('./users'));
// router.use('/transactions', authMiddleware, require('./transactions'));
router.use('/incomes', authMiddleware, require('./incomes'));
router.use('/expenses', authMiddleware, require('./expenses'));
router.use('/creditCards', authMiddleware, require('./creditCards'));
router.use('/budgets', authMiddleware, require('./budgets'));
router.use('/transfers', authMiddleware, require('./transfers'));
router.use('/analytics', authMiddleware, require('./analytics'));
router.use('/resumo', authMiddleware, require('./resumo'));
router.use('/export', authMiddleware, require('./exportRoutes'));
router.use('/dashboard', authMiddleware, require('./dashboard'));

router.get('/notifications', authMiddleware, notificationController.list);
router.patch('/notifications/:id/read', authMiddleware, notificationController.markAsRead);

router.get('/test-export', (req, res) => {
  res.json({ status: 'Test export route is working' });
});

router.get('/', (req, res) => {
  res.json({ status: 'API online' });
});

router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Exemplo de rota protegida
router.get('/protegida', (req, res) => {
  res.json({ mensagem: `Olá, usuário ${req.user.id}! Esta rota é protegida.` });
});

module.exports = router;
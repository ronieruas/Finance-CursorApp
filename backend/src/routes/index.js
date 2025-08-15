console.log('Loading routes module...');

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');
const notificationController = require('../controllers/notificationController');

console.log('Loading routes...');

// Importar rotas de módulos
console.log('Loading auth routes...');
const authRoutes = require('./auth');
console.log('Auth routes loaded:', authRoutes);
router.use('/auth', authRoutes);
console.log('Auth routes mounted.');
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
console.log('Attempting to load exportRoutes');
router.use('/export', authMiddleware, require('./exportRoutes'));
console.log('Export routes loaded successfully.');

router.get('/test-export', (req, res) => {
  res.json({ status: 'Test export route is working' });
});

router.get('/', (req, res) => {
  res.json({ status: 'API online' });
});

// Exemplo de rota protegida
router.get('/protegida', authMiddleware, (req, res) => {
  res.json({ mensagem: `Olá, usuário ${req.user.id}! Esta rota é protegida.` });
});

router.use('/dashboard', authMiddleware, require('./dashboard'));
router.get('/notifications', authMiddleware, notificationController.list);
router.patch('/notifications/:id/read', authMiddleware, notificationController.markAsRead);

module.exports = router;
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');
const { processExpenses } = require('../scripts/processExpenses');

// Processar despesas automáticas (apenas admin)
router.post('/process-automatic', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem executar esta ação.' });
    }
    
    await processExpenses();
    res.json({ message: 'Processamento de despesas automáticas concluído com sucesso!' });
  } catch (err) {
    console.error('Erro ao processar despesas automáticas:', err);
    res.status(500).json({ error: 'Erro ao processar despesas automáticas.' });
  }
});

// Testar processamento (apenas admin)
router.post('/test-process', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem executar esta ação.' });
    }
    
    console.log('Teste de processamento iniciado...');
    await processExpenses();
    res.json({ message: 'Teste de processamento concluído com sucesso!' });
  } catch (err) {
    console.error('Erro no teste de processamento:', err);
    res.status(500).json({ error: 'Erro no teste de processamento.' });
  }
});

router.get('/', authMiddleware, expenseController.list);
router.post('/', authMiddleware, expenseController.create);
router.put('/:id', authMiddleware, expenseController.update);
router.delete('/:id', authMiddleware, expenseController.remove);
router.get('/categories', authMiddleware, expenseController.categories);

module.exports = router; 
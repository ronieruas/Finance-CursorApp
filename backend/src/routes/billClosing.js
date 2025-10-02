const express = require('express');
const router = express.Router();
const BillClosingService = require('../services/billClosingService');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * POST /api/bill-closing/process
 * Executa o processo de fechamento automático de faturas
 */
router.post('/process', authMiddleware, async (req, res) => {
  try {
    const result = await BillClosingService.processAutomaticClosing();
    res.json({
      success: true,
      message: 'Processo de fechamento executado com sucesso',
      ...result
    });
  } catch (error) {
    console.error('Erro no processo de fechamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * POST /api/bill-closing/card/:id
 * Executa o fechamento de fatura para um cartão específico
 */
router.post('/card/:id', authMiddleware, async (req, res) => {
  try {
    const { CreditCard } = require('../models');
    const card = await CreditCard.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Cartão não encontrado'
      });
    }
    
    const result = await BillClosingService.processCardBillClosing(card);
    res.json({
      success: true,
      message: result.closed ? 'Fatura fechada com sucesso' : 'Nenhuma fatura para fechar',
      ...result
    });
  } catch (error) {
    console.error('Erro no fechamento da fatura:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/bill-closing/should-close/:id
 * Verifica se uma fatura deve ser fechada
 */
router.get('/should-close/:id', authMiddleware, async (req, res) => {
  try {
    const shouldClose = await BillClosingService.shouldCloseBill(req.params.id);
    res.json({
      success: true,
      shouldClose,
      currentDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar fechamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { Transfer, Account, Expense } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');
const { Op } = require('sequelize');

// Listar transferências do usuário
router.get('/', authMiddleware, async (req, res) => {
  const transfers = await Transfer.findAll({ where: { user_id: req.user.id }, order: [['date', 'DESC']] });
  res.json(transfers);
});

// Criar transferência
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { from_account_id, to_account_id, value, description, date } = req.body;
    if (!from_account_id || !value || !date) return res.status(400).json({ error: 'Dados obrigatórios.' });
    // Verifica se conta origem existe e pertence ao usuário
    const from = await Account.findOne({ where: { id: from_account_id, user_id: req.user.id } });
    if (!from) return res.status(404).json({ error: 'Conta de origem não encontrada.' });
    if (Number(from.balance) < Number(value)) return res.status(400).json({ error: 'Saldo insuficiente.' });
    // Debita da origem
    from.balance = Number(from.balance) - Number(value);
    await from.save();
    let transfer;
    if (to_account_id) {
      // Transferência interna: credita na conta destino
      const to = await Account.findOne({ where: { id: to_account_id, user_id: req.user.id } });
      if (!to) return res.status(404).json({ error: 'Conta de destino não encontrada.' });
      to.balance = Number(to.balance) + Number(value);
      await to.save();
      transfer = await Transfer.create({ user_id: req.user.id, from_account_id, to_account_id, value, description, date });
    } else {
      // Transferência para terceiro: lança como despesa
      await Expense.create({
        user_id: req.user.id,
        account_id: from_account_id,
        description: description || 'Transferência para terceiro',
        value,
        due_date: date,
        category: 'Transferência',
        status: 'paga',
        paid_at: date,
      });
      transfer = await Transfer.create({ user_id: req.user.id, from_account_id, value, description, date });
    }
    res.status(201).json(transfer);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar transferência.' });
  }
});

module.exports = router; 
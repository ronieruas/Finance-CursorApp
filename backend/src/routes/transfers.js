const express = require('express');
const router = express.Router();
const { Transfer, Account, Expense } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');
const { Op } = require('sequelize');

// Listar transferências do usuário
router.get('/', authMiddleware, async (req, res) => {
  const { start, end, from_account_id, to_account_id, description } = req.query;
  const where = { user_id: req.user.id };
  if (start && end) where.date = { [Op.between]: [start, end] };
  if (from_account_id) where.from_account_id = from_account_id;
  if (to_account_id) where.to_account_id = to_account_id;
  if (description) where.description = { [Op.iLike]: `%${description}%` };
  const transfers = await Transfer.findAll({ where, order: [['date', 'DESC']] });
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
      // Transferência interna ou de terceiros: credita na conta destino
      const to = await Account.findOne({ where: { id: to_account_id, user_id: req.user.id } });
      if (!to) return res.status(404).json({ error: 'Conta de destino não encontrada.' });
      to.balance = Number(to.balance) + Number(value);
      await to.save();
      transfer = await Transfer.create({ user_id: req.user.id, from_account_id, to_account_id, value, description, date });
    } else {
      // Transferência para terceiro sem conta específica: não credita em nenhuma conta (já foi debitada da origem)
      transfer = await Transfer.create({ user_id: req.user.id, from_account_id, to_account_id: null, value, description, date });
    }
    res.status(201).json(transfer);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar transferência.' });
  }
});

// Editar transferência
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { from_account_id, to_account_id, value, date, description } = req.body;
    const transfer = await Transfer.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!transfer) return res.status(404).json({ error: 'Transferência não encontrada.' });
    // Reverter saldos antigos
    const fromOld = await Account.findOne({ where: { id: transfer.from_account_id, user_id: req.user.id } });
    if (fromOld) { fromOld.balance = Number(fromOld.balance) + Number(transfer.value); await fromOld.save(); }
    if (transfer.to_account_id) {
      const toOld = await Account.findOne({ where: { id: transfer.to_account_id, user_id: req.user.id } });
      if (toOld) { toOld.balance = Number(toOld.balance) - Number(transfer.value); await toOld.save(); }
    }
    // Aplicar novos saldos
    const fromNew = await Account.findOne({ where: { id: from_account_id, user_id: req.user.id } });
    if (!fromNew) return res.status(404).json({ error: 'Conta de origem não encontrada.' });
    if (Number(fromNew.balance) < Number(value)) return res.status(400).json({ error: 'Saldo insuficiente.' });
    fromNew.balance = Number(fromNew.balance) - Number(value);
    await fromNew.save();
    let toNew = null;
    if (to_account_id) {
      toNew = await Account.findOne({ where: { id: to_account_id, user_id: req.user.id } });
      if (!toNew) return res.status(404).json({ error: 'Conta de destino não encontrada.' });
      toNew.balance = Number(toNew.balance) + Number(value);
      await toNew.save();
    }
    await transfer.update({ from_account_id, to_account_id, value, date, description });
    res.json(transfer);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao editar transferência.' });
  }
});

// Remover transferência
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const transfer = await Transfer.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!transfer) return res.status(404).json({ error: 'Transferência não encontrada.' });
    // Reverter saldos
    const from = await Account.findOne({ where: { id: transfer.from_account_id, user_id: req.user.id } });
    if (from) { from.balance = Number(from.balance) + Number(transfer.value); await from.save(); }
    if (transfer.to_account_id) {
      const to = await Account.findOne({ where: { id: transfer.to_account_id, user_id: req.user.id } });
      if (to) { to.balance = Number(to.balance) - Number(transfer.value); await to.save(); }
    }
    await transfer.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover transferência.' });
  }
});

module.exports = router; 
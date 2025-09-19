const express = require('express');
const router = express.Router();
const { Transfer, Account, Expense } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// Listar transferências do usuário
router.get('/', authMiddleware, async (req, res) => {
  const { start, end, from_account_id, to_account_id, description, from_third_party, to_third_party } = req.query;
  const where = { user_id: req.user.id };
  if (start && end) where.date = { [Op.between]: [start, end] };
  if (from_account_id) where.from_account_id = from_account_id;
  if (to_account_id) where.to_account_id = to_account_id;
  if (from_third_party === 'true') where.from_account_id = null;
  if (to_third_party === 'true') where.to_account_id = null;
  if (description) where.description = { [Op.iLike]: `%${description}%` };
  const transfers = await Transfer.findAll({ where, order: [['date', 'DESC']] });
  res.json(transfers);
});

// Criar transferência
router.post('/', authMiddleware, async (req, res) => {
  try {
    // console.log('Dados recebidos para transferência: [REDACTED]');
    const { from_account_id, to_account_id, value, description, date, is_third_party } = req.body;
    if (!value || !date) return res.status(400).json({ error: 'Dados obrigatórios.' });
    
    // Para transferência de terceiros, to_account_id pode ser null
    // Para transferência de terceiros, from_account_id pode ser null
    // Para transferência interna, ambos devem ser preenchidos
    if (!from_account_id && !to_account_id) {
      return res.status(400).json({ error: 'Pelo menos uma conta (origem ou destino) deve ser selecionada.' });
    }
    
    let transfer;
    
    if (!from_account_id) {
      // Transferência de terceiros para conta cadastrada
      console.log('Criando transferência de terceiros para conta:', to_account_id);
      const to = await Account.findOne({ where: { id: to_account_id, user_id: req.user.id } });
      if (!to) return res.status(404).json({ error: 'Conta de destino não encontrada.' });
      console.log('Conta de destino encontrada:', to.id);
      to.balance = Number(to.balance) + Number(value);
      await to.save();
      // saldo atualizado (omitido dos logs)
      transfer = await Transfer.create({ user_id: req.user.id, from_account_id: null, to_account_id, value, description, date });
      console.log('Transferência criada:', transfer.id);
    } else if (!to_account_id) {
      // Transferência de conta cadastrada para terceiros
      console.log('Criando transferência de conta para terceiros:', from_account_id);
      const from = await Account.findOne({ where: { id: from_account_id, user_id: req.user.id } });
      if (!from) return res.status(404).json({ error: 'Conta de origem não encontrada.' });
      if (Number(from.balance) < Number(value)) return res.status(400).json({ error: 'Saldo insuficiente.' });
      
      console.log('Conta de origem encontrada:', from.id);
      from.balance = Number(from.balance) - Number(value);
      await from.save();
      // saldo atualizado (omitido dos logs)
      transfer = await Transfer.create({ user_id: req.user.id, from_account_id, to_account_id: null, value, description, date });
      console.log('Transferência criada:', transfer.id);
    } else {
      // Transferência interna: debita da origem e credita na destino
      console.log('Criando transferência interna de', from_account_id, 'para', to_account_id);
      const from = await Account.findOne({ where: { id: from_account_id, user_id: req.user.id } });
      if (!from) return res.status(404).json({ error: 'Conta de origem não encontrada.' });
      if (Number(from.balance) < Number(value)) return res.status(400).json({ error: 'Saldo insuficiente.' });
      
      const to = await Account.findOne({ where: { id: to_account_id, user_id: req.user.id } });
      if (!to) return res.status(404).json({ error: 'Conta de destino não encontrada.' });
      
      console.log('Conta de origem:', from.id);
      console.log('Conta de destino:', to.id);
      
      // Debita da origem
      from.balance = Number(from.balance) - Number(value);
      await from.save();
      console.log('Saldo da origem atualizado para:', from.balance);
      
      // Credita na destino
      to.balance = Number(to.balance) + Number(value);
      await to.save();
      console.log('Saldo da destino atualizado para:', to.balance);
      
      transfer = await Transfer.create({ user_id: req.user.id, from_account_id, to_account_id, value, description, date });
      console.log('Transferência interna criada:', transfer.id);
    }
    
    res.status(201).json(transfer);
  } catch (err) {
    console.error('Erro ao criar transferência:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Erro ao registrar transferência.', details: err.message });
  }
});

// Editar transferência
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { from_account_id, to_account_id, value, date, description, is_third_party } = req.body;
    const transfer = await Transfer.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!transfer) return res.status(404).json({ error: 'Transferência não encontrada.' });
    
    // Reverter saldos antigos
    if (transfer.from_account_id) {
      const fromOld = await Account.findOne({ where: { id: transfer.from_account_id, user_id: req.user.id } });
      if (fromOld) { fromOld.balance = Number(fromOld.balance) + Number(transfer.value); await fromOld.save(); }
    }
    if (transfer.to_account_id) {
      const toOld = await Account.findOne({ where: { id: transfer.to_account_id, user_id: req.user.id } });
      if (toOld) { toOld.balance = Number(toOld.balance) - Number(transfer.value); await toOld.save(); }
    }
    
    // Aplicar novos saldos
    if (!from_account_id) {
      // Transferência de terceiros para conta cadastrada
      const toNew = await Account.findOne({ where: { id: to_account_id, user_id: req.user.id } });
      if (!toNew) return res.status(404).json({ error: 'Conta de destino não encontrada.' });
      toNew.balance = Number(toNew.balance) + Number(value);
      await toNew.save();
      await transfer.update({ from_account_id: null, to_account_id, value, date, description });
    } else if (!to_account_id) {
      // Transferência de conta cadastrada para terceiros
      const fromNew = await Account.findOne({ where: { id: from_account_id, user_id: req.user.id } });
      if (!fromNew) return res.status(404).json({ error: 'Conta de origem não encontrada.' });
      if (Number(fromNew.balance) < Number(value)) return res.status(400).json({ error: 'Saldo insuficiente.' });
      
      fromNew.balance = Number(fromNew.balance) - Number(value);
      await fromNew.save();
      await transfer.update({ from_account_id, to_account_id: null, value, date, description });
    } else {
      // Transferência interna: debita da origem e credita na destino
      const fromNew = await Account.findOne({ where: { id: from_account_id, user_id: req.user.id } });
      if (!fromNew) return res.status(404).json({ error: 'Conta de origem não encontrada.' });
      if (Number(fromNew.balance) < Number(value)) return res.status(400).json({ error: 'Saldo insuficiente.' });
      
      const toNew = await Account.findOne({ where: { id: to_account_id, user_id: req.user.id } });
      if (!toNew) return res.status(404).json({ error: 'Conta de destino não encontrada.' });
      
      fromNew.balance = Number(fromNew.balance) - Number(value);
      await fromNew.save();
      
      toNew.balance = Number(toNew.balance) + Number(value);
      await toNew.save();
      
      await transfer.update({ from_account_id, to_account_id, value, date, description });
    }
    
    res.json(transfer);
  } catch (err) {
    console.error('Erro ao editar transferência:', err);
    res.status(500).json({ error: 'Erro ao editar transferência.', details: err.message });
  }
});

// Remover transferência
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const transfer = await Transfer.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!transfer) return res.status(404).json({ error: 'Transferência não encontrada.' });
    
    // Reverter saldos
    if (transfer.from_account_id) {
      const from = await Account.findOne({ where: { id: transfer.from_account_id, user_id: req.user.id } });
      if (from) { from.balance = Number(from.balance) + Number(transfer.value); await from.save(); }
    }
    if (transfer.to_account_id) {
      const to = await Account.findOne({ where: { id: transfer.to_account_id, user_id: req.user.id } });
      if (to) { to.balance = Number(to.balance) - Number(transfer.value); await to.save(); }
    }
    
    await transfer.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao remover transferência:', err);
    res.status(500).json({ error: 'Erro ao remover transferência.', details: err.message });
  }
});

module.exports = router;
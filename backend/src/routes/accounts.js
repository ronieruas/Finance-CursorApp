const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { Account } = require('../models');

// Listar contas do usuário autenticado
router.get('/', authMiddleware, async (req, res) => {
  const accounts = await Account.findAll({ where: { user_id: req.user.id } });
  res.json(accounts);
});

// Criar nova conta
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, bank, type, balance, currency } = req.body;
    const account = await Account.create({
      user_id: req.user.id,
      name,
      bank,
      type,
      balance: balance || 0,
      currency: currency || 'BRL',
    });
    res.status(201).json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Editar conta
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, bank, type, balance, status, currency } = req.body;
    const account = await Account.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!account) return res.status(404).json({ error: 'Conta não encontrada' });
    await account.update({ name, bank, type, balance, status, currency });
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Deletar conta
router.delete('/:id', authMiddleware, async (req, res) => {
  const account = await Account.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!account) return res.status(404).json({ error: 'Conta não encontrada' });
  await account.destroy();
  res.json({ success: true });
});

module.exports = router; 
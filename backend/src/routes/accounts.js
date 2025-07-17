const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { Account } = require('../models');

// Listar contas do usuário autenticado
router.get('/', authMiddleware, async (req, res) => {
  const { start, end } = req.query;
  const { Op } = require('sequelize');
  const Income = require('../models/income');
  const Expense = require('../models/expense');
  const accounts = await Account.findAll({ where: { user_id: req.user.id } });
  // Para cada conta, calcular saldo
  const contasComSaldo = await Promise.all(accounts.map(async (acc) => {
    let saldo = Number(acc.balance);
    if (start && end) {
      // Saldo inicial (antes do período)
      const receitasAntes = await Income.sum('value', {
        where: {
          user_id: req.user.id,
          account_id: acc.id,
          date: { [Op.lt]: new Date(start) },
        },
      }) || 0;
      const despesasAntes = await Expense.sum('value', {
        where: {
          user_id: req.user.id,
          account_id: acc.id,
          due_date: { [Op.lt]: new Date(start) },
        },
      }) || 0;
      const saldoInicial = Number(acc.balance) + Number(receitasAntes) - Number(despesasAntes);
      // Receitas e despesas do período
      const receitasPeriodo = await Income.sum('value', {
        where: {
          user_id: req.user.id,
          account_id: acc.id,
          date: { [Op.between]: [new Date(start), new Date(end)] },
        },
      }) || 0;
      const despesasPeriodo = await Expense.sum('value', {
        where: {
          user_id: req.user.id,
          account_id: acc.id,
          due_date: { [Op.between]: [new Date(start), new Date(end)] },
        },
      }) || 0;
      saldo = saldoInicial + Number(receitasPeriodo) - Number(despesasPeriodo);
    }
    return { ...acc.toJSON(), saldo_calculado: saldo };
  }));
  res.json(contasComSaldo);
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

// Novo endpoint: saldo calculado da conta
router.get('/:id/saldo', authMiddleware, async (req, res) => {
  try {
    const { start, end } = req.query;
    const accountId = req.params.id;
    const userId = req.user.id;
    const { Op } = require('sequelize');
    const Account = require('../models/account');
    const Income = require('../models/income');
    const Expense = require('../models/expense');

    // Busca conta
    const account = await Account.findOne({ where: { id: accountId, user_id: userId } });
    if (!account) return res.status(404).json({ error: 'Conta não encontrada' });

    // Período
    let today = new Date();
    let firstDay = start ? new Date(start) : new Date(today.getFullYear(), today.getMonth(), 1);
    let lastDay = end ? new Date(end) : new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Saldo inicial (antes do período)
    // Soma todas as receitas e despesas anteriores ao período
    const receitasAntes = await Income.sum('value', {
      where: {
        user_id: userId,
        account_id: accountId,
        date: { [Op.lt]: firstDay },
      },
    }) || 0;
    const despesasAntes = await Expense.sum('value', {
      where: {
        user_id: userId,
        account_id: accountId,
        due_date: { [Op.lt]: firstDay },
      },
    }) || 0;
    const saldoInicial = Number(account.balance) + Number(receitasAntes) - Number(despesasAntes);

    // Receitas e despesas do período
    const receitasPeriodo = await Income.sum('value', {
      where: {
        user_id: userId,
        account_id: accountId,
        date: { [Op.between]: [firstDay, lastDay] },
      },
    }) || 0;
    const despesasPeriodo = await Expense.sum('value', {
      where: {
        user_id: userId,
        account_id: accountId,
        due_date: { [Op.between]: [firstDay, lastDay] },
      },
    }) || 0;

    // Saldo final
    const saldo = saldoInicial + Number(receitasPeriodo) - Number(despesasPeriodo);

    res.json({
      saldo_inicial: saldoInicial,
      receitas: Number(receitasPeriodo),
      despesas: Number(despesasPeriodo),
      saldo: saldo
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao calcular saldo da conta', details: err.message });
  }
});

module.exports = router; 
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
      saldo = Number(acc.balance) + Number(receitasPeriodo) - Number(despesasPeriodo);
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

// Extrato da conta: receitas, despesas e transferências, por período
router.get('/:id/extrato', authMiddleware, async (req, res) => {
  try {
    const { start, end } = req.query;
    const accountId = req.params.id;
    const userId = req.user.id;
    const { Op } = require('sequelize');
    const Income = require('../models/income');
    const Expense = require('../models/expense');
    const Transfer = require('../models/transfer');

    // Verifica se a conta existe e pertence ao usuário
    const account = await require('../models/account').findOne({ where: { id: accountId, user_id: userId } });
    if (!account) return res.status(404).json({ error: 'Conta não encontrada' });

    // Define período
    let firstDay = start ? new Date(start) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    let lastDay = end ? new Date(end) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    // Receitas da conta
    const receitas = await Income.findAll({
      where: {
        user_id: userId,
        account_id: accountId,
        date: { [Op.gte]: firstDay, [Op.lte]: lastDay },
      },
      order: [['date', 'ASC']],
    });

    // Despesas da conta: somente pagas, filtradas por paid_at
    const despesasPagas = await Expense.findAll({
      where: {
        user_id: userId,
        account_id: accountId,
        status: 'paga',
        paid_at: { [Op.gte]: firstDay, [Op.lte]: lastDay },
      },
      order: [['paid_at', 'ASC']],
    });

    // Transferências de saída (débito)
    const transferenciasSaida = await Transfer.findAll({
      where: {
        user_id: userId,
        from_account_id: accountId,
        date: { [Op.gte]: firstDay, [Op.lte]: lastDay },
      },
      order: [['date', 'ASC']],
    });

    // Transferências de entrada (crédito)
    const transferenciasEntrada = await Transfer.findAll({
      where: {
        user_id: userId,
        to_account_id: accountId,
        date: { [Op.gte]: firstDay, [Op.lte]: lastDay },
      },
      order: [['date', 'ASC']],
    });

    // Pagamentos de cartão de crédito
    const CreditCardPayment = require('../models/creditCardPayment');
    const CreditCard = require('../models/creditCard');
    const pagamentosCartao = await CreditCardPayment.findAll({
      where: {
        user_id: userId,
        account_id: accountId,
        payment_date: { [Op.gte]: firstDay, [Op.lte]: lastDay },
      },
      order: [['payment_date', 'ASC']],
    });
    
    // Buscar nomes dos cartões
    const cardIds = pagamentosCartao.map(p => p.card_id);
    const cartoes = await CreditCard.findAll({
      where: { id: { [Op.in]: cardIds } },
      attributes: ['id', 'name']
    });
    const cartoesMap = {};
    cartoes.forEach(c => { cartoesMap[c.id] = c.name; });

    // Função para formatar data dd/mm/aaaa
    function formatDateBR(dateStr, transactionType = null) {
      const d = new Date(dateStr);
      
      // Ajuste de data para diferentes tipos de transação
      let dateToFormat = d;
      if (transactionType === 'transferencia') {
        // Para transferências, adicionamos um dia
        dateToFormat = new Date(d);
        dateToFormat.setDate(dateToFormat.getDate() + 1);
      } else if (transactionType === 'receita') {
        // Para receitas, também adicionamos um dia para corrigir o problema de fuso horário
        dateToFormat = new Date(d);
        dateToFormat.setDate(dateToFormat.getDate() + 1);
      }
      // Para outros tipos (despesa, pagamento_cartao), mantemos a data original
      
      const day = String(dateToFormat.getDate()).padStart(2, '0');
      const month = String(dateToFormat.getMonth() + 1).padStart(2, '0');
      const year = dateToFormat.getFullYear();
      return `${day}/${month}/${year}`;
    }

    // Monta extrato unificado
    const extrato = [
      ...receitas.map(r => ({
        tipo: 'receita',
        id: r.id,
        descricao: r.description,
        valor: Number(r.value),
        data: formatDateBR(r.date, 'receita'),
        categoria: r.category,
      })),
      ...despesasPagas.map(d => ({
        tipo: 'despesa',
        id: d.id,
        descricao: d.description,
        valor: -Number(d.value),
        data: formatDateBR(d.paid_at, 'despesa'),
        categoria: d.category,
      })),
      ...transferenciasSaida.map(t => ({
        tipo: 'transferencia_saida',
        id: t.id,
        descricao: t.description || 'Transferência enviada',
        valor: -Number(t.value),
        data: formatDateBR(t.date, 'transferencia'),
        categoria: 'Transferência',
      })),
      ...transferenciasEntrada.map(t => ({
        tipo: 'transferencia_entrada',
        id: t.id,
        descricao: t.description || 'Transferência recebida',
        valor: Number(t.value),
        data: formatDateBR(t.date, 'transferencia'),
        categoria: 'Transferência',
      })),
      ...pagamentosCartao.map(p => ({
        tipo: 'pagamento_cartao',
        id: p.id,
        // Descrição do pagamento de fatura (mantida única origem: CreditCardPayment)
        descricao: `Fatura Cartão ${cartoesMap[p.card_id] || 'Desconhecido'}`,
        valor: -Number(p.value),
        data: formatDateBR(p.payment_date, 'pagamento_cartao'),
        categoria: 'Cartão de Crédito',
      })),
    ];

    // Ordena por data (mais antigo primeiro)
    extrato.sort((a, b) => {
      const [da, ma, aa] = a.data.split('/');
      const [db, mb, ab] = b.data.split('/');
      return new Date(`${aa}-${ma}-${da}`) - new Date(`${ab}-${mb}-${db}`);
    });

    res.json({ extrato });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar extrato da conta', details: err.message });
  }
});

module.exports = router;
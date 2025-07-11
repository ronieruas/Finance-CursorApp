const { Expense, CreditCard, CreditCardTransaction, Account } = require('../models');

exports.list = async (req, res) => {
  const { start, end, type, account_id, credit_card_id, category, status } = req.query;
  const where = { user_id: req.user.id };
  if (start && end) {
    where.due_date = { [require('sequelize').Op.between]: [start, end] };
  }
  if (type === 'conta') {
    where.account_id = { [require('sequelize').Op.ne]: null };
    where.credit_card_id = null;
  } else if (type === 'cartao') {
    where.credit_card_id = { [require('sequelize').Op.ne]: null };
  }
  if (account_id) {
    where.account_id = account_id;
  }
  if (credit_card_id) {
    where.credit_card_id = credit_card_id;
  }
  if (category) {
    where.category = category;
  }
  if (status) {
    where.status = status;
  }
  const expenses = await Expense.findAll({ where });
  res.json(expenses);
};

exports.create = async (req, res) => {
  try {
    const { type, account_id, credit_card_id, description, value, due_date, category, status, is_recurring, auto_debit, paid_at, installment_type, installment_total } = req.body;
    // Validação de due_date
    if (!due_date || isNaN(new Date(due_date).getTime())) {
      return res.status(400).json({ error: 'Data de vencimento (due_date) inválida ou ausente.' });
    }
    if (type === 'cartao') {
      // Lançamento em cartão de crédito
      const totalParcelas = installment_type === 'parcelado' ? Number(installment_total) : 1;
      const valorParcela = Number(value) / totalParcelas;
      let despesas = [];
      for (let i = 1; i <= totalParcelas; i++) {
        const dataParcela = new Date(due_date);
        dataParcela.setMonth(dataParcela.getMonth() + (i - 1));
        const safeStatus = typeof status !== 'undefined' && status !== null ? status : 'pendente';
        const safePaidAt = typeof paid_at !== 'undefined' ? paid_at : null;
        const expense = await Expense.create({
          user_id: req.user.id,
          credit_card_id,
          description: `${description}${totalParcelas > 1 ? ` (${i}/${totalParcelas})` : ''}`,
          value: valorParcela,
          due_date: dataParcela,
          category,
          status: safeStatus,
          is_recurring: !!is_recurring,
          auto_debit: !!auto_debit,
          paid_at: safePaidAt,
          installment_number: i,
          installment_total: totalParcelas
        });
        await CreditCardTransaction.create({
          card_id: credit_card_id,
          user_id: req.user.id,
          description: expense.description,
          value: valorParcela,
          date: dataParcela,
          category,
          installment_number: i,
          installment_total: totalParcelas
        });
        despesas.push(expense);
      }
      // Deduzir limite do cartão (simples: valor total)
      const card = await CreditCard.findOne({ where: { id: credit_card_id, user_id: req.user.id } });
      if (card) {
        card.limit_value = Number(card.limit_value) - Number(value);
        await card.save();
      }
      return res.status(201).json(despesas);
    } else {
      // Lançamento em conta normal
      const expense = await Expense.create({
        user_id: req.user.id,
        account_id,
        description,
        value,
        due_date,
        category,
        status,
        is_recurring: !!is_recurring,
        auto_debit: !!auto_debit,
        paid_at
      });
      // Deduzir valor do saldo da conta
      if (account_id) {
        const account = await Account.findOne({ where: { id: account_id, user_id: req.user.id } });
        if (account) {
          account.balance = Number(account.balance) - Number(value);
          await account.save();
        }
      }
      return res.status(201).json(expense);
    }
  } catch (err) {
    console.error('Erro ao criar despesa:', err);
    if (err && err.message) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(400).json({ error: 'Erro desconhecido ao criar despesa.' });
    }
  }
};

exports.update = async (req, res) => {
  try {
    const { description, value, due_date, category, status, is_recurring, auto_debit, paid_at } = req.body;
    const expense = await Expense.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!expense) return res.status(404).json({ error: 'Despesa não encontrada' });
    // Ajustar saldo da conta se for despesa de conta
    if (expense.account_id) {
      const account = await Account.findOne({ where: { id: expense.account_id, user_id: req.user.id } });
      if (account) {
        // Devolve o valor antigo
        account.balance = Number(account.balance) + Number(expense.value);
        // Deduz o novo valor
        account.balance = Number(account.balance) - Number(value);
        await account.save();
      }
    }
    await expense.update({ description, value, due_date, category, status, is_recurring, auto_debit, paid_at });
    res.json(expense);
  } catch (err) {
    console.error('Erro ao editar despesa:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const expense = await Expense.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!expense) return res.status(404).json({ error: 'Despesa não encontrada' });
  // Devolver valor ao saldo da conta se for despesa de conta
  if (expense.account_id) {
    const account = await Account.findOne({ where: { id: expense.account_id, user_id: req.user.id } });
    if (account) {
      account.balance = Number(account.balance) + Number(expense.value);
      await account.save();
    }
  }
  await expense.destroy();
  res.json({ success: true });
};

exports.categories = async (req, res) => {
  const categories = await Expense.findAll({
    where: { user_id: req.user.id },
    attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('category')), 'category']],
    order: [['category', 'ASC']]
  });
  res.json(categories.map(c => c.category).filter(Boolean));
}; 
const { Expense, CreditCard, CreditCardTransaction } = require('../models');

exports.list = async (req, res) => {
  const expenses = await Expense.findAll({ where: { user_id: req.user.id } });
  res.json(expenses);
};

exports.create = async (req, res) => {
  try {
    const { type, account_id, credit_card_id, description, value, due_date, category, status, is_recurring, auto_debit, paid_at, installment_type, installment_total } = req.body;
    if (type === 'cartao') {
      // Lançamento em cartão de crédito
      const totalParcelas = installment_type === 'parcelado' ? Number(installment_total) : 1;
      const valorParcela = Number(value) / totalParcelas;
      let despesas = [];
      for (let i = 1; i <= totalParcelas; i++) {
        const dataParcela = new Date(due_date);
        dataParcela.setMonth(dataParcela.getMonth() + (i - 1));
        const expense = await Expense.create({
          user_id: req.user.id,
          credit_card_id,
          description: `${description}${totalParcelas > 1 ? ` (${i}/${totalParcelas})` : ''}`,
          value: valorParcela,
          due_date: dataParcela,
          category,
          status,
          is_recurring: !!is_recurring,
          auto_debit: !!auto_debit,
          paid_at,
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
      return res.status(201).json(expense);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { description, value, due_date, category, status, is_recurring, auto_debit, paid_at } = req.body;
    const expense = await Expense.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!expense) return res.status(404).json({ error: 'Despesa não encontrada' });
    await expense.update({ description, value, due_date, category, status, is_recurring, auto_debit, paid_at });
    res.json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const expense = await Expense.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!expense) return res.status(404).json({ error: 'Despesa não encontrada' });
  await expense.destroy();
  res.json({ success: true });
}; 
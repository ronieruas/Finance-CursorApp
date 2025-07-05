const { Expense } = require('../models');

exports.list = async (req, res) => {
  const expenses = await Expense.findAll({ where: { user_id: req.user.id } });
  res.json(expenses);
};

exports.create = async (req, res) => {
  try {
    const { account_id, description, value, due_date, category, status, is_recurring, auto_debit, paid_at } = req.body;
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
      paid_at,
    });
    res.status(201).json(expense);
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
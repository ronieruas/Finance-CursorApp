const { Budget } = require('../models');

exports.list = async (req, res) => {
  const budgets = await Budget.findAll({ where: { user_id: req.user.id } });
  res.json(budgets);
};

exports.create = async (req, res) => {
  try {
    const { name, type, period_start, period_end, planned_value } = req.body;
    const budget = await Budget.create({
      user_id: req.user.id,
      name,
      type,
      period_start,
      period_end,
      planned_value,
    });
    res.status(201).json(budget);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, type, period_start, period_end, planned_value } = req.body;
    const budget = await Budget.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!budget) return res.status(404).json({ error: 'Orçamento não encontrado' });
    await budget.update({ name, type, period_start, period_end, planned_value });
    res.json(budget);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const budget = await Budget.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!budget) return res.status(404).json({ error: 'Orçamento não encontrado' });
  await budget.destroy();
  res.json({ success: true });
}; 
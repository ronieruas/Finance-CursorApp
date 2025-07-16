const { Income } = require('../models');
const Account = require('../models/account');

exports.list = async (req, res) => {
  const incomes = await Income.findAll({ where: { user_id: req.user.id } });
  res.json(incomes);
};

exports.create = async (req, res) => {
  try {
    const { account_id, description, value, date, category, is_recurring } = req.body;
    const income = await Income.create({
      user_id: req.user.id,
      account_id,
      description,
      value,
      date,
      category,
      is_recurring: !!is_recurring,
    });
    // Atualiza saldo da conta, se account_id informado
    if (account_id) {
      const account = await Account.findOne({ where: { id: account_id, user_id: req.user.id } });
      if (account) {
        account.balance = Number(account.balance) + Number(value);
        await account.save();
      }
    }
    res.status(201).json(income);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { description, value, date, category, is_recurring } = req.body;
    const income = await Income.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!income) return res.status(404).json({ error: 'Receita não encontrada' });
    await income.update({ description, value, date, category, is_recurring });
    res.json(income);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const income = await Income.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!income) return res.status(404).json({ error: 'Receita não encontrada' });
  await income.destroy();
  res.json({ success: true });
}; 
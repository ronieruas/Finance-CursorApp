const { CreditCard } = require('../models');

exports.list = async (req, res) => {
  const cards = await CreditCard.findAll({ where: { user_id: req.user.id } });
  res.json(cards);
};

exports.create = async (req, res) => {
  try {
    const { bank, brand, limit_value, due_day, closing_day, name, status } = req.body;
    const card = await CreditCard.create({
      user_id: req.user.id,
      bank,
      brand,
      limit_value,
      due_day,
      closing_day,
      name,
      status,
    });
    res.status(201).json(card);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { bank, brand, limit_value, due_day, closing_day, name, status } = req.body;
    const card = await CreditCard.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!card) return res.status(404).json({ error: 'Cartão não encontrado' });
    await card.update({ bank, brand, limit_value, due_day, closing_day, name, status });
    res.json(card);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const card = await CreditCard.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!card) return res.status(404).json({ error: 'Cartão não encontrado' });
  await card.destroy();
  res.json({ success: true });
}; 
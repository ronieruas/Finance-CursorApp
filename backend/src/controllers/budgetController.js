const { Budget, Expense, CreditCard } = require('../models');
const { Op } = require('sequelize');

exports.list = async (req, res) => {
  const budgets = await Budget.findAll({ 
    where: { user_id: req.user.id },
    include: [
      { model: CreditCard, as: 'credit_card', attributes: ['name', 'bank'] }
    ]
  });
  // Calcular valor utilizado para cada orçamento
  const budgetsWithUtilizado = await Promise.all(budgets.map(async (budget) => {
    let utilizado = 0;
    if (budget.type === 'geral') {
      utilizado = await Expense.sum('value', {
        where: {
          user_id: req.user.id,
          due_date: { [Op.between]: [budget.period_start, budget.period_end] },
          status: { [Op.ne]: 'paga' }, // Excluir despesas já pagas
        },
      });
    } else if (budget.type === 'cartao') {
      // Se tem credit_card_id específico, filtrar por esse cartão
      const whereClause = {
        user_id: req.user.id,
        due_date: { [Op.between]: [budget.period_start, budget.period_end] },
        credit_card_id: { [Op.ne]: null },
        status: { [Op.ne]: 'paga' }, // Excluir despesas já pagas
      };
      
      if (budget.credit_card_id) {
        whereClause.credit_card_id = budget.credit_card_id;
      }
      
      utilizado = await Expense.sum('value', { where: whereClause });
    }
    return {
      ...budget.toJSON(),
      utilizado: utilizado || 0
    };
  }));
  res.json(budgetsWithUtilizado);
};

exports.create = async (req, res) => {
  try {
    const { name, type, credit_card_id, period_start, period_end, planned_value } = req.body;
    const budget = await Budget.create({
      user_id: req.user.id,
      name,
      type,
      credit_card_id: type === 'cartao' ? credit_card_id : null,
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
    const { name, type, credit_card_id, period_start, period_end, planned_value } = req.body;
    const budget = await Budget.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!budget) return res.status(404).json({ error: 'Orçamento não encontrado' });
    await budget.update({ 
      name, 
      type, 
      credit_card_id: type === 'cartao' ? credit_card_id : null,
      period_start, 
      period_end, 
      planned_value 
    });
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
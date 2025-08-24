const { Income } = require('../models');
const Account = require('../models/account');

// Helper: retorna true se a data (DATEONLY ou Date) for hoje ou passada
function isEffective(dateInput) {
  if (!dateInput) return false;
  let d;
  if (dateInput instanceof Date) {
    d = new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  } else if (typeof dateInput === 'string') {
    // dateInput esperado como 'YYYY-MM-DD'
    const [y, m, day] = dateInput.split('-').map(Number);
    d = new Date(y, (m || 1) - 1, day || 1);
  } else {
    d = new Date(dateInput);
    if (!isFinite(d)) return false;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d.getTime() <= today.getTime();
}

exports.list = async (req, res) => {
  const { start, end } = req.query;
  const where = { user_id: req.user.id };
  const { Op } = require('sequelize');
  if (start && end) {
    where.date = { [Op.gte]: start, [Op.lte]: end };
  }
  const incomes = await Income.findAll({ where });
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
    // Atualiza saldo da conta somente se a data for hoje ou passada
    if (account_id) {
      const account = await Account.findOne({ where: { id: account_id, user_id: req.user.id } });
      if (account && isEffective(date)) {
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
    const { description, value, date, category, is_recurring, account_id } = req.body;
    const income = await Income.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!income) return res.status(404).json({ error: 'Receita não encontrada' });

    // Valores originais
    const origAccountId = income.account_id;
    const origValue = Number(income.value);
    const origDate = income.date;

    // Novos valores (mantém original se não enviado)
    const newAccountId = account_id !== undefined ? account_id : origAccountId;
    const newValue = value !== undefined ? Number(value) : origValue;
    const newDate = date !== undefined ? date : origDate;

    const wasEffective = isEffective(origDate);
    const willBeEffective = isEffective(newDate);

    // Ajuste de saldo conforme alterações
    if (origAccountId !== newAccountId) {
      // Conta mudou
      if (wasEffective && origAccountId) {
        const accOld = await Account.findOne({ where: { id: origAccountId, user_id: req.user.id } });
        if (accOld) {
          accOld.balance = Number(accOld.balance) - origValue;
          await accOld.save();
        }
      }
      if (willBeEffective && newAccountId) {
        const accNew = await Account.findOne({ where: { id: newAccountId, user_id: req.user.id } });
        if (accNew) {
          accNew.balance = Number(accNew.balance) + newValue;
          await accNew.save();
        }
      }
    } else {
      // Mesma conta
      if (origAccountId) {
        const acc = await Account.findOne({ where: { id: origAccountId, user_id: req.user.id } });
        if (acc) {
          if (wasEffective && willBeEffective) {
            const delta = newValue - origValue;
            if (delta !== 0) {
              acc.balance = Number(acc.balance) + delta;
              await acc.save();
            }
          } else if (wasEffective && !willBeEffective) {
            // Estava aplicado e deixará de estar
            acc.balance = Number(acc.balance) - origValue;
            await acc.save();
          } else if (!wasEffective && willBeEffective) {
            // Não estava aplicado e passará a estar
            acc.balance = Number(acc.balance) + newValue;
            await acc.save();
          }
        }
      }
    }

    await income.update({ description, value, date, category, is_recurring, account_id: newAccountId });
    res.json(income);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const income = await Income.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!income) return res.status(404).json({ error: 'Receita não encontrada' });

  // Se a receita já estava aplicada (data hoje ou passada), reverter do saldo
  if (income.account_id && isEffective(income.date)) {
    const account = await Account.findOne({ where: { id: income.account_id, user_id: req.user.id } });
    if (account) {
      account.balance = Number(account.balance) - Number(income.value);
      await account.save();
    }
  }

  await income.destroy();
  res.json({ success: true });
};
const { Expense, CreditCard, Account } = require('../models');

// Utilidades para tratar datas "date-only" vindas do front (YYYY-MM-DD)
const isDateOnly = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const toLocalDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d); // constrói no fuso local (evita voltar 1 dia)
};

exports.list = async (req, res) => {
  const { start, end, type, account_id, credit_card_id, category, status } = req.query;
  const where = { user_id: req.user.id };
  const { Op } = require('sequelize');
  if (start && end) {
    where.due_date = { [Op.between]: [start, end] };
  }
  if (type === 'conta') {
    where.account_id = { [Op.ne]: null };
    where.credit_card_id = null;
  } else if (type === 'cartao') {
    where.credit_card_id = { [Op.ne]: null };
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
  // Busca despesas filtradas
  const expenses = await require('../models/expense').findAll({ where });
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
        // Construir data base no fuso local para evitar deslocamento
        const base = isDateOnly(due_date) ? toLocalDate(due_date) : new Date(due_date);
        const dataParcela = new Date(base);
        dataParcela.setMonth(dataParcela.getMonth() + (i - 1));
        const safeStatus = typeof status !== 'undefined' && status !== null ? status : 'pendente';
        let safePaidAt = typeof paid_at !== 'undefined' ? paid_at : null;
        if (safePaidAt && isDateOnly(safePaidAt)) {
          safePaidAt = toLocalDate(safePaidAt);
        }
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

        despesas.push(expense);
      }
      // Deduzir limite do cartão (simples: valor total)
      const card = await CreditCard.findOne({ where: { id: credit_card_id, user_id: req.user.id } });
      if (card) {
        card.used_limit = (Number(card.used_limit) || 0) + Number(value);
        await card.save();
      }
      return res.status(201).json(despesas);
    } else {
      // Lançamento em conta normal
      let normalizedPaidAt = typeof paid_at !== 'undefined' ? paid_at : null;
      if (normalizedPaidAt && isDateOnly(normalizedPaidAt)) {
        normalizedPaidAt = toLocalDate(normalizedPaidAt);
      }
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
        paid_at: normalizedPaidAt
      });
      // Deduzir valor do saldo da conta apenas se estiver paga
      if (account_id && status === 'paga') {
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
    const { account_id, description, value, due_date, category, status, is_recurring, auto_debit, paid_at } = req.body;
    const expense = await Expense.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!expense) return res.status(404).json({ error: 'Despesa não encontrada' });
    
    const originalValue = Number(expense.value);
    const newValue = Number(value);
    const originalStatus = expense.status;
    const newStatus = status;
    const originalAccountId = expense.account_id;
    const newAccountId = account_id;

    // Ajustar saldo das contas se for despesa de conta
    if (originalAccountId || newAccountId) {
      // Se mudou de conta, ajustar saldos de ambas as contas
      if (originalAccountId && newAccountId && originalAccountId !== newAccountId) {
        // Conta antiga: devolver o valor se estava paga
        if (originalStatus === 'paga') {
          const oldAccount = await Account.findOne({ where: { id: originalAccountId, user_id: req.user.id } });
          if (oldAccount) {
            oldAccount.balance = Number(oldAccount.balance) + originalValue;
            await oldAccount.save();
            console.log(`[UPDATE EXPENSE] Devolvendo valor ${originalValue} para conta antiga ${oldAccount.id}`);
          }
        }
        
        // Conta nova: deduzir o valor se está paga
        if (newStatus === 'paga') {
          const newAccount = await Account.findOne({ where: { id: newAccountId, user_id: req.user.id } });
          if (newAccount) {
            newAccount.balance = Number(newAccount.balance) - newValue;
            await newAccount.save();
            console.log(`[UPDATE EXPENSE] Deduzindo valor ${newValue} da conta nova ${newAccount.id}`);
          }
        }
      } else if (originalAccountId && originalAccountId === newAccountId) {
        // Mesma conta, ajustar saldo conforme status e valor
        const account = await Account.findOne({ where: { id: originalAccountId, user_id: req.user.id } });
        if (account) {
          let balanceAdjustment = 0;

          // Se estava paga e agora não está mais paga (pendente), devolve o valor original
          if (originalStatus === 'paga' && newStatus !== 'paga') {
            balanceAdjustment += originalValue;
          }
          
          // Se não estava paga e agora está paga, deduz o novo valor
          if (originalStatus !== 'paga' && newStatus === 'paga') {
            balanceAdjustment -= newValue;
          }
          
          // Se estava paga e continua paga, mas o valor mudou
          if (originalStatus === 'paga' && newStatus === 'paga') {
            balanceAdjustment += originalValue - newValue; // devolve o antigo e deduz o novo
          }

          if (balanceAdjustment !== 0) {
            account.balance = Number(account.balance) + balanceAdjustment;
            await account.save();
            console.log(`[UPDATE EXPENSE] Ajuste de saldo da conta ${account.id}: ${balanceAdjustment > 0 ? '+' : ''}${balanceAdjustment}`);
          }
        }
      }
    }

    // Ajustar limite do cartão se for despesa de cartão
    if (expense.credit_card_id) {
      const card = await CreditCard.findOne({ where: { id: expense.credit_card_id, user_id: req.user.id } });
      if (card) {
        const valueDifference = newValue - originalValue;
        card.used_limit = (Number(card.used_limit) || 0) + valueDifference;
        await card.save();
      }
    }
    
    // Normalizar paid_at para data local quando vier como YYYY-MM-DD
    let normalizedPaidAt = paid_at;
    if (normalizedPaidAt && isDateOnly(normalizedPaidAt)) {
      normalizedPaidAt = toLocalDate(normalizedPaidAt);
    }
    
    await expense.update({ account_id, description, value: newValue, due_date, category, status: newStatus, is_recurring, auto_debit, paid_at: normalizedPaidAt });
    res.json(expense);
  } catch (err) {
    console.error('Erro ao editar despesa:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const expense = await Expense.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!expense) return res.status(404).json({ error: 'Despesa não encontrada' });

  // Se for despesa de conta paga, estorna o valor para a conta
  if (expense.account_id && expense.status === 'paga') {
    const account = await Account.findOne({ where: { id: expense.account_id, user_id: req.user.id } });
    if (account) {
      account.balance = Number(account.balance) + Number(expense.value);
      await account.save();
    }
  }

  // Se for despesa de cartão, devolve o valor ao limite utilizado
  if (expense.credit_card_id) {
    const card = await CreditCard.findOne({ where: { id: expense.credit_card_id, user_id: req.user.id } });
    if (card) {
      card.used_limit = (Number(card.used_limit) || 0) - Number(expense.value);
      await card.save();
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
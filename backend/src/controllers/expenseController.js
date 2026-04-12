const { sequelize, Expense, CreditCard, Account } = require('../models');
const {
  deleteRecurringExpenseOccurrenceOnly,
  deleteRecurringExpenseSeries,
  ensureRecurringExpensesThrough,
  stopRecurringExpenseSeriesFrom
} = require('../services/recurringExpenses');
const { normalizeFrequency, normalizeInterval, toISODateOnly } = require('../services/recurringIncomes');

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
    try {
      await ensureRecurringExpensesThrough({ userId: req.user.id, throughDate: end, Expense });
    } catch {}
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
  let t;
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }
    await sequelize.authenticate();
    const {
      type,
      account_id,
      credit_card_id,
      description,
      value,
      due_date,
      purchase_date,
      category,
      status,
      is_recurring,
      recurrence_frequency,
      recurrence_interval,
      recurrence_until,
      auto_debit,
      paid_at,
      installment_type,
      installment_total
    } = req.body;
    // Para despesas de cartão, o due_date pode ser calculado no backend a partir de purchase_date
    if (type !== 'cartao') {
      if (!due_date || isNaN(new Date(due_date).getTime())) {
        return res.status(400).json({ error: 'Data de vencimento (due_date) inválida ou ausente.' });
      }
    }
    t = await sequelize.transaction();
    let result;
    const recurring = !!is_recurring;
    const frequency = recurring ? (normalizeFrequency(recurrence_frequency) || 'monthly') : null;
    const interval = recurring ? normalizeInterval(recurrence_interval) : null;
    const until = recurring ? toISODateOnly(recurrence_until) : null;
    if (type === 'cartao') {
      const card = await CreditCard.findOne({ where: { id: credit_card_id, user_id: req.user.id }, transaction: t, lock: t.LOCK.UPDATE });
      if (!card) {
        throw new Error('Cartão não encontrado.');
      }
      // Para cartão, tratar due_date como data da compra (retrocompatível com o front atual)
      const parsePurchase = () => {
        if (purchase_date && isDateOnly(purchase_date)) return toLocalDate(purchase_date);
        if (purchase_date) {
          const d = new Date(purchase_date);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }
        // Se não veio purchase_date, usar due_date fornecido (retrocompatibilidade)
        if (due_date && isDateOnly(due_date)) return toLocalDate(due_date);
        if (due_date) {
          const d = new Date(due_date);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }
        throw new Error('purchase_date ou due_date ausente para despesa de cartão.');
      };
      const purchase = parsePurchase();
      const pad2 = (n) => String(n).padStart(2, '0');
      const formatDateOnlyLocal = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      const totalParcelas = installment_type === 'parcelado' ? Number(installment_total) : 1;
      const valorParcela = Number(value) / totalParcelas;
      const despesas = [];
      for (let i = 1; i <= totalParcelas; i++) {
        const dataParcela = new Date(purchase);
        dataParcela.setMonth(dataParcela.getMonth() + (i - 1));
        const safeStatus = typeof status !== 'undefined' && status !== null ? status : 'pendente';
        let safePaidAt = typeof paid_at !== 'undefined' ? paid_at : null;
        if (safePaidAt && isDateOnly(safePaidAt)) {
          safePaidAt = toLocalDate(safePaidAt);
        } else if (safePaidAt) {
          const dateObj = new Date(safePaidAt);
          safePaidAt = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
        }
        console.log('Criando parcela', { i, totalParcelas, descricao: description, valorParcela, dataParcela: dataParcela.toISOString(), status: safeStatus });
        const expense = await Expense.create({
          user_id: req.user.id,
          credit_card_id,
          description: `${description}${totalParcelas > 1 ? ` (${i}/${totalParcelas})` : ''}`,
          value: valorParcela,
          due_date: formatDateOnlyLocal(dataParcela),
          category,
          status: safeStatus,
          is_recurring: recurring,
          recurrence_frequency: frequency,
          recurrence_interval: interval,
          recurrence_until: until,
          auto_debit: !!auto_debit,
          paid_at: safePaidAt,
          installment_number: i,
          installment_total: totalParcelas
        }, { transaction: t });
        if (expense.is_recurring && !expense.recurrence_id) {
          await expense.update({ recurrence_id: expense.id }, { transaction: t });
        }
        despesas.push(expense);
      }
      if (card) {
        card.used_limit = (Number(card.used_limit) || 0) + Number(value);
        await card.save({ transaction: t });
      }
      result = despesas;
    } else {
      let normalizedPaidAt = typeof paid_at !== 'undefined' ? paid_at : null;
      if (normalizedPaidAt && isDateOnly(normalizedPaidAt)) {
        normalizedPaidAt = toLocalDate(normalizedPaidAt);
      } else if (normalizedPaidAt) {
        const dateObj = new Date(normalizedPaidAt);
        normalizedPaidAt = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      }
      console.log('Criando despesa de conta', { description, value, due_date, status, normalizedPaidAt: normalizedPaidAt ? normalizedPaidAt.toISOString() : null });
      const expense = await Expense.create({
        user_id: req.user.id,
        account_id,
        description,
        value,
        due_date,
        category,
        status,
        is_recurring: recurring,
        recurrence_frequency: frequency,
        recurrence_interval: interval,
        recurrence_until: until,
        recurrence_exceptions: null,
        auto_debit: !!auto_debit,
        paid_at: normalizedPaidAt
      }, { transaction: t });
      if (expense.is_recurring && !expense.recurrence_id) {
        await expense.update({ recurrence_id: expense.id }, { transaction: t });
      }
      if (account_id && status === 'paga') {
        const account = await Account.findOne({ where: { id: account_id, user_id: req.user.id }, transaction: t, lock: t.LOCK.UPDATE });
        if (account) {
          account.balance = Number(account.balance) - Number(value);
          await account.save({ transaction: t });
        }
      }
      result = expense;
    }
    await t.commit();
    return res.status(201).json(result);
  } catch (err) {
    if (t) { try { await t.rollback(); } catch(e) {} }
    console.error('Erro ao criar despesa:', err);
    if (err && err.message) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(400).json({ error: 'Erro desconhecido ao criar despesa.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { account_id, description, value, due_date, category, status, is_recurring, recurrence_frequency, recurrence_interval, recurrence_until, auto_debit, paid_at } = req.body;
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
      // Corrigir o problema de fuso horário usando toLocalDate
      normalizedPaidAt = toLocalDate(normalizedPaidAt);
    } else if (normalizedPaidAt) {
      // Se não for no formato date-only, usar o construtor Date
      // mas garantir que seja no fuso horário local
      const dateObj = new Date(normalizedPaidAt);
      normalizedPaidAt = new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate()
      );
    }
    
    console.log('Data de pagamento recebida:', paid_at);
    console.log('Data de pagamento formatada:', normalizedPaidAt);
    console.log('Data formatada ISO:', normalizedPaidAt ? normalizedPaidAt.toISOString() : null);
    
    const recurring = is_recurring !== undefined ? !!is_recurring : !!expense.is_recurring;
    const frequency = recurring ? (normalizeFrequency(recurrence_frequency !== undefined ? recurrence_frequency : expense.recurrence_frequency) || 'monthly') : null;
    const interval = recurring ? normalizeInterval(recurrence_interval !== undefined ? recurrence_interval : expense.recurrence_interval) : null;
    const until = recurring ? toISODateOnly(recurrence_until !== undefined ? recurrence_until : expense.recurrence_until) : null;

    await expense.update({
      account_id,
      description,
      value: newValue,
      due_date,
      category,
      status: newStatus,
      is_recurring: recurring,
      recurrence_id: recurring ? (expense.recurrence_id || expense.id) : null,
      recurrence_frequency: frequency,
      recurrence_interval: interval,
      recurrence_until: until,
      recurrence_exceptions: recurring ? expense.recurrence_exceptions : null,
      auto_debit,
      paid_at: normalizedPaidAt
    });
    res.json(expense);
  } catch (err) {
    console.error('Erro ao editar despesa:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const expense = await Expense.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!expense) return res.status(404).json({ error: 'Despesa não encontrada' });

  if (expense.is_recurring) {
    const deleteMode = String(req.query.deleteMode || req.query.mode || 'future').toLowerCase();
    if (deleteMode === 'single') {
      await deleteRecurringExpenseOccurrenceOnly({ expense, Expense, Account, CreditCard });
    } else if (deleteMode === 'all') {
      await deleteRecurringExpenseSeries({ expense, Expense, Account, CreditCard });
    } else {
      await stopRecurringExpenseSeriesFrom({ expense, Expense, Account, CreditCard });
    }
    return res.json({ success: true });
  }

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

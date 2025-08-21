const { Expense, Income, CreditCard, Account, Transfer, CreditCardPayment } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
// Removido import estático de json2csv; usar helper com fallback

// Helper robusto para geração de CSV com fallback
async function toCSV(csvData, fields) {
  try {
    const { Parser } = require('json2csv');
    const parser = new Parser({ fields, delimiter: ';' });
    return parser.parse(csvData);
  } catch (e) {
    try {
      const { json2csvAsync } = require('json-2-csv');
      return await json2csvAsync(csvData, { keys: fields, delimiter: { field: ';' } });
    } catch (e2) {
      throw new Error('CSV conversion failed: ' + (e2.message || e.message));
    }
  }
}

exports.exportAccountStatement = async (req, res) => {
  const { accountId, startDate, endDate } = req.query;

  // Validação de parâmetros
  if (!accountId) {
    return res.status(400).send('accountId is required');
  }

  // Se não fornecer datas, usar o mês atual
  let start = startDate;
  let end = endDate;
  
  if (!start || !end) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    start = dayjs(firstDay).format('YYYY-MM-DD');
    end = dayjs(lastDay).format('YYYY-MM-DD');
  }

  try {
    // Buscar conta e validar existência
    const account = await Account.findByPk(accountId);
    if (!account) {
      return res.status(404).send('Conta não encontrada');
    }

    // Buscar transações relevantes (incomes, expenses pagas, transfers e pagamentos de cartão)
    const [incomes, expenses, transfersFrom, transfersTo, ccPayments] = await Promise.all([
      Income.findAll({ where: { account_id: accountId, date: { [Op.between]: [start, end] } } }),
      // Apenas despesas pagas dentro do período
      Expense.findAll({ where: { account_id: accountId, status: 'paga', paid_at: { [Op.between]: [start, end] } } }),
      Transfer.findAll({ where: { from_account_id: accountId, date: { [Op.between]: [start, end] } } }),
      Transfer.findAll({ where: { to_account_id: accountId, date: { [Op.between]: [start, end] } } }),
      CreditCardPayment.findAll({ where: { account_id: accountId, payment_date: { [Op.between]: [start, end] } }, include: [{ model: CreditCard, as: 'card', attributes: ['name'] }] }),
    ]);

    // Consolidar e mapear para CSV
    const rows = [];

    for (const inc of incomes) {
      rows.push({
        date: inc.date,
        description: inc.description || 'Receita',
        category: inc.category || '',
        type: 'Receita',
        direction: 'Entrada',
        cardName: '',
        value: Number(inc.value),
      });
    }

    for (const exp of expenses) {
      rows.push({
        date: exp.paid_at,
        description: exp.description || 'Despesa',
        category: exp.category || '',
        type: 'Despesa',
        direction: 'Saída',
        cardName: '',
        value: -Number(exp.value),
      });
    }

    for (const t of transfersFrom) {
      rows.push({
        date: t.date,
        description: t.description || 'Transferência (saída)',
        category: 'Transferência',
        type: 'Transferência',
        direction: 'Saída',
        cardName: '',
        value: -Number(t.value),
      });
    }

    for (const t of transfersTo) {
      rows.push({
        date: t.date,
        description: t.description || 'Transferência (entrada)',
        category: 'Transferência',
        type: 'Transferência',
        direction: 'Entrada',
        cardName: '',
        value: Number(t.value),
      });
    }

    for (const p of ccPayments) {
      rows.push({
        date: p.payment_date,
        description: `Pagamento de Fatura de Cartão${p.card?.name ? ` - ${p.card.name}` : ''}`,
        category: 'Cartão de Crédito',
        type: 'Pagamento Cartão',
        direction: 'Saída',
        cardName: p.card?.name || '',
        value: -Number(p.value || 0),
      });
    }

    // Ordenar por data real
    rows.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Preparar dados para CSV de forma consistente
    const csvData = rows.map((item) => {
      const dataTransacao = dayjs(item.date).isValid() ? dayjs(item.date).format('DD/MM/YYYY') : '';
      return {
        'Data': dataTransacao,
        'Descrição': item.description,
        'Categoria': item.category,
        'Tipo': item.type,
        'Direção': item.direction,
        'Nome do Cartão': item.cardName,
        'Valor': Number(item.value).toFixed(2).replace('.', ',')
      };
    });

    // Converter para CSV (com fallback)
    const fields = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Direção', 'Nome do Cartão', 'Valor'];
    const csv = await toCSV(csvData, fields);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`extrato_conta_${accountId}_${start}_${end}.csv`);
    return res.send('\uFEFF' + csv); // BOM para Excel
  } catch (error) {
    console.error('exportAccountStatement: Error exporting account statement:', error);
    res.status(500).send('Error exporting account statement: ' + error.message);
  }
};

exports.exportExpenses = async (req, res) => {
  const { startDate, endDate, category, accountId, status } = req.query;

  try {
    // Se não fornecer datas, usar o mês atual
    let start = startDate;
    let end = endDate;
    
    if (!start || !end) {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      start = dayjs(firstDay).format('YYYY-MM-DD');
      end = dayjs(lastDay).format('YYYY-MM-DD');
    }

    // Replicar filtros da Aba Despesas (type=conta)
    const where = {
      user_id: req.user.id,
      due_date: { [Op.between]: [start, end] },
      account_id: { [Op.ne]: null },
      credit_card_id: null,
    };
    if (category) where.category = category;
    if (accountId) where.account_id = accountId;
    if (status) where.status = status;

    const expenses = await Expense.findAll({
      where,
      include: [{ model: Account, as: 'account', attributes: ['name', 'id'] }],
      order: [['due_date', 'ASC']],
    });

    // Não incluir pagamentos de fatura de cartão na exportação de despesas
    // const ccPayments = await CreditCardPayment.findAll({ where: { user_id: req.user.id, payment_date: { [Op.between]: [start, end] } } });
    const ccPayments = [];

    // Mapear contas envolvidas para obter nomes
    const accountIds = new Set();
    expenses.forEach(e => { if (e.account_id) accountIds.add(e.account_id); });
    ccPayments.forEach(p => { if (p.account_id) accountIds.add(p.account_id); });
    let accountMap = {};
    if (accountIds.size > 0) {
      const accounts = await Account.findAll({ where: { id: Array.from(accountIds), user_id: req.user.id }, attributes: ['id', 'name'] });
      accountMap = accounts.reduce((acc, a) => { acc[a.id] = a.name; return acc; }, {});
    }

    const rows = [];

    // Despesas de conta (tipo conta)
    for (const expense of expenses) {
      rows.push({
        date: expense.due_date,
        description: expense.description,
        category: expense.category || '',
        accountName: expense.account?.name || (expense.account_id ? accountMap[expense.account_id] : '') || '',
        value: -Number(expense.value),
      });
    }

    // Converter para CSV com as mesmas colunas
    const csvData = rows.map((item) => ({
      'Data': dayjs(item.date).isValid() ? dayjs(item.date).format('DD/MM/YYYY') : '',
      'Descrição': item.description,
      'Categoria': item.category,
      'Conta': item.accountName,
      'Valor': Number(item.value).toFixed(2).replace('.', ',')
    }));

    const fields = ['Data', 'Descrição', 'Categoria', 'Conta', 'Valor'];
    const csv = await toCSV(csvData, fields);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`despesas_${start}_${end}.csv`);
    return res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('Error exporting expenses:', error);
    res.status(500).send('Error exporting expenses: ' + error.message);
  }
};

exports.exportCreditCardExpenses = async (req, res) => {
  const { cardId, billMonth } = req.query;

  if (!cardId || !billMonth) {
    return res.status(400).send('cardId and billMonth are required');
  }

  try {
    const card = await CreditCard.findByPk(cardId);
    if (!card) {
      return res.status(404).send('Cartão não encontrado');
    }

    // Função utilitária (mês 0-11): período da fatura de um mês/ano
    function getBillPeriodForMonth(closingDay, dueDay, year, month /* 0-11, mês de vencimento */) {
      // Fechamento ocorre antes do vencimento?
      let start, end;
      if (closingDay > dueDay) {
        // Período: closingDay de (month-2) até (closingDay-1) de (month-1)
        start = new Date(year, month - 2, closingDay);
        start.setHours(0, 0, 0, 0);
        end = new Date(year, month - 1, closingDay - 1);
        end.setHours(23, 59, 59, 999);
      } else {
        // Período: closingDay de (month-1) até (closingDay-1) de (month)
        start = new Date(year, month - 1, closingDay);
        start.setHours(0, 0, 0, 0);
        end = new Date(year, month, closingDay - 1);
        end.setHours(23, 59, 59, 999);
      }
      return { start, end };
    }

    const [yearStr, monthStr] = billMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthZeroBased = parseInt(monthStr, 10) - 1; // converter YYYY-MM para 0-11

    const { start, end } = getBillPeriodForMonth(card.closing_day, card.due_day, year, monthZeroBased);

    const expenses = await Expense.findAll({
      where: {
        user_id: req.user.id,
        credit_card_id: cardId,
        // Para fatura, considerar a data de compra (due_date) dentro do período de fechamento
        due_date: { [Op.between]: [dayjs(start).format('YYYY-MM-DD'), dayjs(end).format('YYYY-MM-DD')] }
      },
      order: [['due_date', 'ASC']],
    });

    const csvData = expenses.map((expense) => ({
      'Data': dayjs(expense.due_date).format('DD/MM/YYYY'),
      'Descrição': expense.description,
      'Categoria': expense.category || '',
      'Valor': Number(expense.value).toFixed(2).replace('.', ',')
    }));

    const fields = ['Data', 'Descrição', 'Categoria', 'Valor'];
    const csv = await toCSV(csvData, fields);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`cartao_${cardId}_fatura_${billMonth}.csv`);
    return res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('Error exporting credit card expenses:', error);
    res.status(500).send('Error exporting credit card expenses: ' + error.message);
  }
};
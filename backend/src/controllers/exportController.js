const { Expense, Income, CreditCard, Account, Transfer, CreditCardPayment } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { Parser } = require('json2csv');

exports.exportAccountStatement = async (req, res) => {
  const { accountId, startDate, endDate } = req.query;

  console.log('exportAccountStatement: accountId:', accountId);
  console.log('exportAccountStatement: startDate:', startDate);
  console.log('exportAccountStatement: endDate:', endDate);

  // Validação de parâmetros
  if (!accountId) {
    return res.status(400).send('accountId is required');
  }

  // Se não fornecer datas, usar o mês atual
  let start = startDate;
  let end = endDate;
  
  if (!start || !end) {
    const today = new Date();
    start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    
    console.log('exportAccountStatement: Using default period:', start, 'to', end);
  }

  try {
    // Buscar despesas e receitas do período
    const expenses = await Expense.findAll({
      where: {
        account_id: accountId,
        due_date: {
          [Op.between]: [start, end]
        }
      },
      order: [['due_date', 'ASC']]
    });

    const incomes = await Income.findAll({
      where: {
        account_id: accountId,
        date: {
          [Op.between]: [start, end]
        }
      },
      order: [['date', 'ASC']]
    });

    // Novos: transferências envolvendo a conta e pagamentos de fatura do cartão
    const transfers = await Transfer.findAll({
      where: {
        [Op.or]: [
          { from_account_id: accountId },
          { to_account_id: accountId }
        ],
        date: { [Op.between]: [start, end] }
      },
      order: [['date', 'ASC']]
    });

    const ccPayments = await CreditCardPayment.findAll({
      where: {
        account_id: accountId,
        payment_date: { [Op.between]: [start, end] }
      },
      include: [{ model: CreditCard, as: 'card', attributes: ['name'] }],
      order: [['payment_date', 'ASC']]
    });

    console.log('exportAccountStatement: Found expenses:', expenses.length);
    console.log('exportAccountStatement: Found incomes:', incomes.length);
    console.log('exportAccountStatement: Found transfers:', transfers.length);
    console.log('exportAccountStatement: Found credit card payments:', ccPayments.length);

    // Combinar e ordenar por data (considera due_date, date e payment_date)
    const allTransactions = [...expenses, ...incomes, ...transfers, ...ccPayments].sort((a, b) => {
      const dateA = new Date(a.due_date || a.date || a.payment_date);
      const dateB = new Date(b.due_date || b.date || b.payment_date);
      return dateA - dateB;
    });
    
    console.log('exportAccountStatement: Combined transactions:', allTransactions.length);

    if (allTransactions.length === 0) {
      console.log('exportAccountStatement: No transactions found for the given criteria.');
      return res.status(404).send('No transactions found for the given criteria.');
    }

    // Preparar dados para CSV
    const csvData = allTransactions.map(item => {
      const modelName = item.constructor?.name;
      let tipo = '';
      let descricao = item.description || '';
      let direcao = 'Entrada';
      let nomeCartao = '';

      // accountId pode vir como string
      const accountIdNum = Number(accountId);

      if (modelName === 'Expense') {
        tipo = 'Despesa';
        direcao = 'Saída';
      } else if (modelName === 'Income') {
        tipo = 'Receita';
        direcao = 'Entrada';
      } else if (modelName === 'Transfer') {
        tipo = 'Transferência';
        // Saída se a conta for a origem; Entrada se a conta for o destino
        if (item.from_account_id == accountIdNum) {
          direcao = 'Saída';
        } else if (item.to_account_id == accountIdNum) {
          direcao = 'Entrada';
        }
      } else if (modelName === 'CreditCardPayment') {
        tipo = 'Pagamento Fatura';
        direcao = 'Saída'; // pagamento debita a conta
        if (item.card && item.card.name) {
          nomeCartao = item.card.name;
          descricao = `Pagamento Fatura ${item.card.name}`;
        } else if (!descricao) {
          descricao = 'Pagamento Fatura';
        }
      }

      const dataTransacao = dayjs(item.due_date || item.date || item.payment_date).format('DD/MM/YYYY');

      // Valor com sinal: Saída negativo, Entrada positivo
      const rawValue = Number(item.value) || 0;
      const signedValue = direcao === 'Saída' ? -Math.abs(rawValue) : Math.abs(rawValue);

      return {
        'Data': dataTransacao,
        'Descrição': descricao,
        'Categoria': item.category || '',
        'Tipo': tipo,
        'Direção': direcao,
        'Nome do Cartão': nomeCartao,
        'Valor': signedValue.toFixed(2).replace('.', ',')
      };
    });

    console.log('exportAccountStatement: Prepared CSV data:', csvData.length, 'rows');

    // Converter para CSV
    const fields = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Direção', 'Nome do Cartão', 'Valor'];
    const json2csvParser = new Parser({ fields, delimiter: ';' });
    const csv = json2csvParser.parse(csvData);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`extrato_conta_${accountId}_${start}_${end}.csv`);
    return res.send('\uFEFF' + csv); // BOM para Excel
  } catch (error) {
    console.error('exportAccountStatement: Error exporting account statement:', error);
    res.status(500).send('Error exporting account statement: ' + error.message);
  }
};

exports.exportExpenses = async (req, res) => {
    const { startDate, endDate, category, accountId } = req.query;
    
    console.log('exportExpenses: startDate:', startDate);
    console.log('exportExpenses: endDate:', endDate);
    console.log('exportExpenses: category:', category);
    console.log('exportExpenses: accountId:', accountId);
    
    try {
        // Se não fornecer datas, usar o mês atual
        let start = startDate;
        let end = endDate;
        
        if (!start || !end) {
            const today = new Date();
            start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
            
            console.log('exportExpenses: Using default period:', start, 'to', end);
        }
        
        const where = {
            due_date: {
                [Op.between]: [start, end]
            },
            // Exportação da aba Despesa: somente despesas de CONTA (excluir cartão de crédito)
            credit_card_id: null,
        };
        
        if (category) {
            where.category = category;
        }

        if (accountId) {
            where.account_id = accountId;
        } else {
            where.account_id = { [Op.ne]: null };
        }

        const expenses = await Expense.findAll({ 
            where,
            include: [{ model: Account, as: 'account', attributes: ['name'] }],
            order: [['due_date', 'ASC']]
        });

        console.log('exportExpenses: Found expenses:', expenses.length);

        // Preparar dados para CSV
        const csvData = expenses.map(expense => ({
            'Data': dayjs(expense.due_date).format('DD/MM/YYYY'),
            'Descrição': expense.description,
            'Categoria': expense.category || '',
            'Conta': expense.account?.name || '',
            'Valor': Number(expense.value).toFixed(2).replace('.', ',')
        }));

        console.log('exportExpenses: Prepared CSV data:', csvData.length, 'rows');

        // Converter para CSV
        const fields = ['Data', 'Descrição', 'Categoria', 'Conta', 'Valor'];
        const json2csvParser = new Parser({ fields, delimiter: ';' });
        const csv = json2csvParser.parse(csvData);

        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.attachment(`despesas_${start}_${end}.csv`);
        return res.send('\uFEFF' + csv); // BOM para Excel

    } catch (error) {
        console.error('Error exporting expenses:', error);
        res.status(500).send('Error exporting expenses: ' + error.message);
    }
};

exports.exportCreditCardExpenses = async (req, res) => {
    console.log('exportCreditCardExpenses controller atingido!');

    const { cardId, billMonth } = req.query;
    
    console.log('exportCreditCardExpenses: cardId:', cardId);
    console.log('exportCreditCardExpenses: billMonth:', billMonth);
    
    if (!cardId || !billMonth) {
      return res.status(400).send('cardId and billMonth are required');
    }
    
    try {
        // Buscar cartão para obter fechamento e vencimento
        const card = await CreditCard.findByPk(cardId);
        if (!card) {
          return res.status(404).send('Cartão não encontrado');
        }

        // Função utilitária (mesma regra usada no creditCardController)
        function getBillPeriodForMonth(closingDay, dueDay, year, month) {
          let start, end;
          if (closingDay > dueDay) {
            // Fechamento no mês anterior ao vencimento
            start = new Date(year, month - 2, closingDay);
            start.setHours(0, 0, 0, 0);
            end = new Date(year, month - 1, closingDay - 1);
            end.setHours(23, 59, 59, 999);
          } else {
            // Fechamento no mesmo mês do vencimento
            start = new Date(year, month - 1, closingDay);
            start.setHours(0, 0, 0, 0);
            end = new Date(year, month, closingDay - 1);
            end.setHours(23, 59, 59, 999);
          }
          return { start, end };
        }

        const [yearStr, monthStr] = billMonth.split('-');
        const year = Number(yearStr);
        const month = Number(monthStr); // 1-12 (mês de vencimento)
        const period = getBillPeriodForMonth(card.closing_day, card.due_day, year, month - 1);
        const startDate = dayjs(period.start).format('YYYY-MM-DD');
        const endDate = dayjs(period.end).format('YYYY-MM-DD');

        console.log('exportCreditCardExpenses: Calculated bill period:', startDate, 'to', endDate);

        const expenses = await Expense.findAll({
            where: {
                credit_card_id: cardId,
                due_date: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        console.log('exportCreditCardExpenses: Found expenses:', expenses.length);

        // Preparar dados para CSV
        const csvData = expenses.map(expense => {
            const purchaseDate = expense.date || expense.createdAt || expense.due_date; // fallback
            return {
              'Data da Compra': dayjs(purchaseDate).format('DD/MM/YYYY'),
              'Data de Vencimento': dayjs(expense.due_date).format('DD/MM/YYYY'),
              'Descrição': expense.description,
              'Categoria': expense.category || '',
              'Valor': Number(expense.value).toFixed(2).replace('.', ',')
            };
        });

        console.log('exportCreditCardExpenses: Prepared CSV data:', csvData.length, 'rows');

        // Converter para CSV
        const fields = ['Data da Compra', 'Data de Vencimento', 'Descrição', 'Categoria', 'Valor'];
        const json2csvParser = new Parser({ fields, delimiter: ';' });
        const csv = json2csvParser.parse(csvData);

        res.header('Content-Type', 'text/csv; charset=utf-8');
        res.attachment(`fatura_cartao_${cardId}_${String(month).padStart(2, '0')}_${year}.csv`);
        return res.send('\uFEFF' + csv); // BOM para Excel

    } catch (error) {
        console.error('Error exporting credit card expenses:', error.message, error.stack);
        res.status(500).send('Error exporting credit card expenses: ' + error.message);
    }
};
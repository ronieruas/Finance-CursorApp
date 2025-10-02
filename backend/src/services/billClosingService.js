const { CreditCard, Expense } = require('../models');
const { Op } = require('sequelize');

/**
 * Serviço responsável pelo fechamento automático de faturas de cartão de crédito
 */
class BillClosingService {
  
  /**
   * Executa o fechamento automático de todas as faturas que devem ser fechadas
   */
  static async processAutomaticClosing() {
    try {
      console.log('[BillClosing] Iniciando processo de fechamento automático...');
      
      const cards = await CreditCard.findAll();
      let processedCards = 0;
      let closedBills = 0;
      
      for (const card of cards) {
        const result = await this.processCardBillClosing(card);
        if (result.closed) {
          closedBills++;
        }
        processedCards++;
      }
      
      console.log(`[BillClosing] Processo concluído: ${processedCards} cartões processados, ${closedBills} faturas fechadas`);
      return { processedCards, closedBills };
      
    } catch (error) {
      console.error('[BillClosing] Erro no processo de fechamento automático:', error);
      throw error;
    }
  }
  
  /**
   * Processa o fechamento de fatura para um cartão específico
   */
  static async processCardBillClosing(card) {
    try {
      const today = new Date();
      const currentDay = today.getDate();
      
      // Verifica se hoje é o dia de fechamento do cartão
      if (currentDay !== card.closing_day) {
        return { closed: false, reason: 'Não é o dia de fechamento' };
      }
      
      console.log(`[BillClosing] Processando cartão ${card.name} (ID: ${card.id}) - Dia de fechamento: ${card.closing_day}`);
      
      // Calcula o período da fatura que deve ser fechada
      const billPeriod = this.calculateBillPeriodToClose(card.closing_day, card.due_day, today);
      
      // Busca despesas que devem ser fechadas
      const expensesToClose = await Expense.findAll({
        where: {
          credit_card_id: card.id,
          due_date: {
            [Op.between]: [
              billPeriod.start.toISOString().split('T')[0],
              billPeriod.end.toISOString().split('T')[0]
            ]
          },
          status: { [Op.ne]: 'paga' }
        }
      });
      
      if (expensesToClose.length === 0) {
        console.log(`[BillClosing] Nenhuma despesa para fechar no cartão ${card.name}`);
        return { closed: false, reason: 'Nenhuma despesa para fechar' };
      }
      
      // Marca as despesas como "fechadas" (adiciona um campo bill_closed_at)
      const closingDate = new Date();
      for (const expense of expensesToClose) {
        await expense.update({
          bill_closed_at: closingDate
        });
      }
      
      console.log(`[BillClosing] Fatura fechada para cartão ${card.name}: ${expensesToClose.length} despesas fechadas`);
      
      return {
        closed: true,
        expensesClosed: expensesToClose.length,
        closingDate: closingDate,
        billPeriod: billPeriod
      };
      
    } catch (error) {
      console.error(`[BillClosing] Erro ao processar cartão ${card.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Calcula o período da fatura que deve ser fechada
   */
  static calculateBillPeriodToClose(closingDay, dueDay, refDate = new Date()) {
    const year = refDate.getFullYear();
    const month = refDate.getMonth(); // 0-11
    
    // A fatura que está sendo fechada hoje é a que vence no próximo mês
    let dueYear = year;
    let dueMonth = month + 1;
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear += 1;
    }
    
    return this.getBillPeriodForMonth(closingDay, dueDay, dueYear, dueMonth);
  }
  
  /**
   * Calcula o período de uma fatura para um mês específico
   */
  static getBillPeriodForMonth(closingDay, dueDay, year, month) {
    // month é 0-11 e representa o MÊS DE VENCIMENTO da fatura
    const vencimento = new Date(year, month, dueDay);

    let start;
    let end;
    if (closingDay > dueDay) {
      // Fechamento ocorre no mês anterior ao vencimento
      start = new Date(year, month - 2, closingDay);
      start.setHours(0, 0, 0, 0);
      end = new Date(year, month - 1, closingDay - 1);
      end.setHours(23, 59, 59, 999);
    } else {
      // Fechamento ocorre no mesmo mês do vencimento
      start = new Date(year, month - 1, closingDay);
      start.setHours(0, 0, 0, 0);
      end = new Date(year, month, closingDay - 1);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end, vencimento };
  }
  
  /**
   * Verifica se uma fatura específica deve ser fechada
   */
  static async shouldCloseBill(cardId, referenceDate = new Date()) {
    const card = await CreditCard.findByPk(cardId);
    if (!card) {
      throw new Error('Cartão não encontrado');
    }
    
    const currentDay = referenceDate.getDate();
    return currentDay === card.closing_day;
  }
}

module.exports = BillClosingService;
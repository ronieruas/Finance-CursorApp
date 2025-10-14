/*
  Script: Soma pagamentos de fatura (out/2025) e soma das faturas a pagar no próximo mês
  Uso: node scripts/sum_cards_and_next_month.js
  Observação: Usa o mesmo cálculo de períodos de fatura do backend (resumo/dashboard).
*/

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Op } = require('sequelize');
const { sequelize, User, CreditCard, Expense, CreditCardPayment } = require('../src/models');

function formatDateOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getBillPeriodForMonth(closingDay, dueDay, year, month) {
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

function getBillPeriodsFromRef(closingDay, dueDay, refDate = new Date()) {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const day = refDate.getDate();
  let dueYearAtual = year;
  let dueMonthAtual;
  if (day > dueDay) {
    dueMonthAtual = month + 1;
    if (dueMonthAtual > 11) { dueMonthAtual = 0; dueYearAtual += 1; }
  } else {
    dueMonthAtual = month;
  }
  let dueYearProxima = dueYearAtual;
  let dueMonthProxima = dueMonthAtual + 1;
  if (dueMonthProxima > 11) { dueMonthProxima = 0; dueYearProxima += 1; }
  const atual = getBillPeriodForMonth(closingDay, dueDay, dueYearAtual, dueMonthAtual);
  const proxima = getBillPeriodForMonth(closingDay, dueDay, dueYearProxima, dueMonthProxima);
  return { atual, proxima };
}

async function resolveUser() {
  const targetEmail = process.env.TARGET_EMAIL || 'user@example.com';
  let user = await User.findOne({ where: { email: targetEmail } });
  if (!user) {
    user = await User.findOne({ where: { email: 'admin@admin.com' } });
  }
  if (!user) {
    user = await User.findOne();
  }
  if (!user) throw new Error('Nenhum usuário encontrado no banco.');
  return user;
}

async function main() {
  console.log('[Script] Iniciando conexão com o banco...');
  await sequelize.authenticate();
  console.log('[Script] Conexão OK');

  const user = await resolveUser();
  console.log(`[Script] Usuário alvo: id=${user.id} email=${user.email}`);

  // Carregar todos os cartões do usuário (ativos ou não)
  const cards = await CreditCard.findAll({ where: { user_id: user.id } });
  if (!cards || cards.length === 0) {
    console.log('[Script] Nenhum cartão encontrado para o usuário.');
  } else {
    console.log(`[Script] Cartões do usuário: ${cards.map(c => `${c.id}:${c.name}(${c.status})`).join(', ')}`);
  }

  // 1) Soma de pagamentos de fatura (Outubro/2025) no banco atual
  const startOct = new Date(2025, 9, 1); // 1/out/2025
  const endOct = new Date(2025, 9, 31); // 31/out/2025
  const pagamentosOutubro = await CreditCardPayment.sum('value', {
    where: {
      user_id: user.id,
      payment_date: { [Op.between]: [startOct, endOct] },
    },
  }) || 0;
  console.log(`[Resultado] Pagamentos de fatura em 2025-10 (todos cartões): R$ ${Number(pagamentosOutubro).toFixed(2)}`);

  // 2) Soma das faturas a serem pagas no PRÓXIMO mês de vencimento
  const hoje = new Date();
  let somaFaturasProximoMes = 0;
  const detalhesPorCartao = [];
  for (const cartao of cards) {
    const periods = getBillPeriodsFromRef(cartao.closing_day, cartao.due_day, hoje);
    const proxStart = periods.proxima.start;
    const proxEnd = periods.proxima.end;
    const totalProximoCartao = await Expense.sum('value', {
      where: {
        user_id: user.id,
        credit_card_id: cartao.id,
        due_date: { [Op.between]: [proxStart, proxEnd] },
      },
    }) || 0;
    somaFaturasProximoMes += Number(totalProximoCartao) || 0;
    detalhesPorCartao.push({
      cartao: cartao.name,
      valor: Number(totalProximoCartao) || 0,
      periodo: `${formatDateOnly(proxStart)} a ${formatDateOnly(proxEnd)}`,
    });
  }

  console.log(`[Resultado] Faturas a pagar (próximo mês - soma de todos cartões): R$ ${somaFaturasProximoMes.toFixed(2)}`);
  for (const d of detalhesPorCartao) {
    console.log(`  - ${d.cartao}: R$ ${d.valor.toFixed(2)} (período ${d.periodo})`);
  }

  await sequelize.close();
}

main().catch(async (err) => {
  console.error('[Script] Erro:', err);
  try { await sequelize.close(); } catch {}
  process.exit(1);
});
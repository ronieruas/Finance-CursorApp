const dayjs = require('dayjs')
const { sequelize, Expense, CreditCard, Account } = require('../models')

async function httpJson(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`http://localhost:3001${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch { json = { raw: text } }
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json)}`)
  }
  return json
}

function getBillPeriodForMonth(closingDay, dueDay, year, monthZeroBased) {
  const vencimento = new Date(year, monthZeroBased, dueDay)
  let start
  let end
  if (Number(closingDay) > Number(dueDay)) {
    start = new Date(year, monthZeroBased - 2, closingDay)
    end = new Date(year, monthZeroBased - 1, Math.max(Number(closingDay) - 1, 1))
  } else {
    start = new Date(year, monthZeroBased - 1, closingDay)
    end = new Date(year, monthZeroBased, Math.max(Number(closingDay) - 1, 1))
  }
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end, vencimento }
}

async function main() {
  await sequelize.authenticate()

  const suffix = Math.random().toString(36).slice(2, 8)
  const email = 'user@example.com'
  const password = 'password123'

  const login = await httpJson('POST', '/auth/login', { email, password })
  const token = login.token
  const userId = login.user?.id
  if (!token || !userId) throw new Error('Login não retornou token/user')

  const account = await httpJson('POST', '/accounts', {
    name: `Conta Smoke Cartão ${suffix}`,
    bank: 'Smoke',
    type: 'corrente',
    balance: 100000,
    currency: 'BRL'
  }, token)

  const card = await httpJson('POST', '/creditCards', {
    bank: 'Smoke',
    brand: 'VISA',
    limit_value: 10000,
    due_day: 5,
    closing_day: 28,
    name: `Cartão Smoke Legacy ${suffix}`,
    status: 'ativa'
  }, token)

  const billMonth = dayjs().format('YYYY-MM')
  const [year, monthStr] = billMonth.split('-').map(Number)
  const period = getBillPeriodForMonth(28, 5, year, monthStr - 1)
  const startStr = dayjs(period.start).format('YYYY-MM-DD')
  const midStr = dayjs(period.start).add(10, 'day').format('YYYY-MM-DD')
  const endStr = dayjs(period.end).subtract(1, 'day').format('YYYY-MM-DD')

  const inserted = await Expense.bulkCreate([
    { user_id: userId, credit_card_id: card.id, description: `Legacy A ${suffix}`, value: 10.11, due_date: startStr, status: 'pendente' },
    { user_id: userId, credit_card_id: card.id, description: `Legacy B ${suffix}`, value: 20.22, due_date: midStr, status: 'pendente' },
    { user_id: userId, credit_card_id: card.id, description: `Legacy C ${suffix}`, value: 30.33, due_date: endStr, status: 'pendente' }
  ])

  const expected = inserted.reduce((acc, e) => acc + Number(e.value), 0)

  const payment = await httpJson('POST', `/creditCards/${card.id}/pay`, {
    account_id: account.id,
    payment_date: dayjs().format('YYYY-MM-DD'),
    is_full_payment: true,
    auto_debit: false,
    bill_month: billMonth
  }, token)

  const paidCount = await Expense.count({
    where: {
      user_id: userId,
      credit_card_id: card.id,
      due_date: { [require('sequelize').Op.between]: [dayjs(period.start).format('YYYY-MM-DD'), dayjs(period.end).format('YYYY-MM-DD')] },
      status: 'paga'
    }
  })

  if (paidCount !== 3) {
    throw new Error(`Esperava 3 despesas pagas no período, veio ${paidCount}`)
  }

  const paidTotal = Number(payment.value)
  if (Math.abs(paidTotal - expected) > 0.01) {
    throw new Error(`Valor pago divergente. esperado=${expected} pago=${paidTotal}`)
  }

  console.log(JSON.stringify({
    ok: true,
    user_id: userId,
    card_id: card.id,
    account_id: account.id,
    bill_month: billMonth,
    payment_id: payment.id,
    payment_value: payment.value,
    paid_count: paidCount
  }, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e.message || e); process.exit(1) })
  .finally(async () => { try { await sequelize.close() } catch {} })

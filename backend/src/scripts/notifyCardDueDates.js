const { CreditCard, Notification, User } = require('../models');
const { Op } = require('sequelize');

async function notifyCardDueDates() {
  const today = new Date();
  const in3days = new Date(today);
  in3days.setDate(today.getDate() + 3);

  // Buscar todos os cartões ativos
  const cards = await CreditCard.findAll({ where: { status: 'ativa' } });

  for (const card of cards) {
    // Calcular próxima data de vencimento
    const { due_day, user_id, name } = card;
    let nextDue = new Date(today.getFullYear(), today.getMonth(), due_day);
    if (nextDue < today) nextDue.setMonth(nextDue.getMonth() + 1);
    // Se o vencimento for daqui a 3 dias
    if (
      nextDue.getFullYear() === in3days.getFullYear() &&
      nextDue.getMonth() === in3days.getMonth() &&
      nextDue.getDate() === in3days.getDate()
    ) {
      // Verifica se já existe notificação para este vencimento
      const exists = await Notification.findOne({
        where: {
          user_id,
          type: 'alerta_vencimento_cartao',
          message: { [Op.like]: `%${name}%${nextDue.toISOString().slice(0, 10)}%` },
        },
      });
      if (!exists) {
        await Notification.create({
          user_id,
          type: 'alerta_vencimento_cartao',
          message: `Fatura do cartão "${name}" vence em 3 dias (${nextDue.toLocaleDateString('pt-BR')})`,
        });
        console.log(`Notificação criada para usuário ${user_id} - Cartão ${name}`);
      }
    }
  }
}

if (require.main === module) {
  require('../models').sequelize.sync().then(() => {
    notifyCardDueDates().then(() => {
      console.log('Notificações de vencimento processadas.');
      process.exit(0);
    });
  });
}

module.exports = notifyCardDueDates; 
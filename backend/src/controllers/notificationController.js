const { Notification } = require('../models');

exports.list = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(notifications);
  } catch (err) {
    console.error('Erro ao listar notificações:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!notification) return res.status(404).json({ error: 'Notificação não encontrada' });
    await notification.update({ read: true });
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao marcar notificação como lida:', err);
    res.status(400).json({ error: err.message });
  }
}; 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Notification } = require('../models');

function validatePasswordStrength(pwd) {
  const errors = [];
  if (!pwd || pwd.length < 8) errors.push('mínimo de 8 caracteres');
  if (!/[A-Z]/.test(pwd)) errors.push('uma letra maiúscula');
  if (!/[a-z]/.test(pwd)) errors.push('uma letra minúscula');
  if (!/[0-9]/.test(pwd)) errors.push('um número');
  if (!/[!@#$%^&*(),.?":{}|<>\[\]\\/;'`~_+=-]/.test(pwd)) errors.push('um caractere especial');
  return { ok: errors.length === 0, errors };
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const strength = validatePasswordStrength(password);
    if (!strength.ok) {
      return res.status(400).json({ error: `Senha fraca: inclua ${strength.errors.join(', ')}.` });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'E-mail já cadastrado.' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET não está definido ao assinar o token!');
      return res.status(500).json({ error: 'Erro interno do servidor: JWT_SECRET não configurado.' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer login.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'A nova senha deve ser diferente da senha atual.' });
    }
    const strength = validatePasswordStrength(newPassword);
    if (!strength.ok) {
      return res.status(400).json({ error: `Senha fraca: inclua ${strength.errors.join(', ')}.` });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Senha atual incorreta.' });

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    user.passwordChangedAt = new Date();
    await user.save();

    try {
      await Notification.create({
        user_id: user.id,
        type: 'security_password_change',
        message: `Senha alterada em ${new Date().toISOString()} (IP: ${req.ip || ''})`,
      });
    } catch (logErr) {
      console.warn('Falha ao registrar notificação de auditoria de troca de senha:', logErr.message);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao trocar senha.' });
  }
};
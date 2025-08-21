const express = require('express');
const router = express.Router();
const { User } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');

// Middleware para checar admin
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado.' });
  next();
}

// Validação de força de senha (mesma regra do authController)
function validatePasswordStrength(pwd) {
  const errors = [];
  if (!pwd || pwd.length < 8) errors.push('mínimo de 8 caracteres');
  if (!/[A-Z]/.test(pwd)) errors.push('uma letra maiúscula');
  if (!/[a-z]/.test(pwd)) errors.push('uma letra minúscula');
  if (!/[0-9]/.test(pwd)) errors.push('um número');
  if (!/[!@#$%^&*(),.?":{}|<>\[\]\\/;'`~_+=-]/.test(pwd)) errors.push('um caractere especial');
  return { ok: errors.length === 0, errors };
}

// Listar usuários
router.get('/', authMiddleware, isAdmin, async (req, res) => {
  const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role'] });
  res.json(users);
});

// Criar usuário
router.post('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'Dados obrigatórios.' });
    const strength = validatePasswordStrength(password);
    if (!strength.ok) {
      return res.status(400).json({ error: `Senha fraca: inclua ${strength.errors.join(', ')}.` });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'E-mail já cadastrado.' });
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
});

// Remover usuário
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  await user.destroy();
  res.json({ success: true });
});

module.exports = router;
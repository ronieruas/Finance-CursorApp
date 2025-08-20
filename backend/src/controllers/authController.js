const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
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
      console.log('--- AuthController: Tentativa de login recebida ---');
      // console.log('Request body:', '[REDACTED]');
      const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('Login failed: invalid credentials');
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    console.log('Usuário encontrado:', user.id);

    const valid = await bcrypt.compare(password, user.password);

    console.log('Password validation result:', valid); // Log do resultado da comparação

    if (!valid) {
      console.log('Login failed: invalid credentials');
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
    const jwtSecret = process.env.JWT_SECRET;
    // [sanitized] Não logar o valor de JWT_SECRET aqui
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
    // Verificar se o usuário está autenticado
    if (!req.user) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }
    
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Senha atual incorreta.' });
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao trocar senha.' });
  }
};
const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido.' });

  const [, token] = authHeader.split(' ');
  if (!token) return res.status(401).json({ error: 'Token mal formatado.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Verifica se o token é anterior à última troca de senha
    const user = await User.findByPk(decoded.id, { attributes: ['id', 'role', 'passwordChangedAt'] });
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado.' });
    const pwdChangedAt = user.passwordChangedAt;
    if (decoded.iat && pwdChangedAt) {
      const tokenIssuedAtMs = decoded.iat * 1000;
      const pwdChangedMs = new Date(pwdChangedAt).getTime();
      if (tokenIssuedAtMs < pwdChangedMs) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
      }
    }
    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    console.error('AuthMiddleware: JWT verification error:', err.message);
    return res.status(401).json({ error: 'Token inválido.' });
  }
};
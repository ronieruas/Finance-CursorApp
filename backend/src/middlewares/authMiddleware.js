const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('[authMiddleware] Authorization header:', authHeader);
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido.' });

  const [, token] = authHeader.split(' ');
  console.log('[authMiddleware] Token extraído:', token);
  if (!token) return res.status(401).json({ error: 'Token mal formatado.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[authMiddleware] Usuário decodificado:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[authMiddleware] Erro ao verificar token:', err);
    return res.status(401).json({ error: 'Token inválido.' });
  }
};
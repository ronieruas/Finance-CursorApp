const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('AuthMiddleware: authHeader:', authHeader);
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido.' });

  [, token] = authHeader.split(' ');
  console.log('AuthMiddleware: token:', token);
  if (!token) return res.status(401).json({ error: 'Token mal formatado.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('AuthMiddleware: JWT verification error:', err);
    return res.status(401).json({ error: 'Token inválido.' });
  }
};
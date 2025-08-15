const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido.' });

  // Log para verificar se o middleware está sendo atingido e o conteúdo de req.user
  console.log('AuthMiddleware: Request received.');
  if (req.user) {
    console.log('AuthMiddleware: req.user exists. User ID:', req.user.id);
  } else {
    console.log('AuthMiddleware: req.user does not exist.');
  }

  const [, token] = authHeader.split(' ');
  if (!token) return res.status(401).json({ error: 'Token mal formatado.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[authMiddleware] Erro ao verificar token:', err);
    return res.status(401).json({ error: 'Token inválido.' });
  }
};
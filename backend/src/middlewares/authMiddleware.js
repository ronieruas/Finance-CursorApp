const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log('AuthMiddleware: Request received.');
  console.log('AuthMiddleware: req.url:', req.url);
  console.log('AuthMiddleware: req.originalUrl:', req.originalUrl);
  console.log('AuthMiddleware: req.headers:', req.headers);
  
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('AuthMiddleware: No authorization header found.');
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  // Log para verificar se o middleware está sendo atingido e o conteúdo de req.user
  if (req.user) {
    console.log('AuthMiddleware: req.user exists. User ID:', req.user.id);
  } else {
    console.log('AuthMiddleware: req.user does not exist.');
  }

  const [, token] = authHeader.split(' ');
  if (!token) {
    console.log('AuthMiddleware: Malformed token.');
    return res.status(401).json({ error: 'Token mal formatado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('AuthMiddleware: Token verified successfully.');
    next();
  } catch (err) {
    console.error('[authMiddleware] Erro ao verificar token:', err);
    return res.status(401).json({ error: 'Token inválido.' });
  }
};
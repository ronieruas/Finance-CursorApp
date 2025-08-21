const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rate limiter simples em memória para /change-password
const changePasswordAttempts = new Map();
function changePasswordLimiter(req, res, next) {
  try {
    const key = (req.user && req.user.id) || req.ip;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const max = 5; // 5 tentativas por janela
    let arr = changePasswordAttempts.get(key) || [];
    arr = arr.filter(ts => now - ts < windowMs);
    if (arr.length >= max) {
      return res.status(429).json({ error: 'Muitas tentativas. Tente novamente mais tarde.' });
    }
    arr.push(now);
    changePasswordAttempts.set(key, arr);
    next();
  } catch (e) {
    next();
  }
}

// Rate limiter simples em memória para /login
const loginAttempts = new Map();
function loginLimiter(req, res, next) {
  try {
    const email = (req.body && req.body.email) || '';
    const key = `${req.ip}:${email.toLowerCase()}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const max = 10; // 10 tentativas por janela por IP/email
    let arr = loginAttempts.get(key) || [];
    arr = arr.filter(ts => now - ts < windowMs);
    if (arr.length >= max) {
      return res.status(429).json({ error: 'Muitas tentativas de login. Tente novamente mais tarde.' });
    }
    arr.push(now);
    loginAttempts.set(key, arr);
    next();
  } catch (e) {
    next();
  }
}

router.post('/register', (req, res, next) => {
  authController.register(req, res, next);
});

router.post('/login', loginLimiter, (req, res, next) => {
  // console.log('Login request body: [REDACTED]');
  authController.login(req, res, next);
});

router.put('/change-password', authMiddleware, changePasswordLimiter, (req, res, next) => {
  authController.changePassword(req, res, next);
});

module.exports = router;
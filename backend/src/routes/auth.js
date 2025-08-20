console.log('Loading auth routes module...');

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

console.log('Setting up auth routes...');

router.post('/register', (req, res, next) => {
  console.log('Auth route: /register');
  authController.register(req, res, next);
});

router.post('/login', (req, res, next) => {
  console.log('Auth route: /login');
  // console.log('Login request body: [REDACTED]');
  authController.login(req, res, next);
});

router.put('/change-password', (req, res, next) => {
  console.log('Auth route: /change-password');
  authController.changePassword(req, res, next);
});

console.log('Auth routes setup complete.');

module.exports = router;
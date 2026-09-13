const express = require('express');
const router = express.Router();
const { signup, login, googleAuth } = require('../controllers/authController');
const { signupValidation, loginValidation } = require('../middleware/validators');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', authLimiter, signupValidation, signup);
router.post('/login', authLimiter, loginValidation, login);
router.post('/google', authLimiter, googleAuth);

module.exports = router;
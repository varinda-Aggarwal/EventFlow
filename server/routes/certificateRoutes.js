const express = require('express');
const router = express.Router();
const { verifyCertificate } = require('../controllers/certificateController');
const rateLimit = require('express-rate-limit');

// Public route — rate limited to prevent enumeration/brute-force attempts on certificate IDs
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many verification attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/verify/:certificateId', verifyLimiter, verifyCertificate);

module.exports = router;
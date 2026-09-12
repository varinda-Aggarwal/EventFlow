const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { getPublicEventDetails, registerForEvent } = require('../controllers/registrationController');
const { registrationValidation } = require('../middleware/validators');

// This route is public (no login) — rate limiting is important here
// to prevent spam registrations or automated bot abuse
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'Too many registration attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/event/:eventId', getPublicEventDetails);
router.post('/event/:eventId', registrationLimiter, registrationValidation, registerForEvent);

module.exports = router;
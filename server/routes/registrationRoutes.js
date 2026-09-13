const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  getPublicEventDetails,
  browseEvents,
  registerForEvent,
  getMyRegistrations,
  downloadMyCertificate,
} = require('../controllers/registrationController');
const { registrationValidation } = require('../middleware/validators');
const { protect, authorize } = require('../middleware/authMiddleware');

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'Too many registration attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public — no login required, teaser info only
router.get('/browse', browseEvents);

// Login required from here on
router.use(protect);

router.get('/event/:eventId', getPublicEventDetails);
router.post('/event/:eventId', authorize('participant'), registrationLimiter, registrationValidation, registerForEvent);
router.get('/my-registrations', authorize('participant'), getMyRegistrations);
router.get('/my-certificates/:certificateId/download', authorize('participant'), downloadMyCertificate);

module.exports = router;
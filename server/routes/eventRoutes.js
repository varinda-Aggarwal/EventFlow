const express = require('express');
const router = express.Router();
const {
  createEvent,
  getMyEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { eventValidation } = require('../middleware/validators');

// All routes below require login AND organizer role
router.use(protect, authorize('organizer'));

router.post('/', eventValidation, createEvent);
router.get('/my-events', getMyEvents);
router.get('/:id', getEventById);
router.put('/:id', eventValidation, updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
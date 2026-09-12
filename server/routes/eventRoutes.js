const express = require('express');
const router = express.Router();
const {
  createEvent,
  getMyEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { scanAttendance, getAttendanceList, lockAttendance } = require('../controllers/attendanceController');
const { getEligibility, generateCertificates, downloadCertificate } = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { eventValidation, updateEventValidation } = require('../middleware/validators');

router.use(protect, authorize('organizer'));

router.post('/', eventValidation, createEvent);
router.get('/my-events', getMyEvents);
router.get('/:id', getEventById);
router.put('/:id', updateEventValidation, updateEvent);
router.delete('/:id', deleteEvent);

router.post('/:eventId/attendance/scan', scanAttendance);
router.get('/:eventId/attendance', getAttendanceList);
router.patch('/:eventId/attendance/lock', lockAttendance);

router.get('/:eventId/certificates/eligibility', getEligibility);
router.post('/:eventId/certificates/generate', generateCertificates);
router.get('/:eventId/certificates/:certificateId/download', downloadCertificate);

module.exports = router;
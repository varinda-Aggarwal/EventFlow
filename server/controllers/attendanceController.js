const Event = require('../models/Event');
const Registration = require('../models/Registration');

// @desc    Scan QR and mark attendance
// @route   POST /api/events/:eventId/attendance/scan
// @access  Organizer only (must own the event)
const scanAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { qrToken } = req.body;

    if (!qrToken) {
      return res.status(400).json({ message: 'QR token is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Object-level authorization: organizer must own this event
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this event' });
    }

    if (event.attendanceLocked) {
      return res.status(403).json({ message: 'Attendance is locked for this event' });
    }

    const registration = await Registration.findOne({ qrToken });

    if (!registration) {
      return res.status(404).json({ message: 'Invalid QR code — no matching registration found' });
    }

    // Critical check: does this QR belong to THIS event, not some other event
    if (registration.event.toString() !== eventId) {
      return res.status(400).json({ message: 'This QR code does not belong to this event' });
    }

    if (registration.attendance === 'present') {
      return res.status(409).json({
        message: 'Attendance already marked',
        registrationId: registration.registrationId,
        name: registration.name,
        markedAt: registration.attendanceMarkedAt,
      });
    }

    registration.attendance = 'present';
    registration.attendanceMarkedAt = new Date();
    await registration.save();

    res.status(200).json({
      message: 'Attendance marked successfully',
      registrationId: registration.registrationId,
      name: registration.name,
      markedAt: registration.attendanceMarkedAt,
    });
  } catch (error) {
    console.error('Scan attendance error:', error);
    res.status(500).json({ message: 'Server error while marking attendance' });
  }
};

// @desc    Get attendance list for an event
// @route   GET /api/events/:eventId/attendance
// @access  Organizer only (must own the event)
const getAttendanceList = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this event' });
    }

    const registrations = await Registration.find({ event: eventId }).select(
      'name email registrationId attendance attendanceMarkedAt'
    );

    const totalRegistered = registrations.length;
    const totalPresent = registrations.filter((r) => r.attendance === 'present').length;
    const totalAbsent = totalRegistered - totalPresent;

    res.status(200).json({
      summary: {
        totalRegistered,
        totalPresent,
        totalAbsent,
        attendanceLocked: event.attendanceLocked,
      },
      registrations,
    });
  } catch (error) {
    console.error('Get attendance list error:', error);
    res.status(500).json({ message: 'Server error while fetching attendance list' });
  }
};

// @desc    Lock attendance for an event (finalizes it before certificate generation)
// @route   PATCH /api/events/:eventId/attendance/lock
// @access  Organizer only (must own the event)
const lockAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this event' });
    }

    if (event.attendanceLocked) {
      return res.status(409).json({ message: 'Attendance is already locked' });
    }

    event.attendanceLocked = true;
    event.status = 'completed';
    await event.save();

    res.status(200).json({ message: 'Attendance locked successfully', event });
  } catch (error) {
    console.error('Lock attendance error:', error);
    res.status(500).json({ message: 'Server error while locking attendance' });
  }
};

module.exports = { scanAttendance, getAttendanceList, lockAttendance };
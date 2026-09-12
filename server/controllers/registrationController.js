const QRCode = require('qrcode');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { generateRegistrationId, generateQrToken } = require('../utils/idGenerator');

// @desc    Get public event details (for the registration page)
// @route   GET /api/registrations/event/:eventId
// @access  Public — no login required
const getPublicEventDetails = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).select(
      'title description date time venue registrationDeadline maxParticipants status'
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Don't expose events that aren't actually open for registration
    if (event.status !== 'registration_open') {
      return res.status(403).json({ message: 'Registration is not open for this event' });
    }

    res.status(200).json({ event });
  } catch (error) {
    console.error('Get public event error:', error);
    res.status(500).json({ message: 'Server error while fetching event' });
  }
};

// @desc    Register a participant for an event
// @route   POST /api/registrations/event/:eventId
// @access  Public — no login required
const registerForEvent = async (req, res) => {
  try {
    const { name, email, phone, college, course, year } = req.body;
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'registration_open') {
      return res.status(403).json({ message: 'Registration is not open for this event' });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(403).json({ message: 'Registration deadline has passed' });
    }

    const currentCount = await Registration.countDocuments({ event: eventId });
    if (currentCount >= event.maxParticipants) {
      return res.status(403).json({ message: 'Event has reached maximum capacity' });
    }

    const existing = await Registration.findOne({ event: eventId, email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'This email is already registered for this event' });
    }

    const registrationId = generateRegistrationId(currentCount + 1);
    const qrToken = generateQrToken();

    const registration = await Registration.create({
      event: eventId,
      name,
      email,
      phone,
      college,
      course,
      year,
      registrationId,
      qrToken,
    });

    // QR code contains only the random token — never the registration ID or personal data
    const qrCodeDataUrl = await QRCode.toDataURL(qrToken);

    res.status(201).json({
      message: 'Registration successful',
      registration: {
        registrationId: registration.registrationId,
        name: registration.name,
        eventTitle: event.title,
        qrCode: qrCodeDataUrl,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

module.exports = { getPublicEventDetails, registerForEvent };
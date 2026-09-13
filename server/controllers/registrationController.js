const QRCode = require('qrcode');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { generateRegistrationId, generateQrToken } = require('../utils/idGenerator');
const Certificate = require('../models/Certificate');
const generateCertificatePDF = require('../utils/certificateGenerator');

const browseEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: 'registration_open' })
      .select('title date time venue maxParticipants registrationDeadline')
      .sort({ date: 1 });

    res.status(200).json({ events });
  } catch (error) {
    console.error('Browse events error:', error);
    res.status(500).json({ message: 'Server error while fetching events' });
  }
};

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
    const { phone, college, course, year } = req.body;
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

const existing = await Registration.findOne({ event: eventId, participant: req.user._id });
if (existing) {
  return res.status(409).json({ message: 'You are already registered for this event' });
}

const globalCount = await Registration.countDocuments({});
const registrationId = generateRegistrationId(globalCount + 1);
    const qrToken = generateQrToken();

    const registration = await Registration.create({
      event: eventId,
      participant: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone,
      college,
      course,
      year,
      registrationId,
      qrToken,
    });

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

const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ participant: req.user._id })
      .populate('event', 'title date time venue status')
      .sort({ createdAt: -1 });

    const registrationIds = registrations.map((r) => r._id);
    const certificates = await Certificate.find({ registration: { $in: registrationIds } }).select('registration certificateId');
    const certMap = {};
    certificates.forEach((c) => { certMap[c.registration.toString()] = c.certificateId; });

    const result = registrations.map((r) => ({
      registrationId: r.registrationId,
      event: r.event,
      attendance: r.attendance,
      certificateAvailable: !!certMap[r._id.toString()],
      certificateId: certMap[r._id.toString()] || null,
    }));

    res.status(200).json({ registrations: result });
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({ message: 'Server error while fetching your registrations' });
  }
};

const downloadMyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId }).populate('registration');
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    if (certificate.registration.participant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this certificate' });
    }

    const pdfBuffer = await generateCertificatePDF({
      participantName: certificate.participantName,
      eventTitle: certificate.eventTitle,
      eventDate: certificate.eventDate,
      certificateId: certificate.certificateId,
      certificateType: certificate.certificateType,
      designTheme: certificate.designTheme,
      layoutStyle: certificate.layoutStyle,
      signatureName: certificate.signatureName,
      signatureDesignation: certificate.signatureDesignation,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${certificate.certificateId}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download my certificate error:', error);
    res.status(500).json({ message: 'Server error while downloading certificate' });
  }
};

module.exports = { getPublicEventDetails, browseEvents, registerForEvent, getMyRegistrations, downloadMyCertificate };
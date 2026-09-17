const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Certificate = require('../models/Certificate');
const { generateCertificateId } = require('../utils/idGenerator');
const generateCertificatePDF = require('../utils/certificateGenerator');
const logActivity = require('../utils/logActivity');

// @desc    Get certificate eligibility summary before generating
// @route   GET /api/events/:eventId/certificates/eligibility
// @access  Organizer only
const getEligibility = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this event' });
    }

    if (!event.attendanceLocked) {
      return res.status(403).json({ message: 'Attendance must be locked before checking certificate eligibility' });
    }

    const eligibleCount = await Registration.countDocuments({ event: eventId, attendance: 'present' });
    const alreadyGenerated = await Certificate.countDocuments({ event: eventId });

    res.status(200).json({
      eligibleCount,
      alreadyGenerated,
      pendingGeneration: eligibleCount - alreadyGenerated,
    });
  } catch (error) {
    console.error('Get eligibility error:', error);
    res.status(500).json({ message: 'Server error while checking eligibility' });
  }
};

// @desc    Generate certificates for all eligible (present) participants who don't have one yet
// @route   POST /api/events/:eventId/certificates/generate
// @access  Organizer only
const generateCertificates = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { certificateType, designTheme, layoutStyle, signatureName, signatureDesignation } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this event' });
    }

    if (!event.attendanceLocked) {
      return res.status(403).json({ message: 'Attendance must be locked before generating certificates' });
    }

    const eligibleRegistrations = await Registration.find({ event: eventId, attendance: 'present' });

    const existingCount = await Certificate.countDocuments();
    let sequence = existingCount + 1;
    let generatedCount = 0;

    for (const registration of eligibleRegistrations) {
      const exists = await Certificate.findOne({ registration: registration._id });
      if (exists) continue;

      const certificateId = generateCertificateId(sequence);
      sequence++;

      await Certificate.create({
        event: event._id,
        registration: registration._id,
        certificateId,
        participantName: registration.name,
        eventTitle: event.title,
        eventDate: event.date,
        certificateType: certificateType || 'participation',
        designTheme: designTheme || 'classicGold',
        layoutStyle: layoutStyle || 'ribbonElegant',
        signatureName,
        signatureDesignation,
      });

      generatedCount++;
    }

    if (generatedCount > 0) {
      await logActivity({
        organizer: event.organizer,
        event: event._id,
        type: 'certificates_generated',
        message: `${generatedCount} certificate(s) generated for ${event.title}.`,
      });
    }

    res.status(201).json({
      message: `${generatedCount} certificate(s) generated successfully`,
      generatedCount,
    });
  } catch (error) {
    console.error('Generate certificates error:', error);
    res.status(500).json({ message: 'Server error while generating certificates' });
  }
};

// @desc    Download a certificate PDF (organizer only, for any participant in their event)
// @route   GET /api/events/:eventId/certificates/:certificateId/download
// @access  Organizer only (must own the event)
const downloadCertificate = async (req, res) => {
  try {
    const { eventId, certificateId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this event' });
    }

    const certificate = await Certificate.findOne({ certificateId, event: eventId });
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
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
    console.error('Download certificate error:', error);
    res.status(500).json({ message: 'Server error while downloading certificate' });
  }
};

// @desc    Verify a certificate — public, no login required
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId });

    if (!certificate) {
      return res.status(404).json({ valid: false, message: 'Certificate not found or invalid' });
    }

    res.status(200).json({
      valid: true,
      participantName: certificate.participantName,
      eventTitle: certificate.eventTitle,
      eventDate: certificate.eventDate,
      certificateId: certificate.certificateId,
      issuedOn: certificate.createdAt,
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ message: 'Server error while verifying certificate' });
  }
};

module.exports = { getEligibility, generateCertificates, downloadCertificate, verifyCertificate };
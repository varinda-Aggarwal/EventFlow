const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Certificate = require('../models/Certificate');

// @desc    Get organizer's dashboard summary (their own events only)
// @route   GET /api/dashboard
// @access  Organizer only
const getDashboard = async (req, res) => {
  try {
    const myEvents = await Event.find({ organizer: req.user._id }).select('_id status date');
    const eventIds = myEvents.map((e) => e._id);

    const totalEvents = myEvents.length;
    const upcomingEvents = myEvents.filter((e) => new Date(e.date) >= new Date() && e.status !== 'completed').length;

    const totalRegistrations = await Registration.countDocuments({ event: { $in: eventIds } });
    const totalAttendance = await Registration.countDocuments({ event: { $in: eventIds }, attendance: 'present' });
    const certificatesGenerated = await Certificate.countDocuments({ event: { $in: eventIds } });

    res.status(200).json({
      totalEvents,
      upcomingEvents,
      totalRegistrations,
      totalAttendance,
      certificatesGenerated,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard' });
  }
};

module.exports = { getDashboard };
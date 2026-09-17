const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Certificate = require('../models/Certificate');
const Activity = require('../models/Activity');

const getDashboard = async (req, res) => {
  try {
    const myEvents = await Event.find({ organizer: req.user._id }).select('_id title status date venue maxParticipants registrationDeadline');
    const eventIds = myEvents.map((e) => e._id);

    const totalEvents = myEvents.length;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const isSameDay = (date) => new Date(date).toISOString().split('T')[0] === todayStr;
    const isUpcoming = (e) => new Date(e.date) > now && e.status !== 'completed' && !isSameDay(e.date);

    const upcomingEvents = myEvents.filter(isUpcoming).length;

    const totalRegistrations = await Registration.countDocuments({ event: { $in: eventIds } });
    const totalAttendance = await Registration.countDocuments({ event: { $in: eventIds }, attendance: 'present' });
    const certificatesGenerated = await Certificate.countDocuments({ event: { $in: eventIds } });

    // Upcoming events (next 5, soonest first) with live registration counts
    const upcomingList = myEvents
      .filter(isUpcoming)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    const upcomingWithCounts = await Promise.all(
      upcomingList.map(async (e) => {
        const count = await Registration.countDocuments({ event: e._id });
        return {
          _id: e._id,
          title: e.title,
          date: e.date,
          venue: e.venue,
          registrations: count,
          maxParticipants: e.maxParticipants,
        };
      })
    );

    // Active events (currently open for registration)
    const activeEvents = myEvents
      .filter((e) => isSameDay(e.date) && e.status !== 'completed')
      .map((e) => ({ _id: e._id, title: e.title, date: e.date }));

    // Upcoming deadlines (registration closing soon, not yet passed)
    const upcomingDeadlines = myEvents
      .filter((e) => e.status === 'registration_open' && new Date(e.registrationDeadline) >= now)
      .sort((a, b) => new Date(a.registrationDeadline) - new Date(b.registrationDeadline))
      .slice(0, 5)
      .map((e) => ({ _id: e._id, title: e.title, registrationDeadline: e.registrationDeadline }));

    // Recent activity — real logged actions (event created/updated, registrations, attendance, certificates)
    const recentActivity = await Activity.find({ organizer: req.user._id })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('type message createdAt');

    // Attendee growth — registrations per day for the last 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const growthData = await Registration.aggregate([
      { $match: { event: { $in: eventIds }, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Calendar — all event dates (for highlighting in a month view)
    const calendarEvents = myEvents.map((e) => ({ _id: e._id, title: e.title, date: e.date }));

    res.status(200).json({
      totalEvents,
      upcomingEvents,
      totalRegistrations,
      totalAttendance,
      certificatesGenerated,
      upcomingList: upcomingWithCounts,
      activeEvents,
      upcomingDeadlines,
      recentActivity,
      growthData,
      calendarEvents,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard' });
  }
};

module.exports = { getDashboard };
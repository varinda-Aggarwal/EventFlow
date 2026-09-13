const Event = require('../models/Event');

// @desc    Create a new event
// @route   POST /api/events
// @access  Organizer only
const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, venue, registrationDeadline, maxParticipants } = req.body;

    const event = await Event.create({
      title,
      description,
      date,
      time,
      venue,
      registrationDeadline,
      maxParticipants,
      organizer: req.user._id, // taken from the logged-in user, never trust a value sent by the client
    });

    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: error.message || 'Server error while creating event' });
  }
};

// @desc    Get all events created by the logged-in organizer
// @route   GET /api/events/my-events
// @access  Organizer only
const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ events });
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ message: 'Server error while fetching events' });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = q ? { title: { $regex: q, $options: 'i' } } : {};

    const events = await Event.find(filter).populate('organizer', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ events });
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({ message: 'Server error while fetching events' });
  }
};

// @desc    Get a single event by ID (organizer's own event only)
// @route   GET /api/events/:id
// @access  Organizer only
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isOwner = event.organizer._id.toString() === req.user._id.toString();

    res.status(200).json({ event, isOwner });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error while fetching event' });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Organizer only (must own the event)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this event' });
    }

    const allowedUpdates = ['title', 'description', 'date', 'time', 'venue', 'registrationDeadline', 'maxParticipants', 'status'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    await event.save();

    res.status(200).json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: error.message || 'Server error while updating event' });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Organizer only (must own the event)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this event' });
    }

    await event.deleteOne();

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error while deleting event' });
  }
};

module.exports = { createEvent, getMyEvents, getAllEvents, getEventById, updateEvent, deleteEvent };
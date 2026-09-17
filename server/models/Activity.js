const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    type: {
      type: String,
      enum: ['event_created', 'event_updated', 'registration', 'attendance_marked', 'certificates_generated'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
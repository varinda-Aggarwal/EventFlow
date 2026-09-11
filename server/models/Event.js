const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      maxlength: 2000,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String,
      required: [true, 'Event time is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    maxParticipants: {
      type: Number,
      required: [true, 'Maximum participants is required'],
      min: [1, 'Must allow at least 1 participant'],
    },
    status: {
      type: String,
      enum: ['draft', 'registration_open', 'registration_closed', 'completed'],
      default: 'draft',
    },
    attendanceLocked: {
      type: Boolean,
      default: false,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Prevents a registration deadline that falls after the event date itself
eventSchema.pre('validate', function (next) {
  if (this.registrationDeadline && this.date && this.registrationDeadline > this.date) {
    return next(new Error('Registration deadline cannot be after the event date'));
  }
});

module.exports = mongoose.model('Event', eventSchema);
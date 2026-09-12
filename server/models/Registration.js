const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    college: {
      type: String,
      required: [true, 'College is required'],
      trim: true,
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
    },
    year: {
      type: String,
      required: [true, 'Year is required'],
      trim: true,
    },
    registrationId: {
      type: String,
      required: true,
      unique: true,
    },
    // random, non-guessable token embedded in the QR code — never the registrationId itself
    qrToken: {
      type: String,
      required: true,
      unique: true,
    },
    attendance: {
      type: String,
      enum: ['pending', 'present'],
      default: 'pending',
    },
    attendanceMarkedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// A participant (by email) can only register once per event
registrationSchema.index({ event: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
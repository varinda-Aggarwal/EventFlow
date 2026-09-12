const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
      unique: true, // one certificate per registration, never regenerate a duplicate
    },
    certificateId: {
      type: String,
      required: true,
      unique: true,
    },
    participantName: {
      type: String,
      required: true,
    },
    eventTitle: {
      type: String,
      required: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    certificateType: {
        type: String,
        enum: ['participation', 'completion', 'winner'],
        default: 'participation',
    },
    designTheme: {
      type: String,
      enum: ['classicGold', 'emerald', 'royalBurgundy'],
      default: 'classicGold',
    },
    layoutStyle: {
      type: String,
      enum: ['ribbonElegant', 'modernBadge', 'ornateBorder'],
      default: 'ribbonElegant',
    },
    signatureName: {
        type: String,
        trim: true,
    },
    signatureDesignation: {
        type: String,
        trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
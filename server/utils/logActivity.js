const Activity = require('../models/Activity');

const logActivity = async ({ organizer, event, type, message }) => {
  try {
    await Activity.create({ organizer, event, type, message });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

module.exports = logActivity;
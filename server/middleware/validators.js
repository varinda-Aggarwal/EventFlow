const { body, validationResult } = require('express-validator');

// Runs after the rule chains below, collects any errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg })),
    });
  }
  next();
};

const signupValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),

  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['organizer', 'participant']).withMessage('Role must be either organizer or participant'),

  handleValidationErrors,
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  handleValidationErrors,
];

const eventValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Event title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Event description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('date')
    .notEmpty().withMessage('Event date is required')
    .isISO8601().withMessage('Enter a valid date'),

  body('time')
    .trim()
    .notEmpty().withMessage('Event time is required'),

  body('venue')
    .trim()
    .notEmpty().withMessage('Venue is required'),

  body('registrationDeadline')
    .notEmpty().withMessage('Registration deadline is required')
    .isISO8601().withMessage('Enter a valid date'),

  body('maxParticipants')
    .notEmpty().withMessage('Maximum participants is required')
    .isInt({ min: 1 }).withMessage('Must allow at least 1 participant'),

  handleValidationErrors,
];

const updateEventValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('date')
    .optional()
    .isISO8601().withMessage('Enter a valid date'),

  body('time')
    .optional()
    .trim()
    .notEmpty().withMessage('Time cannot be empty'),

  body('venue')
    .optional()
    .trim()
    .notEmpty().withMessage('Venue cannot be empty'),

  body('registrationDeadline')
    .optional()
    .isISO8601().withMessage('Enter a valid date'),

  body('maxParticipants')
    .optional()
    .isInt({ min: 1 }).withMessage('Must allow at least 1 participant'),

  body('status')
    .optional()
    .isIn(['draft', 'registration_open', 'registration_closed', 'completed'])
    .withMessage('Invalid status value'),

  handleValidationErrors,
];

const registrationValidation = [
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .isMobilePhone('any').withMessage('Enter a valid phone number'),

  body('college')
    .trim()
    .notEmpty().withMessage('College name is required'),

  body('course')
    .trim()
    .notEmpty().withMessage('Course is required'),

  body('year')
    .trim()
    .notEmpty().withMessage('Year is required'),

  handleValidationErrors,
];

module.exports = { signupValidation, loginValidation, eventValidation, updateEventValidation, registrationValidation };
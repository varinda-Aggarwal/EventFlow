const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register new user (organizer or participant)
// @route   POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic presence check (detailed validation handled by express-validator middleware)
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const user = await User.create({ name, email, password, role });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
  console.error('Signup error:', error);
  res.status(500).json({ message: 'Server error during signup' });
}
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Explicitly select password since schema has select: false
    const user = await User.findOne({ email }).select('+password');

    // Same generic message whether email doesn't exist or password is wrong
    // — this prevents attackers from figuring out which emails are registered
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
}
};

module.exports = { signup, login };
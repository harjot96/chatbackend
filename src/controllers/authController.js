const AuthService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { username, email, password, displayName, avatar, bio } = req.body;

  const result = await AuthService.register({
    username: username.trim(),
    email: email.trim().toLowerCase(),
    password,
    displayName,
    avatar,
    bio
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    ...result
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const result = await AuthService.login(username.trim(), password);

  res.json({
    success: true,
    message: 'Login successful',
    ...result
  });
});

/**
 * Verify token
 * GET /api/auth/verify
 */
const verifyToken = asyncHandler(async (req, res) => {
  // Token already verified by middleware
  res.json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});

/**
 * Logout (client-side only, just for API consistency)
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = {
  register,
  login,
  verifyToken,
  logout
};

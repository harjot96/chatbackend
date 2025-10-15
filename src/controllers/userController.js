const UserModel = require('../models/User');
const AuthService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get user profile by ID
 * GET /api/users/:userId
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = UserModel.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    user: UserModel.getPublicProfile(user)
  });
});

/**
 * Update user profile
 * PUT /api/users/:userId
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { displayName, avatar, bio, currentPassword, newPassword } = req.body;

  const user = UserModel.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update profile fields
  const updates = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (avatar !== undefined) updates.avatar = avatar;
  if (bio !== undefined) updates.bio = bio;

  // Handle password change
  if (currentPassword && newPassword) {
    await AuthService.changePassword(userId, currentPassword, newPassword);
  }

  // Apply updates
  const updatedUser = UserModel.update(userId, updates);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: UserModel.getPublicProfile(updatedUser)
  });
});

/**
 * Get all users
 * GET /api/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = UserModel.findAll();

  const publicUsers = users.map(user => UserModel.getPublicProfile(user));

  res.json({
    success: true,
    users: publicUsers,
    total: publicUsers.length
  });
});

/**
 * Search users
 * GET /api/users/search/:query
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.params;

  const results = UserModel.search(query);
  const publicResults = results.map(user => UserModel.getPublicProfile(user));

  res.json({
    success: true,
    query,
    results: publicResults,
    count: publicResults.length
  });
});

/**
 * Delete user (admin only - placeholder)
 * DELETE /api/users/:userId
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const deleted = UserModel.delete(userId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  searchUsers,
  deleteUser
};

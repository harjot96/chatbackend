const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkOwnership, optionalAuth } = require('../middleware/auth');

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Public
 */
router.get('/', optionalAuth, userController.getAllUsers);

/**
 * @route   GET /api/users/search/:query
 * @desc    Search users by username or display name
 * @access  Public
 */
router.get('/search/:query', optionalAuth, userController.searchUsers);

/**
 * @route   GET /api/users/:userId
 * @desc    Get user profile by ID
 * @access  Public
 */
router.get('/:userId', optionalAuth, userController.getUserProfile);

/**
 * @route   PUT /api/users/:userId
 * @desc    Update user profile
 * @access  Private (own profile only)
 */
router.put('/:userId', verifyToken, checkOwnership, userController.updateUserProfile);

/**
 * @route   DELETE /api/users/:userId
 * @desc    Delete user
 * @access  Private (admin or own profile)
 */
router.delete('/:userId', verifyToken, checkOwnership, userController.deleteUser);

module.exports = router;

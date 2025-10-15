const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { optionalAuth } = require('../middleware/auth');

/**
 * @route   GET /api/rooms
 * @desc    Get all active rooms
 * @access  Public
 */
router.get('/', optionalAuth, roomController.getAllRooms);

/**
 * @route   GET /api/rooms/:room/users
 * @desc    Get all users in a specific room
 * @access  Public
 */
router.get('/:room/users', optionalAuth, roomController.getRoomUsers);

/**
 * @route   GET /api/rooms/:room/messages
 * @desc    Get messages from a specific room
 * @access  Public
 */
router.get('/:room/messages', optionalAuth, roomController.getRoomMessages);

/**
 * @route   GET /api/rooms/:room/stats
 * @desc    Get statistics for a specific room
 * @access  Public
 */
router.get('/:room/stats', optionalAuth, roomController.getRoomStats);

module.exports = router;

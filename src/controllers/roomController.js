const SessionModel = require('../models/Session');
const MessageModel = require('../models/Message');
const UserModel = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { query } = require('../config/database');

/**
 * Get users in a specific room
 * GET /api/rooms/:room/users
 */
const getRoomUsers = asyncHandler(async (req, res) => {
  const { room } = req.params;

  const sessions = await SessionModel.findByRoom(room);
  
  const roomUsers = await Promise.all(sessions.map(async (session) => {
    return {
      id: session.userId,
      userId: session.userId,
      username: session.username,
      displayName: session.displayName || session.username,
      room: session.room,
      status: 'online'
    };
  }));

  res.json({
    success: true,
    room,
    data: roomUsers,
    count: roomUsers.length
  });
});

/**
 * Get all active rooms
 * GET /api/rooms
 */
const getAllRooms = asyncHandler(async (req, res) => {
  // Get all rooms from database
  const result = await query(
    `SELECT room_name, created_at
     FROM rooms
     ORDER BY room_name`
  );
  
  const rooms = result.rows;
  
  // Get user count and last activity for each room
  const roomsData = await Promise.all(rooms.map(async (room) => {
    const activeUsers = await SessionModel.getRoomCount(room.room_name);
    const messages = await MessageModel.findByRoom(room.room_name, 1);
    
    return {
      name: room.room_name,
      userCount: activeUsers || 0,
      lastActivity: messages.length > 0 ? messages[0].timestamp : room.created_at
    };
  }));

  res.json({
    success: true,
    data: roomsData,
    total: rooms.length
  });
});

/**
 * Get room messages
 * GET /api/rooms/:room/messages
 */
const getRoomMessages = asyncHandler(async (req, res) => {
  const { room } = req.params;
  const { limit = 100, offset = 0 } = req.query;

  const messages = await MessageModel.findByRoom(room, parseInt(limit), parseInt(offset));

  res.json({
    success: true,
    room,
    data: messages,
    total: messages.length,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

/**
 * Get room statistics
 * GET /api/rooms/:room/stats
 */
const getRoomStats = asyncHandler(async (req, res) => {
  const { room } = req.params;

  const stats = await MessageModel.getRoomStats(room);
  const userCount = await SessionModel.getRoomCount(room);

  res.json({
    success: true,
    room,
    data: {
      ...stats,
      activeUsers: userCount || 0
    }
  });
});

module.exports = {
  getRoomUsers,
  getAllRooms,
  getRoomMessages,
  getRoomStats
};

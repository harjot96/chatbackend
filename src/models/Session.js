const { query } = require('../config/database');

class SessionModel {
  /**
   * Create a new session
   */
  async create(sessionData) {
    // Get or create room
    const roomResult = await query(
      'SELECT get_or_create_room($1) as room_id',
      [sessionData.room]
    );
    const roomId = roomResult.rows[0].room_id;

    // Delete old session for this socket (if reconnecting)
    await query(
      'DELETE FROM active_sessions WHERE socket_id = $1',
      [sessionData.socketId]
    );

    // Insert new session
    const result = await query(
      `INSERT INTO active_sessions (user_id, socket_id, room_id)
       VALUES ($1, $2, $3)
       RETURNING session_id, user_id, socket_id, room_id, connected_at`,
      [sessionData.userId, sessionData.socketId, roomId]
    );

    return {
      sessionId: result.rows[0].session_id,
      socketId: sessionData.socketId,
      userId: sessionData.userId,
      username: sessionData.username,
      displayName: sessionData.displayName,
      avatar: sessionData.avatar,
      room: sessionData.room,
      joinedAt: result.rows[0].connected_at
    };
  }

  /**
   * Find session by socket ID
   */
  async findBySocketId(socketId) {
    const result = await query(
      `SELECT 
        s.session_id,
        s.user_id,
        s.socket_id,
        s.connected_at,
        u.username,
        u.display_name,
        u.avatar,
        r.room_name as room
       FROM active_sessions s
       JOIN users u ON s.user_id = u.user_id
       JOIN rooms r ON s.room_id = r.room_id
       WHERE s.socket_id = $1`,
      [socketId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      sessionId: row.session_id,
      socketId: row.socket_id,
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatar: row.avatar,
      room: row.room,
      joinedAt: row.connected_at
    };
  }

  /**
   * Find session by user ID
   */
  async findByUserId(userId) {
    const result = await query(
      `SELECT 
        s.session_id,
        s.user_id,
        s.socket_id,
        s.connected_at,
        u.username,
        u.display_name,
        u.avatar,
        r.room_name as room
       FROM active_sessions s
       JOIN users u ON s.user_id = u.user_id
       JOIN rooms r ON s.room_id = r.room_id
       WHERE s.user_id = $1
       ORDER BY s.connected_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      sessionId: row.session_id,
      socketId: row.socket_id,
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatar: row.avatar,
      room: row.room,
      joinedAt: row.connected_at
    };
  }

  /**
   * Find sessions by room
   */
  async findByRoom(roomName) {
    const result = await query(
      `SELECT 
        s.session_id,
        s.user_id,
        s.socket_id,
        s.connected_at,
        u.username,
        u.display_name,
        u.avatar,
        r.room_name as room
       FROM active_sessions s
       JOIN users u ON s.user_id = u.user_id
       JOIN rooms r ON s.room_id = r.room_id
       WHERE r.room_name = $1
       ORDER BY s.connected_at`,
      [roomName]
    );

    return result.rows.map(row => ({
      sessionId: row.session_id,
      socketId: row.socket_id,
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatar: row.avatar,
      room: row.room,
      joinedAt: row.connected_at
    }));
  }

  /**
   * Delete session
   */
  async delete(socketId) {
    const session = await this.findBySocketId(socketId);
    
    if (session) {
      await query(
        'DELETE FROM active_sessions WHERE socket_id = $1',
        [socketId]
      );
    }

    return session;
  }

  /**
   * Get all active sessions
   */
  async getAll() {
    const result = await query(
      `SELECT 
        s.session_id,
        s.user_id,
        s.socket_id,
        s.connected_at,
        u.username,
        u.display_name,
        u.avatar,
        r.room_name as room
       FROM active_sessions s
       JOIN users u ON s.user_id = u.user_id
       JOIN rooms r ON s.room_id = r.room_id
       ORDER BY s.connected_at DESC`
    );

    return result.rows.map(row => ({
      sessionId: row.session_id,
      socketId: row.socket_id,
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name,
      avatar: row.avatar,
      room: row.room,
      joinedAt: row.connected_at
    }));
  }

  /**
   * Get room count
   */
  async getRoomCount(roomName) {
    const result = await query(
      `SELECT COUNT(DISTINCT s.user_id) as count
       FROM active_sessions s
       JOIN rooms r ON s.room_id = r.room_id
       WHERE r.room_name = $1`,
      [roomName]
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * Get total active sessions
   */
  async getTotalActive() {
    const result = await query(
      'SELECT COUNT(*) as count FROM active_sessions'
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * Get all active rooms
   */
  async getRooms() {
    const result = await query(
      `SELECT DISTINCT r.room_name
       FROM active_sessions s
       JOIN rooms r ON s.room_id = r.room_id
       ORDER BY r.room_name`
    );

    return result.rows.map(row => row.room_name);
  }

  /**
   * Update session activity
   */
  async updateActivity(socketId) {
    await query(
      'UPDATE active_sessions SET last_activity = CURRENT_TIMESTAMP WHERE socket_id = $1',
      [socketId]
    );
  }

  /**
   * Clean up old sessions (inactive for more than X minutes)
   */
  async cleanupOldSessions(minutesInactive = 60) {
    const result = await query(
      `DELETE FROM active_sessions 
       WHERE last_activity < NOW() - INTERVAL '${minutesInactive} minutes'
       RETURNING session_id`,
      []
    );

    return result.rowCount;
  }
}

module.exports = new SessionModel();

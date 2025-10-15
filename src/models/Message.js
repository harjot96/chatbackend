const { query } = require('../config/database');

class MessageModel {
  /**
   * Create a new message
   */
  async create(messageData) {
    // Get or create room
    const roomResult = await query(
      'SELECT get_or_create_room($1) as room_id',
      [messageData.room]
    );
    const roomId = roomResult.rows[0].room_id;

    // Insert message
    const result = await query(
      `INSERT INTO messages (user_id, room_id, message_text)
       VALUES ($1, $2, $3)
       RETURNING message_id, user_id, room_id, message_text, created_at`,
      [messageData.userId, roomId, messageData.message]
    );

    const message = result.rows[0];

    return {
      id: message.message_id,
      username: messageData.username,
      displayName: messageData.displayName,
      avatar: messageData.avatar,
      userId: message.user_id,
      message: message.message_text,
      room: messageData.room,
      timestamp: message.created_at,
      delivered: false,
      deliveredTo: [],
      read: false,
      readBy: []
    };
  }

  /**
   * Find messages by room
   */
  async findByRoom(roomName, limit = 100, offset = 0) {
    const result = await query(
      `SELECT 
        m.message_id,
        m.message_text,
        m.created_at,
        m.edited_at,
        m.is_deleted,
        u.user_id,
        u.username,
        u.display_name,
        u.avatar,
        r.room_name,
        COALESCE(
          json_agg(DISTINCT mr.user_id) FILTER (WHERE mr.user_id IS NOT NULL),
          '[]'::json
        ) as read_by,
        COALESCE(
          json_agg(DISTINCT md.user_id) FILTER (WHERE md.user_id IS NOT NULL),
          '[]'::json
        ) as delivered_to
       FROM messages m
       JOIN users u ON m.user_id = u.user_id
       JOIN rooms r ON m.room_id = r.room_id
       LEFT JOIN message_reads mr ON m.message_id = mr.message_id
       LEFT JOIN message_deliveries md ON m.message_id = md.message_id
       WHERE r.room_name = $1 AND m.is_deleted = false
       GROUP BY m.message_id, u.user_id, r.room_name
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [roomName, limit, offset]
    );

    return result.rows.map(row => this.mapMessage(row)).reverse();
  }

  /**
   * Find message by ID
   */
  async findById(messageId, roomName) {
    const result = await query(
      `SELECT 
        m.message_id,
        m.message_text,
        m.created_at,
        u.user_id,
        u.username,
        u.display_name,
        u.avatar,
        r.room_name
       FROM messages m
       JOIN users u ON m.user_id = u.user_id
       JOIN rooms r ON m.room_id = r.room_id
       WHERE m.message_id = $1 AND r.room_name = $2`,
      [messageId, roomName]
    );

    return result.rows.length > 0 ? this.mapMessage(result.rows[0]) : null;
  }

  /**
   * Mark message as delivered
   */
  async markDelivered(messageId, roomName, userId) {
    // Check if message exists and user is not the sender
    const message = await query(
      `SELECT m.message_id, m.user_id 
       FROM messages m
       JOIN rooms r ON m.room_id = r.room_id
       WHERE m.message_id = $1 AND r.room_name = $2`,
      [messageId, roomName]
    );

    if (message.rows.length === 0 || message.rows[0].user_id === userId) {
      return null;
    }

    // Insert delivery record
    await query(
      `INSERT INTO message_deliveries (message_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (message_id, user_id) DO NOTHING`,
      [messageId, userId]
    );

    // Get updated deliveries
    const deliveries = await query(
      `SELECT user_id FROM message_deliveries WHERE message_id = $1`,
      [messageId]
    );

    return {
      delivered: true,
      deliveredTo: deliveries.rows.map(r => r.user_id)
    };
  }

  /**
   * Mark message as read
   */
  async markRead(messageId, roomName, userId) {
    // Check if message exists and user is not the sender
    const message = await query(
      `SELECT m.message_id, m.user_id 
       FROM messages m
       JOIN rooms r ON m.room_id = r.room_id
       WHERE m.message_id = $1 AND r.room_name = $2`,
      [messageId, roomName]
    );

    if (message.rows.length === 0 || message.rows[0].user_id === userId) {
      return null;
    }

    // Insert read record (also insert delivery if not exists)
    await query(
      `INSERT INTO message_deliveries (message_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (message_id, user_id) DO NOTHING`,
      [messageId, userId]
    );

    await query(
      `INSERT INTO message_reads (message_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (message_id, user_id) DO NOTHING`,
      [messageId, userId]
    );

    // Get updated reads
    const reads = await query(
      `SELECT user_id FROM message_reads WHERE message_id = $1`,
      [messageId]
    );

    return {
      read: true,
      readBy: reads.rows.map(r => r.user_id)
    };
  }

  /**
   * Mark all messages in room as read
   */
  async markAllRead(roomName, userId) {
    const result = await query(
      `WITH room_messages AS (
         SELECT m.message_id
         FROM messages m
         JOIN rooms r ON m.room_id = r.room_id
         WHERE r.room_name = $1 AND m.user_id != $2 AND m.is_deleted = false
       ),
       inserted_reads AS (
         INSERT INTO message_reads (message_id, user_id)
         SELECT message_id, $2 FROM room_messages
         ON CONFLICT (message_id, user_id) DO NOTHING
         RETURNING message_id
       ),
       inserted_deliveries AS (
         INSERT INTO message_deliveries (message_id, user_id)
         SELECT message_id, $2 FROM room_messages
         ON CONFLICT (message_id, user_id) DO NOTHING
         RETURNING message_id
       )
       SELECT message_id FROM inserted_reads`,
      [roomName, userId]
    );

    return result.rows.map(r => r.message_id);
  }

  /**
   * Delete message (soft delete)
   */
  async delete(messageId) {
    await query(
      'UPDATE messages SET is_deleted = true WHERE message_id = $1',
      [messageId]
    );
  }

  /**
   * Delete messages by room
   */
  async deleteByRoom(roomName) {
    await query(
      `UPDATE messages m
       SET is_deleted = true
       FROM rooms r
       WHERE m.room_id = r.room_id AND r.room_name = $1`,
      [roomName]
    );
  }

  /**
   * Get room statistics
   */
  async getRoomStats(roomName) {
    const result = await query(
      `SELECT 
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE mr.message_id IS NULL) as unread_count
       FROM messages m
       JOIN rooms r ON m.room_id = r.room_id
       LEFT JOIN message_reads mr ON m.message_id = mr.message_id
       WHERE r.room_name = $1 AND m.is_deleted = false`,
      [roomName]
    );

    return {
      totalMessages: parseInt(result.rows[0].total_messages),
      unreadCount: parseInt(result.rows[0].unread_count)
    };
  }

  /**
   * Map database row to message object
   */
  mapMessage(row) {
    return {
      id: row.message_id,
      username: row.username,
      displayName: row.display_name,
      avatar: row.avatar,
      userId: row.user_id,
      message: row.message_text,
      room: row.room_name,
      timestamp: row.created_at,
      editedAt: row.edited_at,
      delivered: row.delivered_to && row.delivered_to.length > 0,
      deliveredTo: Array.isArray(row.delivered_to) ? row.delivered_to : [],
      read: row.read_by && row.read_by.length > 0,
      readBy: Array.isArray(row.read_by) ? row.read_by : []
    };
  }

  /**
   * Edit message
   */
  async edit(messageId, roomName, userId, newText) {
    // Save old text to history
    const oldMessage = await this.findById(messageId, roomName);
    if (oldMessage && oldMessage.userId === userId) {
      await query(
        `INSERT INTO message_edit_history (message_id, old_text)
         VALUES ($1, $2)`,
        [messageId, oldMessage.message]
      );

      // Update message
      const result = await query(
        `UPDATE messages m
         SET message_text = $1, edited_at = CURRENT_TIMESTAMP
         FROM rooms r
         WHERE m.message_id = $2 
         AND m.user_id = $3
         AND m.room_id = r.room_id
         AND r.room_name = $4
         RETURNING m.message_id`,
        [newText, messageId, userId, roomName]
      );

      return result.rowCount > 0;
    }
    return false;
  }

  /**
   * Get message edit history
   */
  async getEditHistory(messageId) {
    const result = await query(
      `SELECT * FROM message_edit_history
       WHERE message_id = $1
       ORDER BY edited_at DESC`,
      [messageId]
    );

    return result.rows.map(row => ({
      historyId: row.history_id,
      messageId: row.message_id,
      oldText: row.old_text,
      editedAt: row.edited_at
    }));
  }
}

module.exports = new MessageModel();

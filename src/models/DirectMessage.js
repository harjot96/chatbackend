const { query } = require('../config/database');

class DirectMessageModel {
  /**
   * Send a direct message
   */
  async send(senderId, receiverId, messageText) {
    const result = await query(
      `INSERT INTO direct_messages (sender_id, receiver_id, message_text)
       VALUES ($1, $2, $3)
       RETURNING dm_id, sender_id, receiver_id, message_text, created_at, is_read`,
      [senderId, receiverId, messageText]
    );

    return this.mapDM(result.rows[0]);
  }

  /**
   * Get conversation between two users
   */
  async getConversation(userId1, userId2, limit = 50, offset = 0) {
    const result = await query(
      `SELECT dm.*, 
              u1.username as sender_username, 
              u1.display_name as sender_display_name,
              u1.avatar as sender_avatar,
              u2.username as receiver_username,
              u2.display_name as receiver_display_name,
              u2.avatar as receiver_avatar
       FROM direct_messages dm
       JOIN users u1 ON dm.sender_id = u1.user_id
       JOIN users u2 ON dm.receiver_id = u2.user_id
       WHERE ((dm.sender_id = $1 AND dm.receiver_id = $2) 
           OR (dm.sender_id = $2 AND dm.receiver_id = $1))
       AND dm.is_deleted = false
       ORDER BY dm.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId1, userId2, limit, offset]
    );

    return result.rows.map(row => this.mapDM(row)).reverse();
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId) {
    const result = await query(
      `SELECT DISTINCT ON (conversation_id) *
       FROM dm_conversations_view
       WHERE sender_id = $1 OR receiver_id = $1
       ORDER BY conversation_id, last_message_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Mark message as read
   */
  async markAsRead(dmId, userId) {
    await query(
      `UPDATE direct_messages 
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE dm_id = $1 AND receiver_id = $2`,
      [dmId, userId]
    );
  }

  /**
   * Mark all messages from user as read
   */
  async markAllAsRead(receiverId, senderId) {
    await query(
      `UPDATE direct_messages 
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false`,
      [receiverId, senderId]
    );
  }

  /**
   * Edit message
   */
  async edit(dmId, senderId, newText) {
    const result = await query(
      `UPDATE direct_messages 
       SET message_text = $1, edited_at = CURRENT_TIMESTAMP
       WHERE dm_id = $2 AND sender_id = $3
       RETURNING *`,
      [newText, dmId, senderId]
    );

    return result.rows.length > 0 ? this.mapDM(result.rows[0]) : null;
  }

  /**
   * Delete message (soft delete)
   */
  async delete(dmId, senderId) {
    await query(
      `UPDATE direct_messages 
       SET is_deleted = true
       WHERE dm_id = $1 AND sender_id = $2`,
      [dmId, senderId]
    );
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    const result = await query(
      `SELECT COUNT(*)::INTEGER as count
       FROM direct_messages
       WHERE receiver_id = $1 AND is_read = false AND is_deleted = false`,
      [userId]
    );

    return result.rows[0].count;
  }

  /**
   * Map database row to DM object
   */
  mapDM(row) {
    return {
      dmId: row.dm_id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      message: row.message_text,
      isRead: row.is_read,
      readAt: row.read_at,
      createdAt: row.created_at,
      editedAt: row.edited_at,
      isDeleted: row.is_deleted,
      senderUsername: row.sender_username,
      senderDisplayName: row.sender_display_name,
      senderAvatar: row.sender_avatar,
      receiverUsername: row.receiver_username,
      receiverDisplayName: row.receiver_display_name,
      receiverAvatar: row.receiver_avatar
    };
  }
}

module.exports = new DirectMessageModel();

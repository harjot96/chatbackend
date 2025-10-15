const { query } = require('../config/database');

class ReactionModel {
  /**
   * Add reaction to message
   */
  async add(messageId, userId, emoji) {
    try {
      const result = await query(
        `INSERT INTO message_reactions (message_id, user_id, emoji)
         VALUES ($1, $2, $3)
         ON CONFLICT (message_id, user_id, emoji) DO NOTHING
         RETURNING reaction_id, message_id, user_id, emoji, created_at`,
        [messageId, userId, emoji]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove reaction from message
   */
  async remove(messageId, userId, emoji) {
    await query(
      `DELETE FROM message_reactions
       WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
      [messageId, userId, emoji]
    );
  }

  /**
   * Get reactions for a message
   */
  async getByMessage(messageId) {
    const result = await query(
      `SELECT mr.*, u.username, u.display_name, u.avatar
       FROM message_reactions mr
       JOIN users u ON mr.user_id = u.user_id
       WHERE mr.message_id = $1
       ORDER BY mr.created_at`,
      [messageId]
    );

    return result.rows.map(row => ({
      reactionId: row.reaction_id,
      messageId: row.message_id,
      userId: row.user_id,
      emoji: row.emoji,
      username: row.username,
      displayName: row.display_name,
      avatar: row.avatar,
      createdAt: row.created_at
    }));
  }

  /**
   * Get reaction summary for a message
   */
  async getSummary(messageId) {
    const result = await query(
      `SELECT emoji, COUNT(*) as count, 
              json_agg(json_build_object(
                'userId', user_id,
                'username', username
              )) as users
       FROM (
         SELECT mr.emoji, mr.user_id, u.username
         FROM message_reactions mr
         JOIN users u ON mr.user_id = u.user_id
         WHERE mr.message_id = $1
       ) sub
       GROUP BY emoji
       ORDER BY count DESC`,
      [messageId]
    );

    return result.rows;
  }
}

module.exports = new ReactionModel();

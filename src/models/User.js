const { query } = require('../config/database');

class UserModel {
  /**
   * Create a new user
   */
  async create(userData) {
    const result = await query(
      `INSERT INTO users (username, email, password, display_name, avatar, bio)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, username, email, display_name, avatar, bio, status, created_at, last_login`,
      [
        userData.username,
        userData.email,
        userData.password,
        userData.displayName || userData.username,
        userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=667eea&color=fff`,
        userData.bio || ''
      ]
    );

    return this.mapUser(result.rows[0]);
  }

  /**
   * Find user by ID
   */
  async findById(userId) {
    const result = await query(
      'SELECT * FROM users WHERE user_id = $1',
      [userId]
    );

    return result.rows.length > 0 ? this.mapUser(result.rows[0]) : null;
  }

  /**
   * Find user by username
   */
  async findByUsername(username) {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    return result.rows.length > 0 ? this.mapUser(result.rows[0]) : null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return result.rows.length > 0 ? this.mapUser(result.rows[0]) : null;
  }

  /**
   * Find user by username or email
   */
  async findByUsernameOrEmail(identifier) {
    const result = await query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [identifier]
    );

    return result.rows.length > 0 ? this.mapUser(result.rows[0]) : null;
  }

  /**
   * Update user
   */
  async update(userId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic UPDATE query
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = this.camelToSnake(key);
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return await this.findById(userId);
    }

    values.push(userId);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')}
       WHERE user_id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.mapUser(result.rows[0]) : null;
  }

  /**
   * Delete user
   */
  async delete(userId) {
    const result = await query(
      'DELETE FROM users WHERE user_id = $1 RETURNING user_id',
      [userId]
    );

    return result.rowCount > 0;
  }

  /**
   * Find all users
   */
  async findAll(limit = 100, offset = 0) {
    const result = await query(
      `SELECT * FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map(row => this.mapUser(row));
  }

  /**
   * Search users
   */
  async search(searchQuery, limit = 50) {
    const result = await query(
      `SELECT * FROM users 
       WHERE username ILIKE $1 OR display_name ILIKE $1
       ORDER BY username
       LIMIT $2`,
      [`%${searchQuery}%`, limit]
    );

    return result.rows.map(row => this.mapUser(row));
  }

  /**
   * Set user status (online/offline)
   */
  async setStatus(userId, online, lastSeen = new Date()) {
    await query(
      `UPDATE users 
       SET status = $1, last_seen = $2
       WHERE user_id = $3`,
      [online ? 'online' : 'offline', lastSeen, userId]
    );
  }

  /**
   * Get user status
   */
  async getStatus(userId) {
    const result = await query(
      'SELECT status, last_seen FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length > 0) {
      return {
        online: result.rows[0].status === 'online',
        lastSeen: result.rows[0].last_seen
      };
    }

    return { online: false, lastSeen: null };
  }

  /**
   * Get public profile
   */
  getPublicProfile(user) {
    if (!user) return null;

    return {
      userId: user.userId,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt
    };
  }

  /**
   * Get user count
   */
  async count() {
    const result = await query('SELECT COUNT(*) FROM users');
    return parseInt(result.rows[0].count);
  }

  /**
   * Map database row to user object
   */
  mapUser(row) {
    if (!row) return null;

    return {
      userId: row.user_id,
      username: row.username,
      email: row.email,
      password: row.password,
      displayName: row.display_name,
      avatar: row.avatar,
      bio: row.bio,
      status: row.status,
      lastSeen: row.last_seen,
      createdAt: row.created_at,
      lastLogin: row.last_login,
      updatedAt: row.updated_at
    };
  }

  /**
   * Convert camelCase to snake_case
   */
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

module.exports = new UserModel();

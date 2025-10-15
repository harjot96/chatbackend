const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const UserModel = require('../models/User');

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    // Check if user already exists
    const existingByUsername = await UserModel.findByUsername(userData.username);
    const existingByEmail = await UserModel.findByEmail(userData.email);

    if (existingByUsername || existingByEmail) {
      throw new Error('Username or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, config.security.saltRounds);

    // Create user
    const user = await UserModel.create({
      ...userData,
      password: hashedPassword
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      user: UserModel.getPublicProfile(user),
      token
    };
  }

  /**
   * Login user
   */
  async login(username, password) {
    // Find user by username or email
    const user = await UserModel.findByUsernameOrEmail(username);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await UserModel.update(user.userId, {
      lastLogin: new Date().toISOString()
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      user: UserModel.getPublicProfile(user),
      token
    };
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.userId,
        username: user.username,
        email: user.email
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, config.security.saltRounds);

    // Update password
    await UserModel.update(userId, { password: hashedPassword });

    return true;
  }
}

module.exports = new AuthService();

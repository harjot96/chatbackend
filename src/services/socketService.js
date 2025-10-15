const UserModel = require('../models/User');
const MessageModel = require('../models/Message');
const SessionModel = require('../models/Session');
const AuthService = require('./authService');

class SocketService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Initialize socket event handlers
   */
  initialize() {
    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      socket.on('join', (data) => this.handleJoin(socket, data));
      socket.on('send-message', (data) => this.handleSendMessage(socket, data));
      socket.on('message-delivered', (data) => this.handleMessageDelivered(socket, data));
      socket.on('message-read', (data) => this.handleMessageRead(socket, data));
      socket.on('mark-all-read', (data) => this.handleMarkAllRead(socket, data));
      socket.on('typing', (data) => this.handleTyping(socket, data));
      socket.on('update-online-status', (data) => this.handleUpdateStatus(socket, data));
      socket.on('leave-room', () => this.handleLeaveRoom(socket));
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  /**
   * Handle user joining a room
   */
  async handleJoin(socket, data) {
    try {
      const { username, room, userId, token } = data;
      
      let verifiedUserId = userId;
      let user = null;

      // Verify token if provided
      if (token) {
        try {
          const decoded = AuthService.verifyToken(token);
          verifiedUserId = decoded.userId;
          user = await UserModel.findById(verifiedUserId);
        } catch (error) {
          console.error('Token verification failed:', error.message);
        }
      }

      // If no valid user from token, check if userId exists
      if (!user && userId) {
        user = await UserModel.findById(userId);
      }

      // Create session
      const session = await SessionModel.create({
        socketId: socket.id,
        userId: verifiedUserId || socket.id,
        username: user?.username || username,
        displayName: user?.displayName || username,
        avatar: user?.avatar,
        room
      });

      // Update user status
      if (user) {
        await UserModel.setStatus(session.userId, true);
      }

      // Join room
      socket.join(room);
      console.log(`${session.displayName} joined room: ${room}`);

      // Notify others
      socket.to(room).emit('user-joined', {
        username: session.username,
        displayName: session.displayName,
        avatar: session.avatar,
        userId: session.userId,
        message: `${session.displayName} has joined the chat`,
        timestamp: new Date().toISOString()
      });

      // Send room users
      await this.emitRoomUsers(room);

      // Send message history
      const messages = await MessageModel.findByRoom(room);
      socket.emit('message-history', messages);
      
    } catch (error) {
      console.error('Error in handleJoin:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  /**
   * Handle sending a message
   */
  async handleSendMessage(socket, data) {
    try {
      const session = await SessionModel.findBySocketId(socket.id);
      
      if (!session) return;

      const message = await MessageModel.create({
        socketId: socket.id,
        username: session.username,
        displayName: session.displayName,
        avatar: session.avatar,
        userId: session.userId,
        message: data.message,
        room: session.room
      });

      this.io.to(session.room).emit('receive-message', message);
      
      console.log(`Message from ${session.displayName} in ${session.room}:`, data.message);
      
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    }
  }

  /**
   * Handle message delivered event
   */
  async handleMessageDelivered(socket, data) {
    try {
      const { messageId, room } = data;
      const session = await SessionModel.findBySocketId(socket.id);
      
      if (!session) return;

      const result = await MessageModel.markDelivered(messageId, room, session.userId);
      
      if (result) {
        this.io.to(room).emit('message-status-update', {
          messageId,
          delivered: result.delivered,
          deliveredTo: result.deliveredTo,
          deliveredBy: session.userId,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Error in handleMessageDelivered:', error);
    }
  }

  /**
   * Handle message read event
   */
  async handleMessageRead(socket, data) {
    try {
      const { messageId, room } = data;
      const session = await SessionModel.findBySocketId(socket.id);
      
      if (!session) return;

      const result = await MessageModel.markRead(messageId, room, session.userId);
      
      if (result) {
        this.io.to(room).emit('message-read-update', {
          messageId,
          read: result.read,
          readBy: result.readBy,
          readByUser: session.userId,
          readByUsername: session.displayName,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Error in handleMessageRead:', error);
    }
  }

  /**
   * Handle mark all messages as read
   */
  async handleMarkAllRead(socket, data) {
    try {
      const { room } = data;
      const session = await SessionModel.findBySocketId(socket.id);
      
      if (!session) return;

      const updatedMessages = await MessageModel.markAllRead(room, session.userId);
      
      if (updatedMessages.length > 0) {
        this.io.to(room).emit('messages-marked-read', {
          messageIds: updatedMessages,
          readBy: session.userId,
          readByUsername: session.displayName,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Error in handleMarkAllRead:', error);
    }
  }

  /**
   * Handle typing indicator
   */
  async handleTyping(socket, isTyping) {
    try {
      const session = await SessionModel.findBySocketId(socket.id);
      
      if (session) {
        socket.to(session.room).emit('user-typing', {
          username: session.username,
          displayName: session.displayName,
          userId: session.userId,
          isTyping
        });
      }
      
    } catch (error) {
      console.error('Error in handleTyping:', error);
    }
  }

  /**
   * Handle online status update
   */
  async handleUpdateStatus(socket, status) {
    try {
      const session = await SessionModel.findBySocketId(socket.id);
      
      if (session) {
        await UserModel.setStatus(session.userId, status.online);
        
        this.io.to(session.room).emit('user-status-update', {
          userId: session.userId,
          username: session.username,
          displayName: session.displayName,
          online: status.online,
          lastSeen: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('Error in handleUpdateStatus:', error);
    }
  }

  /**
   * Handle leave room
   */
  async handleLeaveRoom(socket) {
    try {
      const session = await SessionModel.findBySocketId(socket.id);
      
      if (session) {
        await this.handleUserLeave(socket, session);
        await SessionModel.delete(socket.id);
      }
      
    } catch (error) {
      console.error('Error in handleLeaveRoom:', error);
    }
  }

  /**
   * Handle disconnect
   */
  async handleDisconnect(socket) {
    try {
      const session = await SessionModel.findBySocketId(socket.id);
      
      if (session) {
        console.log(`${session.displayName} disconnected`);
        await this.handleUserLeave(socket, session);
        await SessionModel.delete(socket.id);
      }
      
    } catch (error) {
      console.error('Error in handleDisconnect:', error);
    }
  }

  /**
   * Handle user leaving (common logic for leave and disconnect)
   */
  async handleUserLeave(socket, session) {
    try {
      await UserModel.setStatus(session.userId, false);
      
      socket.to(session.room).emit('user-left', {
        username: session.username,
        displayName: session.displayName,
        userId: session.userId,
        message: `${session.displayName} has left the chat`,
        timestamp: new Date().toISOString()
      });

      socket.to(session.room).emit('user-status-update', {
        userId: session.userId,
        username: session.username,
        displayName: session.displayName,
        online: false,
        lastSeen: new Date().toISOString()
      });

      await this.emitRoomUsers(session.room);
      
    } catch (error) {
      console.error('Error in handleUserLeave:', error);
    }
  }

  /**
   * Emit updated room users list
   */
  async emitRoomUsers(room) {
    try {
      const sessions = await SessionModel.findByRoom(room);
      const roomUsersPromises = sessions.map(async (session) => ({
        ...session,
        status: await UserModel.getStatus(session.userId)
      }));

      const roomUsers = await Promise.all(roomUsersPromises);
      this.io.to(room).emit('room-users', roomUsers);
      
    } catch (error) {
      console.error('Error in emitRoomUsers:', error);
    }
  }
}

module.exports = SocketService;

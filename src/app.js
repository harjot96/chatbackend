const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const SessionModel = require('./models/Session');

const app = express();

// Middleware
app.use(cors({ origin: config.server.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (config.server.env === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Root endpoint
app.get('/', (req, res) => {
  const sessions = SessionModel.getAll();
  const rooms = SessionModel.getRooms();

  res.json({
    success: true,
    message: 'Chat Backend API with User Management',
    version: '2.0.0',
    stats: {
      activeUsers: sessions.length,
      totalRooms: rooms.length
    },
    endpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/verify',
        'POST /api/auth/logout'
      ],
      users: [
        'GET /api/users',
        'GET /api/users/:userId',
        'PUT /api/users/:userId',
        'GET /api/users/search/:query',
        'DELETE /api/users/:userId'
      ],
      rooms: [
        'GET /api/rooms',
        'GET /api/rooms/:room/users',
        'GET /api/rooms/:room/messages',
        'GET /api/rooms/:room/stats'
      ],
      health: 'GET /api/health'
    },
    documentation: 'See README.md and USER_MANAGEMENT_API.md'
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;

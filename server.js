const http = require('http');
const socketIo = require('socket.io');
const app = require('./src/app');
const config = require('./src/config');
const SocketService = require('./src/services/socketService');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: config.socket.cors
});

// Initialize Socket service
const socketService = new SocketService(io);
socketService.initialize();

// Start server
server.listen(config.server.port, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Chat Server Started Successfully!');
  console.log('='.repeat(60));
  console.log(`📡 Server running on port: ${config.server.port}`);
  console.log(`🌍 Environment: ${config.server.env}`);
  console.log(`🔗 Base URL: http://localhost:${config.server.port}`);
  console.log(`\n✨ Features Enabled:`);
  console.log('   ✓ User Registration & Authentication (JWT)');
  console.log('   ✓ Real-time Chat (Socket.IO)');
  console.log('   ✓ Online/Offline Status Tracking');
  console.log('   ✓ Message Read Receipts');
  console.log('   ✓ Message Delivery Status');
  console.log('   ✓ Typing Indicators');
  console.log('   ✓ Message History');
  console.log('   ✓ Multi-room Support');
  console.log(`\n📚 API Endpoints:`);
  console.log(`   → API Docs: http://localhost:${config.server.port}/`);
  console.log(`   → Health Check: http://localhost:${config.server.port}/api/health`);
  console.log(`\n💡 Quick Start:`);
  console.log(`   1. Open test-client-with-auth.html in your browser`);
  console.log(`   2. Register/Login or join as guest`);
  console.log(`   3. Start chatting!`);
  console.log('\n' + '='.repeat(60) + '\n');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${config.server.port} is already in use!`);
    console.log(`💡 Try running with a different port:`);
    console.log(`   PORT=4000 npm start\n`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} signal received: closing server gracefully...`);
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = server;

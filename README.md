# Professional Chat Backend with PostgreSQL & MVC Architecture

A production-ready, real-time chat backend built with **Node.js**, **Express**, **Socket.IO**, and **PostgreSQL** featuring professional **MVC architecture** with complete data persistence.

## ⭐ Key Highlights

- 🗄️ **PostgreSQL Database** - Persistent storage that survives restarts
- 🏗️ **MVC Architecture** - Professional code organization
- 🔐 **JWT Authentication** - Secure user authentication
- ⚡ **Real-time Chat** - Socket.IO powered messaging
- 📱 **Production Ready** - Scalable and battle-tested
- 📊 **Advanced Features** - Read receipts, online status, typing indicators

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)

### 1. Install Dependencies
```bash
cd ~/Desktop/chat-backend
npm install
```

### 2. Setup PostgreSQL

#### Auto Setup (Recommended)
```bash
./setup-database.sh
```

#### Manual Setup
```bash
# Install PostgreSQL
# macOS: brew install postgresql@15
# Linux: sudo apt install postgresql

# Create database
createdb chatdb

# Initialize schema
npm run db:init
```

### 3. Configure Environment

`.env` is already configured for local development:
```env
DATABASE_URL=postgresql://localhost:5432/chatdb
PORT=3001
JWT_SECRET=your-secret-key-here
```

### 4. Start Server
```bash
npm start
```

Server runs on **http://localhost:3001** ✨

### 5. Test It!
Open `test-client-with-auth.html` in your browser and start chatting!

---

## 🌟 Features

### Database Features
- ✅ **PostgreSQL Storage** - All data persists across restarts
- ✅ **Advanced Queries** - Fast searches with indexes
- ✅ **Data Integrity** - Foreign keys, constraints
- ✅ **Backup & Restore** - Easy data management
- ✅ **Scalable** - Handle millions of messages

### Chat Features
- ✅ **User Management** - Registration, login, profiles
- ✅ **Real-time Messaging** - Instant message delivery
- ✅ **Read Receipts** - See when messages are read (✓✓)
- ✅ **Delivery Status** - Track message delivery (✓)
- ✅ **Online Status** - Real-time presence tracking
- ✅ **Typing Indicators** - See when users are typing
- ✅ **Message History** - Full chat history stored
- ✅ **Multi-room Support** - Multiple chat rooms
- ✅ **Guest Mode** - Chat without registration

### Architecture Features
- 🏗️ **MVC Pattern** - Clean separation of concerns
- 📦 **Modular Design** - Easy to extend
- 🔒 **Security** - Password hashing, JWT, input validation
- 🧪 **Testable** - Easy unit and integration testing
- 📝 **Well Documented** - Comprehensive guides

---

## 📁 Project Structure

```
chat-backend/
├── server.js                      # Entry point
├── database/
│   ├── schema.sql                # PostgreSQL schema
│   └── init.js                   # Database initialization
├── src/
│   ├── app.js                    # Express configuration
│   ├── config/
│   │   ├── index.js              # App configuration
│   │   └── database.js           # PostgreSQL connection
│   ├── models/                   # Data layer (PostgreSQL)
│   │   ├── User.js              
│   │   ├── Message.js           
│   │   └── Session.js           
│   ├── controllers/              # Request handlers
│   ├── services/                 # Business logic
│   ├── routes/                   # API endpoints
│   ├── middleware/               # Auth, validation
│   └── validators/               # Input validation
└── docs/                         # Documentation
```

---

## 📚 Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts with authentication |
| `rooms` | Chat rooms |
| `messages` | All chat messages |
| `message_reads` | Read receipt tracking |
| `message_deliveries` | Delivery status tracking |
| `room_members` | Room membership |
| `active_sessions` | Active Socket.IO connections |

### Views

- `active_users_view` - Users with session counts
- `room_stats_view` - Room statistics
- `messages_with_user_view` - Messages with full user info

See **DATABASE_SETUP.md** for complete schema documentation.

---

## 🔌 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register    Register new user
POST   /api/auth/login       Login user
GET    /api/auth/verify      Verify JWT token
POST   /api/auth/logout      Logout user
```

### User Management

```
GET    /api/users            Get all users
GET    /api/users/:id        Get user profile
PUT    /api/users/:id        Update profile
GET    /api/users/search/:q  Search users
DELETE /api/users/:id        Delete user
```

### Room Management

```
GET    /api/rooms              Get all rooms
GET    /api/rooms/:room/users  Get room users
GET    /api/rooms/:room/messages  Get room messages
GET    /api/rooms/:room/stats  Get room statistics
```

### Example: Register User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "displayName": "John Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "uuid-here",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatar": "https://...",
    "createdAt": "2025-10-15T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

See **USER_MANAGEMENT_API.md** for complete API documentation.

---

## 🔌 Socket.IO Events

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `join` | `{ username, room, userId, token }` | Join room |
| `send-message` | `{ message }` | Send message |
| `message-delivered` | `{ messageId, room }` | Mark delivered |
| `message-read` | `{ messageId, room }` | Mark read |
| `mark-all-read` | `{ room }` | Mark all read |
| `typing` | `boolean` | Typing indicator |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `message-history` | `messages[]` | Previous messages |
| `receive-message` | `message` | New message |
| `message-read-update` | `{ messageId, ... }` | Read receipt |
| `user-joined` | `{ username, ... }` | User joined |
| `user-left` | `{ username, ... }` | User left |
| `room-users` | `users[]` | Updated user list |
| `user-typing` | `{ username, isTyping }` | Typing status |

---

## 🗄️ Database Operations

### Backup Database
```bash
pg_dump chatdb > backup.sql
```

### Restore Database
```bash
psql chatdb < backup.sql
```

### View Database
```bash
psql chatdb
\dt                    # List tables
\d users              # View table structure
SELECT * FROM users;  # Query users
```

### Clean Up Old Sessions
```sql
DELETE FROM active_sessions 
WHERE last_activity < NOW() - INTERVAL '1 hour';
```

---

## 📊 npm Scripts

```bash
npm start         # Start production server
npm run dev       # Start development server (auto-reload)
npm run db:init   # Initialize database (run once)
npm run db:setup  # Same as db:init
```

---

## 🧪 Testing

### Web Client
```bash
# Open in browser
open test-client-with-auth.html
```

### API Testing
```bash
# Health check
curl http://localhost:3001/api/health

# Get users
curl http://localhost:3001/api/users

# Run test script
node test-api.js
```

---

## 🚀 Production Deployment

### 1. Environment Variables

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=very-secure-random-string
DATABASE_URL=postgresql://user:pass@host:5432/chatdb
DB_SSL=true
```

### 2. Initialize Database

```bash
npm run db:init
```

### 3. Process Manager

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start server.js --name chat-backend

# Auto-start on reboot
pm2 startup
pm2 save
```

### 4. Cloud Database

#### Heroku
```bash
heroku addons:create heroku-postgresql:hobby-dev
heroku run npm run db:init
```

#### AWS RDS
1. Create PostgreSQL instance
2. Update `DATABASE_URL` in `.env`
3. Set `DB_SSL=true`
4. Run `npm run db:init`

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **README.md** | This file - Overview |
| **DATABASE_SETUP.md** | PostgreSQL setup guide |
| **POSTGRESQL_MIGRATION.md** | Migration guide |
| **ARCHITECTURE.md** | Architecture details |
| **USER_MANAGEMENT_API.md** | Complete API docs |
| **QUICKSTART.md** | Quick start guide |
| **START_HERE.md** | Getting started |

---

## 🔧 Configuration

### Database Configuration

`.env`:
```env
DATABASE_URL=postgresql://localhost:5432/chatdb
DB_POOL_SIZE=20
DB_SSL=false
```

`src/config/database.js`:
- Connection pooling
- Query helpers
- Transaction support
- Error handling

### Application Configuration

`src/config/index.js`:
- Server settings
- JWT configuration
- Security settings
- Socket.IO config

---

## 🔐 Security Features

- ✅ **Password Hashing** - bcrypt with salt
- ✅ **JWT Tokens** - Secure authentication
- ✅ **Input Validation** - All inputs validated
- ✅ **SQL Injection Protection** - Parameterized queries
- ✅ **XSS Protection** - Input sanitization
- ✅ **CORS Configuration** - Configurable origins

---

## 📈 Performance

### Database Optimization
- ✅ Connection pooling (20 connections)
- ✅ Indexed columns for fast queries
- ✅ Efficient joins with views
- ✅ Pagination support

### Scalability
- ✅ Horizontal scaling ready
- ✅ Stateless architecture
- ✅ Database connection pooling
- ✅ Async/await throughout

---

## 🎯 Roadmap

### Current (v2.0) ✅
- PostgreSQL integration
- MVC architecture
- User management
- Real-time chat
- Read receipts

### Future
- [ ] MongoDB option
- [ ] Redis caching
- [ ] Private messaging
- [ ] File uploads
- [ ] Voice/video calls
- [ ] Docker support
- [ ] Kubernetes deployment

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Follow MVC pattern
4. Write tests
5. Submit pull request

---

## 📄 License

ISC License

---

## 🙏 Built With

- [Node.js](https://nodejs.org/) - Runtime
- [Express.js](https://expressjs.com/) - Web framework
- [Socket.IO](https://socket.io/) - Real-time engine
- [PostgreSQL](https://www.postgresql.org/) - Database
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) - Password hashing
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - JWT
- [pg](https://node-postgres.com/) - PostgreSQL client

---

## ✨ Highlights

✅ **Production Ready** - Battle-tested stack  
✅ **Persistent Storage** - PostgreSQL database  
✅ **Professional Architecture** - Clean MVC pattern  
✅ **Comprehensive Docs** - Full documentation  
✅ **Easy Setup** - Automated scripts  
✅ **Scalable** - Ready for growth  

---

**Version:** 2.0.0 with PostgreSQL  
**Status:** Production Ready  
**Last Updated:** October 15, 2025

**Start building amazing chat applications! 🚀**

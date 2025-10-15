# Project Architecture Documentation

## 📁 Project Structure

```
chat-backend/
├── server.js                      # Main entry point
├── package.json                   # Dependencies and scripts
├── .env                          # Environment variables (not in git)
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
│
├── src/
│   ├── app.js                    # Express app configuration
│   │
│   ├── config/
│   │   └── index.js              # Centralized configuration
│   │
│   ├── controllers/              # Request handlers (business logic)
│   │   ├── authController.js     # Authentication endpoints
│   │   ├── userController.js     # User management endpoints
│   │   └── roomController.js     # Room management endpoints
│   │
│   ├── models/                   # Data models
│   │   ├── User.js               # User model (CRUD operations)
│   │   ├── Message.js            # Message model
│   │   └── Session.js            # Active session model
│   │
│   ├── routes/                   # API routes
│   │   ├── index.js              # Main router
│   │   ├── authRoutes.js         # Auth routes
│   │   ├── userRoutes.js         # User routes
│   │   └── roomRoutes.js         # Room routes
│   │
│   ├── middleware/               # Custom middleware
│   │   ├── auth.js               # JWT authentication
│   │   └── errorHandler.js       # Error handling
│   │
│   ├── services/                 # Business logic services
│   │   ├── authService.js        # Authentication logic
│   │   └── socketService.js      # Socket.IO event handling
│   │
│   ├── validators/               # Input validation
│   │   └── authValidator.js      # Auth input validation
│   │
│   └── utils/                    # Helper utilities
│
├── test-client-with-auth.html    # Test client with authentication
├── test-client.html              # Simple test client
├── test-api.js                   # API testing script
│
└── docs/                         # Documentation
    ├── README.md                 # Main documentation
    ├── ARCHITECTURE.md           # This file
    ├── USER_MANAGEMENT_API.md    # API documentation
    ├── QUICKSTART.md            # Quick start guide
    └── PROJECT_SUMMARY.md        # Project overview
```

---

## 🏗️ Architecture Pattern

This project follows a **Model-View-Controller (MVC)** architecture with additional service and middleware layers for better separation of concerns.

### Layer Responsibilities

```
┌─────────────────────────────────────────┐
│         Client (Browser/App)            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Routes (API Endpoints)              │  ← Define endpoints
│     - authRoutes.js                     │
│     - userRoutes.js                     │
│     - roomRoutes.js                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Middleware                          │  ← Validate & Authenticate
│     - auth.js (JWT verification)        │
│     - validators (input validation)     │
│     - errorHandler.js                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Controllers                         │  ← Handle requests
│     - authController.js                 │
│     - userController.js                 │
│     - roomController.js                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Services (Business Logic)           │  ← Core logic
│     - authService.js                    │
│     - socketService.js                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Models (Data Layer)                 │  ← Data operations
│     - User.js                           │
│     - Message.js                        │
│     - Session.js                        │
└─────────────────────────────────────────┘
```

---

## 📂 Component Details

### 1. **Entry Point** (`server.js`)
- Initializes HTTP server
- Sets up Socket.IO
- Starts the application
- Handles graceful shutdown

**Key Features:**
- Clean and minimal
- Error handling for uncaught exceptions
- Graceful shutdown on SIGTERM/SIGINT

### 2. **Application Setup** (`src/app.js`)
- Configures Express middleware
- Mounts routes
- Sets up error handlers

**Middleware Stack:**
```javascript
1. CORS
2. Body parsers (JSON, URL-encoded)
3. Request logging (development)
4. Routes
5. 404 handler
6. Error handler
```

### 3. **Configuration** (`src/config/`)
Centralized configuration management.

```javascript
config.server.port        // Server port
config.jwt.secret        // JWT secret key
config.security          // Security settings
config.socket           // Socket.IO config
```

### 4. **Models** (`src/models/`)
Data layer with CRUD operations.

**User Model:**
- Create, read, update, delete users
- Search users
- Manage user status
- Get public profiles

**Message Model:**
- Create messages
- Mark as delivered/read
- Get message history
- Room-based message storage

**Session Model:**
- Track active socket connections
- Map users to sockets
- Room management

### 5. **Controllers** (`src/controllers/`)
Handle HTTP requests and send responses.

**Responsibilities:**
- Parse request data
- Call appropriate services
- Format and send responses
- Handle errors

**Best Practices:**
- Keep controllers thin
- Use asyncHandler for async routes
- Validate input before processing
- Return consistent response format

### 6. **Services** (`src/services/`)
Business logic implementation.

**Auth Service:**
- User registration
- Login/logout
- Token generation/verification
- Password management

**Socket Service:**
- Socket.IO event handling
- Real-time message delivery
- User presence management
- Room operations

### 7. **Routes** (`src/routes/`)
Define API endpoints and connect to controllers.

**Route Pattern:**
```javascript
router.METHOD('/path', 
  middleware1,
  middleware2,
  controller.handler
);
```

**Example:**
```javascript
router.post('/register',
  validateRegister,      // Validate input
  authController.register // Handle request
);
```

### 8. **Middleware** (`src/middleware/`)

**Authentication (`auth.js`):**
- `verifyToken` - Require valid JWT
- `optionalAuth` - Optional JWT
- `checkOwnership` - Verify resource ownership

**Error Handler (`errorHandler.js`):**
- `errorHandler` - Global error handler
- `notFound` - 404 handler
- `asyncHandler` - Async route wrapper

### 9. **Validators** (`src/validators/`)
Input validation for requests.

**Features:**
- Validate required fields
- Check data formats
- Enforce constraints
- Return descriptive errors

---

## 🔄 Request Flow

### HTTP Request Flow

```
1. Client Request
   ↓
2. Express receives request
   ↓
3. Middleware chain:
   - CORS
   - Body parser
   - Route matching
   ↓
4. Route-specific middleware:
   - Validation
   - Authentication
   ↓
5. Controller:
   - Parse request
   - Call service
   ↓
6. Service:
   - Business logic
   - Call model
   ↓
7. Model:
   - Data operations
   - Return data
   ↓
8. Response flows back up
   ↓
9. Client receives response
```

### WebSocket Flow

```
1. Client connects via Socket.IO
   ↓
2. Socket Service handles event
   ↓
3. Verify user (optional JWT)
   ↓
4. Update models (Session, User)
   ↓
5. Broadcast to room
   ↓
6. Clients receive event
```

---

## 🔐 Security Features

### 1. **Authentication**
- JWT-based authentication
- Token expiration (7 days default)
- Secure password hashing (bcrypt)

### 2. **Authorization**
- Route protection with middleware
- Resource ownership checks
- Optional authentication for public routes

### 3. **Input Validation**
- Validate all user inputs
- Sanitize data
- Prevent injection attacks

### 4. **Error Handling**
- Never expose sensitive data in errors
- Log errors server-side
- Generic error messages to clients

---

## 📊 Data Flow

### User Registration

```
POST /api/auth/register
  ↓
Validator (check email, password)
  ↓
Auth Controller
  ↓
Auth Service
  - Check if user exists
  - Hash password
  - Create user via User Model
  - Generate JWT token
  ↓
Return: { user, token }
```

### Sending a Message

```
Socket Event: 'send-message'
  ↓
Socket Service
  ↓
Get session from Session Model
  ↓
Create message via Message Model
  ↓
Broadcast to room via io.to(room).emit()
  ↓
All clients in room receive message
```

---

## 🎯 Design Principles

### 1. **Separation of Concerns**
Each layer has a single responsibility:
- Routes: Define endpoints
- Controllers: Handle requests
- Services: Business logic
- Models: Data operations

### 2. **DRY (Don't Repeat Yourself)**
- Reusable middleware
- Centralized configuration
- Shared utilities

### 3. **Single Responsibility**
Each file/function does one thing well.

### 4. **Dependency Injection**
Services receive dependencies (like models) rather than importing them directly.

### 5. **Error Handling**
Consistent error handling across all layers.

---

## 🚀 Extending the Application

### Adding a New Feature

1. **Create Model** (if needed)
   ```javascript
   // src/models/Feature.js
   class FeatureModel {
     // CRUD operations
   }
   ```

2. **Create Service** (if needed)
   ```javascript
   // src/services/featureService.js
   class FeatureService {
     // Business logic
   }
   ```

3. **Create Controller**
   ```javascript
   // src/controllers/featureController.js
   const handler = asyncHandler(async (req, res) => {
     // Handle request
   });
   ```

4. **Create Routes**
   ```javascript
   // src/routes/featureRoutes.js
   router.get('/feature', controller.handler);
   ```

5. **Mount Routes**
   ```javascript
   // src/routes/index.js
   router.use('/feature', featureRoutes);
   ```

### Adding Middleware

```javascript
// src/middleware/myMiddleware.js
const myMiddleware = (req, res, next) => {
  // Do something
  next();
};

module.exports = myMiddleware;
```

### Adding Validation

```javascript
// src/validators/myValidator.js
const validateInput = (req, res, next) => {
  // Validate
  if (errors) {
    return res.status(400).json({ errors });
  }
  next();
};
```

---

## 🧪 Testing Strategy

### Unit Tests
Test individual components:
- Models (CRUD operations)
- Services (business logic)
- Utilities (helper functions)

### Integration Tests
Test API endpoints:
- Auth routes
- User routes
- Room routes

### E2E Tests
Test complete user flows:
- Register → Login → Send Message
- Multiple users chatting

---

## 📈 Performance Considerations

### Current Implementation
- In-memory storage (fast but not persistent)
- Suitable for development and small deployments

### Production Recommendations

1. **Database Integration**
   - Use MongoDB for messages
   - Use PostgreSQL for users
   - Add database connection pooling

2. **Caching**
   - Redis for session storage
   - Cache frequently accessed data

3. **Horizontal Scaling**
   - Use Redis adapter for Socket.IO
   - Load balancer for multiple instances

4. **Rate Limiting**
   - Prevent abuse
   - Protect against DDoS

---

## 🔄 Migration Path

### From Monolith to Microservices

Current architecture can be split into:

1. **Auth Service**
   - User registration/login
   - Token management

2. **Chat Service**
   - Message handling
   - Real-time communication

3. **User Service**
   - Profile management
   - User search

4. **API Gateway**
   - Route requests
   - Authentication

---

## 📝 Best Practices

### Code Organization
✅ Group by feature, not by type
✅ Keep files small and focused
✅ Use meaningful names
✅ Add comments for complex logic

### Error Handling
✅ Use try-catch in async functions
✅ Always pass errors to next()
✅ Log errors with context
✅ Never expose stack traces to clients

### Security
✅ Validate all inputs
✅ Use parameterized queries (when using DB)
✅ Hash passwords
✅ Use HTTPS in production
✅ Keep dependencies updated

### Performance
✅ Use async/await properly
✅ Avoid blocking operations
✅ Cache when appropriate
✅ Monitor memory usage

---

## 🎓 Learning Resources

- Express.js: https://expressjs.com/
- Socket.IO: https://socket.io/
- JWT: https://jwt.io/
- REST API Design: https://restfulapi.net/
- MVC Pattern: https://en.wikipedia.org/wiki/Model–view–controller

---

**Version:** 2.0.0  
**Last Updated:** October 15, 2025

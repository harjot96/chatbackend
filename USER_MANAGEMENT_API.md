# User Management API Documentation

## Overview

This chat backend now includes complete user management with registration, authentication, and profile management features.

## Features

✅ User Registration with password hashing
✅ User Login with JWT authentication
✅ User Profile Management
✅ User Search
✅ Avatar Support (auto-generated or custom)
✅ Password Change
✅ User Status Tracking (online/offline)
✅ Guest Mode (join without registration)

---

## REST API Endpoints

### Authentication

#### 1. Register User
**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "displayName": "John Doe",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Required Fields:**
- `username` (string, unique)
- `email` (string, unique)
- `password` (string, min 6 characters recommended)

**Optional Fields:**
- `displayName` (string) - defaults to username
- `avatar` (string, URL) - defaults to auto-generated avatar

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "displayName": "John Doe",
    "avatar": "https://ui-avatars.com/api/...",
    "createdAt": "2025-10-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Username or email already exists"
}
```

#### 2. Login User
**POST** `/api/auth/login`

Login with existing account.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Note:** You can use either `username` or `email` in the username field.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "displayName": "John Doe",
    "avatar": "https://ui-avatars.com/api/...",
    "bio": "Software developer",
    "createdAt": "2025-10-15T10:30:00.000Z",
    "lastLogin": "2025-10-15T10:35:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### User Management

#### 3. Get User Profile
**GET** `/api/users/:userId`

Get profile information for a specific user.

**Example:** `GET /api/users/550e8400-e29b-41d4-a716-446655440000`

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatar": "https://ui-avatars.com/api/...",
    "bio": "Software developer",
    "createdAt": "2025-10-15T10:30:00.000Z",
    "status": "online",
    "lastSeen": "2025-10-15T10:35:00.000Z"
  }
}
```

#### 4. Update User Profile
**PUT** `/api/users/:userId`

Update user profile information.

**Request Body:**
```json
{
  "displayName": "John Smith",
  "avatar": "https://example.com/new-avatar.jpg",
  "bio": "Full-stack developer",
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**All fields are optional.** Only include fields you want to update.

**Password Change:**
- To change password, include both `currentPassword` and `newPassword`
- Current password will be verified before updating

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "displayName": "John Smith",
    "avatar": "https://example.com/new-avatar.jpg",
    "bio": "Full-stack developer"
  }
}
```

#### 5. Get All Users
**GET** `/api/users`

Get list of all registered users.

**Success Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "displayName": "John Doe",
      "avatar": "https://ui-avatars.com/api/...",
      "status": "online",
      "lastSeen": "2025-10-15T10:35:00.000Z"
    },
    {
      "userId": "660e8400-e29b-41d4-a716-446655440111",
      "username": "janedoe",
      "displayName": "Jane Doe",
      "avatar": "https://ui-avatars.com/api/...",
      "status": "offline",
      "lastSeen": "2025-10-15T09:20:00.000Z"
    }
  ],
  "total": 2
}
```

#### 6. Search Users
**GET** `/api/users/search/:query`

Search for users by username or display name.

**Example:** `GET /api/users/search/john`

**Success Response (200):**
```json
{
  "success": true,
  "query": "john",
  "results": [
    {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "displayName": "John Doe",
      "avatar": "https://ui-avatars.com/api/...",
      "status": "online"
    }
  ],
  "count": 1
}
```

#### 7. Get Room Users
**GET** `/api/rooms/:room/users`

Get all users currently in a specific room.

**Example:** `GET /api/rooms/general/users`

**Success Response (200):**
```json
{
  "success": true,
  "room": "general",
  "users": [
    {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "displayName": "John Doe",
      "avatar": "https://ui-avatars.com/api/...",
      "room": "general",
      "status": {
        "online": true,
        "lastSeen": "2025-10-15T10:35:00.000Z"
      }
    }
  ],
  "count": 1
}
```

---

## Socket.IO Integration

### Enhanced Join Event

When joining with authentication:

```javascript
socket.emit('join', {
  username: 'johndoe',
  room: 'general',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
});
```

**Fields:**
- `username` - Username
- `room` - Room to join
- `userId` - User ID from registration
- `token` - JWT token from login/register (optional but recommended)

### Enhanced Message Events

Messages now include user profile information:

```javascript
socket.on('receive-message', (data) => {
  // data includes:
  {
    id: "message-id",
    username: "johndoe",
    displayName: "John Doe",
    avatar: "https://ui-avatars.com/api/...",
    userId: "550e8400-e29b-41d4-a716-446655440000",
    message: "Hello!",
    room: "general",
    timestamp: "2025-10-15T10:35:00.000Z",
    delivered: false,
    deliveredTo: [],
    read: false,
    readBy: []
  }
});
```

---

## Complete Usage Example

### 1. Register a New User

```javascript
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john@example.com',
    password: 'securepassword123',
    displayName: 'John Doe'
  })
});

const data = await response.json();
const { user, token } = data;

// Store token for future requests
localStorage.setItem('authToken', token);
localStorage.setItem('userId', user.userId);
```

### 2. Login Existing User

```javascript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'securepassword123'
  })
});

const data = await response.json();
const { user, token } = data;

localStorage.setItem('authToken', token);
localStorage.setItem('userId', user.userId);
```

### 3. Join Chat with Authentication

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');
const token = localStorage.getItem('authToken');
const userId = localStorage.getItem('userId');

socket.emit('join', {
  username: user.username,
  room: 'general',
  userId: userId,
  token: token
});
```

### 4. Update Profile

```javascript
const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    displayName: 'John Smith',
    bio: 'Full-stack developer',
    avatar: 'https://example.com/avatar.jpg'
  })
});

const data = await response.json();
console.log('Profile updated:', data);
```

### 5. Change Password

```javascript
const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    currentPassword: 'oldpassword123',
    newPassword: 'newpassword456'
  })
});

const data = await response.json();
console.log('Password changed:', data);
```

### 6. Search for Users

```javascript
const response = await fetch('http://localhost:3001/api/users/search/john');
const data = await response.json();

console.log('Search results:', data.results);
```

### 7. Get User Profile

```javascript
const response = await fetch(`http://localhost:3001/api/users/${userId}`);
const data = await response.json();

console.log('User profile:', data.user);
```

---

## Security Features

### Password Hashing
- Passwords are hashed using `bcryptjs` with 10 salt rounds
- Plaintext passwords are never stored
- Passwords are verified securely during login

### JWT Tokens
- JSON Web Tokens (JWT) used for authentication
- Tokens expire after 7 days
- Tokens include userId, username, and email
- Can be verified on the server for protected routes

### Data Protection
- Email and username uniqueness enforced
- Password requirements can be customized
- Sensitive data (passwords) never returned in API responses

---

## Guest Mode

Users can still join as guests without registration:

```javascript
socket.emit('join', {
  username: 'GuestUser123',
  room: 'general',
  userId: 'guest-' + Math.random().toString(36).substr(2, 9)
});
```

**Guest Limitations:**
- No persistent profile
- No avatar customization (auto-generated)
- Data lost on disconnect
- Can't access user management features

---

## User Object Structure

### Stored User (in database/memory)
```javascript
{
  userId: "550e8400-e29b-41d4-a716-446655440000",
  username: "johndoe",
  email: "john@example.com",
  password: "$2a$10$...", // hashed
  displayName: "John Doe",
  avatar: "https://ui-avatars.com/api/...",
  bio: "Software developer",
  createdAt: "2025-10-15T10:30:00.000Z",
  lastLogin: "2025-10-15T10:35:00.000Z",
  status: "offline"
}
```

### Public User Profile (returned by API)
```javascript
{
  userId: "550e8400-e29b-41d4-a716-446655440000",
  username: "johndoe",
  displayName: "John Doe",
  avatar: "https://ui-avatars.com/api/...",
  bio: "Software developer",
  createdAt: "2025-10-15T10:30:00.000Z",
  status: "online",
  lastSeen: "2025-10-15T10:35:00.000Z"
}
```

---

## Environment Variables

Update your `.env` file:

```env
PORT=3001
JWT_SECRET=your-super-secret-key-change-this-in-production
```

**IMPORTANT:** Change the JWT_SECRET in production!

---

## Testing the API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

**Get All Users:**
```bash
curl http://localhost:3001/api/users
```

**Search Users:**
```bash
curl http://localhost:3001/api/users/search/test
```

### Using the Test Client

1. Open `test-client-with-auth.html` in your browser
2. Register a new account or login
3. Join a room and start chatting
4. Open multiple tabs to test with different users

---

## Production Considerations

### Database Integration
Currently uses in-memory storage. For production:
- Add MongoDB or PostgreSQL
- Store users and messages persistently
- Add indexes for username and email

### Security Enhancements
- Add rate limiting
- Implement refresh tokens
- Add email verification
- Add password reset functionality
- Use HTTPS in production
- Add input validation and sanitization

### Scalability
- Use Redis for session storage
- Implement horizontal scaling
- Add message queue (RabbitMQ, Kafka)
- Use database for message persistence

---

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created (registration successful) |
| 400 | Bad Request (missing fields, validation failed) |
| 401 | Unauthorized (invalid credentials) |
| 404 | Not Found (user doesn't exist) |
| 500 | Server Error |

---

## Support & Documentation

- Full API documentation: See this file
- Socket.IO events: See README.md
- Quick start guide: See QUICKSTART.md
- Project summary: See PROJECT_SUMMARY.md

---

**Version:** 2.0.0  
**Last Updated:** October 15, 2025

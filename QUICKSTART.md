# Quick Start Guide

## 🚀 Start the Server

```bash
cd ~/Desktop/chat-backend
npm start
```

Server will start on **http://localhost:3001**

For development with auto-reload:
```bash
npm run dev
```

---

## 🧪 Test the Application

### Option 1: Web Client with Authentication

1. Open `test-client-with-auth.html` in your browser
2. Choose one of the following:

**Register a new account:**
- Click "Register" tab
- Fill in username, email, password
- Click "Register"
- Switch to "Login" tab and login

**Login with test account:**
- Username: `test`
- Password: `test123`
- (First register this account)

**Join as Guest:**
- Scroll to "Join as Guest" section
- Enter a guest username and room name
- Click "Join as Guest"

3. Open multiple browser windows/tabs to test multi-user chat

### Option 2: Simple Web Client (No Auth)

1. Open `test-client.html` in your browser
2. Enter username and room name
3. Click "Join Chat"

---

## ✨ Features to Test

### User Management
✅ **Registration** - Create new user accounts
✅ **Login/Logout** - Authenticate users
✅ **Profile Management** - Update display name, avatar, bio
✅ **Password Change** - Secure password updates
✅ **User Search** - Find other users
✅ **Guest Mode** - Chat without registration

### Chat Features
✅ **Real-time Messaging** - Instant message delivery
✅ **Multiple Rooms** - Separate chat rooms
✅ **Message History** - Previous messages loaded on join
✅ **Typing Indicators** - See when others are typing
✅ **Online Status** - Green dot = online, Gray dot = offline
✅ **Last Seen** - When user was last active
✅ **Delivery Receipts** - ✓ when message delivered
✅ **Read Receipts** - ✓✓ when message read
✅ **User Avatars** - Profile pictures in chat
✅ **Display Names** - Show user's chosen name

---

## 📡 Test the REST API

### Using cURL

**Register a user:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@test.com","password":"test123","displayName":"John Doe"}'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"test123"}'
```

**Get all users:**
```bash
curl http://localhost:3001/api/users
```

**Search users:**
```bash
curl http://localhost:3001/api/users/search/john
```

**Server status:**
```bash
curl http://localhost:3001/
```

### Using Node.js Test Script

```bash
node test-api.js
```

This will run a complete test suite of all API endpoints.

---

## 🎯 Common Scenarios

### Scenario 1: New User Registration & Chat

1. Open `test-client-with-auth.html`
2. Register with username `alice` and password `alice123`
3. Select room `general` when prompted
4. Open new tab, register as `bob` with password `bob123`
5. Join same room `general`
6. Start chatting!

### Scenario 2: Test Read Receipts

1. Login as User A in one browser window
2. Login as User B in another window
3. Join same room
4. User A sends a message
5. User B sees the message
6. User A sees "✓ Delivered" then "✓✓ Read"

### Scenario 3: Test Online Status

1. Login with 2 different accounts in 2 windows
2. Join same room
3. Check sidebar - both users show green dot (online)
4. Close one window
5. Other window shows that user as offline (gray dot)

### Scenario 4: Guest vs Registered Users

1. Open one window with `test-client-with-auth.html`
2. Join as guest with username `Guest123`
3. Open another window, register/login as proper user
4. Both can chat in same room
5. Registered user has persistent profile and avatar

---

## 🔧 Configuration

### Change Port

Create a `.env` file:
```
PORT=4000
JWT_SECRET=your-secret-key-here
```

Or run with:
```bash
PORT=4000 npm start
```

### Change JWT Secret (Important for Production!)

Edit `.env`:
```
JWT_SECRET=your-very-secure-random-string-here
```

---

## 📚 API Documentation

For complete API documentation, see:
- **User Management API**: `USER_MANAGEMENT_API.md`
- **Socket.IO Events**: `README.md`
- **Project Overview**: `PROJECT_SUMMARY.md`

---

## 🐛 Troubleshooting

**Port already in use?**
```bash
PORT=4000 npm start
```

**Can't connect from other devices?**
- Update socket URL in HTML files to your local IP
- Example: `http://192.168.1.100:3001`

**Users not persisting?**
- Data is stored in memory - will reset on server restart
- For persistence, integrate a database (MongoDB/PostgreSQL)

**Token errors?**
- Make sure JWT_SECRET is set in `.env`
- Tokens expire after 7 days

---

## 🎨 Integrate with Your Frontend

### React Example

```javascript
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

function Chat() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);

  // Login
  const login = async (username, password) => {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    
    if (data.success) {
      setUser(data.user);
      localStorage.setItem('token', data.token);
      connectSocket(data.user, data.token);
    }
  };

  // Connect to Socket.IO
  const connectSocket = (user, token) => {
    const newSocket = io('http://localhost:3001');
    
    newSocket.emit('join', {
      username: user.username,
      room: 'general',
      userId: user.userId,
      token: token
    });

    newSocket.on('receive-message', (msg) => {
      console.log('New message:', msg);
    });

    setSocket(newSocket);
  };

  // Send message
  const sendMessage = (message) => {
    if (socket) {
      socket.emit('send-message', { message });
    }
  };

  return <div>Your Chat UI</div>;
}
```

### Vue Example

```javascript
import { ref } from 'vue';
import io from 'socket.io-client';

export default {
  setup() {
    const socket = ref(null);
    const user = ref(null);

    const login = async (username, password) => {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (data.success) {
        user.value = data.user;
        connectSocket(data.user, data.token);
      }
    };

    const connectSocket = (userData, token) => {
      socket.value = io('http://localhost:3001');
      
      socket.value.emit('join', {
        username: userData.username,
        room: 'general',
        userId: userData.userId,
        token: token
      });
    };

    return { login, socket, user };
  }
};
```

---

## 🌟 What's Next?

1. ✅ Test all features
2. ✅ Read the API documentation
3. ✅ Integrate with your frontend
4. 🔄 Add database for persistence
5. 🔄 Add email verification
6. 🔄 Deploy to production

---

**Enjoy your chat app!** 🎉

For help, see the full documentation in the project files.

# Initialize Render.com Database

## Problem
```
error: relation "active_sessions" does not exist
```

This means the database exists but the tables haven't been created yet.

## Solution: Initialize the Database Schema

### Method 1: Via Render Shell (Recommended)

1. Go to [Render.com Dashboard](https://dashboard.render.com/)
2. Click on your **Web Service**
3. Click **Shell** tab in the top menu
4. Run this command:
```bash
node database/init.js
```

5. You should see:
```
✅ Connected to PostgreSQL database
✅ Database initialized successfully!
```

### Method 2: Auto-Initialize on Deploy

Update your `package.json` start script to initialize the database automatically:

**Current:**
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

**Updated:**
```json
{
  "scripts": {
    "start": "node database/init.js && node server.js"
  }
}
```

This will:
1. Initialize the database (if not already done)
2. Start the server

**Note:** The init script is idempotent - it won't fail if tables already exist.

### Method 3: Add Build Command

In Render.com dashboard:

1. Go to your Web Service → **Settings**
2. Find **Build Command**
3. Set it to:
```bash
npm install && node database/init.js
```
4. Keep **Start Command** as:
```bash
npm start
```

### Method 4: Manual SQL Execution

If you prefer to run SQL directly:

1. Go to your PostgreSQL database on Render
2. Click **Connect** → **External Connection**
3. Use psql or any PostgreSQL client:
```bash
psql -h dpg-xxx-a.oregon-postgres.render.com -U chat_8iue_user -d chat_8iue
```
4. Copy and paste the SQL from `database/schema.sql`

## Verify It Worked

After initialization, check the logs:

1. Go to Web Service → **Logs**
2. Look for:
```
✅ Database initialized successfully!
🚀 Chat Server Started Successfully!
```

3. Test the API:
```bash
curl https://your-app.onrender.com/api/health
curl https://your-app.onrender.com/api/rooms
```

## What Gets Created

The init script creates these tables:
- users
- rooms
- messages
- active_sessions
- message_reads
- message_deliveries
- message_reactions
- message_mentions
- message_attachments
- message_edit_history
- direct_messages
- dm_attachments
- room_members
- user_contacts
- user_blocks
- user_preferences
- notifications

And default data:
- 3 rooms: general, random, tech

## Troubleshooting

### Error: "permission denied"
Make sure your database user has CREATE privileges.

### Error: "already exists"
That's fine! The script handles this gracefully.

### Can't access Shell
Use Method 2 (auto-initialize) or Method 3 (build command).

## Quick Commands Summary

**Initialize once:**
```bash
node database/init.js
```

**Auto-initialize on every deploy (package.json):**
```json
"start": "node database/init.js && node server.js"
```

**Check if tables exist:**
```bash
psql $DATABASE_URL -c "\dt"
```

---

**After initialization, your server will work perfectly!** 🎉


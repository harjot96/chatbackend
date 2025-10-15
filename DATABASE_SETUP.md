# PostgreSQL Database Setup Guide

## 📚 Overview

This chat backend now uses **PostgreSQL** as its database, providing:
- ✅ **Persistent Storage** - Data survives server restarts
- ✅ **Scalability** - Handle thousands of users and messages
- ✅ **ACID Compliance** - Data integrity and reliability
- ✅ **Advanced Features** - Complex queries, indexes, views
- ✅ **Production Ready** - Battle-tested database system

---

## 🚀 Quick Start

### 1. Install PostgreSQL

#### macOS
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Windows
Download and install from: https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE chatdb;

# Create user (optional)
CREATE USER chatuser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE chatdb TO chatuser;

# Exit
\q
```

### 3. Configure Environment

Edit `.env` file:
```env
DATABASE_URL=postgresql://localhost:5432/chatdb
# Or with username/password:
# DATABASE_URL=postgresql://chatuser:your_password@localhost:5432/chatdb
```

### 4. Initialize Database

```bash
npm run db:init
```

This will:
- Create all tables
- Create indexes
- Create views
- Insert default data

### 5. Start Server

```bash
npm start
```

---

## 📊 Database Schema

### Tables

#### 1. `users`
Stores user account information.

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | Primary key |
| username | VARCHAR(50) | Unique username |
| email | VARCHAR(255) | Unique email |
| password | VARCHAR(255) | Hashed password |
| display_name | VARCHAR(100) | Display name |
| avatar | TEXT | Avatar URL |
| bio | TEXT | User bio |
| status | VARCHAR(20) | online/offline |
| last_seen | TIMESTAMP | Last activity |
| created_at | TIMESTAMP | Account creation |
| last_login | TIMESTAMP | Last login |

**Indexes:**
- `idx_users_username` on username
- `idx_users_email` on email
- `idx_users_status` on status

#### 2. `rooms`
Stores chat room information.

| Column | Type | Description |
|--------|------|-------------|
| room_id | UUID | Primary key |
| room_name | VARCHAR(100) | Unique room name |
| description | TEXT | Room description |
| created_by | UUID | Creator user ID |
| is_private | BOOLEAN | Private room flag |
| created_at | TIMESTAMP | Room creation |

**Indexes:**
- `idx_rooms_name` on room_name

#### 3. `messages`
Stores all chat messages.

| Column | Type | Description |
|--------|------|-------------|
| message_id | UUID | Primary key |
| user_id | UUID | Sender user ID |
| room_id | UUID | Room ID |
| message_text | TEXT | Message content |
| created_at | TIMESTAMP | Message sent time |
| edited_at | TIMESTAMP | Last edit time |
| is_deleted | BOOLEAN | Soft delete flag |

**Indexes:**
- `idx_messages_room` on (room_id, created_at DESC)
- `idx_messages_user` on user_id

#### 4. `message_reads`
Tracks message read receipts.

| Column | Type | Description |
|--------|------|-------------|
| read_id | UUID | Primary key |
| message_id | UUID | Message ID |
| user_id | UUID | Reader user ID |
| read_at | TIMESTAMP | Read time |

**Unique constraint:** (message_id, user_id)

#### 5. `message_deliveries`
Tracks message delivery status.

| Column | Type | Description |
|--------|------|-------------|
| delivery_id | UUID | Primary key |
| message_id | UUID | Message ID |
| user_id | UUID | Recipient user ID |
| delivered_at | TIMESTAMP | Delivery time |

**Unique constraint:** (message_id, user_id)

#### 6. `room_members`
Tracks room membership.

| Column | Type | Description |
|--------|------|-------------|
| member_id | UUID | Primary key |
| room_id | UUID | Room ID |
| user_id | UUID | User ID |
| joined_at | TIMESTAMP | Join time |
| left_at | TIMESTAMP | Leave time |
| is_active | BOOLEAN | Active status |

**Unique constraint:** (room_id, user_id)

#### 7. `active_sessions`
Tracks Socket.IO connections.

| Column | Type | Description |
|--------|------|-------------|
| session_id | UUID | Primary key |
| user_id | UUID | User ID |
| socket_id | VARCHAR(255) | Socket.IO ID |
| room_id | UUID | Current room |
| connected_at | TIMESTAMP | Connection time |
| last_activity | TIMESTAMP | Last activity |

**Indexes:**
- `idx_active_sessions_socket` on socket_id
- `idx_active_sessions_user` on user_id
- `idx_active_sessions_room` on room_id

---

## 🔍 Database Views

### 1. `active_users_view`
Shows all users with their active session count.

```sql
SELECT * FROM active_users_view;
```

### 2. `room_stats_view`
Shows room statistics (messages, members, active users).

```sql
SELECT * FROM room_stats_view WHERE room_name = 'general';
```

### 3. `messages_with_user_view`
Shows messages with user info and read/delivery counts.

```sql
SELECT * FROM messages_with_user_view 
WHERE room_id = 'room-uuid'
ORDER BY created_at DESC;
```

---

## 🛠️ Common Operations

### View All Tables
```sql
\dt
```

### View Table Structure
```sql
\d users
```

### Query Users
```sql
-- All users
SELECT * FROM users;

-- Active users
SELECT * FROM users WHERE status = 'online';

-- Search users
SELECT * FROM users WHERE username ILIKE '%john%';
```

### Query Messages
```sql
-- Recent messages in a room
SELECT * FROM messages_with_user_view 
WHERE room_id = (SELECT room_id FROM rooms WHERE room_name = 'general')
ORDER BY created_at DESC
LIMIT 50;

-- User's message count
SELECT COUNT(*) FROM messages WHERE user_id = 'user-uuid';
```

### Query Room Statistics
```sql
SELECT * FROM room_stats_view;
```

---

## 🔧 Database Maintenance

### Backup Database
```bash
# Backup
pg_dump chatdb > backup.sql

# Backup with timestamp
pg_dump chatdb > "backup_$(date +%Y%m%d_%H%M%S).sql"
```

### Restore Database
```bash
# Restore
psql chatdb < backup.sql
```

### Clean Up Old Sessions
```sql
DELETE FROM active_sessions 
WHERE last_activity < NOW() - INTERVAL '1 hour';
```

### View Database Size
```sql
SELECT pg_size_pretty(pg_database_size('chatdb'));
```

### View Table Sizes
```sql
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🚨 Troubleshooting

### Connection Refused

**Problem:** Can't connect to PostgreSQL

**Solutions:**
```bash
# Check if PostgreSQL is running
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Start PostgreSQL
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### Authentication Failed

**Problem:** Password authentication failed

**Solution:** Update `pg_hba.conf`:
```bash
# Find config file
psql postgres -c "SHOW hba_file"

# Edit file (use trust for local development)
# Change 'md5' to 'trust' for local connections
```

### Database Doesn't Exist

**Problem:** Database "chatdb" does not exist

**Solution:**
```bash
createdb chatdb
# Or
psql postgres -c "CREATE DATABASE chatdb;"
```

### Permission Denied

**Problem:** Permission denied for schema public

**Solution:**
```sql
GRANT ALL ON SCHEMA public TO chatuser;
GRANT ALL ON ALL TABLES IN SCHEMA public TO chatuser;
```

---

## 📈 Performance Optimization

### Add Indexes
```sql
-- For frequently searched columns
CREATE INDEX idx_custom ON table_name(column_name);

-- For text search
CREATE INDEX idx_username_search ON users 
USING gin(to_tsvector('english', username));
```

### Analyze Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM messages 
WHERE room_id = 'room-uuid' 
ORDER BY created_at DESC 
LIMIT 50;
```

### Vacuum Database
```sql
VACUUM ANALYZE;
```

---

## 🔐 Security Best Practices

### 1. Use Strong Passwords
```sql
CREATE USER chatuser WITH PASSWORD 'very-strong-random-password';
```

### 2. Limit Privileges
```sql
-- Grant only necessary privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO chatuser;
```

### 3. Enable SSL
In `.env`:
```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
DB_SSL=true
```

### 4. Regular Backups
```bash
# Daily backup cron job
0 2 * * * pg_dump chatdb > /backup/chatdb_$(date +\%Y\%m\%d).sql
```

---

## 🌐 Cloud Database Options

### Heroku Postgres
```bash
# Install addon
heroku addons:create heroku-postgresql:hobby-dev

# Get DATABASE_URL (automatically set)
heroku config:get DATABASE_URL
```

### AWS RDS
1. Create PostgreSQL instance in AWS Console
2. Get connection string
3. Update `.env`:
```env
DATABASE_URL=postgresql://user:pass@instance.region.rds.amazonaws.com:5432/chatdb
DB_SSL=true
```

### DigitalOcean Managed Database
1. Create database in DigitalOcean
2. Get connection string
3. Add to `.env`

### Supabase
1. Create project at supabase.com
2. Get connection string from settings
3. Update `.env`

---

## 📊 Monitoring

### Active Connections
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'chatdb';
```

### Long Running Queries
```sql
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;
```

### Database Activity
```sql
SELECT * FROM pg_stat_database WHERE datname = 'chatdb';
```

---

## 🔄 Migration from In-Memory

If you were using the old in-memory version:

1. **No data to migrate** - In-memory data is lost on restart
2. **Run database init**:
   ```bash
   npm run db:init
   ```
3. **Start fresh** - All users need to re-register
4. **Data persists** - Now data survives restarts!

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [node-postgres (pg) Documentation](https://node-postgres.com/)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/tutorial.html)

---

## ✅ Verification Checklist

After setup, verify:

- [ ] PostgreSQL is installed and running
- [ ] Database `chatdb` exists
- [ ] `npm run db:init` completes successfully
- [ ] Server starts without errors
- [ ] Can register a new user
- [ ] Can send messages
- [ ] Messages persist after server restart
- [ ] Read receipts work
- [ ] Online status updates

---

**Version:** 2.0.0 with PostgreSQL  
**Last Updated:** October 15, 2025

**Your chat backend is now production-ready with persistent PostgreSQL storage! 🎉**

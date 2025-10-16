# Database Migrations Guide

## ✅ Migration System Implemented!

Your chat backend now has a complete database migration system that automatically:

1. **Initializes the database schema** (creates all tables if they don't exist)
2. **Runs migrations** (executes any new migration files)
3. **Tracks executed migrations** (so they only run once)
4. **Runs on every deploy** (fully automated)

## 🚀 How It Works

### On Every Deploy/Start:

```bash
npm start
```

This runs:
1. **`node database/deploy.js`** - Initializes schema + runs migrations
2. **`node server.js`** - Starts the chat server

### What Happens:

```
============================================================
🚀 Starting Database Deployment
============================================================

🔄 Step 1: Initializing database schema...
✅ Database schema ready
✅ Default rooms ready

🔄 Step 2: Running database migrations...
✅ All migrations up to date

============================================================
✅ Database Deployment Complete!
============================================================

🚀 Chat Server Started Successfully!
```

## 📁 File Structure

```
chat-backend/
├── database/
│   ├── deploy.js          # Main deployment script (runs on start)
│   ├── init.js            # Schema initialization
│   ├── migrate.js         # Migration runner
│   ├── schema.sql         # Complete database schema
│   └── migrations/        # Migration files directory
│       ├── README.md      # Migration documentation
│       └── 001_initial_schema.sql
```

## 🔧 Available Commands

### Production (Auto-deploy):
```bash
npm start              # Deploy DB + start server
npm run start:prod     # Same as npm start
```

### Development (Skip deploy):
```bash
npm run start:dev      # Start server only (no deploy)
npm run dev            # Start with nodemon
```

### Manual Database Operations:
```bash
npm run db:deploy      # Run full deployment (init + migrate)
npm run db:init        # Initialize schema only
npm run db:migrate     # Run migrations only
```

## ✍️ Creating Migrations

### Step 1: Create Migration File

Create a new `.sql` file in `database/migrations/`:

```bash
# Name format: <number>_<description>.sql
002_add_user_phone.sql
003_add_room_settings.sql
004_add_message_search.sql
```

### Step 2: Write Migration SQL

```sql
-- 002_add_user_phone.sql
-- Add phone number support for users

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Update existing users
UPDATE users SET phone = NULL WHERE phone IS NULL;
```

### Step 3: Deploy

```bash
# Local test
npm run db:migrate

# Production - just push to git
git add database/migrations/002_add_user_phone.sql
git commit -m "Add user phone support"
git push
```

Render will automatically run the migration on deploy!

## 📋 Migration Best Practices

### 1. Use IF NOT EXISTS / IF EXISTS
Makes migrations idempotent (safe to run multiple times):

```sql
-- Good ✅
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
DROP INDEX IF EXISTS old_index_name;

-- Bad ❌
ALTER TABLE users ADD COLUMN phone VARCHAR(20);  -- Fails if exists
```

### 2. One Feature Per Migration
```sql
-- Good ✅
-- 002_add_user_phone.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 003_add_user_timezone.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);

-- Bad ❌ - Don't bundle unrelated changes
-- 002_add_multiple_columns.sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE rooms ADD COLUMN settings JSONB;
ALTER TABLE messages ADD COLUMN priority INT;
```

### 3. Test Locally First
```bash
# Test on local database
npm run db:migrate

# Verify it worked
psql -d chatdb -c "\d users"

# If good, push to production
git push
```

### 4. Never Modify Executed Migrations
```bash
# Bad ❌ - Don't edit 002_add_phone.sql after it's deployed
# Good ✅ - Create a new migration
# 003_fix_phone_column.sql
ALTER TABLE users ALTER COLUMN phone TYPE VARCHAR(50);
```

## 🎯 Example Migrations

### Add a Column
```sql
-- 002_add_user_bio.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
```

### Create an Index
```sql
-- 003_add_message_indexes.sql
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_room_user ON messages(room_id, user_id);
```

### Create a Table
```sql
-- 004_create_user_settings.sql
CREATE TABLE IF NOT EXISTS user_settings (
  setting_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);
```

### Update Data
```sql
-- 005_update_avatars.sql
UPDATE users 
SET avatar = CONCAT('https://ui-avatars.com/api/?name=', username)
WHERE avatar IS NULL OR avatar = '';
```

### Add Foreign Key
```sql
-- 006_add_room_creator.sql
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES users(user_id);
```

## 🔍 Checking Migration Status

### List Executed Migrations
```bash
psql -d chatdb -c "SELECT * FROM migrations ORDER BY id;"
```

Output:
```
 id |          name           |       executed_at       
----+-------------------------+-------------------------
  1 | 001_initial_schema.sql  | 2025-10-16 12:00:00
  2 | 002_add_user_phone.sql  | 2025-10-16 13:00:00
```

### Check Table Structure
```bash
psql -d chatdb -c "\d users"
```

## ⚙️ Configuration for Render.com

### Environment Variables (Already Set):
```
DATABASE_URL=<your-postgresql-url>
DB_SSL=true
NODE_ENV=production
```

### Build Settings:
- **Build Command**: `npm install`
- **Start Command**: `npm start`

That's it! Migrations run automatically on every deploy.

## 🐛 Troubleshooting

### Migration Failed
**Problem:** Migration fails halfway through

**Solution:** 
- Transaction automatically rolls back
- Fix the SQL in the migration file
- Redeploy - it will retry

### Skip a Migration
**Not Recommended!** Fix the migration instead.

If absolutely necessary:
```sql
INSERT INTO migrations (name) VALUES ('002_broken.sql');
```

### Reset Everything
**WARNING: Destroys all data!**
```bash
# Drop the database
psql -c "DROP DATABASE IF EXISTS chatdb;"

# Recreate
psql -c "CREATE DATABASE chatdb;"

# Redeploy
npm start
```

## 🎉 Benefits

✅ **Automated** - Runs on every deploy, no manual steps
✅ **Safe** - Transactions ensure all-or-nothing execution  
✅ **Tracked** - Know exactly which migrations have run
✅ **Idempotent** - Safe to run multiple times
✅ **Version Controlled** - Migrations are in git
✅ **Team Friendly** - Everyone gets the same schema

## 📚 Additional Resources

- See `database/migrations/README.md` for more examples
- Check `database/deploy.js` for implementation details
- Review `database/schema.sql` for current schema

---

**Your database migrations are now fully automated!** 🎉

Just create migration files and push to git - Render handles the rest!


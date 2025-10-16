# Database Migrations

This directory contains database migration files that are executed in order.

## How It Works

1. Migration files are named with a number prefix: `001_description.sql`, `002_description.sql`, etc.
2. Files are executed in alphabetical order
3. Each migration is tracked in the `migrations` table
4. Migrations that have already been executed are skipped
5. All migrations run in transactions - if one fails, it rolls back

## Creating a New Migration

1. Create a new `.sql` file with the next number:
   ```
   002_add_user_phone.sql
   003_add_room_settings.sql
   ```

2. Write your SQL migration:
   ```sql
   -- Add phone column to users table
   ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
   
   -- Add index on phone
   CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
   ```

3. Commit and deploy - migrations run automatically!

## Running Migrations

### Automatically (on deploy)
Migrations run automatically when you deploy to Render.

### Manually
```bash
# Run all pending migrations
npm run migrate

# Or directly
node database/migrate.js
```

## Best Practices

1. **Always use IF NOT EXISTS / IF EXISTS** to make migrations idempotent
2. **One migration per feature** - don't bundle unrelated changes
3. **Test locally first** before deploying
4. **Never modify executed migrations** - create a new one instead
5. **Use transactions** - they're automatic in the migration system
6. **Add comments** to explain what and why

## Example Migrations

### Add a new column
```sql
-- 002_add_user_timezone.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
```

### Create a new table
```sql
-- 003_create_user_settings.sql
CREATE TABLE IF NOT EXISTS user_settings (
  setting_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
```

### Add an index
```sql
-- 004_add_message_indexes.sql
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_room_user ON messages(room_id, user_id);
```

### Modify existing data
```sql
-- 005_update_default_avatars.sql
UPDATE users 
SET avatar = CONCAT('https://ui-avatars.com/api/?name=', username, '&background=667eea&color=fff')
WHERE avatar IS NULL OR avatar = '';
```

## Migration Status

Check which migrations have been executed:
```sql
SELECT * FROM migrations ORDER BY id;
```

## Rollback

Migrations don't have automatic rollback. To undo a migration:

1. Create a new migration that reverses the changes
2. For example, if `002_add_column.sql` adds a column:
   ```sql
   -- 003_remove_column.sql
   ALTER TABLE users DROP COLUMN IF EXISTS phone;
   ```

## Troubleshooting

### Migration failed halfway
- The transaction will rollback automatically
- Fix the SQL and redeploy
- The migration will retry

### Need to skip a migration
- Not recommended! Fix the migration instead
- If absolutely necessary, manually insert into migrations table:
  ```sql
  INSERT INTO migrations (name) VALUES ('002_broken_migration.sql');
  ```

### Reset all migrations
**WARNING: This will drop all data!**
```sql
DROP TABLE IF EXISTS migrations CASCADE;
```
Then redeploy to recreate everything.


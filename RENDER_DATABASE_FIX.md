# Fix Render.com Database Connection Error

## Error
```
Database query error: Error: Connection terminated unexpectedly
```

## Problem
Your Render.com web service cannot connect to the PostgreSQL database. This could be due to:

1. **Wrong database credentials**
2. **Database not running/paused**
3. **Internal connection URL needed**
4. **SSL configuration issue**

## Solution Steps

### Step 1: Check Your Render.com Database Status

1. Go to [Render.com Dashboard](https://dashboard.render.com/)
2. Click on your PostgreSQL database service
3. Verify the database status is **Active** (not paused or suspended)
4. Check if there are any billing issues

### Step 2: Get the Correct Database URL

In your Render.com PostgreSQL dashboard, you'll see two URLs:

#### External Connection URL (for local development)
```
postgresql://chat_8iue_user:PASSWORD@dpg-xxx-a.oregon-postgres.render.com/chat_8iue
```

#### Internal Connection URL (for Render services - **USE THIS ONE**)
```
postgresql://chat_8iue_user:PASSWORD@dpg-xxx/chat_8iue
```

**IMPORTANT:** Use the **Internal URL** for your web service on Render!

### Step 3: Update Environment Variables on Render

1. Go to your **Web Service** on Render.com
2. Click on **Environment** tab
3. Add/Update these environment variables:

```
DATABASE_URL=<INTERNAL_DATABASE_URL>
DB_SSL=true
PORT=3001
NODE_ENV=production
CORS_ORIGIN=*
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
JWT_EXPIRES_IN=7d
DB_POOL_SIZE=20
```

**Key Point:** Use the **Internal Database URL** (without `-a` in the hostname)

### Step 4: Initialize the Database

After connecting successfully, you need to initialize the database schema.

Option A: Run init script manually via Render Shell
```bash
# In Render.com dashboard, open Shell for your web service
node database/init.js
```

Option B: Add to package.json and run on deploy
```json
{
  "scripts": {
    "start": "node database/init.js && node server.js"
  }
}
```

### Step 5: Common Issues and Fixes

#### Issue 1: Password has special characters
If your database password contains special characters, URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`

#### Issue 2: SSL Certificate Error
Add `?sslmode=require` to the end of your DATABASE_URL:
```
postgresql://user:pass@host/db?sslmode=require
```

#### Issue 3: Connection Timeout
Increase connection timeout in `src/config/database.js`:
```javascript
connectionTimeoutMillis: 30000, // 30 seconds
```

### Step 6: Verify the Fix

After updating environment variables, Render will automatically redeploy. Check the logs:

1. Go to your Web Service → **Logs**
2. Look for:
   - ✅ `Chat Server Started Successfully!`
   - ✅ `Connected to PostgreSQL database`
   - ❌ No "Connection terminated" errors

### Alternative: Use Render's Database URL Format

Render provides the DATABASE_URL automatically. Try this:

1. In Render dashboard, go to your Web Service
2. Click **Environment** tab
3. Delete any custom `DATABASE_URL` variable
4. Render will automatically inject the correct internal URL

### Step 7: Test the Connection

Once deployed, test your endpoints:

```bash
# Health check
curl https://your-app.onrender.com/api/health

# Rooms endpoint
curl https://your-app.onrender.com/api/rooms
```

## Quick Fix Checklist

- [ ] Database status is Active on Render
- [ ] Using **Internal** database URL (not External)
- [ ] `DB_SSL=true` is set
- [ ] Database is initialized with schema
- [ ] No special characters in password (or URL-encoded)
- [ ] Logs show successful connection
- [ ] API endpoints respond correctly

## Example Working Configuration

```env
# On Render.com Web Service Environment Variables
DATABASE_URL=postgresql://chat_8iue_user:dkW5juIQnEvYqp0HKgxzAAXz1wspyoa2@dpg-d3npki63jp1c73c41cag/chat_8iue
DB_SSL=true
NODE_ENV=production
PORT=3001
```

Notice: The internal URL does **not** have `-a.oregon-postgres.render.com`, just `dpg-xxx`

## Still Not Working?

If the issue persists:

1. **Check Render Status:** https://status.render.com/
2. **Verify Database Created:** Ensure your PostgreSQL service is fully provisioned
3. **Try Different Region:** Database and web service should be in the same region
4. **Contact Render Support:** They can check internal connectivity

## Alternative: Use a Different Database Provider

If Render's database continues to have issues, you can try:
- **Supabase** (PostgreSQL with generous free tier)
- **Railway** (Easy PostgreSQL hosting)
- **Neon** (Serverless PostgreSQL)
- **ElephantSQL** (Managed PostgreSQL)

All of these provide a DATABASE_URL that you can use with your existing code.

---

**Your local database works perfectly!** This is purely a Render.com connection issue.


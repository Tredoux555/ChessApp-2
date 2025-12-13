# Railway Database Setup - Fix 500 Errors

## The Problem
You're getting 500 errors because **the database tables don't exist yet** on Railway. Even though you set the DATABASE_URL, the database schema needs to be created.

## The Solution

Railway needs to run `prisma db push` to create the database tables. I've updated the build script to do this automatically, but you may need to trigger it manually.

### Option 1: Automatic (Recommended)
The build script now includes `prisma db push`, so Railway should run it automatically on the next deployment. Just push the code and Railway will:
1. Run `prisma generate`
2. Run `prisma db push` (creates tables)
3. Build the app

### Option 2: Manual Setup via Railway CLI
If automatic doesn't work, you can run it manually:

1. **Install Railway CLI** (if not installed):
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to your project**:
   ```bash
   railway link
   ```

4. **Run database setup**:
   ```bash
   railway run npx prisma db push
   ```

### Option 3: Manual Setup via Railway Dashboard
1. Go to Railway dashboard
2. Click on your **Web Service**
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click **"Redeploy"** - this will trigger the new build script

## Verify Database Schema

After setup, verify tables exist:

1. Go to Railway → PostgreSQL service
2. Click **"Query"** tab
3. Run this query:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

You should see tables like:
- `User`
- `Game`
- `Friend`
- `Message`
- `Tournament`
- etc.

## After Database Setup

Once tables are created:
- ✅ Login should work
- ✅ Signup should work
- ✅ No more 500 errors

## Troubleshooting

### Still getting 500 errors?
1. Check Railway logs for Prisma errors
2. Verify DATABASE_URL is correct
3. Make sure PostgreSQL service is running
4. Check if `prisma db push` ran successfully in build logs

### "Table already exists" errors?
- This is fine! It means tables are already created
- The error is harmless, Railway will continue


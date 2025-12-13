# Fix Railway 500 Errors - Environment Variables Setup

## Problem
You're getting 500 errors when trying to login or signup on Railway. This is because **environment variables are not set** on Railway.

## Solution: Set Environment Variables on Railway

### Step 1: Find Your Railway App URL
1. Go to https://railway.app
2. Open your project
3. Click on your **Web Service** (the Next.js app, not PostgreSQL)
4. Go to **Settings** → **Domains**
5. Copy your Railway URL (e.g., `https://your-app-name.up.railway.app`)

### Step 2: Find Your Database URL
1. In the same Railway project, click on your **PostgreSQL** service
2. Go to **Variables** tab
3. Find `DATABASE_URL` - this is your database connection string
4. Copy it (looks like: `postgresql://postgres:password@host:port/railway`)

### Step 3: Generate NEXTAUTH_SECRET
Run this in PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```
Copy the output (long string of letters/numbers)

### Step 4: Add Environment Variables to Railway
1. Go back to your **Web Service** (not PostgreSQL)
2. Click **Variables** tab
3. Click **+ New Variable** for each of these:

#### Variable 1: DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: Paste the DATABASE_URL from Step 2
- **Click Save**

#### Variable 2: NEXTAUTH_SECRET
- **Name**: `NEXTAUTH_SECRET`
- **Value**: Paste the secret from Step 3
- **Click Save**

#### Variable 3: NEXT_PUBLIC_APP_URL
- **Name**: `NEXT_PUBLIC_APP_URL`
- **Value**: Your Railway URL from Step 1 (e.g., `https://your-app-name.up.railway.app`)
- **Click Save**

#### Variable 4: NEXT_PUBLIC_SOCKET_URL
- **Name**: `NEXT_PUBLIC_SOCKET_URL`
- **Value**: Same as NEXT_PUBLIC_APP_URL (e.g., `https://your-app-name.up.railway.app`)
- **Click Save**

### Step 5: Wait for Redeploy
After adding all variables, Railway will automatically:
- ✅ Redeploy your app
- ✅ Rebuild with the new environment variables
- ✅ Start the application

### Step 6: Test
1. Go to your Railway URL
2. Try to **Sign Up** with a new account
3. Try to **Login** with existing credentials
4. Both should work now! 🎉

## Quick Checklist

- [ ] DATABASE_URL is set (from PostgreSQL service)
- [ ] NEXTAUTH_SECRET is set (generated secret)
- [ ] NEXT_PUBLIC_APP_URL is set (your Railway URL)
- [ ] NEXT_PUBLIC_SOCKET_URL is set (same as APP_URL)
- [ ] Railway has redeployed after adding variables
- [ ] Login/Signup works on Railway URL

## Still Getting Errors?

If you still get 500 errors after setting variables:

1. **Check Railway Logs**:
   - Go to Railway → Your Web Service → **Deployments** tab
   - Click on the latest deployment
   - Check **Logs** for specific error messages

2. **Verify Database Connection**:
   - Make sure PostgreSQL service is running
   - Verify DATABASE_URL is correct (use Internal URL, not public)

3. **Check Build Logs**:
   - Look for Prisma errors
   - Make sure `npx prisma generate` runs successfully
   - Check if database schema is pushed

## Common Issues

### Issue: "Database connection failed"
**Fix**: Check DATABASE_URL is set correctly and PostgreSQL service is running

### Issue: "Prisma Client not generated"
**Fix**: Railway should run `prisma generate` automatically. Check build logs.

### Issue: "Session creation failed"
**Fix**: Make sure NEXTAUTH_SECRET is set

### Issue: "CORS errors"
**Fix**: Make sure NEXT_PUBLIC_APP_URL matches your Railway domain exactly


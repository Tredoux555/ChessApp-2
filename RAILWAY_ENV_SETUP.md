# Railway Environment Variables Setup

## Required Environment Variables

Your Railway deployment needs these environment variables set in the Railway dashboard:

### 1. DATABASE_URL
- **Where to find it**: Railway Project → PostgreSQL Service → Variables tab → `DATABASE_URL`
- **Format**: `postgresql://postgres:password@host:port/railway`
- **Important**: Use the **Internal Database URL** (not the public one)

### 2. NEXTAUTH_SECRET
- **Generate one**: Run this in PowerShell:
  ```powershell
  [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
  ```
- **Or use**: Any random string (at least 32 characters)
- **Example**: `aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890AbCdEfGhIjKlMnOpQrStUvWxYz`

### 3. NEXT_PUBLIC_APP_URL
- **Set to**: Your Railway app URL
- **Format**: `https://your-app-name.up.railway.app`
- **Find it**: Railway Project → Your Web Service → Settings → Domains

### 4. NEXT_PUBLIC_SOCKET_URL
- **Set to**: Same as NEXT_PUBLIC_APP_URL
- **Format**: `https://your-app-name.up.railway.app`

## How to Set Environment Variables in Railway

1. Go to https://railway.app
2. Open your project
3. Click on your **Web Service** (not the PostgreSQL service)
4. Go to the **Variables** tab
5. Click **+ New Variable** for each variable above
6. Add all 4 variables
7. Railway will automatically redeploy when you save

## Quick Setup Script

After setting variables, Railway will rebuild. Check the deployment logs to ensure:
- ✅ Build completes successfully
- ✅ No DATABASE_URL errors
- ✅ Application starts on port 3000

## Troubleshooting 500 Errors

If you're getting 500 errors:
1. ✅ Check DATABASE_URL is set correctly
2. ✅ Verify database is accessible (Railway PostgreSQL service is running)
3. ✅ Check NEXTAUTH_SECRET is set
4. ✅ Ensure NEXT_PUBLIC_APP_URL matches your Railway domain
5. ✅ Check Railway deployment logs for specific error messages

## Verify Setup

After setting variables, test:
- Login: Should work if DATABASE_URL is correct
- Signup: Should create users if DATABASE_URL is correct
- Dashboard: Should load if session/auth is working


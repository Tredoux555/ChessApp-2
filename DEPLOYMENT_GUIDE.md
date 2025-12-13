# 🚀 Deploy to Railway - Access from Anywhere

## Why Deploy?
- ✅ Accessible from any country/device
- ✅ Public URL (e.g., `https://your-app.railway.app`)
- ✅ Always online (when deployed)
- ✅ Free tier available

## Step 1: Prepare Your Code

### 1.1 Push to GitHub
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create a GitHub repository, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 1.2 Update .env for Production
Your `.env` file should have:
```env
DATABASE_URL="your-railway-postgres-url-here"
NEXTAUTH_SECRET="your-secret-key-here"
NEXT_PUBLIC_APP_URL="https://your-app-name.railway.app"
NEXT_PUBLIC_SOCKET_URL="https://your-app-name.railway.app"
```

**Important:** Don't commit `.env` to GitHub! It contains secrets.

## Step 2: Deploy to Railway

### 2.1 Create Railway Account
1. Go to https://railway.app
2. Sign up/login (use GitHub account for easy setup)

### 2.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Railway will auto-detect Next.js

### 2.3 Add PostgreSQL Database
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Wait for it to create (~30 seconds)
4. Copy the **Internal Database URL** (for DATABASE_URL)

### 2.4 Configure Environment Variables
In Railway project → Your web service → Variables tab, add:

```
DATABASE_URL=<Internal Database URL from PostgreSQL service>
NEXTAUTH_SECRET=<your-secret-from-.env>
NEXT_PUBLIC_APP_URL=https://your-app-name.railway.app
NEXT_PUBLIC_SOCKET_URL=https://your-app-name.railway.app
```

**Note:** Railway auto-generates a URL like `https://your-app-name.up.railway.app`

### 2.5 Set Build & Start Commands
Railway auto-detects Next.js, but verify:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

### 2.6 Deploy!
Railway will automatically:
1. Clone your repo
2. Install dependencies
3. Build your app
4. Start the server
5. Give you a public URL

## Step 3: Get Your Public URL

### 3.1 Railway Auto-Generated URL
- Railway gives you: `https://your-app-name.up.railway.app`
- This works immediately!

### 3.2 Custom Domain (Optional)
1. In Railway → Settings → Networking
2. Click "Custom Domain"
3. Add your domain (e.g., `riddickchess.fun`)
4. Update DNS records as Railway instructs
5. Update `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SOCKET_URL` in Railway variables

## Step 4: Update Environment Variables

After deployment, update Railway environment variables with your actual URL:

```
NEXT_PUBLIC_APP_URL=https://your-actual-railway-url.railway.app
NEXT_PUBLIC_SOCKET_URL=https://your-actual-railway-url.railway.app
```

Then redeploy (Railway auto-redeploys when you change variables).

## Step 5: Access Your App

Once deployed, your app will be accessible at:
- **Railway URL:** `https://your-app-name.up.railway.app`
- **Custom Domain (if set):** `https://your-domain.com`

**From anywhere in the world!** 🌍

## Troubleshooting

### App won't start
- Check Railway logs for errors
- Verify all environment variables are set
- Make sure DATABASE_URL uses Internal Database URL

### Database connection errors
- Use the **Internal Database URL** (not External)
- Format: `postgresql://postgres:password@postgres.railway.internal:5432/railway`

### Socket.io not working
- Ensure `NEXT_PUBLIC_SOCKET_URL` matches your Railway URL
- Railway supports WebSockets automatically

### Build fails
- Check Railway build logs
- Make sure all dependencies are in `package.json`
- Verify Node.js version (Railway auto-detects)

## Railway Free Tier

- ✅ $5 free credit monthly
- ✅ 500 hours of runtime
- ✅ 512MB RAM
- ✅ Perfect for development/testing
- ⚠️ Spins down after inactivity (paid plans stay always-on)

## Next Steps After Deployment

1. **Test your app** at the Railway URL
2. **Create admin account** via Prisma Studio or Railway console
3. **Share the URL** with friends/family
4. **Monitor usage** in Railway dashboard

---

**Your app will be live and accessible from anywhere!** 🎉






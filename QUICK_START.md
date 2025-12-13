# QUICK START GUIDE - Riddick Chess

## 🚀 Localhost Setup (Get Running First!)

### Step 1: Install Dependencies
Open terminal in your project folder and run:
```bash
npm install
```

### Step 2: Setup Database (Railway PostgreSQL)
You need a PostgreSQL database. The easiest way is Railway:

1. Go to https://railway.app
2. Sign up/login (free account)
3. Click "New Project"
4. Click "New" → "Database" → "PostgreSQL"
5. Wait for it to create (takes ~30 seconds)
6. Click on the PostgreSQL service
7. Go to "Variables" tab
8. Copy the `DATABASE_URL` value (looks like: `postgresql://postgres:password@host:port/railway`)

### Step 3: Create .env File

You need to create a file called `.env` in the root folder of your project (same folder where `package.json` is).

#### Option A: Create .env File Manually

1. **In your file explorer:**
   - Navigate to your project folder: `C:\Users\HP\Desktop\ChessApp 2`
   - Right-click in the folder
   - Select "New" → "Text Document"
   - Name it exactly: `.env` (including the dot at the start)
   - Windows might warn you about changing the extension - click "Yes"

2. **Open the `.env` file** with Notepad or any text editor

3. **Copy and paste this exact content:**
   ```env
   DATABASE_URL="paste-your-railway-database-url-here"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
   ```

4. **Replace the values:**
   - **DATABASE_URL**: Paste the URL you copied from Railway in Step 2 (should look like `postgresql://postgres:xxxxx@xxxxx.railway.app:5432/railway`)
   - **NEXTAUTH_SECRET**: Generate a secret key (see below)
   - **NEXT_PUBLIC_APP_URL**: Keep as `http://localhost:3000`
   - **NEXT_PUBLIC_SOCKET_URL**: Keep as `http://localhost:3000`

5. **Save the file** (Ctrl+S)

#### Option B: Create .env File Using Terminal

1. **Open PowerShell or Command Prompt** in your project folder
2. **Run this command:**
   ```bash
   New-Item -Path .env -ItemType File
   ```
3. **Open the file:**
   ```bash
   notepad .env
   ```
4. **Paste the content** from Option A above
5. **Save and close**

#### Generate NEXTAUTH_SECRET

You need a random secret key. Choose one method:

**Method 1: Windows PowerShell (Easiest)**
1. Open PowerShell
2. Run this command:
   ```powershell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   ```
3. Copy the output (it will be a long string of letters/numbers)
4. Paste it as the value for `NEXTAUTH_SECRET` in your `.env` file

**Method 2: Use Online Generator**
1. Go to https://generate-secret.vercel.app/32
2. Copy the generated secret
3. Paste it in your `.env` file

**Method 3: Use Any Random String**
- Just type any long random string (at least 32 characters)
- Example: `my-super-secret-key-12345-abcdefghijklmnop`

#### Final .env File Should Look Like This:

```env
DATABASE_URL="postgresql://postgres:AbC123XyZ@containers-us-west-123.railway.app:5432/railway"
NEXTAUTH_SECRET="aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890AbCdEfGhIjKlMnOpQrStUvWxYz"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

**Important Notes:**
- ✅ Keep the quotes around the values
- ✅ No spaces around the `=` sign
- ✅ Make sure the file is named exactly `.env` (not `.env.txt`)
- ✅ The file should be in the root folder (same level as `package.json`)
- ✅ Don't commit this file to GitHub (it contains secrets!)

#### Verify Your .env File is Correct:

1. Make sure the file exists: `C:\Users\HP\Desktop\ChessApp 2\.env`
2. Open it and check:
   - DATABASE_URL has your Railway database URL
   - NEXTAUTH_SECRET has a long random string
   - Both URL variables are set to `http://localhost:3000`

### Step 4: Setup Database Schema

**IMPORTANT: Make sure you're in the project root folder!**

1. **Open PowerShell or Command Prompt**

2. **Navigate to your project folder (NOTE: Use quotes because folder name has a space!):**
   ```powershell
   cd "C:\Users\HP\Desktop\ChessApp 2"
   ```
   **OR** drag your project folder into the terminal window (it will auto-add quotes)

3. **Verify you're in the right place:**
   ```powershell
   dir
   ```
   You should see: `package.json`, `prisma` folder, `app` folder, etc.

4. **Make sure dependencies are installed (if you haven't already):**
   ```bash
   npm install
   ```
   This ensures Prisma 5.22.0 is installed (not Prisma 7)

5. **Run these commands one at a time:**
   ```bash
   npx prisma@5.22.0 generate
   ```
   Wait for it to finish (you'll see "Generated Prisma Client...")

   Then run:
   ```bash
   npx prisma@5.22.0 db push
   ```

   **OR** if you prefer, use the local version:
   ```bash
   .\node_modules\.bin\prisma generate
   .\node_modules\.bin\prisma db push
   ```

6. **You should see:** "✔ Your database is now in sync with your Prisma schema"

**If you get an error about Prisma 7:**
- You have Prisma 7 installed globally, but this project uses Prisma 5
- Use `npx prisma@5.22.0` instead of just `npx prisma`
- Or run `npm install` to ensure the correct version is in node_modules

**If you get an error about not finding the schema:**
- Make sure you're in the project root (where `package.json` is)
- Check that `prisma\schema.prisma` file exists
- Try running: `npx prisma@5.22.0 generate --schema=./prisma/schema.prisma`

### Step 5: Start Development Server
```bash
npm run dev
```

You should see: "Ready - started server on 0.0.0.0:3000"

### Step 6: Open in Browser
Visit: **http://localhost:3000**

You should see the login/register page!

### Step 7: Create Your First Account
1. Click "Register" and create an account
2. Login with your new account

### Step 8: Make Yourself Admin
1. In a new terminal, run: `npx prisma studio`
2. This opens a database viewer at http://localhost:5555
3. Click on "User" table
4. Find your username
5. Click on your user row
6. Find the `isAdmin` field and change it from `false` to `true`
7. Click "Save 1 change"
8. Go back to http://localhost:3000 and refresh
9. You should now see admin features!

## ✅ You're Done!
Your app is now running on localhost! You can:
- Register/login users
- Add friends
- Play chess
- Use admin features (if you set isAdmin = true)

---

## 📦 Production Deployment (Railway)

## 📦 Production Deployment (Railway)

### Deploy to Railway
1. Push code to GitHub
2. In Railway, click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Railway will auto-detect Next.js and deploy

### Add Environment Variables
In Railway project settings, add:
```
NEXTAUTH_SECRET=your-secret-here
NEXT_PUBLIC_APP_URL=https://riddickchess.fun
NEXT_PUBLIC_SOCKET_URL=https://riddickchess.fun
```
(DATABASE_URL is auto-set by Railway)

### Add Custom Domain
1. Railway Settings → "Networking"
2. Click "Generate Domain" or "Custom Domain"
3. Add `riddickchess.fun`
4. Update your domain's DNS with CNAME record pointing to Railway

### Database Migration
```bash
# Railway will auto-run this, but if needed:
npx prisma db push
```

## 🎮 Core Features & Usage

### For Regular Users:
1. **Register/Login** - Create account (no email needed)
2. **Add Friends** - Search users, send friend requests
3. **Play Chess** - Challenge friends, set time controls (1-999 min)
4. **Chat** - Real-time messaging with friends
5. **Marketplace** - Buy school goods with WeChat QR codes
6. **Spectate** - Watch live games and tournaments

### For Admins (Your Son & You):
1. **Manage Users** - Ban, suspend, or unsuspend players
2. **Moderate Chat** - View flagged messages, delete inappropriate content
3. **Manage Products** - Add, edit, delete marketplace items
4. **Create Tournaments** - Setup bracket-style tournaments
5. **Monitor Games** - View all active games

## 🔧 Admin Panel Access
Once your account has `isAdmin = true`:
- Visit `/admin` route
- See "Admin" tab in mobile navigation
- Access full moderation tools

## 💬 Chat System
- Friend-only messaging (must be accepted friends)
- Profanity filter auto-flags bad language
- Admins can review all flagged messages
- Real-time with Socket.io

## ♟️ Chess Features
- Standard chess rules (chess.js engine)
- Time controls: 1-999 minutes per player
- Countdown timers with automatic timeout
- Draw offers and resignation
- Multiple board themes
- Spectator mode
- Real-time move synchronization

## 🛒 Marketplace
- Admin-only product management
- WeChat Pay QR code integration
- Product photos, descriptions, pricing
- Honor system for payments (admin confirms)

## 🏆 Tournaments
- Admin creates tournaments
- Users join (up to maxPlayers)
- Bracket-style elimination
- Spectators can watch all matches
- Automatic bracket generation

## 📱 Mobile App Features
- PWA (Add to Home Screen)
- Mobile-first responsive design
- Touch-friendly chess pieces
- Bottom navigation bar
- Pull-to-refresh support

## 🎨 Customization

### Board Themes
Users can switch between:
- Default (chess.com style)
- Blue
- Green
- Brown
- Grey

### Dark Mode
- Auto-detect system preference
- Manual toggle in header
- Persists across sessions

## 🔐 Security Features
- Password hashing (bcryptjs)
- Session-based authentication
- "Remember Me" functionality
- Ban/suspend system
- Friend-only messaging
- Profanity detection
- Admin-only routes

## 🐛 Troubleshooting

### "Could not find Prisma Schema" Error

**This means Prisma can't find the `schema.prisma` file. Here's how to fix it:**

1. **Make sure you're in the project root folder:**
   ```powershell
   # Check where you are
   pwd
   # Should show: C:\Users\HP\Desktop\ChessApp 2
   
   # If not, navigate there (USE QUOTES because folder name has a space!):
   cd "C:\Users\HP\Desktop\ChessApp 2"
   ```
   **IMPORTANT:** Always use quotes around paths with spaces!

2. **Verify the schema file exists:**
   ```powershell
   # Check if file exists
   Test-Path "prisma\schema.prisma"
   # Should return: True
   ```

3. **If the file exists, try specifying the path explicitly:**
   ```bash
   npx prisma generate --schema=./prisma/schema.prisma
   npx prisma db push --schema=./prisma/schema.prisma
   ```

4. **If the file doesn't exist, check:**
   - Is the `prisma` folder in the root directory?
   - Is `schema.prisma` inside the `prisma` folder?
   - Did you copy all files from the repository?

5. **Common mistake:** Running commands from a subfolder instead of the root folder where `package.json` is located.

### Database Connection Issues
```bash
# Check DATABASE_URL format (Windows PowerShell)
$env:DATABASE_URL

# Regenerate Prisma Client
npx prisma generate

# Re-push schema
npx prisma db push
```

### Socket.io Not Connecting
- Ensure `NEXT_PUBLIC_SOCKET_URL` matches your domain
- Check browser console for errors
- Verify WebSocket isn't blocked by firewall
- Railway auto-enables WebSockets

### Can't Login
- Check if user is banned/suspended
- Verify password is correct
- Check database connection
- Look for errors in Railway logs

### Admin Features Not Working
- Verify `isAdmin = true` in database
- Clear browser cookies
- Re-login after admin status change

### Chess Moves Not Synchronizing
- Check Socket.io connection status
- Verify both players are connected
- Check Railway logs for errors
- Ensure game status is "active"

## 📊 Database Management

### View Database
```bash
npx prisma studio
# Opens GUI at http://localhost:5555
```

### Backup Database
Railway provides automatic backups, or use:
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Reset Database (Development Only!)
```bash
npx prisma db push --force-reset
```

## 🔄 Updates & Maintenance

### Update Dependencies
```bash
npm update
npx prisma generate
```

### Add New Admin
1. User registers account
2. Find user ID in Prisma Studio
3. Set `isAdmin = true`
4. User logs out and back in

### Change Admin WeChat QR
1. Login as admin
2. Go to marketplace
3. Edit product
4. Upload new QR code image

## 📈 Monitoring

### Railway Logs
- View in Railway dashboard
- Real-time error tracking
- Database query logs

### Performance
- Railway free tier: $5/month after credits
- Handles ~100 concurrent users
- Upgrade plan for more traffic

## 🎯 Next Steps

After deployment:
1. Test all features thoroughly
2. Add more board themes (CSS)
3. Expand profanity filter word list
4. Add more products to marketplace
5. Create first tournament
6. Invite friends to test

## 💡 Tips

- **Mobile First**: Design and test on mobile devices
- **Admin Powers**: Use wisely, be fair to all players
- **Chat Moderation**: Review flagged messages regularly
- **Product QR Codes**: Keep WeChat QR images updated
- **Friend Requests**: Encourage users to add friends first
- **Time Controls**: Start with 10-15 minute games
- **Tournaments**: 8 players works best for single-elimination

## 🤝 Support

If you get stuck:
1. Check browser console for errors
2. View Render logs for server errors
3. Use Prisma Studio to inspect database
4. Check this guide and README.md
5. Review implementation guides

## 🎉 You're Ready!

Your chess app is now live at **riddickchess.fun**!

Share with friends and start playing! ♟️

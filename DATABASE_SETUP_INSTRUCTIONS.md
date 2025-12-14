# Database Setup Instructions - Complete Guide

## 🎯 Quick Summary

I've created an SQL script (`database_setup.sql`) that will create all your database tables. You have **3 options** to set up the database:

1. **Railway Web Shell** (Easiest - Recommended)
2. **Railway CLI** (Command line)
3. **Direct SQL Script** (Using Railway's database connection)

---

## ✅ Option 1: Railway Web Shell (EASIEST)

### Step-by-Step:

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your project**: "handsome-adventure"
3. **Click on your database service** (should be something like "riddick-chess-db" or "PostgreSQL")
4. **Click "Connect"** or **"Query"** tab
5. **Copy the entire contents** of `database_setup.sql` file
6. **Paste it into the SQL query editor**
7. **Click "Run"** or press Ctrl+Enter
8. **Wait for success message**: "Database setup completed successfully!"

**OR** if Railway doesn't have a query editor:

1. **Go to your Web Service** (riddick-chess)
2. **Click "Deployments"** → Latest deployment
3. **Click "Shell"**
4. **Run**: `npx prisma db push`

---

## ✅ Option 2: Railway CLI

### Prerequisites:
- Railway CLI installed (already done ✅)
- Logged into Railway (already done ✅)
- Project linked (already done ✅)

### Steps:

1. **Open terminal** (PowerShell)
2. **Navigate to project**:
   ```bash
   cd "C:\Users\HP\Desktop\ChessApp 2"
   ```
3. **Run database setup**:
   ```bash
   railway run --service riddick-chess npx prisma db push
   ```

**Note**: This uses Prisma to sync the schema, which is safer than raw SQL.

---

## ✅ Option 3: Direct SQL Script (Advanced)

### If you have direct database access:

1. **Get your database connection string** from Railway:
   - Railway → Database Service → Variables → `DATABASE_URL`
   - It should look like: `postgresql://postgres:password@host:port/railway`

2. **Use a PostgreSQL client** (like pgAdmin, DBeaver, or psql):
   ```bash
   psql "postgresql://postgres:password@host:port/railway" -f database_setup.sql
   ```

3. **Or connect via Railway's database URL** and run the SQL script manually

---

## 🔍 Verify Database Setup

After running the setup, verify tables were created:

### Using Railway Shell:
```bash
railway run --service riddick-chess npx prisma studio
```

Then open the URL it provides (usually http://localhost:5555) to see all your tables.

### Using SQL:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- User
- Game
- Friendship
- Message
- Product
- Order
- Tournament
- TournamentParticipant
- TournamentMatch
- Spectator

---

## 🚨 Troubleshooting

### Error: "relation already exists"
**Solution**: The tables already exist. Either:
- Drop them first (the SQL script does this automatically)
- Or use `npx prisma db push` which handles this safely

### Error: "permission denied"
**Solution**: Make sure you're using the correct database user with CREATE privileges

### Error: "connection refused"
**Solution**: 
- Check your `DATABASE_URL` in Railway → Variables
- Make sure the database service is running
- Use Railway's internal URL format for the web service

### Error: "table 'public.user' doesn't exist" (after setup)
**Solution**: 
- Re-run the setup script
- Check Railway logs for any errors
- Verify the database connection is working

---

## 📝 What the SQL Script Does

The `database_setup.sql` script:

1. ✅ Creates all 10 tables matching your Prisma schema
2. ✅ Sets up all primary keys and unique constraints
3. ✅ Creates all indexes for performance
4. ✅ Sets up all foreign key relationships
5. ✅ Handles cascading deletes properly
6. ✅ Sets default values for all fields

**Tables created:**
- `User` - User accounts and profiles
- `Game` - Chess games
- `Friendship` - Friend relationships
- `Message` - Chat messages
- `Product` - Marketplace products
- `Order` - Purchase orders
- `Tournament` - Tournament information
- `TournamentParticipant` - Tournament participants
- `TournamentMatch` - Tournament matches
- `Spectator` - Game spectators

---

## ✅ Next Steps After Database Setup

1. **Test Registration**: Try creating a new account
2. **Test Login**: Log in with your new account
3. **Create Admin User**: 
   - Register normally
   - Then in Railway Shell, run:
     ```sql
     UPDATE "User" SET "isAdmin" = true WHERE "username" = 'your-username';
     ```
4. **Test Features**: 
   - Create a game
   - Send a friend request
   - Test chat
   - Create a tournament

---

## 🆘 Still Having Issues?

If you're still getting errors:

1. **Check Railway Logs**: Railway → Service → Logs
2. **Verify Environment Variables**: Railway → Variables
   - `DATABASE_URL` should be set
   - `NEXTAUTH_SECRET` should be set
   - `NEXT_PUBLIC_APP_URL` should be set
   - `NEXT_PUBLIC_SOCKET_URL` should be set
3. **Check Build Status**: Make sure the latest build succeeded
4. **Share Error Messages**: Copy the exact error and I'll help fix it!

---

## 📞 Quick Reference

- **SQL Script**: `database_setup.sql`
- **Railway Dashboard**: https://railway.app
- **Your Project**: handsome-adventure
- **Your Service**: riddick-chess
- **Database**: riddick-chess-db (or similar)

Good luck! 🚀


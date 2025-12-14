# How to Run SQL in Railway - Step-by-Step Guide

## 🎯 Method 1: Railway Web Shell with psql (EASIEST - Recommended)

### Step-by-Step:

1. **Go to Railway Dashboard**: https://railway.app
2. **Click on your project**: "handsome-adventure"
3. **Click on your DATABASE service** (should be named something like "PostgreSQL" or "riddick-chess-db")
4. **Click "Connect"** tab (or look for "Query" or "Data" tab)
5. **You'll see a SQL query editor** - this is where you paste your SQL!

**OR if you don't see a query editor:**

1. **Go to your WEB SERVICE** (riddick-chess) instead
2. **Click "Deployments"** → Latest deployment
3. **Click "Shell"** button
4. **Run this command** to connect to the database:
   ```bash
   psql $DATABASE_URL
   ```
5. **Then paste your SQL** line by line, or use:
   ```bash
   psql $DATABASE_URL -f database_setup.sql
   ```
   (But you'll need to upload the file first)

---

## 🎯 Method 2: Railway Web Shell - Copy/Paste SQL

### If Railway has a Query Editor:

1. **Railway Dashboard** → Your **database service**
2. **Click "Connect"** or **"Query"** tab
3. **Copy the ENTIRE contents** of `database_setup.sql`
4. **Paste into the SQL editor**
5. **Click "Run"** or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)
6. **Wait for success message**

---

## 🎯 Method 3: Railway Web Shell - Using psql Command

### If you need to use the command line:

1. **Railway Dashboard** → Your **web service** (riddick-chess)
2. **Click "Deployments"** → Latest deployment
3. **Click "Shell"**
4. **Run these commands one by one**:

   ```bash
   # First, create the SQL file
   cat > /tmp/setup.sql << 'EOF'
   ```

5. **Then paste the ENTIRE SQL script** from `database_setup.sql`
6. **Press Enter, then type**:
   ```bash
   EOF
   ```

7. **Then run**:
   ```bash
   psql $DATABASE_URL -f /tmp/setup.sql
   ```

---

## 🎯 Method 4: Use Prisma Instead (EASIEST - No SQL needed!)

### This is actually the EASIEST way:

1. **Railway Dashboard** → Your **web service** (riddick-chess)
2. **Click "Deployments"** → Latest deployment
3. **Click "Shell"**
4. **Run this ONE command**:
   ```bash
   npx prisma db push
   ```

That's it! Prisma will automatically create all tables based on your schema. No SQL needed!

**This is the recommended method** because:
- ✅ No SQL knowledge needed
- ✅ Automatically matches your Prisma schema
- ✅ Handles errors gracefully
- ✅ One simple command

---

## 🎯 Method 5: Railway CLI (From Your Computer)

### If you prefer using your terminal:

1. **Open PowerShell** on your computer
2. **Navigate to your project**:
   ```bash
   cd "C:\Users\HP\Desktop\ChessApp 2"
   ```

3. **Connect to Railway database**:
   ```bash
   railway run --service riddick-chess psql $DATABASE_URL
   ```

4. **Then paste your SQL** commands

**OR** use Prisma (easier):
```bash
railway run --service riddick-chess npx prisma db push
```

---

## 🎯 Method 6: External PostgreSQL Client

### If you want to use a GUI tool:

1. **Get your database connection string**:
   - Railway → Database service → Variables → `DATABASE_URL`
   - It looks like: `postgresql://postgres:password@host:port/railway`

2. **Use a PostgreSQL client**:
   - **pgAdmin** (free, GUI)
   - **DBeaver** (free, GUI)
   - **TablePlus** (paid, beautiful)
   - **psql** (command line)

3. **Connect using the connection string**

4. **Open `database_setup.sql`** and run it

---

## ✅ RECOMMENDED: Use Prisma (Method 4)

**The easiest way is to use Prisma instead of raw SQL:**

1. Railway Dashboard → riddick-chess service
2. Deployments → Latest → Shell
3. Run: `npx prisma db push`

**That's it!** Prisma will create all tables automatically.

---

## 🔍 How to Find Your Database Service in Railway

1. **Railway Dashboard** → Your project
2. **Look for services** - you should see:
   - **riddick-chess** (your web service)
   - **PostgreSQL** or **riddick-chess-db** (your database)

3. **Click on the database service** to access it

---

## 🆘 Troubleshooting

### "Command not found: psql"
**Solution**: Use Method 4 (Prisma) instead, or install psql in the shell first

### "Permission denied"
**Solution**: Make sure you're using the correct database user (Railway handles this automatically)

### "Connection refused"
**Solution**: 
- Check that your database service is running
- Use `$DATABASE_URL` environment variable (Railway sets this automatically)

### "No query editor visible"
**Solution**: Use Method 4 (Prisma) or Method 3 (Shell with psql)

---

## 📝 Quick Reference

**EASIEST METHOD:**
```bash
# In Railway Shell:
npx prisma db push
```

**SQL METHOD:**
1. Railway → Database service → Connect/Query tab
2. Paste SQL script
3. Run

**Need help?** Let me know which method you're trying and I'll help!


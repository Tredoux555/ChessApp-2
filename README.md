# Riddick Chess - Full Stack Chess Application

A real-time chess application with chat, marketplace, and tournament features built with Next.js, Prisma, PostgreSQL, and Socket.io.

## Features

- ♟️ Real-time chess games with time controls (1-999 minutes)
- 💬 Live chat system with friend requests
- 🛒 Marketplace for school goods (WeChat Pay QR code)
- 🏆 Tournament system with spectating
- 👥 User profiles with avatars
- 🔒 Admin panel for moderation
- 🌓 Light/Dark mode
- 🎨 Multiple chess board themes
- 📱 Mobile-first responsive design

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Render)
- **Real-time**: Socket.io
- **Chess Engine**: chess.js
- **Board**: react-chessboard
- **Authentication**: Custom session-based auth

## Prerequisites

- Node.js 18+ 
- Render account (or PostgreSQL database)
- Git

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database (from Render PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/database"

# App Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-here"

# URLs
NEXT_PUBLIC_APP_URL="https://riddickchess.fun"
NEXT_PUBLIC_SOCKET_URL="https://riddickchess.fun"
```

## Installation

```bash
# Clone the repository
cd riddick-chess

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Push database schema
npx prisma db push

# (Optional) Seed database with admin user
npx prisma db seed
```

## Create Admin User

After first deployment, create admin users directly in database or via Prisma Studio:

```bash
npx prisma studio
```

Then find your user and set `isAdmin = true`.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

### Users
- Authentication and profiles
- Admin roles
- Ban/suspend functionality

### Games
- Real-time chess games
- Time controls
- Game states (active, completed, draw offered)
- Spectating support

### Friendships
- Friend requests (pending, accepted, rejected)
- Friend-only messaging

### Messages
- Real-time chat
- Profanity detection
- Admin moderation

### Products
- Marketplace items
- Admin management
- Image support

### Tournaments
- Bracket-style tournaments
- Multiple participants
- Spectating support

## Deployment to Render

1. Create Render account at https://render.com
2. Create new PostgreSQL database:
   - Click "New +" → "PostgreSQL"
   - Choose name and region
   - Copy the Internal Database URL
3. Create new Web Service:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Auto-detects Next.js
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Set environment variables in Render dashboard:
   - `DATABASE_URL` (use Internal Database URL from PostgreSQL service)
   - `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` (your Render app URL)
   - `NEXT_PUBLIC_SOCKET_URL` (same as APP_URL)
5. Deploy!

### Custom Domain Setup

1. In Render dashboard → Settings → Custom Domains
2. Add your custom domain: `riddickchess.fun`
3. Render will provide DNS instructions (CNAME or A record)
4. Update your domain's DNS records as instructed
5. Wait for SSL certificate (automatic, takes a few minutes)
6. Update environment variables with new domain

## Project Structure

```
riddick-chess/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication
│   │   ├── games/        # Chess games
│   │   ├── friends/      # Friend system
│   │   ├── messages/     # Chat
│   │   ├── products/     # Marketplace
│   │   ├── admin/        # Admin panel
│   │   └── tournaments/  # Tournaments
│   ├── (pages)/          # Next.js pages
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── chess/           # Chess board & game
│   ├── chat/            # Chat interface
│   ├── marketplace/     # Product listings
│   └── admin/           # Admin controls
├── lib/                 # Utilities
│   ├── prisma.ts        # Database client
│   ├── auth.ts          # Auth helpers
│   └── profanity.ts     # Content moderation
├── pages/api/
│   └── socket.ts        # Socket.io server
├── prisma/
│   └── schema.prisma    # Database schema
├── public/              # Static assets
└── types/               # TypeScript types
```

## Key Components to Create

### 1. Chess Board Component (`components/chess/ChessBoard.tsx`)
- Uses `react-chessboard`
- Real-time move synchronization via Socket.io
- Time controls with countdown
- Draw offers, resignation
- Different board themes

### 2. Chat Component (`components/chat/ChatInterface.tsx`)
- Real-time messaging with Socket.io
- Friend list
- Message history
- Typing indicators

### 3. Marketplace Component (`components/marketplace/ProductGrid.tsx`)
- Product listings
- WeChat QR code display
- Admin product management

### 4. Tournament Bracket (`components/tournaments/TournamentBracket.tsx`)
- Visual bracket display
- Match progression
- Spectator access

### 5. Admin Panel (`components/admin/AdminDashboard.tsx`)
- User management (ban, suspend)
- Chat moderation (flagged messages)
- Product management
- Tournament management

## Socket.io Events

### Chess
- `join-game` - Join game room
- `move` - Make chess move
- `draw-offer` - Offer draw
- `draw-response` - Accept/decline draw
- `resign` - Resign game
- `spectate-game` - Watch game

### Chat
- `chat-message` - Send message
- `typing` - Typing indicator
- `new-message` - Receive message

### Friends
- `friend-request` - New friend request
- `friend-accepted` - Friend request accepted

### Tournaments
- `tournament-update` - Tournament state changed

## Security Features

- Password hashing with bcryptjs
- Session-based authentication
- Profanity filter
- Admin-only routes
- Ban/suspend system
- Friend-only messaging

## Board Themes

Implement these in CSS:
- Default (chess.com style)
- Blue
- Green
- Brown
- Grey

## Time Controls

- Configurable 1-999 minutes per player
- Real-time countdown
- Timeout detection
- Time added on opponent move

## Admin Features

Accessible only to users with `isAdmin = true`:
- Ban users (permanent)
- Suspend users (temporary with date)
- View all flagged messages
- Manage products
- Create/manage tournaments
- Delete games
- View all user activity

## Profanity Detection

Basic filter in `lib/profanity.ts`:
- Detects common profanity
- Handles character substitutions (@ for a, etc.)
- Auto-flags messages for admin review
- Expandable word list

## Mobile Optimization

- Touch-friendly chess piece movement
- Responsive layout breakpoints
- Bottom navigation for mobile
- Pull-to-refresh
- PWA support (add to home screen)

## Future Enhancements

- [ ] ELO rating system
- [ ] Game analysis
- [ ] Puzzle mode
- [ ] Opening trainer
- [ ] Video chat during games
- [ ] Multiple simultaneous games
- [ ] Game history/replay
- [ ] Achievement system
- [ ] Leaderboards

## Troubleshooting

### Database Connection Issues
- Check `DATABASE_URL` format
- Verify PostgreSQL is running
- Run `npx prisma db push` again

### Socket.io Not Connecting
- Ensure ports are open
- Check `NEXT_PUBLIC_SOCKET_URL` matches deployment URL
- Verify WebSocket support

### Admin Access
- Manually set `isAdmin = true` in database
- Clear browser cookies and login again

## Support

For issues or questions:
- Check the database with `npx prisma studio`
- View logs in Render dashboard
- Check browser console for errors

## License

Private - for personal use

---

Built with ♟️ by Riddick Chess Team

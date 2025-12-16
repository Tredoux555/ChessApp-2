# 🏗️ COMPLETE APPLICATION INFRASTRUCTURE

## 📦 Tech Stack

- **Framework**: Next.js 14.2.18 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM 5.22.0)
- **Real-time**: Socket.io 4.8.1
- **State Management**: Zustand 4.5.5
- **UI**: React 18.3.1, Tailwind CSS 3.4.15
- **Chess Engine**: chess.js 1.0.0-beta.8
- **Chess Board**: react-chessboard 4.7.2
- **Notifications**: react-hot-toast 2.4.1
- **Authentication**: Custom session-based (bcryptjs 2.4.3)
- **Server**: Custom Node.js server (server.js) for Socket.io WebSocket support

---

## 📁 Project Structure

```
ChessApp-2/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── me/route.ts
│   │   ├── games/                # Game management
│   │   │   ├── route.ts          # GET (list), POST (create)
│   │   │   └── [id]/route.ts     # GET (details), PUT (update: move, draw, resign, etc)
│   │   ├── friends/              # Friend requests
│   │   │   └── route.ts          # GET, POST, PUT, DELETE
│   │   ├── messages/             # Chat messages
│   │   │   └── route.ts          # GET, POST
│   │   ├── products/             # Marketplace
│   │   │   └── route.ts          # GET, POST, PUT, DELETE
│   │   ├── profile/              # User profiles
│   │   │   └── route.ts          # GET (search), PUT (update)
│   │   └── tournaments/          # Tournament system
│   │       ├── route.ts
│   │       └── [id]/route.ts
│   ├── dashboard/                # Protected dashboard pages
│   │   ├── layout.tsx            # Dashboard layout with auth check
│   │   └── page.tsx              # Dashboard home
│   ├── game/[id]/                # Game page
│   │   └── page.tsx
│   ├── chat/                     # Chat page
│   │   └── page.tsx
│   ├── profile/                  # User profile
│   │   └── page.tsx
│   ├── marketplace/              # Shop/marketplace
│   │   └── page.tsx
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home/landing page
│   ├── globals.css               # Global styles
│   ├── error.tsx                  # Error boundary
│   ├── not-found.tsx             # 404 page
│   └── global-error.tsx          # Global error boundary
├── components/                    # React components
│   ├── chess/                    # Chess game components
│   │   ├── ChessGame.tsx         # Main game component
│   │   ├── GameControls.tsx     # Resign, draw, close game buttons
│   │   ├── GameInfo.tsx          # Game metadata display
│   │   └── NewGameModal.tsx      # Create new game modal
│   ├── chat/                     # Chat components
│   │   ├── ChatInterface.tsx     # Chat UI
│   │   └── FriendsList.tsx      # Friends list with tabs
│   ├── friends/                  # Friend request components
│   │   ├── FriendRequests.tsx    # Pending requests list
│   │   └── SendFriendRequest.tsx # Send request button
│   ├── marketplace/              # Shop components
│   │   ├── ProductGrid.tsx       # Product listings
│   │   └── ProductForm.tsx      # Create product form
│   ├── notifications/            # Notification system
│   │   └── NotificationListener.tsx # Real-time notifications
│   └── layout/                   # Layout components
│       ├── Header.tsx            # Top navigation
│       └── MobileNav.tsx         # Mobile bottom nav
├── lib/                          # Utilities and helpers
│   ├── stores/                   # Zustand stores
│   │   ├── useAuthStore.ts      # Authentication state
│   │   ├── useSocketStore.ts    # Socket.io connection
│   │   └── useThemeStore.ts     # Dark/light theme
│   ├── hooks/                    # Custom React hooks
│   │   └── useSocket.ts         # Socket.io hook
│   ├── prisma.ts                 # Prisma client instance
│   ├── auth.ts                   # Auth helpers (requireAuth, requireAdmin)
│   └── profanity.ts              # Profanity filter
├── prisma/
│   └── schema.prisma             # Database schema
├── public/                       # Static assets
├── server.js                     # Custom Node.js server (Socket.io + Next.js)
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies and scripts

```

---

## 🗄️ Database Schema (Prisma)

```prisma
model User {
  id            String        @id @default(cuid())
  username      String        @unique
  email         String        @unique
  password      String
  displayName   String?
  bio           String?
  profileImage  String?
  isAdmin       Boolean       @default(false)
  isBanned      Boolean       @default(false)
  isSuspended   Boolean       @default(false)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  // Relations
  whiteGames    Game[]        @relation("WhitePlayer")
  blackGames    Game[]        @relation("BlackPlayer")
  friendshipsSent     Friendship[] @relation("Sender")
  friendshipsReceived Friendship[] @relation("Receiver")
  messagesSent        Message[]     @relation("MessageSender")
  messagesReceived    Message[]     @relation("MessageReceiver")
  products            Product[]
  orders              Order[]
}

model Friendship {
  id          String   @id @default(cuid())
  senderId    String
  receiverId  String
  status      String   @default("pending") // pending, accepted, rejected
  createdAt   DateTime @default(now())
  
  sender      User     @relation("Sender", fields: [senderId], references: [id], onDelete: Cascade)
  receiver    User     @relation("Receiver", fields: [receiverId], references: [id], onDelete: Cascade)
  
  @@unique([senderId, receiverId])
  @@index([senderId])
  @@index([receiverId])
  @@index([status])
}

model Game {
  id              String    @id @default(cuid())
  whitePlayerId   String
  blackPlayerId   String
  fen             String    @default("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
  pgn             String    @default("")
  status          String    @default("active") // active, draw_offered_white, draw_offered_black, completed, resigned, cancelled
  result          String?   // white_wins, black_wins, draw, cancelled
  timeControl     Int       @default(600) // seconds per player
  whiteTimeLeft   Int       @default(600)
  blackTimeLeft   Int       @default(600)
  lastMoveAt      DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  completedAt     DateTime?
  
  whitePlayer     User      @relation("WhitePlayer", fields: [whitePlayerId], references: [id], onDelete: Cascade)
  blackPlayer     User      @relation("BlackPlayer", fields: [blackPlayerId], references: [id], onDelete: Cascade)
  spectators      Spectator[]
  
  @@index([whitePlayerId])
  @@index([blackPlayerId])
  @@index([status])
}

model Message {
  id          String   @id @default(cuid())
  senderId    String
  receiverId  String
  content     String
  isRead      Boolean  @default(false)
  isFlagged   Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  sender      User     @relation("MessageSender", fields: [senderId], references: [id], onDelete: Cascade)
  receiver    User     @relation("MessageReceiver", fields: [receiverId], references: [id], onDelete: Cascade)
  
  @@index([senderId])
  @@index([receiverId])
  @@index([isFlagged])
  @@index([createdAt])
}

model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float
  imageUrl    String?
  quantity    Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  sellerId    String
  
  seller      User     @relation(fields: [sellerId], references: [id], onDelete: Cascade)
  orders      Order[]
  
  @@index([sellerId])
  @@index([isActive])
}

model Order {
  id          String   @id @default(cuid())
  productId   String
  buyerId     String
  quantity    Int      @default(1)
  totalPrice  Float
  status      String   @default("pending") // pending, paid
  createdAt   DateTime @default(now())
  
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  buyer       User     @relation(fields: [buyerId], references: [id], onDelete: Cascade)
  
  @@index([productId])
  @@index([buyerId])
  @@index([status])
}

model Tournament {
  id            String   @id @default(cuid())
  name          String
  description   String?
  maxPlayers    Int
  startDate     DateTime
  status        String   @default("upcoming") // upcoming, active, completed
  createdAt     DateTime @default(now())
  
  matches       TournamentMatch[]
}

model TournamentMatch {
  id          String   @id @default(cuid())
  tournamentId String
  round       Int
  gameId      String?
  
  tournament  Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  game        Game?      @relation(fields: [gameId], references: [id])
  
  @@index([tournamentId])
}

model Spectator {
  id        String   @id @default(cuid())
  gameId    String
  userId    String
  joinedAt  DateTime @default(now())
  
  game      Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  
  @@unique([gameId, userId])
  @@index([gameId])
}
```

---

## 🔌 API Routes Summary

### Authentication (`/api/auth/*`)
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login user (sets session cookie)
- `POST /api/auth/logout` - Logout user (clears session)
- `GET /api/auth/me` - Get current user info

### Games (`/api/games/*`)
- `GET /api/games?filter=all|my-games|spectatable` - List games
- `POST /api/games` - Create new game
  - Body: `{ opponentId: string, timeControl: number }`
- `GET /api/games/[id]` - Get game details
- `PUT /api/games/[id]` - Update game
  - Actions: `move`, `offer-draw`, `accept-draw`, `decline-draw`, `resign`, `close-game`
  - Body: `{ action: string, ...actionData }`

### Friends (`/api/friends`)
- `GET /api/friends?type=friends|requests` - Get friends or pending requests
- `POST /api/friends` - Send friend request
  - Body: `{ receiverId: string }`
- `PUT /api/friends` - Accept/reject request
  - Body: `{ friendshipId: string, action: 'accept'|'reject' }`
- `DELETE /api/friends?friendshipId=xxx` - Remove friend

### Messages (`/api/messages`)
- `GET /api/messages?userId=xxx` - Get messages with user
- `POST /api/messages` - Send message
  - Body: `{ receiverId: string, content: string }`

### Products (`/api/products`)
- `GET /api/products` - List active products
- `POST /api/products` - Create product (admin only)
- `PUT /api/products` - Update product (admin only)
- `DELETE /api/products?id=xxx` - Delete product (admin only)

### Profile (`/api/profile`)
- `GET /api/profile?search=query` - Search users
- `PUT /api/profile` - Update own profile
  - Body: `FormData { displayName?, bio?, profileImage? }`

---

## 🔌 Socket.io Events

### Client → Server
- `authenticate` - Authenticate socket with userId
- `join-game` - Join game room
- `leave-game` - Leave game room
- `move` - Make chess move
- `game-update` - Update game state
- `draw-offer` - Offer draw
- `draw-response` - Accept/decline draw
- `resign` - Resign game
- `chat-message` - Send chat message
- `typing` - Typing indicator
- `friend-request` - Send friend request notification
- `friend-accepted` - Notify friend request accepted
- `game-challenge` - Notify opponent of game challenge
- `challenge-declined` - Notify challenge was declined

### Server → Client
- `move-made` - Opponent made a move
- `game-updated` - Game state updated
- `draw-offered` - Draw offer received
- `draw-responded` - Draw response received
- `player-resigned` - Player resigned
- `time-sync` - Time synchronization
- `new-message` - New chat message
- `message-sent` - Message sent confirmation
- `user-typing` - User is typing
- `new-friend-request` - Friend request received
- `friend-request-accepted` - Friend request was accepted
- `game-challenge` - Game challenge notification
- `move-notification` - It's your turn notification
- `challenge-declined` - Challenge was declined

---

## 🗂️ State Management (Zustand Stores)

### `useAuthStore` (`lib/stores/useAuthStore.ts`)
```typescript
{
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
}
```

### `useSocketStore` (`lib/stores/useSocketStore.ts`)
```typescript
{
  socket: Socket | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}
```

### `useThemeStore` (`lib/stores/useThemeStore.ts`)
```typescript
{
  theme: 'light' | 'dark'
  boardTheme: string
  toggleTheme: () => void
  setBoardTheme: (theme: string) => void
}
```

---

## 🔐 Authentication Flow

1. User registers/logs in via `/api/auth/register` or `/api/auth/login`
2. Server creates session cookie (httpOnly, secure)
3. Client stores user data in `useAuthStore`
4. Protected routes check `requireAuth()` which validates session cookie
5. Socket.io authenticates with `authenticate` event using userId

**Auth Helper Functions:**
- `requireAuth()` - Returns session, throws if not authenticated
- `requireAdmin()` - Returns session, throws if not admin

---

## 🎮 Game Flow

1. **Create Game**: User selects opponent and time control
   - POST `/api/games` creates game with status 'active'
   - Timer starts immediately
   - Socket emits `game-challenge` to opponent

2. **Make Move**: 
   - Client validates move with chess.js
   - PUT `/api/games/[id]` with action 'move'
   - Socket emits `move` event to game room
   - Opponent receives `move-made` event

3. **Game Actions**:
   - Draw: `offer-draw` → `accept-draw` / `decline-draw`
   - Resign: `resign` action
   - Close: `close-game` (creator only)

4. **Time Management**:
   - Server syncs time every 5 seconds via `time-sync` event
   - Client counts down locally, server is source of truth

---

## 💬 Chat Flow

1. Users must be friends to chat
2. GET `/api/messages?userId=xxx` loads message history
3. POST `/api/messages` sends message
4. Socket emits `chat-message` → receiver gets `new-message`
5. Messages are marked as read when conversation is opened

---

## 🛒 Marketplace Flow

1. Admin creates products via POST `/api/products`
2. Users browse products via GET `/api/products`
3. Order creation (to be implemented)
4. WeChat QR code integration (to be implemented)

---

## 🎨 Key Components

### `ChessGame.tsx`
- Main chess game component
- Uses `react-chessboard` for board UI
- Chess.com-style pieces (custom images)
- Real-time move synchronization
- Time countdown
- Draw/resign handling

### `NotificationListener.tsx`
- Listens for socket events
- Shows game challenge popup
- Shows friend request notifications
- Shows move notifications

### `NewGameModal.tsx`
- User search with real-time filtering
- Time control selection
- Friend request button integration
- Creates game and navigates

### `FriendsList.tsx`
- Tabs: Friends / Requests
- Shows friend list
- Integrates `FriendRequests` component

### `ChatInterface.tsx`
- Message display
- Send message form
- Real-time message updates via socket

---

## 🔧 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
NEXTAUTH_SECRET=your-secret-key-here

# App URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com
```

---

## 📦 Key Dependencies

```json
{
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "next": "14.2.18",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "chess.js": "^1.0.0-beta.8",
    "react-chessboard": "^4.7.2",
    "socket.io": "^4.8.1",
    "socket.io-client": "^4.8.1",
    "zustand": "^4.5.5",
    "react-hot-toast": "^2.4.1",
    "bcryptjs": "^2.4.3",
    "tailwindcss": "^3.4.15",
    "next-themes": "^0.4.6"
  }
}
```

---

## 🚀 Deployment

- **Platform**: Railway
- **Database**: PostgreSQL on Railway
- **Custom Server**: `server.js` handles Socket.io WebSocket upgrades
- **Build Command**: `prisma generate && next build`
- **Start Command**: `NODE_ENV=production node server.js`

---

## 📝 Important Notes

1. **Socket.io Setup**: Uses custom Node.js server (`server.js`) because Next.js App Router doesn't support WebSocket upgrades in route handlers

2. **Authentication**: Session-based using httpOnly cookies, not JWT tokens

3. **Real-time Updates**: All game moves, chat messages, and notifications use Socket.io

4. **Time Synchronization**: Client counts down locally, server syncs every 5 seconds

5. **Friend System**: Users must be friends to chat, friend requests are required

6. **Admin Features**: Products can only be created/edited by admins (`isAdmin: true`)

7. **Game Status**: Games can be: `active`, `draw_offered_white`, `draw_offered_black`, `completed`, `resigned`, `cancelled`

8. **Chess Pieces**: Uses Chess.com-style piece images from `images.chesscomfiles.com`

---

## 🎯 Common Patterns

### Creating API Routes
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    // Your code here
    return NextResponse.json({ data })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
```

### Using Zustand Store
```typescript
import { useAuthStore } from '@/lib/stores/useAuthStore'

const { user, isLoading } = useAuthStore()
```

### Using Socket.io
```typescript
import { useSocketStore } from '@/lib/stores/useSocketStore'

const { socket } = useSocketStore()

socket?.emit('event-name', data)
socket?.on('event-name', (data) => { /* handle */ })
```

### Database Queries
```typescript
import { prisma } from '@/lib/prisma'

const users = await prisma.user.findMany({
  where: { isBanned: false },
  include: { /* relations */ }
})
```

---

**This document contains everything needed to understand and extend the application infrastructure.**


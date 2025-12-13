# IMPLEMENTATION GUIDE PART 2 - Components & Pages

## 7. DASHBOARD LAYOUT

### File: `app/dashboard/layout.tsx`
```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useSocket } from '@/lib/hooks/useSocket'
import MobileNav from '@/components/layout/MobileNav'
import Header from '@/components/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  useSocket()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
```

### File: `app/dashboard/page.tsx`
```typescript
'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import GamesList from '@/components/chess/GamesList'
import NewGameModal from '@/components/chess/NewGameModal'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [showNewGame, setShowNewGame] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome, {user?.displayName || user?.username}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Ready to play some chess?
          </p>
        </div>
        <button
          onClick={() => setShowNewGame(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          New Game
        </button>
      </div>

      <GamesList />

      {showNewGame && (
        <NewGameModal onClose={() => setShowNewGame(false)} />
      )}
    </div>
  )
}
```

## 8. HEADER COMPONENT

### File: `components/layout/Header.tsx`
```typescript
'use client'

import { useTheme } from 'next-themes'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function Header() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuthStore()
  const router = useRouter()

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      logout()
      router.push('/login')
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Error logging out')
    }
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ♟️ Riddick Chess
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Profile */}
          <div className="flex items-center space-x-3">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.username}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {user?.username.charAt(0).toUpperCase()}
              </div>
            )}
            {user?.isAdmin && (
              <span className="badge-admin">ADMIN</span>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
```

## 9. MOBILE NAVIGATION

### File: `components/layout/MobileNav.tsx`
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'

export default function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  const navItems = [
    { href: '/dashboard', icon: '🏠', label: 'Home' },
    { href: '/games', icon: '♟️', label: 'Games' },
    { href: '/chat', icon: '💬', label: 'Chat' },
    { href: '/marketplace', icon: '🛒', label: 'Shop' },
    { href: '/profile', icon: '👤', label: 'Profile' },
  ]

  if (user?.isAdmin) {
    navItems.push({ href: '/admin', icon: '⚙️', label: 'Admin' })
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

## 10. CHESS GAME COMPONENT

### File: `components/chess/ChessGame.tsx`
```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useSocketStore } from '@/lib/stores/useSocketStore'
import { useThemeStore } from '@/lib/stores/useThemeStore'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import GameControls from './GameControls'
import GameInfo from './GameInfo'
import toast from 'react-hot-toast'

interface ChessGameProps {
  gameId: string
  initialFen?: string
  initialPgn?: string
  whitePlayer: any
  blackPlayer: any
  timeControl: number
  whiteTimeLeft: number
  blackTimeLeft: number
  status: string
  result?: string
  isSpectator?: boolean
}

export default function ChessGame({
  gameId,
  initialFen,
  initialPgn,
  whitePlayer,
  blackPlayer,
  timeControl,
  whiteTimeLeft: initialWhiteTime,
  blackTimeLeft: initialBlackTime,
  status: initialStatus,
  result: initialResult,
  isSpectator = false,
}: ChessGameProps) {
  const [game] = useState(() => new Chess(initialFen))
  const [fen, setFen] = useState(initialFen || game.fen())
  const [whiteTime, setWhiteTime] = useState(initialWhiteTime)
  const [blackTime, setBlackTime] = useState(initialBlackTime)
  const [status, setStatus] = useState(initialStatus)
  const [result, setResult] = useState(initialResult)
  const { socket } = useSocketStore()
  const { boardTheme } = useThemeStore()
  const { user } = useAuthStore()

  const playerColor = user?.id === whitePlayer.id ? 'w' : 'b'
  const isPlayerTurn = game.turn() === playerColor
  const isGameActive = status === 'active'

  // Join game room
  useEffect(() => {
    if (!socket || !gameId) return

    socket.emit('join-game', gameId)

    return () => {
      socket.emit('leave-game', gameId)
    }
  }, [socket, gameId])

  // Listen for moves
  useEffect(() => {
    if (!socket) return

    const handleMove = (data: any) => {
      if (data.gameId === gameId) {
        game.load(data.fen)
        setFen(data.fen)
        
        // Update times
        setWhiteTime(data.whiteTimeLeft)
        setBlackTime(data.blackTimeLeft)
      }
    }

    const handleGameUpdate = (data: any) => {
      if (data.gameId === gameId) {
        setStatus(data.state.status)
        setResult(data.state.result)
      }
    }

    socket.on('move-made', handleMove)
    socket.on('game-updated', handleGameUpdate)

    return () => {
      socket.off('move-made', handleMove)
      socket.off('game-updated', handleGameUpdate)
    }
  }, [socket, gameId, game])

  // Time countdown
  useEffect(() => {
    if (!isGameActive) return

    const interval = setInterval(() => {
      if (game.turn() === 'w') {
        setWhiteTime((t) => Math.max(0, t - 1))
      } else {
        setBlackTime((t) => Math.max(0, t - 1))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isGameActive, game])

  // Check for timeout
  useEffect(() => {
    if (whiteTime === 0 && isGameActive) {
      handleTimeout('black_wins')
    } else if (blackTime === 0 && isGameActive) {
      handleTimeout('white_wins')
    }
  }, [whiteTime, blackTime, isGameActive])

  const handleTimeout = async (winner: string) => {
    try {
      await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'timeout',
          data: { winner },
        }),
      })

      setStatus('completed')
      setResult(winner)
      toast.error(winner === 'white_wins' ? 'Black ran out of time!' : 'White ran out of time!')
    } catch (error) {
      console.error('Timeout error:', error)
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (!isGameActive || isSpectator || !isPlayerTurn) {
      return false
    }

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      })

      if (move === null) return false

      const newFen = game.fen()
      const newPgn = game.pgn()
      
      setFen(newFen)

      // Emit move to server
      if (socket) {
        socket.emit('move', {
          gameId,
          move,
          fen: newFen,
          pgn: newPgn,
        })
      }

      // Update game state
      updateGameState(newFen, newPgn)

      // Check for game over
      if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? 'black_wins' : 'white_wins'
        handleGameOver(winner)
      } else if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
        handleGameOver('draw')
      }

      return true
    } catch (error) {
      return false
    }
  }

  async function updateGameState(fen: string, pgn: string) {
    try {
      await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          data: {
            fen,
            pgn,
            whiteTimeLeft: whiteTime,
            blackTimeLeft: blackTime,
          },
        }),
      })
    } catch (error) {
      console.error('Update game error:', error)
    }
  }

  async function handleGameOver(result: string) {
    try {
      await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkmate',
          data: { winner: result },
        }),
      })

      setStatus('completed')
      setResult(result)

      if (result === 'draw') {
        toast.success('Game ended in a draw!')
      } else {
        const winner = result === 'white_wins' ? whitePlayer : blackPlayer
        toast.success(`${winner.displayName || winner.username} wins!`)
      }
    } catch (error) {
      console.error('Game over error:', error)
    }
  }

  return (
    <div className="space-y-4">
      <GameInfo
        whitePlayer={whitePlayer}
        blackPlayer={blackPlayer}
        whiteTime={whiteTime}
        blackTime={blackTime}
        currentTurn={game.turn()}
        status={status}
        result={result}
      />

      <div className={`board-${boardTheme} mx-auto max-w-lg`}>
        <Chessboard
          position={fen}
          onPieceDrop={onDrop}
          boardOrientation={playerColor === 'w' ? 'white' : 'black'}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        />
      </div>

      {!isSpectator && isGameActive && (
        <GameControls gameId={gameId} status={status} />
      )}

      {status === 'completed' && (
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            Game Over
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {result === 'draw' ? 'Draw' : result === 'white_wins' ? 'White Wins' : 'Black Wins'}
          </p>
        </div>
      )}
    </div>
  )
}
```

## 11. GAME CONTROLS

### File: `components/chess/GameControls.tsx`
```typescript
'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface GameControlsProps {
  gameId: string
  status: string
}

export default function GameControls({ gameId, status }: GameControlsProps) {
  const [isOffering Draw, setIsOfferingDraw] = useState(false)

  async function handleResign() {
    if (!confirm('Are you sure you want to resign?')) return

    try {
      await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resign' }),
      })
      toast.success('You resigned')
    } catch (error) {
      toast.error('Error resigning')
    }
  }

  async function handleOfferDraw() {
    setIsOfferingDraw(true)
    try {
      await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'offer-draw' }),
      })
      toast.success('Draw offer sent')
    } catch (error) {
      toast.error('Error offering draw')
    } finally {
      setIsOfferingDraw(false)
    }
  }

  async function handleDrawResponse(accept: boolean) {
    try {
      await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: accept ? 'accept-draw' : 'decline-draw',
        }),
      })
      toast.success(accept ? 'Draw accepted' : 'Draw declined')
    } catch (error) {
      toast.error('Error responding to draw offer')
    }
  }

  const isDrawOffered = status.includes('draw_offered')

  return (
    <div className="flex gap-4 justify-center">
      {isDrawOffered ? (
        <>
          <button
            onClick={() => handleDrawResponse(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Accept Draw
          </button>
          <button
            onClick={() => handleDrawResponse(false)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Decline Draw
          </button>
        </>
      ) : (
        <>
          <button
            onClick={handleOfferDraw}
            disabled={isOfferingDraw}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            Offer Draw
          </button>
          <button
            onClick={handleResign}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Resign
          </button>
        </>
      )}
    </div>
  )
}
```

## 12. GAME INFO COMPONENT

### File: `components/chess/GameInfo.tsx`
```typescript
'use client'

interface GameInfoProps {
  whitePlayer: any
  blackPlayer: any
  whiteTime: number
  blackTime: number
  currentTurn: 'w' | 'b'
  status: string
  result?: string
}

export default function GameInfo({
  whitePlayer,
  blackPlayer,
  whiteTime,
  blackTime,
  currentTurn,
  status,
  result,
}: GameInfoProps) {
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* White Player */}
      <div className={`p-4 rounded-lg ${
        currentTurn === 'w' && status === 'active'
          ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-600'
          : 'bg-gray-100 dark:bg-gray-800'
      }`}>
        <div className="flex items-center space-x-3">
          {whitePlayer.profileImage ? (
            <img
              src={whitePlayer.profileImage}
              alt={whitePlayer.username}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center font-bold">
              {whitePlayer.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {whitePlayer.displayName || whitePlayer.username}
            </p>
            <p className="text-lg font-mono text-gray-700 dark:text-gray-300">
              {formatTime(whiteTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Black Player */}
      <div className={`p-4 rounded-lg ${
        currentTurn === 'b' && status === 'active'
          ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-600'
          : 'bg-gray-100 dark:bg-gray-800'
      }`}>
        <div className="flex items-center space-x-3">
          {blackPlayer.profileImage ? (
            <img
              src={blackPlayer.profileImage}
              alt={blackPlayer.username}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold">
              {blackPlayer.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {blackPlayer.displayName || blackPlayer.username}
            </p>
            <p className="text-lg font-mono text-gray-700 dark:text-gray-300">
              {formatTime(blackTime)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

## DEPLOYMENT CHECKLIST

1. **Environment Variables on Render:**
   - `DATABASE_URL` (use Internal Database URL from PostgreSQL service)
   - `NEXTAUTH_SECRET` (generate: `openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL=https://riddickchess.fun`
   - `NEXT_PUBLIC_SOCKET_URL=https://riddickchess.fun`

2. **Database Setup:**
   ```bash
   npx prisma db push
   ```

3. **Create Admin User:**
   - Login with any account
   - Use Prisma Studio to set `isAdmin = true`
   - Or run seed script

4. **Test Features:**
   - [ ] User registration/login
   - [ ] Create game
   - [ ] Make moves
   - [ ] Chat with friends
   - [ ] Add products (admin)
   - [ ] Create tournament (admin)
   - [ ] Dark mode toggle
   - [ ] Mobile navigation

5. **Custom Domain:**
   - Add CNAME or A record in domain DNS (as provided by Render)
   - Point to Render URL
   - Update environment variables

## REMAINING FILES TO CREATE

Create these additional files in Cursor:
- `components/chess/GamesList.tsx` - List of active/completed games
- `components/chess/NewGameModal.tsx` - Modal to create new game
- `components/chat/ChatInterface.tsx` - Main chat UI
- `components/chat/FriendsList.tsx` - Friends list
- `components/marketplace/ProductGrid.tsx` - Product listings
- `components/marketplace/ProductForm.tsx` - Admin product form
- `components/admin/AdminDashboard.tsx` - Admin panel
- `app/game/[id]/page.tsx` - Game page
- `app/chat/page.tsx` - Chat page
- `app/marketplace/page.tsx` - Marketplace page
- `app/admin/page.tsx` - Admin page
- `app/profile/page.tsx` - Profile page
- `public/manifest.json` - PWA manifest

Would you like me to create these remaining files?

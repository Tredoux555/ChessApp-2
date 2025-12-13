# COMPLETE IMPLEMENTATION GUIDE

This document contains all the remaining code you need to copy into Cursor. Follow in order.

## 1. ADMIN API ROUTES

### File: `app/api/admin/users/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        profileImage: true,
        isAdmin: true,
        isBanned: true,
        isSuspended: true,
        suspendedUntil: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ users })
  } catch (error: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const { userId, action, suspendedUntil } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    let updateData: any = {}

    switch (action) {
      case 'ban':
        updateData = { isBanned: true }
        break
      case 'unban':
        updateData = { isBanned: false }
        break
      case 'suspend':
        if (!suspendedUntil) {
          return NextResponse.json({ error: 'Suspend date required' }, { status: 400 })
        }
        updateData = { isSuspended: true, suspendedUntil: new Date(suspendedUntil) }
        break
      case 'unsuspend':
        updateData = { isSuspended: false, suspendedUntil: null }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

### File: `app/api/admin/messages/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    const flaggedMessages = await prisma.message.findMany({
      where: {
        isFlagged: true,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    return NextResponse.json({ messages: flaggedMessages })
  } catch (error: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('id')

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    await prisma.message.delete({
      where: { id: messageId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

## 2. TOURNAMENT API ROUTES

### File: `app/api/tournaments/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const tournaments = await prisma.tournament.findMany({
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profileImage: true,
              },
            },
          },
        },
        matches: {
          include: {
            player1: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
            games: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ tournaments })
  } catch (error: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { name, description, maxPlayers, startDate } = await request.json()

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        maxPlayers: parseInt(maxPlayers) || 8,
        startDate: startDate ? new Date(startDate) : null,
      },
    })

    return NextResponse.json({ tournament })
  } catch (error: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

### File: `app/api/tournaments/[id]/join/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const tournamentId = params.id

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: true,
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.participants.length >= tournament.maxPlayers) {
      return NextResponse.json({ error: 'Tournament is full' }, { status: 400 })
    }

    if (tournament.status !== 'upcoming') {
      return NextResponse.json({ error: 'Tournament already started' }, { status: 400 })
    }

    const participant = await prisma.tournamentParticipant.create({
      data: {
        tournamentId: tournamentId,
        userId: session.id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    })

    return NextResponse.json({ participant })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Already joined' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error joining tournament' }, { status: 500 })
  }
}
```

## 3. ZUSTAND STORES

### File: `lib/stores/useAuthStore.ts`
```typescript
import { create } from 'zustand'

interface User {
  id: string
  username: string
  displayName: string | null
  profileImage: string | null
  isAdmin: boolean
}

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ user: null }),
}))
```

### File: `lib/stores/useThemeStore.ts`
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type BoardTheme = 'default' | 'blue' | 'green' | 'brown' | 'grey'

interface ThemeState {
  boardTheme: BoardTheme
  setBoardTheme: (theme: BoardTheme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      boardTheme: 'default',
      setBoardTheme: (theme) => set({ boardTheme: theme }),
    }),
    {
      name: 'theme-storage',
    }
  )
)
```

### File: `lib/stores/useSocketStore.ts`
```typescript
import { create } from 'zustand'
import { Socket } from 'socket.io-client'

interface SocketState {
  socket: Socket | null
  isConnected: boolean
  setSocket: (socket: Socket | null) => void
  setConnected: (connected: boolean) => void
}

export const useSocketStore = create<SocketState>((set) => ({
  socket: null,
  isConnected: false,
  setSocket: (socket) => set({ socket }),
  setConnected: (connected) => set({ isConnected: connected }),
}))
```

## 4. SOCKET.IO CLIENT HOOK

### File: `lib/hooks/useSocket.ts`
```typescript
'use client'

import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSocketStore } from '../stores/useSocketStore'
import { useAuthStore } from '../stores/useAuthStore'

export function useSocket() {
  const { socket, setSocket, setConnected } = useSocketStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'
    const socketInstance: Socket = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    })

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id)
      setConnected(true)
      socketInstance.emit('authenticate', user.id)
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
      setConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
      setSocket(null)
      setConnected(false)
    }
  }, [user, setSocket, setConnected])

  return socket
}
```

## 5. MAIN PAGE

### File: `app/page.tsx`
```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useSocket } from '@/lib/hooks/useSocket'

export default function Home() {
  const router = useRouter()
  const { user, isLoading, setUser, setLoading } = useAuthStore()
  useSocket()

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        
        if (data.user) {
          setUser(data.user)
          router.push('/dashboard')
        } else {
          setUser(null)
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setUser(null)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [setUser, setLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return null
}
```

## 6. AUTHENTICATION PAGES

### File: `app/login/page.tsx`
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { setUser } = useAuthStore()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Login failed')
        setIsLoading(false)
        return
      }

      setUser(data.user)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      toast.error('An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          ♟️ Riddick Chess
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Sign in to play
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign Up
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            Contact admin to recover account
          </Link>
        </div>
      </div>
    </div>
  )
}
```

### File: `app/register/page.tsx`
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { setUser } = useAuthStore()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (username.length < 3 || username.length > 10) {
      toast.error('Username must be 3-10 characters')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
        setIsLoading(false)
        return
      }

      setUser(data.user)
      toast.success('Account created!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          Join Riddick Chess
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Create your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username (3-10 characters)
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={10}
              pattern="[a-zA-Z0-9_]+"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Choose a username"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Letters, numbers, and underscores only
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

## NEXT STEPS

Continue with Part 2 of this guide for:
- Dashboard page with navigation
- Chess game component
- Chat interface
- Marketplace
- Admin panel
- Mobile navigation

Would you like me to continue with Part 2?

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useSocket } from '@/lib/hooks/useSocket'
import ChessGame from '@/components/chess/ChessGame'
import toast from 'react-hot-toast'

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const { user, setUser, isLoading: authLoading } = useAuthStore()
  const [game, setGame] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Initialize socket connection for this page
  useSocket()

  // Load user if not already loaded
  useEffect(() => {
    const loadUser = async () => {
      if (!user) {
        try {
          const res = await fetch('/api/auth/me')
          const data = await res.json()
          if (res.ok && data.user) {
            setUser(data.user)
          } else {
            router.push('/login')
            return
          }
        } catch (error) {
          console.error('Error loading user:', error)
          router.push('/login')
          return
        }
      }
    }
    loadUser()
  }, [user, setUser, router])

  // Fetch game once we have a gameId
  useEffect(() => {
    const gameId = params?.id as string
    if (!gameId) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    const fetchGame = async () => {
      try {
        console.log('Fetching game:', gameId)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const res = await fetch(`/api/games/${gameId}`, {
          signal: controller.signal,
          credentials: 'include', // Include cookies for auth
        })
        
        clearTimeout(timeoutId)
        
        if (cancelled) return
        
        // Check if response is JSON
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text()
          console.error('Non-JSON response:', text.substring(0, 200))
          toast.error('Server error: Invalid response format')
          setIsLoading(false)
          setTimeout(() => router.push('/dashboard'), 1000)
          return
        }
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Failed to parse response' }))
          console.error('Game fetch failed:', res.status, data)
          if (res.status === 401) {
            toast.error('Please log in to view this game')
            router.push('/login')
          } else {
            toast.error(data.error || 'Game not found')
            setTimeout(() => router.push('/dashboard'), 1000)
          }
          setIsLoading(false)
          return
        }

        const data = await res.json()
        
        if (cancelled) return

        console.log('Game fetched successfully:', data.game)
        if (cancelled) return // Double check before state update
        
        if (data.game) {
          if (!cancelled) setGame(data.game)
        } else {
          if (!cancelled) {
            toast.error('Game data is missing')
            setTimeout(() => router.push('/dashboard'), 1000)
          }
        }
        if (!cancelled) setIsLoading(false)
      } catch (error: any) {
        if (cancelled) return
        console.error('Error fetching game:', error)
        if (error.name === 'AbortError') {
          toast.error('Request timed out. Please try again.')
        } else {
          toast.error('Error loading game')
        }
        setIsLoading(false)
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    }

    // Small delay to ensure component is mounted
    const timer = setTimeout(() => {
      fetchGame()
    }, 100)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [params?.id, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading game...</p>
          <p className="mt-2 text-sm text-gray-500">Fetching game data and initializing board</p>
          <p className="mt-1 text-xs text-gray-400">Game ID: {params?.id}</p>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Game not found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const isSpectator = user?.id !== game.whitePlayerId && user?.id !== game.blackPlayerId

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-blue-600 hover:text-blue-700 font-semibold mb-4"
        >
          ← Back to Dashboard
        </button>
      </div>

      <ChessGame
        gameId={game.id}
        initialFen={game.fen || undefined}
        initialPgn={game.pgn || undefined}
        whitePlayer={game.whitePlayer}
        blackPlayer={game.blackPlayer}
        timeControl={game.timeControl}
        whiteTimeLeft={game.whiteTimeLeft || game.timeControl}
        blackTimeLeft={game.blackTimeLeft || game.timeControl}
        status={game.status}
        result={game.result || undefined}
      />
    </div>
  )
}


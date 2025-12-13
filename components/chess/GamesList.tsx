'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'

export default function GamesList() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [games, setGames] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await fetch('/api/games')
        const data = await res.json()
        if (res.ok) {
          setGames(data.games || [])
        }
      } catch (error) {
        console.error('Error fetching games:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchGames()
      // Refresh every 5 seconds
      const interval = setInterval(fetchGames, 5000)
      return () => clearInterval(interval)
    }
  }, [user])

  function getOpponent(game: any) {
    if (!user) return null
    return game.whitePlayerId === user.id ? game.blackPlayer : game.whitePlayer
  }

  function getPlayerColor(game: any) {
    if (!user) return null
    return game.whitePlayerId === user.id ? 'White' : 'Black'
  }

  function getStatusBadge(status: string) {
    const badges: Record<string, { text: string; color: string }> = {
      active: { text: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      completed: { text: 'Completed', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
      draw_offered_white: { text: 'Draw Offered', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      draw_offered_black: { text: 'Draw Offered', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      resigned: { text: 'Resigned', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    }
    const badge = badges[status] || badges.completed
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading games...</p>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400 text-center">
          No games yet. Create a new game to start playing!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {games.map((game) => {
        const opponent = getOpponent(game)
        const playerColor = getPlayerColor(game)
        const isMyTurn = game.status === 'active' && (
          (game.whitePlayerId === user?.id && game.fen?.includes(' w ')) ||
          (game.blackPlayerId === user?.id && game.fen?.includes(' b '))
        )

        return (
          <div
            key={game.id}
            onClick={() => router.push(`/game/${game.id}`)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {opponent?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      vs {opponent?.displayName || opponent?.username || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      You are {playerColor} • {Math.floor(game.timeControl / 60)} min
                    </p>
                  </div>
                </div>
                {isMyTurn && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                    Your turn!
                  </p>
                )}
              </div>
              <div className="text-right">
                {getStatusBadge(game.status)}
                {game.result && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {game.result === 'draw' ? 'Draw' : game.result === 'white_wins' ? 'White Wins' : 'Black Wins'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}






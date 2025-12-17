// app/dashboard/game-history/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

interface Game {
  id: string
  opponent: {
    id: string
    username: string
    displayName: string | null
    profileImage: string | null
  }
  playerColor: 'white' | 'black'
  result: 'win' | 'loss' | 'draw' | 'cancelled'
  gameResult: string | null
  status: string
  timeControl: number
  createdAt: string
  completedAt: string | null
}

export default function GameHistoryPage() {
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalGames, setTotalGames] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [resultFilter, setResultFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const { user } = useAuthStore()
  const gamesPerPage = 20

  const loadGames = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        limit: gamesPerPage.toString(),
        offset: (currentPage * gamesPerPage).toString(),
        sortBy: 'date',
        order: 'desc'
      })

      if (statusFilter) params.append('status', statusFilter)
      if (resultFilter) params.append('result', resultFilter)
      if (searchQuery) params.append('opponentName', searchQuery)

      const response = await fetch(`/api/games/history?${params}`)
      if (response.ok) {
        const data = await response.json()
        setGames(data.games)
        setTotalGames(data.pagination.total)
      } else {
        toast.error('Failed to load game history')
      }
    } catch (error) {
      console.error('Failed to load games:', error)
      toast.error('Failed to load game history')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadGames()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, resultFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(0)
    loadGames()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTimeControl = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min`
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'win':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'loss':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'draw':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const totalPages = Math.ceil(totalGames / gamesPerPage)

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-8 text-center text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Game History
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View all your completed games
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="md:col-span-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by opponent name..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(0)
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="resigned">Resigned</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Result Filter */}
          <select
            value={resultFilter}
            onChange={(e) => {
              setResultFilter(e.target.value)
              setCurrentPage(0)
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Results</option>
            <option value="white_wins">White Wins</option>
            <option value="black_wins">Black Wins</option>
            <option value="draw">Draw</option>
          </select>
        </div>
      </div>

      {/* Games Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : games.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No games found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Opponent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Time Control
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {games.map((game) => (
                    <tr key={game.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {game.opponent.profileImage ? (
                            <img
                              src={game.opponent.profileImage}
                              alt={game.opponent.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white text-sm font-semibold">
                              {game.opponent.username[0].toUpperCase()}
                            </div>
                          )}
                          <a
                            href={`/profile?userId=${game.opponent.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {game.opponent.displayName || game.opponent.username}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="capitalize">{game.playerColor}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getResultBadge(game.result)}`}>
                          {game.result.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                        {formatTimeControl(game.timeControl)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(game.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`/game/${game.id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {currentPage * gamesPerPage + 1} to{' '}
                  {Math.min((currentPage + 1) * gamesPerPage, totalGames)} of{' '}
                  {totalGames} games
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


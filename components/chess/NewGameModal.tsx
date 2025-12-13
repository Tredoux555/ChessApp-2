'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useSocketStore } from '@/lib/stores/useSocketStore'
import toast from 'react-hot-toast'

interface NewGameModalProps {
  onClose: () => void
}

export default function NewGameModal({ onClose }: NewGameModalProps) {
  const { user } = useAuthStore()
  const { socket } = useSocketStore()
  const router = useRouter()
  const [friends, setFriends] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null)
  const [timeControl, setTimeControl] = useState('10') // minutes
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    async function fetchFriends() {
      try {
        const res = await fetch('/api/friends')
        const data = await res.json()
        if (res.ok) {
          setFriends(data.friends || [])
        }
      } catch (error) {
        console.error('Error fetching friends:', error)
      }
    }

    if (user) {
      fetchFriends()
    }
  }, [user])

  async function searchUsers() {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/profile?search=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (res.ok) {
        setSearchResults(data.users || [])
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers()
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  async function handleCreateGame() {
    if (!selectedOpponent) {
      toast.error('Please select an opponent')
      return
    }

    const timeMinutes = parseInt(timeControl)
    if (isNaN(timeMinutes) || timeMinutes < 1 || timeMinutes > 999) {
      toast.error('Time control must be between 1 and 999 minutes')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponentId: selectedOpponent.id || selectedOpponent.user?.id,
          timeControl: timeMinutes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create game')
        setIsLoading(false)
        return
      }

      // Emit challenge notification via socket
      if (socket) {
        const opponentId = selectedOpponent.id || selectedOpponent.user?.id
        socket.emit('game-challenge', {
          gameId: data.game.id,
          opponentId,
          challenger: {
            id: user?.id,
            username: user?.username,
            displayName: user?.displayName,
          },
          timeControl: timeMinutes,
        })
      }

      toast.success('Game created!')
      router.push(`/game/${data.game.id}`)
      onClose()
    } catch (error) {
      console.error('Create game error:', error)
      toast.error('An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              New Game
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Time Control */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Control (minutes per player)
            </label>
            <input
              type="number"
              min="1"
              max="999"
              value={timeControl}
              onChange={(e) => setTimeControl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="10"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Each player gets this many minutes (1-999)
            </p>
          </div>

          {/* Opponent Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Opponent
            </label>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for users..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                {searchResults.map((result) => {
                  const resultUser = result.user || result
                  return (
                    <button
                      key={resultUser.id}
                      onClick={() => setSelectedOpponent(resultUser)}
                      className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                        selectedOpponent?.id === resultUser.id
                          ? 'bg-blue-50 dark:bg-blue-900'
                          : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                          {resultUser.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {resultUser.displayName || resultUser.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{resultUser.username}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Friends List */}
            {friends.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Your Friends:
                </p>
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {friends.map((friend) => {
                    const friendUser = friend.user || friend
                    return (
                      <button
                        key={friendUser.id}
                        onClick={() => setSelectedOpponent(friendUser)}
                        className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                          selectedOpponent?.id === friendUser.id
                            ? 'bg-blue-50 dark:bg-blue-900'
                            : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                            {friendUser.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {friendUser.displayName || friendUser.username}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              @{friendUser.username}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {friends.length === 0 && searchResults.length === 0 && !searchQuery && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No friends yet. Search for users to challenge them!
              </p>
            )}
          </div>

          {/* Selected Opponent Display */}
          {selectedOpponent && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Selected Opponent:
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {selectedOpponent.displayName || selectedOpponent.username}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGame}
              disabled={!selectedOpponent || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}






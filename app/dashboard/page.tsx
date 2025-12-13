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


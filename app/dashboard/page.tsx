'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import NewGameModal from '@/components/chess/NewGameModal'

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
      <h2 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">Something went wrong</h2>
      <p className="text-red-700 dark:text-red-300 mb-4">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
      >
        Try again
      </button>
    </div>
  )
}

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

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/game-history"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📜</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Game History</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">View past games</p>
            </div>
          </div>
        </Link>
        <Link
          href="/settings/board"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🎨</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Board Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customize themes</p>
            </div>
          </div>
        </Link>
        <Link
          href="/profile"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <span className="text-3xl">👤</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Profile</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Edit your profile</p>
            </div>
          </div>
        </Link>
      </div>

      {showNewGame && (
        <NewGameModal onClose={() => setShowNewGame(false)} />
      )}
    </div>
  )
}


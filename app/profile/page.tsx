'use client'

import { useAuthStore } from '@/lib/stores/useAuthStore'

export default function ProfilePage() {
  const { user } = useAuthStore()

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Profile
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.displayName || user?.username}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              @{user?.username}
            </p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Profile editing coming soon!
        </p>
      </div>
    </div>
  )
}

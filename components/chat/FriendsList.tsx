'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import FriendRequests from '@/components/friends/FriendRequests'

interface FriendsListProps {
  onSelectFriend: (id: string, name: string) => void
}

export default function FriendsList({ onSelectFriend }: FriendsListProps) {
  const { user } = useAuthStore()
  const [friends, setFriends] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends')

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
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchFriends()
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <p className="text-gray-600 dark:text-gray-400">Loading friends...</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
            activeTab === 'friends'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
            activeTab === 'requests'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Requests
        </button>
      </div>

      {/* Content */}
      {activeTab === 'friends' ? (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {friends.length === 0 ? (
            <div className="p-4 text-center text-gray-600 dark:text-gray-400">
              <p>No friends yet</p>
              <p className="text-sm mt-2">Add friends to start chatting</p>
            </div>
          ) : (
            friends.map((friend) => {
              const friendUser = friend.user || friend
              return (
                <button
                  key={friend.id || friendUser.id}
                  onClick={() => onSelectFriend(friendUser.id, friendUser.displayName || friendUser.username)}
                  className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition"
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
            })
          )}
        </div>
      ) : (
        <FriendRequests />
      )}
    </div>
  )
}






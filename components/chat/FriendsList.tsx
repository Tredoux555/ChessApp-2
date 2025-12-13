'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/useAuthStore'

interface FriendsListProps {
  onSelectFriend: (id: string, name: string) => void
}

export default function FriendsList({ onSelectFriend }: FriendsListProps) {
  const { user } = useAuthStore()
  const [friends, setFriends] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Friends
        </h2>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {friends.length === 0 ? (
          <div className="p-4 text-center text-gray-600 dark:text-gray-400">
            <p>No friends yet</p>
            <p className="text-sm mt-2">Add friends to start chatting</p>
          </div>
        ) : (
          friends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => onSelectFriend(friend.id, friend.username)}
              className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {friend.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {friend.displayName || friend.username}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {friend.username}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}






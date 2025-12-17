// components/friends/FriendsListOnline.tsx
'use client'

import { useEffect } from 'react'
import { useFriendsStore } from '@/lib/stores/useFriendsStore'
import { useSocketStore } from '@/lib/stores/useSocketStore'

export default function FriendsListOnline() {
  const { friends, loadFriends, updateFriendOnlineStatus } = useFriendsStore()
  const { socket } = useSocketStore()

  useEffect(() => {
    loadFriends()
  }, [loadFriends])

  // Listen for online status updates
  useEffect(() => {
    if (!socket) return

    socket.on('user-online', (data: { userId: string }) => {
      updateFriendOnlineStatus(data.userId, true)
    })

    socket.on('user-offline', (data: { userId: string }) => {
      updateFriendOnlineStatus(data.userId, false)
    })

    return () => {
      socket.off('user-online')
      socket.off('user-offline')
    }
  }, [socket, updateFriendOnlineStatus])

  const formatLastSeen = (lastSeenAt: Date | null) => {
    if (!lastSeenAt) return 'Never'
    
    const now = new Date()
    const lastSeen = new Date(lastSeenAt)
    const diffMs = now.getTime() - lastSeen.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  if (friends.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No friends yet</p>
      </div>
    )
  }

  const onlineFriends = friends.filter(f => f.isOnline)
  const offlineFriends = friends.filter(f => !f.isOnline)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Friends ({friends.length})
      </h3>

      {/* Online Friends */}
      {onlineFriends.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Online ({onlineFriends.length})
          </h4>
          <div className="space-y-2">
            {onlineFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <div className="relative">
                  {friend.profileImage ? (
                    <img
                      src={friend.profileImage}
                      alt={friend.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-semibold">
                      {friend.username[0].toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                </div>
                
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {friend.displayName || friend.username}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Online
                  </p>
                </div>

                <button
                  onClick={() => window.location.href = `/chat?userId=${friend.id}`}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Chat
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline Friends */}
      {offlineFriends.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            Offline ({offlineFriends.length})
          </h4>
          <div className="space-y-2">
            {offlineFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition opacity-60"
              >
                <div className="relative">
                  {friend.profileImage ? (
                    <img
                      src={friend.profileImage}
                      alt={friend.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-semibold">
                      {friend.username[0].toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800 rounded-full"></span>
                </div>
                
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {friend.displayName || friend.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatLastSeen(friend.lastSeenAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}



'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useSocketStore } from '@/lib/stores/useSocketStore'
import toast from 'react-hot-toast'

export default function FriendRequests() {
  const { user } = useAuthStore()
  const { socket } = useSocketStore()
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch('/api/friends?type=requests')
        const data = await res.json()
        if (res.ok) {
          setRequests(data.requests || [])
        }
      } catch (error) {
        console.error('Error fetching friend requests:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchRequests()
    }
  }, [user])

  // Listen for new friend requests via socket
  useEffect(() => {
    if (!socket) return

    const handleNewRequest = (data: any) => {
      setRequests((prev) => [data, ...prev])
      toast.success(`New friend request from ${data.sender?.displayName || data.sender?.username}`)
    }

    socket.on('new-friend-request', handleNewRequest)

    return () => {
      socket.off('new-friend-request', handleNewRequest)
    }
  }, [socket])

  async function handleAccept(friendshipId: string) {
    try {
      const res = await fetch('/api/friends', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friendshipId,
          action: 'accept',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setRequests((prev) => prev.filter((r) => r.id !== friendshipId))
        toast.success('Friend request accepted!')
        
        // Emit socket event
        if (socket && data.friendship) {
          socket.emit('friend-accepted', {
            userId: data.friendship.senderId,
            friend: data.friendship.sender,
          })
        }
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to accept request')
      }
    } catch (error) {
      console.error('Error accepting friend request:', error)
      toast.error('An error occurred')
    }
  }

  async function handleReject(friendshipId: string) {
    try {
      const res = await fetch('/api/friends', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friendshipId,
          action: 'reject',
        }),
      })

      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== friendshipId))
        toast.success('Friend request rejected')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to reject request')
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      toast.error('An error occurred')
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <p className="text-gray-600 dark:text-gray-400">Loading friend requests...</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Friend Requests ({requests.length})
        </h2>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {requests.length === 0 ? (
          <div className="p-4 text-center text-gray-600 dark:text-gray-400">
            <p>No pending friend requests</p>
          </div>
        ) : (
          requests.map((request) => {
            const sender = request.sender || request.user
            return (
              <div
                key={request.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      {sender.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {sender.displayName || sender.username}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{sender.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(request.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useSocketStore } from '@/lib/stores/useSocketStore'
import toast from 'react-hot-toast'

interface SendFriendRequestProps {
  userId: string
  username: string
  displayName?: string
  className?: string
}

export default function SendFriendRequest({ 
  userId, 
  username, 
  displayName,
  className = '' 
}: SendFriendRequestProps) {
  const { user } = useAuthStore()
  const { socket } = useSocketStore()
  const [status, setStatus] = useState<'none' | 'pending' | 'accepted' | 'loading'>('loading')
  const [friendshipId, setFriendshipId] = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.id === userId) {
      setStatus('none')
      return
    }

    async function checkFriendship() {
      try {
        // Check if already friends or request exists
        const res = await fetch('/api/friends')
        const data = await res.json()
        
        if (res.ok && data.friends) {
          // Check if already friends
          const isFriend = data.friends.some((f: any) => {
            const friend = f.user || f
            return friend.id === userId
          })
          
          if (isFriend) {
            setStatus('accepted')
            return
          }
        }

        // Check for pending requests
        const requestsRes = await fetch('/api/friends?type=requests')
        const requestsData = await requestsRes.json()
        
        if (requestsRes.ok && requestsData.requests) {
          const pendingRequest = requestsData.requests.find((r: any) => {
            const sender = r.sender || r.user
            return sender.id === userId
          })
          
          if (pendingRequest) {
            setStatus('pending')
            setFriendshipId(pendingRequest.id)
            return
          }
        }

        setStatus('none')
      } catch (error) {
        console.error('Error checking friendship:', error)
        setStatus('none')
      }
    }

    checkFriendship()
  }, [user, userId])

  async function handleSendRequest() {
    if (!user || user.id === userId) return

    setStatus('loading')
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('pending')
        setFriendshipId(data.friendship?.id || null)
        toast.success(`Friend request sent to ${displayName || username}`)
        
        // Emit socket event
        if (socket) {
          socket.emit('friend-request', {
            receiverId: userId,
            sender: {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
            },
          })
        }
      } else {
        setStatus('none')
        toast.error(data.error || 'Failed to send friend request')
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      setStatus('none')
      toast.error('An error occurred')
    }
  }

  if (!user || user.id === userId) {
    return null
  }

  if (status === 'loading') {
    return (
      <button
        disabled
        className={`px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50 ${className}`}
      >
        Loading...
      </button>
    )
  }

  if (status === 'accepted') {
    return (
      <span className={`px-4 py-2 rounded-lg font-semibold text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 ${className}`}>
        ✓ Friends
      </span>
    )
  }

  if (status === 'pending') {
    return (
      <span className={`px-4 py-2 rounded-lg font-semibold text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 ${className}`}>
        Request Sent
      </span>
    )
  }

  return (
    <button
      onClick={handleSendRequest}
      className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition ${className}`}
    >
      Add Friend
    </button>
  )
}


'use client'

import { useEffect, useState } from 'react'
import { useSocketStore } from '@/lib/stores/useSocketStore'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface ChallengeData {
  gameId: string
  challenger: { id: string; username: string; displayName?: string }
  timeControl: number
}

export default function NotificationListener() {
  const { socket } = useSocketStore()
  const { user } = useAuthStore()
  const router = useRouter()
  const [activeChallenge, setActiveChallenge] = useState<ChallengeData | null>(null)

  useEffect(() => {
    if (!socket || !user) return

    // Listen for game challenges
    const handleGameChallenge = (data: ChallengeData) => {
      setActiveChallenge(data)
    }

    // Listen for move notifications (when it's your turn)
    const handleMoveNotification = (data: {
      gameId: string
      playerName: string
    }) => {
      toast(`Your turn! ${data.playerName} made a move`, {
        icon: '♟️',
        duration: 3000,
      })
    }

    // Listen for challenge declined notifications
    const handleChallengeDeclined = (data: {
      gameId: string
    }) => {
      toast.error('Your challenge was declined', {
        icon: '❌',
        duration: 3000,
      })
    }

    // Listen for friend request notifications
    const handleFriendRequest = (data: {
      sender: { id: string; username: string; displayName?: string }
    }) => {
      const senderName = data.sender.displayName || data.sender.username
      toast(
        (t) => (
          <div className="flex flex-col">
            <span className="font-semibold">{senderName} sent you a friend request!</span>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id)
                  // Navigate to chat page where they can accept
                  router.push('/chat')
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm font-semibold"
              >
                View
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1 rounded text-sm font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        ),
        {
          duration: 10000,
          icon: '👤',
        }
      )
    }

    socket.on('game-challenge', handleGameChallenge)
    socket.on('move-notification', handleMoveNotification)
    socket.on('challenge-declined', handleChallengeDeclined)
    socket.on('new-friend-request', handleFriendRequest)

    return () => {
      socket.off('game-challenge', handleGameChallenge)
      socket.off('move-notification', handleMoveNotification)
      socket.off('challenge-declined', handleChallengeDeclined)
      socket.off('new-friend-request', handleFriendRequest)
    }
  }, [socket, user, router])

  const handleAccept = async () => {
    if (!activeChallenge) return

    try {
      // First accept the challenge via API
      const res = await fetch(`/api/games/${activeChallenge.gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept-challenge',
        }),
      })

      if (res.ok) {
        // Emit socket event to notify challenger
        if (socket) {
          socket.emit('game-update', {
            gameId: activeChallenge.gameId,
            state: { status: 'active' }
          })
        }
        // Navigate to game
        router.push(`/game/${activeChallenge.gameId}`)
        setActiveChallenge(null)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to accept challenge')
      }
    } catch (error) {
      console.error('Accept challenge error:', error)
      toast.error('An error occurred')
    }
  }

  const handleDecline = async () => {
    if (!activeChallenge || !socket) return

    try {
      const res = await fetch(`/api/games/${activeChallenge.gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decline-challenge',
        }),
      })

      if (res.ok) {
        // Notify the challenger that their challenge was declined
        socket.emit('challenge-declined', {
          gameId: activeChallenge.gameId,
          challengerId: activeChallenge.challenger.id,
        })
        toast.success('Challenge declined')
      } else {
        toast.error('Failed to decline challenge')
      }
    } catch (error) {
      console.error('Decline challenge error:', error)
      toast.error('An error occurred')
    }

    setActiveChallenge(null)
  }

  return (
    <>
      {activeChallenge && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-800 rounded-lg shadow-2xl border-2 border-yellow-400 p-6 max-w-md w-full animate-pulse-once">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">♟️</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Chess Challenge!
              </h2>
              <p className="text-gray-300 text-lg">
                <span className="font-semibold text-yellow-400">
                  {activeChallenge.challenger.displayName || activeChallenge.challenger.username}
                </span>
                {' '}wants to play chess with you
              </p>
              <p className="text-gray-400 mt-2">
                Time Control: {activeChallenge.timeControl} minutes
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Accept
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


'use client'

import { useEffect } from 'react'
import { useSocketStore } from '@/lib/stores/useSocketStore'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function NotificationListener() {
  const { socket } = useSocketStore()
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!socket || !user) return

    // Listen for game challenges
    const handleGameChallenge = (data: {
      gameId: string
      challenger: { id: string; username: string; displayName?: string }
      timeControl: number
    }) => {
      const challengerName = data.challenger.displayName || data.challenger.username
      toast.success(
        (t) => (
          <div className="flex flex-col">
            <span className="font-semibold">{challengerName} challenged you!</span>
            <span className="text-sm text-gray-300 mt-1">
              {data.timeControl} min game
            </span>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id)
                  router.push(`/game/${data.gameId}`)
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm font-semibold"
              >
                Accept
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
          icon: '♟️',
        }
      )
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

    socket.on('game-challenge', handleGameChallenge)
    socket.on('move-notification', handleMoveNotification)

    return () => {
      socket.off('game-challenge', handleGameChallenge)
      socket.off('move-notification', handleMoveNotification)
    }
  }, [socket, user, router])

  return null
}


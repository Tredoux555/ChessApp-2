// components/chess/GameControls.tsx
'use client'

import { useState } from 'react'
import { useSocketStore } from '@/lib/stores/useSocketStore'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import toast from 'react-hot-toast'

interface GameControlsProps {
  gameId: string
  status: string
  isSpectator: boolean
  isMyTurn: boolean
  onGoToDashboard: () => void
}

export default function GameControls({
  gameId,
  status,
  isSpectator,
  isMyTurn,
  onGoToDashboard
}: GameControlsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { socket } = useSocketStore()
  const { user } = useAuthStore()

  const handleOfferDraw = async () => {
    if (isProcessing) return
    
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'offer-draw' })
      })

      if (response.ok) {
        socket?.emit('draw-offer', { gameId, playerId: user?.id })
        toast.success('Draw offer sent')
      } else {
        toast.error('Failed to offer draw')
      }
    } catch (error) {
      console.error('Draw offer error:', error)
      toast.error('Failed to offer draw')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResign = async () => {
    if (isProcessing) return
    if (!confirm('Are you sure you want to resign?')) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resign' })
      })

      if (response.ok) {
        socket?.emit('resign', { gameId, playerId: user?.id })
        toast.success('You have resigned')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1500)
      } else {
        toast.error('Failed to resign')
      }
    } catch (error) {
      console.error('Resign error:', error)
      toast.error('Failed to resign')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isSpectator || status !== 'active') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
        Game Controls
      </h3>

      <button
        onClick={handleOfferDraw}
        disabled={isProcessing || !isMyTurn}
        className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Offer Draw
      </button>

      <button
        onClick={handleResign}
        disabled={isProcessing}
        className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Resign
      </button>

      {/* FEATURE 7: Go to Dashboard button */}
      <button
        onClick={onGoToDashboard}
        className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
      >
        Go to Dashboard
      </button>
    </div>
  )
}

'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useSocketStore } from '@/lib/stores/useSocketStore'

interface GameControlsProps {
  gameId: string
  status: string
  playerColor: 'w' | 'b' | null
  whitePlayerId: string
  currentUserId: string
}

export default function GameControls({ 
  gameId, 
  status, 
  playerColor,
  whitePlayerId,
  currentUserId
}: GameControlsProps) {
  const [isOfferingDraw, setIsOfferingDraw] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const router = useRouter()
  const { socket } = useSocketStore()

  const isGameCreator = currentUserId === whitePlayerId
  const isGameActive = status === 'active' || status.includes('draw_offered')

  async function handleResign() {
    if (!confirm('Are you sure you want to resign?')) return

    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resign' }),
      })
      
      if (res.ok) {
        toast.success('You resigned')
        // Emit game update via socket
        if (socket) {
          socket.emit('game-update', {
            gameId,
            state: { status: 'completed' }
          })
        }
      } else {
        toast.error('Error resigning')
      }
    } catch (error) {
      toast.error('Error resigning')
    }
  }

  async function handleOfferDraw() {
    setIsOfferingDraw(true)
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'offer-draw' }),
      })
      
      if (res.ok) {
        toast.success('Draw offer sent')
        // Emit game update via socket
        if (socket) {
          socket.emit('game-update', {
            gameId,
            state: { status: playerColor === 'w' ? 'draw_offered_white' : 'draw_offered_black' }
          })
        }
      } else {
        toast.error('Error offering draw')
      }
    } catch (error) {
      toast.error('Error offering draw')
    } finally {
      setIsOfferingDraw(false)
    }
  }

  async function handleDrawResponse(accept: boolean) {
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: accept ? 'accept-draw' : 'decline-draw',
        }),
      })
      
      if (res.ok) {
        toast.success(accept ? 'Draw accepted' : 'Draw declined')
        // Emit game update via socket
        if (socket) {
          socket.emit('game-update', {
            gameId,
            state: { status: accept ? 'completed' : 'active' }
          })
        }
      } else {
        toast.error('Error responding to draw offer')
      }
    } catch (error) {
      toast.error('Error responding to draw offer')
    }
  }

  async function handleCloseGame() {
    if (!confirm('Are you sure you want to close this game? This will cancel the game for both players.')) return

    setIsClosing(true)
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close-game' }),
      })
      
      if (res.ok) {
        toast.success('Game closed')
        // Emit game update via socket to notify both players
        if (socket) {
          socket.emit('game-update', {
            gameId,
            state: { status: 'completed', result: 'cancelled' }
          })
        }
        // Redirect to dashboard after a short delay
        setTimeout(() => router.push('/dashboard'), 1500)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error closing game')
      }
    } catch (error) {
      toast.error('Error closing game')
    } finally {
      setIsClosing(false)
    }
  }

  const isDrawOffered = status.includes('draw_offered')
  const drawOfferedByWhite = status === 'draw_offered_white'
  const drawOfferedByBlack = status === 'draw_offered_black'
  
  // Show Accept/Decline only to the player who received the offer
  const canRespondToDraw = isDrawOffered && (
    (drawOfferedByWhite && playerColor === 'b') || 
    (drawOfferedByBlack && playerColor === 'w')
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Main game controls */}
      <div className="flex gap-4 justify-center flex-wrap">
        {canRespondToDraw ? (
          <>
            <button
              onClick={() => handleDrawResponse(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Accept Draw
            </button>
            <button
              onClick={() => handleDrawResponse(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Decline Draw
            </button>
          </>
        ) : !isDrawOffered ? (
          <>
            <button
              onClick={handleOfferDraw}
              disabled={isOfferingDraw}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 transition"
            >
              Offer Draw
            </button>
            <button
              onClick={handleResign}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Resign
            </button>
          </>
        ) : null}
      </div>

      {/* Close game button - only for game creator on active games */}
      {isGameCreator && isGameActive && (
        <div className="flex justify-center">
          <button
            onClick={handleCloseGame}
            disabled={isClosing}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition flex items-center gap-2 text-sm"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
            {isClosing ? 'Closing...' : 'Close Game'}
          </button>
        </div>
      )}
    </div>
  )
}

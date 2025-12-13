'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface GameControlsProps {
  gameId: string
  status: string
  playerColor: 'w' | 'b' | null
}

export default function GameControls({ gameId, status, playerColor }: GameControlsProps) {
  const [isOfferingDraw, setIsOfferingDraw] = useState(false)

  async function handleResign() {
    if (!confirm('Are you sure you want to resign?')) return

    try {
      await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resign' }),
      })
      toast.success('You resigned')
    } catch (error) {
      toast.error('Error resigning')
    }
  }

  async function handleOfferDraw() {
    setIsOfferingDraw(true)
    try {
      await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'offer-draw' }),
      })
      toast.success('Draw offer sent')
    } catch (error) {
      toast.error('Error offering draw')
    } finally {
      setIsOfferingDraw(false)
    }
  }

  async function handleDrawResponse(accept: boolean) {
    try {
      await fetch(`/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: accept ? 'accept-draw' : 'decline-draw',
        }),
      })
      toast.success(accept ? 'Draw accepted' : 'Draw declined')
    } catch (error) {
      toast.error('Error responding to draw offer')
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
    <div className="flex gap-4 justify-center">
      {canRespondToDraw ? (
        <>
          <button
            onClick={() => handleDrawResponse(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Accept Draw
          </button>
          <button
            onClick={() => handleDrawResponse(false)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Decline Draw
          </button>
        </>
      ) : !isDrawOffered ? (
        <>
          <button
            onClick={handleOfferDraw}
            disabled={isOfferingDraw}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            Offer Draw
          </button>
          <button
            onClick={handleResign}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Resign
          </button>
        </>
      ) : null}
    </div>
  )
}


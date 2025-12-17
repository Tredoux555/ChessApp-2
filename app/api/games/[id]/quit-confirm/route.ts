// app/api/games/[id]/quit-confirm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await requireAuth()
    const gameId = params.id

    const game = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Check if user is a player in this game
    if (game.whitePlayerId !== session.id && game.blackPlayerId !== session.id) {
      return NextResponse.json({ error: 'Not a player in this game' }, { status: 403 })
    }

    const isWhite = game.whitePlayerId === session.id
    const winner = isWhite ? 'black_wins' : 'white_wins'

    // Update game as resigned
    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'resigned',
        result: winner,
        completedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      result: winner,
      message: 'Game resigned successfully'
    })
  } catch (error: any) {
    console.error('Quit confirm error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to confirm resignation' },
      { status: 500 }
    )
  }
}



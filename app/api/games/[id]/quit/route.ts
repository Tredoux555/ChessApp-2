// app/api/games/[id]/quit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

// Initiate quit attempt
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await requireAuth()
    const gameId = params.id

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        whitePlayer: { select: { id: true, username: true } },
        blackPlayer: { select: { id: true, username: true } }
      }
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Check if user is a player in this game
    if (game.whitePlayerId !== session.id && game.blackPlayerId !== session.id) {
      return NextResponse.json({ error: 'Not a player in this game' }, { status: 403 })
    }

    // Check if game is active
    if (game.status !== 'active') {
      return NextResponse.json({ error: 'Game is not active' }, { status: 400 })
    }

    const isWhite = game.whitePlayerId === session.id
    const quitTime = new Date()

    // Update game with quit timestamp
    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'active_with_quit_timer',
        ...(isWhite 
          ? { whitePlayerQuitAt: quitTime }
          : { blackPlayerQuitAt: quitTime }
        )
      }
    })

    return NextResponse.json({
      success: true,
      quitTime,
      timeoutSeconds: 30
    })
  } catch (error: any) {
    console.error('Quit attempt error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to process quit attempt' },
      { status: 500 }
    )
  }
}

// Return to game (cancel quit)
export async function DELETE(
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

    // Clear quit timer and resume game
    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'active',
        ...(isWhite 
          ? { whitePlayerQuitAt: null }
          : { blackPlayerQuitAt: null }
        )
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Returned to game successfully'
    })
  } catch (error: any) {
    console.error('Return to game error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to return to game' },
      { status: 500 }
    )
  }
}



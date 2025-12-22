import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET - List active games
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'

    let where: any = {}

    if (filter === 'my-games') {
      where = {
        OR: [
          { whitePlayerId: session.id },
          { blackPlayerId: session.id },
        ],
        status: 'active',
      }
    } else if (filter === 'spectatable') {
      where = {
        status: 'active',
      }
    }

    const games = await prisma.game.findMany({
      where,
      include: {
        whitePlayer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
        blackPlayer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
        spectators: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json({ games })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Get games error:', error)
    }
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// POST - Create new game
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { opponentId, timeControl } = await request.json()

    if (!opponentId) {
      return NextResponse.json(
        { error: 'Opponent ID is required' },
        { status: 400 }
      )
    }

    // Validate time control (expects minutes, converts to seconds)
    const timeMinutes = parseInt(timeControl)
    if (isNaN(timeMinutes) || timeMinutes < 1 || timeMinutes > 999) {
      return NextResponse.json(
        { error: 'Invalid time control. Must be between 1 and 999 minutes' },
        { status: 400 }
      )
    }

    const timeInSeconds = timeMinutes * 60

    // Check if opponent exists and is not banned/suspended
    const opponent = await prisma.user.findUnique({
      where: { id: opponentId },
    })

    if (!opponent || opponent.isBanned || opponent.isSuspended) {
      return NextResponse.json(
        { error: 'Invalid opponent' },
        { status: 400 }
      )
    }

    // Randomly assign colors
    const isWhite = Math.random() < 0.5

    const game = await prisma.game.create({
      data: {
        whitePlayerId: isWhite ? session.id : opponentId,
        blackPlayerId: isWhite ? opponentId : session.id,
        timeControl: timeInSeconds,
        whiteTimeLeft: timeInSeconds,
        blackTimeLeft: timeInSeconds,
        status: 'pending', // Game starts as pending until accepted
        // Don't set lastMoveAt until challenge is accepted
      },
      include: {
        whitePlayer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
        blackPlayer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    })

    // Emit notification to opponent via socket.io
    // Note: Socket.io server is accessed via pages/api/socket.ts
    // The notification will be sent when the client connects

    return NextResponse.json({ game })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Create game error:', error)
    }
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while creating game' },
      { status: 500 }
    )
  }
}

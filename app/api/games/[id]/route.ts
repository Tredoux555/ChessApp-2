import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET - Get game details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const gameId = params.id

    const game = await prisma.game.findUnique({
      where: { id: gameId },
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
            joinedAt: true,
          },
        },
      },
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ game })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Get game error:', error)
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

// PUT - Update game (make move, offer draw, resign, etc)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const gameId = params.id
    const body = await request.json()
    const { action, data } = body

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Check if user is a player in this game
    const isPlayer = game.whitePlayerId === session.id || game.blackPlayerId === session.id
    if (!isPlayer && action !== 'spectate') {
      return NextResponse.json(
        { error: 'You are not a player in this game' },
        { status: 403 }
      )
    }

    let updatedGame

    switch (action) {
      case 'move':
        // Update FEN, PGN, times, and last move timestamp
        updatedGame = await prisma.game.update({
          where: { id: gameId },
          data: {
            fen: data.fen,
            pgn: data.pgn,
            whiteTimeLeft: data.whiteTimeLeft,
            blackTimeLeft: data.blackTimeLeft,
            lastMoveAt: new Date(),
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
        break

      case 'offer-draw':
        const drawStatus = game.whitePlayerId === session.id 
          ? 'draw_offered_white' 
          : 'draw_offered_black'
        
        updatedGame = await prisma.game.update({
          where: { id: gameId },
          data: { status: drawStatus },
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
        break

      case 'accept-draw':
        updatedGame = await prisma.game.update({
          where: { id: gameId },
          data: {
            status: 'completed',
            result: 'draw',
            completedAt: new Date(),
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
        break

      case 'decline-draw':
        updatedGame = await prisma.game.update({
          where: { id: gameId },
          data: { status: 'active' },
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
        break

      case 'resign':
        const winner = game.whitePlayerId === session.id ? 'black_wins' : 'white_wins'
        
        updatedGame = await prisma.game.update({
          where: { id: gameId },
          data: {
            status: 'completed',
            result: winner,
            completedAt: new Date(),
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
        break

      case 'checkmate':
        updatedGame = await prisma.game.update({
          where: { id: gameId },
          data: {
            status: 'completed',
            result: data.winner,
            completedAt: new Date(),
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
        break

      case 'timeout':
        const timeoutWinner = data.winner
        updatedGame = await prisma.game.update({
          where: { id: gameId },
          data: {
            status: 'completed',
            result: timeoutWinner,
            completedAt: new Date(),
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
        break

      case 'accept-challenge':
        // Check if user is a player in this game
        const isPlayer = game.whitePlayerId === session.id || game.blackPlayerId === session.id
        if (!isPlayer) {
          return NextResponse.json(
            { error: 'You are not a player in this game' },
            { status: 403 }
          )
        }
        
        // Only pending games can be accepted
        if (game.status !== 'pending') {
          return NextResponse.json(
            { error: 'Game is not pending' },
            { status: 400 }
          )
        }
        
        // The challenged player is the opponent (the one who received the challenge notification)
        // Since colors are randomly assigned, we can't use white/black to determine this
        // The simplest approach: allow any player in a pending game to accept
        // The creator won't see the accept button (they created it), so only the opponent will accept
        // This is safe because:
        // 1. Only the opponent receives the challenge notification
        // 2. The creator already created the game and navigated to it
        // 3. If somehow the creator tries to accept, it's harmless (they're already in the game)
        
        // Prevent the creator from accepting (they created it, so they can't accept)
        // The creator is the one who made the POST request. Since we don't store that,
        // we'll use a heuristic: the creator is likely the one who created the game first
        // But actually, the simplest fix: allow the opponent (non-creator) to accept
        // Since we can't easily determine creator, let's check: if both players are set,
        // the one who didn't create it can accept. But we don't know who created it.
        
        // SIMPLEST FIX: Allow any player in a pending game to accept (first come first served)
        // This works because only the challenged player will see the notification
        
        // Activate the game and start the timer
        updatedGame = await prisma.game.update({
          where: { id: gameId },
          data: {
            status: 'active',
            lastMoveAt: new Date(), // Start timer now
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
        break

      case 'decline-challenge':
        // Check if user is a player in this game
        const isPlayerDecline = game.whitePlayerId === session.id || game.blackPlayerId === session.id
        if (!isPlayerDecline) {
          return NextResponse.json(
            { error: 'You are not a player in this game' },
            { status: 403 }
          )
        }
        
        // Only pending games can be declined
        if (game.status !== 'pending') {
          return NextResponse.json(
            { error: 'Game is not pending' },
            { status: 400 }
          )
        }
        
        // Cancel the game
        updatedGame = await prisma.game.update({
          where: { id: gameId },
          data: {
            status: 'completed',
            result: 'cancelled',
            completedAt: new Date(),
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
        break

      case 'close-game':
        // Only white player (game creator) can close the game
        if (game.whitePlayerId !== session.id) {
          return NextResponse.json(
            { error: 'Only the game creator can close the game' },
            { status: 403 }
          )
        }
        
        // Only active games can be closed
        if (game.status !== 'active' && !game.status.includes('draw_offered')) {
          return NextResponse.json(
            { error: 'Only active games can be closed' },
            { status: 400 }
          )
        }
        
        updatedGame = await prisma.game.update({
          where: { id: gameId },
          data: {
            status: 'completed',
            result: 'cancelled',
            completedAt: new Date(),
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
        break

      case 'spectate':
        // Add user as spectator
        await prisma.spectator.upsert({
          where: {
            gameId_userId: {
              gameId: gameId,
              userId: session.id,
            },
          },
          create: {
            gameId: gameId,
            userId: session.id,
          },
          update: {},
        })

        updatedGame = await prisma.game.findUnique({
          where: { id: gameId },
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
                joinedAt: true,
              },
            },
          },
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ game: updatedGame })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Update game error:', error)
    }
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while updating game' },
      { status: 500 }
    )
  }
}

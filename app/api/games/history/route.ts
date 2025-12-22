// app/api/games/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'date'
    const order = searchParams.get('order') || 'desc'
    const status = searchParams.get('status') // filter by status
    const result = searchParams.get('result') // filter by result
    const opponentName = searchParams.get('opponentName') // search by opponent

    // Build where clause
    const where: any = {
      OR: [
        { whitePlayerId: session.id },
        { blackPlayerId: session.id }
      ],
      status: { not: 'active' } // Only completed games
    }

    if (status) {
      where.status = status
    }

    if (result) {
      where.result = result
    }

    // Get games with opponent details
    const games = await prisma.game.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: sortBy === 'date' ? { createdAt: order as 'asc' | 'desc' } : undefined,
      include: {
        whitePlayer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true
          }
        },
        blackPlayer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true
          }
        }
      }
    })

    // Filter by opponent name if provided
    let filteredGames = games
    if (opponentName) {
      filteredGames = games.filter(game => {
        const opponent = game.whitePlayerId === session.id 
          ? game.blackPlayer 
          : game.whitePlayer
        const name = opponent.displayName || opponent.username
        return name.toLowerCase().includes(opponentName.toLowerCase())
      })
    }

    // Format the response
    const formattedGames = filteredGames.map(game => {
      const isWhite = game.whitePlayerId === session.id
      const opponent = isWhite ? game.blackPlayer : game.whitePlayer
      const playerColor = isWhite ? 'white' : 'black'

      // Determine result from current user's perspective
      let playerResult = 'draw'
      if (game.result === 'white_wins') {
        playerResult = isWhite ? 'win' : 'loss'
      } else if (game.result === 'black_wins') {
        playerResult = isWhite ? 'loss' : 'win'
      } else if (game.result === 'draw') {
        playerResult = 'draw'
      } else if (game.result === 'cancelled') {
        playerResult = 'cancelled'
      }

      return {
        id: game.id,
        opponent: {
          id: opponent.id,
          username: opponent.username,
          displayName: opponent.displayName,
          profileImage: opponent.profileImage
        },
        playerColor,
        result: playerResult,
        gameResult: game.result,
        status: game.status,
        timeControl: game.timeControl,
        createdAt: game.createdAt,
        completedAt: game.completedAt,
        pgn: game.pgn
      }
    })

    // Get total count for pagination
    const totalCount = await prisma.game.count({
      where
    })

    return NextResponse.json({
      games: formattedGames,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error: any) {
    console.error('Game history fetch error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch game history' },
      { status: 500 }
    )
  }
}




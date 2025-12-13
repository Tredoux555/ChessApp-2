import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface Params {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profileImage: true,
              },
            },
          },
        },
        matches: {
          include: {
            player1: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
            games: {
              include: {
                whitePlayer: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
                blackPlayer: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error('Get tournament error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching the tournament' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { action, data } = await request.json()

    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Note: Tournament doesn't have a creator field in schema
    // For now, allow any authenticated user to modify (can add creator field later if needed)

    switch (action) {
      case 'join':
        // Check if tournament is not full
        const participantCount = await prisma.tournamentParticipant.count({
          where: { tournamentId: params.id },
        })

        if (participantCount >= tournament.maxPlayers) {
          return NextResponse.json(
            { error: 'Tournament is full' },
            { status: 400 }
          )
        }

        // Check if user is already participating
        const existingParticipant = await prisma.tournamentParticipant.findFirst({
          where: {
            tournamentId: params.id,
            userId: session.id,
          },
        })

        if (existingParticipant) {
          return NextResponse.json(
            { error: 'Already participating in this tournament' },
            { status: 400 }
          )
        }

        await prisma.tournamentParticipant.create({
          data: {
            tournamentId: params.id,
            userId: session.id,
          },
        })

        return NextResponse.json({ message: 'Joined tournament successfully' })

      case 'start':
        if (tournament.status !== 'upcoming') {
          return NextResponse.json(
            { error: 'Tournament cannot be started' },
            { status: 400 }
          )
        }

        await prisma.tournament.update({
          where: { id: params.id },
          data: { status: 'active' },
        })

        return NextResponse.json({ message: 'Tournament started successfully' })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Update tournament error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'An error occurred while updating the tournament' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            participants: true,
            games: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error('Get tournaments error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching tournaments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { name, description, maxParticipants, startDate, timeControl } = await request.json()

    if (!name || !maxParticipants || !timeControl) {
      return NextResponse.json(
        { error: 'Name, max participants, and time control are required' },
        { status: 400 }
      )
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        maxParticipants: parseInt(maxParticipants),
        startDate: startDate ? new Date(startDate) : null,
        timeControl: parseInt(timeControl),
        creatorId: session.id,
        status: 'pending',
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    })

    return NextResponse.json({ tournament })
  } catch (error: any) {
    console.error('Create tournament error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'An error occurred while creating the tournament' },
      { status: 500 }
    )
  }
}

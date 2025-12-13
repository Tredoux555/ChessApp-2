import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        _count: {
          select: {
            participants: true,
            matches: true,
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
    const { name, description, maxPlayers, startDate } = await request.json()

    if (!name || !maxPlayers) {
      return NextResponse.json(
        { error: 'Name and max players are required' },
        { status: 400 }
      )
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        maxPlayers: parseInt(maxPlayers),
        startDate: startDate ? new Date(startDate) : null,
        status: 'upcoming',
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

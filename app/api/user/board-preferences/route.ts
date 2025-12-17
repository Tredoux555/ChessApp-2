// app/api/user/board-preferences/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { boardTheme, pieceSet } = body

    // Validate inputs
    const validThemes = ['brown', 'green', 'blue', 'purple', 'wood', 'marble']
    const validPieceSets = ['default', 'merida', 'alpha', 'tatiana', 'leipzig']

    if (!validThemes.includes(boardTheme)) {
      return NextResponse.json(
        { error: 'Invalid board theme' },
        { status: 400 }
      )
    }

    if (!validPieceSets.includes(pieceSet)) {
      return NextResponse.json(
        { error: 'Invalid piece set' },
        { status: 400 }
      )
    }

    // Update user preferences using raw SQL (Prisma Client may not be regenerated yet)
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "boardTheme" = ${boardTheme}, "pieceSet" = ${pieceSet}
      WHERE id = ${session.id}
    `

    return NextResponse.json({
      success: true,
      preferences: {
        boardTheme,
        pieceSet
      }
    })
  } catch (error: any) {
    console.error('Board preferences update error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Use raw SQL to fetch preferences (Prisma Client may not be regenerated yet)
    const result = await prisma.$queryRaw<Array<{ boardTheme: string | null, pieceSet: string | null }>>`
      SELECT "boardTheme", "pieceSet" 
      FROM "User" 
      WHERE id = ${session.id}
    `

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      boardTheme: result[0].boardTheme || 'brown',
      pieceSet: result[0].pieceSet || 'default'
    })
  } catch (error: any) {
    console.error('Board preferences fetch error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}


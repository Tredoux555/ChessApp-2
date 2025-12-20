// app/api/auth/me/route.ts
// UPDATED VERSION - includes boardTheme, pieceSet, isOnline

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Get user with all fields (including new ones if Prisma Client is regenerated)
    const user = await prisma.user.findUnique({
      where: { id: session.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return user with new fields (will be undefined if Prisma Client not regenerated yet)
    return NextResponse.json({ 
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        profileImage: user.profileImage,
        isAdmin: user.isAdmin,
        isBanned: user.isBanned,
        isSuspended: user.isSuspended,
        isOnline: (user as any).isOnline ?? false,
        lastSeenAt: (user as any).lastSeenAt ?? null,
        boardTheme: (user as any).boardTheme ?? 'brown',
        pieceSet: (user as any).pieceSet ?? 'default',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })
  } catch (error: any) {
    console.error('Get user error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

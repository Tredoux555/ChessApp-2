import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET - List flagged/all messages (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { isAdmin: true }
    })
    
    if (!currentUser?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const flaggedOnly = searchParams.get('flagged') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const messages = await prisma.message.findMany({
      where: flaggedOnly ? { isFlagged: true } : {},
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('Admin get messages error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// PUT - Moderate message (unflag, delete)
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { isAdmin: true }
    })
    
    if (!currentUser?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { messageId, action } = await request.json()

    if (!messageId || !action) {
      return NextResponse.json(
        { error: 'messageId and action required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'unflag':
        await prisma.message.update({
          where: { id: messageId },
          data: { isFlagged: false }
        })
        return NextResponse.json({ success: true })

      case 'delete':
        await prisma.message.delete({
          where: { id: messageId }
        })
        return NextResponse.json({ success: true, deleted: messageId })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Admin update message error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
  }
}



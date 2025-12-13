import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { containsProfanity } from '@/lib/profanity'

// GET - Get messages with a specific user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get messages between current user and specified user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.id, receiverId: userId },
          { senderId: userId, receiverId: session.id },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 100, // Last 100 messages
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: session.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('Get messages error:', error)
    
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

// POST - Send message
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { receiverId, content } = await request.json()

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      )
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Message too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // Check if users are friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: session.id, receiverId: receiverId, status: 'accepted' },
          { senderId: receiverId, receiverId: session.id, status: 'accepted' },
        ],
      },
    })

    if (!friendship) {
      return NextResponse.json(
        { error: 'Can only message friends' },
        { status: 403 }
      )
    }

    // Check for profanity
    const hasProfanity = containsProfanity(content)

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: session.id,
        receiverId: receiverId,
        content: content.trim(),
        isFlagged: hasProfanity,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
    })

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('Send message error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while sending message' },
      { status: 500 }
    )
  }
}

// PUT - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: session.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Mark messages read error:', error)
    
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

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET - Get friends, friend requests, or search users
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'friends'
    const search = searchParams.get('search')

    // Handle user search
    if (search) {
      const users = await prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { displayName: { contains: search, mode: 'insensitive' } },
              ],
            },
            { isBanned: false },
            { id: { not: session.id } }, // Exclude current user
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          profileImage: true,
        },
        take: 20, // Limit results
      })

      return NextResponse.json({ users })
    }

    if (type === 'requests') {
      // Get pending friend requests
      const requests = await prisma.friendship.findMany({
        where: {
          receiverId: session.id,
          status: 'pending',
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({ requests })
    } else {
      // Get accepted friends
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { senderId: session.id, status: 'accepted' },
            { receiverId: session.id, status: 'accepted' },
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
      })

      // Format friends list
      const friends = friendships.map(f => {
        const friend = f.senderId === session.id ? f.receiver : f.sender
        return {
          id: f.id,
          friendshipId: f.id,
          user: friend,
          createdAt: f.createdAt,
        }
      })

      return NextResponse.json({ friends })
    }
  } catch (error: any) {
    console.error('Get friends error:', error)
    
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

// POST - Send friend request
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { receiverId } = await request.json()

    if (!receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required' },
        { status: 400 }
      )
    }

    if (receiverId === session.id) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      )
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    })

    if (!receiver || receiver.isBanned) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if friendship already exists
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: session.id, receiverId: receiverId },
          { senderId: receiverId, receiverId: session.id },
        ],
      },
    })

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json(
          { error: 'Already friends' },
          { status: 400 }
        )
      } else if (existing.status === 'pending') {
        return NextResponse.json(
          { error: 'Friend request already sent' },
          { status: 400 }
        )
      }
    }

    // Create friend request
    const friendship = await prisma.friendship.create({
      data: {
        senderId: session.id,
        receiverId: receiverId,
        status: 'pending',
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

    // Note: Socket event should be emitted by client after successful creation
    // This allows the client to handle the socket connection properly

    return NextResponse.json({ friendship })
  } catch (error: any) {
    console.error('Send friend request error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while sending friend request' },
      { status: 500 }
    )
  }
}

// PUT - Accept/reject friend request
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { friendshipId, action } = await request.json()

    if (!friendshipId || !action) {
      return NextResponse.json(
        { error: 'Friendship ID and action are required' },
        { status: 400 }
      )
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    })

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      )
    }

    if (friendship.receiverId !== session.id) {
      return NextResponse.json(
        { error: 'Not authorized to respond to this request' },
        { status: 403 }
      )
    }

    if (action === 'accept') {
      const updated = await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'accepted' },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profileImage: true,
            },
          },
        },
      })

      return NextResponse.json({ friendship: updated })
    } else if (action === 'reject') {
      await prisma.friendship.delete({
        where: { id: friendshipId },
      })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Respond to friend request error:', error)
    
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

// DELETE - Remove friend
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const friendshipId = searchParams.get('id')

    if (!friendshipId) {
      return NextResponse.json(
        { error: 'Friendship ID is required' },
        { status: 400 }
      )
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    })

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friendship not found' },
        { status: 404 }
      )
    }

    // Check if user is part of this friendship
    if (friendship.senderId !== session.id && friendship.receiverId !== session.id) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    await prisma.friendship.delete({
      where: { id: friendshipId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Remove friend error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while removing friend' },
      { status: 500 }
    )
  }
}

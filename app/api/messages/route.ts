// app/api/messages/route.ts
// UPDATED VERSION with gameId support for in-game chat

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { containsProfanity } from '@/lib/profanity'

// GET messages - supports both direct messages and game messages
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const gameId = searchParams.get('gameId')
    const limit = parseInt(searchParams.get('limit') || '50')

    let messages

    if (gameId) {
      // Get game messages
      const game = await prisma.game.findUnique({
        where: { id: gameId }
      })

      if (!game) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 })
      }

      // Check if user is a player in this game
      if (game.whitePlayerId !== session.id && game.blackPlayerId !== session.id) {
        return NextResponse.json({ error: 'Not a player in this game' }, { status: 403 })
      }

      messages = await prisma.message.findMany({
        where: { gameId },
        orderBy: { createdAt: 'asc' },
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profileImage: true
            }
          }
        }
      })
    } else if (userId) {
      // Get direct messages between users
      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.id, receiverId: userId },
            { senderId: userId, receiverId: session.id }
          ],
          gameId: null
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profileImage: true
            }
          }
        }
      })

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          senderId: userId,
          receiverId: session.id,
          isRead: false
        },
        data: { isRead: true }
      })
    } else {
      return NextResponse.json(
        { error: 'userId or gameId required' },
        { status: 400 }
      )
    }

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('Get messages error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST - Send message (supports both direct and game messages)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { receiverId, content, gameId } = body

    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { error: 'receiverId and content are required' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Message too long (max 500 characters)' },
        { status: 400 }
      )
    }

    // Check for profanity
    const hasProfanity = containsProfanity(content)
    if (hasProfanity) {
      return NextResponse.json(
        { error: 'Message contains inappropriate content' },
        { status: 400 }
      )
    }

    // If gameId provided, verify user is in game and opponent is friend
    if (gameId) {
      const game = await prisma.game.findUnique({
        where: { id: gameId }
      })

      if (!game) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 })
      }

      // Check if user is a player
      if (game.whitePlayerId !== session.id && game.blackPlayerId !== session.id) {
        return NextResponse.json({ error: 'Not a player in this game' }, { status: 403 })
      }

      // Check if opponent is friend
      const friendship = await prisma.friendship.findFirst({
        where: {
          status: 'accepted',
          OR: [
            { senderId: session.id, receiverId },
            { senderId: receiverId, receiverId: session.id }
          ]
        }
      })

      if (!friendship) {
        return NextResponse.json(
          { error: 'Can only chat with accepted friends' },
          { status: 403 }
        )
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: session.id,
        receiverId,
        content: content.trim(),
        gameId: gameId || null,
        isFlagged: hasProfanity
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('Send message error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

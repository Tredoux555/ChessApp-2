import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET - List all users (admin only)
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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        profileImage: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            gamesAsWhite: true,
            gamesAsBlack: true,
            sentMessages: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('Admin get users error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// PUT - Update user (ban, make admin, etc)
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

    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action required' },
        { status: 400 }
      )
    }

    let updatedUser

    switch (action) {
      case 'make-admin':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { isAdmin: true },
          select: { id: true, username: true, isAdmin: true }
        })
        break

      case 'remove-admin':
        // Don't allow removing own admin status
        if (userId === session.id) {
          return NextResponse.json(
            { error: 'Cannot remove your own admin status' },
            { status: 400 }
          )
        }
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { isAdmin: false },
          select: { id: true, username: true, isAdmin: true }
        })
        break

      case 'delete':
        // Don't allow deleting yourself
        if (userId === session.id) {
          return NextResponse.json(
            { error: 'Cannot delete your own account' },
            { status: 400 }
          )
        }
        
        // Check if user exists
        const userToDelete = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true }
        })
        
        if (!userToDelete) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          )
        }
        
        // Delete user (cascade will handle related records)
        await prisma.user.delete({
          where: { id: userId }
        })
        
        return NextResponse.json({ 
          success: true, 
          deleted: userId,
          message: `User ${userToDelete.username} deleted successfully`
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error: any) {
    console.error('Admin update user error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}


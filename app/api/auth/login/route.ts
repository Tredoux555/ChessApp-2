import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Check if banned or suspended
    if (user.isBanned) {
      return NextResponse.json(
        { error: 'Your account has been banned' },
        { status: 403 }
      )
    }

    if (user.isSuspended && user.suspendedUntil) {
      if (new Date() < user.suspendedUntil) {
        return NextResponse.json(
          { error: `Your account is suspended until ${user.suspendedUntil.toLocaleDateString()}` },
          { status: 403 }
        )
      } else {
        // Clear expired suspension
        await prisma.user.update({
          where: { id: user.id },
          data: { isSuspended: false, suspendedUntil: null },
        })
      }
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Create session
    await createSession(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        profileImage: user.profileImage,
        isAdmin: user.isAdmin,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}

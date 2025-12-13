import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Validate username
    if (!username || username.length < 3 || username.length > 10) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 10 characters' },
        { status: 400 }
      )
    }

    // Validate username format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    // Validate password
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        password: hashedPassword,
        displayName: username,
      },
    })

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
  } catch (error: any) {
    console.error('Registration error:', error)
    
    // Check for database connection errors
    if (error?.code === 'P1001' || error?.message?.includes('connect')) {
      return NextResponse.json(
        { error: 'Database connection failed. Please check DATABASE_URL environment variable.' },
        { status: 500 }
      )
    }
    
    // Check for Prisma errors
    if (error?.code?.startsWith('P')) {
      return NextResponse.json(
        { error: `Database error: ${error.message || 'Unknown database error'}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || 'An error occurred during registration' },
      { status: 500 }
    )
  }
}

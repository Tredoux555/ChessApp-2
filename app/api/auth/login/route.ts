import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createSession } from '@/lib/auth'

// Simple in-memory rate limiter (for production, use Redis or similar)
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const record = loginAttempts.get(identifier)
  
  if (!record || now > record.resetAt) {
    loginAttempts.set(identifier, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  if (record.count >= maxAttempts) {
    return false
  }
  
  record.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    // Rate limiting - use IP address or username as identifier
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const identifier = `${ip}-${username?.toLowerCase() || 'unknown'}`
    
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      )
    }

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
      // Don't increment rate limit on invalid password (already incremented)
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }
    
    // Clear rate limit on successful login
    loginAttempts.delete(identifier)

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
    console.error('Login error:', error)
    
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
      { error: error?.message || 'An error occurred during login' },
      { status: 500 }
    )
  }
}

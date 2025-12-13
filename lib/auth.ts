import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const SESSION_COOKIE_NAME = 'riddick_session'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createSession(userId: string): Promise<string> {
  const sessionToken = generateSessionToken()
  const cookieStore = await cookies()
  
  cookieStore.set(SESSION_COOKIE_NAME, `${userId}:${sessionToken}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return sessionToken
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
  
  if (!sessionCookie) {
    return null
  }

  const [userId] = sessionCookie.value.split(':')
  
  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      profileImage: true,
      isAdmin: true,
      isBanned: true,
      isSuspended: true,
      suspendedUntil: true,
    },
  })

  if (!user) {
    return null
  }

  // Check if user is banned or suspended
  if (user.isBanned) {
    return null
  }

  if (user.isSuspended && user.suspendedUntil) {
    if (new Date() < user.suspendedUntil) {
      return null
    } else {
      // Suspension expired, clear it
      await prisma.user.update({
        where: { id: user.id },
        data: { isSuspended: false, suspendedUntil: null },
      })
      user.isSuspended = false
      user.suspendedUntil = null
    }
  }

  return user
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (!session.isAdmin) {
    throw new Error('Forbidden')
  }
  return session
}

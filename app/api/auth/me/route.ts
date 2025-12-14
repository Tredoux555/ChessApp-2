import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 8000)
    })

    const sessionPromise = getSession()
    
    const session = await Promise.race([sessionPromise, timeoutPromise]) as any
    
    if (!session) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user: session })
  } catch (error: any) {
    console.error('Get user error:', error)
    
    // If it's a timeout or database error, return null user (not logged in)
    if (error.message === 'Request timeout' || error.message?.includes('database') || error.message?.includes('P1001')) {
      console.error('Database connection issue - returning null user')
      return NextResponse.json({ user: null })
    }
    
    return NextResponse.json(
      { error: 'An error occurred', user: null },
      { status: 500 }
    )
  }
}

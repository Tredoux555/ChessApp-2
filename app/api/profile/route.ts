import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    if (!search || search.trim().length < 1) {
      return NextResponse.json({ users: [] })
    }

    const searchLower = search.toLowerCase().trim()

    // Fetch users that match the search (case-insensitive search)
    // Prisma's contains is case-sensitive, so we'll fetch more and filter in memory
    const allUsers = await prisma.user.findMany({
      where: {
        isBanned: false,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        profileImage: true,
      },
    })

    // Filter users that match the search query (case-insensitive)
    const matchingUsers = allUsers.filter((user) => {
      const username = user.username.toLowerCase()
      const displayName = (user.displayName || user.username).toLowerCase()
      return username.includes(searchLower) || displayName.includes(searchLower)
    })

    // Sort alphabetically: prioritize startsWith matches, then by username/displayName
    const sortedUsers = matchingUsers.sort((a, b) => {
      const aName = (a.displayName || a.username).toLowerCase()
      const bName = (b.displayName || b.username).toLowerCase()
      const aStartsWith = aName.startsWith(searchLower)
      const bStartsWith = bName.startsWith(searchLower)
      
      // If one starts with search and the other doesn't, prioritize the one that starts
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      
      // Otherwise sort alphabetically
      return aName.localeCompare(bName)
    }).slice(0, 20) // Limit to 20 results

    return NextResponse.json({ users: sortedUsers })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await request.formData()

    const displayName = formData.get('displayName') as string
    const bio = formData.get('bio') as string
    const profileImage = formData.get('profileImage') as string | null

    const updateData: any = {}

    if (displayName !== null) {
      updateData.displayName = displayName
    }

    if (bio !== null) {
      updateData.bio = bio
    }

    if (profileImage !== null) {
      updateData.profileImage = profileImage
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        profileImage: true,
        bio: true,
        isAdmin: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('Profile update error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while updating profile' },
      { status: 500 }
    )
  }
}

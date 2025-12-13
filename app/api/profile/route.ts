import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    if (!search || search.trim().length < 2) {
      return NextResponse.json({ users: [] })
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: search,
        },
        isBanned: false,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        profileImage: true,
      },
      take: 10,
    })

    return NextResponse.json({ users })
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

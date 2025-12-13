import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'

// GET - List products
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        quantity: { gt: 0 },
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ products })
  } catch (error: any) {
    console.error('Get products error:', error)
    
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

// POST - Create product (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    const { name, description, price, imageUrl, quantity } = await request.json()

    if (!name || price === undefined || quantity === undefined) {
      return NextResponse.json(
        { error: 'Name, price, and quantity are required' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        quantity: parseInt(quantity),
        sellerId: session.id,
      },
    })

    return NextResponse.json({ product })
  } catch (error: any) {
    console.error('Create product error:', error)
    
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while creating product' },
      { status: 500 }
    )
  }
}

// PUT - Update product (admin only)
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const { id, name, description, price, imageUrl, quantity, isActive } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (quantity !== undefined) updateData.quantity = parseInt(quantity)
    if (isActive !== undefined) updateData.isActive = isActive

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ product })
  } catch (error: any) {
    console.error('Update product error:', error)
    
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while updating product' },
      { status: 500 }
    )
  }
}

// DELETE - Delete product (admin only)
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete product error:', error)
    
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while deleting product' },
      { status: 500 }
    )
  }
}

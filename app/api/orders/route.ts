import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// POST - Create order (purchase product)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { productId, quantity = 1 } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Fetch the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (!product.isActive) {
      return NextResponse.json(
        { error: 'Product is not available' },
        { status: 400 }
      )
    }

    if (product.quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient quantity available' },
        { status: 400 }
      )
    }

    // Calculate total price
    const totalPrice = product.price * quantity

    // Create the order
    const order = await prisma.order.create({
      data: {
        productId: product.id,
        buyerId: session.id,
        quantity,
        totalPrice,
        status: 'paid', // Honor system - mark as paid immediately
      },
    })

    // Update product quantity and check if it should be deactivated
    const newQuantity = product.quantity - quantity
    await prisma.product.update({
      where: { id: product.id },
      data: {
        quantity: newQuantity,
        // If quantity reaches 0, set isActive to false (product disappears)
        isActive: newQuantity > 0,
      },
    })

    // Fetch order with buyer information
    const orderWithBuyer = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        productId: order.productId,
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
        buyer: orderWithBuyer?.buyer,
        product: orderWithBuyer?.product,
      },
    })
  } catch (error: any) {
    console.error('Create order error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

// GET - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const orders = await prisma.order.findMany({
      where: {
        buyerId: session.id,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            price: true,
          },
        },
        buyer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error('Get orders error:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}


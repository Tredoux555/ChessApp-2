const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkProducts() {
  const products = await prisma.product.findMany()
  console.log('Products in database:')
  products.forEach(p => {
    console.log(`- ${p.name}`)
    console.log(`  imageUrl: ${p.imageUrl || '(empty)'}`)
    console.log(`  price: ${p.price}`)
    console.log(`  quantity: ${p.quantity}`)
  })
  await prisma.$disconnect()
}

checkProducts()


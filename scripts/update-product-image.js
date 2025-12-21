const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateImage() {
  // Try common ImgBB direct link formats
  const possibleLinks = [
    'https://i.ibb.co/V0jYTQHG/WIN-20251218-04-28-56-Pro.jpg',
    'https://i.ibb.co/V0jYTQHG/WIN20251218042856Pro.jpg',
    'https://i.ibb.co/V0jYTQHG/WIN-20251218-04-28-56-Pro.png',
    'https://i.ibb.co/V0jYTQHG/image.jpg',
  ]

  const product = await prisma.product.findFirst({
    where: { name: { contains: 'Dragon' } }
  })

  if (!product) {
    console.log('Product not found')
    await prisma.$disconnect()
    return
  }

  console.log('Current product:', product.name)
  console.log('Current imageUrl:', product.imageUrl)
  
  // Update with the first likely format
  const newUrl = possibleLinks[0]
  await prisma.product.update({
    where: { id: product.id },
    data: { imageUrl: newUrl }
  })

  console.log('\n✅ Updated imageUrl to:', newUrl)
  console.log('\nIf this doesn\'t work, get the direct link from ImgBB:')
  console.log('1. Go to https://ibb.co/V0jYTQHG')
  console.log('2. Click "Embed codes" or scroll to "Direct links"')
  console.log('3. Copy the "Image link" (starts with https://i.ibb.co/...)')
  console.log('4. Edit the product in /admin and paste it')

  await prisma.$disconnect()
}

updateImage()



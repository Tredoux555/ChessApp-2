const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function makeAdmin() {
  try {
    // Remove admin from ALL users first
    await prisma.user.updateMany({
      data: { isAdmin: false }
    })
    
    // Make only riddick an admin
    await prisma.user.update({
      where: { username: 'riddick' },
      data: { isAdmin: true }
    })
    
    // Verify
    const users = await prisma.user.findMany({
      select: {
        username: true,
        isAdmin: true
      }
    })
    
    console.log('\n📋 Updated users:')
    users.forEach(u => {
      console.log(`  - ${u.username} (isAdmin: ${u.isAdmin})`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

makeAdmin()


const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        displayName: {
          contains: 'Roman',
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      console.log('❌ User "Roman" not found in database');
      return;
    }

    console.log('Found user:', user);

    const updated = await prisma.user.update({
      where: { userId: user.userId },
      data: { role: 'admin' }
    });

    console.log('✅ Successfully updated to admin:', {
      userId: updated.userId,
      displayName: updated.displayName,
      email: updated.email,
      role: updated.role
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = 'admin@admin.com';
  const password = 'password';
  const displayName = 'Admin';
  const role = 'admin';

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    await prisma.$disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      displayName,
      role,
      authProvider: 'credentials',
    },
  });

  console.log(`Admin user created: ${email} / ${password}`);
  await prisma.$disconnect();
}

seedAdmin().catch((e) => {
  console.error('Seed error:', e);
  prisma.$disconnect();
  process.exit(1);
});

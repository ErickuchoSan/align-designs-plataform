const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating admin email...');

  const result = await prisma.user.updateMany({
    where: {
      email: 'alf.guzman@outlook.com'
    },
    data: {
      email: 'e.bores.i@outlook.com'
    }
  });

  console.log(`✅ Updated ${result.count} user(s)`);

  // Verify
  const updatedUser = await prisma.user.findUnique({
    where: { email: 'e.bores.i@outlook.com' },
    select: { email: true, firstName: true, lastName: true, role: true }
  });

  console.log('📧 New admin user:', updatedUser);
}

main()
  .catch((e) => {
    console.error('❌ Update failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

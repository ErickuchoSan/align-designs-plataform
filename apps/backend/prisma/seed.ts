import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash de la contraseña del admin: NoloseAlfonso136!
  const hashedPassword = await bcrypt.hash('NoloseAlfonso136!', 10);

  // Crear usuario admin: Alfonzo Guzman
  const admin = await prisma.user.upsert({
    where: { email: 'e.bores.i@outlook.com' },
    update: {},
    create: {
      email: 'e.bores.i@outlook.com',
      firstName: 'Alfonzo',
      lastName: 'Guzman',
      phone: '+19565344110',
      passwordHash: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash de la contraseña del admin: NoloseAlfonso12345
  const hashedPassword = await bcrypt.hash('NoloseAlfonso12345', 10);

  // Crear usuario admin: Alfonzo Guzman
  const admin = await prisma.user.upsert({
    where: { email: 'alf.guzman@outlook.com' },
    update: {},
    create: {
      email: 'alf.guzman@outlook.com',
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

  // Crear un cliente de ejemplo para pruebas: alfonso_guzalba@hotmail.com
  const client = await prisma.user.upsert({
    where: { email: 'alfonso_guzalba@hotmail.com' },
    update: {},
    create: {
      email: 'alfonso_guzalba@hotmail.com',
      firstName: 'Alfonso',
      lastName: 'Guzalba',
      phone: '+19565344110',
      passwordHash: null, // Cliente no tiene contraseña inicial, usa OTP
      role: Role.CLIENT,
      isActive: true,
      emailVerified: false,
    },
  });

  console.log('✅ Client user created:', client.email);

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

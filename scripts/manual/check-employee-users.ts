import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmployeeUsers() {
  try {
    const employees = await prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        passwordHash: true,
      },
    });

    console.log('\n📋 EMPLOYEE Users in Database:');
    console.log('===============================\n');

    if (employees.length === 0) {
      console.log('❌ No EMPLOYEE users found in the database.\n');
      console.log('💡 You need to create an EMPLOYEE user to test OTP authentication.\n');
    } else {
      employees.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.firstName} ${emp.lastName}`);
        console.log(`   Email: ${emp.email}`);
        console.log(`   ID: ${emp.id}`);
        console.log(`   Active: ${emp.isActive}`);
        console.log(`   Has Password: ${!!emp.passwordHash}`);
        console.log('');
      });
    }

    console.log('===============================\n');
  } catch (error) {
    console.error('Error checking employee users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployeeUsers();

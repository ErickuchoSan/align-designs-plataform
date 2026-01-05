import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmployeeProject() {
  try {
    const projectId = '9d66e14c-8a20-46cb-a835-f038e50afbfd';
    const employeeEmail = 'erickuchoxd@gmail.com';

    // Find employee
    const employee = await prisma.user.findFirst({
      where: {
        email: employeeEmail,
        role: 'EMPLOYEE',
        deletedAt: null,
      },
    });

    if (!employee) {
      console.log('❌ Employee not found');
      return;
    }

    console.log('\n👤 Employee Found:');
    console.log(`   Name: ${employee.firstName} ${employee.lastName}`);
    console.log(`   Email: ${employee.email}`);
    console.log(`   ID: ${employee.id}\n`);

    // Find project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        employees: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      console.log('❌ Project not found');
      return;
    }

    console.log('📋 Project Found:');
    console.log(`   Name: ${project.name}`);
    console.log(`   ID: ${project.id}`);
    console.log(`\n   Assigned Employees (${project.employees.length}):`);

    if (project.employees.length === 0) {
      console.log('   ⚠️  No employees assigned to this project\n');
    } else {
      project.employees.forEach((pe, index) => {
        console.log(`   ${index + 1}. ${pe.employee.firstName} ${pe.employee.lastName} (${pe.employee.email})`);
        console.log(`      ID: ${pe.employee.id}`);
      });
      console.log('');
    }

    // Check if employee is assigned
    const isAssigned = project.employees.some(pe => pe.employee.id === employee.id);

    if (isAssigned) {
      console.log('✅ Employee IS assigned to this project\n');
    } else {
      console.log('❌ Employee is NOT assigned to this project\n');
      console.log('💡 To assign the employee, you need to update the project.\n');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployeeProject();

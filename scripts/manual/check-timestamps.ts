import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const payment = await prisma.payment.findUnique({
    where: { id: '282bfc7a-aa0e-4e8e-bdc7-703ec5836584' },
    select: {
      id: true,
      amount: true,
      status: true,
      type: true,
      invoiceId: true,
      createdAt: true,
      reviewedAt: true
    }
  });

  const invoice = await prisma.invoice.findUnique({
    where: { id: '88575031-5548-4984-a46f-cd34ee90dbb5' },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      amountPaid: true,
      totalAmount: true,
      createdAt: true,
      sentToClientAt: true
    }
  });

  console.log('📅 Timeline:');
  console.log('  Payment created:', payment?.createdAt);
  console.log('  Payment approved:', payment?.reviewedAt);
  console.log('  Invoice created:', invoice?.createdAt);
  console.log('  Invoice sent:', invoice?.sentToClientAt);

  console.log('\n📊 Current State:');
  console.log('  Payment has invoiceId?', payment?.invoiceId ? 'YES ✅' : 'NO ❌');
  console.log('  Invoice amountPaid:', invoice?.amountPaid);
  console.log('  Invoice status:', invoice?.status);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking payment and invoice linkage...\n');

  // Get the most recent payment
  const payment = await prisma.payment.findFirst({
    where: { amount: 20000 },
    orderBy: { createdAt: 'desc' },
    include: {
      invoice: true,
      project: { select: { name: true, id: true } }
    }
  });

  if (!payment) {
    console.log('❌ No payment found with amount 20000');
    return;
  }

  console.log('📋 Payment Details:');
  console.log('  ID:', payment.id);
  console.log('  Amount:', payment.amount);
  console.log('  Status:', payment.status);
  console.log('  Type:', payment.type);
  console.log('  InvoiceId:', payment.invoiceId || 'NULL ❌');
  console.log('  Project:', payment.project?.name);
  console.log('  Project ID:', payment.project?.id);

  if (payment.invoice) {
    console.log('\n✅ Payment IS linked to invoice:');
    console.log('  Invoice Number:', payment.invoice.invoiceNumber);
    console.log('  Status:', payment.invoice.status);
    console.log('  Amount Paid:', payment.invoice.amountPaid);
    console.log('  Total Amount:', payment.invoice.totalAmount);
  } else {
    console.log('\n❌ Payment is NOT linked to any invoice!');

    // Check if there's an invoice for this project
    const invoice = await prisma.invoice.findFirst({
      where: { projectId: payment.projectId },
      orderBy: { createdAt: 'desc' }
    });

    if (invoice) {
      console.log('\n⚠️  Found invoice for this project:');
      console.log('  Invoice ID:', invoice.id);
      console.log('  Invoice Number:', invoice.invoiceNumber);
      console.log('  Invoice Status:', invoice.status);
      console.log('  Invoice Amount Paid:', invoice.amountPaid);
      console.log('  Invoice Total Amount:', invoice.totalAmount);
      console.log('\n💡 The payment was created WITHOUT the invoiceId!');
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

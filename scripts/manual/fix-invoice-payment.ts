import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing invoice payment linkage...\n');

  const paymentId = '282bfc7a-aa0e-4e8e-bdc7-703ec5836584';
  const invoiceId = '88575031-5548-4984-a46f-cd34ee90dbb5';

  // Get payment
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    console.log('❌ Payment not found');
    return;
  }

  // Get invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    console.log('❌ Invoice not found');
    return;
  }

  console.log('📋 Current State:');
  console.log('  Payment amount:', Number(payment.amount));
  console.log('  Payment status:', payment.status);
  console.log('  Invoice status:', invoice.status);
  console.log('  Invoice amount paid:', Number(invoice.amountPaid));
  console.log('  Invoice total amount:', Number(invoice.totalAmount));

  // Calculate new amounts
  const paymentAmount = Number(payment.amount);
  const newAmountPaid = Number(invoice.amountPaid) + paymentAmount;
  const totalAmount = Number(invoice.totalAmount);

  let newStatus = invoice.status;
  if (newAmountPaid >= totalAmount) {
    newStatus = 'PAID';
  } else if (newAmountPaid > 0) {
    newStatus = 'PARTIALLY_PAID';
  }

  console.log('\n🔄 Updating invoice...');
  console.log('  New amount paid:', newAmountPaid);
  console.log('  New status:', newStatus);

  // Update invoice
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      amountPaid: newAmountPaid,
      status: newStatus as any,
    },
  });

  console.log('\n✅ Invoice updated successfully!');

  // Verify
  const updatedInvoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  console.log('\n📊 Final State:');
  console.log('  Invoice amount paid:', Number(updatedInvoice?.amountPaid));
  console.log('  Invoice status:', updatedInvoice?.status);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

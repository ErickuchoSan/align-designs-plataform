
import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Invoice } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Readable } from 'stream';

// Información de la empresa Align Designs
const COMPANY_INFO = {
  name: 'Align Designs',
  tagline: 'Professional Design Solutions',
  address: '1234 Creative Avenue, Suite 500',
  city: 'San Francisco, CA 94102',
  country: 'United States',
  email: 'invoices@aligndesigns.com',
  phone: '+1 (415) 555-0123',
  website: 'www.aligndesigns.com',
  taxId: 'EIN: 12-3456789',
};

interface InvoiceWithRelations extends Invoice {
  project?: { name: string };
  client?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

@Injectable()
export class InvoicePdfService {
  private readonly logger = new Logger(InvoicePdfService.name);

  /**
   * Generate a professional PDF invoice
   * Returns a readable stream that can be piped to response or saved to file
   */
  async generateInvoicePDF(invoice: InvoiceWithRelations): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];

        // Collect PDF data into buffer
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Build the PDF
        this.buildPdfHeader(doc);
        this.buildCompanyInfo(doc);
        this.buildClientInfo(doc, invoice);
        this.buildInvoiceDetails(doc, invoice);
        this.buildItemsTable(doc, invoice);
        this.buildTotals(doc, invoice);
        this.buildPaymentInfo(doc, invoice);
        this.buildFooter(doc);

        // Finalize PDF
        doc.end();
      } catch (error) {
        this.logger.error('Error generating PDF', error);
        reject(error);
      }
    });
  }

  private buildPdfHeader(doc: PDFKit.PDFDocument) {
    // Company logo placeholder (you can add actual logo later)
    doc
      .fontSize(28)
      .fillColor('#1e3a5f') // Navy blue
      .font('Helvetica-Bold')
      .text(COMPANY_INFO.name, 50, 50);

    doc
      .fontSize(10)
      .fillColor('#666666')
      .font('Helvetica')
      .text(COMPANY_INFO.tagline, 50, 85);

    // INVOICE title on the right
    doc
      .fontSize(36)
      .fillColor('#d4af37') // Gold
      .font('Helvetica-Bold')
      .text('INVOICE', 400, 50, { align: 'right' });

    doc.moveDown(2);
  }

  private buildCompanyInfo(doc: PDFKit.PDFDocument) {
    const startY = 130;

    doc
      .fontSize(10)
      .fillColor('#333333')
      .font('Helvetica-Bold')
      .text('FROM:', 50, startY);

    doc
      .font('Helvetica')
      .text(COMPANY_INFO.name, 50, startY + 15)
      .text(COMPANY_INFO.address, 50, startY + 30)
      .text(COMPANY_INFO.city, 50, startY + 45)
      .text(COMPANY_INFO.country, 50, startY + 60)
      .text(`Email: ${COMPANY_INFO.email}`, 50, startY + 75)
      .text(`Phone: ${COMPANY_INFO.phone}`, 50, startY + 90)
      .text(COMPANY_INFO.taxId, 50, startY + 105);
  }

  private buildClientInfo(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations) {
    const startY = 130;

    doc
      .fontSize(10)
      .fillColor('#333333')
      .font('Helvetica-Bold')
      .text('BILL TO:', 320, startY);

    const clientName = invoice.client
      ? `${invoice.client.firstName} ${invoice.client.lastName}`
      : 'Client Name';

    const clientEmail = invoice.client?.email || 'N/A';
    const clientPhone = invoice.client?.phone || 'N/A';

    doc
      .font('Helvetica')
      .text(clientName, 320, startY + 15)
      .text(`Email: ${clientEmail}`, 320, startY + 30)
      .text(`Phone: ${clientPhone}`, 320, startY + 45);
  }

  private buildInvoiceDetails(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations) {
    const startY = 280;

    // Invoice details box background
    doc
      .fillColor('#f8f9fa')
      .rect(50, startY, 512, 80)
      .fill();

    doc
      .fillColor('#333333')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Invoice Number:', 60, startY + 15)
      .text('Invoice Date:', 60, startY + 35)
      .text('Due Date:', 60, startY + 55);

    doc
      .font('Helvetica')
      .text(invoice.invoiceNumber, 180, startY + 15)
      .text(this.formatDate(invoice.issueDate), 180, startY + 35)
      .text(this.formatDate(invoice.dueDate), 180, startY + 55);

    doc
      .font('Helvetica-Bold')
      .text('Project:', 320, startY + 15)
      .text('Status:', 320, startY + 35)
      .text('Payment Terms:', 320, startY + 55);

    doc
      .font('Helvetica')
      .text(invoice.project?.name || 'N/A', 420, startY + 15)
      .text(this.formatStatus(invoice.status), 420, startY + 35)
      .text(`${invoice.paymentTermsDays} days`, 420, startY + 55);
  }

  private buildItemsTable(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations) {
    const startY = 390;
    const tableTop = startY;

    // Table header background
    doc
      .fillColor('#1e3a5f')
      .rect(50, tableTop, 512, 25)
      .fill();

    // Table headers
    doc
      .fontSize(10)
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .text('DESCRIPTION', 60, tableTop + 8)
      .text('QUANTITY', 320, tableTop + 8)
      .text('RATE', 400, tableTop + 8)
      .text('AMOUNT', 480, tableTop + 8);

    // Table row
    const rowY = tableTop + 35;

    doc
      .fillColor('#333333')
      .font('Helvetica')
      .text(`Initial Payment - ${invoice.project?.name || 'Project'}`, 60, rowY)
      .text('1', 320, rowY)
      .text(`$${this.formatCurrency(invoice.subtotal)}`, 400, rowY)
      .text(`$${this.formatCurrency(invoice.subtotal)}`, 480, rowY);

    // Line under item
    doc
      .strokeColor('#e0e0e0')
      .lineWidth(1)
      .moveTo(50, rowY + 25)
      .lineTo(562, rowY + 25)
      .stroke();
  }

  private buildTotals(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations) {
    const startY = 480;

    doc
      .fontSize(10)
      .fillColor('#333333')
      .font('Helvetica')
      .text('Subtotal:', 400, startY)
      .text('Tax:', 400, startY + 20)
      .text(`$${this.formatCurrency(invoice.subtotal)}`, 480, startY, { align: 'right' })
      .text(`$${this.formatCurrency(invoice.taxAmount)}`, 480, startY + 20, { align: 'right' });

    // Total box
    doc
      .fillColor('#1e3a5f')
      .rect(400, startY + 45, 162, 30)
      .fill();

    doc
      .fontSize(12)
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .text('TOTAL:', 410, startY + 55)
      .text(`$${this.formatCurrency(invoice.totalAmount)}`, 480, startY + 55, { align: 'right' });

    // Amount paid
    const amountPaid = Number(invoice.amountPaid);
    if (amountPaid > 0) {
      doc
        .fontSize(10)
        .fillColor('#28a745')
        .font('Helvetica')
        .text('Amount Paid:', 400, startY + 85)
        .text(`-$${this.formatCurrency(invoice.amountPaid)}`, 480, startY + 85, { align: 'right' });

      // Balance due
      const balance = Number(invoice.totalAmount) - Number(invoice.amountPaid);
      doc
        .fontSize(11)
        .fillColor('#dc3545')
        .font('Helvetica-Bold')
        .text('Balance Due:', 400, startY + 110)
        .text(`$${this.formatCurrency(balance)}`, 480, startY + 110, { align: 'right' });
    }
  }

  private buildPaymentInfo(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations) {
    const startY = 570; // Moved up to 570 to provide more space for footer

    doc
      .fontSize(11)
      .fillColor('#1e3a5f')
      .font('Helvetica-Bold')
      .text('Payment Information', 50, startY);

    doc
      .fontSize(9)
      .fillColor('#666666')
      .font('Helvetica')
      .text('Please make payment to:', 50, startY + 20)
      .text(`Bank Transfer: ${COMPANY_INFO.name}`, 50, startY + 35)
      .text('Account Number: XXXX-XXXX-1234', 50, startY + 50)
      .text('Routing Number: 123456789', 50, startY + 65)
      .text(`Reference: Include invoice number ${invoice.invoiceNumber} in payment reference`, 50, startY + 80);
  }

  private buildFooter(doc: PDFKit.PDFDocument) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 95; // Moved up from -80 to ensure it fits in page margins

    // Signature line
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(50, footerY - 20)
      .lineTo(250, footerY - 20)
      .stroke();

    doc
      .fontSize(9)
      .fillColor('#666666')
      .font('Helvetica-Oblique')
      .text('Authorized Signature', 50, footerY - 10);

    // Footer text
    doc
      .fontSize(8)
      .fillColor('#999999')
      .font('Helvetica')
      .text(
        'Thank you for your business! | Questions? Contact us at ' + COMPANY_INFO.email,
        50,
        footerY + 20,
        { align: 'center', width: 512 }
      );

    doc
      .text(COMPANY_INFO.website, 50, footerY + 35, { align: 'center', width: 512, link: `https://${COMPANY_INFO.website}` });
  }

  private formatCurrency(amount: number | Decimal): string {
    const numAmount = typeof amount === 'number' ? amount : Number(amount);
    return numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}

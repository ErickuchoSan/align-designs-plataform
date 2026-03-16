import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Invoice } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Align Designs company information
const COMPANY_INFO = {
  name: 'Align Designs LLC',
  phone: '(956)534-4110',
  email: 'Alfonso21guz@gmail.com',
};

// Color scheme matching reference PDF
const COLORS = {
  primary: '#D4A843', // Golden/Orange for headers
  text: '#333333',
  lightText: '#666666',
  paid: '#C53030', // Red for PAID stamp
  tableHeader: '#D4A843',
  border: '#E5E5E5',
};

interface InvoiceWithRelations extends Invoice {
  project?: { name: string };
  client?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
  };
  items?: Array<{
    description: string;
    amount: number | Decimal;
  }>;
}

@Injectable()
export class InvoicePdfService {
  private readonly logger = new Logger(InvoicePdfService.name);

  /**
   * Generate a professional PDF invoice matching Align Designs reference
   */
  async generateInvoicePDF(invoice: InvoiceWithRelations): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 60, right: 60 },
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Page 1: Invoice
        this.buildPage1(doc, invoice);

        // Page 2: Terms & Conditions
        doc.addPage();
        this.buildPage2(doc, invoice);

        doc.end();
      } catch (error) {
        this.logger.error('Error generating PDF', error);
        reject(error);
      }
    });
  }

  private buildPage1(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations) {
    // Header with company name
    this.buildHeader(doc);

    // Bill To and Invoice Date section
    this.buildBillToSection(doc, invoice);

    // Description table
    const tableEndY = this.buildDescriptionTable(doc, invoice);

    // Total
    this.buildTotal(doc, invoice, tableEndY);

    // PAID stamp if applicable
    if (invoice.status === 'PAID') {
      this.drawPaidStamp(doc, 280, 380, 150);
    }

    // Vertical text on left side
    this.drawVerticalInvoiceText(doc, invoice);
  }

  private buildPage2(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations) {
    const pageWidth = doc.page.width;
    const leftMargin = 60;

    // Horizontal line at top
    doc
      .strokeColor(COLORS.border)
      .lineWidth(1)
      .moveTo(leftMargin, 50)
      .lineTo(pageWidth - leftMargin, 50)
      .stroke();

    // Terms & Conditions title
    doc
      .fontSize(14)
      .fillColor(COLORS.primary)
      .font('Helvetica-Bold')
      .text('Terms & Conditions', leftMargin, 70);

    // Terms text
    const termsText = `Any additional items requested beyond the scope of this package will be subject to separate charges. Feel free to reach out if you have any questions or if you require further customization. Engineering and permitting is not included.
Payment is due within ${invoice.paymentTermsDays || 15} days.

Thank you for your business!`;

    doc
      .fontSize(11)
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text(termsText, leftMargin, 100, {
        width: pageWidth - leftMargin * 2,
        lineGap: 5,
      });

    // Large PAID stamp in center if paid
    if (invoice.status === 'PAID') {
      this.drawPaidStamp(doc, (pageWidth - 200) / 2, 400, 200);
    }
  }

  private buildHeader(doc: PDFKit.PDFDocument) {
    const pageWidth = doc.page.width;
    const leftMargin = 60;

    // Company name in golden color
    doc
      .fontSize(24)
      .fillColor(COLORS.primary)
      .font('Helvetica-Bold')
      .text(COMPANY_INFO.name, leftMargin, 50);

    // Phone and email
    doc
      .fontSize(11)
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text(COMPANY_INFO.phone, leftMargin, 80)
      .text(COMPANY_INFO.email, leftMargin, 95);

    // Draw logo on the right
    this.drawLogo(doc, pageWidth - 140, 45);
  }

  private drawLogo(doc: PDFKit.PDFDocument, x: number, y: number) {
    // Draw a stylized "A" logo similar to Align Designs branding
    const size = 60;

    // Draw the stylized "A" shape
    doc
      .save()
      .strokeColor(COLORS.text)
      .lineWidth(2)
      .moveTo(x + size / 2, y) // Top point
      .lineTo(x, y + size * 0.7) // Bottom left
      .moveTo(x + size / 2, y) // Top point
      .lineTo(x + size, y + size * 0.7) // Bottom right
      .moveTo(x + size * 0.2, y + size * 0.5) // Crossbar left
      .lineTo(x + size * 0.8, y + size * 0.5) // Crossbar right
      .stroke()
      .restore();

    // "ALIGN" text below the A
    doc
      .fontSize(12)
      .fillColor(COLORS.text)
      .font('Helvetica-Bold')
      .text('ALIGN', x - 5, y + size * 0.75, { width: size + 10, align: 'center' });
  }

  private buildBillToSection(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations) {
    const pageWidth = doc.page.width;
    const leftMargin = 60;
    const startY = 140;

    // Horizontal separator line
    doc
      .strokeColor(COLORS.border)
      .lineWidth(1)
      .moveTo(leftMargin, startY - 10)
      .lineTo(pageWidth - leftMargin, startY - 10)
      .stroke();

    // Bill To label
    doc
      .fontSize(11)
      .fillColor(COLORS.primary)
      .font('Helvetica-Bold')
      .text('Bill To', leftMargin, startY);

    // Client name/company
    const clientName = invoice.client?.company ||
      (invoice.client
        ? `${invoice.client.firstName} ${invoice.client.lastName}`
        : 'Client Name');

    doc
      .fontSize(11)
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text(clientName, leftMargin, startY + 18);

    // Invoice Date on the right
    doc
      .fontSize(11)
      .fillColor(COLORS.primary)
      .font('Helvetica-Bold')
      .text('Invoice Date', pageWidth - 200, startY);

    doc
      .fontSize(11)
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text(this.formatDate(invoice.issueDate), pageWidth - 120, startY);
  }

  private buildDescriptionTable(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations): number {
    const pageWidth = doc.page.width;
    const leftMargin = 60;
    const rightMargin = 60;
    const tableWidth = pageWidth - leftMargin - rightMargin;
    const amountColWidth = 100;
    const descColWidth = tableWidth - amountColWidth;
    const startY = 200;

    // Table header background
    doc
      .fillColor(COLORS.tableHeader)
      .rect(leftMargin, startY, tableWidth, 30)
      .fill();

    // Table header text
    doc
      .fontSize(11)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('Description', leftMargin + 10, startY + 9)
      .text('Amount', leftMargin + descColWidth + 10, startY + 9);

    // Table content
    let currentY = startY + 35;

    // Main item - Project description
    const projectName = invoice.project?.name || 'Design Services';
    const description = `${projectName}\n\nProject services as agreed.`;

    // Draw description cell with border
    doc
      .strokeColor(COLORS.border)
      .rect(leftMargin, currentY - 5, descColWidth, 80)
      .stroke();

    doc
      .fontSize(10)
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text(description, leftMargin + 10, currentY, {
        width: descColWidth - 20,
        lineGap: 3,
      });

    // Amount cell
    doc
      .strokeColor(COLORS.border)
      .rect(leftMargin + descColWidth, currentY - 5, amountColWidth, 80)
      .stroke();

    doc
      .fontSize(10)
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text(this.formatCurrency(invoice.subtotal), leftMargin + descColWidth + 10, currentY);

    currentY += 80;

    // Additional items if any
    if (invoice.items && invoice.items.length > 0) {
      for (const item of invoice.items) {
        // Description cell
        doc
          .strokeColor(COLORS.border)
          .rect(leftMargin, currentY - 5, descColWidth, 60)
          .stroke();

        doc
          .fontSize(10)
          .fillColor(COLORS.text)
          .font('Helvetica')
          .text(item.description, leftMargin + 10, currentY, {
            width: descColWidth - 20,
            lineGap: 3,
          });

        // Amount cell
        doc
          .strokeColor(COLORS.border)
          .rect(leftMargin + descColWidth, currentY - 5, amountColWidth, 60)
          .stroke();

        doc
          .fontSize(10)
          .fillColor(COLORS.text)
          .font('Helvetica')
          .text(this.formatCurrency(item.amount), leftMargin + descColWidth + 10, currentY);

        currentY += 60;
      }
    }

    return currentY;
  }

  private buildTotal(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations, tableEndY: number) {
    const pageWidth = doc.page.width;
    const rightMargin = 60;
    const totalY = tableEndY + 30;

    // Total label and amount
    doc
      .fontSize(14)
      .fillColor(COLORS.text)
      .font('Helvetica-Bold')
      .text('Total', pageWidth - 250, totalY)
      .text(`$${this.formatCurrency(invoice.totalAmount)}`, pageWidth - rightMargin - 100, totalY, {
        width: 100,
        align: 'right',
      });

    // If there's a balance due (partial payment)
    const amountPaid = Number(invoice.amountPaid || 0);
    if (amountPaid > 0 && amountPaid < Number(invoice.totalAmount)) {
      const balance = Number(invoice.totalAmount) - amountPaid;

      doc
        .fontSize(10)
        .fillColor(COLORS.lightText)
        .font('Helvetica')
        .text(`Amount Paid: $${this.formatCurrency(amountPaid)}`, pageWidth - 250, totalY + 25);

      doc
        .fontSize(12)
        .fillColor(COLORS.paid)
        .font('Helvetica-Bold')
        .text(`Balance Due: $${this.formatCurrency(balance)}`, pageWidth - 250, totalY + 45);
    }
  }

  private drawPaidStamp(doc: PDFKit.PDFDocument, x: number, y: number, width: number) {
    const height = width * 0.5;
    const borderRadius = 8;

    doc.save();

    // Rotate slightly for stamp effect
    doc.rotate(-15, { origin: [x + width / 2, y + height / 2] });

    // Outer border (double line effect)
    doc
      .strokeColor(COLORS.paid)
      .lineWidth(3)
      .roundedRect(x, y, width, height, borderRadius)
      .stroke();

    doc
      .strokeColor(COLORS.paid)
      .lineWidth(1)
      .roundedRect(x + 5, y + 5, width - 10, height - 10, borderRadius - 2)
      .stroke();

    // PAID text
    doc
      .fontSize(width * 0.35)
      .fillColor(COLORS.paid)
      .font('Helvetica-Bold')
      .text('PAID', x, y + height * 0.25, {
        width: width,
        align: 'center',
      });

    doc.restore();
  }

  private drawVerticalInvoiceText(doc: PDFKit.PDFDocument, invoice: InvoiceWithRelations) {
    doc.save();

    const pageHeight = doc.page.height;
    const x = 25;
    const y = pageHeight / 2;

    // Rotate 90 degrees counter-clockwise
    doc.rotate(-90, { origin: [x, y] });

    // Invoice label with project name
    const label = `Invoice ${invoice.invoiceNumber}`;
    doc
      .fontSize(14)
      .fillColor(COLORS.primary)
      .font('Helvetica-Bold')
      .text(label, x - 100, y - 10, { width: 200 });

    doc.restore();
  }

  private formatCurrency(amount: number | Decimal): string {
    const numAmount = typeof amount === 'number' ? amount : Number(amount);
    return numAmount.toFixed(2);
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }
}

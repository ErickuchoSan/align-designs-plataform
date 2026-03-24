import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Row,
  Column,
  Preview,
} from '@react-email/components';
import * as React from 'react';

interface InvoiceEmailProps {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
}

/**
 * Format amount as USD currency
 */
function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

/**
 * Format date in a readable format
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const invoiceStyles = {
  body: {
    backgroundColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    margin: '0',
    padding: '0',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
    padding: '40px 20px',
    textAlign: 'center' as const,
    borderRadius: '10px 10px 0 0',
  },
  headerTitle: {
    color: '#ffffff',
    margin: '0',
    fontSize: '32px',
    fontWeight: 'bold' as const,
  },
  headerSubtitle: {
    color: '#d4af37',
    margin: '10px 0 0 0',
    fontSize: '14px',
  },
  content: {
    backgroundColor: '#ffffff',
    padding: '40px 30px',
    border: '1px solid #e0e0e0',
    borderTop: 'none',
  },
  contentTitle: {
    color: '#1e3a5f',
    margin: '0 0 20px 0',
    fontSize: '24px',
  },
  paragraph: {
    color: '#333333',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
  },
  detailsBox: {
    backgroundColor: '#f8f9fa',
    borderLeft: '4px solid #d4af37',
    padding: '20px',
    margin: '30px 0',
    borderRadius: '4px',
  },
  detailRow: {
    padding: '8px 0',
  },
  detailLabel: {
    color: '#666666',
    fontSize: '14px',
  },
  detailValue: {
    color: '#1e3a5f',
    fontWeight: 'bold' as const,
    fontSize: '14px',
    textAlign: 'right' as const,
  },
  amountValue: {
    color: '#1e3a5f',
    fontWeight: 'bold' as const,
    fontSize: '18px',
    textAlign: 'right' as const,
  },
  dueDateValue: {
    color: '#dc3545',
    fontWeight: 'bold' as const,
    fontSize: '14px',
    textAlign: 'right' as const,
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    padding: '15px',
    margin: '20px 0',
  },
  warningText: {
    color: '#856404',
    margin: '0',
    fontSize: '14px',
  },
  signature: {
    color: '#666666',
    fontSize: '14px',
    margin: '0',
  },
  signatureName: {
    color: '#1e3a5f',
    fontWeight: 'bold' as const,
  },
  footer: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    textAlign: 'center' as const,
    borderRadius: '0 0 10px 10px',
    border: '1px solid #e0e0e0',
    borderTop: 'none',
  },
  footerText: {
    color: '#999999',
    fontSize: '12px',
    margin: '0',
  },
};

/**
 * Invoice email with premium styling
 * Note: PDF attachment is handled separately in the email service
 */
export function InvoiceEmail({
  clientName,
  invoiceNumber,
  amount,
  dueDate,
}: InvoiceEmailProps) {
  const formattedAmount = formatCurrency(amount);
  const formattedDueDate = formatDate(dueDate);

  return (
    <Html>
      <Head />
      <Preview>
        Invoice {invoiceNumber} from Align Designs - {formattedAmount} Due
      </Preview>
      <Body style={invoiceStyles.body}>
        <Container style={invoiceStyles.container}>
          {/* Header */}
          <Section style={invoiceStyles.header}>
            <Text style={invoiceStyles.headerTitle}>Align Designs</Text>
            <Text style={invoiceStyles.headerSubtitle}>
              Professional Design Solutions
            </Text>
          </Section>

          {/* Content */}
          <Section style={invoiceStyles.content}>
            <Text style={invoiceStyles.contentTitle}>New Invoice</Text>

            <Text style={invoiceStyles.paragraph}>Dear {clientName},</Text>

            <Text style={invoiceStyles.paragraph}>
              Thank you for choosing Align Designs! We&apos;ve generated a new
              invoice for your project.
            </Text>

            {/* Invoice Details */}
            <Section style={invoiceStyles.detailsBox}>
              <Row style={invoiceStyles.detailRow}>
                <Column style={invoiceStyles.detailLabel}>
                  Invoice Number:
                </Column>
                <Column style={invoiceStyles.detailValue}>
                  {invoiceNumber}
                </Column>
              </Row>
              <Row style={invoiceStyles.detailRow}>
                <Column style={invoiceStyles.detailLabel}>Amount Due:</Column>
                <Column style={invoiceStyles.amountValue}>
                  {formattedAmount}
                </Column>
              </Row>
              <Row style={invoiceStyles.detailRow}>
                <Column style={invoiceStyles.detailLabel}>Due Date:</Column>
                <Column style={invoiceStyles.dueDateValue}>
                  {formattedDueDate}
                </Column>
              </Row>
            </Section>

            <Text style={invoiceStyles.paragraph}>
              Please find your detailed invoice attached to this email as a PDF
              document.
            </Text>

            {/* Payment Warning */}
            <Section style={invoiceStyles.warningBox}>
              <Text style={invoiceStyles.warningText}>
                <strong>Payment Instructions:</strong>
                <br />
                Please include your invoice number <strong>
                  {invoiceNumber}
                </strong>{' '}
                in the payment reference.
              </Text>
            </Section>

            <Text style={{ ...invoiceStyles.paragraph, marginTop: '30px' }}>
              Thank you for your business!
            </Text>

            <Text style={invoiceStyles.signature}>
              Best regards,
              <br />
              <span style={invoiceStyles.signatureName}>
                The Align Designs Team
              </span>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={invoiceStyles.footer}>
            <Text style={invoiceStyles.footerText}>
              Align Designs | Professional Design Solutions
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default InvoiceEmail;

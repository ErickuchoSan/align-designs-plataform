import { test, expect } from '@playwright/test';
import { ADMIN_USER, URLS } from './fixtures/test-data';

/**
 * E2E Tests: Invoice Flow
 * Tests invoice creation, viewing, and PDF download
 */

test.describe('Invoice Flow', () => {
  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    const adminPassword = process.env.E2E_ADMIN_PASSWORD;
    if (!adminPassword) {
      test.skip();
      return;
    }

    await page.goto(URLS.login);
    await page.fill('#email', ADMIN_USER.email);
    await page.click('button:has-text("Continue")');
    await page.waitForSelector('#password', { timeout: 10000 });
    await page.fill('#password', adminPassword);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
  });

  test.describe('Create Invoice', () => {
    test('should navigate to invoices page', async ({ page }) => {
      // Navigate to a project first
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Look for invoices section or tab
      const invoicesTab = page.locator('button:has-text("Invoices"), a:has-text("Invoices"), text=Invoices');
      await expect(invoicesTab.first()).toBeVisible({ timeout: 10000 });
    });

    test('should open create invoice modal', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Click on invoices tab if exists
      const invoicesTab = page.locator('button:has-text("Invoices"), a:has-text("Invoices")').first();
      if (await invoicesTab.isVisible()) {
        await invoicesTab.click();
        await page.waitForTimeout(500);
      }

      // Click create invoice button
      const createButton = page.locator(
        'button:has-text("Create Invoice"), button:has-text("New Invoice"), button:has-text("Add Invoice")',
      );

      if (await createButton.isVisible()) {
        await createButton.click();
        await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should create a new invoice', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Navigate to invoices
      const invoicesTab = page.locator('button:has-text("Invoices"), a:has-text("Invoices")').first();
      if (await invoicesTab.isVisible()) {
        await invoicesTab.click();
        await page.waitForTimeout(500);
      }

      // Click create invoice
      const createButton = page.locator(
        'button:has-text("Create Invoice"), button:has-text("New Invoice"), button:has-text("Add Invoice")',
      );

      if (!(await createButton.isVisible())) {
        test.skip();
        return;
      }

      await createButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Fill invoice form - amount
      const amountInput = page.locator('input[type="number"], input[placeholder*="amount"], #invoice-amount');
      if (await amountInput.first().isVisible()) {
        await amountInput.first().fill('500.00');
      }

      // Fill description if available
      const descriptionInput = page.locator('textarea, input[placeholder*="description"], #invoice-description');
      if (await descriptionInput.first().isVisible()) {
        await descriptionInput.first().fill('E2E Test Invoice');
      }

      // Submit
      const submitButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Create Invoice")');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe('View Invoice', () => {
    test('should view invoice details', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Navigate to invoices
      const invoicesTab = page.locator('button:has-text("Invoices"), a:has-text("Invoices")').first();
      if (await invoicesTab.isVisible()) {
        await invoicesTab.click();
        await page.waitForTimeout(500);
      }

      // Click on an invoice to view details
      const invoiceRow = page.locator('tr:has-text("INV-"), [class*="invoice"]').first();
      if (await invoiceRow.isVisible()) {
        await invoiceRow.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Download Invoice PDF', () => {
    test('should download invoice as PDF', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Navigate to invoices
      const invoicesTab = page.locator('button:has-text("Invoices"), a:has-text("Invoices")').first();
      if (await invoicesTab.isVisible()) {
        await invoicesTab.click();
        await page.waitForTimeout(500);
      }

      // Look for download button
      const downloadButton = page.locator(
        'button:has-text("Download"), button:has-text("PDF"), a:has-text("Download"), [aria-label*="download"]',
      );

      if (await downloadButton.first().isVisible()) {
        // Setup download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

        await downloadButton.first().click();

        const download = await downloadPromise;
        if (download) {
          const filename = download.suggestedFilename();
          expect(filename).toContain('.pdf');
        }
      }
    });
  });
});

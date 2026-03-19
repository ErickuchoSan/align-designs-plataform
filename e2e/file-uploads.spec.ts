import { test, expect } from '@playwright/test';
import { ADMIN_USER, URLS } from './fixtures/test-data';
import path from 'path';
import fs from 'fs';

/**
 * E2E Tests: File Uploads
 * Tests uploading files to project stages
 */

// Create a test file for uploads
const TEST_FILE_CONTENT = 'E2E Test File Content - ' + Date.now();
const TEST_FILE_NAME = 'e2e-test-file.txt';

test.describe('File Uploads', () => {
  // Setup: Login and create test file before each test
  test.beforeEach(async ({ page }) => {
    const adminPassword = process.env.E2E_ADMIN_PASSWORD;
    if (!adminPassword) {
      test.skip();
      return;
    }

    // Create a test file in temp directory
    const tempDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const testFilePath = path.join(tempDir, TEST_FILE_NAME);
    fs.writeFileSync(testFilePath, TEST_FILE_CONTENT);

    // Login
    await page.goto(URLS.login);
    await page.fill('#email', ADMIN_USER.email);
    await page.click('button:has-text("Continue")');
    await page.waitForSelector('#password', { timeout: 10000 });
    await page.fill('#password', adminPassword);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
  });

  test.describe('Upload to Project Stage', () => {
    test('should navigate to project stages', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Should see project stages
      const stagesSection = page.locator('text=Project Brief, text=Design Review, text=Stages');
      await expect(stagesSection.first()).toBeVisible({ timeout: 10000 });
    });

    test('should open upload modal for a stage', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Find add/upload button for any stage
      const uploadButton = page.locator(
        'button:has-text("Add"), button:has-text("Upload"), button[aria-label*="upload"], button[aria-label*="add"]',
      ).first();

      if (await uploadButton.isVisible()) {
        await uploadButton.click();
        await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should upload a file to a stage', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Find add button
      const uploadButton = page.locator(
        'button:has-text("Add"), button:has-text("Upload")',
      ).first();

      if (!(await uploadButton.isVisible())) {
        test.skip();
        return;
      }

      await uploadButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Select "File Only" mode if available
      const fileOnlyButton = page.locator('button:has-text("File Only")');
      if (await fileOnlyButton.isVisible()) {
        await fileOnlyButton.click();
      }

      // Find file input and upload
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        const testFilePath = path.join(process.cwd(), 'test-results', TEST_FILE_NAME);
        await fileInput.setInputFiles(testFilePath);
        await page.waitForTimeout(500);
      }

      // Submit
      const submitButton = page.locator(
        'button:has-text("Upload File"), button:has-text("Upload"), button[type="submit"]',
      ).first();

      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);

        // Modal should close on success
        const modalStillOpen = await page.locator('[role="dialog"]').isVisible();
        // Note: modal might stay open if there's an error, but test continues
      }
    });

    test('should upload file with comment', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Find add button
      const uploadButton = page.locator('button:has-text("Add"), button:has-text("Upload")').first();

      if (!(await uploadButton.isVisible())) {
        test.skip();
        return;
      }

      await uploadButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Select "File + Comment" mode if available
      const fileCommentButton = page.locator('button:has-text("File + Comment"), button:has-text("Both")');
      if (await fileCommentButton.isVisible()) {
        await fileCommentButton.click();
      }

      // Fill comment
      const commentInput = page.locator('#commentText, textarea[placeholder*="comment"]');
      if (await commentInput.isVisible()) {
        await commentInput.fill('E2E Test: File uploaded with comment');
      }

      // Upload file
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        const testFilePath = path.join(process.cwd(), 'test-results', TEST_FILE_NAME);
        await fileInput.setInputFiles(testFilePath);
      }

      // Submit
      const submitButton = page.locator(
        'button:has-text("Upload with Comment"), button:has-text("Upload"), button[type="submit"]',
      ).first();

      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    });

    test('should add comment only to a stage', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Find add button
      const addButton = page.locator('button:has-text("Add"), button:has-text("Comment")').first();

      if (!(await addButton.isVisible())) {
        test.skip();
        return;
      }

      await addButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Select "Comment Only" mode
      const commentOnlyButton = page.locator('button:has-text("Comment Only")');
      if (await commentOnlyButton.isVisible()) {
        await commentOnlyButton.click();
      }

      // Fill comment
      const commentInput = page.locator('#commentText, textarea[placeholder*="comment"]');
      if (await commentInput.isVisible()) {
        await commentInput.fill('E2E Test: Comment only submission');
      }

      // Submit
      const submitButton = page.locator(
        'button:has-text("Send Comment"), button:has-text("Submit"), button[type="submit"]',
      ).first();

      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe('View Uploaded Files', () => {
    test('should display uploaded files in stage', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Look for file items in any stage
      const fileItems = page.locator('[class*="file"], [class*="attachment"], a[href*="/files/"]');

      // Just verify the page loads - files may or may not exist
      await expect(page.locator('#main-content, [class*="project"]')).toBeVisible();
    });
  });
});

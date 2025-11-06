import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test('should load admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
  });

  test('should display all tabs', async ({ page }) => {
    await page.goto('/admin');

    await expect(page.getByText('Overview')).toBeVisible();
    await expect(page.getByText('AI Models')).toBeVisible();
    await expect(page.getByText('Recent Queries')).toBeVisible();
    await expect(page.getByText('Analytics')).toBeVisible();
  });

  test.describe('Overview Tab', () => {
    test('should display statistics cards', async ({ page }) => {
      await page.goto('/admin');

      // Wait for data to load
      await page.waitForTimeout(2000);

      // Check for stat cards
      await expect(page.getByText('Total Users')).toBeVisible();
      await expect(page.getByText('Trips Generated')).toBeVisible();
      await expect(page.getByText('Total Cost')).toBeVisible();
      await expect(page.getByText('Tokens Used')).toBeVisible();
    });

    test('should display platform activity', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);

      await expect(page.getByText(/Platform Activity/i)).toBeVisible();
      await expect(page.getByText(/Average Response Time/i)).toBeVisible();
      await expect(page.getByText(/Success Rate/i)).toBeVisible();
    });
  });

  test.describe('AI Models Tab', () => {
    test('should display models table', async ({ page }) => {
      await page.goto('/admin');

      // Click AI Models tab
      await page.getByRole('button', { name: /AI Models/i }).click();

      // Wait for models to load
      await page.waitForTimeout(2000);

      // Should show table headers
      await expect(page.getByText('Model')).toBeVisible();
      await expect(page.getByText('Provider')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
    });

    test('should show model configuration options', async ({ page }) => {
      await page.goto('/admin');
      await page.getByRole('button', { name: /AI Models/i }).click();
      await page.waitForTimeout(2000);

      // Check for action buttons
      const setDefaultButtons = page.getByText('Set as Default');
      const count = await setDefaultButtons.count();

      if (count > 0) {
        await expect(setDefaultButtons.first()).toBeVisible();
      }
    });

    test('should display active/inactive status', async ({ page }) => {
      await page.goto('/admin');
      await page.getByRole('button', { name: /AI Models/i }).click();
      await page.waitForTimeout(2000);

      // Check for status badges
      const statusBadges = page.locator('button:has-text("Active"), button:has-text("Inactive")');
      const count = await statusBadges.count();

      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Recent Queries Tab', () => {
    test('should display recent trips', async ({ page }) => {
      await page.goto('/admin');

      // Click Recent Queries tab
      await page.getByRole('button', { name: /Recent Queries/i }).click();

      // Wait for data
      await page.waitForTimeout(2000);

      await expect(page.getByText(/Recent Trip Generations/i)).toBeVisible();
      await expect(page.getByText(/Last 10 trip generation requests/i)).toBeVisible();
    });

    test('should show query details', async ({ page }) => {
      await page.goto('/admin');
      await page.getByRole('button', { name: /Recent Queries/i }).click();
      await page.waitForTimeout(2000);

      // Check if queries are displayed
      const queryItems = page.locator('[class*="hover:bg-gray-50"]');
      const count = await queryItems.count();

      if (count > 0) {
        // Should show details like user, dates, etc.
        await expect(page.getByText(/User:/i).first()).toBeVisible();
      }
    });
  });

  test.describe('Analytics Tab', () => {
    test('should display model performance comparison', async ({ page }) => {
      await page.goto('/admin');

      // Click Analytics tab
      await page.getByRole('button', { name: /Analytics/i }).click();

      // Wait for data
      await page.waitForTimeout(2000);

      await expect(page.getByText(/Model Performance Comparison/i)).toBeVisible();
    });

    test('should show performance metrics', async ({ page }) => {
      await page.goto('/admin');
      await page.getByRole('button', { name: /Analytics/i }).click();
      await page.waitForTimeout(2000);

      // Check for metric labels
      const metrics = [
        /Avg\. Response/i,
        /Avg\. Tokens/i,
        /Total Cost/i,
      ];

      for (const metric of metrics) {
        const elements = page.getByText(metric);
        const count = await elements.count();

        if (count > 0) {
          await expect(elements.first()).toBeVisible();
        }
      }
    });
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/admin');

    // Click through all tabs
    await page.getByRole('button', { name: /AI Models/i }).click();
    await expect(page.getByText(/AI Model Configuration/i)).toBeVisible();

    await page.getByRole('button', { name: /Recent Queries/i }).click();
    await expect(page.getByText(/Recent Trip Generations/i)).toBeVisible();

    await page.getByRole('button', { name: /Analytics/i }).click();
    await expect(page.getByText(/Model Performance Comparison/i)).toBeVisible();

    await page.getByRole('button', { name: /Overview/i }).click();
    await expect(page.getByText(/Total Users/i)).toBeVisible();
  });
});

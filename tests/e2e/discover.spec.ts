import { test, expect } from '@playwright/test';

test.describe('Discover Page', () => {
  test('should load discover page', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.locator('h1')).toContainText('Discover Amazing Trips');
  });

  test('should display filter controls', async ({ page }) => {
    await page.goto('/discover');

    // Check all filter elements are present
    await expect(page.getByPlaceholder('Search by city...')).toBeVisible();
    await expect(page.getByRole('combobox').first()).toBeVisible(); // Travel type dropdown
    await expect(page.getByText(/Most Recent/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Apply Filters/i })).toBeVisible();
  });

  test('should filter by city', async ({ page }) => {
    await page.goto('/discover');

    // Enter city name
    await page.getByPlaceholder('Search by city...').fill('Paris');

    // Apply filters
    await page.getByRole('button', { name: /Apply Filters/i }).click();

    // Wait for results to load
    await page.waitForTimeout(1000);

    // Should have updated URL or shown filtered results
    expect(page.url()).toContain('city=Paris');
  });

  test('should change sort order', async ({ page }) => {
    await page.goto('/discover');

    // Find sort dropdown by its text content
    const sortDropdown = page.locator('select').filter({ hasText: /Most Recent/i });

    // Change to Most Popular
    await sortDropdown.selectOption('popular');

    // Apply filters
    await page.getByRole('button', { name: /Apply Filters/i }).click();

    // Wait for results
    await page.waitForTimeout(1000);
  });

  test('should display trip cards', async ({ page }) => {
    await page.goto('/discover');

    // Wait for trips to load (assuming there are trips)
    await page.waitForTimeout(2000);

    // Check for trip card elements (if trips exist)
    const tripCards = page.locator('[class*="bg-white rounded-xl shadow"]');
    const count = await tripCards.count();

    if (count > 0) {
      // Should show at least one trip
      await expect(tripCards.first()).toBeVisible();
    } else {
      // Should show "no trips" message
      await expect(page.getByText(/No trips found/i)).toBeVisible();
    }
  });

  test('should show pagination when there are many trips', async ({ page }) => {
    await page.goto('/discover');
    await page.waitForTimeout(2000);

    // Check if pagination exists
    const pagination = page.getByText(/Page \d+ of \d+/);
    if (await pagination.isVisible()) {
      await expect(page.getByRole('button', { name: /Previous/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Next/i })).toBeVisible();
    }
  });

  test('should navigate to trip detail when clicking card', async ({ page }) => {
    await page.goto('/discover');
    await page.waitForTimeout(2000);

    const tripCards = page.locator('[class*="bg-white rounded-xl shadow"]');
    const count = await tripCards.count();

    if (count > 0) {
      await tripCards.first().click();

      // Should navigate to trip detail page
      await page.waitForURL(/\/trips\/.+/);
      expect(page.url()).toMatch(/\/trips\/.+/);
    }
  });
});

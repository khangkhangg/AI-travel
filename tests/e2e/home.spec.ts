import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AI Travel Planner/);
    await expect(page.locator('h2')).toContainText('Plan Your Perfect Trip with AI');
  });

  test('should display features section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Smart Recommendations')).toBeVisible();
    await expect(page.getByText('Day-by-Day Planning')).toBeVisible();
    await expect(page.getByText('Collaborate & Share')).toBeVisible();
  });

  test('should display trip generation form', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Tell us about your trip')).toBeVisible();
    await expect(page.getByLabel('Start Date')).toBeVisible();
    await expect(page.getByLabel('End Date')).toBeVisible();
    await expect(page.getByLabel('Number of People')).toBeVisible();
  });

  test('should show navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('My Trips')).toBeVisible();
    await expect(page.getByText('Discover')).toBeVisible();
    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByText('Login')).toBeVisible();
  });

  test('should show validation error when submitting empty form', async ({ page }) => {
    await page.goto('/');

    // Click submit without filling form
    await page.getByRole('button', { name: /Generate My Itinerary/i }).click();

    // Should show error
    await expect(page.getByText(/Please select travel dates/i)).toBeVisible();
  });

  test('should require travel type selection', async ({ page }) => {
    await page.goto('/');

    // Fill some fields but not travel type
    await page.getByLabel('Start Date').fill('2025-12-01');
    await page.getByLabel('End Date').fill('2025-12-05');
    await page.getByLabel('Number of People').fill('2');

    await page.getByRole('button', { name: /Generate My Itinerary/i }).click();

    // Should show error about travel type
    await expect(page.getByText(/Please select at least one travel type/i)).toBeVisible();
  });

  test('should toggle travel type selections', async ({ page }) => {
    await page.goto('/');

    const funButton = page.getByRole('button', { name: 'Fun' });

    // Initially not selected
    await expect(funButton).not.toHaveClass(/bg-blue-600/);

    // Click to select
    await funButton.click();
    await expect(funButton).toHaveClass(/bg-blue-600/);

    // Click again to deselect
    await funButton.click();
    await expect(funButton).not.toHaveClass(/bg-blue-600/);
  });

  test('should show free tier limitation message', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Free users: 1 trip, then 1 per month/i)).toBeVisible();
  });
});

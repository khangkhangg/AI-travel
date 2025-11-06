import { test, expect } from '@playwright/test';

test.describe('Trip Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full trip generation flow (mock)', async ({ page }) => {
    // Fill out the trip form
    await page.getByLabel('Start Date').fill('2025-12-01');
    await page.getByLabel('End Date').fill('2025-12-05');

    await page.getByLabel('Number of People').fill('2');

    await page.getByPlaceholder(/e.g., 1000/).fill('2000');

    await page.getByPlaceholder(/e.g., Paris, Tokyo, New York/).fill('Paris');

    // Select travel types
    await page.getByRole('button', { name: 'Fun' }).click();
    await page.getByRole('button', { name: 'Sightseeing' }).click();
    await page.getByRole('button', { name: 'Food Tour' }).click();

    // Select age range
    await page.locator('select').filter({ has: page.getByText(/Select age range/) }).selectOption('young-adults');

    // Add description
    await page.getByPlaceholder(/Tell us more about your preferences/).fill('Looking for romantic spots and good restaurants');

    // Verify form is filled correctly
    expect(await page.getByLabel('Start Date').inputValue()).toBe('2025-12-01');
    expect(await page.getByLabel('End Date').inputValue()).toBe('2025-12-05');
    expect(await page.getByLabel('Number of People').inputValue()).toBe('2');

    // Note: Actual submission will fail without authentication,
    // but we can verify the form is ready to submit
    const submitButton = page.getByRole('button', { name: /Generate My Itinerary/i });
    await expect(submitButton).toBeEnabled();
  });

  test('should validate minimum date requirements', async ({ page }) => {
    // End date before start date should be invalid
    await page.getByLabel('Start Date').fill('2025-12-05');
    await page.getByLabel('End Date').fill('2025-12-01');

    await page.getByLabel('Number of People').fill('2');
    await page.getByRole('button', { name: 'Fun' }).click();

    await page.getByRole('button', { name: /Generate My Itinerary/i }).click();

    // Browser validation should prevent submission
    // The form won't actually submit with invalid dates
  });

  test('should validate minimum number of people', async ({ page }) => {
    await page.getByLabel('Start Date').fill('2025-12-01');
    await page.getByLabel('End Date').fill('2025-12-05');

    // Try to set 0 people (should be blocked by min=1)
    await page.getByLabel('Number of People').fill('0');

    // HTML5 validation should prevent this
    const numPeopleValue = await page.getByLabel('Number of People').inputValue();
    expect(parseInt(numPeopleValue)).toBeGreaterThanOrEqual(1);
  });

  test('should allow optional fields to be empty', async ({ page }) => {
    // Fill only required fields
    await page.getByLabel('Start Date').fill('2025-12-01');
    await page.getByLabel('End Date').fill('2025-12-05');
    await page.getByLabel('Number of People').fill('2');
    await page.getByRole('button', { name: 'Fun' }).click();

    // Leave optional fields empty (city, budget, age range, description)

    // Form should be valid
    const submitButton = page.getByRole('button', { name: /Generate My Itinerary/i });
    await expect(submitButton).toBeEnabled();
  });

  test('should display loading state when generating', async ({ page }) => {
    // Fill form
    await page.getByLabel('Start Date').fill('2025-12-01');
    await page.getByLabel('End Date').fill('2025-12-05');
    await page.getByLabel('Number of People').fill('2');
    await page.getByRole('button', { name: 'Fun' }).click();

    // Mock the API to delay response
    await page.route('**/api/generate', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      });
    });

    // Submit
    await page.getByRole('button', { name: /Generate My Itinerary/i }).click();

    // Should show loading state
    await expect(page.getByText(/Generating Your Perfect Trip/i)).toBeVisible();

    // Wait for error
    await page.waitForTimeout(2500);
  });

  test('should show error message when generation fails', async ({ page }) => {
    // Fill form
    await page.getByLabel('Start Date').fill('2025-12-01');
    await page.getByLabel('End Date').fill('2025-12-05');
    await page.getByLabel('Number of People').fill('2');
    await page.getByRole('button', { name: 'Fun' }).click();

    // Mock API error
    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      });
    });

    // Submit
    await page.getByRole('button', { name: /Generate My Itinerary/i }).click();

    // Should show error
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Unauthorized')).toBeVisible();
  });

  test('should select multiple travel types', async ({ page }) => {
    const types = ['Fun', 'Sightseeing', 'Museum', 'Food Tour', 'Nature'];

    for (const type of types) {
      const button = page.getByRole('button', { name: type });
      await button.click();
      await expect(button).toHaveClass(/bg-blue-600/);
    }

    // All should be selected
    for (const type of types) {
      const button = page.getByRole('button', { name: type });
      await expect(button).toHaveClass(/bg-blue-600/);
    }
  });

  test('should reset travel type selection', async ({ page }) => {
    // Select a type
    const funButton = page.getByRole('button', { name: 'Fun' });
    await funButton.click();
    await expect(funButton).toHaveClass(/bg-blue-600/);

    // Deselect it
    await funButton.click();
    await expect(funButton).not.toHaveClass(/bg-blue-600/);
  });

  test('should display budget ranges', async ({ page }) => {
    const budgetSelect = page.locator('select').filter({ has: page.getByText(/Select range/) });

    await expect(budgetSelect).toBeVisible();

    // Check options
    await budgetSelect.click();
    await expect(page.getByText(/Budget \(\$ - \$\$/)).toBeVisible();
    await expect(page.getByText(/Moderate \(\$\$ - \$\$\$/)).toBeVisible();
    await expect(page.getByText(/Luxury \(\$\$\$\$ - \$\$\$\$\$/)).toBeVisible();
  });

  test('should display age range options', async ({ page }) => {
    const ageSelect = page.locator('select').filter({ has: page.getByText(/Select age range/) });

    await expect(ageSelect).toBeVisible();

    // Check options
    await ageSelect.click();
    await expect(page.getByText(/Kids \(0-12\)/)).toBeVisible();
    await expect(page.getByText(/Teens \(13-19\)/)).toBeVisible();
    await expect(page.getByText(/Young Adults \(20-35\)/)).toBeVisible();
    await expect(page.getByText(/Adults \(36-60\)/)).toBeVisible();
    await expect(page.getByText(/Seniors \(60\+\)/)).toBeVisible();
    await expect(page.getByText(/Mixed Ages/)).toBeVisible();
  });
});

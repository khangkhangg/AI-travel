# Testing Guide

Comprehensive testing documentation for AI Travel Planner.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [API Tests](#api-tests)
- [E2E Tests](#e2e-tests)
- [CI/CD](#cicd)
- [Writing Tests](#writing-tests)

## Overview

This project uses **Playwright** for both API integration tests and end-to-end UI tests. All tests are automated and run in CI/CD on every push and pull request.

### Test Coverage

- ✅ API Integration Tests
- ✅ End-to-End UI Tests
- ✅ Form Validation Tests
- ✅ Admin Dashboard Tests
- ✅ Discovery Page Tests
- ✅ Trip Generation Flow

## Test Structure

```
tests/
├── api/              # API integration tests
│   └── trips.test.ts # Trip-related API tests
└── e2e/              # End-to-end UI tests
    ├── home.spec.ts            # Home page tests
    ├── discover.spec.ts        # Discover page tests
    ├── admin.spec.ts           # Admin dashboard tests
    └── trip-generation.spec.ts # Trip generation flow tests
```

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# API tests only
npm run test:api

# E2E tests only
npm run test:e2e

# Run with UI mode (interactive)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed
```

### View Test Report

```bash
# After tests run, view HTML report
npm run test:report
```

### Debug Tests

```bash
# Run tests in debug mode
npx playwright test --debug

# Run specific test file
npx playwright test tests/e2e/home.spec.ts

# Run tests matching pattern
npx playwright test -g "should load"
```

## API Tests

API tests validate backend endpoints and business logic.

### Covered Endpoints

- ✅ `GET /api/discover` - Public trip discovery with filters
- ✅ `POST /api/generate` - Trip generation (requires auth)
- ✅ `GET /api/admin/models` - AI model list
- ✅ `GET /api/admin/stats` - Platform statistics
- ✅ `GET /api/admin/model-performance` - Model analytics
- ✅ `GET /api/admin/queries` - Recent queries

### Example API Test

```typescript
test('should return public trips', async ({ request }) => {
  const response = await request.get(`${API_BASE_URL}/api/discover`);

  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(data).toHaveProperty('trips');
  expect(data).toHaveProperty('pagination');
});
```

### Running API Tests

```bash
# All API tests
npm run test:api

# Specific test file
npx playwright test tests/api/trips.test.ts

# With verbose output
npx playwright test tests/api --reporter=list
```

## E2E Tests

End-to-end tests validate the full user experience in a real browser.

### Test Categories

#### 1. Home Page Tests (`home.spec.ts`)

- Page loads correctly
- Features section displays
- Trip form renders
- Navigation works
- Form validation
- Travel type selection

**Run:**
```bash
npx playwright test tests/e2e/home.spec.ts
```

#### 2. Discover Page Tests (`discover.spec.ts`)

- Page loads with filters
- City search works
- Travel type filtering
- Sort order changes
- Pagination works
- Trip card navigation

**Run:**
```bash
npx playwright test tests/e2e/discover.spec.ts
```

#### 3. Admin Dashboard Tests (`admin.spec.ts`)

- Dashboard loads
- All tabs work
- Statistics display
- Model configuration
- Recent queries view
- Analytics charts

**Run:**
```bash
npx playwright test tests/e2e/admin.spec.ts
```

#### 4. Trip Generation Tests (`trip-generation.spec.ts`)

- Form validation
- Complete generation flow
- Loading states
- Error handling
- Multiple travel types
- Optional fields

**Run:**
```bash
npx playwright test tests/e2e/trip-generation.spec.ts
```

### Example E2E Test

```typescript
test('should complete trip form', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Start Date').fill('2025-12-01');
  await page.getByLabel('End Date').fill('2025-12-05');
  await page.getByLabel('Number of People').fill('2');

  await page.getByRole('button', { name: 'Fun' }).click();

  const submitButton = page.getByRole('button', { name: /Generate/i });
  await expect(submitButton).toBeEnabled();
});
```

## CI/CD

### GitHub Actions Workflow

Tests run automatically on:
- Push to `main`, `develop`, or `claude/**` branches
- Pull requests to `main` or `develop`

### Workflow Steps

1. **Setup** - Checkout, Node.js, PostgreSQL
2. **Database** - Create test database and run migrations
3. **Install** - Dependencies and Playwright browsers
4. **Build** - Build Next.js application
5. **Test** - Run API and E2E tests
6. **Report** - Upload test results and screenshots

### View Test Results

- Go to **Actions** tab in GitHub
- Click on latest workflow run
- Download artifacts:
  - `playwright-report` - Full HTML report
  - `test-screenshots` - Screenshots from failed tests

### Environment Variables

Set these secrets in GitHub repository settings:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Optional (for authenticated tests):
```bash
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test-password
```

## Writing Tests

### Best Practices

#### 1. Use Descriptive Test Names

```typescript
// ✅ Good
test('should display error when submitting form without travel type', async ({ page }) => {

// ❌ Bad
test('form test', async ({ page }) => {
```

#### 2. Use Page Object Model (Optional)

```typescript
class TripFormPage {
  constructor(private page: Page) {}

  async fillForm(data: TripFormData) {
    await this.page.getByLabel('Start Date').fill(data.startDate);
    await this.page.getByLabel('End Date').fill(data.endDate);
    // ...
  }

  async submit() {
    await this.page.getByRole('button', { name: /Generate/i }).click();
  }
}
```

#### 3. Wait for Elements

```typescript
// ✅ Good - Wait for element
await expect(page.getByText('Success')).toBeVisible();

// ❌ Bad - Don't use arbitrary timeouts
await page.waitForTimeout(5000);
```

#### 4. Use Meaningful Selectors

```typescript
// ✅ Good - Accessible selectors
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
page.getByText('Welcome')

// ❌ Bad - Fragile selectors
page.locator('.btn-primary')
page.locator('#submit-btn')
```

#### 5. Mock External APIs

```typescript
test('should handle API error', async ({ page }) => {
  await page.route('**/api/generate', route => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server error' })
    });
  });

  // Test error handling
});
```

### Adding New Tests

#### 1. Create Test File

```bash
# API test
touch tests/api/new-feature.test.ts

# E2E test
touch tests/e2e/new-feature.spec.ts
```

#### 2. Write Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('New Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/new-feature');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });

  test('should handle error case', async ({ page }) => {
    // Error test
  });
});
```

#### 3. Run Your Tests

```bash
npx playwright test tests/e2e/new-feature.spec.ts
```

#### 4. Debug If Needed

```bash
npx playwright test tests/e2e/new-feature.spec.ts --debug
```

## Test Configuration

### Playwright Config

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Custom Test Helpers

```typescript
// tests/helpers/auth.ts
export async function loginAsUser(page: Page) {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}
```

## Troubleshooting

### Tests Failing Locally

#### 1. Database Not Set Up

```bash
# Create test database
createdb ai_travel_test

# Run migrations
psql ai_travel_test < lib/db/schema.sql
```

#### 2. Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

#### 3. Playwright Not Installed

```bash
npx playwright install chromium
```

### Tests Failing in CI

#### 1. Check Environment Variables

Ensure all required secrets are set in GitHub repository settings.

#### 2. View Logs

Click on failed job in GitHub Actions to see detailed logs.

#### 3. Download Artifacts

Download `playwright-report` and `test-screenshots` to debug visually.

## Performance Testing

### Measuring Test Speed

```bash
# Run with timing
npx playwright test --reporter=list

# Profile test
npx playwright test --trace=on
```

### Optimizing Tests

1. Run tests in parallel (default)
2. Use `test.describe.serial()` for dependent tests
3. Reuse browser context when possible
4. Mock slow APIs

## Coverage Reports

### Generate Coverage (Future)

```bash
# Install coverage tool
npm install -D @playwright/coverage

# Run with coverage
npm run test:coverage
```

## Maintenance

### Update Playwright

```bash
npm update @playwright/test
npx playwright install chromium
```

### Update Snapshots

```bash
npx playwright test --update-snapshots
```

### Clear Test Cache

```bash
rm -rf test-results playwright-report .playwright
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library](https://testing-library.com/)
- [GitHub Actions](https://docs.github.com/en/actions)

## Support

For test-related issues:
1. Check this guide
2. Review test logs
3. Open GitHub issue with:
   - Test command used
   - Error message
   - Screenshots (if UI test)
   - Environment details

Happy Testing! 🧪

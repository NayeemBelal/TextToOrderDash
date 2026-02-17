import { test, expect } from '@playwright/test';

test.describe('AI Productivity Insight Card', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
  });

  test('should display AI Productivity Insight card', async ({ page }) => {
    // Check that the card is visible
    const insightCard = page.locator('text=AI Productivity Insight');
    await expect(insightCard).toBeVisible();

    // Check for the AI emoji
    const emoji = page.locator('text=✨');
    await expect(emoji).toBeVisible();
  });

  test('should show correct time savings for 1H filter', async ({ page }) => {
    await page.getByRole('button', { name: '1H' }).click();

    // Wait for loading to complete
    await page.waitForTimeout(700);

    // Should show minutes for 1H
    const insight = page.locator('text=/.*48 minutes.*this hour.*/');
    await expect(insight).toBeVisible();
  });

  test('should show correct time savings for 24H filter', async ({ page }) => {
    await page.getByRole('button', { name: '24H' }).click();

    // Wait for loading to complete
    await page.waitForTimeout(700);

    // Should show hours for 24H
    const insight = page.locator('text=/.*5\\.7 hours.*today.*/');
    await expect(insight).toBeVisible();
  });

  test('should show correct time savings for 1W filter', async ({ page }) => {
    await page.getByRole('button', { name: '1W' }).click();

    // Wait for loading to complete
    await page.waitForTimeout(700);

    // Should show hours for 1W
    const insight = page.locator('text=/.*39\\.7 hours.*this week.*/');
    await expect(insight).toBeVisible();
  });

  test('should show correct time savings for 1M filter', async ({ page }) => {
    await page.getByRole('button', { name: '1M' }).click();

    // Wait for loading to complete
    await page.waitForTimeout(700);

    // Should show hours for 1M
    const insight = page.locator('text=/.*170 hours.*this month.*/');
    await expect(insight).toBeVisible();
  });

  test('should display shimmer effect when changing filters', async ({ page }) => {
    // Click a filter button
    await page.getByRole('button', { name: '1W' }).click();

    // Immediately check for shimmer/loading state
    // The shimmer uses animate-pulse class
    const shimmerElement = page.locator('.animate-pulse').first();

    // Should be visible during the loading state (600ms)
    await expect(shimmerElement).toBeVisible({ timeout: 100 });

    // Should disappear after loading completes
    await expect(shimmerElement).not.toBeVisible({ timeout: 1000 });
  });

  test('should work in light mode', async ({ page }) => {
    // Ensure we're in light mode
    const darkModeButton = page.getByRole('button', { name: 'Toggle dark mode' });
    const isDarkMode = await darkModeButton.getAttribute('aria-pressed');

    if (isDarkMode === 'true') {
      await darkModeButton.click();
      await page.waitForTimeout(300);
    }

    // Check card styling in light mode
    const insightCard = page.locator('text=AI Productivity Insight').locator('..');
    await expect(insightCard).toHaveClass(/bg-gray-50/);
  });

  test('should work in dark mode', async ({ page }) => {
    // Toggle to dark mode
    const darkModeButton = page.getByRole('button', { name: 'Toggle dark mode' });
    await darkModeButton.click();
    await page.waitForTimeout(300);

    // Check that the insight card is visible and styled correctly
    const insightCard = page.locator('text=AI Productivity Insight');
    await expect(insightCard).toBeVisible();

    // In dark mode, the card should have dark background classes
    const cardContainer = page.locator('text=AI Productivity Insight').locator('..');
    await expect(cardContainer).toHaveClass(/dark:bg-gray-900/);
  });

  test('should update when switching between all filters', async ({ page }) => {
    const filters = [
      { name: '1H', text: /48 minutes.*this hour/ },
      { name: '24H', text: /5\.7 hours.*today/ },
      { name: '1W', text: /39\.7 hours.*this week/ },
      { name: '1M', text: /170 hours.*this month/ }
    ];

    for (const filter of filters) {
      await page.getByRole('button', { name: filter.name }).click();
      await page.waitForTimeout(700);

      const insight = page.locator(`text=${filter.text}`);
      await expect(insight).toBeVisible();
    }
  });

  test('should be positioned below the chart', async ({ page }) => {
    const chart = page.locator('img').first(); // Chart is rendered as img
    const insightCard = page.locator('text=AI Productivity Insight').locator('..');

    const chartBox = await chart.boundingBox();
    const insightBox = await insightCard.boundingBox();

    // Insight card should be below the chart
    expect(insightBox!.y).toBeGreaterThan(chartBox!.y);
  });

  test('should have full width', async ({ page }) => {
    const insightCard = page.locator('text=AI Productivity Insight').locator('../..');

    // Check for full width class
    await expect(insightCard).toHaveClass(/w-full/);
  });
});

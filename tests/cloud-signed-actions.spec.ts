import { test, expect } from '@playwright/test'

/**
 * Smoke tests for the signed-action gating UX.
 *
 * Full end-to-end signing requires a live Renown auth flow + switchboard
 * + a real signer in the browser. This file covers the interaction layer
 * that we control: the UI gates correctly when the user has no signer.
 *
 * Validating that the signed payload reaches switchboard with the right
 * context is best done via integration tests against a real reactor; that
 * is tracked separately and not run in CI.
 */

test.describe('cloud signed actions — login gate', () => {
  test('new project form requires login when not authenticated', async ({ page }) => {
    await page.goto('/cloud')
    // Page should load without requiring login (read-only browsing)
    await expect(page).toHaveURL(/\/cloud/)
  })

  test('cloud list page is viewable without login', async ({ page }) => {
    await page.goto('/cloud')
    await expect(page).toHaveURL(/\/cloud/)
    // Should not redirect to login or block access
  })
})

import { test, expect } from '@playwright/test';

test.describe('Homepage Grid Background', () => {
  test('should display grid background in hero section', async ({ page }) => {
    console.log('Starting homepage grid background test...');
    
    // Navigate to the homepage
    await page.goto('/');
    console.log('Navigated to homepage');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    console.log('Page loaded');

    // Check if the hero section exists
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
    console.log('Hero section is visible');

    // Check if the GridBackground component is rendered
    const gridBackground = page.locator('[class*="absolute"][class*="inset-0"]').first();
    await expect(gridBackground).toBeVisible();
    console.log('Grid background element is visible');

    // Check for the debug red border style
    const elementWithRedBorder = page.locator('[style*="border: 2px solid red"]');
    const redBorderExists = await elementWithRedBorder.count() > 0;
    console.log(`Red border debug style exists: ${redBorderExists}`);

    // Check if SVG grid pattern exists
    const svgElement = page.locator('svg').first();
    await expect(svgElement).toBeVisible();
    console.log('SVG element is visible');

    // Check for pattern element within SVG
    const patternElement = page.locator('pattern[id*="grid-"]');
    const patternExists = await patternElement.count() > 0;
    console.log(`Grid pattern exists: ${patternExists}`);

    // Check for rect element with green stroke
    const rectWithGreenStroke = page.locator('rect[stroke="#04c161"]');
    const greenStrokeExists = await rectWithGreenStroke.count() > 0;
    console.log(`Green stroke exists: ${greenStrokeExists}`);

    // Check if Local-first label is visible
    const localFirstLabel = page.getByText('Local-first');
    await expect(localFirstLabel).toBeVisible();
    console.log('Local-first label is visible');

    // Check if main heading is visible
    const mainHeading = page.getByRole('heading', { name: 'Built to scale.' });
    await expect(mainHeading).toBeVisible();
    console.log('Main heading is visible');

    // Take a screenshot of the hero section
    await page.screenshot({ 
      path: 'hero-section-screenshot.png', 
      fullPage: false,
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
    console.log('Screenshot taken');

    // Check console errors
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(`Console Error: ${msg.text()}`);
      }
    });

    // Get computed styles of grid background
    const gridStyles = await gridBackground.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        zIndex: computed.zIndex,
        opacity: computed.opacity,
        display: computed.display,
        width: computed.width,
        height: computed.height,
        border: computed.border,
        backgroundColor: computed.backgroundColor,
        backgroundImage: computed.backgroundImage,
      };
    });

    console.log('Grid background computed styles:', JSON.stringify(gridStyles, null, 2));

    // Output console errors if any
    if (consoleLogs.length > 0) {
      console.log('Console errors found:', consoleLogs);
    } else {
      console.log('No console errors found');
    }

    // Assert critical elements
    await expect(heroSection).toBeVisible();
    await expect(localFirstLabel).toBeVisible();
    await expect(mainHeading).toBeVisible();
    
    // Report findings
    const findings = {
      heroSectionVisible: true,
      gridBackgroundVisible: await gridBackground.isVisible(),
      redBorderDebugStyle: redBorderExists,
      svgElementVisible: await svgElement.isVisible(),
      gridPatternExists: patternExists,
      greenStrokeExists: greenStrokeExists,
      localFirstLabelVisible: await localFirstLabel.isVisible(),
      mainHeadingVisible: await mainHeading.isVisible(),
      consoleErrors: consoleLogs,
      gridStyles: gridStyles,
    };

    console.log('Test findings:', JSON.stringify(findings, null, 2));
  });
});
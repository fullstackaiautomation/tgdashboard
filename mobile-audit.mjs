import { chromium } from 'playwright';

async function auditMobileSpacing() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  console.log('Mobile Audit Starting...\n');
  console.log('Device: iPhone X (375x812)\n');

  const pages = [
    { name: 'Calendar', tab: 'Calendar' },
    { name: 'Tasks Hub', tab: 'Tasks Hub' },
    { name: 'Business Projects', tab: 'Business Projects' },
    { name: 'Content Library', tab: 'Content Library' },
    { name: 'Finance', tab: 'Finance' }
  ];

  await page.goto('http://localhost:5002');
  await page.waitForTimeout(2000);

  for (const pageInfo of pages) {
    console.log(`\nAuditing: ${pageInfo.name}`);
    console.log('----------------------------------------');

    try {
      await page.click(`text=${pageInfo.tab}`);
      await page.waitForTimeout(1500);

      const dimensions = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;

        return {
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          bodyWidth: body.scrollWidth,
          bodyHeight: body.scrollHeight,
          documentWidth: html.scrollWidth,
          hasHorizontalScroll: body.scrollWidth > window.innerWidth
        };
      });

      console.log('Dimensions:');
      console.log(`  Viewport: ${dimensions.viewportWidth}x${dimensions.viewportHeight}`);
      console.log(`  Body: ${dimensions.bodyWidth}x${dimensions.bodyHeight}`);

      if (dimensions.hasHorizontalScroll) {
        console.log(`  WARNING: HORIZONTAL OVERFLOW - ${dimensions.bodyWidth - dimensions.viewportWidth}px too wide!`);
      } else {
        console.log('  OK: No horizontal overflow');
      }

      const overflowElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const viewportWidth = window.innerWidth;
        const overflowing = [];

        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > viewportWidth + 10) {
            const styles = window.getComputedStyle(el);
            overflowing.push({
              tag: el.tagName.toLowerCase(),
              class: el.className,
              width: Math.round(rect.width),
              right: Math.round(rect.right),
              overflow: Math.round(rect.right - viewportWidth),
              padding: `${styles.paddingLeft} ${styles.paddingRight}`
            });
          }
        });

        return overflowing.slice(0, 5);
      });

      if (overflowElements.length > 0) {
        console.log(`\nTop Overflowing Elements:`);
        overflowElements.forEach((el, i) => {
          console.log(`  ${i + 1}. <${el.tag}> ${el.class ? `class="${el.class.substring(0, 50)}"` : ''}`);
          console.log(`     Width: ${el.width}px, Overflow: ${el.overflow}px`);
        });
      }

    } catch (error) {
      console.log(`Error auditing ${pageInfo.name}: ${error.message}`);
    }
  }

  console.log('\n\nAudit Complete!');

  await page.waitForTimeout(3000);
  await browser.close();
}

auditMobileSpacing();

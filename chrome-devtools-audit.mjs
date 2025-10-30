import CDP from 'chrome-remote-interface';

async function auditMobileSpacing() {
  try {
    const client = await CDP({ port: 9222 });
    const { Page, Runtime, Emulation } = client;

    await Page.enable();
    await Runtime.enable();

    console.log('\n📱 Mobile Spacing Audit\n');
    console.log('='.repeat(60));

    // Set mobile viewport (iPhone X)
    await Emulation.setDeviceMetricsOverride({
      width: 375,
      height: 812,
      deviceScaleFactor: 3,
      mobile: true
    });

    console.log('✅ Set mobile viewport: 375x812 (iPhone X)\n');

    // Wait a moment for page to adjust
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get overflow information
    const result = await Runtime.evaluate({
      expression: `
        (function() {
          const viewportWidth = window.innerWidth;
          const bodyWidth = document.body.scrollWidth;
          const hasOverflow = bodyWidth > viewportWidth;

          const overflowingElements = [];
          const allElements = Array.from(document.querySelectorAll('*'));

          allElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > viewportWidth + 5) {
              const styles = window.getComputedStyle(el);
              overflowingElements.push({
                tag: el.tagName,
                class: el.className,
                id: el.id,
                width: Math.round(rect.width),
                right: Math.round(rect.right),
                overflow: Math.round(rect.right - viewportWidth),
                computedWidth: styles.width,
                minWidth: styles.minWidth,
                maxWidth: styles.maxWidth,
                padding: styles.padding,
                margin: styles.margin
              });
            }
          });

          return {
            viewportWidth,
            bodyWidth,
            hasOverflow,
            overflowAmount: hasOverflow ? bodyWidth - viewportWidth : 0,
            overflowingElements: overflowingElements.slice(0, 10)
          };
        })()
      `,
      returnByValue: true
    });

    const data = result.result.value;

    console.log('📊 Page Dimensions:');
    console.log(`  Viewport Width: ${data.viewportWidth}px`);
    console.log(`  Body Width: ${data.bodyWidth}px`);

    if (data.hasOverflow) {
      console.log(`  ⚠️  HORIZONTAL OVERFLOW: ${data.overflowAmount}px\n`);

      if (data.overflowingElements.length > 0) {
        console.log('🔍 Overflowing Elements:\n');
        data.overflowingElements.forEach((el, i) => {
          console.log(`${i + 1}. <${el.tag}>${el.class ? ` class="${el.class.substring(0, 50)}"` : ''}${el.id ? ` id="${el.id}"` : ''}`);
          console.log(`   Width: ${el.width}px | Overflow: ${el.overflow}px`);
          console.log(`   Computed Width: ${el.computedWidth}`);
          if (el.minWidth !== 'none' && el.minWidth !== '0px') {
            console.log(`   Min-Width: ${el.minWidth}`);
          }
          if (el.maxWidth !== 'none') {
            console.log(`   Max-Width: ${el.maxWidth}`);
          }
          console.log(`   Padding: ${el.padding}`);
          console.log('');
        });
      }
    } else {
      console.log('  ✅ No horizontal overflow!\n');
    }

    console.log('='.repeat(60));
    console.log('\n💡 Tip: Navigate to different pages in the browser and run this again to audit each page.\n');

    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. Chrome is running with remote debugging on port 9222');
    console.log('2. You have navigated to the page you want to audit');
  }
}

auditMobileSpacing();

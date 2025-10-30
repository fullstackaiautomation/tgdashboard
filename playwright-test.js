const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Navigating to localhost:5000...');
  await page.goto('http://localhost:5000');
  
  console.log('Waiting for page to load...');
  await page.waitForTimeout(3000);
  
  // Click on Content Library tab
  console.log('Clicking Content Library tab...');
  await page.click('text=Content Library');
  await page.waitForTimeout(2000);
  
  // Find the first Notebook dropdown
  console.log('Looking for Notebook dropdown...');
  const dropdown = await page.locator('select').first();
  
  // Get current value
  const currentValue = await dropdown.inputValue();
  console.log('Current dropdown value:', currentValue);
  
  // Try to change it
  console.log('Changing dropdown to "Yes"...');
  await dropdown.selectOption('yes');
  await page.waitForTimeout(1000);
  
  // Check if it changed
  const newValue = await dropdown.inputValue();
  console.log('New dropdown value:', newValue);
  
  if (newValue === 'yes') {
    console.log('✅ Dropdown changed successfully!');
  } else {
    console.log('❌ Dropdown did NOT change. Still:', newValue);
  }
  
  // Keep browser open to inspect
  console.log('Waiting 10 seconds before closing...');
  await page.waitForTimeout(10000);
  
  await browser.close();
})();

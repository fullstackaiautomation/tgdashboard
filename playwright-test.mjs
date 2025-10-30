import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen to console messages
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  console.log('Navigating to localhost:5002...');
  await page.goto('http://localhost:5002');
  
  console.log('Waiting for page to load...');
  await page.waitForTimeout(2000);
  
  // Click on Content Library tab
  console.log('Clicking Content Library tab...');
  const contentLibTab = await page.locator('text=Content Library').first();
  await contentLibTab.click();
  await page.waitForTimeout(2000);
  
  // Find the Notebook column header to verify we're in the right place
  console.log('Looking for Notebook column...');
  const notebookHeader = await page.locator('text=Notebook').first();
  if (await notebookHeader.isVisible()) {
    console.log('✓ Found Notebook column');
  }
  
  // Find all select dropdowns in the table
  const allSelects = await page.locator('select').all();
  console.log('Found', allSelects.length, 'select elements');
  
  // Find the first Notebook dropdown (should be after TG Rating input)
  let notebookDropdown = null;
  for (let i = 0; i < allSelects.length; i++) {
    const options = await allSelects[i].locator('option').allTextContents();
    if (options.includes('No') && options.includes('Yes') && options.includes('Should')) {
      notebookDropdown = allSelects[i];
      console.log('Found Notebook dropdown at index', i);
      break;
    }
  }
  
  if (notebookDropdown) {
    // Get current value
    const currentValue = await notebookDropdown.inputValue();
    console.log('Current dropdown value:', currentValue);
    
    // Try to change it to a different value
    const newOptionValue = currentValue === 'no' ? 'yes' : 'no';
    console.log(`Attempting to change dropdown from "${currentValue}" to "${newOptionValue}"...`);
    
    await notebookDropdown.selectOption(newOptionValue);
    await page.waitForTimeout(2000);
    
    // Check if it changed in the UI
    const valueAfterChange = await notebookDropdown.inputValue();
    console.log('Dropdown value after change attempt:', valueAfterChange);
    
    if (valueAfterChange === newOptionValue) {
      console.log('✅ Dropdown UI changed successfully!');
    } else {
      console.log('❌ Dropdown UI did NOT change. Still shows:', valueAfterChange);
    }
    
    // Wait a bit more to see if it reverts
    await page.waitForTimeout(2000);
    const finalValue = await notebookDropdown.inputValue();
    console.log('Final dropdown value after 2 more seconds:', finalValue);
  } else {
    console.log('❌ Could not find Notebook dropdown');
  }
  
  console.log('\nKeeping browser open for 5 seconds for inspection...');
  await page.waitForTimeout(5000);
  
  await browser.close();
  console.log('Test complete');
})();

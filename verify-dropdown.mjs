import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Notebook dropdown') || text.includes('Error')) {
      console.log('BROWSER:', text);
    }
  });
  
  console.log('Navigating to localhost:5002...');
  await page.goto('http://localhost:5002');
  await page.waitForTimeout(2000);
  
  // Click on Content Library tab
  console.log('Opening Content Library...');
  await page.click('text=Content Library');
  await page.waitForTimeout(2000);
  
  // Find first Notebook dropdown
  const allSelects = await page.locator('select').all();
  let notebookDropdown = null;
  
  for (let i = 0; i < allSelects.length; i++) {
    const options = await allSelects[i].locator('option').allTextContents();
    if (options.includes('No') && options.includes('Yes') && options.includes('Should')) {
      notebookDropdown = allSelects[i];
      break;
    }
  }
  
  if (notebookDropdown) {
    const before = await notebookDropdown.inputValue();
    console.log('Current value:', before);
    
    const newValue = before === 'no' ? 'yes' : 'no';
    console.log(`Changing to: ${newValue}`);
    
    await notebookDropdown.selectOption(newValue);
    await page.waitForTimeout(2000);
    
    const after = await notebookDropdown.inputValue();
    console.log('Value after change:', after);
    
    if (after === newValue) {
      console.log('✅ SUCCESS! Dropdown is working correctly!');
    } else {
      console.log('❌ FAILED! Dropdown did not change.');
    }
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
})();

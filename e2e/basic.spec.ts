import { test, expect } from '@playwright/test';
import { ExtensionPage } from './utils/test-helpers';

test('basic extension loading test', async ({ page }) => {
  const extensionPage = new ExtensionPage(page);
  
  // Load the extension
  await extensionPage.loadExtension();
  
  // Verify basic elements are present
  await expect(extensionPage.createButton).toBeVisible();
  await expect(extensionPage.searchInput).toBeVisible();
  await expect(extensionPage.noteEditor).toBeVisible();
  
  console.log('✅ Extension loaded successfully!');
}); 
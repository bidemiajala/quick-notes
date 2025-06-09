import { test, expect } from '@playwright/test';
import { ExtensionPage, TestDataManager } from './utils/test-helpers';

test.describe('Quick Notes Extension - Working Functionality', () => {
  let extensionPage: ExtensionPage;

  test.beforeEach(async ({ page }) => {
    extensionPage = new ExtensionPage(page);
    await extensionPage.loadExtension();
  });

  test('should load extension with all required UI elements', async () => {
    await expect(extensionPage.createButton).toBeVisible();
    await expect(extensionPage.createButton).toContainText('Create');
    await expect(extensionPage.searchInput).toBeVisible();
    await expect(extensionPage.themeToggle).toBeVisible();
    await expect(extensionPage.sidebar).toBeVisible();
    await expect(extensionPage.noteEditor).toBeVisible();
    await expect(extensionPage.charCount).toBeVisible();
  });

  test('should display correct initial state', async () => {
    const theme = await extensionPage.getCurrentTheme();
    expect(theme).toBe('dark');

    const noteCount = await extensionPage.getNoteCount();
    expect(noteCount).toBeGreaterThan(0);

    await expect(extensionPage.charCount).toContainText('0/500');
  });

  test('should toggle between themes', async () => {
    const initialTheme = await extensionPage.getCurrentTheme();
    
    await extensionPage.toggleTheme();
    const newTheme = await extensionPage.getCurrentTheme();
    expect(newTheme).not.toBe(initialTheme);
    
    await extensionPage.toggleTheme();
    const finalTheme = await extensionPage.getCurrentTheme();
    expect(finalTheme).toBe(initialTheme);
  });

  test('should create new note', async () => {
    const initialCount = await extensionPage.getNoteCount();
    
    await extensionPage.createNote();
    
    const newCount = await extensionPage.getNoteCount();
    expect(newCount).toBe(initialCount + 1);
  });

  test('should create note with content', async () => {
    const testContent = TestDataManager.TEST_NOTES.medium;

    await extensionPage.createNote(testContent);

    await expect(extensionPage.noteEditor).toHaveValue(testContent);
    await expect(extensionPage.charCount).toContainText(`${testContent.length}/500`);
  });

  test('should handle different note content types', async () => {
    const testCases = [
      { name: 'short note', content: TestDataManager.TEST_NOTES.short },
      { name: 'special characters', content: TestDataManager.TEST_NOTES.special },
      { name: 'unicode content', content: TestDataManager.TEST_NOTES.unicode }
    ];

    for (const testCase of testCases) {
      await test.step(`Testing ${testCase.name}`, async () => {
        await extensionPage.noteEditor.fill(testCase.content);
        await expect(extensionPage.noteEditor).toHaveValue(testCase.content);
      });
    }
  });

  test('should enforce character limit', async () => {
    const overLimitContent = TestDataManager.TEST_NOTES.overLimit;
    
    await extensionPage.noteEditor.fill(overLimitContent);
    
    const actualValue = await extensionPage.noteEditor.inputValue();
    expect(actualValue.length).toBe(500);
    
    await expect(extensionPage.charCount).toContainText('Limit reached');
  });

  test('should show character count updates', async () => {
    const testContent = 'Test content for character counting';
    
    await extensionPage.noteEditor.fill(testContent);
    
    await expect(extensionPage.charCount).toContainText(`${testContent.length}/500`);
  });

  test('should show character limit warning', async () => {
    const nearLimitContent = TestDataManager.TEST_NOTES.long;

    await extensionPage.noteEditor.fill(nearLimitContent);

    if (nearLimitContent.length > 450) {
      await expect(extensionPage.charCount).toContainText('Approaching limit');
    }
  });
});

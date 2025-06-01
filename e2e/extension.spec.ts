import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';

let context: BrowserContext;
let extensionPage: Page;

test.beforeAll(async () => {
  const pathToExtension = path.join(__dirname, '../dist');
  
  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--no-first-run',
      '--disable-default-apps',
      '--disable-component-extensions-with-background-pages'
    ],
  });

  const extensionId = 'your-extension-id';
  extensionPage = await context.newPage();
  
  await extensionPage.goto('chrome://extensions/');
  await extensionPage.waitForTimeout(1000);
});

test.afterAll(async () => {
  await context.close();
});

test.describe('Quick Notes Extension', () => {
  test.beforeEach(async () => {
    await extensionPage.goto('chrome://newtab/');
    await extensionPage.waitForTimeout(500);
  });

  test('should load extension popup with default state', async () => {
    await extensionPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="../dist/popup.css">
        </head>
        <body>
          <div id="root"></div>
          <script src="../dist/popup.js"></script>
        </body>
      </html>
    `);
    
    await extensionPage.waitForSelector('.app-container');
    
    await expect(extensionPage.locator('.new-note-btn')).toBeVisible();
    await expect(extensionPage.locator('#search-input')).toBeVisible();
    await expect(extensionPage.locator('.theme-toggle-switch')).toBeVisible();
  });

  test('should toggle between light and dark themes', async () => {
    await extensionPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="../dist/popup.css">
        </head>
        <body>
          <div id="root"></div>
          <script src="../dist/popup.js"></script>
        </body>
      </html>
    `);
    
    await extensionPage.waitForSelector('.app-container');
    
    await expect(extensionPage.locator('.app-container')).toHaveClass(/theme-dark/);
    
    await extensionPage.click('.theme-toggle-switch input');
    await expect(extensionPage.locator('.app-container')).toHaveClass(/theme-light/);
    
    await extensionPage.click('.theme-toggle-switch input');
    await expect(extensionPage.locator('.app-container')).toHaveClass(/theme-dark/);
  });

  test('should create new notes', async () => {
    await extensionPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="../dist/popup.css">
        </head>
        <body>
          <div id="root"></div>
          <script src="../dist/popup.js"></script>
        </body>
      </html>
    `);
    
    await extensionPage.waitForSelector('.app-container');
    
    await extensionPage.click('.new-note-btn');
    
    await expect(extensionPage.locator('.note-tab')).toHaveCount(12);
    
    await expect(extensionPage.locator('.note-editor textarea')).toBeVisible();
  });

  test('should allow typing in note editor', async () => {
    await extensionPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="../dist/popup.css">
        </head>
        <body>
          <div id="root"></div>
          <script src="../dist/popup.js"></script>
        </body>
      </html>
    `);
    
    await extensionPage.waitForSelector('.app-container');
    
    const testContent = 'This is a test note content';
    
    await extensionPage.fill('.note-editor textarea', testContent);
    
    await expect(extensionPage.locator('.note-editor textarea')).toHaveValue(testContent);
    
    await expect(extensionPage.locator('.char-count')).toContainText(`${testContent.length}/500`);
  });

  test('should enforce character limit', async () => {
    await extensionPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="../dist/popup.css">
        </head>
        <body>
          <div id="root"></div>
          <script src="../dist/popup.js"></script>
        </body>
      </html>
    `);
    
    await extensionPage.waitForSelector('.app-container');
    
    const longContent = 'A'.repeat(600);
    
    await extensionPage.fill('.note-editor textarea', longContent);
    
    const actualValue = await extensionPage.locator('.note-editor textarea').inputValue();
    expect(actualValue.length).toBe(500);
    
    await expect(extensionPage.locator('.char-count .warning')).toContainText('Limit reached');
  });

  test('should delete notes', async () => {
    await extensionPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="../dist/popup.css">
        </head>
        <body>
          <div id="root"></div>
          <script src="../dist/popup.js"></script>
        </body>
      </html>
    `);
    
    await extensionPage.waitForSelector('.app-container');
    
    await extensionPage.fill('.note-editor textarea', 'Note to be deleted');
    await extensionPage.waitForTimeout(600);
    
    const initialNoteCount = await extensionPage.locator('.note-tab').count();
    
    await extensionPage.click('.note-tab .delete-note-btn');
    
    const finalNoteCount = await extensionPage.locator('.note-tab').count();
    expect(finalNoteCount).toBe(initialNoteCount - 1);
  });

  test('should search and filter notes', async () => {
    await extensionPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="../dist/popup.css">
        </head>
        <body>
          <div id="root"></div>
          <script src="../dist/popup.js"></script>
        </body>
      </html>
    `);
    
    await extensionPage.waitForSelector('.app-container');
    
    await extensionPage.fill('.note-editor textarea', 'First unique note');
    await extensionPage.waitForTimeout(600);
    
    await extensionPage.click('.new-note-btn');
    await extensionPage.fill('.note-editor textarea', 'Second different note');
    await extensionPage.waitForTimeout(600);
    
    await extensionPage.fill('#search-input', 'unique');
    
    const visibleNotes = await extensionPage.locator('.note-tab').count();
    expect(visibleNotes).toBe(1);
    
    await extensionPage.fill('#search-input', '');
    
    const allNotes = await extensionPage.locator('.note-tab').count();
    expect(allNotes).toBeGreaterThan(1);
  });

  test('should show empty state for search with no results', async () => {
    await extensionPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="../dist/popup.css">
        </head>
        <body>
          <div id="root"></div>
          <script src="../dist/popup.js"></script>
        </body>
      </html>
    `);
    
    await extensionPage.waitForSelector('.app-container');
    
    await extensionPage.fill('#search-input', 'nonexistenttext12345');
    
    await expect(extensionPage.locator('.sidebar p')).toContainText('Note not found');
  });

  test('should retain notes after page reload', async () => {
    await extensionPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="../dist/popup.css">
        </head>
        <body>
          <div id="root"></div>
          <script src="../dist/popup.js"></script>
        </body>
      </html>
    `);
    
    await extensionPage.waitForSelector('.app-container');
    
    const testContent = 'Persistent note content';
    
    await extensionPage.fill('.note-editor textarea', testContent);
    await extensionPage.waitForTimeout(600);
    
    await extensionPage.reload();
    await extensionPage.waitForSelector('.app-container');
    
    await expect(extensionPage.locator('.note-editor textarea')).toHaveValue(testContent);
  });

  test('should switch between notes', async () => {
    await extensionPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="../dist/popup.css">
        </head>
        <body>
          <div id="root"></div>
          <script src="../dist/popup.js"></script>
        </body>
      </html>
    `);
    
    await extensionPage.waitForSelector('.app-container');
    
    await extensionPage.fill('.note-editor textarea', 'First note content');
    await extensionPage.waitForTimeout(600);
    
    await extensionPage.click('.new-note-btn');
    await extensionPage.fill('.note-editor textarea', 'Second note content');
    await extensionPage.waitForTimeout(600);
    
    await extensionPage.click('.note-tab:first-child');
    
    await expect(extensionPage.locator('.note-editor textarea')).toHaveValue('First note content');
    
    await extensionPage.click('.note-tab:nth-child(2)');
    
    await expect(extensionPage.locator('.note-editor textarea')).toHaveValue('Second note content');
  });

  test('should respect keyboard shortcuts', async () => {
    await extensionPage.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="../dist/popup.css">
        </head>
        <body>
          <div id="root"></div>
          <script src="../dist/popup.js"></script>
        </body>
      </html>
    `);
    
    await extensionPage.waitForSelector('.app-container');
    
    const initialNoteCount = await extensionPage.locator('.note-tab').count();
    
    await extensionPage.keyboard.press('Control+n');
    
    const newNoteCount = await extensionPage.locator('.note-tab').count();
    expect(newNoteCount).toBe(initialNoteCount + 1);
    
    await extensionPage.keyboard.press('Control+f');
    
    await expect(extensionPage.locator('#search-input')).toBeFocused();
  });
}); 
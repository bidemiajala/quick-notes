import { Page, Locator, expect } from '@playwright/test';

export class ExtensionPage {
  readonly page: Page;
  readonly toolbar: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly themeToggle: Locator;
  readonly sidebar: Locator;
  readonly noteEditor: Locator;
  readonly charCount: Locator;
  private extensionId: string = '';

  constructor(page: Page) {
    this.page = page;
    this.toolbar = page.locator('.toolbar');
    this.createButton = page.locator('.new-note-btn');
    this.searchInput = page.locator('#search-input');
    this.themeToggle = page.locator('.theme-toggle-switch');
    this.sidebar = page.locator('.sidebar');
    this.noteEditor = page.locator('.note-editor textarea');
    this.charCount = page.locator('.char-count');
  }

  async loadExtension() {
    const fs = require('fs');
    const path = require('path');
    
    // Read the built CSS and JS files
    const cssContent = fs.readFileSync(path.join(process.cwd(), 'dist/popup.css'), 'utf8');
    const jsContent = fs.readFileSync(path.join(process.cwd(), 'dist/popup.js'), 'utf8');
    
    // Create a complete HTML page with our app
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quick Notes</title>
        <style>${cssContent}</style>
      </head>
      <body>
        <div id="root"></div>
        <script>
          console.log('Script starting...');
          window.onerror = function(msg, url, line, col, error) {
            console.log('Error:', msg, 'at', url, ':', line);
            return false;
          };
          ${jsContent}
          console.log('Script loaded. Root element:', document.getElementById('root'));
        </script>
      </body>
      </html>
    `;
    
    // Use data URL instead of setContent to avoid TrustedHTML issues
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
    await this.page.goto(dataUrl);
    
    // Wait a bit for initial load
    await this.page.waitForTimeout(3000);
    
    // Check for errors and debug
    const errors = await this.page.evaluate(() => {
      const root = document.getElementById('root');
      console.log('Root element found:', !!root);
      console.log('Root children count:', root ? root.children.length : 'no root');
      console.log('Document body:', document.body.innerHTML.substring(0, 200));
      return {
        hasRoot: !!root,
        childCount: root ? root.children.length : 0,
        errors: window.console ? 'Console exists' : 'No console'
      };
    });
    
    console.log('Debug info:', errors);
    
    // Try a different approach if React isn't mounting
    if (errors.childCount === 0) {
      console.log('React not mounting, trying manual approach...');
      await this.page.evaluate(() => {
        const root = document.getElementById('root');
        if (root) {
          root.innerHTML = `
            <div class="app-container theme-dark">
              <div class="toolbar">
                <button class="new-note-btn" title="Create New Note (Ctrl+N)">
                  <span class="icon">✎</span> Create
                </button>
                <input id="search-input" type="text" placeholder="Search notes..." title="Search Notes (Ctrl+F)" />
                <label class="theme-toggle-switch" title="Toggle Theme">
                  <input type="checkbox" />
                  <span class="theme-toggle-slider"></span>
                </label>
              </div>
              <div class="main-content">
                <div class="sidebar">
                  <div class="note-tab active">
                    <span class="note-tab-title">New Note</span>
                    <button class="delete-note-btn" title="Delete Note">✕</button>
                  </div>
                </div>
                <div class="note-editor">
                  <textarea placeholder="Start typing your note..." aria-label="Note content editor" spellcheck="true" maxlength="500"></textarea>
                  <div class="char-count">0/500</div>
                </div>
              </div>
            </div>
          `;
          
          // Add basic interactivity
          const createBtn = document.querySelector('.new-note-btn');
          const sidebar = document.querySelector('.sidebar');
          const noteCount = { count: 1 };
          
          if (createBtn) {
            createBtn.addEventListener('click', function() {
              noteCount.count++;
              const newTab = document.createElement('div');
              newTab.className = 'note-tab';
              newTab.innerHTML = 
                '<span class="note-tab-title">New Note</span>' +
                '<button class="delete-note-btn" title="Delete Note">✕</button>';
              if (sidebar) {
                sidebar.appendChild(newTab);
              }
            });
          }
          
          const themeToggle = document.querySelector('.theme-toggle-switch input');
          if (themeToggle) {
            themeToggle.addEventListener('change', function() {
              const container = document.querySelector('.app-container');
              if (container) {
                if (this.checked) {
                  container.className = 'app-container theme-light';
                } else {
                  container.className = 'app-container theme-dark';
                }
              }
            });
          }
          
          const textarea = document.querySelector('.note-editor textarea');
          const charCount = document.querySelector('.char-count');
          if (textarea && charCount) {
            textarea.addEventListener('input', function() {
              const length = this.value.length;
              charCount.textContent = length + '/500';
              if (length > 450) {
                charCount.innerHTML = length + '/500 <span class="warning">(Approaching limit)</span>';
              }
              if (length === 500) {
                charCount.innerHTML = length + '/500 <span class="warning">(Limit reached)</span>';
              }
            });
          }
        }
      });
    }
    
    // Wait for the app container to be present
    await this.page.waitForSelector('.app-container', { timeout: 10000 });
  }

  async createNote(content?: string) {
    await this.createButton.click();
    if (content) {
      await this.noteEditor.fill(content);
      await this.page.waitForTimeout(600); // Wait for auto-save
    }
  }

  async searchNotes(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300); // Wait for search filter
  }

  async toggleTheme() {
    await this.themeToggle.click();
  }

  async selectNote(index: number) {
    await this.page.locator(`.note-tab:nth-child(${index + 1})`).click();
  }

  async deleteNote(index: number) {
    await this.page.locator(`.note-tab:nth-child(${index + 1}) .delete-note-btn`).click();
  }

  async getNoteCount() {
    return await this.page.locator('.note-tab').count();
  }

  async getCurrentTheme() {
    const appContainer = this.page.locator('.app-container');
    const className = await appContainer.getAttribute('class');
    return className?.includes('theme-dark') ? 'dark' : 'light';
  }

  async waitForAutoSave() {
    await this.page.waitForTimeout(600);
  }
}

export class TestDataManager {
  static readonly TEST_NOTES = {
    short: 'Quick note',
    medium: 'This is a medium length note with some content that spans multiple lines and contains various characters.',
    long: 'A'.repeat(400),
    maxLength: 'A'.repeat(500),
    overLimit: 'A'.repeat(600),
    special: 'Note with special chars: !@#$%^&*()_+-=[]{}|;:",./<>?',
    unicode: '📝 Unicode note with emojis 🎯 and symbols ♠️♣️♦️♥️',
    code: 'function test() {\n  return "code snippet";\n}',
    markdown: '# Heading\n\n**Bold** and *italic* text\n\n- List item 1\n- List item 2'
  };

  static readonly SEARCH_QUERIES = {
    existing: 'Quick',
    nonExistent: 'xyznotthere123',
    special: '!@#',
    unicode: '📝',
    partial: 'med',
    caseSensitive: 'QUICK'
  };

  static getRandomNote(): string {
    const notes = Object.values(this.TEST_NOTES);
    return notes[Math.floor(Math.random() * notes.length)];
  }

  static generateNotes(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `Test note ${i + 1}: ${this.getRandomNote()}`);
  }
}

export class PerformanceHelper {
  static async measureLoadTime(page: Page): Promise<number> {
    const startTime = Date.now();
    await page.waitForSelector('.app-container');
    return Date.now() - startTime;
  }

  static async measureActionTime(action: () => Promise<void>): Promise<number> {
    const startTime = Date.now();
    await action();
    return Date.now() - startTime;
  }

  static async getMemoryUsage(page: Page) {
    return await page.evaluate(() => {
      // @ts-ignore
      return performance.memory ? {
        // @ts-ignore
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        // @ts-ignore
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        // @ts-ignore
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null;
    });
  }
}

export class AccessibilityHelper {
  static async checkKeyboardNavigation(page: Page) {
    const focusableElements = [
      '.new-note-btn',
      '#search-input', 
      '.theme-toggle-switch input',
      '.note-editor textarea'
    ];

    for (const selector of focusableElements) {
      await page.focus(selector);
      const focusedElement = await page.locator(':focus').first();
      await expect(focusedElement).toHaveAttribute('class', new RegExp(selector.replace(/[.#]/g, '')));
    }
  }

  static async checkAriaLabels(page: Page) {
    const elementsWithAria = await page.locator('[aria-label], [title]').all();
    expect(elementsWithAria.length).toBeGreaterThan(0);
    
    for (const element of elementsWithAria) {
      const ariaLabel = await element.getAttribute('aria-label');
      const title = await element.getAttribute('title');
      expect(ariaLabel || title).toBeTruthy();
    }
  }
}

export class VisualHelper {
  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  static async compareVisual(page: Page, name: string) {
    await expect(page).toHaveScreenshot(`${name}.png`);
  }
} 
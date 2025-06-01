import { test, expect } from '@playwright/test';

// Note: Interacting with Chrome extension popups with Playwright can be tricky.
// You often need to get a handle to the extension's background page or popup page directly.

const EXTENSION_ID = ` obtener-de-chrome-extensions-page `; // You need to get this after loading the extension manually once

test.beforeEach(async ({ page }) => {
  // For extensions, you might not navigate to a URL directly for the popup
  // Instead, you might open the popup via a browser action or a specific extension URL
  // This is a placeholder - actual popup opening logic will depend on your extension
  await page.goto(`chrome-extension://${EXTENSION_ID}/popup.html`);
});

test.describe('Quick Notes Extension', () => {
  test('should open the popup and display initial UI', async ({ page }) => {
    // Check if the main app container is visible
    await expect(page.locator('.app-container')).toBeVisible();

    // Check for the "New Note" button
    await expect(page.getByRole('button', { name: 'New Note' })).toBeVisible();

    // Check for the search input
    await expect(page.getByPlaceholder('Search notes...')).toBeVisible();
  });

  test('should create a new note', async ({ page }) => {
    await page.getByRole('button', { name: 'New Note' }).click();
    
    // The new note should be active, and textarea available
    const textarea = page.locator('.note-editor textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeFocused();
    await expect(textarea).toHaveValue('');

    // Type some content
    const noteContent = 'This is a test note.';
    await textarea.fill(noteContent);
    await expect(textarea).toHaveValue(noteContent);

    // Check if the note appears in the sidebar (you might need to wait for auto-save or state update)
    // This depends on how notes are rendered in the sidebar. Assuming a title snippet is shown.
    await expect(page.locator('.sidebar .note-tab-title', { hasText: noteContent.substring(0,20) })).toBeVisible();
  });

  test('should delete a note', async ({ page }) => {
    // First, create a note to delete
    await page.getByRole('button', { name: 'New Note' }).click();
    const textarea = page.locator('.note-editor textarea');
    const noteContent = 'Note to be deleted';
    await textarea.fill(noteContent);
    await page.waitForTimeout(600); // Wait for auto-save

    // Find the delete button for that note (this selector might need adjustment)
    // It's safer to target based on the note it contains or its ID if possible.
    const noteTab = page.locator('.sidebar .note-tab', { hasText: noteContent.substring(0,20) });
    await expect(noteTab).toBeVisible();
    
    const deleteButton = noteTab.locator('.delete-note-btn');
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Confirm the note is gone from the sidebar
    await expect(noteTab).not.toBeVisible();
    // And the editor is either empty or showing another note/placeholder
    // This depends on the behavior implemented in App.js
  });

  // Add more tests for other features:
  // - Editing an existing note
  // - Searching for notes
  // - Toggling theme
  // - Character limit warning
  // - Context menu note creation (this is more complex and might require a different setup)
  // - Undo delete
  // - Export/Import (might need to mock file system interactions or use page.on('download') etc.)

});

// Helper function to get the extension ID might be useful if not hardcoding
// async function getExtensionId(page) {
//   await page.goto('chrome://extensions');
//   // This is pseudo-code and needs to be adapted to the actual structure of chrome://extensions page
//   // You might need to enable developer mode first
//   const extensionId = await page.locator('extensions-manager >>> extensions-item-list >>> extensions-item >> internal#id').textContent();
//   return extensionId;
// } 
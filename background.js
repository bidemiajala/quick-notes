// Background service worker for Quick Notes extension

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "quickNote",
    title: "Add to Quick Notes",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "quickNote" && info.selectionText) {
    // Send a message to the popup or save directly to storage
    chrome.storage.sync.get({ notes: [] }, (data) => {
      const newNote = {
        id: Date.now().toString(),
        content: info.selectionText,
        createdAt: new Date().toISOString()
      };
      const updatedNotes = [newNote, ...data.notes];
      chrome.storage.sync.set({ notes: updatedNotes }, () => {
        console.log("Note saved from context menu");
        // Optionally, notify the user or update the badge
        chrome.action.setBadgeText({ text: "New" });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      });
    });
  }
});

// Listen for messages from the popup or other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "clearBadge") {
    chrome.action.setBadgeText({ text: "" });
    sendResponse({ status: "Badge cleared" });
  }
  return true; // Indicates that the response will be sent asynchronously
}); 
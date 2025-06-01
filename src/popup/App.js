import React, { useState, useEffect, useCallback } from 'react';

const MAX_NOTE_LENGTH = 500;

function App() {
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [currentContent, setCurrentContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState('dark');
  const storageArea = chrome.storage.sync;

  const createNewNoteObject = () => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const handleCreateMultipleNotes = useCallback((count) => {
    let newNotes = [];
    for (let i = 0; i < count; i++) {
        newNotes.push({
            id: Date.now().toString() + "-" + i + Math.random().toString(36).substr(2, 9),
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    setNotes(prevNotes => {
        const allNotes = [...newNotes, ...prevNotes];
        storageArea.set({ notes: allNotes });
        return allNotes;
    });
    if (newNotes.length > 0) {
        setActiveNoteId(newNotes[0].id);
        setCurrentContent('');
    }
  }, [storageArea]);

  const handleNewSingleNote = useCallback(() => {
    const newNote = createNewNoteObject();
    setNotes(prevNotes => {
      const updatedNotesOnAdd = [newNote, ...prevNotes];
      storageArea.set({ notes: updatedNotesOnAdd });
      return updatedNotesOnAdd;
    });
    setActiveNoteId(newNote.id);
    setCurrentContent('');
  }, [storageArea]);

  useEffect(() => {
    storageArea.get({ notes: [], theme: 'dark' }, (data) => {
      const loadedNotes = data.notes || [];
      setTheme(data.theme);

      if (loadedNotes.length > 0) {
        setNotes(loadedNotes);
        setActiveNoteId(loadedNotes[0].id);
        setCurrentContent(loadedNotes[0].content);
      } else {
        // Create 11 empty notes by default if no notes exist
        let initialNotes = [];
        for (let i = 0; i < 11; i++) {
            initialNotes.push({
                id: Date.now().toString() + "-" + i + Math.random().toString(36).substr(2, 9),
                content: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        setNotes(initialNotes);
        storageArea.set({ notes: initialNotes });
        if (initialNotes.length > 0) {
            setActiveNoteId(initialNotes[0].id);
            setCurrentContent('');
        }
      }
    });

    if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: "clearBadge" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error clearing badge:", chrome.runtime.lastError.message);
            } else if (response) {
                console.log(response.status);
            }
        });
    }
  }, [storageArea]);

   useEffect(() => {
    if (activeNoteId && currentContent !== undefined) {
        const timeoutId = setTimeout(() => {
            const noteToUpdate = notes.find(n => n.id === activeNoteId);
            if (noteToUpdate && noteToUpdate.content === currentContent && notes.length > 1) return;

            const updatedNotes = notes.map(note =>
                note.id === activeNoteId ? { ...note, content: currentContent, updatedAt: new Date().toISOString() } : note
            );
            if (JSON.stringify(notes) !== JSON.stringify(updatedNotes)) {
                setNotes(updatedNotes);
                storageArea.set({ notes: updatedNotes });
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }
  }, [currentContent, activeNoteId, notes, storageArea]);

  const handleDeleteNote = (idToDelete) => {
    if (notes.length <= 1 && notes[0].content === '') return;
    if (notes.length <=1) return;

    const noteToDelete = notes.find(note => note.id === idToDelete);
    if (!noteToDelete) return;

    const updatedNotes = notes.filter(note => note.id !== idToDelete);
    setNotes(updatedNotes);
    storageArea.set({ notes: updatedNotes });

    chrome.storage.local.set({ [`deleted_${idToDelete}`]: {note: noteToDelete, expiresAt: Date.now() + 30000} }); 

    if (activeNoteId === idToDelete) {
      if (updatedNotes.length > 0) {
        setActiveNoteId(updatedNotes[0].id);
        setCurrentContent(updatedNotes[0].content);
      } else {
        handleNewSingleNote(); 
      }
    }
  };

  const handleNoteSelect = (id) => {
    const selectedNote = notes.find(note => note.id === id);
    if (selectedNote) {
      setActiveNoteId(id);
      setCurrentContent(selectedNote.content);
    }
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_NOTE_LENGTH) {
      setCurrentContent(newContent);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    chrome.storage.sync.set({ theme: newTheme });
  };

 const filteredNotes = notes.filter(note =>
    (note.content && note.content.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (note.content === '' && searchTerm === '' )
  );

  const currentNoteObject = notes.find(note => note.id === activeNoteId);
  const charCount = currentContent ? currentContent.length : 0;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        handleNewSingleNote();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewSingleNote]);

  return (
    <div className={`app-container theme-${theme}`}>
      <div className="toolbar">
        <button onClick={handleNewSingleNote} className="new-note-btn" title="Create New Note (Ctrl+N)">
          <span className="icon">✎</span> New Note
        </button>
        <input
          id="search-input"
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          title="Search Notes (Ctrl+F)"
        />
        <label className="theme-toggle-switch" title="Toggle Theme">
          <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
          <span className="theme-toggle-slider"></span>
        </label>
      </div>

      <div className="main-content">
        <div className="sidebar">
          {filteredNotes.length > 0 ? (
            filteredNotes.map(note => (
              <div
                key={note.id}
                className={`note-tab ${note.id === activeNoteId ? 'active' : ''}`}
                onClick={() => handleNoteSelect(note.id)}
                title={note.content.substring(0,100) || 'New Note'}
              >
                <span className="note-tab-title">
                    {note.content.substring(0, 20) || 'New Note'} 
                </span>
                {notes.length > 1 && ( 
                  <button
                    className="delete-note-btn"
                    onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                    title="Delete Note"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          ) :  searchTerm.length > 0 && filteredNotes.length === 0 ? (
            <p>Note not found.</p>
          ) : (
            <p>No notes. Click "New Note".</p>
          )
        }
        </div>

        <div className="note-editor">
          {activeNoteId && currentNoteObject ? (
            <textarea
              value={currentContent}
              onChange={handleContentChange}
              placeholder="Start typing your note..."
              maxLength={MAX_NOTE_LENGTH}
              aria-label="Note content editor"
              spellCheck="true"
            />
          ) : (
             <p>Select or create a note.</p>
          )}
          <div className="char-count">
            {charCount}/{MAX_NOTE_LENGTH}
            {charCount > MAX_NOTE_LENGTH * 0.9 && charCount < MAX_NOTE_LENGTH && <span className="warning"> (Approaching limit)</span>}
            {charCount === MAX_NOTE_LENGTH && <span className="warning"> (Limit reached)</span>} 
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 
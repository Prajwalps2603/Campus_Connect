// Back button
const backBtn = document.getElementById('backBtn');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    const w = globalThis;
    if (w.history && w.history.length > 1) {
      w.history.back();
    } else {
      w.location.href = 'eduhub.html';
    }
  });
}

// Tool switching
const workbookBtns = document.querySelectorAll('.workbook-btn');
const tools = document.querySelectorAll('.tool');

workbookBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from all buttons
    workbookBtns.forEach(b => b.classList.remove('active'));
    // Add active class to clicked button
    btn.classList.add('active');

    // Hide all tools
    tools.forEach(tool => tool.classList.remove('active'));

    // Show selected tool
    const toolId = btn.dataset.tool;
    document.getElementById(toolId).classList.add('active');
  });
});

// Notebook functions
function formatText(command) {
  document.execCommand(command, false, null);
}

function changeFontSize(size) {
  document.execCommand('fontSize', false, '7'); // Reset to default first
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = size + 'px';
    range.surroundContents(span);
  }
}

function newNote() {
  const editor = document.getElementById('notebookEditor');
  if (confirm('Are you sure you want to create a new note? Any unsaved changes will be lost.')) {
    editor.innerHTML = '';
  }
}

function saveNote() {
  const editor = document.getElementById('notebookEditor');
  const content = editor.innerHTML;
  const title = prompt('Enter a title for your note:');
  if (title) {
    const note = { title, content, date: new Date().toISOString() };
    const notes = JSON.parse(localStorage.getItem('notebookNotes') || '[]');
    notes.push(note);
    localStorage.setItem('notebookNotes', JSON.stringify(notes));
    alert('Note saved successfully!');
  }
}

function loadNote() {
  const notes = JSON.parse(localStorage.getItem('notebookNotes') || '[]');
  if (notes.length === 0) {
    alert('No saved notes found.');
    return;
  }

  let noteList = 'Saved Notes:\n\n';
  notes.forEach((note, index) => {
    noteList += `${index + 1}. ${note.title} (${new Date(note.date).toLocaleDateString()})\n`;
  });

  const choice = prompt(noteList + '\nEnter the number of the note to load:');
  const index = parseInt(choice) - 1;

  if (index >= 0 && index < notes.length) {
    const editor = document.getElementById('notebookEditor');
    editor.innerHTML = notes[index].content;
  }
}

// Word processor functions
function formatWord(command) {
  document.execCommand(command, false, null);
}

function changeFontFamily() {
  const fontFamily = document.getElementById('fontFamily').value;
  document.execCommand('fontName', false, fontFamily);
}

function changeFontSizeWord() {
  const fontSize = document.getElementById('fontSize').value;
  document.execCommand('fontSize', false, fontSize === '12' ? '3' : fontSize === '14' ? '4' : fontSize === '16' ? '5' : fontSize === '18' ? '6' : fontSize === '20' ? '7' : '7');
}

function insertList(command) {
  document.execCommand(command, false, null);
}

function newDocument() {
  const editor = document.getElementById('wordEditor');
  if (confirm('Are you sure you want to create a new document? Any unsaved changes will be lost.')) {
    editor.innerHTML = '<p>Start typing your document...</p>';
  }
}

function saveDocument() {
  const editor = document.getElementById('wordEditor');
  const content = editor.innerHTML;
  const title = prompt('Enter a title for your document:');
  if (title) {
    const doc = { title, content, date: new Date().toISOString() };
    const docs = JSON.parse(localStorage.getItem('wordDocuments') || '[]');
    docs.push(doc);
    localStorage.setItem('wordDocuments', JSON.stringify(docs));
    alert('Document saved successfully!');
  }
}

function loadDocument() {
  const docs = JSON.parse(localStorage.getItem('wordDocuments') || '[]');
  if (docs.length === 0) {
    alert('No saved documents found.');
    return;
  }

  let docList = 'Saved Documents:\n\n';
  docs.forEach((doc, index) => {
    docList += `${index + 1}. ${doc.title} (${new Date(doc.date).toLocaleDateString()})\n`;
  });

  const choice = prompt(docList + '\nEnter the number of the document to load:');
  const index = parseInt(choice) - 1;

  if (index >= 0 && index < docs.length) {
    const editor = document.getElementById('wordEditor');
    editor.innerHTML = docs[index].content;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Set default font
  document.getElementById('fontFamily').value = 'Arial';
  document.getElementById('fontSize').value = '14';
});
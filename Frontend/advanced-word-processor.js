// Advanced Word Processor JavaScript
class AdvancedWordProcessor {
    constructor() {
        console.log('Advanced Word Processor initializing...');
        this.currentMode = 'word';
        this.currentLanguage = 'cpp';
        this.currentDoc = null;
        this.wordCount = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadRecentDocs();
        this.updateWordCount();
        this.initializeAI();
    }

    bindEvents() {
        // App switcher - Enhanced event binding for iframe/touch support
        const appOptions = document.querySelectorAll('.app-option');
        for (const option of appOptions) {
            // Remove existing listeners to prevent duplicates
            option.removeEventListener('click', this.handleAppOptionClick);
            option.removeEventListener('touchstart', this.handleAppOptionClick);
            option.removeEventListener('touchend', this.handleAppOptionClick);

            // Add multiple event types for better touch support
            option.addEventListener('click', this.handleAppOptionClick.bind(this));
            option.addEventListener('touchstart', this.handleAppOptionClick.bind(this), { passive: true });
            option.addEventListener('touchend', this.handleAppOptionClick.bind(this), { passive: true });

            // Ensure proper styling
            option.style.cursor = 'pointer';
            option.style.touchAction = 'manipulation';
            option.style.userSelect = 'none';
            option.style.webkitTapHighlightColor = 'transparent';
        }

        // Control buttons - same enhanced handling
        const controlBtns = document.querySelectorAll('.control-btn');
        for (const btn of controlBtns) {
            btn.removeEventListener('click', this.handleControlClick);
            btn.removeEventListener('touchstart', this.handleControlClick);
            btn.removeEventListener('touchend', this.handleControlClick);

            btn.addEventListener('click', this.handleControlClick.bind(this));
            btn.addEventListener('touchstart', this.handleControlClick.bind(this), { passive: true });
            btn.addEventListener('touchend', this.handleControlClick.bind(this), { passive: true });

            btn.style.cursor = 'pointer';
            btn.style.touchAction = 'manipulation';
            btn.style.userSelect = 'none';
            btn.style.webkitTapHighlightColor = 'transparent';
        }

        // Language selector
        const languageItems = document.querySelectorAll('.language-selector .dropdown-item');
        for (const item of languageItems) {
            item.addEventListener('click', this.handleLanguageSelect.bind(this));
        }

        // Add debugging for touch events
        console.log('Advanced Word Processor events bound:', appOptions.length, 'app options,', controlBtns.length, 'control buttons,', languageItems.length, 'language items');
    }

    // Enhanced event handlers
    handleAppOptionClick(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('App option clicked:', e.currentTarget.dataset.mode);

        const mode = e.currentTarget.dataset.mode;
        if (mode) {
            this.switchMode(mode);
        }
    }

    handleControlClick(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log('Control button clicked:', e.currentTarget.dataset.action);

        const button = e.currentTarget.closest('.control-btn');
        if (button) {
            this.handleControl(button);
        }
    }

    handleLanguageSelect(e) {
        const selectedLang = e.currentTarget.dataset.lang;
        const selectedText = e.currentTarget.textContent;
        
        document.getElementById('currentLanguage').textContent = selectedText;
        this.currentLanguage = selectedLang;
        
        // Close dropdown
        const dropdowns = document.querySelectorAll('.dropdown-content');
        for (const dropdown of dropdowns) {
            dropdown.style.display = 'none';
        }
    }

    switchMode(mode) {
        if (this.currentMode === mode) return;

        const previousMode = this.currentMode;
        this.currentMode = mode;

        // Update UI
        document.querySelectorAll('.app-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

        // Update slider position
        const slider = document.querySelector('.app-slider');
        const activeOption = document.querySelector(`[data-mode="${mode}"]`);
        const index = Array.from(activeOption.parentNode.children).indexOf(activeOption);
        slider.style.transform = `translateX(${index * 100}%)`;

        // Enhanced editor switching with opening effect
        const wordEditor = document.getElementById('word-editor');
        const notepadEditor = document.getElementById('notepad-editor');
        const editorContainer = document.querySelector('.editor-container');

        if (mode === 'notepad') {
            // Code editor opening effect
            wordEditor.style.display = 'none';
            notepadEditor.style.display = 'block';

            // Focus the code editor
            setTimeout(() => {
                notepadEditor.focus();
                notepadEditor.setSelectionRange(notepadEditor.value.length, notepadEditor.value.length);

                // Show status message
                this.showStatusMessage('Code Editor opened! Start coding...', 'success');
            }, 100);

            // Add cyber effect to container
            editorContainer.classList.add('code-mode-active');

        } else {
            // Word editor switching
            notepadEditor.style.display = 'none';
            wordEditor.style.display = 'block';

            // Remove code mode effects
            editorContainer.classList.remove('code-mode-active');

            // Focus word editor
            setTimeout(() => {
                wordEditor.focus();
            }, 100);
        }

        // Show/hide run button and language selector
        const runBtn = document.getElementById('runBtn');
        const languageSelector = document.getElementById('languageSelector');
        if (mode === 'notepad') {
            runBtn.style.display = 'inline-flex';
            languageSelector.style.display = 'block';
        } else {
            runBtn.style.display = 'none';
            languageSelector.style.display = 'none';
        }

        // Add transition effect
        const transition = document.querySelector('.mode-transition');
        transition.classList.add('active');
        setTimeout(() => transition.classList.remove('active'), 500);

        this.updateWordCount();
    }

    handleTool(button) {
        const tool = button.dataset.tool;
        const editor = this.getCurrentEditor();

        if (!editor) return;

        switch (tool) {
            case 'bold':
                this.formatText('bold');
                break;
            case 'italic':
                this.formatText('italic');
                break;
            case 'underline':
                this.formatText('underline');
                break;
            case 'strike':
                this.formatText('strikeThrough');
                break;
            case 'align-left':
                this.formatText('justifyLeft');
                break;
            case 'align-center':
                this.formatText('justifyCenter');
                break;
            case 'align-right':
                this.formatText('justifyRight');
                break;
            case 'align-justify':
                this.formatText('justifyFull');
                break;
            case 'list-ul':
                this.formatText('insertUnorderedList');
                break;
            case 'list-ol':
                this.formatText('insertOrderedList');
                break;
            case 'link':
                this.insertLink();
                break;
            case 'image':
                this.insertImage();
                break;
            case 'table':
                this.insertTable();
                break;
            case 'code':
                this.formatText('formatBlock', 'pre');
                break;
            case 'undo':
                document.execCommand('undo');
                break;
            case 'redo':
                document.execCommand('redo');
                break;
        }

        button.classList.add('active');
        setTimeout(() => button.classList.remove('active'), 200);
    }

    formatText(command, value = null) {
        document.execCommand(command, false, value);
        this.getCurrentEditor().focus();
    }

    insertLink() {
        const url = prompt('Enter URL:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    }

    insertImage() {
        const url = prompt('Enter image URL:');
        if (url) {
            document.execCommand('insertImage', false, url);
        }
    }

    insertTable() {
        const rows = prompt('Number of rows:', '3');
        const cols = prompt('Number of columns:', '3');

        if (rows && cols) {
            let tableHTML = '<table border="1" style="width: 100%; border-collapse: collapse;">';
            for (let i = 0; i < rows; i++) {
                tableHTML += '<tr>';
                for (let j = 0; j < cols; j++) {
                    tableHTML += '<td style="padding: 8px;">Cell</td>';
                }
                tableHTML += '</tr>';
            }
            tableHTML += '</table>';

            document.execCommand('insertHTML', false, tableHTML);
        }
    }

    handleControl(button) {
        const action = button.dataset.action;

        switch (action) {
            case 'new':
                this.newDocument();
                break;
            case 'save':
                this.saveDocument();
                break;
            case 'run':
                this.runCode();
                break;
            case 'export':
                this.exportDocument();
                break;
            case 'print':
                window.print();
                break;
        }
    }

    runCode() {
        // Note: For non-JavaScript languages, this uses JDoodle API
        // Make sure your API credentials are valid and you haven't exceeded free tier limits
        // Check browser console for detailed error information
        const code = document.getElementById('notepad-editor').value;
        
        if (!code.trim()) {
            alert('Please enter some code to run.');
            return;
        }

        // Show loading
        const runBtn = document.getElementById('runBtn');
        const originalText = runBtn.innerHTML;
        runBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
        runBtn.disabled = true;

        // Prepare payload for backend execution proxy (server holds API keys)
        const execPayload = {
            language: this.currentLanguage,
            versionIndex: '0',
            script: code,
            stdin: ''
        };

        // For JavaScript, run locally for better performance
        if (this.currentLanguage === 'javascript') {
            try {
                // Capture console.log
                const logs = [];
                const originalLog = console.log;
                console.log = (...args) => {
                    logs.push(args.join(' '));
                    originalLog(...args);
                };
                
                const result = eval(code);
                
                console.log = originalLog;
                
                let output = '';
                if (logs.length > 0) {
                    output += 'Console Output:\n' + logs.join('\n') + '\n\n';
                }
                if (result !== undefined) {
                    output += 'Return Value: ' + result;
                }
                
                alert(output || 'Code executed successfully (no output)');
            } catch (error) {
                alert('Error: ' + error.message);
            }
            
            runBtn.innerHTML = originalText;
            runBtn.disabled = false;
            return;
        }

        // For other languages, use JDoodle API
        console.log('Executing code via backend proxy...');
        fetch('/api/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // include auth if available
                ...(localStorage.getItem('authToken') ? { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') } : {})
            },
            body: JSON.stringify(execPayload)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Execution failed') });
            }
            return response.json();
        })
        .then(data => {
            console.log('Execution proxy response:', data);
            if (data.provider === 'jdoodle' && data.data) {
                const d = data.data;
                let output = '';
                if (d.output) output += 'Output:\n' + d.output + '\n\n';
                if (d.memory) output += 'Memory: ' + d.memory + ' KB\n';
                if (d.cpuTime) output += 'CPU Time: ' + d.cpuTime + ' sec\n';
                if (d.statusCode && d.statusCode !== 200) output += '\nStatus Code: ' + d.statusCode;
                alert(output || 'Executed with no output');
            } else {
                alert('Execution completed. Check console for details.');
                console.log(data);
            }
        })
        .catch(err => {
            console.error('Execution proxy error:', err);
            alert('Execution error: ' + (err.message || 'Unknown error'));
        })
        .finally(() => {
            runBtn.innerHTML = originalText;
            runBtn.disabled = false;
        });
    }

    newDocument() {
        if (confirm('Create new document? Unsaved changes will be lost.')) {
            this.getCurrentEditor().innerHTML = '';
            this.currentDoc = null;
            this.updateWordCount();
        }
    }

    saveDocument() {
        const content = this.getCurrentEditor().innerHTML;
        const title = prompt('Document title:', this.currentDoc?.title || 'Untitled Document');

        if (title) {
            const doc = {
                id: this.currentDoc?.id || Date.now(),
                title,
                content,
                mode: this.currentMode,
                lastModified: new Date().toISOString(),
                wordCount: this.wordCount
            };

            // Save to localStorage
            const docs = JSON.parse(localStorage.getItem('nexusDocs') || '[]');
            const existingIndex = docs.findIndex(d => d.id === doc.id);

            if (existingIndex >= 0) {
                docs[existingIndex] = doc;
            } else {
                docs.unshift(doc);
            }

            localStorage.setItem('nexusDocs', JSON.stringify(docs.slice(0, 10))); // Keep last 10 docs
            this.currentDoc = doc;
            this.loadRecentDocs();

            alert('Document saved successfully!');
        }
    }

    exportDocument() {
        const content = this.getCurrentEditor().innerHTML;
        const title = this.currentDoc?.title || 'Untitled Document';

        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }

    loadDocument(docElement) {
        const docId = parseInt(docElement.dataset.id);
        const docs = JSON.parse(localStorage.getItem('nexusDocs') || '[]');
        const doc = docs.find(d => d.id === docId);

        if (doc) {
            this.currentDoc = doc;
            this.switchMode(doc.mode);
            this.getCurrentEditor().innerHTML = doc.content;
            this.updateWordCount();
        }
    }

    loadRecentDocs() {
        const docs = JSON.parse(localStorage.getItem('nexusDocs') || '[]');
        const container = document.querySelector('.recent-docs .doc-list') || document.createElement('div');

        if (!container.classList.contains('doc-list')) {
            container.className = 'doc-list';
            document.querySelector('.recent-docs').appendChild(container);
        }

        container.innerHTML = '';

        if (docs.length === 0) {
            container.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 20px;">No recent documents</p>';
            return;
        }

        docs.forEach(doc => {
            const docItem = document.createElement('div');
            docItem.className = 'doc-item';
            docItem.dataset.id = doc.id;
            docItem.innerHTML = `
                <div class="doc-icon">
                    <i class="fas fa-${doc.mode === 'word' ? 'file-word' : 'file-code'}"></i>
                </div>
                <div class="doc-info">
                    <div class="doc-name">${doc.title}</div>
                    <div class="doc-meta">
                        <span>${new Date(doc.lastModified).toLocaleDateString()}</span>
                        <span>${doc.wordCount} words</span>
                    </div>
                </div>
            `;
            container.appendChild(docItem);
        });

        // Re-bind events for new elements
        document.querySelectorAll('.doc-item').forEach(item => {
            item.addEventListener('click', (e) => this.loadDocument(e.target.closest('.doc-item')));
        });
    }

    applyAISuggestion(suggestion) {
        const text = suggestion.textContent.trim();
        const editor = this.getCurrentEditor();

        // Simple AI suggestion application - insert at cursor
        document.execCommand('insertText', false, text + ' ');
        editor.focus();

        // Visual feedback
        suggestion.style.background = 'rgba(0, 255, 136, 0.3)';
        setTimeout(() => {
            suggestion.style.background = '';
        }, 500);
    }

    updateWordCount() {
        const editor = this.getCurrentEditor();
        if (!editor) return;

        const text = editor.textContent || editor.innerText || '';
        this.wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

        document.querySelector('.word-count').textContent = this.wordCount;
    }

    getCurrentEditor() {
        return this.currentMode === 'word'
            ? document.getElementById('word-editor')
            : document.getElementById('notepad-editor');
    }

    showStatusMessage(message, type = 'info') {
        // Create or update status message
        let statusMsg = document.querySelector('.status-message');
        if (!statusMsg) {
            statusMsg = document.createElement('div');
            statusMsg.className = 'status-message';
            document.querySelector('.status-bar').prepend(statusMsg);
        }

        statusMsg.textContent = message;
        statusMsg.className = `status-message ${type}`;

        // Auto-hide after 3 seconds
        setTimeout(() => {
            statusMsg.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!globalThis.advancedWordProcessor) {
        globalThis.advancedWordProcessor = new AdvancedWordProcessor();
    }
});

// Also initialize immediately if DOM is already loaded (for iframe contexts)
if (document.readyState !== 'loading') {
    if (!globalThis.advancedWordProcessor) {
        globalThis.advancedWordProcessor = new AdvancedWordProcessor();
    }
}

// Fallback initialization for iframe contexts
window.addEventListener('load', () => {
    if (!globalThis.advancedWordProcessor) {
        globalThis.advancedWordProcessor = new AdvancedWordProcessor();
    }
});
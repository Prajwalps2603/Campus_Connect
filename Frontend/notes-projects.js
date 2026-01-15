const notesTab = document.getElementById('notesTab');
const projectsTab = document.getElementById('projectsTab');
const notesPanel = document.getElementById('notesPanel');
const projectsPanel = document.getElementById('projectsPanel');
const backBtn = document.getElementById('backBtn');
// Toolbar elements
const notesToolbar = document.getElementById('notesToolbar');
const projectsToolbar = document.getElementById('projectsToolbar');
// Notes controls
const notesSearch = document.getElementById('notesSearch');
const notesFilterBtn = document.getElementById('notesFilterBtn');
const notesSortBtn = document.getElementById('notesSortBtn');
const notesUploadBtn = document.getElementById('notesUploadBtn');
const notesSchemeInput = document.getElementById('notesSchemeInput');
const notesApplyScheme = document.getElementById('notesApplyScheme');
const notesSchemeDisplay = document.getElementById('notesSchemeDisplay');
// Projects controls
const projectsSearch = document.getElementById('projectsSearch');
const projectsFilterBtn = document.getElementById('projectsFilterBtn');
const projectsSortBtn = document.getElementById('projectsSortBtn');
const projectsUploadBtn = document.getElementById('projectsUploadBtn');
const projectsSchemeInput = document.getElementById('projectsSchemeInput');
const projectsApplyScheme = document.getElementById('projectsApplyScheme');
const projectsSchemeDisplay = document.getElementById('projectsSchemeDisplay');
// Modal controls
const npUploadModal = document.getElementById('npUploadModal');
const npUploadClose = document.getElementById('npUploadClose');
const npUploadForm = document.getElementById('npUploadForm');
const npUploadTitle = document.getElementById('npUploadTitle');
const npTitle = document.getElementById('npTitle');
const npSubject = document.getElementById('npSubject');
const npCourseCode = document.getElementById('npCourseCode');
const npContent = document.getElementById('npContent');
const npDescription = document.getElementById('npDescription');
const npTechnology = document.getElementById('npTechnology');
const npCompletion = document.getElementById('npCompletion');
const npFile = document.getElementById('npFile');
const npSubmitBtn = document.getElementById('npSubmitBtn');
const noteOnly = Array.from(document.querySelectorAll('.note-only'));
const projectOnly = Array.from(document.querySelectorAll('.project-only'));

function activateTab(tab) {
    if (tab === 'notes') {
        notesTab.classList.add('active');
        notesTab.setAttribute('aria-selected', 'true');
        projectsTab.classList.remove('active');
        projectsTab.setAttribute('aria-selected', 'false');
        notesPanel.classList.add('active');
        notesPanel.hidden = false;
        projectsPanel.classList.remove('active');
        projectsPanel.hidden = true;
        if (notesToolbar) notesToolbar.hidden = false;
        if (projectsToolbar) projectsToolbar.hidden = true;
    } else {
        projectsTab.classList.add('active');
        projectsTab.setAttribute('aria-selected', 'true');
        notesTab.classList.remove('active');
        notesTab.setAttribute('aria-selected', 'false');
        projectsPanel.classList.add('active');
        projectsPanel.hidden = false;
        notesPanel.classList.remove('active');
        notesPanel.hidden = true;
        if (notesToolbar) notesToolbar.hidden = true;
        if (projectsToolbar) projectsToolbar.hidden = false;
    }
}

notesTab.addEventListener('click', () => activateTab('notes'));
projectsTab.addEventListener('click', () => activateTab('projects'));

backBtn.addEventListener('click', () => {
    const w = globalThis;
    if (w.history && w.history.length > 1) {
        w.history.back();
    } else {
        w.location.href = 'feed.html';
    }
});

// Activate initial tab based on URL (?tab=notes|projects or #notes/#projects)
(function initTabFromUrl() {
    try {
        const hash = (window.location.hash || '').replace('#','').toLowerCase();
        const params = new URLSearchParams(window.location.search);
        const q = (params.get('tab') || '').toLowerCase();
        if (q === 'projects' || hash === 'projects') {
            activateTab('projects');
        } else if (q === 'notes' || hash === 'notes') {
            activateTab('notes');
        } // else keep default (as defined in HTML)
    } catch (_) {
        // no-op
    }
})();

// Notes toolbar behavior
if (notesSearch) {
    notesSearch.addEventListener('input', (e) => {
        const q = (e.target.value || '').toLowerCase();
        const cards = notesPanel.querySelectorAll('.card');
        for (const c of cards) {
            const text = c.textContent.toLowerCase();
            c.style.opacity = q && !text.includes(q) ? 0.35 : 1;
            c.style.display = q && !text.includes(q) ? 'none' : '';
        }
    });
}
if (notesApplyScheme) {
    notesApplyScheme.addEventListener('click', () => {
        const v = (notesSchemeInput.value || '').trim();
        if (notesSchemeDisplay) notesSchemeDisplay.textContent = 'Current scheme: ' + (v || 'All');
    });
}
if (notesSortBtn) {
    notesSortBtn.addEventListener('click', () => {
        const grid = notesPanel.querySelector('.grid');
        const cards = Array.from(grid.children);
        cards.sort((a,b) => a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent));
        for (const c of cards) grid.appendChild(c);
    });
}

// Projects toolbar behavior
if (projectsSearch) {
    projectsSearch.addEventListener('input', (e) => {
        const q = (e.target.value || '').toLowerCase();
        const cards = projectsPanel.querySelectorAll('.card');
        for (const c of cards) {
            const text = c.textContent.toLowerCase();
            c.style.opacity = q && !text.includes(q) ? 0.35 : 1;
            c.style.display = q && !text.includes(q) ? 'none' : '';
        }
    });
}
if (projectsApplyScheme) {
    projectsApplyScheme.addEventListener('click', () => {
        const v = (projectsSchemeInput.value || '').trim();
        if (projectsSchemeDisplay) projectsSchemeDisplay.textContent = 'Current milestone: ' + (v || 'All');
    });
}
if (projectsSortBtn) {
    projectsSortBtn.addEventListener('click', () => {
        const grid = projectsPanel.querySelector('.grid');
        const cards = Array.from(grid.children);
        cards.sort((a,b) => a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent));
        for (const c of cards) grid.appendChild(c);
    });
}

// Upload modal helpers
function openUploadFor(type) {
    // type: 'note' | 'project'
    npUploadTitle.textContent = type === 'project' ? 'Upload Project' : 'Upload Note';
    for (const el of noteOnly) el.hidden = type !== 'note';
    for (const el of projectOnly) el.hidden = type !== 'project';
    npUploadModal.style.display = 'block';
    npUploadModal.setAttribute('aria-hidden', 'false');
    npUploadForm.dataset.type = type;
}
function closeUpload() {
    npUploadModal.style.display = 'none';
    npUploadModal.setAttribute('aria-hidden', 'true');
    npUploadForm.reset();
}
if (notesUploadBtn) notesUploadBtn.addEventListener('click', () => openUploadFor('note'));
if (projectsUploadBtn) projectsUploadBtn.addEventListener('click', () => openUploadFor('project'));
if (npUploadClose) npUploadClose.addEventListener('click', closeUpload);
window.addEventListener('click', (e) => { if (e.target === npUploadModal) closeUpload(); });

// Submit upload form to backend
if (npUploadForm) {
    npUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = npUploadForm.dataset.type || 'note';
        const formData = new FormData();
        const token = localStorage.getItem('authToken');
        if (!token) { alert('Please login first'); return; }

        if (type === 'note') {
            formData.append('title', npTitle.value);
            formData.append('subject', npSubject.value);
            formData.append('course_code', npCourseCode.value);
            formData.append('content', npContent.value);
        } else {
            formData.append('title', npTitle.value);
            formData.append('description', npDescription.value);
            formData.append('technology', npTechnology.value);
            formData.append('completion_percentage', npCompletion.value || '0');
        }
        if (npFile.files[0]) formData.append('file', npFile.files[0]);

        const endpoint = type === 'note' ? '/api/notes' : '/api/projects';
        try {
            npSubmitBtn.disabled = true;
            npSubmitBtn.textContent = 'Uploading...';
            const res = await fetch(endpoint, { method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: formData });
            const txt = await res.text();
            let data = null; try { data = JSON.parse(txt); } catch(_) { data = { __raw: txt }; }
            if (!res.ok) {
                alert('Error: ' + (data?.message || data?.__raw || res.statusText));
            } else {
                alert(type === 'note' ? 'Note uploaded' : 'Project uploaded');
                closeUpload();
            }
        } catch (err) {
            alert('Network error: ' + (err.message || err));
        } finally {
            npSubmitBtn.disabled = false;
            npSubmitBtn.textContent = 'Upload';
        }
    });
}
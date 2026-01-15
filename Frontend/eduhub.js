// Back button
const backBtn = document.getElementById('backBtn');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    const w = globalThis;
    if (w.history && w.history.length > 1) {
      w.history.back();
    } else {
      w.location.href = 'feed.html';
    }
  });
}
// Navigation between sections
const navLinks = Array.from(document.querySelectorAll('.nav-link'));
const sections = Array.from(document.querySelectorAll('.section'));
function setActive(sectionId){
  for (const a of navLinks) {
    a.classList.toggle('active', a.dataset.section === sectionId);
  }
  for (const s of sections) {
    s.classList.toggle('active', s.id === sectionId);
  }
}
for (const a of navLinks) {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const id = a.dataset.section;
    // Open a dedicated page for notes/projects instead of swapping sections
    if (id === 'notes') {
      window.location.href = 'notes-projects.html?tab=notes';
      return;
    }
    if (id === 'projects') {
      window.location.href = 'notes-projects.html?tab=projects';
      return;
    }
    if (id) setActive(id);
  });
}

// Scheme apply display
const schemeInput = document.getElementById('schemeInput');
const schemeDisplay = document.getElementById('schemeDisplay');
document.getElementById('applyScheme').addEventListener('click', () => {
  const v = (schemeInput.value || '').trim();
  schemeDisplay.textContent = 'Current scheme: ' + (v || 'All');
});

// Simple search highlight/filter demo
document.getElementById('searchInput').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  const cards = document.querySelectorAll('.carousel-card');
  for (const card of cards) {
    const text = card.textContent.toLowerCase();
    card.style.opacity = q && !text.includes(q) ? 0.35 : 1;
  }
});

// View All buttons
const viewAllButtons = document.querySelectorAll('.view-all');
for (const btn of viewAllButtons) {
  btn.addEventListener('click', () => {
    const section = btn.dataset.section;
    // If user wants to view all notes/projects, open the notes-projects page with tab param
    if (section === 'notes') {
      window.location.href = 'notes-projects.html?tab=notes';
      return;
    }
    if (section === 'projects') {
      window.location.href = 'notes-projects.html?tab=projects';
      return;
    }
    if (section) setActive(section);
  });
}

// Open Workbook
function openWorkbook() {
  window.location.href = 'workbook.html';
}

// Load notes
async function loadNotes() {
  try {
    const res = await fetch('/api/notes');
    const data = await res.json();
    if (data.success) {
      const engNotes = data.notes.filter(note => note.subject && note.subject.toLowerCase().includes('engineering')).slice(0, 6);
      const medNotes = data.notes.filter(note => note.subject && note.subject.toLowerCase().includes('medical')).slice(0, 6);
      const engContainer = document.getElementById('engNotes');
      const medContainer = document.getElementById('medNotes');
      const homeNotes = document.getElementById('notesCarousel');
      engContainer.innerHTML = '';
      medContainer.innerHTML = '';
      homeNotes.innerHTML = '';
      data.notes.slice(0, 5).forEach(note => {
        const card = document.createElement('div');
        card.className = 'carousel-card glass';
        card.innerHTML = `<h4>${note.title}</h4><div>${note.course_code || 'N/A'} • ${new Date(note.created_at).toLocaleDateString()}</div><p>${note.content ? note.content.substring(0, 50) + '...' : 'No description'}</p><button class="btn btn-primary download"><i class="fas fa-download"></i> Download</button>`;
        homeNotes.appendChild(card);
      });
      engNotes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'carousel-card glass';
        card.innerHTML = `<h4>${note.title}</h4><div>${note.course_code || 'N/A'} • ${new Date(note.created_at).toLocaleDateString()}</div><p>${note.content ? note.content.substring(0, 50) + '...' : 'No description'}</p><button class="btn btn-primary download"><i class="fas fa-download"></i> Download</button>`;
        engContainer.appendChild(card);
      });
      medNotes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'carousel-card glass';
        card.innerHTML = `<h4>${note.title}</h4><div>${note.course_code || 'N/A'} • ${new Date(note.created_at).toLocaleDateString()}</div><p>${note.content ? note.content.substring(0, 50) + '...' : 'No description'}</p><button class="btn btn-primary download"><i class="fas fa-download"></i> Download</button>`;
        medContainer.appendChild(card);
      });
    }
  } catch (e) {
    console.error('Load notes error', e);
  }
}

// Load projects
async function loadProjects() {
  try {
    const res = await fetch('/api/projects');
    const data = await res.json();
    if (data.success) {
      const mlProjects = data.projects.filter(project => project.technology && (project.technology.toLowerCase().includes('ai') || project.technology.toLowerCase().includes('ml'))).slice(0, 6);
      const javaProjects = data.projects.filter(project => project.technology && project.technology.toLowerCase().includes('java')).slice(0, 6);
      const mlContainer = document.getElementById('mlProjects');
      const javaContainer = document.getElementById('javaProjects');
      const homeProjects = document.getElementById('projectsCarousel');
      mlContainer.innerHTML = '';
      javaContainer.innerHTML = '';
      homeProjects.innerHTML = '';
      data.projects.slice(0, 5).forEach(project => {
        const card = document.createElement('div');
        card.className = 'carousel-card glass';
        card.innerHTML = `<h4>${project.title}</h4><div>${project.technology || 'N/A'} • ${project.completion_percentage}%</div><p>${project.description ? project.description.substring(0, 50) + '...' : 'No description'}</p><div class="progress"><div class="progress-bar w${project.completion_percentage}"></div></div><div class="status">${new Date(project.created_at).toLocaleDateString()}</div>`;
        homeProjects.appendChild(card);
      });
      mlProjects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'carousel-card glass';
        card.innerHTML = `<h4>${project.title}</h4><div>${project.technology || 'N/A'} • ${project.completion_percentage}%</div><p>${project.description ? project.description.substring(0, 50) + '...' : 'No description'}</p><div class="progress"><div class="progress-bar w${project.completion_percentage}"></div></div><div class="status">${new Date(project.created_at).toLocaleDateString()}</div>`;
        mlContainer.appendChild(card);
      });
      javaProjects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'carousel-card glass';
        card.innerHTML = `<h4>${project.title}</h4><div>${project.technology || 'N/A'} • ${project.completion_percentage}%</div><p>${project.description ? project.description.substring(0, 50) + '...' : 'No description'}</p><div class="progress"><div class="progress-bar w${project.completion_percentage}"></div></div><div class="status">${new Date(project.created_at).toLocaleDateString()}</div>`;
        javaContainer.appendChild(card);
      });
    }
  } catch (e) {
    console.error('Load projects error', e);
  }
}

// Upload modal
const uploadBtn = document.getElementById('uploadBtn');
const modal = document.getElementById('uploadModal');
const close = document.getElementsByClassName('close')[0];
uploadBtn.onclick = function() {
  modal.style.display = 'block';
}
close.onclick = function() {
  modal.style.display = 'none';
}
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = 'none';
  }
}

// Upload form
// Upload form handling (notes or projects)
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const type = document.getElementById('uploadType').value;
  const title = document.getElementById('title').value;
  const subject = document.getElementById('subject').value;
  const courseCode = document.getElementById('courseCode').value;
  const content = document.getElementById('content').value;
  const technology = document.getElementById('technology').value;
  const completion = document.getElementById('completion').value;
  const file = document.getElementById('file').files[0];
  const formData = new FormData();
  const token = localStorage.getItem('authToken'); // assume token is stored

  if (!token) {
    alert('Please login first');
    window.location.href = 'index.html';
    return;
  }

  // Disable submit while uploading and provide feedback
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Uploading...'; }

  try {
    let endpoint = '/api/notes';
    if (type === 'note') {
      formData.append('title', title);
      formData.append('subject', subject);
      formData.append('course_code', courseCode);
      formData.append('content', content);
      if (file) formData.append('file', file);
      endpoint = '/api/notes';
    } else {
      formData.append('title', title);
      formData.append('description', content);
      formData.append('technology', technology);
      formData.append('completion_percentage', completion);
      if (file) formData.append('file', file);
      endpoint = '/api/projects';
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });

    const txt = await res.text();
    let data = null;
    if (txt) {
      try { data = JSON.parse(txt); } catch (err) { data = { __raw: txt }; }
    }

    if (!res.ok) {
      const msg = data?.message || data?.__raw || res.statusText || 'Server error';
      alert('Error: ' + msg);
    } else {
      // Success: refresh the lists and close modal
      if (type === 'note') {
        alert('Note uploaded');
        loadNotes();
      } else {
        alert('Project uploaded');
        loadProjects();
      }
      modal.style.display = 'none';
      // Clear form
      e.target.reset();
    }
  } catch (err) {
    console.error('Upload error', err);
    alert('Network error: ' + (err.message || err));
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Upload'; }
  }
});

// Load on page load
document.addEventListener('DOMContentLoaded', () => {
  loadNotes();
  loadProjects();
});
// feed-settings.js
// Settings panel, overlay, focus trap, multi-account management (add, switch, remove, active highlight)
import { getCurrentUser } from './feed-auth.js';

// Fallback API base (mirrors index auth script) if not injected globally
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api';

// Focus trap utilities
let previousFocus = null;
function trapFocus(container){
  previousFocus = document.activeElement;
  const focusables = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if(focusables.length){ focusables[0].focus(); }
  function cycle(e){
    if(e.key !== 'Tab') return;
    const list = Array.from(focusables).filter(el=>!el.disabled && el.offsetParent !== null);
    if(!list.length) return;
    const first = list[0];
    const last = list[list.length -1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
  container._trapHandler = cycle;
  container.addEventListener('keydown', cycle);
}
function releaseFocus(){
  const panel = document.getElementById('settingsPanel');
  if(panel?._trapHandler){ panel.removeEventListener('keydown', panel._trapHandler); delete panel._trapHandler; }
  if(previousFocus){ previousFocus.focus(); previousFocus = null; }
}

// Overlay management
function ensureOverlay(){
  let root = document.getElementById('overlayRoot');
  if(!root){
    root = document.createElement('div');
    root.id = 'overlayRoot';
    document.body.appendChild(root);
  }
  return root;
}
function showOverlay(onClick){
  const root = ensureOverlay();
  let ov = document.querySelector('.overlay-backdrop');
  if(!ov){
    ov = document.createElement('div');
    ov.className = 'overlay-backdrop';
    ov.tabIndex = -1;
    root.appendChild(ov);
  }
  ov.onclick = () => { onClick?.(); };
  ov.classList.remove('closing');
  document.body.classList.add('modal-open');
  return ov;
}
function hideOverlay(){
  const ov = document.querySelector('.overlay-backdrop');
  if(!ov) return;
  ov.classList.add('closing');
  setTimeout(()=>{ ov.remove(); }, 240);
  document.body.classList.remove('modal-open');
}

export function toggleSettingsPanel(force){
  const panel = document.getElementById('settingsPanel');
  if(!panel) return;
  const trigger = document.querySelector('.mini-settings');
  const hidden = panel.hasAttribute('hidden');
  const shouldShow = force === true || (force === undefined && hidden);
  if(shouldShow){
    // Dynamic positioning near trigger button (fallback to fixed coords)
    if(trigger){
      const rect = trigger.getBoundingClientRect();
      const panelWidth = 250; // matches CSS width
      const top = Math.max(12, rect.top + window.scrollY - 10 -  panel.offsetHeight || 0);
      const left = rect.left + window.scrollX;
      // Ensure within viewport horizontally
      const maxLeft = window.innerWidth - panelWidth - 12;
      panel.style.top = Math.max(8, Math.min(top, window.innerHeight - panel.offsetHeight - 12)) + 'px';
      panel.style.left = Math.max(8, Math.min(left, maxLeft)) + 'px';
      panel.style.bottom = 'auto';
      panel.style.position = 'absolute';
    }
    panel.classList.remove('closing');
    panel.removeAttribute('hidden');
    showOverlay(()=> toggleSettingsPanel(false));
    trapFocus(panel);
    console.log('[settings] panel opened');
  } else {
    panel.classList.add('closing');
    hideOverlay();
    setTimeout(()=>{ panel.setAttribute('hidden',''); panel.classList.remove('closing'); releaseFocus(); console.log('[settings] panel closed'); }, 230);
  }
}

// Accounts persistence
function loadAccounts(){
  try { return JSON.parse(localStorage.getItem('accounts')) || []; } catch { return []; }
}
function saveAccounts(accounts){ localStorage.setItem('accounts', JSON.stringify(accounts)); }
function getActiveUsername(){
  const cu = getCurrentUser();
  return cu ? cu.username : null;
}

function renderAccounts(){
  const list = document.getElementById('accountsList');
  if(!list) return;
  const accounts = loadAccounts();
  const active = getActiveUsername();
  list.innerHTML='';
  if(!accounts.length){
    const li = document.createElement('li');
    li.innerHTML = '<div class="acct-meta"><span class="acct-name">No accounts added</span><span class="acct-username">Use the form below</span></div>';
    list.appendChild(li); return;
  }
  accounts.forEach(acct => {
    const li = document.createElement('li');
    if(acct.username === active) li.classList.add('active-account');
  li.innerHTML = `<div class="acct-meta"><span class="acct-name">${acct.username}${acct.username===active? ' <span class="acct-badge">Current</span>':''}</span><span class="acct-username">${acct.email||''}</span></div><button class="switch-acct-btn" data-username="${acct.username}" ${acct.username===active? 'disabled':''}>${acct.username===active? 'Active':'Switch'}</button><button class="remove-acct-btn" data-remove="${acct.username}" title="Remove account" aria-label="Remove ${acct.username}" ${acct.username===active? 'disabled':''}><i class="fas fa-xmark"></i></button>`;
    list.appendChild(li);
  });
}

function switchAccount(username){
  const accounts = loadAccounts();
  const acct = accounts.find(a=>a.username === username);
  if(!acct) return;
  localStorage.setItem('currentUser', JSON.stringify({ id: acct.id || null, username: acct.username, email: acct.email }));
  window.location.reload();
}
function removeAccount(username){
  let accounts = loadAccounts();
  accounts = accounts.filter(a=>a.username !== username);
  saveAccounts(accounts);
  renderAccounts();
}

function toggleAccountSwitcher(force){
  const el = document.getElementById('accountSwitcher');
  if(!el) return;
  const hidden = el.hasAttribute('hidden');
  const show = force === true || (force === undefined && hidden);
  if(show){ el.removeAttribute('hidden'); renderAccounts(); }
  else { el.setAttribute('hidden',''); }
}

export function setupSettings(){
  // Direct binding (in addition to delegation) for resilience
  const directBtn = document.querySelector('.mini-settings');
  if(directBtn){
    directBtn.addEventListener('click', (e)=> {
      e.preventDefault();
      toggleSettingsPanel();
    });
  }
  document.addEventListener('click', e => {
    const settingsBtn = e.target.closest('.mini-settings');
    if(settingsBtn){ toggleSettingsPanel(); }
    if(e.target.closest('.close-settings')) toggleSettingsPanel(false);
    if(e.target.closest('#logoutBtn')){
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      window.location.href = 'index.html';
    }
    const addAccountTrigger = e.target.closest('.settings-item[data-action="add-account"]');
    if(addAccountTrigger){ toggleAccountSwitcher(); }
    if(e.target.closest('.close-accounts')) toggleAccountSwitcher(false);
    const switchBtn = e.target.closest('.switch-acct-btn');
  if(switchBtn?.dataset.username){ switchAccount(switchBtn.dataset.username); }
    const removeBtn = e.target.closest('.remove-acct-btn');
  if(removeBtn?.dataset.remove){
      if(confirm(`Remove account ${removeBtn.dataset.remove}?`)) removeAccount(removeBtn.dataset.remove);
    }
  });

  // Keyboard shortcuts (Esc)
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){
      const panel = document.getElementById('settingsPanel');
      if(panel && !panel.hasAttribute('hidden')) toggleSettingsPanel(false);
      const acct = document.getElementById('accountSwitcher');
      if(acct && !acct.hasAttribute('hidden')) toggleAccountSwitcher(false);
    }
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      const panel = document.getElementById('settingsPanel');
      if(!panel || panel.hasAttribute('hidden')) return;
      const items = Array.from(panel.querySelectorAll('.settings-item'));
      if(!items.length) return;
      const idx = items.indexOf(document.activeElement);
      if(idx >= 0){
        e.preventDefault();
        const next = e.key === 'ArrowDown' ? (idx+1) % items.length : (idx-1+items.length)%items.length;
        items[next].focus();
      }
    }
  });

  // Add account form
  const addForm = document.getElementById('addAccountForm');
  if(addForm){
    addForm.addEventListener('submit', async ev => {
      ev.preventDefault();
      const login = document.getElementById('addAccountLogin').value.trim();
      const pass = document.getElementById('addAccountPassword').value;
      const status = document.getElementById('addAccountStatus');
      status.textContent = 'Authenticating...';
      try {
        const resp = await fetch(`${API_BASE_URL}/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ loginId: login, password: pass }) });
        const data = await resp.json();
        if(data.success){
          const accounts = loadAccounts();
          if(!accounts.find(a=>a.username === data.user.username)){
            accounts.push({ username: data.user.username, email: data.user.email, id: data.user.id });
            saveAccounts(accounts);
          }
          status.textContent = 'Added';
          renderAccounts();
          addForm.reset();
        } else {
          status.textContent = data.message || 'Failed';
        }
      } catch(err){
        console.error('Add account network error', err);
        status.textContent = 'Network error';
      }
    });
  }
}

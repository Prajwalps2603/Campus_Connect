document.addEventListener('DOMContentLoaded', function() {
    // Sidebar Colleges nav logic (simplified - search/filter/back removed)
    document.querySelector('.nav-stack .nav-item[data-section="colleges"]')?.addEventListener('click', function(){
        window.location.href = 'colleges.html';
    });
    // --- Auth Gate & User Context ---
    let currentUser = null;
    let authToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        // Parse defensively; swallow only JSON errors
        currentUser = (function(u){
            try { return JSON.parse(u); } catch { return null; }
        })(storedUser);
    }
    async function silentVerify(){
        if(!authToken) return false;
        try {
            const res = await fetch('/api/verify-token', { headers:{ 'Authorization': 'Bearer ' + authToken }});
            if(!res.ok) return false;
            const data = await res.json();
            if(data?.success){ return true; }
        } catch { return false; }
        return false;
    }
    (async ()=>{
        if(!currentUser){
            const valid = await silentVerify();
            if(!valid){
                window.location.href = 'index.html';
                return;
            }
        }
        updateUserProfile(currentUser);
        const nameSlot = document.getElementById('currentUserSettingName');
        if(nameSlot && currentUser?.username){
            nameSlot.textContent = '@' + currentUser.username;
        }
    })();

    // Toast utility
    function ensureToastHost(){
        let host = document.getElementById('toastHost');
        if(!host){ host = document.createElement('div'); host.id='toastHost'; host.style.cssText='position:fixed; top:10px; left:50%; transform:translateX(-50%); z-index:9999; display:flex; flex-direction:column; gap:8px;'; document.body.appendChild(host);} return host;
    }
    function showToast(message){
        const host = ensureToastHost();
        const t = document.createElement('div');
        t.textContent = message;
        t.style.cssText = 'background:#111b24; color:#dbe7f3; border:1px solid #1f2b35; padding:.55rem .8rem; border-radius:10px; box-shadow:0 8px 28px rgba(0,0,0,.35); opacity:0; transform:translateY(-6px); transition:opacity .2s, transform .2s;';
        host.appendChild(t);
        requestAnimationFrame(()=>{ t.style.opacity='1'; t.style.transform='translateY(0)'; });
        setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(-6px)'; setTimeout(()=> t.remove(), 250); }, 3000);
    }

    // Notifications polling every 30s
    async function fetchNotifications(){
        if(!authToken) return;
        try {
            const res = await fetch('/api/notifications', { headers:{ 'Authorization': 'Bearer ' + authToken }});
            if(!res.ok) return;
            const data = await res.json();
            if(!data?.success) return;
            const items = data.notifications || [];
            if(items.length){
                // Show toast for each new notification
                items.forEach(n => showToast(n.message));
                // Mark as read to avoid re-toasting
                for(const n of items){
                    try { await fetch('/api/notifications/'+n.id+'/read', { method:'POST', headers:{ 'Authorization':'Bearer '+authToken }}); } catch {}
                }
            }
        } catch(err){ /* ignore */ }
    }
    setInterval(fetchNotifications, 30000);
    // Initial fetch shortly after load
    setTimeout(fetchNotifications, 1500);

    // Inject user data into UI elements (profile avatar/name placeholders)
    function updateUserProfile(user) {
        if (!user) return;
        const profileImg = document.querySelector('.user-profile img');
        const userNameInline = document.querySelector('.user-profile .user-name, .user-profile .username');
        if (profileImg) {
            // If backend eventually provides avatar URL, swap here
            profileImg.alt = `${user.username}'s profile`;
        }
        if (userNameInline) {
            userNameInline.textContent = user.username;
        }
        // Optionally update any first post header author name if placeholder exists
        const firstAuthor = document.querySelector('.post .author-info h4');
        if (firstAuthor && firstAuthor.textContent.trim() === 'You') {
            firstAuthor.textContent = user.username;
        }
        console.log('User logged in:', user.username);
    }

        // --- Dynamic Posts (Backend integration) ---
        const postsContainer = document.querySelector('.posts');
    async function fetchPosts(){
        try {
            const headers = {};
            if(authToken) headers['Authorization'] = 'Bearer ' + authToken;
            const res = await fetch('/api/posts?limit=50', { headers });
                        const data = await res.json();
                        if(!data.success) return;
                        renderPosts(data.posts);
                } catch(err){ console.warn('Fetch posts failed', err); }
        }
        function renderPosts(posts){
                if(!postsContainer) return;
                postsContainer.innerHTML = posts.map(p=>postHTML(p)).join('');
        }
        function postHTML(p){
                const isVideo = p.media_type === 'video';
                const mediaEl = isVideo ? `<video src="${p.media_url}" controls playsinline muted class="feed-media"></video>` : `<img src="${p.media_url}" alt="Post media" class="feed-media"/>`;
                const caption = (p.caption||'').replace(/</g,'&lt;');
                return `<div class="post" data-id="${p.id}">
                        <div class="post-header">
                            <div class="post-author">
                                <img src="https://via.placeholder.com/40x40.png?text=U" alt="${p.username}">
                                <div class="author-info">
                                    <div class="author-top">
                                        <h4>${p.username}</h4>
                                    </div>
                                    <p>${new Date(p.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div class="post-content">
                            <p>${caption}</p>
                            <div class="post-image">${mediaEl}</div>
                        </div>
                        <div class="post-interactions">
                            <div class="engagement">
                                <button class="icon-btn like-toggle" type="button" aria-pressed="false" title="Like"><i class="far fa-heart" aria-hidden="true"></i></button>
                                <span class="like-count" aria-label="0 likes">0</span>
                            </div>
                        </div>
                    </div>`;
        }
        fetchPosts();
        if(localStorage.getItem('feedNeedsRefresh')){
            // extra fetch to ensure freshness
            setTimeout(fetchPosts, 500);
            localStorage.removeItem('feedNeedsRefresh');
        }
        // If a newly created post was stored (optimistic add), prepend it
        try {
            const newPostRaw = localStorage.getItem('justCreatedPost');
            if(newPostRaw){
                const p = JSON.parse(newPostRaw);
                if(Array.isArray(p)){
                    // ignore
                } else if(p && p.id){
                    const existingFirst = postsContainer?.firstElementChild;
                    const frag = document.createElement('div');
                    frag.innerHTML = postHTML(p);
                    const newNode = frag.firstElementChild;
                    if(postsContainer && newNode){
                        postsContainer.insertBefore(newNode, existingFirst);
                    }
                }
                localStorage.removeItem('justCreatedPost');
            }
        } catch(err){ console.warn('Failed to inject justCreatedPost', err); }

    // updateUserProfile now called after silent verify
    // Calculate header height once DOM is ready and set CSS variable for layout height calc
    const header = document.querySelector('.header');
    if(header){
        const h = header.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--header-h', h + 'px');
        window.addEventListener('resize', () => {
            const hr = header.getBoundingClientRect().height;
            document.documentElement.style.setProperty('--header-h', hr + 'px');
        });
    }
    // Responsive navigation hamburger toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const leftSidebar = document.getElementById('leftSidebar');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    function openSidebar(){
        if(!leftSidebar) return;
        document.body.classList.add('sidebar-open');
        leftSidebar.classList.add('open');
        sidebarToggle?.classList.add('active');
        sidebarToggle?.setAttribute('aria-expanded','true');
        if(sidebarBackdrop){ sidebarBackdrop.classList.add('visible'); sidebarBackdrop.setAttribute('aria-hidden','false'); }
    }
    function closeSidebar(){
        if(!leftSidebar) return;
        document.body.classList.remove('sidebar-open');
        leftSidebar.classList.remove('open');
        sidebarToggle?.classList.remove('active');
        sidebarToggle?.setAttribute('aria-expanded','false');
        if(sidebarBackdrop){ sidebarBackdrop.classList.remove('visible'); sidebarBackdrop.setAttribute('aria-hidden','true'); }
    }
    function toggleSidebar(){ if(leftSidebar?.classList.contains('open')) closeSidebar(); else openSidebar(); }
    sidebarToggle?.addEventListener('click', (e)=>{ e.stopPropagation(); toggleSidebar(); });
    sidebarBackdrop?.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeSidebar(); });
    // Interaction handlers (delegated)
    function handleNavClick(e){
        const navItem = e.target.closest('.nav-stack.innovative .nav-item');
        if(!navItem) return;
        document.querySelectorAll('.nav-stack.innovative .nav-item.active').forEach(el=>el.classList.remove('active'));
        navItem.classList.add('active');
        // Navigate to dedicated Events page if Events item clicked
        const section = navItem.dataset.section;
        if(section === 'notifications'){
            openNotifications();
            return; // don't run ripple nav redirect for notifications
        }
        if(section === 'events'){
            window.location.href = 'events.html';
            return;
        } else if(section === 'sports'){
            window.location.href = 'sports.html';
            return;
        } else if(section === 'challenges'){
            window.location.href = 'challenges.html';
            return;
        } else if(section === 'trending'){
            window.location.href = 'trending.html';
            return;
        } else if(section === 'search'){
            window.location.href = 'search.html';
            return;
        } else if(section === 'create') {
            window.location.href = 'post.html';
            return;
        }
        const rect = navItem.getBoundingClientRect();
        navItem.style.setProperty('--ripple-x', (e.clientX - rect.left)+'px');
        navItem.style.setProperty('--ripple-y', (e.clientY - rect.top)+'px');
        navItem.classList.remove('ripple-active');
        navItem.getBoundingClientRect();
        navItem.classList.add('ripple-active');
    }
    function handleLike(e){
        const likeBtn = e.target.closest('.like-toggle');
        if(!likeBtn) return;
        const icon = likeBtn.querySelector('i');
        const countEl = likeBtn.parentElement.querySelector('.like-count');
        const liked = likeBtn.classList.toggle('liked');
        likeBtn.setAttribute('aria-pressed', String(liked));
        if(icon){
            icon.classList.toggle('far', !liked);
            icon.classList.toggle('fas', liked);
        }
        const current = parseInt(countEl.textContent)||0;
        countEl.textContent = liked ? current + 1 : Math.max(0, current - 1);
        if(liked) spawnFloatingHeart(likeBtn);
    }
    function handleShare(e){
        const shareBtn = e.target.closest('.share-toggle');
        if(!shareBtn) return;
        const shareCount = shareBtn.parentElement.querySelector('.share-count');
        const val = parseInt(shareCount.textContent)||0;
        shareCount.textContent = val + 1;
    }
    function handleMiniLike(e){
        const miniLike = e.target.closest('.mini-like');
        if(!miniLike) return;
        const icon = miniLike.querySelector('i');
        const countSpan = miniLike.querySelector('.mini-like-count');
        const liked = miniLike.classList.toggle('liked');
        miniLike.setAttribute('aria-pressed', String(liked));
        if(icon){
            icon.classList.toggle('far', !liked);
            icon.classList.toggle('fas', liked);
        }
        const current = parseInt(countSpan.textContent)||0;
        countSpan.textContent = liked ? current + 1 : Math.max(0, current - 1);
    }
    function handleMiniIconRipple(e){
        const miniBtn = e.target.closest('.mini-icon.mini-effect');
        if(!miniBtn) return;
        const rect = miniBtn.getBoundingClientRect();
        miniBtn.style.setProperty('--sx', (e.clientY - rect.top)+'px');
        miniBtn.style.setProperty('--sy', (e.clientX - rect.left)+'px');
        if(miniBtn.classList.contains('mini-facebook')) miniBtn.style.setProperty('--mini-ripple','#1877f2');
        else if(miniBtn.classList.contains('mini-x')) miniBtn.style.setProperty('--mini-ripple','#111');
        else if(miniBtn.classList.contains('mini-whatsapp')) miniBtn.style.setProperty('--mini-ripple','#25D366');
        else miniBtn.style.removeProperty('--mini-ripple');
        miniBtn.classList.remove('ripple');
        miniBtn.getBoundingClientRect();
        miniBtn.classList.add('ripple');
        setTimeout(()=>miniBtn.classList.remove('ripple'), 850);
    }
    function handleMediaActionRipple(e){
        const mediaAction = e.target.closest('.post-actions .action-btn');
        if(!mediaAction) return;
        const rect = mediaAction.getBoundingClientRect();
        mediaAction.style.setProperty('--mx', (e.clientY - rect.top)+'px');
        mediaAction.style.setProperty('--my', (e.clientX - rect.left)+'px');
        mediaAction.classList.remove('ripple');
        mediaAction.getBoundingClientRect();
        mediaAction.classList.add('ripple');
        setTimeout(()=>mediaAction.classList.remove('ripple'), 900);
    }
    // Settings popup logic
    const settingsBtn = document.querySelector('.mini-settings');
    const settingsDialog = document.getElementById('settingsPopup');
    const closeSettingsBtn = settingsDialog?.querySelector('.close-settings');
    function positionSettingsDialog(){
        if(!settingsDialog || !settingsBtn) return;
        // Ensure it's displayed for measurement
        const wasClosed = !settingsDialog.open;
        if(wasClosed && typeof settingsDialog.show === 'function') settingsDialog.show();
        // Temporarily reset positioning to auto for accurate size
        settingsDialog.style.left = '-9999px';
        settingsDialog.style.top = '0px';
        const btnRect = settingsBtn.getBoundingClientRect();
        const dlgRect = settingsDialog.getBoundingClientRect();
        const gap = 10; // space between icon and popup
        let top = btnRect.top - dlgRect.height - gap;
        // If not enough space above, place below
        if(top < 8) top = btnRect.bottom + gap;
        let left = btnRect.left + (btnRect.width/2) - (dlgRect.width/2);
        const vw = window.innerWidth;
        if(left + dlgRect.width > vw - 8) left = vw - dlgRect.width - 8;
        if(left < 8) left = 8;
        settingsDialog.style.top = `${Math.round(top)}px`;
        settingsDialog.style.left = `${Math.round(left)}px`;
        settingsDialog.classList.add('anchored');
    }
    function openSettings(){
        if(!settingsDialog) return;
        if(!settingsDialog.open && typeof settingsDialog.show === 'function') settingsDialog.show();
        positionSettingsDialog();
        window.addEventListener('resize', positionSettingsDialog, { once:true });
    }
    function closeSettings(){
        if(!settingsDialog) return;
        if(settingsDialog.open && typeof settingsDialog.close === 'function') settingsDialog.close();
        settingsDialog.classList.remove('anchored');
    }
    settingsBtn?.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(settingsDialog?.open) closeSettings(); else openSettings();
    });
    closeSettingsBtn?.addEventListener('click', closeSettings);
    document.addEventListener('click', (e)=>{
        if(!settingsDialog) return;
        if(!settingsDialog.contains(e.target) && !e.target.closest('.mini-settings')){
            if(settingsDialog.open) closeSettings();
        }
    });
    document.addEventListener('keydown', (e)=>{
        if(e.key === 'Escape') closeSettings();
    });
    settingsDialog?.addEventListener('click', (e)=>{
        if(e.target === settingsDialog) closeSettings();
    });
    settingsDialog?.addEventListener('click', (e)=>{
        const item = e.target.closest('.settings-item');
        if(!item) return;
        const action = item.getAttribute('data-action');
        if(action === 'logout'){
            renderLogoutConfirm();
        } else if(action === 'switch-account'){
            renderSwitchAccount();
        } else if(action === 'add-account'){
            // Simulate returning to login for adding account (could open small form instead)
            closeSettings();
            window.location.href = 'index.html';
        } else if(['profile','security','saved','activity','blocked','about'].includes(action)) {
            renderPanel(action);
        }
    });

    // --- Settings Panel Logic ---
    const settingsMain = document.getElementById('settingsMain');
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsPanelTitle = document.getElementById('settingsPanelTitle');
    const settingsPanelBody = document.getElementById('settingsPanelBody');
    const backBtn = settingsPanel?.querySelector('.back-settings');

    backBtn?.addEventListener('click', ()=>{
        showMain();
    });

    function showPanel(){
        settingsMain.hidden = true;
        settingsPanel.hidden = false;
    }
    function showMain(){
        settingsPanel.hidden = true;
        settingsMain.hidden = false;
        localStorage.setItem('lastSettingsSection','main');
        focusTrap();
    }

    function renderPanel(section){
        localStorage.setItem('lastSettingsSection', section);
        const generators = {
                        profile: ()=>`<section class="profile-settings">
                                <h5>Profile Settings</h5>
                                <form id="profileForm" class="settings-form">
                                    <label>Full Name
                                        <input type="text" name="fullName" value="${currentUser?.full_name || ''}" placeholder="Your name" required>
                                    </label>
                                    <label>Phone (optional)
                                        <input type="tel" name="phone" value="${currentUser?.phone || ''}" placeholder="Phone number">
                                    </label>
                                    <div class="form-actions">
                                        <button type="submit" class="btn-primary">Save Changes</button>
                                        <button type="button" class="btn-secondary" data-cancel-profile>Cancel</button>
                                    </div>
                                    <div class="form-status" id="profileStatus" aria-live="polite"></div>
                                </form>
                        </section>`,
                        security: ()=>`<section class="security-settings">
                                <h5>Security &amp; Privacy</h5>
                                <form id="passwordForm" class="settings-form">
                                    <label>Current Password
                                        <input type="password" name="currentPassword" minlength="6" required>
                                    </label>
                                    <label>New Password
                                        <input type="password" name="newPassword" minlength="6" required>
                                    </label>
                                    <div class="form-actions">
                                        <button type="submit" class="btn-primary">Change Password</button>
                                        <button type="button" class="btn-secondary" data-cancel-password>Cancel</button>
                                    </div>
                                    <div class="form-status" id="passwordStatus" aria-live="polite"></div>
                                </form>
                                <p class="hint">More privacy controls (sessions, 2FA) coming soon.</p>
                        </section>`,
            saved: ()=>`<section><h5>Saved Items</h5><p>Your bookmarked posts will appear here.</p></section>`,
            activity: ()=>`<section><h5>Your Activity</h5><p>Recent interactions, likes and comments summary.</p></section>`,
            blocked: ()=>`<section><h5>Blocked Accounts</h5><p>Manage users you have blocked.</p></section>`,
            about: ()=>`<section><h5>About</h5><p>Campus Connect version 1.0. More info coming soon.</p></section>`
        };
        settingsPanelTitle.textContent = titleFor(section);
        settingsPanelBody.innerHTML = (generators[section] ? generators[section]() : '<p>Section unavailable.</p>');
        showPanel();
        focusTrap();
        wirePanelEvents(section);
    }

    function titleFor(section){
        switch(section){
            case 'profile': return 'Profile Settings';
            case 'security': return 'Security & Privacy';
            case 'saved': return 'Saved';
            case 'activity': return 'Your Activity';
            case 'blocked': return 'Blocked';
            case 'about': return 'About';
            case 'switch-account': return 'Switch Account';
            case 'logout': return 'Log Out';
            default: return 'Settings';
        }
    }

    function renderSwitchAccount(){
        const accounts = getAccounts();
        settingsPanelTitle.textContent = 'Switch Account';
        const listHtml = accounts.length ? accounts.map(acc => `
            <li data-username="${acc.username}">
                <span>${acc.username}</span>
                <button data-switch="${acc.username}" type="button">Switch</button>
            </li>`).join('') : '<p>No other accounts available.</p>';
        settingsPanelBody.innerHTML = `<ul class="account-switch-list">${listHtml}</ul>`;
        showPanel();
        settingsPanelBody.addEventListener('click', onSwitchAccountClick, { once:false });
        focusTrap();
    }
    function onSwitchAccountClick(e){
        const btn = e.target.closest('button[data-switch]');
        if(!btn) return;
        const uname = btn.getAttribute('data-switch');
        const accounts = getAccounts();
        const target = accounts.find(a=>a.username===uname);
        if(target){
            localStorage.setItem('currentUser', JSON.stringify(target));
            window.location.reload();
        }
    }

    function renderLogoutConfirm(){
        settingsPanelTitle.textContent = 'Log Out';
        settingsPanelBody.innerHTML = `<div class="logout-confirm">
            <p>Are you sure you want to log out?</p>
            <div class="logout-actions">
                <button type="button" class="btn-cancel" data-cancel>Cancel</button>
                <button type="button" class="btn-danger" data-confirm-logout>Log Out</button>
            </div>
        </div>`;
        showPanel();
        settingsPanelBody.addEventListener('click', onLogoutConfirmClick, { once:false });
        focusTrap();
    }
    function onLogoutConfirmClick(e){
        if(e.target.matches('[data-cancel]')){
            showMain();
        } else if(e.target.matches('[data-confirm-logout]')){
            persistAccount(currentUser); // add to switch list
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            window.location.href = 'index.html';
        }
    }

    // Account persistence for Switch Account
    function getAccounts(){
        try { return JSON.parse(localStorage.getItem('accounts')) || []; } catch { return []; }
    }
    function persistAccount(user){
        if(!user?.username) return;
        const accounts = getAccounts();
        if(!accounts.find(a=>a.username===user.username)){
            accounts.push({ username:user.username, id:user.id });
            localStorage.setItem('accounts', JSON.stringify(accounts));
        }
    }

    function wirePanelEvents(section){
        if(section === 'profile'){
            const form = settingsPanelBody.querySelector('#profileForm');
            const statusEl = settingsPanelBody.querySelector('#profileStatus');
            form?.addEventListener('submit', async (e)=>{
                e.preventDefault();
                statusEl.textContent = 'Saving...';
                const formData = new FormData(form);
                const payload = {
                    fullName: formData.get('fullName').trim(),
                    phone: (()=>{ const v=formData.get('phone'); return (typeof v === 'string' ? v.trim() : '').slice(0,30) || null; })()
                };
                try {
                    const res = await fetch('/api/profile',{
                        method:'PATCH',
                        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+authToken },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if(!res.ok || !data.success){
                        statusEl.textContent = data.message || 'Update failed';
                        statusEl.className='form-status error';
                    } else {
                        statusEl.textContent = 'Profile updated';
                        statusEl.className='form-status success';
                        currentUser = data.user;
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                        updateUserProfile(currentUser);
                    }
                } catch(err){
                    console.error('Profile update network error', err);
                    statusEl.textContent = 'Network error';
                    statusEl.className='form-status error';
                }
            });
            settingsPanelBody.querySelector('[data-cancel-profile]')?.addEventListener('click', ()=>showMain());
        }
        if(section === 'security'){
            const form = settingsPanelBody.querySelector('#passwordForm');
            const statusEl = settingsPanelBody.querySelector('#passwordStatus');
            form?.addEventListener('submit', async (e)=>{
                e.preventDefault();
                statusEl.textContent = 'Changing...';
                const formData = new FormData(form);
                const payload = {
                    currentPassword: formData.get('currentPassword'),
                    newPassword: formData.get('newPassword')
                };
                try {
                    const res = await fetch('/api/change-password',{
                        method:'POST',
                        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+authToken },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if(!res.ok || !data.success){
                        statusEl.textContent = data.message || 'Change failed';
                        statusEl.className='form-status error';
                    } else {
                        statusEl.textContent = 'Password changed';
                        statusEl.className='form-status success';
                        form.reset();
                    }
                } catch(err){
                    console.error('Password change network error', err);
                    statusEl.textContent = 'Network error';
                    statusEl.className='form-status error';
                }
            });
            settingsPanelBody.querySelector('[data-cancel-password]')?.addEventListener('click', ()=>showMain());
        }
    }

    // Focus trap inside dialog
    function focusTrap(){
        if(!settingsDialog?.open) return;
        const selectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusables = Array.from(settingsDialog.querySelectorAll(selectors)).filter(el=>!el.disabled && el.offsetParent!==null);
        if(!focusables.length) return;
        let first = focusables[0];
        let last = focusables[focusables.length-1];
        if(document.activeElement && !settingsDialog.contains(document.activeElement)) first.focus();
        function handleKey(e){
            if(e.key === 'Tab'){
                if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
                else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
            }
        }
        settingsDialog.addEventListener('keydown', handleKey, { once:true });
    }

    // Always reset to main when dialog closes or opens anew
    settingsDialog?.addEventListener('close', ()=>{ localStorage.setItem('lastSettingsSection','main'); });
    settingsBtn?.addEventListener('click', ()=>{
        // Force main view on open; if a panel was active previously we do not auto-restore it
        if(settingsDialog?.open === false){
            // After openSettings runs (in earlier listener) ensure main state
            setTimeout(()=>{ showMain(); }, 0);
        }
    });
    document.addEventListener('click', function(e){
        handleNavClick(e);
        handleLike(e);
        handleShare(e);
        handleMiniLike(e);
        handleMiniIconRipple(e);
        handleMediaActionRipple(e);
    });

    /* ================= Notifications System ================= */
    const NOTIF_KEY = 'feedNotifications';
    const notificationsListEl = document.getElementById('notificationsList');
    const notifBackdrop = document.getElementById('notificationsBackdrop');
    const notifBadge = document.getElementById('notifBadge');
    const notifCloseBtn = document.getElementById('notifCloseBtn');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const clearAllNotifBtn = document.getElementById('clearAllNotifBtn');
    let notifications = [];

    function loadNotifications(){
        try { notifications = JSON.parse(localStorage.getItem(NOTIF_KEY)) || []; } catch { notifications = []; }
        if(!notifications.length){ seedSampleNotifications(); }
    }
    function saveNotifications(){ try { localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications)); } catch {} }
    function seedSampleNotifications(){
        notifications = [
            {id:genId(), type:'like', text:'<strong>Sarah</strong> liked your post about the tech fest.', time: Date.now()-1000*60*5, unread:true, avatar:'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&h=120&fit=crop&crop=face'},
            {id:genId(), type:'comment', text:'<strong>Mike</strong> commented: “Can’t wait to see this!”', time: Date.now()-1000*60*60, unread:true, avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face'},
            {id:genId(), type:'follow', text:'<strong>Emma</strong> started following you.', time: Date.now()-1000*60*60*3, unread:false, avatar:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face'},
            {id:genId(), type:'event', text:'<strong>Campus Robotics Workshop</strong> starts tomorrow. You RSVP’d.', time: Date.now()-1000*60*60*8, unread:true, avatar:'https://picsum.photos/seed/event1/120/120'},
            {id:genId(), type:'mention', text:'<strong>Alex</strong> mentioned you in a comment.', time: Date.now()-1000*60*60*18, unread:false, avatar:'https://picsum.photos/seed/alex1/120/120'}
        ];
        saveNotifications();
    }
    function genId(){ return Math.random().toString(36).slice(2,11); }
    function timeAgo(ts){
        const diff = Date.now()-ts; const sec = Math.floor(diff/1000);
        if(sec<60) return sec + 's';
        const min = Math.floor(sec/60); if(min<60) return min + 'm';
        const hr = Math.floor(min/60); if(hr<24) return hr + 'h';
        const day = Math.floor(hr/24); return day + 'd';
    }
    function renderNotifications(){
        if(!notificationsListEl) return;
        if(!notifications.length){
            notificationsListEl.innerHTML = '<li class="notif-empty"><i class="fas fa-bell-slash"></i><span>No notifications yet.</span></li>';
            updateNotifBadge();
            return;
        }
        notificationsListEl.innerHTML = notifications.map(n=>`<li class="notification-item ${n.unread?'unread':''}" data-id="${n.id}">
            <div class="notification-avatar">${ n.avatar ? `<img src="${n.avatar}" alt="">` : '<i class="fas fa-user"></i>' }</div>
            <div class="notification-body">
                <div class="n-text">${n.text}</div>
                <div class="n-meta"><span>${timeAgo(n.time)}</span><span>${n.type}</span></div>
            </div>
            ${n.unread?'<span class="notification-pill">NEW</span>':''}
        </li>`).join('');
        updateNotifBadge();
    }
    function updateNotifBadge(){
        if(!notifBadge) return;
        const unread = notifications.filter(n=>n.unread).length;
        if(unread){ notifBadge.textContent = unread>99?'99+':unread; notifBadge.hidden=false; }
        else { notifBadge.hidden=true; }
    }
    function openNotifications(){
        if(!notifBackdrop) return;
        notifBackdrop.classList.add('open');
        notifBackdrop.setAttribute('aria-hidden','false');
        document.body.style.overflow='hidden';
        renderNotifications();
        // focus first interactive element
        setTimeout(()=>{ notifCloseBtn?.focus(); }, 60);
    }
    function closeNotifications(){
        if(!notifBackdrop) return;
        notifBackdrop.classList.remove('open');
        notifBackdrop.setAttribute('aria-hidden','true');
        document.body.style.overflow='';
    }
    function markAllRead(){ notifications.forEach(n=> n.unread=false); saveNotifications(); renderNotifications(); }
    function clearAll(){ notifications=[]; saveNotifications(); renderNotifications(); }
    function markSingleRead(id){ const n = notifications.find(n=>n.id===id); if(n && n.unread){ n.unread=false; saveNotifications(); updateNotifBadge(); const li = notificationsListEl.querySelector(`.notification-item[data-id="${id}"]`); if(li){ li.classList.remove('unread'); const pill = li.querySelector('.notification-pill'); pill?.remove(); }} }

    notifBackdrop?.addEventListener('click', (e)=>{ if(e.target === notifBackdrop) closeNotifications(); });
    notifCloseBtn?.addEventListener('click', closeNotifications);
    markAllReadBtn?.addEventListener('click', markAllRead);
    clearAllNotifBtn?.addEventListener('click', ()=>{ if(confirm('Clear all notifications?')) clearAll(); });
    notificationsListEl?.addEventListener('click', (e)=>{
        const item = e.target.closest('.notification-item');
        if(!item) return;
        const id = item.getAttribute('data-id');
        markSingleRead(id);
        // future: could navigate based on type
    });
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && notifBackdrop?.classList.contains('open')) closeNotifications(); });
    loadNotifications();
    updateNotifBadge();

    // Comment input enable/disable + submit simulation
    document.addEventListener('input', function(e){
        if(e.target.classList.contains('comment-input')){
            const wrapper = e.target.closest('.comment-box');
            const sendBtn = wrapper.querySelector('.send-comment');
            sendBtn.disabled = e.target.value.trim().length === 0;
        }
    });

    // --- Chat Button Integration (message center) ---
    const chatBtn = document.getElementById('chatBtn');
    const chatBadge = document.getElementById('chatBadge');
    function loadStoredConversations(){
        try { return JSON.parse(localStorage.getItem('msg_conversations')) || []; } catch { return []; }
    }
    function updateChatBadge(){
        const convs = loadStoredConversations();
        // Expect each conversation maybe has unread boolean or unread count; fallback to messages with unread flag later
        let unread = 0;
        convs.forEach(c=>{ if(c.unread) unread++; });
        chatBadge.textContent = unread;
        chatBadge.style.display = unread ? 'inline-block' : 'none';
    }
    updateChatBadge();
    chatBtn?.addEventListener('click', ()=>{
        window.location.href = 'message.html';
    });
    // Provide a simple event hook other pages can dispatch to force badge refresh
    window.addEventListener('storage', (e)=>{ if(e.key === 'msg_conversations') updateChatBadge(); });

    document.addEventListener('keydown', function(e){
        if(e.target.classList.contains('comment-input') && e.key === 'Enter'){
            e.preventDefault();
            submitComment(e.target);
        }
    });

    document.addEventListener('click', function(e){
        if(e.target.classList.contains('send-comment')){
            const box = e.target.closest('.comment-box');
            const input = box.querySelector('.comment-input');
            submitComment(input);
        }
    });

    function submitComment(input){
        const text = input.value.trim();
        if(!text) return;
        // Increment comment count
        const engagement = input.closest('.post').querySelector('.engagement');
        const commentCount = engagement.querySelector('.comment-count');
        const current = parseInt(commentCount.textContent)||0;
        commentCount.textContent = current + 1;
        // Append visible comment
        const list = input.closest('.post-interactions').querySelector('.comments-list');
        if(list){
            const li = document.createElement('li');
            li.className = 'comment-item';
            li.innerHTML = `
                <div class="comment-body">
                    <span class="comment-author">You</span>
                    <span class="comment-text"></span>
                </div>
                <button class="mini-like" type="button" aria-pressed="false" title="Like comment">
                    <i class="far fa-heart" aria-hidden="true"></i>
                    <span class="mini-like-count">0</span>
                </button>`;
            li.querySelector('.comment-text').textContent = text;
            list.appendChild(li);
        }
        input.value='';
        const sendBtn = input.closest('.comment-box').querySelector('.send-comment');
        sendBtn.disabled = true;
    }

    // Post submission
    const postInput = document.querySelector('.post-input input');
    const postBtn = document.querySelector('.post-btn');
    
    postBtn.addEventListener('click', function() {
        const content = postInput.value.trim();
        if (content) {
            createNewPost(content);
            postInput.value = '';
        }
    });

    postInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const content = this.value.trim();
            if (content) {
                createNewPost(content);
                this.value = '';
            }
        }
    });

    function createNewPost(content) {
        const postsContainer = document.querySelector('.posts');
        const newPost = document.createElement('div');
        newPost.className = 'post';
        newPost.innerHTML = `
            <div class="post-header">
                <div class="post-author">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face" alt="You">
                    <div class="author-info">
                        <div class="author-top">
                            <h4>${currentUser ? currentUser.username : 'You'}</h4>
                        </div>
                        <p>Student</p>
                    </div>
                </div>
                <button class="more-options">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
            <div class="post-content">
                <p>${content}</p>
            </div>
            <div class="post-interactions">
                <div class="engagement">
                    <button class="icon-btn like-toggle" type="button" aria-pressed="false" title="Like">
                        <i class="far fa-heart" aria-hidden="true"></i>
                    </button>
                    <span class="like-count" aria-label="0 likes">0</span>
                    <button class="icon-btn comment-toggle" type="button" title="Comments">
                        <i class="far fa-comment" aria-hidden="true"></i>
                    </button>
                    <span class="comment-count" aria-label="0 comments">0</span>
                    <button class="icon-btn share-toggle" type="button" title="Share">
                        <i class="far fa-share-square" aria-hidden="true"></i>
                    </button>
                    <span class="share-count" aria-label="0 shares">0</span>
                </div>
                <div class="comment-box" aria-label="Add a comment">
                    <input type="text" placeholder="Add a comment..." class="comment-input" />
                    <button class="send-comment" type="button" disabled>Post</button>
                </div>
                <ul class="comments-list">
                    <li class="comment-item">
                        <div class="comment-body">
                            <span class="comment-author">CampusBot</span>
                            <span class="comment-text">Welcome to your new post! 🎉</span>
                        </div>
                        <button class="mini-like" type="button" aria-pressed="false" title="Like comment">
                            <i class="far fa-heart" aria-hidden="true"></i>
                            <span class="mini-like-count">0</span>
                        </button>
                    </li>
                </ul>
            </div>
        `;
        
        postsContainer.insertBefore(newPost, postsContainer.firstChild);
        
        // Interactions are delegated globally; nothing else needed here
    }

    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const posts = document.querySelectorAll('.post');
            
            posts.forEach(post => {
                const content = post.querySelector('.post-content p')?.textContent.toLowerCase() || '';
                const author = post.querySelector('.author-info h4')?.textContent.toLowerCase() || '';
                
                if (content.includes(searchTerm) || author.includes(searchTerm)) {
                    post.style.display = 'block';
                } else {
                    post.style.display = 'none';
                }
            });
        });
    }

    // Follow button toggle (event delegation for performance)
    document.addEventListener('click', function(e){
        const btn = e.target.closest('.follow-btn');
        if(!btn) return;
        const isFollowing = btn.classList.toggle('following');
        btn.setAttribute('aria-pressed', String(isFollowing));
        btn.textContent = isFollowing ? 'Following' : 'Follow';
    });

    // Mobile menu toggle (for future implementation)
    console.log('Campus Connect Feed loaded successfully!');

    // Drag-to-scroll for stories (desktop + touch)
    const storyScroll = document.querySelector('.stories-scroll');
    if(storyScroll){
        let isDown = false; let startX = 0; let scrollLeft = 0;
        storyScroll.addEventListener('mousedown', (e)=>{
            isDown = true;
            storyScroll.classList.add('active');
            startX = e.pageX - storyScroll.getBoundingClientRect().left;
            scrollLeft = storyScroll.scrollLeft;
        });
        storyScroll.addEventListener('mouseleave', ()=>{ isDown=false; storyScroll.classList.remove('active'); });
        storyScroll.addEventListener('mouseup', ()=>{ isDown=false; storyScroll.classList.remove('active'); });
        storyScroll.addEventListener('mousemove', (e)=>{
            if(!isDown) return;
            e.preventDefault();
            const x = e.pageX - storyScroll.getBoundingClientRect().left;
            const walk = (x - startX) * 1.2; // speed multiplier
            storyScroll.scrollLeft = scrollLeft - walk;
        });
        // Touch support
        let touchStartX = 0; let touchScrollLeft = 0;
        storyScroll.addEventListener('touchstart', (e)=>{ touchStartX = e.touches[0].pageX; touchScrollLeft = storyScroll.scrollLeft; });
        storyScroll.addEventListener('touchmove', (e)=>{ const x = e.touches[0].pageX; const walk = (x - touchStartX) * 1.2; storyScroll.scrollLeft = touchScrollLeft - walk; });
    }

    // Floating heart creation
    function spawnFloatingHeart(sourceBtn){
        const engagement = sourceBtn.closest('.engagement');
        if(!engagement) return;
        const heart = document.createElement('span');
        const variants = ['floating-heart','floating-heart alt1','floating-heart alt2'];
        heart.className = variants[Math.floor(Math.random()*variants.length)];
        // Random slight horizontal drift & rotation
        const drift = (Math.random() * 60 - 30).toFixed(0); // -30 to +30px
        const rot = (Math.random() * 60 - 30).toFixed(0);   // -30 to +30deg
        heart.style.setProperty('--xOffset', drift + 'px');
        heart.style.setProperty('--rot', rot + 'deg');
        heart.setAttribute('aria-hidden','true');
        heart.textContent = '❤';
        engagement.appendChild(heart);
        heart.addEventListener('animationend', () => heart.remove());
    }

    // Floating heart at arbitrary coordinates inside post (double-click)
    function spawnFloatingHeartAt(post, x, y){
        const heart = document.createElement('span');
        const variants = ['floating-heart dbl','floating-heart dbl alt1','floating-heart dbl alt2'];
        heart.className = variants[Math.floor(Math.random()*variants.length)];
        const drift = (Math.random()*40 - 20).toFixed(0); // smaller drift for dbl
        const rot = (Math.random()*50 - 25).toFixed(0);
        heart.style.left = (x - post.getBoundingClientRect().left - 20) + 'px';
        heart.style.top = (y - post.getBoundingClientRect().top - 20) + 'px';
        heart.style.setProperty('--xOffset', drift + 'px');
        heart.style.setProperty('--rot', rot + 'deg');
        heart.textContent = '❤';
        heart.setAttribute('aria-hidden','true');
        post.appendChild(heart);
        heart.addEventListener('animationend', () => heart.remove());
    }

    // Double-click like restricted to post image/content media area
    document.addEventListener('dblclick', function(e){
        // Only trigger if double-click target is inside a post's media area (.post-image img) or the .post-image wrapper
        const img = e.target.closest('.post-image img, .post-image');
        if(!img) return;
        const post = e.target.closest('.post');
        if(!post) return;
        const likeBtn = post.querySelector('.like-toggle');
        if(likeBtn && !likeBtn.classList.contains('liked')){
            likeBtn.click();
        }
        spawnFloatingHeartAt(post, e.clientX, e.clientY);
    });

        // Navigate to profile page when clicking avatar in header
        const headerProfile = document.querySelector('.user-profile');
        if(headerProfile){
            headerProfile.style.cursor = 'pointer';
            headerProfile.addEventListener('click', () => {
                window.location.href = 'profile.html';
            });
        }

        // Also allow opening profile from settings panel if data-action="profile"
        document.addEventListener('click', (e)=>{
            const profileAction = e.target.closest('.settings-item[data-action="profile"]');
            if(profileAction){
                window.location.href = 'profile.html';
            }
        });
});


// Unified Messaging Script (merged logic of previous message.js and messages.js)
// Supports BOTH DOM structures:
//  New UI (Instagram-style): elements with ids: conversationsList, emptyChat, chatInterface, messagesArea, currentChatUser, currentChatAvatar, currentChatStatus, messageInput, sendBtn, searchInput, startChatBtn
//  Legacy UI: conversations, conversationSearch, chatWrapper, chatPlaceholder, messagesScroll, peerName, peerAvatar, messageForm, messageInput
// Auto-detects which structure is present and initializes appropriate behavior.

window.__UnifiedMessagingLoaded = true;

// --------------------------------------------------
// User Context
// --------------------------------------------------
const currentUser = (()=>{ try { return JSON.parse(localStorage.getItem('currentUser')); } catch { return null; } })();

// --------------------------------------------------
// Data Model (merged)
// --------------------------------------------------
// Base conversations from original message.js (short form messages)
const baseConversations = [
    { id: 'n1', name: 'Prajwal M P', lastActive: 'Active 15h ago', lastMessage: 'You: Adu all smash it job! disha amba $h', unread:false, online:false, avatar:'P', color:'#405de6', messages:[
        { text:"Hey, how's the project going?", time:'10:30 AM', sent:false },
        { text:'Going great! Almost finished with the frontend', time:'10:31 AM', sent:true },
        { text:'Adu all smash it job! disha amba $h', time:'10:32 AM', sent:true }
    ]},
    { id: 'n2', name: 'Mike', lastActive: 'Active 2h ago', lastMessage: 'You: Ulla gyna', unread:false, online:true, avatar:'M', color:'#833ab4', messages:[
        { text:'Meeting tomorrow at 3 PM', time:'Yesterday', sent:false },
        { text:'Ulla gyna', time:'Yesterday', sent:true }
    ]},
    { id: 'n3', name: 'spoorthi_Ps', lastActive: 'Active 18h ago', lastMessage: 'You: hoe r u', unread:true, online:false, avatar:'S', color:'#c13584', messages:[
        { text:'Did you see the new assignment?', time:'18h ago', sent:false },
        { text:'how r u', time:'18h ago', sent:true }
    ]},
    { id: 'n4', name: 'Himesh 32', lastActive: 'Active now', lastMessage: 'You sent an attachment', unread:false, online:true, avatar:'H', color:'#e1306c', messages:[
        { text:'Check out this document I shared', time:'14h ago', sent:false },
        { text:'*Attachment sent*', time:'14h ago', sent:true }
    ]},
    { id: 'n5', name: 'Priya Shivadas', lastActive: 'Active 7h ago', lastMessage: 'New match! Start chatting', unread:true, online:false, avatar:'P', color:'#fd1d1d', messages:[] },
    { id: 'n6', name: 'Kavya M P', lastActive: 'Active 4h ago', lastMessage: "You: Can I have u'r selfie two...", unread:false, online:true, avatar:'K', color:'#f56040', messages:[
        { text:'Hey there!', time:'4h ago', sent:false },
        { text:"Can I have u'r selfie two...", time:'4h ago', sent:true }
    ]},
    { id: 'n7', name: 'shobha_shivdas', lastActive: 'Active 16h ago', lastMessage: 'Thanks for connecting!', unread:true, online:false, avatar:'S', color:'#ffdc80', messages:[
        { text:'Thanks for connecting!', time:'16h ago', sent:false }
    ]}
];

// Legacy sample conversations (rich avatar URLs, timestamp based)
function legacySamples(){
    const now = Date.now();
    const u = currentUser?.username || 'You';
    return [
        { id:'c1', name:'Sarah Johnson', avatar:'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face', messages:[
            { from:'Sarah Johnson', outgoing:false, text:'Hey! Are you coming to the project meet?', ts:now-600000 },
            { from:u, outgoing:true, text:'Yeah, I will be there in 10 mins.', ts:now-560000 }
        ]},
        { id:'c2', name:'Mike Chen', avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', messages:[
            { from:'Mike Chen', outgoing:false, text:'Finished the AR module! 🎉', ts:now-860000 },
            { from:u, outgoing:true, text:'Nice! Can you push it?', ts:now-820000 }
        ]},
        { id:'c3', name:'Priya Singh', avatar:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face', messages:[
            { from:'Priya Singh', outgoing:false, text:'Talent show rehearsal today?', ts:now-960000 }
        ]},
        { id:'c4', name:'Alex Rivera', avatar:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face', messages:[
            { from:'Alex Rivera', outgoing:false, text:'Need the lab report template?', ts:now-400000 },
            { from:u, outgoing:true, text:'Yes, send it please.', ts:now-380000 },
            { from:'Alex Rivera', outgoing:false, text:'Sent to your email.', ts:now-360000 }
        ]},
        { id:'c5', name:'Daniel Lee', avatar:'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face', messages:[
            { from:'Daniel Lee', outgoing:false, text:'Game jam team still on?', ts:now-720000 },
            { from:u, outgoing:true, text:'Yep, meeting tonight.', ts:now-700000 }
        ]},
        { id:'c6', name:'Emily Wright', avatar:'https://images.unsplash.com/photo-1529626455594-4f5a5a6a4f5a?w=80&h=80&fit=crop&crop=face', messages:[
            { from:'Emily Wright', outgoing:false, text:'Slides for tomorrow are done.', ts:now-300000 },
            { from:u, outgoing:true, text:'Great! I will review now.', ts:now-280000 }
        ]},
        { id:'c7', name:'Study Group', avatar:'https://images.unsplash.com/photo-1529626455594-8f58b1f6c7b8?w=80&h=80&fit=crop&crop=face', messages:[
            { from:'Study Group', outgoing:false, text:'Reminder: quiz prep at 6 PM.', ts:now-500000 },
            { from:u, outgoing:true, text:'I will join after class.', ts:now-480000 },
            { from:'Study Group', outgoing:false, text:'Cool, see you then.', ts:now-460000 }
        ]},
        { id:'c8', name:'Liam Patel', avatar:'https://images.unsplash.com/photo-1529626455594-916d8b25a3d2?w=80&h=80&fit=crop&crop=face', messages:[
            { from:'Liam Patel', outgoing:false, text:'Did you upload the design brief?', ts:now-250000 },
            { from:u, outgoing:true, text:'Just did. Check the shared folder.', ts:now-240000 }
        ]},
        { id:'c9', name:'Campus Bot', avatar:'https://images.unsplash.com/photo-1502767089025-6572583495b0?w=80&h=80&fit=crop&crop=face', messages:[
            { from:'Campus Bot', outgoing:false, text:'Your library book is due tomorrow.', ts:now-200000 }
        ]},
        { id:'c10', name:'Robotics Club', avatar:'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&crop=face', messages:[
            { from:'Robotics Club', outgoing:false, text:'Parts order arrived. Build session at 5?', ts:now-180000 },
            { from:u, outgoing:true, text:'I can be there by 5:10.', ts:now-170000 }
        ]},
        { id:'c11', name:'Nina Gomez', avatar:'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=80&h=80&fit=crop&crop=face', messages:[
            { from:'Nina Gomez', outgoing:false, text:'Can you proofread my essay intro?', ts:now-155000 },
            { from:u, outgoing:true, text:'Send it over, I will look now.', ts:now-145000 }
        ]},
        { id:'c12', name:'Library Desk', avatar:'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face', messages:[
            { from:'Library Desk', outgoing:false, text:'Study room booking confirmed for 3 PM.', ts:now-120000 },
            { from:u, outgoing:true, text:'Thanks for the confirmation!', ts:now-115000 }
        ]}
    ];
}

// Normalize legacy conversations into new-format objects for the modern UI when needed
function mapLegacyToNewFormat(legacy){
    return legacy.map(l => {
        const last = l.messages[l.messages.length-1];
        return {
            id: l.id,
            name: l.name,
            lastActive: 'Active recently',
            lastMessage: (last ? (last.outgoing ? 'You: ' : '') + last.text : 'No messages yet'),
            unread: false,
            online: false,
            avatar: (l.name[0]||'?').toUpperCase(),
            color: '#5a4b8d',
            messages: l.messages.map(m => ({ text: m.text, time: formatTime(m.ts), sent: !!m.outgoing }))
        };
    });
}

// Utility to format time from timestamp
function formatTime(ts){
    const d = new Date(ts);
    let h = d.getHours();
    let m = d.getMinutes();
    if(m < 10) m = '0'+m;
    return h+':'+m;
}

// Persistence (optional lightweight) - store & load merged conversations in localStorage
const STORAGE_KEY = 'unified_conversations_v1';
function loadStored(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
}
function saveStored(convs){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(convs)); } catch {}
}

let conversationsUnified = loadStored();
if(!conversationsUnified){
    // Merge new base + mapped legacy (avoid id collisions by keeping strings vs numeric)
    conversationsUnified = [ ...baseConversations, ...mapLegacyToNewFormat(legacySamples()) ];
    saveStored(conversationsUnified);
}

// --------------------------------------------------
// Header personalization (common)
// --------------------------------------------------
(function personalizeHeader(){
    if(currentUser){
        const handleEl = document.getElementById('currentUserHandle');
        const avatarEl = document.getElementById('currentUserAvatar');
        if(handleEl) handleEl.textContent = currentUser.username || handleEl.textContent;
        if(avatarEl && currentUser.username){
            avatarEl.textContent = (currentUser.username[0]||'U').toUpperCase();
        }
    }
})();

// --------------------------------------------------
// NEW UI IMPLEMENTATION
// --------------------------------------------------
function initNewUI(){
    let currentConversation = null;
    let typingTimer = null;

    const conversationsList = document.getElementById('conversationsList');
    const emptyChat = document.getElementById('emptyChat');
    const chatInterface = document.getElementById('chatInterface');
    const messagesArea = document.getElementById('messagesArea');
    const currentChatUser = document.getElementById('currentChatUser');
    const currentChatAvatar = document.getElementById('currentChatAvatar');
    const currentChatStatus = document.getElementById('currentChatStatus');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const searchInput = document.getElementById('searchInput');
    const startChatBtn = document.getElementById('startChatBtn');
    const chatArea = document.querySelector('.chat-area');
    const conversationsSidebar = document.querySelector('.conversations-sidebar');
    const backBtn = document.getElementById('chatBackBtn'); // now located in sidebar header

    function escapeHtml(str){ return str.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch])); }

    function renderConversations(filter=''){
        const filtered = conversationsUnified.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
        conversationsList.innerHTML = filtered.map(conv => `
            <li class="conversation-item ${currentConversation?.id===conv.id?'active':''}" data-id="${conv.id}" tabindex="0" aria-label="Conversation with ${conv.name}">
                <div class="conversation-avatar" style="background-color:${conv.color}">
                    ${conv.avatar}
                    ${conv.online?'<div class="online-indicator"></div>':''}
                </div>
                <div class="conversation-info">
                    <div class="conversation-header">
                        <div class="conversation-name">${conv.name}</div>
                        <div class="conversation-time">${conv.lastActive}</div>
                    </div>
                    <div class="conversation-preview">${conv.lastMessage} ${conv.unread?'<span class="unread-badge">new</span>':''}</div>
                </div>
            </li>`).join('');
    }

    function renderMessages(){
        if(!currentConversation) return;
        messagesArea.innerHTML = currentConversation.messages.map(msg => `
            <div class="message ${msg.sent?'sent':'received'}">
                <div class="message-text">${escapeHtml(msg.text)}</div>
                <div class="message-time">${msg.time}</div>
            </div>`).join('');
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function selectConversation(id){
        currentConversation = conversationsUnified.find(c => c.id==id);
        if(!currentConversation) return;
        emptyChat && (emptyChat.style.display='none');
        chatInterface && (chatInterface.style.display='flex');
            // Mobile: show chat panel, hide conversation list
            if(window.innerWidth <= 768 && chatArea){
                chatArea.classList.add('active');
                if(conversationsSidebar) conversationsSidebar.style.display='none';
            }
        currentChatUser && (currentChatUser.textContent=currentConversation.name);
        if(currentChatAvatar){
            currentChatAvatar.textContent = currentConversation.avatar;
            currentChatAvatar.style.backgroundColor = currentConversation.color;
        }
        currentChatStatus && (currentChatStatus.textContent=currentConversation.online?'Active now':currentConversation.lastActive);
        currentConversation.unread=false;
        renderMessages();
        renderConversations(searchInput?.value.trim()||'');
        simulateTyping();
    }

    function updateLastMessage(conv, text){
        conv.lastMessage = `You: ${text}`;
        conv.lastActive = 'Active now';
    }

        function handleInputChange(){
            const hasText = messageInput.value.trim().length>0;
            if(sendBtn) sendBtn.disabled = !hasText;
            // Removed local showTypingIndicator trigger so typing bubble only appears for remote (simulated) user.
        }
    function handleKeyPress(e){ if(e.key==='Enter' && !sendBtn.disabled) sendMessage(); }

    function sendMessage(){
        const text = messageInput.value.trim();
        if(!text || !currentConversation) return;
        currentConversation.messages.push({ text, time:'Just now', sent:true });
        updateLastMessage(currentConversation, text);
        messageInput.value='';
        if(sendBtn) sendBtn.disabled=true;
        hideTypingIndicator();
        renderMessages();
        renderConversations(searchInput?.value.trim()||'');
        saveStored(conversationsUnified);
        setTimeout(simulateReply, 1400+Math.random()*1000);
    }

    function showTypingIndicator(){
        if(!messagesArea || !currentConversation) return;
        if(messagesArea.querySelector('#typingIndicator')) return;
        const indicator = document.createElement('div');
        indicator.id='typingIndicator';
        indicator.className='message received';
        indicator.innerHTML='<div class="message-text"><i>typing...</i></div>';
        messagesArea.appendChild(indicator);
        messagesArea.scrollTop = messagesArea.scrollHeight;
        clearTimeout(typingTimer);
        typingTimer = setTimeout(hideTypingIndicator, 3000);
    }
    function hideTypingIndicator(){
        const ind = document.getElementById('typingIndicator');
        if(ind) ind.remove();
        clearTimeout(typingTimer);
    }
    function simulateTyping(){ setTimeout(()=>{ showTypingIndicator(); setTimeout(hideTypingIndicator,1800); },800); }
    function simulateReply(){
        if(!currentConversation) return;
        const replies=["That's awesome!","I'll check it out","Sounds good to me","Let me think about that","Can we discuss this later?","I agree with you"]; 
        const r = replies[Math.floor(Math.random()*replies.length)];
        currentConversation.messages.push({ text:r, time:'Just now', sent:false });
        currentConversation.lastMessage = r;
        renderMessages();
        renderConversations(searchInput?.value.trim()||'');
        saveStored(conversationsUnified);
        simulateTyping();
    }
    function handleSearch(){ renderConversations(searchInput.value.trim()); }
    function startNewChat(){ alert('New chat dialog (future enhancement)'); }

    conversationsList?.addEventListener('click', e => { const item = e.target.closest('.conversation-item'); if(item) selectConversation(item.dataset.id); });
    conversationsList?.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){ const item=e.target.closest('.conversation-item'); if(item){ e.preventDefault(); selectConversation(item.dataset.id);} } });
    backBtn?.addEventListener('click', () => {
        // Navigate back if possible, else go to feed
        const ref = document.referrer;
        const sameOrigin = ref?.startsWith(location.origin);
        if(window.history.length > 1 && sameOrigin){
            window.history.back();
        } else {
            window.location.href = 'feed.html';
        }
    });

        // Handle window resize to re-show sidebar if transitioning to desktop width
        window.addEventListener('resize', () => {
            if(window.innerWidth > 768){
                if(conversationsSidebar) conversationsSidebar.style.display='flex';
                if(chatArea && chatInterface && currentConversation){
                    chatArea.classList.add('active');
                    chatInterface.style.display='flex';
                }
            } else if(!currentConversation){
                if(chatArea) chatArea.classList.remove('active');
            }
        });
    messageInput?.addEventListener('input', handleInputChange);
    messageInput?.addEventListener('keypress', handleKeyPress);
    sendBtn?.addEventListener('click', sendMessage);
    searchInput?.addEventListener('input', handleSearch);
    startChatBtn?.addEventListener('click', startNewChat);

    renderConversations();
}

// --------------------------------------------------
// LEGACY UI IMPLEMENTATION
// --------------------------------------------------
function initLegacyUI(){
    const conversationsEl = document.getElementById('conversations');
    const searchInput = document.getElementById('conversationSearch');
    const chatWrapper = document.getElementById('chatWrapper');
    const chatPlaceholder = document.getElementById('chatPlaceholder');
    const messagesScroll = document.getElementById('messagesScroll');
    const peerNameEl = document.getElementById('peerName');
    const peerAvatarImg = document.getElementById('peerAvatar');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const backFeed = document.querySelector('.back-feed');
    backFeed?.addEventListener('click', ()=>{ window.location.href='feed.html'; });

    // Filter only legacy-type conversations (those with string id starting with 'c')
    let legacyOnly = conversationsUnified.filter(c => /^c\d+/.test(c.id) || c.id.startsWith('c'));
    if(legacyOnly.length===0){
        // If user storage replaced them, rebuild from samples
        const rebuilt = mapLegacyToNewFormat(legacySamples());
        conversationsUnified.push(...rebuilt);
        legacyOnly = rebuilt;
    }
    let activeId = null;

    function adjustHeight(){
        if(!messagesScroll) return;
        const form = messageForm;
        const top = messagesScroll.getBoundingClientRect().top;
        const formH = form ? form.getBoundingClientRect().height : 0;
        const gap = 16;
        const h = window.innerHeight - top - formH - gap;
        if(h>120) messagesScroll.style.maxHeight = h+'px';
    }
    window.addEventListener('resize', adjustHeight);
    window.addEventListener('orientationchange', adjustHeight);
    setTimeout(adjustHeight, 50);

    function renderConversations(filter=''){
        const f = filter.toLowerCase();
        conversationsEl.innerHTML = legacyOnly
            .filter(c => c.name.toLowerCase().includes(f))
            .map(c => {
                const lastLine = c.lastMessage || 'No messages yet';
                const unreadBadge = c.unread ? `<span class="unread-badge">new</span>` : '';
                return `<li class="conversation${c.id===activeId?' active':''}" data-id="${c.id}">
                    <div class="avatar"><div class="avatar-fallback">${c.avatar}</div></div>
                    <div class="conv-body">
                        <h4>${c.name} ${unreadBadge}</h4>
                        <p class="last-line">${lastLine}</p>
                    </div>
                </li>`; }).join('');
    }

    function openConversation(id){
        activeId = id;
        const conv = legacyOnly.find(c => c.id===id);
        if(!conv) return;
        peerNameEl.textContent = conv.name;
        if(peerAvatarImg){ peerAvatarImg.alt = conv.name; peerAvatarImg.src = ''; }
        messagesScroll.innerHTML = conv.messages.map(msg => `<div class="row ${msg.sent?'outgoing':'incoming'}"><div class="bubble ${msg.sent?'outgoing':'incoming'}"><span>${msg.text}</span><span class="time">${msg.time}</span></div></div>`).join('');
        chatPlaceholder.hidden = true;
        chatWrapper.hidden = false;
        conv.unread = false;
        renderConversations(searchInput.value.trim());
        scrollToBottom();
    }

    function scrollToBottom(){ requestAnimationFrame(()=>{ messagesScroll.scrollTop = messagesScroll.scrollHeight; }); }

    conversationsEl.addEventListener('click', e => { const item = e.target.closest('.conversation'); if(item) openConversation(item.dataset.id); });
    searchInput?.addEventListener('input', () => renderConversations(searchInput.value.trim()));
    messageForm?.addEventListener('submit', e => {
        e.preventDefault();
        if(!activeId) return;
        const text = messageInput.value.trim();
        if(!text) return;
        const conv = legacyOnly.find(c => c.id===activeId);
        conv.messages.push({ text, time:'Just now', sent:true });
        conv.lastMessage = `You: ${text}`;
        messageInput.value='';
        openConversation(activeId);
        saveStored(conversationsUnified);
    });

    renderConversations();
}

// --------------------------------------------------
// INIT DISPATCH
// --------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    const hasNew = document.getElementById('conversationsList');
    const hasLegacy = document.getElementById('conversations');
    if(hasNew) initNewUI();
    if(hasLegacy) initLegacyUI();
});


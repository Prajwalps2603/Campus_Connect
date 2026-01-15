document.addEventListener('DOMContentLoaded', () => {
  const currentUser = (()=>{ try { return JSON.parse(localStorage.getItem('currentUser')); } catch { return null; } })();
  if(!currentUser){ window.location.href = 'index.html'; return; }

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
  // Make messages panel scrollable with dynamic height
  (() => {
    if (!messagesScroll) return;
    messagesScroll.style.overflowY = 'auto';
    messagesScroll.style.webkitOverflowScrolling = 'touch';

    function adjustHeight() {
      const form = document.getElementById('messageForm');
      const top = messagesScroll.getBoundingClientRect().top;
      const formH = form ? form.getBoundingClientRect().height : 0;
      const gap = 16;
      const h = window.innerHeight - top - formH - gap;
      if (h > 120) messagesScroll.style.maxHeight = h + 'px';
    }

    // Recompute when chat becomes visible
    const chatWrapperEl = document.getElementById('chatWrapper');
    if (chatWrapperEl) {
      const mo = new MutationObserver(adjustHeight);
      mo.observe(chatWrapperEl, { attributes: true, attributeFilter: ['hidden'] });
    }

    window.addEventListener('resize', adjustHeight);
    window.addEventListener('orientationchange', adjustHeight);
    adjustHeight();
  })();
  // Placeholder data (simulate existing chats)
  const sampleConversations = [
    { id:'c1', name:'Sarah Johnson', avatar:'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face', messages:[
      { from:'Sarah Johnson', outgoing:false, text:'Hey! Are you coming to the project meet?', ts:Date.now()-600000 },
      { from:currentUser.username, outgoing:true, text:'Yeah, I will be there in 10 mins.', ts:Date.now()-560000 }
    ]},
    { id:'c2', name:'Mike Chen', avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', messages:[
      { from:'Mike Chen', outgoing:false, text:'Finished the AR module! 🎉', ts:Date.now()-860000 },
      { from:currentUser.username, outgoing:true, text:'Nice! Can you push it?', ts:Date.now()-820000 }
    ]},
    { id:'c3', name:'Priya Singh', avatar:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face', messages:[
      { from:'Priya Singh', outgoing:false, text:'Talent show rehearsal today?', ts:Date.now()-960000 }
    ]},
    { id:'c4', name:'Alex Rivera', avatar:'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face', messages:[
      { from:'Alex Rivera', outgoing:false, text:'Need the lab report template?', ts:Date.now()-400000 },
      { from:currentUser.username, outgoing:true, text:'Yes, send it please.', ts:Date.now()-380000 },
      { from:'Alex Rivera', outgoing:false, text:'Sent to your email.', ts:Date.now()-360000 }
    ]},
    { id:'c5', name:'Daniel Lee', avatar:'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face', messages:[
      { from:'Daniel Lee', outgoing:false, text:'Game jam team still on?', ts:Date.now()-720000 },
      { from:currentUser.username, outgoing:true, text:'Yep, meeting tonight.', ts:Date.now()-700000 }
    ]},
    { id:'c6', name:'Emily Wright', avatar:'https://images.unsplash.com/photo-1529626455594-4f5a5a6a4f5a?w=80&h=80&fit=crop&crop=face', messages:[
      { from:'Emily Wright', outgoing:false, text:'Slides for tomorrow are done.', ts:Date.now()-300000 },
      { from:currentUser.username, outgoing:true, text:'Great! I will review now.', ts:Date.now()-280000 }
    ]},
    { id:'c7', name:'Study Group', avatar:'https://images.unsplash.com/photo-1529626455594-8f58b1f6c7b8?w=80&h=80&fit=crop&crop=face', messages:[
      { from:'Study Group', outgoing:false, text:'Reminder: quiz prep at 6 PM.', ts:Date.now()-500000 },
      { from:currentUser.username, outgoing:true, text:'I will join after class.', ts:Date.now()-480000 },
      { from:'Study Group', outgoing:false, text:'Cool, see you then.', ts:Date.now()-460000 }
    ]},
    // Added
    { id:'c8', name:'Liam Patel', avatar:'https://images.unsplash.com/photo-1529626455594-916d8b25a3d2?w=80&h=80&fit=crop&crop=face', messages:[
      { from:'Liam Patel', outgoing:false, text:'Did you upload the design brief?', ts:Date.now()-250000 },
      { from:currentUser.username, outgoing:true, text:'Just did. Check the shared folder.', ts:Date.now()-240000 }
    ]},
    { id:'c9', name:'Campus Bot', avatar:'https://images.unsplash.com/photo-1502767089025-6572583495b0?w=80&h=80&fit=crop&crop=face', messages:[
      { from:'Campus Bot', outgoing:false, text:'Your library book is due tomorrow.', ts:Date.now()-200000 }
    ]},
    { id:'c10', name:'Robotics Club', avatar:'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&crop=face', messages:[
      { from:'Robotics Club', outgoing:false, text:'Parts order arrived. Build session at 5?', ts:Date.now()-180000 },
      { from:currentUser.username, outgoing:true, text:'I can be there by 5:10.', ts:Date.now()-170000 }
    ]},
    { id:'c11', name:'Nina Gomez', avatar:'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=80&h=80&fit=crop&crop=face', messages:[
      { from:'Nina Gomez', outgoing:false, text:'Can you proofread my essay intro?', ts:Date.now()-155000 },
      { from:currentUser.username, outgoing:true, text:'Send it over, I will look now.', ts:Date.now()-145000 }
    ]},
    { id:'c12', name:'Library Desk', avatar:'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face', messages:[
      { from:'Library Desk', outgoing:false, text:'Study room booking confirmed for 3 PM.', ts:Date.now()-120000 },
      { from:currentUser.username, outgoing:true, text:'Thanks for the confirmation!', ts:Date.now()-115000 }
    ]}
  ];

  let activeId = null;

  function formatTime(ts){
    const d = new Date(ts);
    const h = d.getHours();
    let m = d.getMinutes();
    if(m < 10) m = '0' + m;
    return h + ':' + m;
  }

  function renderConversations(filter=''){
    const f = filter.toLowerCase();
    conversationsEl.innerHTML = sampleConversations
      .filter(c => c.name.toLowerCase().includes(f))
      .map(c => {
        const last = c.messages[c.messages.length-1];
        let lastLine = 'No messages yet';
        if(last){
          const prefix = last.outgoing ? 'You: ' : '';
          lastLine = prefix + last.text;
        }
        return `<li class="conversation${c.id===activeId?' active':''}" data-id="${c.id}">
          <div class="avatar"><img src="${c.avatar}" alt="${c.name}"></div>
          <div class="conv-body">
            <h4>${c.name} ${c.messages.length>1?'<span class="unread-badge" aria-label="Messages">'+c.messages.length+'</span>':''}</h4>
            <p class="last-line">${lastLine}</p>
          </div>
        </li>`; }).join('');
  }

  function openConversation(id){
    activeId = id;
    const conv = sampleConversations.find(c=>c.id===id);
    if(!conv) return;
    peerNameEl.textContent = conv.name;
    peerAvatarImg.src = conv.avatar;
    peerAvatarImg.alt = conv.name;
    messagesScroll.innerHTML = conv.messages.map(msg => {
      return `<div class="row ${msg.outgoing?'outgoing':'incoming'}"><div class="bubble ${msg.outgoing?'outgoing':'incoming'}"><span>${msg.text}</span><span class="time">${formatTime(msg.ts)}</span></div></div>`;
    }).join('');
    chatPlaceholder.hidden = true;
    chatWrapper.hidden = false;
    renderConversations(searchInput.value.trim());
    scrollToBottom();
  }

  function scrollToBottom(){
    requestAnimationFrame(()=>{ messagesScroll.scrollTop = messagesScroll.scrollHeight; });
  }

  conversationsEl.addEventListener('click', e => {
    const item = e.target.closest('.conversation');
    if(!item) return;
    openConversation(item.dataset.id);
  });

  searchInput.addEventListener('input', ()=>{
    renderConversations(searchInput.value.trim());
  });

  messageForm.addEventListener('submit', e => {
    e.preventDefault();
    if(!activeId) return;
    const text = messageInput.value.trim();
    if(!text) return;
    const conv = sampleConversations.find(c=>c.id===activeId);
    conv.messages.push({ from:currentUser.username, outgoing:true, text, ts:Date.now() });
    messageInput.value='';
    openConversation(activeId); // re-render
  });

  // Initial render
  renderConversations();
});

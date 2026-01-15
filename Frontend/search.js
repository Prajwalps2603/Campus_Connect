document.addEventListener('DOMContentLoaded', ()=>{
  const searchInput = document.getElementById('searchInput');
  const tabBar = document.getElementById('tabBar');
  const recentList = document.getElementById('recentList');
  const clearRecentBtn = document.getElementById('clearRecentBtn');
  const exploreGrid = document.getElementById('exploreGrid');
  const emptyNote = document.getElementById('emptyNote');
  const openDrawerBtn = document.getElementById('openDrawerBtn');
  const searchPanel = document.getElementById('searchPanel');

  // Data (could be replaced with backend calls)
  const tiles = [
    { title:'Hackathon Prototype Rush', type:'event', tags:['coding','innovation'], img:'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=600&fit=crop' },
    { title:'Cultural Night Highlights', type:'event', tags:['culture','fest'], img:'https://images.unsplash.com/photo-1464146072230-91cabc968266?w=600&h=600&fit=crop', large:true },
    { title:'BGMI Finals Clip', type:'sports', tags:['esports','bgmi'], img:'https://images.unsplash.com/photo-1606112219348-204d7d8b94ee?w=600&h=600&fit=crop' },
    { title:'30-Day Coding Streak', type:'challenge', tags:['challenge','coding'], img:'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?w=600&h=600&fit=crop' },
    { title:'Campus Flash Mob', type:'trending', tags:['reel','dance'], img:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=600&fit=crop' },
    { title:'UI Micro Sprint', type:'challenge', tags:['design','ui'], img:'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=600&h=600&fit=crop' },
    { title:'Athletics Trials', type:'sports', tags:['athletics','track'], img:'https://images.unsplash.com/photo-1518611012118-f0c5d7d3e6b3?w=600&h=600&fit=crop' },
    { title:'Drone Design Contest', type:'event', tags:['tech','drone'], img:'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop' },
    { title:'Speed Coding 30s', type:'trending', tags:['reel','coding'], img:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=600&fit=crop' },
    { title:'Badminton Open', type:'sports', tags:['badminton'], img:'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=600&h=600&fit=crop' },
    { title:'Logo Redesign Jam', type:'challenge', tags:['design','brand'], img:'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&h=600&fit=crop' }
  ];

  const RECENT_KEY='cc_search_recent_v2';
  function loadRecents(){ try { return JSON.parse(localStorage.getItem(RECENT_KEY))||[]; } catch { return []; } }
  function saveRecents(list){ localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0,12))); }
  function addRecent(q){
    const term = q.trim(); if(!term) return;
    const recents = loadRecents();
    const idx = recents.findIndex(r=>r.toLowerCase()===term.toLowerCase());
    if(idx>=0) recents.splice(idx,1);
    recents.unshift(term);
    saveRecents(recents);
    renderRecents();
  }
  function renderRecents(){
    const recents = loadRecents();
    if(!recents.length){
      recentList.innerHTML = '<li class="recent-item" style="justify-content:center; font-size:.65rem;">No recent searches</li>';
      return;
    }
    recentList.innerHTML = recents.map(r=>`<li class="recent-item" data-term="${r}">
        <img src="https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(r)}" alt="${r}">
        <div class="recent-meta"><h4>${r}</h4><p>Recent</p></div>
        <button class="remove-recent" data-remove="${r}" aria-label="Remove ${r}">✕</button>
      </li>`).join('');
  }

  function tileMarkup(t){
    const tags = t.tags.slice(0,3).map(tag=>`<span class="badge-mini">${tag}</span>`).join('');
    return `<div class="tile${t.large?' large':''}" data-type="${t.type}" style="background-image:url('${t.img}')">
      <div class="tile-info"><h4>${t.title}</h4><p>${t.type}</p><div class="badge-stack">${tags}</div></div>
    </div>`;
  }

  function activeTab(){ return tabBar.querySelector('.tab-btn.active')?.dataset.tab || 'top'; }

  function filterTiles(){
    const q = searchInput.value.trim().toLowerCase();
    const tab = activeTab();
    return tiles.filter(t=>{
      const matchQ = !q || t.title.toLowerCase().includes(q) || t.tags.some(tag=>tag.includes(q));
      const matchTab = tab==='top' || t.type===tab || (tab==='accounts' && t.type==='account');
      return matchQ && matchTab;
    });
  }

  function renderTiles(){
    const list = filterTiles();
    exploreGrid.innerHTML = list.map(tileMarkup).join('');
    emptyNote.hidden = list.length>0;
  }

  tabBar.addEventListener('click', e=>{
    const btn = e.target.closest('.tab-btn'); if(!btn) return;
    tabBar.querySelectorAll('.tab-btn').forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    btn.classList.add('active'); btn.setAttribute('aria-selected','true');
    renderTiles();
  });
  searchInput.addEventListener('input', ()=>{ renderTiles(); });
  searchInput.addEventListener('keydown', e=>{ if(e.key==='Enter'){ addRecent(searchInput.value); } });
  recentList.addEventListener('click', e=>{
    const remove = e.target.closest('[data-remove]');
    if(remove){
      const term = remove.getAttribute('data-remove');
      const recents = loadRecents().filter(r=>r!==term); saveRecents(recents); renderRecents(); return;
    }
    const li = e.target.closest('.recent-item'); if(!li) return;
    searchInput.value = li.getAttribute('data-term'); renderTiles();
  });
  clearRecentBtn.addEventListener('click', ()=>{ localStorage.removeItem(RECENT_KEY); renderRecents(); });
  openDrawerBtn.addEventListener('click', ()=>{ searchPanel.classList.add('open'); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') searchPanel.classList.remove('open'); });

  renderRecents();
  renderTiles();
});
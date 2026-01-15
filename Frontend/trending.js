document.addEventListener('DOMContentLoaded', () => {
  const reels = [
    { title:'Campus Flash Mob', tags:['Dance','Fun'], rank:1 },
    { title:'Library Study Hacks', tags:['Tips'], rank:2 },
    { title:'Speed Coding 30s', tags:['Coding'], rank:3 },
    { title:'Canteen Samosa POV', tags:['Food'], rank:4 },
    { title:'Sunset Drone Shot', tags:['Aerial'], rank:5 },
  ];
  const songs = [
    { title:'Midnight Coding Lo-Fi', tags:['LoFi'] },
    { title:'Campus Anthem Remix', tags:['Remix'] },
    { title:'Chill Between Lectures', tags:['Chill'] },
    { title:'Focus Beats Vol.2', tags:['Focus'] },
    { title:'After Match Hype', tags:['Hype'] },
  ];
  const movies = [
    { title:'Indie Short: The Lab', tags:['Sci-Fi'] },
    { title:'Hostel Tales Ep 3', tags:['Series'] },
    { title:'Robotics Club Documentary', tags:['Docu'] },
    { title:'Esports Final Highlights', tags:['Esports'] },
    { title:'Cultural Night Recap', tags:['Culture'] },
  ];
  const buzzTags = ['#CampusLife','#ExamMood','#FridayFeels','#CodeRush','#EsportsFinals'];
  const creators = [
    { name:'Asha', niche:'Dance' },
    { name:'Mike', niche:'Coding' },
    { name:'Priya', niche:'Food' },
    { name:'Nikhil', niche:'Vlog' },
  ];

  function mediaCard(item,isReel=false){
    const rankSpan = isReel ? '<span class="rank">#'+item.rank+'</span>' : '';
    const tagsHtml = item.tags.map(function(t){return '<span class="tag">'+t+'</span>';}).join('');
    return '<div class="media-card">'+rankSpan+'<div class="media-thumb"></div><h3>'+item.title+'</h3><div class="tag-pills">'+tagsHtml+'</div></div>';
  }

  const reelsGrid = document.getElementById('reelsGrid');
  const songsGrid = document.getElementById('songsGrid');
  const moviesGrid = document.getElementById('moviesGrid');
  const tagList = document.getElementById('tagList');
  const creatorsList = document.getElementById('creatorsList');
  const catBadges = document.getElementById('trendCategories');
  const tagSelect = document.getElementById('trendTag');
  const searchInput = document.getElementById('trendSearch');

  tagList.innerHTML = buzzTags.map(t=>`<li class="highlight-item"><div class="highlight-info"><h4>${t}</h4><p>Trending</p></div></li>`).join('');
  creatorsList.innerHTML = creators.map(c=>`<li class="highlight-item"><div class="highlight-info"><h4>${c.name}</h4><p>${c.niche}</p></div></li>`).join('');

  function passFilters(item, category){
    const catOk = category==='all' || category===item._cat;
    const tagVal = tagSelect.value;
    const tagOk = tagVal==='all' || item.tags.includes(tagVal);
    const q = searchInput.value.trim().toLowerCase();
    const searchOk = !q || item.title.toLowerCase().includes(q) || item.tags.some(t=>t.toLowerCase().includes(q));
    return catOk && tagOk && searchOk;
  }

  function renderTrending(){
    const activeCat = catBadges.querySelector('[aria-pressed="true"]').dataset.cat;
    const reelsData = reels.map(r=>({...r,_cat:'reels'})).filter(it=>passFilters(it, activeCat));
    const songsData = songs.map(s=>({...s,_cat:'songs'})).filter(it=>passFilters(it, activeCat));
    const moviesData = movies.map(m=>({...m,_cat:'movies'})).filter(it=>passFilters(it, activeCat));
    reelsGrid.innerHTML = reelsData.map(r=>mediaCard(r,true)).join('') || '<p style="font-size:.7rem; color:#7d90a0;">No reels match filters.</p>';
    songsGrid.innerHTML = songsData.map(mediaCard).join('') || '<p style="font-size:.7rem; color:#7d90a0;">No songs match filters.</p>';
    moviesGrid.innerHTML = moviesData.map(mediaCard).join('') || '<p style="font-size:.7rem; color:#7d90a0;">No movies match filters.</p>';
  }

  catBadges.addEventListener('click', e=>{
    if(e.target.matches('.badge')){
      catBadges.querySelectorAll('.badge').forEach(b=>b.removeAttribute('aria-pressed'));
      e.target.setAttribute('aria-pressed','true');
      renderTrending();
    }
  });
  tagSelect.addEventListener('change', renderTrending);
  searchInput.addEventListener('input', renderTrending);

  renderTrending();
});

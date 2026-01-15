document.addEventListener('DOMContentLoaded', () => {
  // Sample events dataset (could come from API later)
  const events = [
    { id:1, title:'Inter-College BGMI Tournament', banner:'https://images.unsplash.com/photo-1603975711481-18b7aacae76d?w=800&h=600&fit=crop', date:'2025-10-05T19:00:00', venue:'eSports Arena', category:'gaming', status:'upcoming', tags:['Gaming','Esports','Prize $2000'], desc:'Biggest Battlegrounds Mobile India tournament with top teams.' },
    { id:2, title:'Tech Fest 2025', banner:'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop', date:'2025-10-15T09:00:00', venue:'Main Auditorium', category:'tech', status:'upcoming', tags:['Technology','Innovation'], desc:'Showcasing final year projects, robotics and AI demos.' },
    { id:3, title:'Cultural Night', banner:'https://images.unsplash.com/photo-1521336575822-6da63fb45455?w=800&h=600&fit=crop', date:'2025-10-20T18:30:00', venue:'College Ground', category:'cultural', status:'upcoming', tags:['Music','Dance','Food'], desc:'An evening of performances and global cuisines.' },
    { id:4, title:'Cricket Tournament Finals', banner:'https://images.unsplash.com/photo-1486272812841-29319b4e4f58?w=800&h=600&fit=crop', date:'2025-10-04T16:00:00', venue:'Main Ground', category:'sports', status:'upcoming', tags:['Sports','Cricket'], desc:'Twenty overs showdown between top departments.' },
  { id:5, title:'Hackathon 24hr Sprint', banner:'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop', date:'2025-10-03T08:00:00', venue:'Innovation Lab', category:'tech', status:'live', tags:['Hackathon','Coding'], desc:'Build prototypes solving campus challenges.' },
    { id:6, title:'AI Research Symposium', banner:'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop', date:'2025-10-11T10:00:00', venue:'Innovation Hub', category:'tech', status:'upcoming', tags:['AI','Research','Papers'], desc:'Faculty and students present cutting-edge AI papers and demos.' },
    { id:7, title:'Open Mic Poetry Evening', banner:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop', date:'2025-10-07T19:30:00', venue:'Amphitheatre', category:'cultural', status:'upcoming', tags:['Poetry','Spoken Word'], desc:'Share original poems or just enjoy expressive performances.' },
    { id:8, title:'Fitness Bootcamp Morning', banner:'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=800&h=600&fit=crop', date:'2025-10-06T06:30:00', venue:'North Field', category:'sports', status:'upcoming', tags:['Health','Wellness'], desc:'High-energy group workout led by certified trainers.' },
    { id:9, title:'Indie Game Showcase', banner:'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop', date:'2025-10-18T14:00:00', venue:'eSports Arena', category:'gaming', status:'upcoming', tags:['Indie Dev','Showcase'], desc:'Students display original indie games—playtest and give feedback.' },
    { id:10, title:'Entrepreneurship Pitch Night', banner:'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=600&fit=crop', date:'2025-10-09T17:30:00', venue:'Startup Center', category:'tech', status:'upcoming', tags:['Startup','Pitch'], desc:'Teams pitch startup ideas to alumni panel and investors.' },
    { id:11, title:'Department Alumni Meetup', banner:'https://images.unsplash.com/photo-1503424886307-b090341d25d1?w=800&h=600&fit=crop', date:'2025-10-12T16:00:00', venue:'Main Lawn', category:'cultural', status:'upcoming', tags:['Alumni','Networking'], desc:'Reconnect with alumni and explore mentorship opportunities.' },
    { id:12, title:'Robotics Workshop: Autonomous Bots', banner:'https://images.unsplash.com/photo-1581091870627-3c71c6b74247?w=800&h=600&fit=crop', date:'2025-10-08T11:00:00', venue:'Lab 3B', category:'tech', status:'upcoming', tags:['Robotics','Workshop'], desc:'Hands-on session building small autonomous mobile robots.' },
    { id:13, title:'Table Tennis Doubles Cup', banner:'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=600&fit=crop', date:'2025-10-16T13:00:00', venue:'Indoor Sports Hall', category:'sports', status:'upcoming', tags:['Table Tennis','Tournament'], desc:'Fast-paced doubles tournament—knockout format.' },
    { id:14, title:'Retro Console Night', banner:'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=600&fit=crop', date:'2025-10-02T20:00:00', venue:'Gaming Lounge', category:'gaming', status:'live', tags:['Retro','Arcade'], desc:'Classic consoles and pixel nostalgia—drop in and play.' },
    { id:15, title:'Community Service Drive', banner:'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=600&fit=crop', date:'2025-09-28T09:00:00', venue:'City Center', category:'cultural', status:'past', tags:['Volunteer','Outreach'], desc:'Recent outreach initiative supporting local shelters.' }
  ];

  const grid = document.getElementById('eventsGrid');
  const categorySel = document.getElementById('eventCategory');
  const timeSel = document.getElementById('eventTime');
  const searchInput = document.getElementById('eventSearch');
  const highlightList = document.getElementById('highlightList');
  const todayList = document.getElementById('todayList');

  function formatDate(dt){
    const d = new Date(dt);
    return d.toLocaleDateString(undefined,{ month:'short', day:'numeric'}) + ' • ' + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  }
  function isToday(dt){
    const d = new Date(dt); const now=new Date();
    return d.getDate()===now.getDate() && d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
  }
  function inThisWeek(dt){
    const d=new Date(dt); const now=new Date();
    const first=new Date(now); first.setDate(now.getDate()-now.getDay());
    const last=new Date(first); last.setDate(first.getDate()+7);
    return d>=first && d<last;
  }
  function card(event){
    const statusClass = event.status === 'live' ? 'live' : '';
    let statusLabel = 'PAST';
    if(event.status === 'live') statusLabel = 'LIVE';
    else if(event.status === 'upcoming') statusLabel = 'UPCOMING';
    return `<article class="event-card" data-category="${event.category}" data-status="${event.status}">
      <span class="event-status ${statusClass}">${statusLabel}</span>
      <img class="event-banner" src="${event.banner}" alt="${event.title}">
      <div class="event-body">
        <div class="event-tags">${event.tags.map(t=>`<span class='event-tag'>${t}</span>`).join('')}</div>
        <h3 class="event-title">${event.title}</h3>
        <div class="event-meta"><span><i class="far fa-clock"></i> ${formatDate(event.date)}</span><span><i class="fas fa-location-dot"></i> ${event.venue}</span></div>
        <p class="event-desc" style="font-size:.72rem; line-height:1.2; color:#94a6b8; margin:.35rem 0 .2rem;">${event.desc}</p>
        <div class="event-actions">
          <button class="btn-interest" data-interest="${event.id}"><i class="far fa-star"></i> Interested</button>
          <button class="btn-join" data-join="${event.id}"><i class="fas fa-right-to-bracket"></i> Join</button>
        </div>
      </div>
    </article>`;
  }
  function render(){
    const q = searchInput.value.trim().toLowerCase();
    const cat = categorySel.value;
    const time = timeSel.value;
    grid.innerHTML = events.filter(ev => {
      if(cat!=='all' && ev.category!==cat) return false;
      if(q && !ev.title.toLowerCase().includes(q) && !ev.tags.join(' ').toLowerCase().includes(q)) return false;
      if(time==='today' && !isToday(ev.date)) return false;
      if(time==='week' && !inThisWeek(ev.date)) return false;
      if(time==='past' && new Date(ev.date) > new Date()) return false;
      if(time==='upcoming' && new Date(ev.date) <= new Date()) return false;
      return true;
    }).sort((a,b)=> new Date(a.date) - new Date(b.date)).map(card).join('');
  }
  function renderSideLists(){
    highlightList.innerHTML = events.slice(0,3).map(ev=>`<li class="highlight-item"><img src="${ev.banner}" alt="${ev.title}" class="highlight-thumb"><div class="highlight-info"><h4>${ev.title}</h4><p>${formatDate(ev.date)}</p></div></li>`).join('');
    todayList.innerHTML = events.filter(ev=>isToday(ev.date)).map(ev=>`<li class="highlight-item"><img src="${ev.banner}" alt="${ev.title}" class="highlight-thumb"><div class="highlight-info"><h4>${ev.title}</h4><p>${ev.venue}</p></div></li>`).join('') || '<li style="font-size:.7rem; color:#708090;">No events today.</li>';
  }
  categorySel.addEventListener('change', render);
  timeSel.addEventListener('change', render);
  searchInput.addEventListener('input', render);
  document.addEventListener('click', (e)=>{
    const interest = e.target.closest('[data-interest]');
    if(interest){
      interest.classList.toggle('active');
      interest.innerHTML = interest.classList.contains('active') ? '<i class="fas fa-star"></i> Interested' : '<i class="far fa-star"></i> Interested';
    }
    const join = e.target.closest('[data-join]');
    if(join){
      join.classList.add('joined');
      join.disabled = true;
      join.innerHTML = '<i class="fas fa-check"></i> Joined';
    }
  });
  render();
  renderSideLists();
});

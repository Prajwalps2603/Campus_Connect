document.addEventListener('DOMContentLoaded', () => {
  const challenges = [
    { title:'30-Day Coding Streak', type:'Coding', progress:72, daysLeft:12, status:'active', img:'assets/Campus_ Connect.png' },
    { title:'UI Micro-Interaction Sprint', type:'Design', progress:40, daysLeft:5, status:'active', img:'assets/green-trees-near-lake-cloudy-sky-daytime_395237-82.jpg' },
    { title:'BGMI Strategy League', type:'Esports', progress:55, daysLeft:9, status:'active', img:'assets/snowy-mountain-and-forest-reflected-in-water-wallpaper-2560x1080_14.jpg' },
    { title:'Daily Push-Up Challenge', type:'Fitness', progress:83, daysLeft:7, status:'active', img:'assets/green-trees-near-lake-cloudy-sky-daytime_395237-82.jpg' },
    { title:'Hackathon Prototype Rush', type:'Coding', starts:'Oct 18', status:'upcoming', img:'assets/Campus_ Connect.png' },
    { title:'Drone Design Contest', type:'Tech', starts:'Oct 20', status:'upcoming', img:'assets/snowy-mountain-and-forest-reflected-in-water-wallpaper-2560x1080_14.jpg' },
    { title:'Ideathon 48hr', type:'Innovation', starts:'Oct 25', status:'upcoming', img:'assets/Campus_ Connect.png' },
    { title:'September Step Count', type:'Fitness', result:'Top 10%', status:'completed', img:'assets/green-trees-near-lake-cloudy-sky-daytime_395237-82.jpg' },
    { title:'Logo Redesign Jam', type:'Design', result:'Winner', status:'completed', img:'assets/snowy-mountain-and-forest-reflected-in-water-wallpaper-2560x1080_14.jpg' },
  ];
  const leaderboard = [
    { user:'Asha', points:1240 },
    { user:'Mike', points:1185 },
    { user:'Priya', points:1122 },
  ];
  const badges = [ 'Early Bird', 'Consistency', 'Top Coder', 'Creative Spark' ];

  const grid = document.getElementById('challengeGrid');
  const leaderboardMini = document.getElementById('leaderboardMini');
  const badgeList = document.getElementById('badgeList');
  const catSel = document.getElementById('challengeCategory');
  const statusSel = document.getElementById('challengeStatus');
  const searchInput = document.getElementById('challengeSearch');
  const createBtn = document.getElementById('createChallengeBtn');

  function cardMarkup(c){
    let statusClass;
    if(c.status==='active') statusClass='status-active';
    else if(c.status==='upcoming') statusClass='status-upcoming';
    else statusClass='status-completed';

    let statusLabel = c.status.charAt(0).toUpperCase()+c.status.slice(1);

    let metaExtra;
    if(c.status==='active') metaExtra = c.daysLeft + ' days left';
    else if(c.status==='upcoming') metaExtra = 'Starts ' + c.starts;
    else metaExtra = c.result;

    let progressBar = '';
    if(c.status==='active') progressBar = `<div class="progress-bar"><span style="width:${c.progress}%;"></span></div>`;
    return `<div class="challenge-card" data-title="${c.title}">
      <div class="challenge-thumb" style="background-image:url('${c.img || ''}');"></div>
      <h3>${c.title}</h3>
      <div class="challenge-meta"><span>${c.type}</span><span>${metaExtra}</span></div>
      ${progressBar}
      <div class="challenge-actions">
        <button class="join-btn" data-action="join"><i class="fas fa-user-plus"></i><span>Join</span></button>
        <button class="fav" data-action="fav" aria-pressed="false" title="Add to favorites"><i class="fas fa-heart"></i></button>
        <button class="share-btn" data-action="share" title="Share challenge"><i class="fas fa-share"></i></button>
      </div>
      <span class="badge ${statusClass}">${statusLabel}</span>
    </div>`;
  }

  function render(){
    // Show section skeleton for perceived load (simulate async)
    if(window.Skeleton) Skeleton.show({ targetSelector: '.challenge-col', variant:'cards', count:6 });
    setTimeout(()=>{
      const cat = catSel.value;
      const stat = statusSel.value;
      const q = searchInput.value.trim().toLowerCase();
      const filtered = challenges.filter(c=>{
        const catOk = cat==='all' || c.type===cat;
        const statOk = stat==='all' || c.status===stat;
        const searchOk = !q || c.title.toLowerCase().includes(q) || c.type.toLowerCase().includes(q);
        return catOk && statOk && searchOk;
      });
      grid.innerHTML = filtered.map(cardMarkup).join('') || '<p class="challenge-empty">No challenges match current filters.</p>';
      attachCardHandlers();
      if(window.Skeleton) Skeleton.hide('.challenge-col');
    }, 350); // short artificial delay
  }

  catSel.addEventListener('change', render);
  statusSel.addEventListener('change', render);
  searchInput.addEventListener('input', render);
  createBtn.addEventListener('click', () => {
    alert('Challenge creation form coming soon.');
  });

  leaderboardMini.innerHTML = leaderboard.map(l=>`<li class="highlight-item"><div class="highlight-info"><h4>${l.user}</h4><p>${l.points} pts</p></div></li>`).join('');
  badgeList.innerHTML = badges.map(b=>`<li class="highlight-item"><div class="highlight-info"><h4>${b}</h4><p>Unlocked</p></div></li>`).join('');
  render();

  function attachCardHandlers(){
    grid.querySelectorAll('.challenge-card').forEach(card=>{
      const joinBtn = card.querySelector('.join-btn');
      const favBtn = card.querySelector('[data-action="fav"]');
      const shareBtn = card.querySelector('[data-action="share"]');
      function resetShareIcon(){ shareBtn.innerHTML = '<i class="fas fa-share"></i>'; }
      function copyShareLink(title){
        navigator.clipboard.writeText('Join this challenge: '+title);
        shareBtn.innerHTML = '<i class="fas fa-link"></i>';
        setTimeout(resetShareIcon, 1500);
      }
      joinBtn?.addEventListener('click', ()=>{
        if(joinBtn.classList.contains('joined')) return;
        joinBtn.classList.add('joined');
        joinBtn.innerHTML = '<i class="fas fa-check"></i><span>Joined</span>';
      });
      favBtn?.addEventListener('click', ()=>{
        const active = favBtn.classList.toggle('active');
        favBtn.setAttribute('aria-pressed', active ? 'true':'false');
      });
      shareBtn?.addEventListener('click', ()=>{
        const title = card.getAttribute('data-title');
        try {
          if(navigator.share){
            navigator.share({title: title, text: 'Join this challenge: '+title});
          } else {
            copyShareLink(title);
          }
        } catch(e){
          console.warn('Share failed', e);
        }
      });
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const fixtures = [
    { teams:'CSE vs ECE (Cricket)', time:'Oct 4 • 4:00 PM', venue:'Main Ground' },
    { teams:'EEE vs ME (Football)', time:'Oct 6 • 5:30 PM', venue:'North Field' },
    { teams:'Inter-College BGMI Qualifier', time:'Oct 5 • 7:30 PM', venue:'eSports Arena' },
    { teams:'Civil vs Arch (Table Tennis)', time:'Oct 8 • 2:00 PM', venue:'Indoor Hall' },
    { teams:'Athletics Trials', time:'Oct 9 • 6:00 AM', venue:'Track Oval' },
  ];
  const tournaments = [
    { title:'BGMI Inter-College', stage:'Group Stage', type:'Esports', status:'Live', badge:'Esports' },
    { title:'Cricket League', stage:'Day 3', type:'Cricket', status:'Live', badge:'Cricket' },
    { title:'Badminton Open', stage:'Quarter Finals', type:'Badminton', status:'Ongoing', badge:'Badminton' },
    { title:'Table Tennis Cup', stage:'Round of 16', type:'Table Tennis', status:'Ongoing', badge:'Table Tennis' },
    { title:'Athletics Meet', stage:'Heats', type:'Athletics', status:'Ongoing', badge:'Athletics' },
  ];
  const results = [
    { title:'Football: CSE 2 - 1 Mech', note:'Late winner at 88’', type:'Football' },
    { title:'Table Tennis: ECE d. Civil', note:'3–2 thriller', type:'Table Tennis' },
    { title:'Cricket: EEE beat IT', note:'EEE won by 24 runs', type:'Cricket' },
    { title:'Badminton: Arch beat Chem', note:'2–0 straight sets', type:'Badminton' },
    { title:'BGMI: IT beat CSE', note:'2–1 semi', type:'Esports' },
  ];
  const players = [
    { name:'Rahul K.', sport:'Cricket', stat:'Avg 54.2' },
    { name:'Aisha P.', sport:'Badminton', stat:'Win Rate 78%' },
    { name:'Varun S.', sport:'Football', stat:'7 Goals' },
    { name:'Neha T.', sport:'Table Tennis', stat:'Rank #1' },
  ];
  const trainings = [
    { title:'Cricket Nets', time:'Today 5:00 PM' },
    { title:'Badminton Drills', time:'Today 6:30 PM' },
    { title:'Football Fitness', time:'Tomorrow 6:00 AM' },
  ];

  const fixtureList = document.getElementById('fixtureList');
  const tournamentGrid = document.getElementById('tournamentGrid');
  const resultsGrid = document.getElementById('resultsGrid');
  const playerList = document.getElementById('playerList');
  const trainingList = document.getElementById('trainingList');
  const badgeGroup = document.getElementById('sportsBadges');
  const stageSelect = document.getElementById('sportsStage');
  const searchInput = document.getElementById('sportsSearch');

  fixtureList.innerHTML = fixtures.map(f=>`<li class="fixture-item"><div class="teams"><strong>${f.teams}</strong><span class="time">${f.time} • ${f.venue}</span></div><span class="badge" style="cursor:default;">Info</span></li>`).join('');
  playerList.innerHTML = players.map(p=>`<li class="highlight-item"><div class="highlight-info"><h4>${p.name}</h4><p>${p.sport} • ${p.stat}</p></div></li>`).join('');
  trainingList.innerHTML = trainings.map(t=>`<li class="highlight-item"><div class="highlight-info"><h4>${t.title}</h4><p>${t.time}</p></div></li>`).join('');

  function renderSports(){
    const sportFilter = badgeGroup.querySelector('[aria-pressed="true"]').dataset.filter;
    const stageFilter = stageSelect.value;
    const q = searchInput.value.trim().toLowerCase();

    const filteredT = tournaments.filter(t=>{
      const sportOk = sportFilter==='all' || t.type===sportFilter;
      const stageOk = stageFilter==='all' || t.status===stageFilter;
      const searchOk = !q || t.title.toLowerCase().includes(q) || t.type.toLowerCase().includes(q);
      return sportOk && stageOk && searchOk;
    });
    const filteredR = results.filter(r=>{
      const sportOk = sportFilter==='all' || r.type===sportFilter;
      const searchOk = !q || r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || r.note.toLowerCase().includes(q);
      return sportOk && searchOk;
    });

    tournamentGrid.innerHTML = filteredT.map(t=>`<div class="sport-card"><h3>${t.title}</h3><div class="sport-meta"><span>${t.stage}</span><span>${t.type}</span></div><span class="badge">${t.badge}</span><div style="font-size:.65rem; color:#7e92a2;">Status: ${t.status}</div></div>`).join('') || '<p style="font-size:.7rem; color:#7d90a0;">No tournaments match filters.</p>';
    resultsGrid.innerHTML = filteredR.map(r=>`<div class="sport-card"><h3>${r.title}</h3><p style="font-size:.7rem; color:#8fa3b4; margin:.15rem 0 .3rem;">${r.note}</p><span class="badge">${r.type}</span></div>`).join('') || '<p style="font-size:.7rem; color:#7d90a0;">No results match filters.</p>';
  }

  badgeGroup.addEventListener('click', e=>{
    if(e.target.matches('.badge')){
      badgeGroup.querySelectorAll('.badge').forEach(b=>b.removeAttribute('aria-pressed'));
      e.target.setAttribute('aria-pressed','true');
      renderSports();
    }
  });
  stageSelect.addEventListener('change', renderSports);
  searchInput.addEventListener('input', renderSports);

  renderSports();
});

// College data and carousel logic
const collegeData = {
  engineering: [
    { name:'IIT Bombay', city:'Mumbai, Maharashtra', url:'https://www.iitb.ac.in', img:'https://source.unsplash.com/featured/?campus,engineering,1' },
    { name:'NIT Trichy', city:'Tiruchirappalli, Tamil Nadu', url:'https://www.nitt.edu', img:'https://source.unsplash.com/featured/?campus,engineering,2' },
    { name:'RV College', city:'Bengaluru, Karnataka', url:'https://rvce.edu.in', img:'https://source.unsplash.com/featured/?college,rv' },
    { name:'BMS College', city:'Bengaluru, Karnataka', url:'https://bmsce.ac.in', img:'https://source.unsplash.com/featured/?college,bms' },
    { name:'PES University', city:'Bengaluru, Karnataka', url:'https://pes.edu', img:'https://source.unsplash.com/featured/?university,india' },
    { name:'MIT Manipal', city:'Manipal, Karnataka', url:'https://manipal.edu', img:'https://source.unsplash.com/featured/?manipal,mit' },
    { name:'VIT Vellore', city:'Vellore, Tamil Nadu', url:'https://vit.ac.in', img:'https://source.unsplash.com/featured/?vit,vellore' },
    { name:'JSSATE', city:'Bengaluru, Karnataka', url:'https://jssateb.ac.in', img:'https://source.unsplash.com/featured/?engineering,college' },
    { name:'MSRIT', city:'Bengaluru, Karnataka', url:'https://msrit.edu', img:'https://source.unsplash.com/featured/?campus,msrit' },
    { name:'BIT Bangalore', city:'Bengaluru, Karnataka', url:'http://bit-bangalore.edu.in', img:'https://source.unsplash.com/featured/?campus,bit' }
  ],
  medical: [
    { name:'AIIMS Delhi', city:'New Delhi, Delhi', url:'https://aiims.edu', img:'https://source.unsplash.com/featured/?medical,college' },
    { name:'St. John’s Medical', city:'Bengaluru, Karnataka', url:'https://www.stjohns.in', img:'https://source.unsplash.com/featured/?hospital,campus' },
    { name:'KMC Manipal', city:'Manipal, Karnataka', url:'https://manipal.edu/kmc.html', img:'https://source.unsplash.com/featured/?kmc,manipal' },
    { name:'JSS Medical', city:'Mysuru, Karnataka', url:'https://jssuni.edu.in', img:'https://source.unsplash.com/featured/?medical,india' },
    { name:'BMCRI', city:'Bengaluru, Karnataka', url:'http://www.bmcri.org', img:'https://source.unsplash.com/featured/?medicine,campus' },
    { name:'Mysore Medical', city:'Mysuru, Karnataka', url:'https://mysoremedicalcollege.edu.in', img:'https://source.unsplash.com/featured/?mysore,medical' },
    { name:'Kasturba Medical', city:'Manipal, Karnataka', url:'https://manipal.edu/kmc-manipal.html', img:'https://source.unsplash.com/featured/?kasturba,medical' },
    { name:'SIMS', city:'Shivamogga, Karnataka', url:'https://www.sims-shimoga.com', img:'https://source.unsplash.com/featured/?medical,students' },
    { name:'JJM Medical', city:'Davangere, Karnataka', url:'https://jjmmc.org', img:'https://source.unsplash.com/featured/?medical,classroom' },
    { name:'SDM College', city:'Dharwad, Karnataka', url:'https://sdmmedicalcollege.org', img:'https://source.unsplash.com/featured/?sdm,medical' }
  ],
  degree: [
    { name:'Christ University', city:'Bengaluru, Karnataka', url:'https://christuniversity.in', img:'https://source.unsplash.com/featured/?christ,university' },
    { name:'Mount Carmel', city:'Bengaluru, Karnataka', url:'https://mccblr.edu.in', img:'https://source.unsplash.com/featured/?mount,carmel' },
    { name:'St. Joseph’s', city:'Bengaluru, Karnataka', url:'https://www.sjc.ac.in', img:'https://source.unsplash.com/featured/?stjosephs,college' },
    { name:'NMKRV', city:'Bengaluru, Karnataka', url:'https://nmkrv.edu.in', img:'https://source.unsplash.com/featured/?college,campus' },
    { name:'Jain University', city:'Bengaluru, Karnataka', url:'https://www.jainuniversity.ac.in', img:'https://source.unsplash.com/featured/?jain,university' },
    { name:'MES College', city:'Bengaluru, Karnataka', url:'http://www.mesinstitutions.in', img:'https://source.unsplash.com/featured/?mes,college' },
    { name:'National College', city:'Bengaluru, Karnataka', url:'https://www.ncjayanagar.com', img:'https://source.unsplash.com/featured/?national,college' },
    { name:'Bishop Cotton', city:'Bengaluru, Karnataka', url:'https://www.bcp.edu.in', img:'https://source.unsplash.com/featured/?bishop,cotton' },
    { name:'Seshadripuram', city:'Bengaluru, Karnataka', url:'https://spmcollege.ac.in', img:'https://source.unsplash.com/featured/?college,building' },
    { name:'Vivekananda College', city:'Bengaluru, Karnataka', url:'https://vivekanandacollege.edu.in', img:'https://source.unsplash.com/featured/?vivekananda,college' }
  ],
  law: [
    { name:'NLSIU Bangalore', city:'Bengaluru, Karnataka', url:'https://www.nls.ac.in', img:'https://source.unsplash.com/featured/?law,university' },
    { name:'KLE Law', city:'Bengaluru, Karnataka', url:'https://klelawcollege.org', img:'https://source.unsplash.com/featured/?law,college' },
    { name:'BMS Law', city:'Bengaluru, Karnataka', url:'https://bmscl.ac.in', img:'https://source.unsplash.com/featured/?bms,law' },
    { name:'MS Ramaiah Law', city:'Bengaluru, Karnataka', url:'https://msrlawcollege.edu.in', img:'https://source.unsplash.com/featured/?ramaiah,law' },
    { name:'SDM Law', city:'Mangalore, Karnataka', url:'https://sdmlc.ac.in', img:'https://source.unsplash.com/featured/?sdm,law' },
    { name:'JSS Law', city:'Mysuru, Karnataka', url:'https://jsslawcollege.in', img:'https://source.unsplash.com/featured/?jss,law' },
    { name:'Bishop Cotton Law', city:'Bengaluru, Karnataka', url:'https://www.bclc.edu.in', img:'https://source.unsplash.com/featured/?bishop,cotton,law' },
    { name:'CMR Law', city:'Bengaluru, Karnataka', url:'https://www.cmr.edu.in', img:'https://source.unsplash.com/featured/?cmr,law' },
    { name:'Al-Ameen Law', city:'Bengaluru, Karnataka', url:'https://alameenlaw.in', img:'https://source.unsplash.com/featured/?law,india' },
    { name:'Bangalore Institute of Legal Studies', city:'Bengaluru, Karnataka', url:'https://bils.ac.in', img:'https://source.unsplash.com/featured/?legal,studies' }
  ],
  schools: [
    { name:'National Public School', city:'Bengaluru, Karnataka', url:'https://www.npsinr.com', img:'https://source.unsplash.com/featured/?school,campus' },
    { name:'Delhi Public School', city:'Bengaluru, Karnataka', url:'https://south.dpsbangalore.edu.in', img:'https://source.unsplash.com/featured/?dps,school' },
    { name:'Baldwin Boys School', city:'Bengaluru, Karnataka', url:'https://baldwinsociety.in', img:'https://source.unsplash.com/featured/?baldwin,school' },
    { name:'Bishop Cotton Boys School', city:'Bengaluru, Karnataka', url:'https://bishopcottonboysschool.edu.in', img:'https://source.unsplash.com/featured/?bishop,cotton,school' },
    { name:'Bethany Primary School', city:'Bengaluru, Karnataka', url:'https://bethanyinstitutions.edu.in', img:'https://source.unsplash.com/featured/?bethany,school' },
    { name:'Clarence Primary School', city:'Bengaluru, Karnataka', url:'https://clarence.school', img:'https://source.unsplash.com/featured/?clarence,school' },
    { name:'Presidency School', city:'Bengaluru, Karnataka', url:'https://presidencyschools.org', img:'https://source.unsplash.com/featured/?presidency,school' },
    { name:'Army Public School', city:'Bengaluru, Karnataka', url:'https://www.apsbangalore.edu.in', img:'https://source.unsplash.com/featured/?army,school' },
    { name:'Greenwood School', city:'Bengaluru, Karnataka', url:'#', img:'https://source.unsplash.com/featured/?greenwood,school' },
    { name:'Inventure Academy', city:'Bengaluru, Karnataka', url:'https://www.inventureacademy.com', img:'https://source.unsplash.com/featured/?inventure,academy' }
  ],
  high: [
    { name:'Bishop Cotton High School', city:'Bengaluru, Karnataka', url:'https://bishopcottonboysschool.edu.in', img:'https://source.unsplash.com/featured/?highschool,campus' },
    { name:'Sophia High School', city:'Bengaluru, Karnataka', url:'https://sophiahighschool.org', img:'https://source.unsplash.com/featured/?sophia,school' },
    { name:'St. Joseph’s High School', city:'Bengaluru, Karnataka', url:'https://sjps.edu.in', img:'https://source.unsplash.com/featured/?stjoseph,school' },
    { name:'Bethany High School', city:'Bengaluru, Karnataka', url:'https://bethanyinstitutions.edu.in', img:'https://source.unsplash.com/featured/?bethany,high' },
    { name:'Clarence High School', city:'Bengaluru, Karnataka', url:'https://clarence.school', img:'https://source.unsplash.com/featured/?clarence,high' },
    { name:'National High School', city:'Bengaluru, Karnataka', url:'#', img:'https://source.unsplash.com/featured/?national,highschool' },
    { name:'Kendriya Vidyalaya High', city:'Bengaluru, Karnataka', url:'https://ro-bangalore.kvs.gov.in', img:'https://source.unsplash.com/featured/?kendriya,vidyalaya' },
    { name:'Presidency High', city:'Bengaluru, Karnataka', url:'https://presidencyschools.org', img:'https://source.unsplash.com/featured/?presidency,high' },
    { name:'Baldwin High School', city:'Bengaluru, Karnataka', url:'https://baldwinsociety.in', img:'https://source.unsplash.com/featured/?baldwin,high' },
    { name:'Christ High School', city:'Bengaluru, Karnataka', url:'#', img:'https://source.unsplash.com/featured/?christ,highschool' }
  ]
};
function renderCarousel(rowId, colleges, category){
  const row = document.getElementById(rowId);
  if(!row) return;
  row.innerHTML = colleges.map(c => `
    <div class="college-card" data-name="${c.name}">
      <div class="college-img-wrap"><img src="${c.img}" alt="${c.name}" loading="lazy" /></div>
      <div class="college-card-inner">
        <h3 class="college-name">${c.name}</h3>
        <p class="college-address">${c.city}</p>
        <a class="college-link" href="${c.url}" target="_blank" rel="noopener" onclick="event.stopPropagation();"><i class="fas fa-external-link-alt"></i> Website</a>
      </div>
    </div>
  `).join('');
  // Click anywhere else on card to open internal page for more future details
  row.querySelectorAll('.college-card').forEach(card => {
    card.addEventListener('click', () => {
      const slug = card.dataset.name.replace(/\s+/g,'-').toLowerCase();
      window.open(`college-${encodeURIComponent(slug)}.html`, '_blank');
    });
  });
}
document.addEventListener('DOMContentLoaded', function(){
  renderCarousel('enggRow', collegeData.engineering, 'Engineering');
  renderCarousel('medRow', collegeData.medical, 'Medical');
  renderCarousel('degRow', collegeData.degree, 'Degree');
  renderCarousel('lawRow', collegeData.law, 'Law');
  renderCarousel('schoolRow', collegeData.schools, 'School');
  renderCarousel('highRow', collegeData.high, 'High School');
  // Search logic
  const search = document.getElementById('collegeSearch');
  search.addEventListener('input', function(){
    const q = search.value.trim().toLowerCase();
    Object.entries(collegeData).forEach(([cat, list]) => {
      const filtered = list.filter(c => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));
      let rowId;
      switch(cat){
        case 'engineering': rowId='enggRow'; break;
        case 'medical': rowId='medRow'; break;
        case 'degree': rowId='degRow'; break;
        case 'law': rowId='lawRow'; break;
        case 'schools': rowId='schoolRow'; break;
        case 'high': rowId='highRow'; break;
      }
      const label = cat==='high' ? 'High School' : cat.charAt(0).toUpperCase()+cat.slice(1).replace(/s$/,'');
      renderCarousel(rowId, filtered, label);
    });
    // Hide rows (and their titles) that have no matches when searching
    const rows = document.querySelectorAll('.carousel-row');
    rows.forEach(row => {
      const title = row.previousElementSibling;
      if(q){
        if(row.children.length === 0){
          row.style.display = 'none';
          if(title && title.classList.contains('carousel-title')) title.style.display='none';
        } else {
          row.style.display = 'flex';
          if(title && title.classList.contains('carousel-title')) title.style.display='block';
        }
      } else {
        // reset
        row.style.display = 'flex';
        if(title && title.classList.contains('carousel-title')) title.style.display='block';
      }
    });
  });
  // Filter button placeholder
  document.getElementById('filterBtn').addEventListener('click', function(){
    alert('Filter options coming soon!');
  });
});

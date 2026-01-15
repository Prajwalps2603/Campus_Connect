// Simple skeleton controller
// Add 'loading' class to body plus required skeleton markup inside each page.
(function(){
  const MIN_DURATION = 600;
  const started = performance.now();
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Disable shimmer if user prefers reduced motion
  if(prefersReduced){
    document.documentElement.classList.add('reduced-motion');
    const style = document.createElement('style');
    style.textContent = `.reduced-motion .skel-bar:after, .reduced-motion .skel-avatar:after, .reduced-motion .skel-thumb:after, .reduced-motion .skel-card:after, .reduced-motion .skel-pill:after {animation:none; background:rgba(255,255,255,0.06);}`;
    document.head.appendChild(style);
  }

  function hideSkeleton(){
    document.body.classList.remove('loading');
    document.querySelectorAll('.skeleton-overlay.dynamic').forEach(n=>n.remove());
    const base = document.querySelector('.skeleton-overlay');
    if(base && !base.classList.contains('dynamic')) base.remove();
  }

  function baseDone(){
    const elapsed = performance.now() - started;
    const wait = Math.max(0, MIN_DURATION - elapsed);
    setTimeout(hideSkeleton, wait);
  }

  // Public API for dynamic operations
  function showSkeleton(options={}){
    const { targetSelector, variant='cards', count=4 } = options;
    const container = targetSelector ? document.querySelector(targetSelector) : document.body;
    if(!container) return;
    const wrap = document.createElement('div');
    wrap.className = 'skeleton-overlay dynamic';
    if(container !== document.body){ wrap.style.margin = '0'; }
    let inner='';
    if(variant==='list'){
      inner = '<div class="skel-stack">'+Array.from({length:count}).map(()=>`<div class="skel-row"><div class="skel-avatar"></div><div class="skel-bar w-60"></div></div>`).join('')+'</div>';
    } else if(variant==='posts'){
      inner = Array.from({length:count}).map(()=>`<div class="skel-stack" style="gap:.6rem; margin-bottom:1.2rem;"><div class="skel-row"><div class="skel-avatar"></div><div class="skel-bar w-40"></div></div><div class="skel-thumb"></div><div class="skel-bar w-70"></div><div class="skel-bar w-50"></div></div>`).join('');
    } else { // cards default
      inner = '<div class="skel-card-grid">'+Array.from({length:count}).map(()=>'<div class="skel-card"></div>').join('')+'</div>';
    }
    wrap.innerHTML = inner;
    container.prepend(wrap);
    document.body.classList.add('loading');
  }

  function hideSectionSkeleton(targetSelector){
    const target = document.querySelector(targetSelector);
    if(!target) return;
    target.querySelectorAll(':scope > .skeleton-overlay.dynamic').forEach(n=>n.remove());
    if(!document.querySelector('.skeleton-overlay.dynamic')) document.body.classList.remove('loading');
  }

  window.Skeleton = { show:showSkeleton, hide:hideSectionSkeleton, hideAll:hideSkeleton };

  window.addEventListener('load', baseDone);
  setTimeout(hideSkeleton, 4000);
})();

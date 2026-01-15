// Advanced Post Creator Logic
(function(){
  const backBtn = document.getElementById('backBtn');
  const publishBtn = document.getElementById('publishBtn');
  const toEditBtn = document.getElementById('toEditBtn');
  const toDetailsBtn = document.getElementById('toDetailsBtn');
  const shareFromDetailsBtn = document.getElementById('shareFromDetailsBtn');
  const finalShareBtn = document.getElementById('finalShareBtn');
  const saveDraftBtn = document.getElementById('saveDraftBtn');
  const saveDraftBtn2 = document.getElementById('saveDraftBtn2');
  const stepDots = document.querySelectorAll('.step-dot');
  const stepSelect = document.getElementById('stepSelect');
  const stepEdit = document.getElementById('stepEdit');
  const stepDetails = document.getElementById('stepDetails');
  const captionInput = document.getElementById('captionInput');
  const reelToggle = document.getElementById('reelToggle');
  const fileInput = document.getElementById('fileInput');
  const chooseFileBtn = document.getElementById('chooseFileBtn');
  const cameraBtn = document.getElementById('cameraBtn');
  const dropZone = document.getElementById('dropZone');
  const cropBox = document.getElementById('cropBox');
  const stickerLayer = document.getElementById('stickerLayer');
  const addStickerBtn = document.getElementById('addStickerBtn');
  const stickerPicker = document.getElementById('stickerPicker');
  const aspectBar = document.getElementById('aspectBar');
  const filterBar = document.getElementById('filterBar');
  const miniPreview = document.getElementById('miniPreview');
  const metaSummary = document.getElementById('metaSummary');
  const hashtagPreview = document.getElementById('hashtagPreview');
  const statusMsg = document.getElementById('statusMsg');
  const draftStatus = document.getElementById('draftStatus');
  const stickerList = document.getElementById('stickerList');
  const stepContextNotice = document.getElementById('stepContextNotice');
  const backToSelectBtn = document.getElementById('backToSelectBtn');
  const backToEditBtn = document.getElementById('backToEditBtn');
  const recenterBtn = document.getElementById('recenterBtn');
  const retakeBtn = document.getElementById('retakeBtn');
  const customCropBox = document.getElementById('customCropBox');

  let currentStep = 0;
  let mediaEl = null; // <img> or <video>
  let mediaFile = null;
  // Panning removed; no drag state needed
  let filterClass = 'filter-none';
  let stickers = [];
  let customMode = false; // true when 'custom' aspect selected
  let customCrop = null; // {x,y,w,h} in cropBox coordinate space
  let cropDrag = null; // drag/resize state

  // Auth guard
  const authToken = localStorage.getItem('authToken');
  if(!authToken){ window.location.href = 'index.html'; return; }

  function setStep(step){
    currentStep = step;
    stepDots.forEach(d=> d.classList.toggle('active', Number(d.dataset.step) === step));
    stepSelect.classList.toggle('hidden', step !== 0);
    stepEdit.classList.toggle('hidden', step !== 1);
    stepDetails.classList.toggle('hidden', step !== 2);
    publishBtn.disabled = step !== 2;
  // Scrollable layout: disable fixed editing-mode
  document.body.classList.remove('editing-mode');
    if(step === 0){ stepContextNotice.textContent = 'Step 1 · Select media to continue.'; }
    if(step === 1){ stepContextNotice.textContent = 'Step 2 · Edit your media (crop, filter, stickers).'; }
    if(step === 2){ stepContextNotice.textContent = 'Step 3 · Add final details & share.'; buildMiniPreview(); }
    // Refit media when entering edit mode (in case layout changed)
    if(step === 1){
      const asp = cropBox.dataset.aspect || '1:1';
      resizeCropBoxForAspect(asp);
      setTimeout(fitMediaToBox, 30);
    }
  }

  function enableEditIfReady(){
    toEditBtn.disabled = !mediaFile;
  }

  backBtn?.addEventListener('click', ()=> window.location.href='feed.html');

  chooseFileBtn?.addEventListener('click', ()=> fileInput.click());
  cameraBtn?.addEventListener('click', ()=> fileInput.click()); // rely on capture attr for mobile

  fileInput?.addEventListener('change', ()=> {
    const f = fileInput.files[0]; if(f) loadSelectedFile(f);
  });

  function loadSelectedFile(file){
    mediaFile = file;
    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');
    if(!isImg && !isVid){ statusMsg.textContent = 'Unsupported file type.'; mediaFile=null; return; }
    dropZone.innerHTML = '';
    mediaEl = document.createElement(isImg ? 'img' : 'video');
    mediaEl.src = URL.createObjectURL(file);
    if(isVid){ mediaEl.muted=true; mediaEl.controls=true; mediaEl.playsInline=true; }
    mediaEl.className = filterClass;
    mediaEl.style.position='absolute';
    cropBox.appendChild(mediaEl);
    // Once intrinsic size known, fit into box
    const onReady = ()=> fitMediaToBox();
    if(isImg){ mediaEl.addEventListener('load', onReady, { once:true }); }
    else { mediaEl.addEventListener('loadedmetadata', onReady, { once:true }); }
    stickerLayer.innerHTML='';
    stickers=[]; updateStickerList();
  applyTransform();
  // ensure crop box sized correctly for current aspect on first load
  resizeCropBoxForAspect(cropBox.dataset.aspect || '1:1');
    enableEditIfReady();
    // Immediately move to edit step so user sees the preview without needing to click Next
    setStep(1);
  }

  function fitMediaToBox(){
    if(!mediaEl) return;
    const boxRect = cropBox.getBoundingClientRect();
    const mw = mediaEl.naturalWidth || mediaEl.videoWidth || boxRect.width;
    const mh = mediaEl.naturalHeight || mediaEl.videoHeight || boxRect.height;
    if(!mw || !mh) return;
    const scale = Math.min(boxRect.width / mw, boxRect.height / mh);
    mediaEl.style.width = Math.round(mw * scale) + 'px';
    mediaEl.style.height = Math.round(mh * scale) + 'px';
  applyTransform();
  }

  function resizeCropBoxForAspect(aspect){
    // Fixed container; show inner frame for chosen ratio so user sees target crop bounds.
    let frame = cropBox.querySelector('.ratio-frame');
    if(!frame){ frame = document.createElement('div'); frame.className='ratio-frame'; cropBox.appendChild(frame); }
    const [aw,ah] = aspect.split(':').map(Number);
    if(!(aw&&ah)) return;
    const boxW = cropBox.clientWidth;
    const boxH = cropBox.clientHeight;
    let w = boxW;
    let h = w * (ah/aw);
    if(h > boxH){ h = boxH; w = h * (aw/ah); }
    frame.style.width = Math.round(w)+'px';
    frame.style.height = Math.round(h)+'px';
  }

  function applyTransform(){
    if(!mediaEl) return;
    mediaEl.style.transform='translate(-50%, -50%)';
  }

  // Disable panning: image is always centered in contain mode
  cropBox?.addEventListener('pointerdown', ()=>{});

  aspectBar?.addEventListener('click', e=>{
    const btn = e.target.closest('.aspect-btn'); if(!btn) return;
    aspectBar.querySelectorAll('.aspect-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const asp = btn.dataset.aspect;
    cropBox.dataset.aspect = asp;
    if(asp === 'custom'){
      enableCustomCrop();
    } else {
      disableCustomCrop();
      resizeCropBoxForAspect(asp);
      setTimeout(fitMediaToBox, 0);
    }
  });

  window.addEventListener('resize', ()=>{
    const asp = cropBox.dataset.aspect || '1:1';
    if(customMode){ confineCustomCrop(); renderCustomCrop(); }
    else resizeCropBoxForAspect(asp);
    fitMediaToBox();
  });

  filterBar?.addEventListener('click', e=>{
    const btn = e.target.closest('.filter-btn'); if(!btn) return;
    filterBar.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    filterClass = 'filter-' + btn.dataset.filter;
    if(mediaEl){ mediaEl.className = filterClass; }
  });

  addStickerBtn?.addEventListener('click', ()=>{
    stickerPicker.classList.toggle('hidden');
  });
  stickerPicker?.addEventListener('click', e=>{
    const sb = e.target.closest('.sticker-btn'); if(!sb) return;
    const emoji = sb.dataset.sticker;
    const node = document.createElement('div');
    node.className='sticker';
    node.textContent=emoji;
    node.style.left='50%'; node.style.top='50%'; node.style.transform='translate(-50%, -50%)';
    stickerLayer.appendChild(node);
    stickers.push(emoji); updateStickerList();
    enableStickerDrag(node);
  });
  function enableStickerDrag(el){
    let start=null; el.addEventListener('pointerdown', e=>{ start={x:e.clientX,y:e.clientY,ox:el.offsetLeft,oy:el.offsetTop}; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e=>{
      if(!start) return;
      const nx = start.ox + (e.clientX-start.x);
      const ny = start.oy + (e.clientY-start.y);
      el.style.left=nx+'px';
      el.style.top=ny+'px';
      el.style.transform='translate(-50%, -50%)';
    });
    el.addEventListener('pointerup', ()=> start=null);
  }
  function updateStickerList(){ stickerList.textContent = stickers.length ? 'Stickers: '+ stickers.join(' ') : 'Added stickers appear here.'; }

  recenterBtn?.addEventListener('click', ()=> applyTransform());
  retakeBtn?.addEventListener('click', ()=>{ // reset to choose step
    mediaFile=null; mediaEl?.remove(); mediaEl=null; setStep(0); dropZone.innerHTML=''; dropZone.appendChild(document.getElementById('selectPlaceholder')); enableEditIfReady();
  });

  toEditBtn?.addEventListener('click', ()=>{ if(mediaFile){ setStep(1); } });
  backToSelectBtn?.addEventListener('click', ()=> setStep(0));
  toDetailsBtn?.addEventListener('click', ()=>{ setStep(2); updateMetaSummary(); syncFinalShareState(); });
  backToEditBtn?.addEventListener('click', ()=> setStep(1));

  shareFromDetailsBtn?.addEventListener('click', ()=> doPublish());
  finalShareBtn?.addEventListener('click', ()=> doPublish());
  publishBtn?.addEventListener('click', ()=> doPublish());

  captionInput?.addEventListener('input', ()=>{ extractHashtags(); updateMetaSummary(); syncFinalShareState(); });
  reelToggle?.addEventListener('change', ()=> updateMetaSummary());

  function extractHashtags(){
  const text = captionInput.value;
  const tags = Array.from(new Set(text.match(/#\w+/g)||[]));
    hashtagPreview.innerHTML = tags.map(t=>`<span class="tag-chip">${t}</span>`).join('');
  }
  function updateMetaSummary(){
    const tags = captionInput.value.match(/#\w+/g)||[];
    const isReel = reelToggle.checked;
    let type = '—';
    if(mediaFile){
      if(mediaFile.type.startsWith('video/')) type='Video'; else type='Image';
    }
    metaSummary.textContent = `${type}${isReel? ' (Reel)':''} • ${tags.length} hashtag${tags.length!==1?'s':''}`;
  }
  function syncFinalShareState(){ finalShareBtn.disabled = !mediaFile; publishBtn.disabled = !mediaFile; }

  function buildMiniPreview(){
    miniPreview.innerHTML='';
    if(!mediaFile) return;
    const el = document.createElement(mediaFile.type.startsWith('image/')? 'img':'video');
    el.src = mediaEl?.src; if(el.tagName==='VIDEO'){ el.muted=true; el.playsInline=true; el.controls=false; }
    el.className = filterClass; miniPreview.appendChild(el);
    if(customMode && customCrop){
      const meta = document.createElement('div'); meta.className='meta-line'; meta.textContent = `Custom Crop: ${Math.round(customCrop.w)}×${Math.round(customCrop.h)}`; miniPreview.appendChild(meta);
    }
  }

  // Drag & drop
  ['dragenter','dragover'].forEach(ev=> dropZone?.addEventListener(ev, e=>{ e.preventDefault(); dropZone.classList.add('drag-over'); }));
  ;['dragleave','drop'].forEach(ev=> dropZone?.addEventListener(ev, e=>{ e.preventDefault(); if(ev==='drop'){ const file = e.dataTransfer.files[0]; if(file) loadSelectedFile(file); } dropZone.classList.remove('drag-over'); }));

  // Paste (global)
  document.addEventListener('paste', e=> {
    if(currentStep!==0) return;
    const items = e.clipboardData.items;
    for(const it of items){
      if(it.type.startsWith('image/')){
        loadSelectedFile(it.getAsFile());
        break;
      }
    }
  });

  function saveDraft(){
    const draft = { caption: captionInput.value, reel: reelToggle.checked, stickers, filterClass, ts: Date.now(), customCrop: customMode? customCrop:null };
    localStorage.setItem('postDraft', JSON.stringify(draft));
    draftStatus.textContent = 'Draft saved just now.';
  }
  saveDraftBtn?.addEventListener('click', saveDraft);
  saveDraftBtn2?.addEventListener('click', saveDraft);

  (function loadDraft(){
    try {
      const d = JSON.parse(localStorage.getItem('postDraft')||'null');
      if(d){
        captionInput.value=d.caption||'';
        if(d.reel) reelToggle.checked=true;
        filterClass=d.filterClass||'filter-none';
        stickers=d.stickers||[];
        if(d.customCrop){ customCrop=d.customCrop; customMode=true; activateCustomUIFromDraft(); }
        updateStickerList();
        extractHashtags();
        draftStatus.textContent = 'Draft restored.';
      }
    } catch(err){
      console.warn('Invalid draft JSON, clearing.', err);
      localStorage.removeItem('postDraft');
      throw err; // rethrow to satisfy lint rule about swallowing errors
    }
  })();

  async function doPublish(){
    if(!mediaFile) return;
    publishBtn.disabled = true; finalShareBtn.disabled=true; statusMsg.textContent='Uploading...'; shareFromDetailsBtn.disabled=true;
    try {
      const fd = new FormData();
      fd.append('caption', captionInput.value);
      fd.append('media', mediaFile);
      if(reelToggle.checked) fd.append('reel','1');
      // Additional metadata (not persisted server-side yet but future ready)
      fd.append('filter', filterClass.replace('filter-',''));
  fd.append('stickers', JSON.stringify(stickers));
  if(customMode && customCrop){ fd.append('crop', JSON.stringify(customCrop)); }
      const res = await fetch('/api/posts', { method:'POST', headers:{ 'Authorization':'Bearer '+authToken }, body: fd });
      const data = await res.json();
      if(!res.ok || !data.success){ statusMsg.textContent = data.message || 'Failed to publish.'; statusMsg.style.color = '#ff8484'; }
      else {
        statusMsg.textContent='Posted! Redirecting...';
        statusMsg.style.color='#7aff96';
        localStorage.removeItem('postDraft');
        // Flag feed to refresh after navigation & store new post for instant prepend
        try { localStorage.setItem('justCreatedPost', JSON.stringify(data.post)); } catch {}
        localStorage.setItem('feedNeedsRefresh','1');
        setTimeout(()=> window.location.href='feed.html', 600);
      }
    } catch(err){
      console.error('Publish error', err);
      statusMsg.textContent='Network error.';
      statusMsg.style.color='#ff8484';
    }
    finally { publishBtn.disabled=false; finalShareBtn.disabled=false; shareFromDetailsBtn.disabled=false; }
  }

  // Initialize
  setStep(0);

  /* ================= Custom Crop Logic ================= */
  function enableCustomCrop(){
    if(!mediaEl) return;
    customMode=true;
    customCropBox.classList.remove('hidden');
    if(!customCrop){
      // start with full visible frame inside box (square)
      const bw = cropBox.clientWidth; const bh = cropBox.clientHeight;
      const size = Math.min(bw, bh) * 0.8;
      customCrop = { x:(bw-size)/2, y:(bh-size)/2, w:size, h:size };
    }
    renderCustomCrop();
  }
  function disableCustomCrop(){
    customMode=false; customCropBox.classList.add('hidden');
  }
  function activateCustomUIFromDraft(){
    customCropBox.classList.remove('hidden');
    renderCustomCrop();
  }
  function confineCustomCrop(){
    if(!customCrop) return;
    const bw=cropBox.clientWidth, bh=cropBox.clientHeight;
    if(customCrop.x<0) customCrop.x=0;
    if(customCrop.y<0) customCrop.y=0;
    if(customCrop.x+customCrop.w>bw) customCrop.x=bw-customCrop.w;
    if(customCrop.y+customCrop.h>bh) customCrop.y=bh-customCrop.h;
    if(customCrop.w<30) customCrop.w=30;
    if(customCrop.h<30) customCrop.h=30;
  }
  function renderCustomCrop(){
    if(!customCrop) return;
    confineCustomCrop();
    customCropBox.style.left = customCrop.x + 'px';
    customCropBox.style.top = customCrop.y + 'px';
    customCropBox.style.width = customCrop.w + 'px';
    customCropBox.style.height = customCrop.h + 'px';
  }
  customCropBox?.addEventListener('pointerdown', e=>{
    if(!customMode) return;
    const handle = e.target.closest('.custom-crop-handle');
    const start = { mx:e.clientX, my:e.clientY, crop: { ...customCrop } };
    if(handle){
      const pos = handle.dataset.pos;
      cropDrag = { type:'resize', pos, start };
    } else if(e.target === customCropBox){
      cropDrag = { type:'move', start };
    } else return;
    e.preventDefault();
  });
  window.addEventListener('pointermove', e=>{
    if(!cropDrag || !customMode) return;
    const dx = e.clientX - cropDrag.start.mx;
    const dy = e.clientY - cropDrag.start.my;
    const base = cropDrag.start.crop;
    if(cropDrag.type==='move'){
      customCrop.x = base.x + dx;
      customCrop.y = base.y + dy;
    } else if(cropDrag.type==='resize'){
      let x=base.x, y=base.y, w=base.w, h=base.h;
      switch(cropDrag.pos){
        case 'tl': x = base.x+dx; y=base.y+dy; w=base.w-dx; h=base.h-dy; break;
        case 'tr': y=base.y+dy; w=base.w+dx; h=base.h-dy; break;
        case 'bl': x=base.x+dx; w=base.w-dx; h=base.h+dy; break;
        case 'br': w=base.w+dx; h=base.h+dy; break;
        case 'tm': y=base.y+dy; h=base.h-dy; break;
        case 'bm': h=base.h+dy; break;
        case 'ml': x=base.x+dx; w=base.w-dx; break;
        case 'mr': w=base.w+dx; break;
      }
      customCrop = { x,y,w,h };
    }
    renderCustomCrop();
  });
  window.addEventListener('pointerup', ()=> cropDrag=null);
})();

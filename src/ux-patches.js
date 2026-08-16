const token=()=>localStorage.getItem('mk_session')||'';
const authHeaders=()=>token()?{authorization:`Bearer ${token()}`}:{};
let videoPage=false;
let decorateQueued=false;

async function uxApi(path,options={}){
  const headers={...(options.headers||{}),...authHeaders()};
  const res=await fetch(path,{...options,headers});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||`İstek başarısız (${res.status})`);
  return data;
}

function stopBackdropClose(){
  document.addEventListener('click',e=>{
    const backdrop=e.target.closest('.modal-backdrop');
    if(backdrop && e.target===backdrop)e.stopPropagation();
  },true);
}

function closeUxModal(){document.querySelector('.mk-ux-modal')?.remove();}
function openUxModal(title,body,onReady){
  closeUxModal();
  document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop mk-ux-modal"><div class="modal-card"><div class="modal-head"><h2>${title}</h2><button class="icon-btn" type="button" data-ux-close>×</button></div><div class="modal-body">${body}</div></div></div>`);
  document.querySelector('.mk-ux-modal [data-ux-close]')?.addEventListener('click',closeUxModal);
  onReady?.(document.querySelector('.mk-ux-modal'));
}

function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function youtubeId(url){
  try{
    const u=new URL(url);
    if(u.hostname==='youtu.be')return u.pathname.slice(1).split('/')[0]||'';
    if(u.searchParams.get('v'))return u.searchParams.get('v');
    const m=u.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/);return m?m[1]:'';
  }catch{return '';}
}

async function fetchAppData(){return uxApi('/api/data');}

function addVideoNav(){
  const sidebar=document.querySelector('.nav-scroll');
  if(!sidebar||sidebar.querySelector('.mk-video-nav'))return;
  const b=document.createElement('button');
  b.className='nav-item mk-video-nav';
  b.type='button';
  b.innerHTML='<span class="mk-video-icon">▶</span><span>Videolar</span>';
  sidebar.appendChild(b);
}

async function renderVideoPage(){
  videoPage=true;
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
  document.querySelector('.mk-video-nav')?.classList.add('active');
  const title=document.querySelector('.topbar h1');
  if(title)title.textContent='Videolar';
  const content=document.querySelector('.content');
  if(!content)return;
  content.innerHTML='<div class="mk-video-page"><section class="panel"><div class="mk-video-header"><div><h2>Videolar</h2><p>YouTube bağlantılarını veya yüklenen ders videolarını tek yerde yönetin.</p></div><div class="actions" id="mk-video-actions"></div></div></section><section class="panel"><div id="mk-video-list"><div class="mk-video-empty">Videolar yükleniyor…</div></div></section></div>';
  const data=await fetchAppData();
  const teacher=['admin','superadmin'].includes(data.user.role);
  const actions=document.querySelector('#mk-video-actions');
  if(teacher)actions.innerHTML='<button class="btn primary" data-video-action="youtube">+ YouTube</button><button class="btn ghost" data-video-action="upload">+ Video dosyası</button>';
  const list=document.querySelector('#mk-video-list');
  const videos=await uxApi('/api/videos');
  if(!videos.length){list.innerHTML='<div class="mk-video-empty">Henüz video eklenmemiş.</div>';bindVideoPageEvents();return;}
  const fallbackToken=encodeURIComponent(token());
  list.innerHTML=`<div class="mk-video-grid">${videos.map(v=>{
    const player=v.provider==='youtube'?`<iframe src="https://www.youtube-nocookie.com/embed/${escapeHtml(v.youtubeId||youtubeId(v.url))}" title="${escapeHtml(v.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`:`<video controls preload="metadata" src="/api/video?key=${encodeURIComponent(v.r2Key||'')}&token=${fallbackToken}"></video>`;
    return `<article class="mk-video-card"><div>${v.provider==='youtube'?'<span class="badge red">YouTube</span>':'<span class="badge blue">Dosya</span>'}</div><h3>${escapeHtml(v.title)}</h3>${v.description?`<p>${escapeHtml(v.description)}</p>`:''}${player}<div class="mk-video-meta"><small>${escapeHtml(v.createdAt||'')}</small>${teacher?`<button class="table-btn danger" data-video-action="delete" data-video-id="${escapeHtml(v.id)}">Sil</button>`:''}</div></article>`;
  }).join('')}</div>`;
  bindVideoPageEvents();
}

function bindVideoPageEvents(){
  document.querySelectorAll('[data-video-action="youtube"]').forEach(b=>b.onclick=()=>openYoutubeModal());
  document.querySelectorAll('[data-video-action="upload"]').forEach(b=>b.onclick=()=>openUploadModal());
  document.querySelectorAll('[data-video-action="delete"]').forEach(b=>b.onclick=()=>deleteVideo(b.dataset.videoId));
}

function openYoutubeModal(){
  openUxModal('YouTube videosu ekle',`<form id="mk-youtube-form" class="mk-video-form"><div class="field"><span>Başlık</span><input name="title" required></div><div class="field"><span>YouTube linki</span><input name="url" placeholder="https://www.youtube.com/watch?v=…" required></div><div class="field"><span>Açıklama</span><textarea name="description" placeholder="İsteğe bağlı"></textarea></div><div class="form-actions"><button class="btn primary">Kaydet</button></div></form>`,modal=>{
    modal.querySelector('#mk-youtube-form').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),url=String(fd.get('url')||''),id=youtubeId(url);if(!id)return alert('Geçerli bir YouTube bağlantısı gir.');try{await uxApi('/api/videos',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({provider:'youtube',title:fd.get('title'),description:fd.get('description'),url})});closeUxModal();renderVideoPage();}catch(err){alert(err.message)}};
  });
}

function openUploadModal(){
  openUxModal('Video dosyası yükle',`<form id="mk-upload-form" class="mk-video-form"><div class="field"><span>Başlık</span><input name="title" required></div><div class="field"><span>Açıklama</span><textarea name="description" placeholder="İsteğe bağlı"></textarea></div><div class="field"><span>Video dosyası</span><input name="file" type="file" accept="video/mp4,video/webm,video/quicktime" required></div><div class="mk-video-note">Yükleme için Cloudflare R2 üzerinde <b>VIDEOS</b> binding'i gerekir. Önerilen dosya türleri: MP4, WebM.</div><div class="mk-file-name" data-file-name></div><div class="form-actions"><button class="btn primary">Yükle</button></div><div class="mk-progress"><div data-progress></div></div></form>`,modal=>{
    const form=modal.querySelector('#mk-upload-form'),file=form.querySelector('[name="file"]'),name=form.querySelector('[data-file-name]'),bar=form.querySelector('[data-progress]');
    file.onchange=()=>name.textContent=file.files[0]?`${file.files[0].name} (${Math.round(file.files[0].size/1024/1024)} MB)`:'';
    form.onsubmit=async e=>{e.preventDefault();const f=file.files[0];if(!f)return;if(f.size>100*1024*1024){alert('Tek video için 100 MB sınırı var.');return;}const fd=new FormData();fd.append('title',form.elements.title.value);fd.append('description',form.elements.description.value);fd.append('file',f);try{const res=await fetch('/api/videos',{method:'POST',headers:authHeaders(),body:fd});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'Video yüklenemedi.');bar.style.width='100%';closeUxModal();renderVideoPage();}catch(err){alert(err.message)}};
  });
}

async function deleteVideo(id){if(!confirm('Bu videoyu silmek istediğine emin misin?'))return;try{await uxApi('/api/videos',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'delete',id})});renderVideoPage();}catch(err){alert(err.message)}}

async function planLesson(date,hour,teacherId){
  const data=await fetchAppData();
  const students=data.students||[];
  const eligible=students.length?students:[ ];
  if(!eligible.length){alert('Önce öğrenci eklemelisin.');return;}
  const teacherList=(data.teachers||[]).map(t=>({id:t.id,name:t.name}));
  const isSuper=data.user.role==='superadmin';
  const teacherValue=teacherId||(teacherList[0]?.id||data.user.id);
  const opts=eligible.map(s=>`<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} — ${escapeHtml(s.serviceType||'Özel Ders')}</option>`).join('');
  const tOpts=teacherList.map(t=>`<option value="${escapeHtml(t.id)}" ${t.id===teacherValue?'selected':''}>${escapeHtml(t.name)}</option>`).join('');
  openUxModal('Ders planla',`<form id="mk-lesson-form" class="mk-lesson-form"><div class="field"><span>Ders adı</span><input name="title" value="Matematik Dersi" required></div><div class="field"><span>Öğrenci</span><select name="studentId">${opts}</select></div>${isSuper?`<div class="field"><span>Öğretmen</span><select name="ownerId">${tOpts}</select></div>`:''}<div class="field"><span>Tarih</span><input name="date" type="date" value="${escapeHtml(date)}" min="${escapeHtml(date)}" required></div><div class="field"><span>Saat</span><input name="start" value="${String(hour).padStart(2,'0')}:00" readonly></div><p class="mk-lesson-form-note">Kapalı, dolu veya çakışan saatler sunucu tarafından da engellenir.</p><div class="form-actions"><button class="btn primary">Dersi Planla</button></div></form>`,modal=>{
    modal.querySelector('#mk-lesson-form').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);try{await uxApi('/api/data',{method:'POST',body:JSON.stringify({type:'lesson',title:fd.get('title'),studentId:fd.get('studentId'),ownerId:fd.get('ownerId'),date:fd.get('date'),start:fd.get('start')})});closeUxModal();location.reload();}catch(err){alert(err.message)}};
  });
}

function decorateCalendar(){
  const panel=document.querySelector('.day-panel');
  if(!panel||panel.dataset.uxDecorated==='1')return;
  panel.dataset.uxDecorated='1';
  const heading=panel.querySelector('.panel-head');
  const date=heading?.querySelector('h2')?.textContent?.trim();
  const teacherSelect=document.querySelector('select[name="calendarTeacher"]');
  const teacherId=teacherSelect?.value||'';
  panel.querySelectorAll('.hour-row').forEach(row=>{
    const status=row.querySelector('.status');
    if(!status||status.classList.contains('full'))return;
    const hourText=row.querySelector('.hour')?.textContent?.trim()||'';
    const hour=Number(hourText.slice(0,2));
    const actions=row.querySelector(':scope > div:last-child');
    if(!actions||actions.querySelector('.mk-calendar-plan'))return;
    const btn=document.createElement('button');btn.type='button';btn.className='btn tiny mk-calendar-plan';btn.textContent='Ders Planla';btn.dataset.mkPlanDate=date;btn.dataset.mkPlanHour=String(hour);btn.dataset.mkPlanTeacher=teacherId;actions.classList.add('mk-hour-actions');actions.appendChild(btn);
  });
  const headActions=heading?.querySelector('.panel-head .actions')||heading?.querySelector('.actions');
  if(headActions&&!headActions.querySelector('.mk-calendar-plan-header')){
    const openBtn=document.createElement('button');openBtn.type='button';openBtn.className='btn primary mk-calendar-plan-header';openBtn.textContent='Ders Planla';openBtn.dataset.mkPlanDate=date;openBtn.dataset.mkPlanHour='8';openBtn.dataset.mkPlanTeacher=teacherId;headActions.appendChild(openBtn);
  }
}

function scheduleDecorate(){
  if(decorateQueued)return;decorateQueued=true;requestAnimationFrame(()=>{decorateQueued=false;addVideoNav();if(!videoPage)decorateCalendar();});
}

document.addEventListener('click',e=>{
  const vnav=e.target.closest('.mk-video-nav');
  if(vnav){e.preventDefault();e.stopPropagation();renderVideoPage();return;}
  const plan=e.target.closest('.mk-calendar-plan,.mk-calendar-plan-header');
  if(plan){e.preventDefault();e.stopPropagation();planLesson(plan.dataset.mkPlanDate,Number(plan.dataset.mkPlanHour),plan.dataset.mkPlanTeacher);return;}
});

document.addEventListener('click',e=>{
  if(videoPage){
    const pageBtn=e.target.closest('[data-page]');
    if(pageBtn){videoPage=false;document.querySelector('.mk-video-nav')?.classList.remove('active');}
  }
});

const observer=new MutationObserver(scheduleDecorate);
observer.observe(document.documentElement,{subtree:true,childList:true});
stopBackdropClose();
scheduleDecorate();

const UI_TOKEN=()=>localStorage.getItem('mk_session')||'';
const UI_AUTH=()=>UI_TOKEN()?{authorization:`Bearer ${UI_TOKEN()}`}:{};
let uiBusy=false;
const pageKey='mk_last_page';
const navOrderKey=()=>`mk_nav_order_${document.body.dataset.uiUser||'default'}`;

async function uiJson(path,options={}){
  const res=await fetch(path,{...options,headers:{...UI_AUTH(),...(options.headers||{})}});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||`İstek başarısız (${res.status})`);
  return data;
}

function uiEsc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function currentRole(){return document.querySelector('.user-chip .badge')?.textContent?.trim()||'';}
function isTeacherUi(){const r=currentRole();return r==='Baş Admin'||r==='Öğretmen';}

async function restorePage(){
  const saved=localStorage.getItem(pageKey);
  if(!saved||saved==='dashboard'||uiBusy)return;
  const btn=document.querySelector(`[data-page="${CSS.escape(saved)}"]`);
  if(btn){uiBusy=true;setTimeout(()=>{btn.click();uiBusy=false;},40);return;}
  if(saved==='videos')document.querySelector('.mk-video-nav')?.click();
  if(saved==='groups')document.querySelector('.mk-groups-nav')?.click();
}

function trackPageClicks(){
  document.addEventListener('click',e=>{
    const pageBtn=e.target.closest('[data-page]');
    if(pageBtn?.dataset.page){localStorage.setItem(pageKey,pageBtn.dataset.page);}
    if(e.target.closest('.mk-video-nav'))localStorage.setItem(pageKey,'videos');
    if(e.target.closest('.mk-groups-nav'))localStorage.setItem(pageKey,'groups');
  },true);
}

function injectNavEditor(){
  const sidebar=document.querySelector('.sidebar');
  const nav=sidebar?.querySelector('.nav-scroll');
  if(!sidebar||!nav||nav.querySelector('.mk-nav-editor-button')||!isTeacherUi())return;
  const btn=document.createElement('button');
  btn.type='button';btn.className='nav-item mk-nav-editor-button';btn.innerHTML='<span>⚙</span><span>Menüyü Düzenle</span>';
  btn.onclick=()=>openNavEditor();
  sidebar.insertBefore(btn,nav.nextSibling);
}

function getNavItems(){
  const nav=document.querySelector('.nav-scroll');
  if(!nav)return [];
  return [...nav.querySelectorAll('.nav-item')].filter(b=>!b.classList.contains('mk-nav-editor-button')&&!b.classList.contains('logout')).map(b=>({key:b.dataset.page||b.classList[1]||b.textContent.trim(),label:b.textContent.trim(),el:b}));
}

function applyNavOrder(){
  const nav=document.querySelector('.nav-scroll');if(!nav)return;
  const items=getNavItems();if(!items.length)return;
  const saved=JSON.parse(localStorage.getItem(navOrderKey())||'null');
  if(!Array.isArray(saved))return;
  const map=new Map(items.map(x=>[x.key,x]));
  for(const key of saved){const x=map.get(key);if(x)nav.appendChild(x.el);}
  for(const x of items){if(!saved.includes(x.key))nav.appendChild(x.el);}
}

function openNavEditor(){
  document.querySelector('.mk-nav-modal')?.remove();
  const items=getNavItems();
  const saved=JSON.parse(localStorage.getItem(navOrderKey())||'null');
  const order=(Array.isArray(saved)?saved:items.map(x=>x.key)).filter(k=>items.some(x=>x.key===k));
  items.forEach(x=>{if(!order.includes(x.key))order.push(x.key);});
  const html=`<div class="modal-backdrop mk-nav-modal"><div class="modal-card"><div class="modal-head"><h2>Menüyü Düzenle</h2><button class="icon-btn" type="button" data-nav-close>×</button></div><div class="modal-body"><p class="muted">Sol menüde sıralamayı istediğin gibi belirle. Örneğin Takvim'i en üste taşıyabilirsin.</p><div class="mk-nav-sort-list">${order.map((k,i)=>{const x=items.find(a=>a.key===k);return `<div class="mk-nav-sort-row" data-nav-key="${uiEsc(k)}"><span class="mk-nav-sort-label">${uiEsc(x?.label||k)}</span><span class="mk-nav-sort-actions"><button class="btn tiny" type="button" data-nav-up="${uiEsc(k)}" ${i===0?'disabled':''}>↑</button><button class="btn tiny" type="button" data-nav-down="${uiEsc(k)}" ${i===order.length-1?'disabled':''}>↓</button></span></div>`;}).join('')}</div></div><div class="modal-actions"><button class="btn primary" type="button" data-nav-save>Kaydet</button></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend',html);
  const modal=document.querySelector('.mk-nav-modal');
  modal.querySelector('[data-nav-close]').onclick=()=>modal.remove();
  const rerender=()=>{const list=modal.querySelector('.mk-nav-sort-list');const rows=[...list.children];list.innerHTML=rows.map((r,i)=>{const k=r.dataset.navKey;return `<div class="mk-nav-sort-row" data-nav-key="${uiEsc(k)}"><span class="mk-nav-sort-label">${uiEsc(r.querySelector('.mk-nav-sort-label').textContent)}</span><span class="mk-nav-sort-actions"><button class="btn tiny" type="button" data-nav-up="${uiEsc(k)}" ${i===0?'disabled':''}>↑</button><button class="btn tiny" type="button" data-nav-down="${uiEsc(k)}" ${i===rows.length-1?'disabled':''}>↓</button></span></div>`;}).join('');bindSort();};
  const bindSort=()=>{
    modal.querySelectorAll('[data-nav-up]').forEach(b=>b.onclick=()=>{const row=b.closest('.mk-nav-sort-row');const prev=row.previousElementSibling;if(prev)row.parentNode.insertBefore(row,prev);rerender();});
    modal.querySelectorAll('[data-nav-down]').forEach(b=>b.onclick=()=>{const row=b.closest('.mk-nav-sort-row');const next=row.nextElementSibling;if(next)row.parentNode.insertBefore(next,row);rerender();});
  };
  bindSort();
  modal.querySelector('[data-nav-save]').onclick=()=>{const keys=[...modal.querySelectorAll('.mk-nav-sort-row')].map(r=>r.dataset.navKey);localStorage.setItem(navOrderKey(),JSON.stringify(keys));applyNavOrder();modal.remove();};
}

async function getCalendarRows(teacherId=''){
  return uiJson(`/api/calendar${teacherId?`?teacherId=${encodeURIComponent(teacherId)}`:''}`);
}

function selectedCalendarTeacher(){
  return document.querySelector('select[name="calendarTeacher"]')?.value||'';
}

function ensureCalendarTeacherOption(data){
  if(!data?.user||data.user.role!=='superadmin')return;
  const select=document.querySelector('select[name="calendarTeacher"]');
  if(!select||select.options.length)return;
  const opt=document.createElement('option');opt.value=data.user.id;opt.textContent=`${data.user.name} (Baş Admin)`;select.appendChild(opt);select.value=data.user.id;
}

function dayAndTeacher(){
  const day=document.querySelector('.day-panel');
  const date=day?.querySelector('.panel-head h2')?.textContent?.trim()||'';
  const teacherId=selectedCalendarTeacher()||'';
  return {day,date,teacherId};
}

function applyCalendarDom(rows){
  const {day,date,teacherId}=dayAndTeacher();
  if(!day||!date)return;
  const relevant=(rows||[]).filter(r=>r.date===date&&(!teacherId||r.teacherId===teacherId));
  const lessons=[...document.querySelectorAll('.hour-row')].map(row=>({row,hour:Number(row.querySelector('.hour')?.textContent?.slice(0,2)||-1)}));
  for(const item of lessons){
    const saved=relevant.find(r=>Number(r.hour)===item.hour);
    const status=item.row.querySelector('.status');
    const action=item.row.querySelector('[data-action="toggle-hour"]');
    if(!status)continue;
    status.classList.remove('open','closed','full');
    if(saved){
      status.classList.add(saved.status);status.textContent=saved.status==='closed'?'Kapalı':'Açık';
      if(action){action.dataset.status=saved.status==='closed'?'open':'closed';action.textContent=saved.status==='closed'?'Aç':'Kapat';action.className=`btn tiny ${saved.status==='closed'?'success':'danger-outline'}`;}
    }else{
      status.classList.add('open');status.textContent='Açık';
      if(action){action.dataset.status='closed';action.textContent='Kapat';action.className='btn tiny danger-outline';}
    }
  }
  const cell=document.querySelector(`.calendar-cell[data-date="${CSS.escape(date)}"]`);
  if(cell){const hours=[...document.querySelectorAll('.hour-row')];const open=hours.filter(r=>r.querySelector('.status.open')).length;const full=hours.filter(r=>r.querySelector('.status.full')).length;const closed=hours.filter(r=>r.querySelector('.status.closed')).length;const counts=cell.querySelector('.cell-counts');if(counts)counts.innerHTML=`<span class="green-dot">${open} açık</span><span class="orange-dot">${full} dolu</span><span class="red-dot">${closed} kapalı</span>`;}
}

async function fixCalendarToggle(e){
  const btn=e.target.closest('[data-action="toggle-hour"]');
  if(!btn||uiBusy)return;
  uiBusy=true;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  try{
    const data=await uiJson('/api/data');
    let teacherId=btn.dataset.teacher||selectedCalendarTeacher();
    if(!teacherId){teacherId=data.user?.role==='superadmin'?(data.teachers?.[0]?.id||data.user.id):data.user?.id;}
    const payload={type:'scheduleSet',teacherId,date:btn.dataset.date,hour:Number(btn.dataset.hour),status:btn.dataset.status};
    await uiJson('/api/calendar',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const cal=await getCalendarRows(teacherId);applyCalendarDom(cal.rows||[]);
    notify('Takvim saati güncellendi.');
  }catch(err){alert(err.message)}finally{uiBusy=false;}
}

function injectCalendarData(){
  if(!document.querySelector('.day-panel'))return;
  uiJson('/api/data').then(data=>{ensureCalendarTeacherOption(data);const tid=selectedCalendarTeacher()||((data.user?.role==='superadmin')?(data.teachers?.[0]?.id||data.user.id):data.user?.id||'');return getCalendarRows(tid);}).then(cal=>applyCalendarDom(cal.rows||[])).catch(()=>{});
}

function injectUiStyles(){
  if(document.getElementById('mk-ui-overrides-style'))return;
  const s=document.createElement('style');s.id='mk-ui-overrides-style';s.textContent=`.mk-nav-sort-list{display:grid;gap:8px;margin-top:14px}.mk-nav-sort-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 12px;border:1px solid #e3e9f1;border-radius:10px;background:#fafcfe}.mk-nav-sort-label{font-weight:750}.mk-nav-sort-actions{display:flex;gap:6px}.mk-panel-customizer{display:flex;align-items:center;gap:8px;margin-left:auto}.mk-panel-customizer label{font-size:11px;color:#728096;display:flex;gap:6px;align-items:center}.mk-panel-customizer select{border:1px solid #d7e0eb;border-radius:9px;padding:7px 9px;background:#fff}.mk-student-name{display:block;margin-left:8px;font-size:11px;font-weight:800;color:#315177}.mk-calendar-plan{white-space:nowrap}`;document.head.appendChild(s);
}

document.addEventListener('click',fixCalendarToggle,true);
document.addEventListener('click',e=>{if(e.target.closest('[data-action="logout"]')||e.target.closest('#logout'))localStorage.removeItem(pageKey);},true);
trackPageClicks();
injectUiStyles();
const uiObserver=new MutationObserver(()=>{document.body.dataset.uiUser=document.querySelector('.user-chip b')?.textContent?.trim()||'default';injectNavEditor();applyNavOrder();restorePage();injectCalendarData();});
uiObserver.observe(document.documentElement,{subtree:true,childList:true});
setTimeout(()=>{injectNavEditor();applyNavOrder();restorePage();injectCalendarData();},300);
setInterval(()=>{injectNavEditor();applyNavOrder();},1500);

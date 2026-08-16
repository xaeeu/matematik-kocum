const CF_TOKEN=()=>localStorage.getItem('mk_session')||'';
const CF_AUTH=()=>CF_TOKEN()?{authorization:`Bearer ${CF_TOKEN()}`}:{};
const CF_LAST_PAGE='mk_last_page';
let cfBusy=false;
let cfRestoreDone=false;

async function cfJson(path,options={}){
  const res=await fetch(path,{...options,headers:{...CF_AUTH(),...(options.headers||{})}});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||`İstek başarısız (${res.status})`);
  return data;
}

function cfTrackPage(){
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-page]');
    if(btn?.dataset.page) localStorage.setItem(CF_LAST_PAGE,btn.dataset.page);
    if(e.target.closest('.mk-video-nav')) localStorage.setItem(CF_LAST_PAGE,'videos');
    if(e.target.closest('.mk-groups-nav')) localStorage.setItem(CF_LAST_PAGE,'groups');
    if(e.target.closest('#logout')) localStorage.removeItem(CF_LAST_PAGE);
  },true);
}

function cfRestorePage(){
  if(cfRestoreDone)return;
  const saved=localStorage.getItem(CF_LAST_PAGE);
  if(!saved||saved==='dashboard')return;
  let btn=document.querySelector(`[data-page="${CSS.escape(saved)}"]`);
  if(!btn && saved==='videos')btn=document.querySelector('.mk-video-nav');
  if(!btn && saved==='groups')btn=document.querySelector('.mk-groups-nav');
  if(!btn)return;
  cfRestoreDone=true;
  setTimeout(()=>btn.click(),80);
}

function cfCalendarButton(btn,status){
  btn.dataset.status=status;
  btn.textContent=status==='closed'?'Aç':'Kapat';
  btn.className=`btn tiny ${status==='closed'?'success':'danger-outline'}`;
}

function cfApplyHour(button,status){
  const row=button.closest('.hour-row');
  const label=row?.querySelector('.status');
  if(!label)return;
  label.className=`status ${status}`;
  label.textContent=status==='closed'?'Kapalı':'Açık';
  cfCalendarButton(button,status);
}

async function cfToggleHour(e){
  const btn=e.target.closest('[data-action="toggle-hour"]');
  if(!btn||cfBusy)return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  cfBusy=true;
  const next=btn.dataset.status||'closed';
  try{
    await cfJson('/api/calendar',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'scheduleSet',teacherId:btn.dataset.teacher,date:btn.dataset.date,hour:Number(btn.dataset.hour),status:next})});
    cfApplyHour(btn,next);
    const day=document.querySelector(`.calendar-cell[data-date="${CSS.escape(btn.dataset.date)}"]`);
    if(day){
      const rows=[...document.querySelectorAll('.hour-row')];
      const open=rows.filter(r=>r.querySelector('.status.open')).length;
      const full=rows.filter(r=>r.querySelector('.status.full')).length;
      const closed=rows.filter(r=>r.querySelector('.status.closed')).length;
      const counts=day.querySelector('.cell-counts');
      if(counts)counts.innerHTML=`<span class="green-dot">${open} açık</span><span class="orange-dot">${full} dolu</span><span class="red-dot">${closed} kapalı</span>`;
    }
  }catch(err){alert(err.message);}
  finally{cfBusy=false;}
}

cfTrackPage();
document.addEventListener('click',cfToggleHour,true);
const cfObs=new MutationObserver(()=>{cfRestorePage();});
cfObs.observe(document.documentElement,{subtree:true,childList:true});
setTimeout(cfRestorePage,450);
setInterval(cfRestorePage,1200);

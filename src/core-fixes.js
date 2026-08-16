const CF_TOKEN=()=>localStorage.getItem('mk_session')||'';
const CF_AUTH=()=>CF_TOKEN()?{authorization:`Bearer ${CF_TOKEN()}`}:{ };
const CF_LAST_PAGE='mk_last_page';
let cfBusy=false;
let cfRestoreDone=false;

async function cfJson(path,options={}){
  const res=await fetch(path,{...options,headers:{...CF_AUTH(),...(options.headers||{})}});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||`İstek başarısız (${res.status})`);
  return data;
}
function cfToast(message,type='error'){
  if(typeof window.alert==='function')window.alert(message);
  else console[type==='error'?'error':'log'](message);
}
function cfTrackPage(){
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-page]');
    if(btn?.dataset.page)localStorage.setItem(CF_LAST_PAGE,btn.dataset.page);
    if(e.target.closest('.mk-video-nav'))localStorage.setItem(CF_LAST_PAGE,'videos');
    if(e.target.closest('.mk-groups-nav'))localStorage.setItem(CF_LAST_PAGE,'groups');
    if(e.target.closest('#logout'))localStorage.removeItem(CF_LAST_PAGE);
  },true);
}
function cfRestorePage(){
  if(cfRestoreDone)return;
  const saved=localStorage.getItem(CF_LAST_PAGE);
  if(!saved||saved==='dashboard')return;
  let btn=document.querySelector(`[data-page="${CSS.escape(saved)}"]`);
  if(!btn&&saved==='videos')btn=document.querySelector('.mk-video-nav');
  if(!btn&&saved==='groups')btn=document.querySelector('.mk-groups-nav');
  if(!btn)return;
  cfRestoreDone=true;
  setTimeout(()=>btn.click(),80);
}
function cfSetRow(btn,status){
  const row=btn.closest('.hour-row');if(!row)return;
  const label=row.querySelector('.status');
  if(label){label.className=`status ${status}`;label.textContent=status==='closed'?'Kapalı':'Açık';}
  btn.dataset.status=status==='closed'?'open':'closed';
  btn.textContent=status==='closed'?'Aç':'Kapat';
  btn.className=`btn tiny ${status==='closed'?'success':'danger-outline'}`;
}
function cfUpdateCount(date){
  const day=document.querySelector(`.calendar-cell[data-date="${CSS.escape(date)}"]`);if(!day)return;
  const rows=[...document.querySelectorAll('.hour-row')];
  const open=rows.filter(r=>r.querySelector('.status.open')).length;
  const full=rows.filter(r=>r.querySelector('.status.full')).length;
  const closed=rows.filter(r=>r.querySelector('.status.closed')).length;
  const counts=day.querySelector('.cell-counts');
  if(counts)counts.innerHTML=`<span class="green-dot">${open} açık</span><span class="orange-dot">${full} dolu</span><span class="red-dot">${closed} kapalı</span>`;
}
async function cfHandleCalendarButton(e){
  const btn=e.currentTarget;if(cfBusy)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const row=btn.closest('.hour-row');const label=row?.querySelector('.status');
  const current=label?.classList.contains('closed')?'closed':label?.classList.contains('open')?'open':null;
  if(!current)return;
  const desired=current==='closed'?'open':'closed';
  const date=btn.dataset.date;const hour=Number(btn.dataset.hour);const teacherId=btn.dataset.teacher||'';
  const previous=desired==='open'?'closed':'open';
  cfBusy=true;cfSetRow(btn,desired);cfUpdateCount(date);
  try{
    await cfJson('/api/calendar',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'scheduleSet',teacherId,date,hour,status:desired})});
    cfSetRow(btn,desired);cfUpdateCount(date);
    cfToast(desired==='open'?'Saat yeniden açıldı.':'Saat kapatıldı.','success');
  }catch(err){
    cfSetRow(btn,previous);cfUpdateCount(date);
    cfToast(err.message||'Takvim saati güncellenemedi.','error');
  }finally{cfBusy=false;}
}
function cfBindCalendarButtons(){
  document.querySelectorAll('[data-action="toggle-hour"]').forEach(btn=>{
    if(btn.dataset.cfBound==='1')return;
    btn.dataset.cfBound='1';
    btn.addEventListener('click',cfHandleCalendarButton,true);
  });
}
cfTrackPage();
const cfObs=new MutationObserver(()=>{cfBindCalendarButtons();cfRestorePage();});
cfObs.observe(document.documentElement,{subtree:true,childList:true});
setTimeout(()=>{cfBindCalendarButtons();cfRestorePage();},300);
setInterval(()=>{cfBindCalendarButtons();cfRestorePage();},800);

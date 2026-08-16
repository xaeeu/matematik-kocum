const vvToken=()=>localStorage.getItem('mk_session')||'';
const vvHeaders=()=>vvToken()?{authorization:`Bearer ${vvToken()}`}:{};
const vvFetch=(path,options={})=>fetch(path,{...options,headers:{...(options.headers||{}),...vvHeaders()}});

function vvEscape(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function vvUnique(values){return [...new Set((values||[]).map(v=>String(v||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr'));}

async function vvOptions(){
  try{const r=await vvFetch('/api/data');if(!r.ok)return {grades:[],groups:[]};const d=await r.json();return {grades:vvUnique((d.students||[]).map(s=>s.grade)),groups:vvUnique((d.students||[]).map(s=>s.groupName))};}
  catch{return {grades:[],groups:[]};}
}
function vvPanelHtml(opts){
  const grades=opts.grades.map(g=>`<label class="vv-check"><input type="checkbox" name="visibilityValue" value="${vvEscape(g)}"><span>${vvEscape(g)}</span></label>`).join('')||'<span class="muted">Henüz sınıf tanımlı değil.</span>';
  const groups=opts.groups.map(g=>`<label class="vv-check"><input type="checkbox" name="visibilityValue" value="${vvEscape(g)}"><span>${vvEscape(g)}</span></label>`).join('')||'<span class="muted">Henüz grup tanımlı değil.</span>';
  return `<div class="vv-box"><div class="field"><span>Video görünürlüğü</span><select name="visibilityMode"><option value="all">Tüm öğrenciler</option><option value="grade">Sınıflara göre</option><option value="group">Gruplara göre</option><option value="grade_group">Sınıf + grup</option></select></div><div class="vv-options" data-vv-options><div class="vv-section" data-vv-grade><b>Sınıflar</b><div class="vv-check-grid">${grades}</div></div><div class="vv-section" data-vv-group><b>Gruplar</b><div class="vv-check-grid">${groups}</div></div></div><p class="muted">Sınıf + grup seçeneğinde öğrenci her iki seçime de uymalıdır.</p></div>`;
}
function vvApplyMode(scope){
  const mode=scope.querySelector('[name="visibilityMode"]')?.value||'all';
  const grade=scope.querySelector('[data-vv-grade]');
  const group=scope.querySelector('[data-vv-group]');
  if(grade)grade.style.display=mode==='grade'||mode==='grade_group'?'block':'none';
  if(group)group.style.display=mode==='group'||mode==='grade_group'?'block':'none';
}
function vvInject(scope,opts){
  const form=scope.querySelector('#mk-youtube-form,#mk-upload-form');if(!form||form.querySelector('.vv-box'))return;
  const wrap=document.createElement('div');wrap.innerHTML=vvPanelHtml(opts);form.insertBefore(wrap.firstElementChild,form.querySelector('.form-actions'));
  const mode=form.querySelector('[name="visibilityMode"]');mode?.addEventListener('change',()=>vvApplyMode(scope));vvApplyMode(scope);
}
function vvRead(scope){
  const form=scope.querySelector('#mk-youtube-form,#mk-upload-form');const mode=form?.querySelector('[name="visibilityMode"]')?.value||'all';
  if(mode==='all')return {visibilityMode:'all',visibilityValues:[]};
  if(mode==='grade'||mode==='group')return {visibilityMode:mode,visibilityValues:[...form.querySelectorAll('[name="visibilityValue"]:checked')].map(x=>x.value)};
  const grades=[...form.querySelectorAll('[data-vv-grade] [name="visibilityValue"]:checked')].map(x=>x.value);
  const groups=[...form.querySelectorAll('[data-vv-group] [name="visibilityValue"]:checked')].map(x=>x.value);
  return {visibilityMode:'grade_group',visibilityValues:[...new Set(grades.flatMap(g=>groups.map(r=>`${g}::${r}`)))]};
}

async function vvSubmit(e){
  const form=e.target;if(!form.matches('#mk-youtube-form,#mk-upload-form'))return;
  e.preventDefault();e.stopImmediatePropagation();
  const scope=form.closest('.mk-ux-modal');const visibility=vvRead(scope);
  try{
    if(form.id==='mk-youtube-form'){
      const fd=new FormData(form);const url=String(fd.get('url')||'');
      const id=(()=>{try{const u=new URL(url);if(u.hostname==='youtu.be')return u.pathname.slice(1).split('/')[0]||'';if(u.searchParams.get('v'))return u.searchParams.get('v')||'';const m=u.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/);return m?m[1]:'';}catch{return '';}})();
      if(!id)throw new Error('Geçerli bir YouTube bağlantısı gir.');
      const r=await vvFetch('/api/videos',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:fd.get('title'),description:fd.get('description'),url,...visibility})});
      const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Video eklenemedi.');
    }else{
      const file=form.elements.file?.files?.[0];if(!file)throw new Error('Video dosyası seç.');
      if(file.size>100*1024*1024)throw new Error('Tek video için 100 MB sınırı var.');
      const fd=new FormData();fd.append('title',form.elements.title.value);fd.append('description',form.elements.description.value);fd.append('file',file);fd.append('visibilityMode',visibility.visibilityMode);visibility.visibilityValues.forEach(v=>fd.append('visibilityValue',v));
      const r=await vvFetch('/api/videos',{method:'POST',body:fd});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Video yüklenemedi.');
    }
    document.querySelector('.mk-ux-modal')?.remove();location.reload();
  }catch(err){alert(err.message)}
}

let vvLastModal=null;
const vvObserver=new MutationObserver(async()=>{
  const modal=document.querySelector('.mk-ux-modal');if(modal&&modal!==vvLastModal){vvLastModal=modal;const opts=await vvOptions();vvInject(modal,opts);}
});
vvObserver.observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('submit',vvSubmit,true);

const vvStyle=document.createElement('style');vvStyle.textContent=`.vv-box{grid-column:1/-1;border:1px solid #e2e8f0;border-radius:14px;padding:14px;background:#f8fafc}.vv-options{margin-top:12px}.vv-section{margin-top:10px}.vv-check-grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.vv-check{display:flex;align-items:center;gap:6px;border:1px solid #d9e2ed;background:#fff;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:700}.vv-check input{accent-color:#17345f}`;document.head.appendChild(vvStyle);

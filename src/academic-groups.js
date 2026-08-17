(() => {
  if (window.__mkAcademicGroupsV5) return;
  window.__mkAcademicGroupsV5 = true;

  const token = () => localStorage.getItem('mk_session') || '';
  const role = () => document.querySelector('.user-chip .badge')?.textContent?.trim() || '';
  const isTeacher = () => role() === 'Öğretmen' || role() === 'Baş Admin';
  const isSuper = () => role() === 'Baş Admin';
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const api = async (path, options = {}) => {
    const headers = {'content-type':'application/json'};
    const t = token();
    if (t) headers.authorization = `Bearer ${t}`;
    const r = await fetch(path, {...options, headers});
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `İşlem başarısız (${r.status})`);
    return d;
  };

  let ownerId = '';
  let timer = 0;
  let rendering = false;

  const toast = (message, type = 'error') => {
    const n = document.createElement('div');
    n.className = `toast ${type}`;
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3200);
  };

  const style = () => {
    if (document.getElementById('academic-ui-v5')) return;
    const s = document.createElement('style');
    s.id = 'academic-ui-v5';
    s.textContent = `
      #mk-academic-panel{margin:0 0 18px;padding:22px;border:1px solid #dfe7f1;border-radius:20px;background:#fff;box-shadow:0 10px 30px rgba(16,34,70,.055)}
      #mk-academic-panel .academic-top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
      #mk-academic-panel .academic-title{margin:0;color:#102246;font-size:20px;font-weight:800;line-height:1.25}
      #mk-academic-panel .academic-subtitle{margin:6px 0 0;color:#718097;font-size:13px;line-height:1.45}
      #mk-academic-panel .academic-buttons{display:flex;gap:8px;flex-shrink:0}
      #mk-academic-panel .academic-btn{height:44px;padding:0 17px;border:1px solid #d3ddec;border-radius:10px;background:#fff;color:#16345f;font:inherit;font-weight:800;cursor:pointer;white-space:nowrap}
      #mk-academic-panel .academic-btn.primary{background:#233967;border-color:#233967;color:#fff}
      #mk-academic-panel .academic-columns{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:20px}
      #mk-academic-panel .academic-column-title{margin:0 0 8px;color:#29466f;font-size:12px;font-weight:900;text-transform:uppercase}
      #mk-academic-panel .academic-list{min-height:72px;border:1px dashed #cfdbea;border-radius:15px;background:#fff;display:flex;align-items:center;justify-content:center;padding:10px;box-sizing:border-box}
      #mk-academic-panel .academic-list-items{width:100%;display:grid;gap:7px}
      #mk-academic-panel .academic-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 11px;border:1px solid #e2e8f0;border-radius:10px;background:#f9fbfd;color:#20385d;font-size:13px;font-weight:700}
      #mk-academic-panel .academic-count{font-size:11px;color:#7b899b;font-weight:600}
      #mk-academic-panel .academic-empty{color:#7c8aa0;font-size:13px;text-align:center}
      .academic-v5-modal{position:fixed;inset:0;z-index:100000;background:rgba(9,18,36,.45);display:grid;place-items:center;padding:18px}
      .academic-v5-card{width:min(560px,100%);max-height:85vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 30px 90px rgba(0,0,0,.25)}
      .academic-v5-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #e8edf3}
      .academic-v5-head h2{margin:0;color:#102246;font-size:19px}.academic-close{border:0;background:transparent;font-size:24px;cursor:pointer}
      .academic-v5-body{padding:20px}.academic-v5-body label{display:grid;gap:7px;color:#526177;font-size:12px;font-weight:800}.academic-v5-body input,.academic-v5-body select{box-sizing:border-box;width:100%;padding:11px 12px;border:1px solid #d6dfeb;border-radius:10px;font:inherit}
      .academic-v5-actions{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid #e8edf3}.academic-v5-actions button{border:1px solid #d3ddec;border-radius:10px;padding:10px 14px;background:#fff;color:#20385d;font-weight:800;cursor:pointer}.academic-v5-actions .primary{background:#233967;border-color:#233967;color:#fff}
      .academic-v5-list{display:grid;gap:8px;margin-top:14px}.academic-v5-row{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px}.academic-v5-row button{border:1px solid #edb9bf;background:#fff0f1;color:#a72c39;border-radius:8px;padding:7px 9px;font-weight:800;cursor:pointer}.academic-v5-row button:disabled{opacity:.45;cursor:not-allowed}
      @media(max-width:700px){#mk-academic-panel .academic-top{flex-direction:column}#mk-academic-panel .academic-buttons{width:100%}#mk-academic-panel .academic-btn{flex:1}#mk-academic-panel .academic-columns{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  };

  const studentsPage = () => document.querySelector('.topbar h1')?.textContent?.trim() === 'Öğrenciler';
  const getData = id => api(`/api/academic-groups${id ? `?ownerId=${encodeURIComponent(id)}` : ''}`);

  const refreshStudentForm = async () => {
    const root = document.querySelector('#student-register-modal');
    if (!root || !isTeacher()) return;
    const ownerField = root.querySelector('select[name="ownerId"]');
    const selectedOwner = (ownerField?.value || ownerId || '');
    try {
      const data = await getData(selectedOwner);
      [['grade','Sınıf seçin',true,data.classes||[]],['groupName','Grup seçin',false,data.groups||[]]].forEach(([name,placeholder,required,list]) => {
        const old = root.querySelector(`input[name="${name}"],select[name="${name}"]`);
        if (!old || (old.tagName === 'SELECT' && old.dataset.academicField === '1')) return;
        const value = old.value;
        const select = document.createElement('select');
        select.className = 'academic-select'; select.dataset.academicField = '1'; select.name = name; select.required = required;
        select.innerHTML = `<option value="">${placeholder}</option>${list.map(x=>`<option value="${esc(x.name)}" ${x.name===value?'selected':''}>${esc(x.name)}</option>`).join('')}`;
        old.replaceWith(select);
      });
    } catch (e) { toast(e.message); }
  };

  const openCreate = type => {
    const label = type === 'class' ? 'Sınıf' : 'Grup';
    const modal = document.createElement('div');
    modal.className = 'academic-v5-modal';
    modal.innerHTML = `<div class="academic-v5-card"><div class="academic-v5-head"><h2>${label} Ekle</h2><button class="academic-close" type="button">×</button></div><div class="academic-v5-body"><label>${label} adı<input data-name maxlength="80" autocomplete="off" placeholder="Örn. 8. Sınıf A"></label></div><div class="academic-v5-actions"><button data-cancel type="button">Vazgeç</button><button class="primary" data-save type="button">Kaydet</button></div></div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('.academic-close').onclick = close;
    modal.querySelector('[data-cancel]').onclick = close;
    const save = async () => {
      const name = modal.querySelector('[data-name]').value.trim();
      if (!name) return toast(`${label} adı gerekli.`);
      const body = {action:type === 'class' ? 'createClass' : 'createGroup',name};
      if (isSuper()) body.ownerId = ownerId;
      try { await api('/api/academic-groups',{method:'POST',body:JSON.stringify(body)}); close(); await render(); toast(`${label} oluşturuldu.`,'ok'); }
      catch(e){ toast(e.message); }
    };
    modal.querySelector('[data-save]').onclick = save;
    modal.querySelector('[data-name]').onkeydown = e => { if(e.key === 'Enter') save(); };
    modal.querySelector('[data-name]').focus();
  };

  const openManager = async () => {
    const initial = await getData(ownerId);
    const teachers = initial.teachers || [];
    if (isSuper() && !ownerId && teachers[0]) ownerId = teachers[0].id;
    const modal = document.createElement('div'); modal.className = 'academic-v5-modal';
    modal.innerHTML = `<div class="academic-v5-card"><div class="academic-v5-head"><h2>Sınıf & Grup Yönetimi</h2><button class="academic-close" type="button">×</button></div><div class="academic-v5-body">${isSuper()?`<label>Öğretmen<select data-owner>${teachers.map(t=>`<option value="${esc(t.id)}" ${t.id===ownerId?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label>`:''}<div data-manager></div></div></div>`;
    document.body.appendChild(modal); modal.querySelector('.academic-close').onclick=()=>modal.remove();
    const draw = async () => {
      const d = await getData(ownerId);
      const section = (type, list) => `<h3>${type==='class'?'Sınıflar':'Gruplar'}</h3><div class="academic-v5-list">${list.length?list.map(x=>`<div class="academic-v5-row"><span><b>${esc(x.name)}</b> · ${Number(x.studentCount||0)} öğrenci</span><button data-del="${type}" data-id="${esc(x.id)}" ${Number(x.studentCount||0)?'disabled':''}>Sil</button></div>`).join(''):'<div class="academic-empty">Henüz kayıt yok.</div>'}</div>`;
      modal.querySelector('[data-manager]').innerHTML=section('class',d.classes||[])+section('group',d.groups||[]);
    };
    modal.querySelector('[data-owner]')?.addEventListener('change',async e=>{ownerId=e.target.value;await draw();});
    modal.addEventListener('click',async e=>{const b=e.target.closest('[data-del]');if(!b||b.disabled)return;const body={action:b.dataset.del==='class'?'deleteClass':'deleteGroup',id:b.dataset.id};if(isSuper())body.ownerId=ownerId;try{await api('/api/academic-groups',{method:'POST',body:JSON.stringify(body)});await draw();await render();toast('Kayıt silindi.','ok');}catch(err){toast(err.message);}});
    await draw();
  };

  async function render() {
    if (rendering || !isTeacher() || !studentsPage()) return;
    const content = document.querySelector('.content'); if (!content) return;
    style(); rendering = true;
    try {
      document.querySelectorAll('.academic-manage-panel').forEach((node,i)=>{if(i || node.id!=='mk-academic-panel') node.remove();});
      let panel = document.getElementById('mk-academic-panel');
      if (panel && panel.parentElement !== content) { panel.remove(); panel = null; }
      if (!panel) { panel=document.createElement('section'); panel.id='mk-academic-panel'; panel.className='academic-manage-panel'; content.prepend(panel); }
      const root=await getData(); const teachers=root.teachers||[];
      if(isSuper()&&!ownerId&&teachers[0]) ownerId=teachers[0].id;
      const data=isSuper()?await getData(ownerId):root; const classes=data.classes||[]; const groups=data.groups||[];
      const list=(items,empty)=>items.length?`<div class="academic-list-items">${items.map(x=>`<div class="academic-item"><span>${esc(x.name)}</span><span class="academic-count">${Number(x.studentCount||0)} öğrenci</span></div>`).join('')}</div>`:`<div class="academic-empty">${empty}</div>`;
      panel.innerHTML=`<div class="academic-top"><div><h2 class="academic-title">Sınıf &amp; Grup</h2><p class="academic-subtitle">Öğrenci kayıtlarında kullanılacak sınıf ve grupları buradan yönetin.</p></div><div class="academic-buttons"><button class="academic-btn" data-create="class" type="button">+ Sınıf Ekle</button><button class="academic-btn primary" data-create="group" type="button">+ Grup Ekle</button></div></div><div class="academic-columns"><div><h3 class="academic-column-title">Sınıflar</h3><div class="academic-list">${list(classes,'Henüz sınıf eklenmedi.')}</div></div><div><h3 class="academic-column-title">Gruplar</h3><div class="academic-list">${list(groups,'Henüz grup eklenmedi.')}</div></div></div>`;
      panel.querySelector('[data-create="class"]').onclick=()=>openCreate('class');
      panel.querySelector('[data-create="group"]').onclick=()=>openCreate('group');
      panel.querySelector('.academic-list').parentElement.parentElement.parentElement.addEventListener('dblclick',openManager);
      await refreshStudentForm();
    } catch(e){toast(e.message);} finally{rendering=false;}
  }

  const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>render().catch(()=>{}),180);};
  new MutationObserver(mutations=>{if(rendering)return;if(mutations.some(m=>[...m.addedNodes,...m.removedNodes].some(n=>n.nodeType===1&&!n.closest?.('#mk-academic-panel'))))schedule();}).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest('[data-action="new-student"]'))setTimeout(refreshStudentForm,120);},true);
  setTimeout(schedule,400);
})();
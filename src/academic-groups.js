(()=>{
  if(window.__mkAcademicGroupsV3)return;
  window.__mkAcademicGroupsV3=true;

  const token=()=>localStorage.getItem('mk_session')||'';
  const role=()=>document.querySelector('.user-chip .badge')?.textContent?.trim()||'';
  const isTeacher=()=>['Öğretmen','Baş Admin'].includes(role());
  const isSuper=()=>role()==='Baş Admin';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  const api=async(path,options={})=>{
    const r=await fetch(path,{...options,headers:{'content-type':'application/json',...(token()?{authorization:`Bearer ${token()}`}:{})}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||`İşlem başarısız (${r.status})`);
    return d;
  };

  let ownerId='';
  let renderTimer=0;

  const toast=(message,type='error')=>{
    const n=document.createElement('div');
    n.className=`toast ${type}`;
    n.textContent=message;
    document.body.appendChild(n);
    setTimeout(()=>n.remove(),3200);
  };

  const style=()=>{
    if(document.getElementById('academic-ui-v3'))return;
    const s=document.createElement('style');
    s.id='academic-ui-v3';
    s.textContent=`
      .academic-manage-panel{margin:0 0 16px;padding:20px;border:1px solid #dfe7f1;border-radius:18px;background:#fff;box-shadow:0 8px 28px rgba(18,42,73,.05)}
      .academic-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
      .academic-head h3{margin:0;font-size:18px}
      .academic-head p{margin:5px 0 0;color:#718097;font-size:13px}
      .academic-head-actions{min-width:190px}
      .academic-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
      .academic-summary{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}
      .academic-summary-card{border:1px solid #e4eaf2;border-radius:14px;padding:14px;background:#f9fbfd}
      .academic-summary-card b{display:block}
      .academic-summary-card small{display:block;margin-top:5px;color:#718097;line-height:1.5}
      .academic-modal .modal-card{width:min(760px,94vw)}
      .academic-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
      .academic-box{border:1px solid #e2e8f0;border-radius:14px;padding:14px;background:#fbfcfe}
      .academic-box h3{margin:0 0 10px;font-size:15px}
      .academic-create{display:grid;grid-template-columns:1fr auto;gap:8px;margin-bottom:12px}
      .academic-create input{width:100%;box-sizing:border-box;border:1px solid #d6dfeb;border-radius:10px;padding:10px 12px;font:inherit}
      .academic-list{display:grid;gap:8px;max-height:340px;overflow:auto}
      .academic-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border:1px solid #e2e8f0;border-radius:11px;background:#fff}
      .academic-item small{display:block;color:#7b899b;margin-top:3px}
      .academic-empty{padding:14px;border:1px dashed #d7e0ea;border-radius:11px;color:#7b899b;text-align:center;font-size:13px}
      .academic-select{width:100%;box-sizing:border-box;border:1px solid #d6dfeb;border-radius:10px;background:#fff;padding:10px 12px;font:inherit;color:#1e395c}
      @media(max-width:700px){.academic-head,.academic-head-actions{width:100%}.academic-head{flex-direction:column}.academic-summary,.academic-modal-grid{grid-template-columns:1fr}.academic-create{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  };

  const getData=async(id='')=>api(`/api/academic-groups${id?`?ownerId=${encodeURIComponent(id)}`:''}`);
  const studentPage=()=>document.querySelector('.topbar h1')?.textContent?.trim()==='Öğrenciler';
  const ownerSelect=teachers=>isSuper()?`<select class="academic-select" data-academic-owner aria-label="Öğretmen seç"><option value="">Öğretmen seçin</option>${teachers.map(t=>`<option value="${esc(t.id)}" ${t.id===ownerId?'selected':''}>${esc(t.name)}</option>`).join('')}</select>`:'';

  async function refreshStudentForm(){
    const root=document.querySelector('#student-register-modal');
    if(!root||!isTeacher())return;
    const selected=root.querySelector('select[name="ownerId"]')?.value||ownerId||'';
    try{
      const d=await getData(selected);
      const specs=[['grade','Sınıf seçin',true,d.classes||[]],['groupName','Grup seçin',false,d.groups||[]]];
      for(const [field,placeholder,required,list] of specs){
        const old=root.querySelector(`input[name="${field}"], select[name="${field}"]`);
        if(!old)continue;
        if(old.tagName==='SELECT'&&old.classList.contains('academic-select'))continue;
        const value=old.value;
        const select=document.createElement('select');
        select.className='academic-select';
        select.name=field;
        select.required=required;
        select.innerHTML=`<option value="">${placeholder}</option>${list.map(x=>`<option value="${esc(x.name)}" ${x.name===value?'selected':''}>${esc(x.name)}</option>`).join('')}`;
        old.replaceWith(select);
      }
    }catch(err){toast(err.message)}
  }

  async function renderPanel(){
    if(!isTeacher()||!studentPage())return;
    style();
    const content=document.querySelector('.content');
    if(!content)return;
    let anchor=content.querySelector('[data-student-academic-anchor]');
    if(!anchor){
      anchor=document.createElement('section');
      anchor.className='academic-manage-panel';
      anchor.dataset.studentAcademicAnchor='';
      const first=content.querySelector('.panel');
      if(first)first.before(anchor);else content.prepend(anchor);
    }
    try{
      const root=await getData();
      const teachers=root.teachers||[];
      if(isSuper()&&!ownerId&&teachers[0])ownerId=teachers[0].id;
      const data=isSuper()?await getData(ownerId):root;
      anchor.innerHTML=`<div class="academic-head"><div><h3>Sınıf & Grup Yönetimi</h3><p>Öğrenci kayıtlarında kullanılacak sınıf ve grupları öğretmene göre yönetin.</p></div><div class="academic-head-actions">${ownerSelect(teachers)}</div></div><div class="academic-actions"><button class="btn primary" data-academic-open="class">+ Sınıf Ekle</button><button class="btn ghost" data-academic-open="group">+ Grup Ekle</button><button class="btn ghost" data-academic-open="manage">Yönet</button></div><div class="academic-summary"><div class="academic-summary-card"><b>Sınıflar · ${(data.classes||[]).length}</b><small>${(data.classes||[]).map(x=>esc(x.name)).join(' · ')||'Henüz sınıf oluşturulmadı.'}</small></div><div class="academic-summary-card"><b>Gruplar · ${(data.groups||[]).length}</b><small>${(data.groups||[]).map(x=>esc(x.name)).join(' · ')||'Henüz grup oluşturulmadı.'}</small></div></div>`;
      anchor.querySelector('[data-academic-owner]')?.addEventListener('change',async e=>{ownerId=e.target.value;await renderPanel();await refreshStudentForm()});
      anchor.querySelectorAll('[data-academic-open]').forEach(button=>button.addEventListener('click',()=>button.dataset.academicOpen==='manage'?openManager():openCreate(button.dataset.academicOpen)));
      await refreshStudentForm();
    }catch(err){toast(err.message)}
  }

  async function openCreate(type){
    const label=type==='class'?'Sınıf':'Grup';
    const modal=document.createElement('div');
    modal.className='modal-backdrop academic-modal';
    modal.innerHTML=`<div class="modal-card"><div class="modal-head"><h2>${label} Ekle</h2><button class="icon-btn" data-close>×</button></div><div class="modal-body"><label class="field"><span>${label} adı</span><input data-name maxlength="80" autocomplete="off" placeholder="Örn. 8. Sınıf A"></label></div><div class="modal-actions"><button class="btn ghost" data-close>Vazgeç</button><button class="btn primary" data-save>Kaydet</button></div></div>`;
    document.body.appendChild(modal);
    const close=()=>modal.remove();
    modal.querySelectorAll('[data-close]').forEach(button=>button.onclick=close);
    const save=async()=>{
      const name=modal.querySelector('[data-name]').value.trim();
      if(!name){toast(`${label} adı gerekli.`);return}
      const body={action:type==='class'?'createClass':'createGroup',name};
      if(isSuper())body.ownerId=ownerId;
      try{
        await api('/api/academic-groups',{method:'POST',body:JSON.stringify(body)});
        close();
        await renderPanel();
        toast(`${label} oluşturuldu.`,'ok');
      }catch(err){toast(err.message)}
    };
    modal.querySelector('[data-save]').onclick=save;
    modal.querySelector('[data-name]').addEventListener('keydown',e=>{if(e.key==='Enter')save()});
    setTimeout(()=>modal.querySelector('[data-name]')?.focus(),0);
  }

  async function openManager(){
    const initial=await getData(ownerId);
    const teachers=initial.teachers||[];
    if(isSuper()&&!ownerId&&teachers[0])ownerId=teachers[0].id;
    const modal=document.createElement('div');
    modal.className='modal-backdrop academic-modal';
    modal.innerHTML=`<div class="modal-card"><div class="modal-head"><div><h2>Sınıf ve Grup Yönetimi</h2><p class="muted">Kullanılan kayıtlar silinemez.</p></div><button class="icon-btn" data-close>×</button></div><div class="modal-body">${isSuper()?`<label class="field"><span>Öğretmen</span>${ownerSelect(teachers)}</label>`:''}<div class="academic-modal-grid"><div class="academic-box"><h3>Sınıflar</h3><div class="academic-create"><input data-name="class" maxlength="80" placeholder="Yeni sınıf"><button class="btn primary" data-add="class">Ekle</button></div><div class="academic-list" data-list="class"></div></div><div class="academic-box"><h3>Gruplar</h3><div class="academic-create"><input data-name="group" maxlength="80" placeholder="Yeni grup"><button class="btn primary" data-add="group">Ekle</button></div><div class="academic-list" data-list="group"></div></div></div></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('[data-close]').onclick=()=>modal.remove();
    const render=async()=>{
      const data=await getData(ownerId);
      for(const type of ['class','group']){
        const list=type==='class'?data.classes||[]:data.groups||[];
        const target=modal.querySelector(`[data-list="${type}"]`);
        target.innerHTML=list.length?list.map(item=>`<div class="academic-item"><div><b>${esc(item.name)}</b><small>${Number(item.studentCount||0)} öğrenci</small></div><button class="table-btn danger" data-del="${type}" data-id="${esc(item.id)}" ${Number(item.studentCount||0)?'disabled':''}>Sil</button></div>`).join(''):'<div class="academic-empty">Henüz kayıt yok.</div>';
      }
    };
    modal.querySelector('[data-academic-owner]')?.addEventListener('change',async e=>{ownerId=e.target.value;await render()});
    modal.querySelectorAll('[data-add]').forEach(button=>button.onclick=async()=>{
      const type=button.dataset.add;
      const name=modal.querySelector(`[data-name="${type}"]`).value.trim();
      if(!name){toast(`${type==='class'?'Sınıf':'Grup'} adı gerekli.`);return}
      const body={action:type==='class'?'createClass':'createGroup',name};
      if(isSuper())body.ownerId=ownerId;
      try{
        await api('/api/academic-groups',{method:'POST',body:JSON.stringify(body)});
        modal.querySelector(`[data-name="${type}"]`).value='';
        await render();
        await renderPanel();
        toast('Kayıt oluşturuldu.','ok');
      }catch(err){toast(err.message)}
    });
    modal.addEventListener('click',async e=>{
      const button=e.target.closest('[data-del]');
      if(!button||button.disabled)return;
      const body={action:button.dataset.del==='class'?'deleteClass':'deleteGroup',id:button.dataset.id};
      if(isSuper())body.ownerId=ownerId;
      try{
        await api('/api/academic-groups',{method:'POST',body:JSON.stringify(body)});
        await render();
        await renderPanel();
        toast('Kayıt silindi.','ok');
      }catch(err){toast(err.message)}
    });
    await render();
  }

  const schedule=()=>{
    clearTimeout(renderTimer);
    renderTimer=setTimeout(()=>{
      if(studentPage()&&!document.querySelector('[data-student-academic-anchor]'))renderPanel().catch(()=>{});
    },100);
  };

  new MutationObserver(mutations=>{
    if(mutations.some(m=>m.addedNodes.length||m.removedNodes.length))schedule();
  }).observe(document.body,{childList:true,subtree:true});

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-action="new-student"]'))setTimeout(refreshStudentForm,120);
  },true);

  setTimeout(()=>renderPanel().catch(()=>{}),150);
})();

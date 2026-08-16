(() => {
  const session = () => localStorage.getItem('mk_session') || '';
  const user = () => {
    try { return JSON.parse(localStorage.getItem('mk_user') || 'null'); } catch { return null; }
  };
  const role = () => user()?.role || '';
  const isAdmin = () => role() === 'admin';
  const isSuper = () => role() === 'superadmin';
  const qs = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const api = async (path, options={}) => {
    const headers = {'content-type':'application/json', ...(options.headers||{})};
    if (session()) headers.authorization = `Bearer ${session()}`;
    const res = await fetch(path, {...options, headers});
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `İşlem başarısız (${res.status})`);
    return data;
  };

  function injectStyle(){
    if(qs('#role-management-style')) return;
    const s=document.createElement('style'); s.id='role-management-style';
    s.textContent=`
      .rm-grid{display:grid;gap:14px}.rm-card{background:#fff;border:1px solid #e7ebf2;border-radius:16px;padding:18px;box-shadow:0 8px 28px rgba(16,34,70,.05)}
      .rm-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.rm-card h3{margin:0}.rm-muted{color:#6d788b;font-size:13px;margin:5px 0 0}
      .rm-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px 0;border-top:1px solid #edf0f5}.rm-row:first-child{border-top:0}
      .rm-main{min-width:0}.rm-name{font-weight:800}.rm-sub{display:block;color:#7a8495;font-size:13px;margin-top:3px}.rm-children{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}
      .rm-student{background:#f5f7fb;border:1px solid #e3e8f1;border-radius:9px;padding:6px 9px;font-size:12px}.rm-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
      .rm-btn{border:1px solid #d9e0ea;background:#fff;border-radius:9px;padding:8px 11px;font-weight:700;cursor:pointer}.rm-btn.primary{background:#173b76;color:#fff;border-color:#173b76}.rm-btn.danger{color:#a72c39;border-color:#efc7cb;background:#fff6f6}.rm-btn.success{color:#17653a;border-color:#bde0c8;background:#f1fbf4}
      .rm-badge{display:inline-flex;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:800}.rm-badge.active{background:#e9f7ee;color:#17653a}.rm-badge.inactive{background:#fff0f1;color:#a72c39}
      .rm-empty{text-align:center;padding:40px 15px;color:#7a8495}.rm-modal{position:fixed;inset:0;background:rgba(8,18,38,.48);display:grid;place-items:center;padding:20px;z-index:999999}.rm-modal-card{width:min(520px,100%);background:#fff;border-radius:18px;padding:22px;box-shadow:0 26px 90px rgba(0,0,0,.24)}
      .rm-form{display:grid;gap:12px}.rm-form label{display:grid;gap:6px;font-size:12px;font-weight:800;color:#4f5e74}.rm-form input{border:1px solid #d9e0ea;border-radius:10px;padding:10px 11px;font:inherit}.rm-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.rm-modal-actions button{border:1px solid #d9e0ea;background:#fff;border-radius:9px;padding:9px 13px;font-weight:700;cursor:pointer}.rm-modal-actions .primary{background:#173b76;color:#fff;border-color:#173b76}
    `; document.head.appendChild(s);
  }

  function toast(text, bad=false){ const x=document.createElement('div'); x.textContent=text; x.style.cssText=`position:fixed;right:18px;bottom:18px;z-index:1000000;background:${bad?'#a72c39':'#173b76'};color:#fff;padding:12px 15px;border-radius:12px;box-shadow:0 14px 35px rgba(0,0,0,.2);font-weight:800`; document.body.appendChild(x); setTimeout(()=>x.remove(),3200); }
  function modal(title,body,buttons){
    qs('.rm-modal')?.remove(); const w=document.createElement('div'); w.className='rm-modal';
    w.innerHTML=`<div class="rm-modal-card"><h2 style="margin:0 0 14px">${esc(title)}</h2><div>${body}</div><div class="rm-modal-actions">${buttons}</div></div>`; document.body.appendChild(w);
    w.addEventListener('click',e=>{if(e.target===w)w.remove()}); return w;
  }

  async function data(){ return api('/api/data'); }
  function setTitle(title){ const h=document.querySelector('.topbar h1'); if(h)h.textContent=title; }
  function activateNav(id){ document.querySelectorAll('.nav-item[data-page]').forEach(b=>b.classList.toggle('active', b.dataset.page===id)); }

  function addTeacherNav(){
    if(!isAdmin()) return;
    const wrap=qs('.nav-scroll'); if(!wrap || wrap.querySelector('[data-rm-page="parents"]')) return;
    const b=document.createElement('button'); b.className='nav-item'; b.dataset.rmPage='parents'; b.innerHTML='<span>♧</span><span>Veliler</span>';
    b.onclick=e=>{e.preventDefault(); openParents();}; wrap.appendChild(b);
    wrap.querySelectorAll('[data-page="users"]').forEach(x=>x.remove());
  }

  function hideUsersForTeacher(){ if(isAdmin()) document.querySelectorAll('.nav-item[data-page="users"]').forEach(x=>x.remove()); }

  async function openParents(){
    injectStyle(); activateNav('__parents__'); setTitle('Veliler');
    const main=qs('.content'); if(!main)return;
    main.innerHTML='<div class="rm-grid"><div class="rm-card"><h3>Veliler</h3><p class="rm-muted">Öğrencilerinizin bağlı olduğu veli hesapları.</p></div><div class="rm-card" id="rm-parent-list">Yükleniyor…</div></div>';
    try{
      const d=await data(); const parents=d.parents||[], students=d.students||[]; const box=qs('#rm-parent-list');
      if(!parents.length){box.innerHTML='<div class="rm-empty">Henüz veli hesabı bulunmuyor.</div>'; return;}
      box.innerHTML=parents.map(p=>{const kids=students.filter(s=>s.parentUserId===p.id);return `<div class="rm-row"><div class="rm-main"><div class="rm-name">${esc(p.name)} <span class="rm-badge ${p.status==='active'?'active':'inactive'}">${p.status==='active'?'Aktif':'Pasif'}</span></div><span class="rm-sub">${esc(p.username)}</span><div class="rm-children">${kids.map(k=>`<span class="rm-student">${esc(k.name)} · ${esc(k.grade)}</span>`).join('')||'<span class="rm-student">Bağlı öğrenci yok</span>'}</div></div><div class="rm-actions"><button class="rm-btn ${p.status==='active'?'danger':'success'}" data-rm-parent-status="${p.id}" data-rm-label="${esc(p.name)}" data-rm-status="${p.status}">${p.status==='active'?'Pasife Al':'Aktifleştir'}</button></div></div>`;}).join('');
      box.querySelectorAll('[data-rm-parent-status]').forEach(btn=>btn.onclick=async()=>{
        const id=btn.dataset.rmParentStatus, next=btn.dataset.rmStatus==='active'?'inactive':'active';
        const kids=students.filter(s=>s.parentUserId===id).map(s=>s.name).join(', ');
        const text=next==='inactive'?`<p><b>${esc(btn.dataset.rmLabel)}</b> hesabını pasife almak istiyor musun?</p><p class="rm-muted">Bağlı öğrenci hesapları da pasife alınacak${kids?`: ${esc(kids)}`:''}.</p>`:`<p><b>${esc(btn.dataset.rmLabel)}</b> hesabını tekrar aktifleştirmek istiyor musun?</p>`;
        const m=modal(next==='inactive'?'Hesabı pasife al':'Hesabı aktifleştir',text,'<button data-cancel>Vazgeç</button><button class="primary" data-ok>Onayla</button>');
        m.querySelector('[data-cancel]').onclick=()=>m.remove(); m.querySelector('[data-ok]').onclick=async()=>{try{await api('/api/account-status',{method:'POST',body:JSON.stringify({id,status:next})});m.remove();toast(next==='inactive'?'Veli ve bağlı hesaplar pasife alındı.':'Veli tekrar aktifleştirildi.');openParents();}catch(e){toast(e.message,true);}};
      });
    }catch(e){main.innerHTML=`<div class="rm-card"><div class="rm-empty">${esc(e.message)}</div></div>`;}
  }

  async function openAdminUsers(){
    if(!isSuper()) return; injectStyle(); activateNav('users'); setTitle('Kullanıcılar'); const main=qs('.content'); if(!main)return;
    main.innerHTML='<div class="rm-grid"><div class="rm-card"><div class="rm-card-head"><div><h3>Öğretmen Yönetimi</h3><p class="rm-muted">Öğretmen hesaplarını buradan yönetin.</p></div><button class="rm-btn primary" data-rm-add>+ Öğretmen</button></div></div><div class="rm-card" id="rm-teacher-list">Yükleniyor…</div></div>';
    async function render(){ const d=await data(); const teachers=d.teachers||[]; const box=qs('#rm-teacher-list'); if(!box)return; box.innerHTML=teachers.length?teachers.map(t=>`<div class="rm-row"><div class="rm-main"><div class="rm-name">${esc(t.name)}</div><span class="rm-sub">${esc(t.username)}</span></div><div class="rm-actions"><span class="rm-badge ${t.status==='active'?'active':'inactive'}">${t.status==='active'?'Aktif':'Pasif'}</span><button class="rm-btn ${t.status==='active'?'danger':'success'}" data-rm-status="${t.id}" data-rm-value="${t.status}">${t.status==='active'?'Pasife Al':'Aktifleştir'}</button><button class="rm-btn danger" data-rm-delete="${t.id}" data-rm-label="${esc(t.name)}">Sil</button></div></div>`).join(''):'<div class="rm-empty">Henüz öğretmen hesabı yok.</div>';
      box.querySelectorAll('[data-rm-status]').forEach(btn=>btn.onclick=async()=>{const id=btn.dataset.rmStatus,next=btn.dataset.rmValue==='active'?'inactive':'active',label=btn.parentElement.parentElement.querySelector('.rm-name')?.textContent||'Öğretmen';const m=modal(next==='inactive'?'Öğretmeni pasife al':'Öğretmeni aktifleştir',next==='inactive'?`<p><b>${esc(label)}</b> hesabı pasife alınacak.</p><p class="rm-muted">Bu öğretmene bağlı tüm öğrenci ve veli hesapları da otomatik olarak pasife alınır.</p>`:`<p><b>${esc(label)}</b> hesabı tekrar aktifleştirilecek.</p><p class="rm-muted">Bağlı öğrenci ve veli hesapları da tekrar aktif olur.</p>`,'<button data-cancel>Vazgeç</button><button class="primary" data-ok>Onayla</button>');m.querySelector('[data-cancel]').onclick=()=>m.remove();m.querySelector('[data-ok]').onclick=async()=>{try{await api('/api/account-status',{method:'POST',body:JSON.stringify({id,status:next})});m.remove();toast('Durum güncellendi.');render();}catch(e){toast(e.message,true);}};});
      box.querySelectorAll('[data-rm-delete]').forEach(btn=>btn.onclick=async()=>{const m=modal('Öğretmeni sil',`<p><b>${esc(btn.dataset.rmLabel)}</b> hesabını silmek istediğine emin misin?</p><p class="rm-muted">Bu işlem geri alınamaz.</p>`,'<button data-cancel>Vazgeç</button><button class="primary" data-ok>Sil</button>');m.querySelector('[data-cancel]').onclick=()=>m.remove();m.querySelector('[data-ok]').onclick=async()=>{try{await api('/api/data',{method:'POST',body:JSON.stringify({type:'userDelete',id:btn.dataset.rmDelete})});m.remove();toast('Öğretmen silindi.');render();}catch(e){toast(e.message,true);}};});
    }
    qs('[data-rm-add]').onclick=()=>{
      const m=modal('Öğretmen ekle',`<form class="rm-form" id="rm-teacher-form"><label>Ad Soyad<input name="name" required></label><label>Kullanıcı adı<input name="username" required></label><label>Şifre<input name="password" type="password" required></label></form>`,'<button data-cancel>Vazgeç</button><button class="primary" data-ok>Öğretmeni ekle</button>');m.querySelector('[data-cancel]').onclick=()=>m.remove();m.querySelector('[data-ok]').onclick=async()=>{const f=m.querySelector('#rm-teacher-form');if(!f.reportValidity())return;const fd=new FormData(f);try{await api('/api/data',{method:'POST',body:JSON.stringify({type:'userCreate',role:'admin',name:fd.get('name'),username:fd.get('username'),password:fd.get('password')})});m.remove();toast('Öğretmen eklendi.');render();}catch(e){toast(e.message,true);}};
    render().catch(e=>{const b=qs('#rm-teacher-list');if(b)b.innerHTML=`<div class="rm-empty">${esc(e.message)}</div>`;});
  }

  function intercept(){
    document.addEventListener('click',e=>{
      const b=e.target.closest('[data-page="users"]');
      if(b && isSuper()){ e.preventDefault(); e.stopImmediatePropagation(); openAdminUsers(); return; }
      if(b && isAdmin()){ e.preventDefault(); e.stopImmediatePropagation(); openParents(); return; }
    },true);
  }

  function tidy(){
    if(isAdmin()){
      document.querySelectorAll('.nav-item[data-page="users"]').forEach(x=>x.remove());
      addTeacherNav();
    }
    if(isSuper()){
      // Keep the main Users entry. The custom page replaces its contents.
      document.querySelectorAll('[data-page="users"]').forEach(x=>x.style.display='');
    }
  }
  injectStyle(); intercept(); tidy(); setInterval(tidy,1000);
})();

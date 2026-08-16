(() => {
  const getUser = () => { try { return JSON.parse(localStorage.getItem('mk_user') || 'null'); } catch { return null; } };
  const isAdmin = () => getUser()?.role === 'admin';
  const isSuper = () => getUser()?.role === 'superadmin';
  const token = () => localStorage.getItem('mk_session') || '';
  const headers = () => token() ? { authorization: `Bearer ${token()}`, 'content-type': 'application/json' } : { 'content-type': 'application/json' };
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const api = async (path, options={}) => { const res = await fetch(path, { ...options, headers: { ...headers(), ...(options.headers || {}) } }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.error || 'İşlem başarısız.'); return data; };

  let initializedRole = '';
  let busy = false;

  const panel = (title, body, actions='') => {
    document.querySelector('#role-user-panel')?.remove();
    const el = document.createElement('div');
    el.id = 'role-user-panel';
    el.innerHTML = `<div class="rui-backdrop"></div><div class="rui-box"><div class="rui-head"><h2>${esc(title)}</h2><button class="rui-x" data-rui-close>×</button></div><div class="rui-body">${body}</div>${actions ? `<div class="rui-actions">${actions}</div>` : ''}</div>`;
    document.body.appendChild(el);
    el.querySelector('[data-rui-close]')?.addEventListener('click', () => el.remove());
    el.querySelector('.rui-backdrop')?.addEventListener('click', () => el.remove());
    return el;
  };

  const toast = (msg, error=false) => {
    const el = document.createElement('div'); el.className = `rui-toast ${error ? 'error' : ''}`; el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 2800);
  };

  const addStyles = () => {
    if (document.getElementById('rui-styles')) return;
    const s = document.createElement('style'); s.id = 'rui-styles'; s.textContent = `
      .rui-backdrop{position:fixed;inset:0;background:rgba(16,34,70,.34);backdrop-filter:blur(2px);z-index:99998}
      .rui-box{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:99999;width:min(520px,calc(100% - 32px));background:#fff;border:1px solid #dfe7f1;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.18);overflow:hidden}
      .rui-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #e8edf3}.rui-head h2{margin:0;font-size:19px}.rui-x{border:0;background:transparent;font-size:26px;cursor:pointer;color:#68778b}.rui-body{padding:20px}.rui-actions{padding:14px 20px;border-top:1px solid #e8edf3;display:flex;justify-content:flex-end;gap:8px}.rui-btn{border:1px solid #d7e0eb;background:#fff;border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer}.rui-btn.primary{background:#213a6d;color:#fff;border-color:#213a6d}.rui-btn.danger{background:#ba3b48;color:#fff;border-color:#ba3b48}.rui-input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #d7e0eb;border-radius:10px;margin-top:6px}.rui-field{display:block;margin-bottom:14px}.rui-field span{font-size:13px;font-weight:700;color:#42536b}.rui-table-wrap{overflow:auto}.rui-table{width:100%;border-collapse:collapse}.rui-table th,.rui-table td{padding:11px 10px;border-bottom:1px solid #e8edf3;text-align:left;font-size:14px}.rui-table th{color:#637289;font-size:12px}.rui-status.active{color:#17653a;background:#edf8f0}.rui-status.inactive{color:#9b2833;background:#fff0f1}.rui-status{display:inline-block;padding:4px 8px;border-radius:999px;font-weight:700;font-size:12px}.rui-actions-inline{display:flex;gap:6px;flex-wrap:wrap}.rui-toast{position:fixed;right:18px;bottom:18px;z-index:100000;background:#213a6d;color:#fff;padding:11px 14px;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.16);font-weight:700}.rui-toast.error{background:#b52d3a}
    `; document.head.appendChild(s);
  };

  const renderUsersForTeacher = async () => {
    if (!isAdmin() || busy) return;
    busy = true; addStyles();
    try {
      const data = await api('/api/data');
      const content = document.querySelector('.content'); if (!content) return;
      content.innerHTML = `<section class="panel"><div class="panel-head"><div><h2>Kullanıcılar</h2><p>Öğrenci ve veli hesaplarını görüntüleyin.</p></div></div><div class="section-title">Öğrenciler</div><div class="rui-table-wrap"><table class="rui-table"><thead><tr><th>Öğrenci</th><th>Sınıf</th><th>Veli</th><th>Durum</th></tr></thead><tbody>${(data.students||[]).map(s=>`<tr><td><b>${esc(s.name)}</b><br><small>${esc(s.username)}</small></td><td>${esc(s.grade)}</td><td>${esc(s.parentName||'—')}</td><td><span class="rui-status ${s.status==='inactive'?'inactive':'active'}">${s.status==='inactive'?'Pasif':'Aktif'}</span></td></tr>`).join('')||'<tr><td colspan="4">Henüz öğrenci yok.</td></tr>'}</tbody></table></div><div class="section-title" style="margin-top:24px">Veliler</div><div class="rui-table-wrap"><table class="rui-table"><thead><tr><th>Veli</th><th>Kullanıcı</th><th>Bağlı öğrenci</th><th>Durum</th></tr></thead><tbody>${(data.parents||[]).map(p=>{const children=(data.students||[]).filter(s=>s.parentUserId===p.id).map(s=>esc(s.name)).join(', ')||'—';return `<tr><td><b>${esc(p.name)}</b></td><td>${esc(p.username)}</td><td>${children}</td><td><span class="rui-status ${p.status==='inactive'?'inactive':'active'}">${p.status==='inactive'?'Pasif':'Aktif'}</span></td></tr>`}).join('')||'<tr><td colspan="4">Henüz veli yok.</td></tr>'}</tbody></table></div></section>`;
    } catch (e) { toast(e.message, true); } finally { busy = false; }
  };

  const renderTeacherManagement = async () => {
    if (!isSuper() || busy) return;
    busy = true; addStyles();
    try {
      const data = await api('/api/data');
      const content = document.querySelector('.content'); if (!content) return;
      content.innerHTML = `<section class="panel"><div class="panel-head"><div><h2>Öğretmen Yönetimi</h2><p>Sadece öğretmen hesaplarını yönetin.</p></div><button class="btn primary" data-rui-new-teacher>+ Öğretmen Ekle</button></div><div class="rui-table-wrap"><table class="rui-table"><thead><tr><th>Ad</th><th>Kullanıcı</th><th>Durum</th><th></th></tr></thead><tbody>${(data.teachers||[]).map(t=>`<tr><td><b>${esc(t.name)}</b></td><td>${esc(t.username)}</td><td><span class="rui-status ${t.status==='inactive'?'inactive':'active'}">${t.status==='inactive'?'Pasif':'Aktif'}</span></td><td><button class="rui-btn ${t.status==='inactive'?'primary':'danger'}" data-rui-toggle="${esc(t.id)}" data-rui-status="${esc(t.status||'active')}">${t.status==='inactive'?'Aktifleştir':'Pasife Al'}</button></td></tr>`).join('')||'<tr><td colspan="4">Henüz öğretmen yok.</td></tr>'}</tbody></table></div></section>`;
      content.querySelector('[data-rui-new-teacher]')?.addEventListener('click', openTeacherForm);
      content.querySelectorAll('[data-rui-toggle]').forEach(btn => btn.addEventListener('click', () => toggleTeacher(btn.dataset.ruiToggle, btn.dataset.ruiStatus)));
    } catch (e) { toast(e.message, true); } finally { busy = false; }
  };

  const openTeacherForm = () => {
    addStyles();
    const p = panel('Yeni Öğretmen', `<label class="rui-field"><span>Ad Soyad</span><input class="rui-input" name="name"></label><label class="rui-field"><span>Kullanıcı adı</span><input class="rui-input" name="username"></label><label class="rui-field"><span>Şifre</span><input class="rui-input" name="password" type="password"></label>`, `<button class="rui-btn" data-rui-cancel>Vazgeç</button><button class="rui-btn primary" data-rui-save>Öğretmen Ekle</button>`);
    p.querySelector('[data-rui-cancel]').onclick = () => p.remove();
    p.querySelector('[data-rui-save]').onclick = async () => { try { const name=p.querySelector('[name=name]').value.trim(),username=p.querySelector('[name=username]').value.trim(),password=p.querySelector('[name=password]').value; if(!name||!username||!password) throw new Error('Tüm alanları doldurun.'); await api('/api/data',{method:'POST',body:JSON.stringify({type:'userCreate',role:'admin',name,username,password})}); p.remove(); toast('Öğretmen eklendi.'); renderTeacherManagement(); } catch(e) { toast(e.message,true); } };
  };

  const toggleTeacher = async (id, status) => {
    const next=status==='active'?'inactive':'active';
    const p=panel(next==='inactive'?'Öğretmeni pasife al':'Öğretmeni aktifleştir', `<p>Bu öğretmeni ${next==='inactive'?'pasife almak':'aktifleştirmek'} istediğine emin misin?</p>`, `<button class="rui-btn" data-rui-cancel>Vazgeç</button><button class="rui-btn ${next==='inactive'?'danger':'primary'}" data-rui-ok>${next==='inactive'?'Pasife Al':'Aktifleştir'}</button>`);
    p.querySelector('[data-rui-cancel]').onclick=()=>p.remove();
    p.querySelector('[data-rui-ok]').onclick=async()=>{try{await api('/api/account-status',{method:'POST',body:JSON.stringify({id,status:next})});p.remove();toast(next==='inactive'?'Öğretmen pasife alındı.':'Öğretmen aktifleştirildi.');renderTeacherManagement();}catch(e){toast(e.message,true)}};
  };

  const syncTeacherTab = () => {
    const user=getUser(); if (!user) return;
    const sidebar=document.querySelector('.nav-scroll'); if(!sidebar) return;
    let tab=sidebar.querySelector('[data-page="teacher-management"]');
    if(user.role==='superadmin'){
      if(!tab){tab=document.createElement('button');tab.className='nav-item';tab.dataset.page='teacher-management';tab.innerHTML='<span>♙</span><span>Öğretmen Yönetimi</span>';sidebar.appendChild(tab);}
    } else tab?.remove();
  };

  document.addEventListener('click', e => {
    syncTeacherTab();
    const nav=e.target.closest('[data-page]');
    if(nav?.dataset.page==='users' && isAdmin()){
      e.preventDefault(); e.stopImmediatePropagation();
      document.querySelectorAll('.nav-item.active').forEach(x=>x.classList.remove('active')); nav.classList.add('active');
      document.querySelector('.topbar h1')?.replaceChildren(document.createTextNode('Kullanıcılar'));
      renderUsersForTeacher(); return;
    }
    if(nav?.dataset.page==='teacher-management' && isSuper()){
      e.preventDefault(); e.stopImmediatePropagation();
      document.querySelectorAll('.nav-item.active').forEach(x=>x.classList.remove('active')); nav.classList.add('active');
      document.querySelector('.topbar h1')?.replaceChildren(document.createTextNode('Öğretmen Yönetimi'));
      renderTeacherManagement(); return;
    }
    if(nav) setTimeout(syncTeacherTab, 80);
  }, true);

  const boot = () => { addStyles(); syncTeacherTab(); initializedRole=getUser()?.role||''; };
  setTimeout(boot, 700); setTimeout(boot, 1600); setTimeout(boot, 3000);
})();

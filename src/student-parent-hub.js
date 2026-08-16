(() => {
  const isTeacher = () => document.querySelector('.user-chip .badge')?.textContent?.trim() === 'Öğretmen';
  const token = () => localStorage.getItem('mk_session') || '';
  const api = async (path, options={}) => {
    const r = await fetch(path, { ...options, headers: { 'content-type':'application/json', ...(token()?{authorization:`Bearer ${token()}`}:{}) , ...(options.headers||{}) } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'İşlem başarısız.');
    return d;
  };
  const notify = (msg, bad=false) => {
    const el=document.createElement('div'); el.className=`sph-toast ${bad?'bad':''}`; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),2800);
  };
  const modal = (title, body, actions) => {
    document.querySelector('#sph-modal')?.remove();
    const el=document.createElement('div'); el.id='sph-modal';
    el.innerHTML=`<div class="sph-modal-bg"></div><div class="sph-modal-box"><div class="sph-modal-head"><h2>${esc(title)}</h2><button data-sph-close>×</button></div><div class="sph-modal-body">${body}</div><div class="sph-modal-actions">${actions}</div></div>`;
    document.body.appendChild(el);
    el.querySelector('[data-sph-close]')?.addEventListener('click',()=>el.remove());
    el.querySelector('.sph-modal-bg')?.addEventListener('click',()=>el.remove());
    return el;
  };
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const toggleStatus = async (id,status,label) => {
    const next=status==='active'?'inactive':'active';
    const m=modal(next==='inactive'?'Öğrenciyi pasife al':'Öğrenciyi aktifleştir',`<p><b>${esc(label)}</b> hesabını ${next==='inactive'?'pasife almak':'aktifleştirmek'} istediğine emin misin?</p><p class="sph-modal-note">Bağlı veli hesabı da aynı duruma getirilecek.</p>`,`<button class="sph-btn" data-cancel>Vazgeç</button><button class="sph-btn ${next==='inactive'?'danger':'primary'}" data-ok>${next==='inactive'?'Pasife Al':'Aktifleştir'}</button>`);
    m.querySelector('[data-cancel]').onclick=()=>m.remove();
    m.querySelector('[data-ok]').onclick=async()=>{try{await api('/api/account-status',{method:'POST',body:JSON.stringify({id,status:next})});m.remove();notify(next==='inactive'?'Öğrenci ve veli pasife alındı.':'Öğrenci ve veli aktifleştirildi.');await openHub();}catch(e){notify(e.message,true)}};
  };
  const openHub = async () => {
    if (!isTeacher()) return;
    const content = document.querySelector('.content'); if (!content) return;
    try {
      const d = await api('/api/data'); const students=d.students||[], parents=d.parents||[];
      const rows=students.map(s=>{const p=parents.find(x=>x.id===s.parentUserId);return `<article class="sph-card">
        <div class="sph-student"><div class="sph-kicker">Öğrenci</div><b>${esc(s.name)}</b><span>Kullanıcı: ${esc(s.username||'—')}</span><span>Sınıf: ${esc(s.grade||'—')}</span><span>Grup: ${esc(s.groupName||'—')}</span><span>Hizmet: ${esc(s.serviceType||'—')}</span></div>
        <div class="sph-parent"><div class="sph-kicker">Veli</div>${p?`<b>${esc(p.name)}</b><span>Kullanıcı: ${esc(p.username||'—')}</span><span>Durum: ${p.status==='inactive'?'Pasif':'Aktif'}</span>`:'<span>Veli bilgisi yok</span>'}</div>
        <div class="sph-actions"><span class="sph-pill ${s.status==='inactive'?'off':'on'}">${s.status==='inactive'?'Pasif':'Aktif'}</span><button class="sph-btn ${s.status==='inactive'?'primary':'danger'}" data-toggle-id="${esc(s.userId||s.id)}" data-toggle-status="${esc(s.status||'active')}" data-toggle-label="${esc(s.name)}">${s.status==='inactive'?'Aktifleştir':'Pasife Al'}</button></div>
      </article>`}).join('');
      content.innerHTML=`<section class="sph-wrap"><div class="sph-toolbar"><div><h2>Öğrenci & Veli</h2><p>Öğrenci, veli ve hesap durumlarını aynı yerde yönetin.</p></div></div><div class="sph-grid">${rows||'<div class="sph-empty">Henüz öğrenci bulunmuyor.</div>'}</div></section>`;
      content.querySelectorAll('[data-toggle-id]').forEach(b=>b.onclick=()=>toggleStatus(b.dataset.toggleId,b.dataset.toggleStatus,b.dataset.toggleLabel));
      document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active')); document.querySelector('[data-sph-page]')?.classList.add('active');
      document.querySelector('.topbar h1')?.replaceChildren(document.createTextNode('Öğrenci & Veli'));
    }catch(e){content.innerHTML=`<section class="panel"><div class="empty"><b>${esc(e.message)}</b></div></section>`;}
  };
  const ensureNav = () => {
    if(!isTeacher()){document.querySelector('[data-sph-page]')?.remove();return;}
    const nav=document.querySelector('.nav-scroll'); if(!nav)return;
    let b=nav.querySelector('[data-sph-page]');
    if(!b){ b=document.createElement('button'); b.className='nav-item'; b.setAttribute('data-sph-page',''); b.innerHTML='<span>◉</span><span>Öğrenci & Veli</span>'; nav.appendChild(b); }
    b.onclick=e=>{e.preventDefault();openHub();};
  };
  if(!document.getElementById('sph-styles')){const s=document.createElement('style');s.id='sph-styles';s.textContent=`
    .sph-wrap{display:grid;gap:18px}.sph-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;background:#fff;border:1px solid #e6ebf2;border-radius:18px;padding:20px;box-shadow:0 8px 24px rgba(16,34,70,.05)}.sph-toolbar h2{margin:0 0 5px}.sph-toolbar p{margin:0;color:#6f7b8f}.sph-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}.sph-card{background:#fff;border:1px solid #dfe6ef;border-radius:18px;min-height:280px;padding:18px;box-shadow:0 10px 30px rgba(16,34,70,.05);display:flex;flex-direction:column;justify-content:space-between;gap:16px}.sph-student,.sph-parent{display:grid;gap:6px}.sph-student{padding-bottom:12px;border-bottom:1px solid #edf0f4}.sph-parent{padding-top:2px}.sph-kicker{font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#7a8699}.sph-card b{font-size:17px;line-height:1.25;color:#172846}.sph-card span{font-size:13px;line-height:1.45;color:#5f6e84}.sph-parent{padding-left:16px;border-left:1px solid #edf0f4}.sph-actions{display:flex;justify-content:space-between;align-items:center;gap:10px}.sph-pill{padding:6px 10px;border-radius:999px;font-size:11px!important;font-weight:800!important}.sph-pill.on{background:#e9f7ee;color:#17653a!important}.sph-pill.off{background:#fff0f1;color:#a72c39!important}.sph-btn{border:1px solid #d5deea;background:#fff;border-radius:10px;padding:9px 13px;font-weight:800;cursor:pointer;color:#20324f}.sph-btn.primary{background:#183b72;border-color:#183b72;color:#fff}.sph-btn.danger{background:#a92f3c;border-color:#a92f3c;color:#fff}.sph-empty{grid-column:1/-1;background:#fff;border:1px dashed #d4ddea;border-radius:16px;padding:42px;text-align:center;color:#788499}.sph-toast{position:fixed;right:18px;bottom:18px;z-index:1000000;background:#183b72;color:#fff;padding:11px 14px;border-radius:12px;font-weight:800;box-shadow:0 12px 30px rgba(0,0,0,.18)}.sph-toast.bad{background:#a92f3c}.sph-modal-bg{position:fixed;inset:0;background:rgba(10,21,44,.48);backdrop-filter:blur(2px);z-index:100000}.sph-modal-box{position:fixed;z-index:100001;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,calc(100% - 30px));max-height:85vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 26px 90px rgba(0,0,0,.24)}.sph-modal-head{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #e8edf3}.sph-modal-head h2{margin:0;font-size:19px}.sph-modal-head button{border:0;background:transparent;font-size:26px;cursor:pointer}.sph-modal-body{padding:20px}.sph-modal-note{color:#6f7b8f;font-size:13px}.sph-modal-actions{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid #e8edf3}@media(max-width:760px){.sph-toolbar{align-items:stretch;flex-direction:column}.sph-grid{grid-template-columns:1fr}.sph-card{min-height:260px}}`;
    document.head.appendChild(s);}
  const observer=new MutationObserver(()=>ensureNav()); observer.observe(document.body,{childList:true,subtree:true});
  ensureNav(); setInterval(ensureNav,1000);
})();
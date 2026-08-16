(()=>{
  const userFromStorage=()=>{try{return JSON.parse(localStorage.getItem('mk_user')||'null')}catch{return null}};
  const isTeacher=()=>{const u=userFromStorage();return ['admin','superadmin'].includes(u?.role)||/^(Öğretmen|Baş Admin)$/.test(document.querySelector('.user-chip .badge')?.textContent?.trim()||'');};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const token=()=>localStorage.getItem('mk_session')||'';
  const api=async(path,opts={})=>{const r=await fetch(path,{...opts,headers:{'content-type':'application/json',...(token()?{authorization:`Bearer ${token()}`}:{}) ,...(opts.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`İstek başarısız (${r.status})`);return d};
  const toast=msg=>{const n=document.createElement('div');n.className='toast error';n.textContent=msg;document.body.appendChild(n);setTimeout(()=>n.remove(),3500)};
  const open=async()=>{
    if(!isTeacher())return;
    document.querySelector('.modal-backdrop')?.remove();
    let owners=[];
    try{const data=await api('/api/data');owners=data.teachers||[]}catch(e){toast(e.message);return}
    const isSuper=userFromStorage()?.role==='superadmin'||document.querySelector('.user-chip .badge')?.textContent?.trim()==='Baş Admin';
    const ownerField=isSuper?`<label class="field"><span>Öğretmen</span><select name="ownerId">${owners.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}</select></label>`:'';
    const modal=document.createElement('div');modal.className='modal-backdrop';modal.id='student-register-modal';modal.innerHTML=`<div class="modal-card"><div class="modal-head"><h2>Öğrenci ve Veli Ekle</h2><button class="icon-btn" data-close>×</button></div><div class="modal-body"><form id="student-register-form" class="form-grid"><div class="section-title">Öğrenci Bilgileri</div><label class="field"><span>Ad Soyad</span><input name="studentName" required></label><label class="field"><span>Kullanıcı Adı</span><input name="studentUsername" required autocomplete="off"></label><label class="field"><span>Şifre</span><input name="studentPassword" type="password" required></label><label class="field"><span>Sınıf</span><input name="grade" required></label><label class="field"><span>Grup</span><input name="groupName"></label><label class="field"><span>Hizmet Tipi</span><select name="serviceType"><option value="ozel_ders">Özel Ders</option><option value="kocluk">Koçluk</option><option value="both">Özel Ders + Koçluk</option></select></label>${ownerField}<div class="section-title">Veli Bilgileri</div><label class="field"><span>Ad Soyad</span><input name="parentName" required></label><label class="field"><span>Kullanıcı Adı</span><input name="parentUsername" required autocomplete="off"></label><label class="field"><span>Şifre</span><input name="parentPassword" type="password" required></label><div class="form-note">Öğrenci ve veli hesapları birlikte oluşturulur.</div><div class="form-actions"><button type="button" class="btn ghost" data-cancel>Vazgeç</button><button class="btn primary">Kaydet</button></div></form></div></div>`;
    document.body.appendChild(modal);
    const close=()=>modal.remove();modal.querySelector('[data-close]').onclick=close;modal.querySelector('[data-cancel]').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});
    modal.querySelector('#student-register-form').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);try{await api('/api/student-create',{method:'POST',body:JSON.stringify(Object.fromEntries(fd.entries()))});close();document.querySelector('[data-page="students"]')?.click()}catch(err){toast(err.message)}};
  };
  document.addEventListener('click',e=>{const b=e.target.closest('[data-action="new-student"]');if(!b||!isTeacher())return;e.preventDefault();e.stopImmediatePropagation();open().catch(err=>toast(err.message))},true);
})();

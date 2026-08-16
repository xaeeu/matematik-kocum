(() => {
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const token=()=>localStorage.getItem('mk_session')||'';
  const auth=()=>token()?{authorization:`Bearer ${token()}`}:{};
  const api=async(path,options={})=>{const r=await fetch(path,{...options,headers:{'content-type':'application/json',...auth(),...(options.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`İstek başarısız (${r.status})`);return d;};
  let data=null;
  const style=()=>{if(document.getElementById('student-parent-styles'))return;const s=document.createElement('style');s.id='student-parent-styles';s.textContent=`
    .sp-section{border:1px solid #e0e7f0;border-radius:14px;padding:14px;margin-top:12px;background:#f8fafc}
    .sp-section h3{margin:0 0 6px;font-size:15px;color:#17305d}.sp-section p{margin:0 0 12px;color:#6a7a90;font-size:12px}
    .sp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sp-grid .field{margin:0}
    .sp-check{display:flex;align-items:center;gap:8px;margin:8px 0 0;font-size:13px;color:#32445f}.sp-check input{width:auto}
    .sp-note{font-size:12px;color:#6a7a90;margin-top:8px}.sp-modal .modal-body{max-height:min(74vh,760px);overflow:auto}
    @media(max-width:700px){.sp-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(s);};
  const openModal=(title,body,onReady)=>{document.querySelector('.sp-modal')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop sp-modal"><div class="modal-card"><div class="modal-head"><h2>${esc(title)}</h2><button class="icon-btn" type="button" data-sp-close>×</button></div><div class="modal-body">${body}</div></div></div>`);const m=document.querySelector('.sp-modal');m.querySelector('[data-sp-close]').onclick=()=>m.remove();onReady?.(m);return m;};
  const close=m=>m?.remove();
  const getData=async()=>{if(!data)data=await api('/api/data');return data;};
  const teacherOpts=(d,current='')=>(d.teachers||[]).map(t=>`<option value="${esc(t.id)}" ${t.id===current?'selected':''}>${esc(t.name)}</option>`).join('');
  const formHTML=(s={},editing=false,d={})=>{
    const parent=d.parents?.find(p=>p.id===s.parentUserId);
    const ownerOptions=teacherOpts(d,s.ownerId||d.teachers?.[0]?.id||'');
    return `<form id="sp-form" class="form-grid">
      <div class="sp-section"><h3>Öğrenci bilgileri</h3><p>Öğrenci ve veli hesabı tek işlemde oluşturulur.</p><div class="sp-grid">
        <label class="field"><span>Ad soyad</span><input name="studentName" value="${esc(s.name||'')}" required></label>
        <label class="field"><span>Kullanıcı adı</span><input name="studentUsername" value="${esc(s.username||'')}" required></label>
        ${editing?'':`<label class="field"><span>Şifre</span><input name="studentPassword" type="password" required></label>`}
        <label class="field"><span>Sınıf</span><input name="grade" value="${esc(s.grade||'')}" required></label>
        <label class="field"><span>Grup</span><input name="groupName" value="${esc(s.groupName||'')}"></label>
        <label class="field"><span>Hizmet tipi</span><select name="serviceType"><option value="ozel_ders" ${s.serviceType==='ozel_ders'?'selected':''}>Özel Ders</option><option value="kocluk" ${s.serviceType==='kocluk'?'selected':''}>Koçluk</option><option value="both" ${s.serviceType==='both'?'selected':''}>Özel Ders + Koçluk</option></select></label>
        ${d.user?.role==='superadmin'?`<label class="field"><span>Öğretmen</span><select name="ownerId">${ownerOptions}</select></label>`:''}
      </div></div>
      <div class="sp-section"><h3>Veli hesabı</h3><p>Veli artık ayrı eklenmez; öğrencinin hesabıyla birlikte oluşturulur. Mevcut veli varsa öğrenci düzenleme üzerinden hesabına bağlanabilir.</p>
        <label class="sp-check"><input type="checkbox" name="parentEnabled" ${editing ? (parent?'checked':'') : 'checked'}> Veli hesabı ekle</label>
        ${editing&&parent?`<label class="sp-check"><input type="checkbox" name="removeParent"> Bu öğrencinin veli bağlantısını kaldır</label>`:''}
        <div class="sp-grid" data-parent-fields>
          <label class="field"><span>Veli adı soyadı</span><input name="parentName" value="${esc(parent?.name||'')}" ></label>
          <label class="field"><span>Veli kullanıcı adı</span><input name="parentUsername" value="${esc(parent?.username||'')}" ></label>
          <label class="field"><span>Veli şifresi ${parent?'(değiştirmek için doldur)':''}</span><input name="parentPassword" type="password"></label>
        </div>
        <div class="sp-note">Aynı kullanıcı adıyla mevcut bir veli hesabı bulunursa yeni hesap açılmaz, öğrenci o hesaba bağlanır.</div>
      </div>
      <div class="form-actions"><button class="btn primary">${editing?'Kaydet':'Öğrenciyi ve Veliyi Ekle'}</button></div>
    </form>`;
  };
  const openStudent=async(existing=null)=>{try{const d=await getData();style();const m=openModal(existing?'Öğrenci ve veli düzenle':'Öğrenci + veli ekle',formHTML(existing||{},!!existing,d),modal=>{
      const checkbox=modal.querySelector('[name="parentEnabled"]'),fields=modal.querySelector('[data-parent-fields]');
      const sync=()=>{fields.style.display=checkbox.checked?'grid':'none';fields.querySelectorAll('input').forEach(i=>i.disabled=!checkbox.checked);};
      checkbox?.addEventListener('change',sync);sync();
      modal.querySelector('#sp-form').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);try{await api('/api/student-parent',{method:'POST',body:JSON.stringify({action:existing?'update':'create',studentId:existing?.id,studentName:fd.get('studentName'),studentUsername:fd.get('studentUsername'),studentPassword:fd.get('studentPassword'),grade:fd.get('grade'),groupName:fd.get('groupName'),serviceType:fd.get('serviceType'),ownerId:fd.get('ownerId'),parentEnabled:fd.get('parentEnabled')==='on',parentUserId:existing?.parentUserId||null,parentName:fd.get('parentName'),parentUsername:fd.get('parentUsername'),parentPassword:fd.get('parentPassword'),removeParent:fd.get('removeParent')==='on'})});close(m);window.location.reload();}catch(err){window.siteError?.(err.message)||alert(err.message);}};
    });}catch(err){window.siteError?.(err.message)||alert(err.message);}};

  document.addEventListener('click',async e=>{
    const action=e.target.closest('[data-action]')?.dataset.action;
    if(action==='new-parent'){e.preventDefault();e.stopImmediatePropagation();window.siteNotice?.('Veliler artık ayrı eklenmiyor. Yeni veli hesabını Öğrenci Ekle ekranından öğrenciyi oluştururken ekleyebilirsin.','Veli ekleme');return;}
    if(action==='new-student'){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();await openStudent();return;}
    if(action==='edit-student'){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();const id=e.target.closest('[data-action="edit-student"]').dataset.id;const d=await getData();await openStudent(d.students.find(s=>s.id===id)||null);return;}
  },true);
  const removeSeparateParent=()=>{document.querySelectorAll('[data-action="new-parent"]').forEach(b=>{b.remove();});};
  const observer=new MutationObserver(removeSeparateParent);observer.observe(document.documentElement,{subtree:true,childList:true});
  setTimeout(removeSeparateParent,300);
})();

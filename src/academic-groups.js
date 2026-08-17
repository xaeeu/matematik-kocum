(() => {
  if (window.__mkAcademicGroupsV4) return;
  window.__mkAcademicGroupsV4 = true;

  const token = () => localStorage.getItem('mk_session') || '';
  const userRole = () => document.querySelector('.user-chip .badge')?.textContent?.trim() || '';
  const canManage = () => ['Öğretmen','Baş Admin'].includes(userRole());
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  async function api(path, options = {}) {
    const headers = {'content-type':'application/json'};
    const t = token();
    if (t) headers.authorization = `Bearer ${t}`;
    const res = await fetch(path, {...options, headers});
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `İşlem başarısız (${res.status})`);
    return data;
  }

  function toast(message, type='error') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  function styles() {
    if (document.getElementById('academic-hub-v4')) return;
    const s = document.createElement('style');
    s.id = 'academic-hub-v4';
    s.textContent = `
      .academic-hub{max-width:1280px}
      .academic-breadcrumb{font-size:12px;color:#8a96a8;margin-bottom:10px}
      .academic-breadcrumb b{color:#50617a}
      .academic-hero{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:24px}
      .academic-hero h2{margin:0;color:#14284a;font-size:30px;letter-spacing:-.4px}
      .academic-hero p{margin:8px 0 0;color:#7b8799;font-size:14px}
      .academic-refresh{height:40px;padding:0 16px;border:0;border-radius:9px;background:#203a68;color:#fff;font:inherit;font-weight:800;cursor:pointer}
      .academic-card{background:#fff;border:1px solid #e5eaf1;border-radius:18px;box-shadow:0 8px 30px rgba(23,43,72,.05);padding:26px}
      .academic-card-head{display:flex;justify-content:flex-end;gap:10px;margin-bottom:24px}
      .academic-btn{height:40px;padding:0 16px;border-radius:9px;font:inherit;font-weight:800;cursor:pointer}
      .academic-btn.light{border:1px solid #d7dfeb;background:#fff;color:#233b60}
      .academic-btn.primary{border:1px solid #203a68;background:#203a68;color:#fff}
      .academic-columns{display:grid;grid-template-columns:1fr 1fr;gap:22px}
      .academic-column h3{margin:0 0 10px;font-size:12px;letter-spacing:.9px;color:#263b5d}
      .academic-empty{min-height:310px;border:1.5px dashed #d6deea;border-radius:15px;background:#fcfdff;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;box-sizing:border-box}
      .academic-empty-inner{max-width:260px}
      .academic-icon{width:58px;height:58px;border-radius:50%;margin:0 auto 15px;background:#f0f3f8;display:grid;place-items:center;color:#71809a;font-size:24px}
      .academic-empty strong{display:block;color:#263754;font-size:14px}
      .academic-empty p{margin:8px 0 18px;color:#7d899b;font-size:12px;line-height:1.55}
      .academic-items{width:100%;display:grid;gap:9px;text-align:left}
      .academic-item{display:flex;align-items:center;justify-content:space-between;padding:12px 13px;border:1px solid #e2e8f0;border-radius:10px;background:#fff}
      .academic-item b{color:#263b5d;font-size:13px}.academic-item small{color:#8a96a8;font-size:11px}
      .academic-info{margin-top:18px;padding:17px 20px;border:1px solid #e1e8f2;border-radius:14px;background:#f8fbff;display:flex;gap:12px;align-items:flex-start;color:#66758b;font-size:12px;line-height:1.5}
      .academic-info b{display:block;color:#263b5d;margin-bottom:3px}
      .academic-modal{position:fixed;inset:0;z-index:100000;background:rgba(9,18,36,.45);display:grid;place-items:center;padding:18px}
      .academic-modal-card{width:min(500px,100%);background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.25)}
      .academic-modal-head{padding:18px 20px;border-bottom:1px solid #e8edf3;display:flex;justify-content:space-between;align-items:center}.academic-modal-head h2{margin:0;color:#14284a;font-size:18px}.academic-modal-head button{border:0;background:none;font-size:24px;color:#6e7c91;cursor:pointer}
      .academic-modal-body{padding:20px}.academic-modal-body label{display:grid;gap:7px;color:#526177;font-size:12px;font-weight:800}.academic-modal-body input{padding:11px 12px;border:1px solid #d6dfeb;border-radius:9px;font:inherit;outline:none}
      .academic-modal-actions{padding:14px 20px;border-top:1px solid #e8edf3;display:flex;justify-content:flex-end;gap:8px}.academic-modal-actions button{padding:10px 14px;border:1px solid #d5deea;border-radius:9px;background:#fff;font-weight:800;cursor:pointer}.academic-modal-actions .primary{background:#203a68;border-color:#203a68;color:#fff}
      @media(max-width:800px){.academic-columns{grid-template-columns:1fr}.academic-hero{flex-direction:column}.academic-refresh{width:100%}}
    `;
    document.head.appendChild(s);
  }

  function removeStudentPanels() {
    document.querySelectorAll('.academic-manage-panel,#mk-academic-panel').forEach(el => el.remove());
  }

  function findGroupsNav() {
    return [...document.querySelectorAll('.nav-item')].find(b => b.textContent.trim().replace(/\s+/g,' ') === 'Gruplar');
  }

  function installNav() {
    if (!canManage()) return;
    const existing = findGroupsNav();
    if (existing) return existing;
    const nav = document.querySelector('.nav-scroll');
    if (!nav) return null;
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.dataset.academicGroups = '1';
    btn.innerHTML = '<span>▦</span><span>Gruplar</span>';
    nav.appendChild(btn);
    return btn;
  }

  function openModal(type, refresh) {
    const label = type === 'class' ? 'Sınıf' : 'Grup';
    const modal = document.createElement('div');
    modal.className='academic-modal';
    modal.innerHTML=`<div class="academic-modal-card"><div class="academic-modal-head"><h2>${label} Ekle</h2><button data-close>×</button></div><div class="academic-modal-body"><label>${label} adı<input data-name maxlength="80" placeholder="Örn. ${type==='class'?'8. Sınıf A':'LGS Grubu'}"></label></div><div class="academic-modal-actions"><button data-close>Vazgeç</button><button class="primary" data-save>Kaydet</button></div></div>`;
    document.body.appendChild(modal);
    const close=()=>modal.remove();
    modal.querySelectorAll('[data-close]').forEach(x=>x.onclick=close);
    modal.querySelector('[data-save]').onclick=async()=>{
      const name=modal.querySelector('[data-name]').value.trim();
      if(!name)return toast(`${label} adı gerekli.`);
      try{
        await api('/api/academic-groups',{method:'POST',body:JSON.stringify({action:type==='class'?'createClass':'createGroup',name})});
        close(); await refresh(); toast(`${label} oluşturuldu.`,'ok');
      }catch(e){toast(e.message)}
    };
    modal.querySelector('[data-name]').focus();
  }

  async function renderHub() {
    if(!canManage()) return;
    styles(); removeStudentPanels();
    const content=document.querySelector('.content');
    if(!content)return;
    content.innerHTML=`<div class="academic-hub"><div class="academic-breadcrumb">⌂ &nbsp; Yönetim &nbsp;›&nbsp; <b>Sınıf & Grup Yönetimi</b></div><div class="academic-hero"><div><h2>Sınıf & Grup Yönetimi</h2><p>Öğrenci kayıtlarında kullanılacak sınıf ve grupları buradan yönetin.</p></div><button class="academic-refresh" data-refresh>↻ Yenile</button></div><section class="academic-card"><div class="academic-card-head"><button class="academic-btn light" data-add-class>+ Sınıf Ekle</button><button class="academic-btn primary" data-add-group>+ Grup Ekle</button></div><div class="academic-columns"><div class="academic-column"><h3>SINIFLAR</h3><div class="academic-empty" data-classes></div></div><div class="academic-column"><h3>GRUPLAR</h3><div class="academic-empty" data-groups></div></div></div></section><div class="academic-info">ⓘ<div><b>Bilgilendirme</b>Kullanımda olan sınıf veya gruplar silinemez. Önce bu sınıf veya grubu kullanan öğrencileri başka bir sınıf veya gruba taşımanız gerekir.</div></div></div>`;
    try{
      const data=await api('/api/academic-groups');
      const classes=data.classes||[],groups=data.groups||[];
      const empty=(kind,items,hint)=>items.length?`<div class="academic-items">${items.map(x=>`<div class="academic-item"><b>${esc(x.name)}</b><small>${Number(x.studentCount||0)} öğrenci</small></div>`).join('')}</div>`:`<div class="academic-empty-inner"><div class="academic-icon">♙</div><strong>Henüz ${kind} eklenmedi.</strong><p>Öğrenci kayıtlarında kullanmak için<br>${hint}</p><button class="academic-btn primary" data-add-${kind==='sınıf'?'class':'group'}>+ ${kind[0].toUpperCase()+kind.slice(1)} Ekle</button></div>`;
      content.querySelector('[data-classes]').innerHTML=empty('sınıf',classes,'ilk sınıfınızı oluşturun.');
      content.querySelector('[data-groups]').innerHTML=empty('grup',groups,'ilk grubunuzu oluşturun.');
      content.querySelectorAll('[data-add-class]').forEach(b=>b.onclick=()=>openModal('class',renderHub));
      content.querySelectorAll('[data-add-group]').forEach(b=>b.onclick=()=>openModal('group',renderHub));
      content.querySelector('[data-refresh]').onclick=renderHub;
    }catch(e){toast(e.message)}
  }

  function bindNav() {
    const btn=installNav();
    if(!btn || btn.dataset.bound)return;
    btn.dataset.bound='1';
    btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));btn.classList.add('active');renderHub();});
  }

  function start(){
    const run=()=>{removeStudentPanels();bindNav();};
    run();
    new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
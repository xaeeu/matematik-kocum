(() => {
  if (window.__mkAcademicGroupsV2) return;
  window.__mkAcademicGroupsV2 = true;

  const token = () => localStorage.getItem('mk_session') || '';
  const role = () => document.querySelector('.user-chip .badge')?.textContent?.trim() || '';
  const teacher = () => ['Öğretmen', 'Baş Admin'].includes(role());
  const superAdmin = () => role() === 'Baş Admin';
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

  function toast(message, type = 'error') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  function styles() {
    if (document.getElementById('academic-ui-v2')) return;
    const style = document.createElement('style');
    style.id = 'academic-ui-v2';
    style.textContent = `
      #mk-academic-panel{margin:0 0 18px;padding:24px 28px;border:1px solid #e3e8f0;border-radius:17px;background:#fff;box-shadow:0 7px 24px rgba(23,43,72,.045)}
      #mk-academic-panel .academic-top{display:flex;justify-content:space-between;align-items:center;gap:20px}
      #mk-academic-panel .academic-title{margin:0;color:#172a47;font-size:14px;font-weight:800}
      #mk-academic-panel .academic-subtitle{margin:4px 0 0;color:#7a879a;font-size:12px}
      #mk-academic-panel .academic-buttons{display:flex;gap:10px;flex-shrink:0}
      #mk-academic-panel .academic-btn{height:44px;padding:0 18px;border:1px solid #d9e1ec;border-radius:10px;background:#fff;color:#213c69;font:inherit;font-weight:800;cursor:pointer}
      #mk-academic-panel .academic-btn.primary{background:#203a68;border-color:#203a68;color:#fff}
      #mk-academic-panel .academic-columns{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:25px}
      #mk-academic-panel .academic-column-title{margin:0 0 9px;color:#334a6b;font-size:12px;font-weight:900;text-transform:uppercase}
      #mk-academic-panel .academic-list{min-height:340px;border:1px dashed #d6deea;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box}
      #mk-academic-panel .academic-list-items{width:100%;display:grid;gap:8px}
      #mk-academic-panel .academic-item{display:flex;align-items:center;justify-content:space-between;padding:11px 12px;border:1px solid #e5eaf1;border-radius:10px;background:#f9fbfe;color:#20385d;font-size:13px;font-weight:700}
      #mk-academic-panel .academic-count{font-size:11px;color:#7d8a9d;font-weight:600}
      #mk-academic-panel .academic-empty{text-align:center;color:#263754;font-size:14px;font-weight:750}
      #mk-academic-panel .academic-empty small{display:block;margin-top:8px;color:#7b8799;font-size:12px;font-weight:500;line-height:1.45}
      .academic-safe-modal{position:fixed;inset:0;z-index:100000;background:rgba(9,18,36,.45);display:grid;place-items:center;padding:18px}
      .academic-safe-card{width:min(560px,100%);background:#fff;border-radius:18px;box-shadow:0 30px 90px rgba(0,0,0,.25);overflow:hidden}
      .academic-safe-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #e8edf3}.academic-safe-head h2{margin:0;color:#102246;font-size:19px}
      .academic-safe-body{padding:20px}.academic-safe-body label{display:grid;gap:7px;color:#526177;font-size:12px;font-weight:800}.academic-safe-body input{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #d6dfeb;border-radius:10px;font:inherit}
      .academic-safe-actions{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid #e8edf3}.academic-safe-actions button{border:1px solid #d3ddec;border-radius:10px;padding:10px 14px;background:#fff;color:#20385d;font-weight:800;cursor:pointer}.academic-safe-actions .primary{background:#233967;border-color:#233967;color:#fff}
      @media(max-width:700px){#mk-academic-panel .academic-top{flex-direction:column;align-items:flex-start}#mk-academic-panel .academic-buttons{width:100%}#mk-academic-panel .academic-btn{flex:1}#mk-academic-panel .academic-columns{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function onStudentsPage() {
    return document.querySelector('.topbar h1')?.textContent?.trim() === 'Öğrenciler';
  }

  async function getData(ownerId = '') {
    return api(`/api/academic-groups${ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : ''}`);
  }

  function removeDuplicates() {
    const panels = [...document.querySelectorAll('#mk-academic-panel')];
    panels.slice(1).forEach(p => p.remove());
    return panels[0] || null;
  }

  async function createModal(type, ownerId) {
    const label = type === 'class' ? 'Sınıf' : 'Grup';
    const modal = document.createElement('div');
    modal.className = 'academic-safe-modal';
    modal.innerHTML = `<div class="academic-safe-card"><div class="academic-safe-head"><h2>${label} Ekle</h2><button type="button" data-close>×</button></div><div class="academic-safe-body"><label>${label} adı<input data-name maxlength="80" autocomplete="off" placeholder="Örn. 8. Sınıf A"></label></div><div class="academic-safe-actions"><button type="button" data-close>Vazgeç</button><button type="button" class="primary" data-save>Kaydet</button></div></div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelectorAll('[data-close]').forEach(x => x.onclick = close);
    modal.querySelector('[data-save]').onclick = async () => {
      const name = modal.querySelector('[data-name]').value.trim();
      if (!name) return toast(`${label} adı gerekli.`);
      try {
        const body = {action:type === 'class' ? 'createClass' : 'createGroup', name};
        if (superAdmin() && ownerId) body.ownerId = ownerId;
        await api('/api/academic-groups', {method:'POST', body:JSON.stringify(body)});
        close();
        await render(true);
        toast(`${label} oluşturuldu.`, 'ok');
      } catch (e) { toast(e.message); }
    };
    modal.querySelector('[data-name]').focus();
  }

  async function render(force = false) {
    if (!teacher() || !onStudentsPage()) return;
    styles();
    const content = document.querySelector('.content');
    if (!content) return;

    let panel = removeDuplicates();
    if (panel && !force) return;

    if (panel) panel.remove();
    panel = document.createElement('section');
    panel.id = 'mk-academic-panel';
    content.prepend(panel);

    try {
      const root = await getData();
      const teachers = root.teachers || [];
      const ownerId = superAdmin() ? (panel.dataset.ownerId || teachers[0]?.id || '') : '';
      const data = superAdmin() && ownerId ? await getData(ownerId) : root;
      panel.dataset.ownerId = ownerId;
      const classes = data.classes || [];
      const groups = data.groups || [];
      const list = (items, emptyText, hint) => items.length
        ? `<div class="academic-list-items">${items.map(x => `<div class="academic-item"><span>${esc(x.name)}</span><span class="academic-count">${Number(x.studentCount || 0)} öğrenci</span></div>`).join('')}</div>`
        : `<div class="academic-empty">${emptyText}<small>${hint}</small></div>`;

      panel.innerHTML = `<div class="academic-top"><div><h2 class="academic-title">Sınıf &amp; Grup</h2><p class="academic-subtitle">Öğrenci kayıtlarında kullanılacak sınıf ve grupları buradan yönetin.</p></div><div class="academic-buttons"><button class="academic-btn" data-create="class" type="button">+ Sınıf Ekle</button><button class="academic-btn primary" data-create="group" type="button">+ Grup Ekle</button></div></div><div class="academic-columns"><div><h3 class="academic-column-title">Sınıflar</h3><div class="academic-list">${list(classes,'Henüz sınıf eklenmedi.','Öğrenci kayıtlarında kullanmak için ilk sınıfınızı oluşturun.')}</div></div><div><h3 class="academic-column-title">Gruplar</h3><div class="academic-list">${list(groups,'Henüz grup eklenmedi.','Öğrenci kayıtlarında kullanmak için ilk grubunuzu oluşturun.')}</div></div></div>`;
      panel.querySelector('[data-create="class"]').onclick = () => createModal('class', ownerId);
      panel.querySelector('[data-create="group"]').onclick = () => createModal('group', ownerId);
    } catch (e) {
      panel.remove();
      toast(e.message);
    }
  }

  function start() {
    const run = () => {
      if (onStudentsPage()) render(false).catch(() => {});
    };
    setTimeout(run, 400);

    const contentObserver = new MutationObserver(() => {
      const current = document.querySelector('.content');
      if (!current || !onStudentsPage()) return;
      const panels = current.querySelectorAll('#mk-academic-panel');
      if (panels.length > 1) {
        [...panels].slice(1).forEach(p => p.remove());
      } else if (!panels.length) {
        setTimeout(() => render(false).catch(() => {}), 80);
      }
    });
    const attach = () => { const c = document.querySelector('.content'); if (c) contentObserver.observe(c, {childList:true}); };
    attach();
    setInterval(() => { const c = document.querySelector('.content'); if (c && c !== contentObserver.__content) { contentObserver.disconnect(); contentObserver.__content = c; contentObserver.observe(c, {childList:true}); } }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
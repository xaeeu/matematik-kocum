(() => {
  if (window.__mkAcademicGroupsV4) return;
  window.__mkAcademicGroupsV4 = true;

  const token = () => localStorage.getItem('mk_session') || '';
  const role = () => document.querySelector('.user-chip .badge')?.textContent?.trim() || '';
  const isTeacher = () => ['Öğretmen', 'Baş Admin'].includes(role());
  const isSuper = () => role() === 'Baş Admin';
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

  function installStyles() {
    if (document.getElementById('academic-ui-v4')) return;
    const s = document.createElement('style');
    s.id = 'academic-ui-v4';
    s.textContent = `
      .academic-hub-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:18px}
      .academic-hub-kicker{margin:0 0 5px;color:#7b899d;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
      .academic-hub-title{margin:0;color:#172a47;font-size:26px;font-weight:850}
      .academic-hub-subtitle{margin:6px 0 0;color:#748196;font-size:13px}
      .academic-hub-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
      .academic-manage-panel{background:#fff;border:1px solid #e3e8f0;border-radius:17px;padding:22px;box-shadow:0 7px 24px rgba(23,43,72,.045)}
      .academic-manage-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}
      .academic-manage-title{margin:0;color:#172a47;font-size:18px;font-weight:800}
      .academic-manage-subtitle{margin:5px 0 0;color:#7a879a;font-size:12px;line-height:1.45}
      .academic-add{height:40px;padding:0 15px;border:1px solid #203a68;border-radius:9px;background:#203a68;color:#fff;font:inherit;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap}
      .academic-list{margin-top:18px;min-height:300px;border:1px dashed #d6deea;border-radius:14px;background:#fff;padding:14px;box-sizing:border-box;display:flex;align-items:center;justify-content:center}
      .academic-list-items{width:100%;display:grid;gap:8px;align-content:start}
      .academic-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid #e5eaf1;border-radius:10px;background:#f9fbfe;color:#20385d;font-size:13px;font-weight:700}
      .academic-count{font-size:11px;color:#7d8a9d;font-weight:600}
      .academic-empty{text-align:center;color:#263754;font-size:14px;font-weight:750}
      .academic-empty small{display:block;margin-top:7px;color:#7b8799;font-size:12px;font-weight:500;line-height:1.45}
      .academic-safe-modal{position:fixed;inset:0;z-index:100000;background:rgba(9,18,36,.45);display:grid;place-items:center;padding:18px}
      .academic-safe-card{width:min(560px,100%);background:#fff;border-radius:18px;box-shadow:0 30px 90px rgba(0,0,0,.25);overflow:hidden}
      .academic-safe-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #e8edf3}.academic-safe-head h2{margin:0;color:#102246;font-size:19px}
      .academic-safe-head button{border:0;background:transparent;font-size:24px;color:#607089;cursor:pointer}
      .academic-safe-body{padding:20px}.academic-safe-body label{display:grid;gap:7px;color:#526177;font-size:12px;font-weight:800}.academic-safe-body input{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #d6dfeb;border-radius:10px;font:inherit}
      .academic-safe-actions{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid #e8edf3}.academic-safe-actions button{border:1px solid #d3ddec;border-radius:10px;padding:10px 14px;background:#fff;color:#20385d;font-weight:800;cursor:pointer}.academic-safe-actions .primary{background:#233967;border-color:#233967;color:#fff}
      @media(max-width:800px){.academic-hub-head{align-items:flex-start;flex-direction:column}.academic-hub-grid{grid-template-columns:1fr}.academic-add{width:auto}.academic-list{min-height:220px}}
    `;
    document.head.appendChild(s);
  }

  const getData = (ownerId = '') => api(`/api/academic-groups${ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : ''}`);

  function createModal(type, ownerId, refresh) {
    const label = type === 'class' ? 'Sınıf' : 'Grup';
    const modal = document.createElement('div');
    modal.className = 'academic-safe-modal';
    modal.innerHTML = `<div class="academic-safe-card"><div class="academic-safe-head"><h2>${label} Ekle</h2><button type="button" data-close>×</button></div><div class="academic-safe-body"><label>${label} adı<input data-name maxlength="80" autocomplete="off" placeholder="Örn. 8. Sınıf A"></label></div><div class="academic-safe-actions"><button type="button" data-close>Vazgeç</button><button type="button" class="primary" data-save>Kaydet</button></div></div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
    modal.querySelector('[data-save]').onclick = async () => {
      const name = modal.querySelector('[data-name]').value.trim();
      if (!name) return toast(`${label} adı gerekli.`);
      try {
        const body = {action:type === 'class' ? 'createClass' : 'createGroup', name};
        if (isSuper() && ownerId) body.ownerId = ownerId;
        await api('/api/academic-groups', {method:'POST', body:JSON.stringify(body)});
        close();
        await refresh();
        toast(`${label} oluşturuldu.`, 'ok');
      } catch (e) { toast(e.message); }
    };
    modal.querySelector('[data-name]').focus();
  }

  async function renderHub() {
    if (!isTeacher()) return;
    const content = document.querySelector('.content');
    if (!content) return;
    installStyles();

    try {
      const root = await getData();
      const teachers = root.teachers || [];
      const ownerId = isSuper() ? (teachers[0]?.id || '') : '';
      const data = isSuper() && ownerId ? await getData(ownerId) : root;
      const classes = data.classes || [];
      const groups = data.groups || [];

      content.innerHTML = '';

      const head = document.createElement('div');
      head.className = 'academic-hub-head';
      head.innerHTML = `<div><p class="academic-hub-kicker">YÖNETİM</p><h1 class="academic-hub-title">Sınıf & Grup Yönetimi</h1><p class="academic-hub-subtitle">Sınıfları ve grupları öğrencilerden bağımsız olarak buradan yönetin.</p></div>`;
      content.appendChild(head);

      const grid = document.createElement('div');
      grid.className = 'academic-hub-grid';

      const makePanel = (type, items, empty, hint) => {
        const label = type === 'class' ? 'Sınıf' : 'Grup';
        const panel = document.createElement('section');
        panel.className = 'academic-manage-panel';
        const list = items.length
          ? `<div class="academic-list-items">${items.map(x => `<div class="academic-item"><span>${esc(x.name)}</span><span class="academic-count">${Number(x.studentCount || 0)} öğrenci</span></div>`).join('')}</div>`
          : `<div class="academic-empty">${empty}<small>${hint}</small></div>`;
        panel.innerHTML = `<div class="academic-manage-head"><div><h2 class="academic-manage-title">${label}lar</h2><p class="academic-manage-subtitle">Öğrenci kayıtlarında kullanılacak ${label.toLowerCase()}ları buradan yönetin.</p></div><button class="academic-add" type="button">+ ${label} Ekle</button></div><div class="academic-list">${list}</div>`;
        panel.querySelector('.academic-add').onclick = () => createModal(type, ownerId, renderHub);
        return panel;
      };

      grid.appendChild(makePanel('class', classes, 'Henüz sınıf eklenmedi.', 'Öğrenci kayıtlarında kullanmak için ilk sınıfınızı oluşturun.'));
      grid.appendChild(makePanel('group', groups, 'Henüz grup eklenmedi.', 'Öğrenci kayıtlarında kullanmak için ilk grubunuzu oluşturun.'));
      content.appendChild(grid);

      const title = document.querySelector('.topbar h1');
      if (title) title.textContent = 'Sınıf & Grup Yönetimi';
      document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.textContent.trim().startsWith('Gruplar')));
    } catch (e) {
      toast(e.message);
    }
  }

  function isGroupsNav(item) {
    const text = item?.textContent?.replace(/\s+/g, ' ').trim() || '';
    return text === 'Gruplar' || text.startsWith('Gruplar ');
  }

  function start() {
    installStyles();

    // Sınıf/grup yönetimi artık Öğrenciler sayfasında gösterilmez.
    // Mevcut eski paneller varsa temizle.
    document.querySelectorAll('.academic-manage-panel,#mk-academic-panel').forEach(p => p.remove());

    document.addEventListener('click', e => {
      const item = e.target.closest('.nav-item');
      if (!item || !isGroupsNav(item) || !isTeacher()) return;
      setTimeout(() => renderHub().catch(() => {}), 120);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
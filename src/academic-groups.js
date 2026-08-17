(() => {
  if (window.__mkAcademicGroupsV3) return;
  window.__mkAcademicGroupsV3 = true;

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
    if (document.getElementById('academic-ui-v3')) return;
    const s = document.createElement('style');
    s.id = 'academic-ui-v3';
    s.textContent = `
      .academic-manage-panel{margin:0 0 18px;padding:24px 28px;border:1px solid #e3e8f0;border-radius:17px;background:#fff;box-shadow:0 7px 24px rgba(23,43,72,.045)}
      .academic-manage-head{display:flex;justify-content:space-between;align-items:center;gap:18px}
      .academic-manage-title{margin:0;color:#172a47;font-size:16px;font-weight:800}
      .academic-manage-subtitle{margin:4px 0 0;color:#7a879a;font-size:12px}
      .academic-add{height:40px;padding:0 16px;border:1px solid #d5deeb;border-radius:9px;background:#203a68;color:#fff;font:inherit;font-weight:800;cursor:pointer;white-space:nowrap}
      .academic-list{margin-top:20px;min-height:210px;border:1px dashed #d6deea;border-radius:14px;background:#fff;padding:14px;box-sizing:border-box;display:flex;align-items:center;justify-content:center}
      .academic-list-items{width:100%;display:grid;gap:8px}
      .academic-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 12px;border:1px solid #e5eaf1;border-radius:10px;background:#f9fbfe;color:#20385d;font-size:13px;font-weight:700}
      .academic-count{font-size:11px;color:#7d8a9d;font-weight:600}
      .academic-empty{text-align:center;color:#263754;font-size:14px;font-weight:750}
      .academic-empty small{display:block;margin-top:7px;color:#7b8799;font-size:12px;font-weight:500}
      .academic-safe-modal{position:fixed;inset:0;z-index:100000;background:rgba(9,18,36,.45);display:grid;place-items:center;padding:18px}
      .academic-safe-card{width:min(560px,100%);background:#fff;border-radius:18px;box-shadow:0 30px 90px rgba(0,0,0,.25);overflow:hidden}
      .academic-safe-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #e8edf3}.academic-safe-head h2{margin:0;color:#102246;font-size:19px}
      .academic-safe-head button{border:0;background:transparent;font-size:24px;color:#607089;cursor:pointer}
      .academic-safe-body{padding:20px}.academic-safe-body label{display:grid;gap:7px;color:#526177;font-size:12px;font-weight:800}.academic-safe-body input{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #d6dfeb;border-radius:10px;font:inherit}
      .academic-safe-actions{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid #e8edf3}.academic-safe-actions button{border:1px solid #d3ddec;border-radius:10px;padding:10px 14px;background:#fff;color:#20385d;font-weight:800;cursor:pointer}.academic-safe-actions .primary{background:#233967;border-color:#233967;color:#fff}
      @media(max-width:700px){.academic-manage-head{align-items:flex-start;flex-direction:column}.academic-add{width:100%}.academic-list{min-height:170px}}
    `;
    document.head.appendChild(s);
  }

  const onStudentsPage = () => document.querySelector('.topbar h1')?.textContent?.trim() === 'Öğrenciler';
  const getData = (ownerId = '') => api(`/api/academic-groups${ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : ''}`);

  function removeOldPanels(content) {
    content.querySelectorAll('.academic-manage-panel').forEach(p => p.remove());
    content.querySelectorAll('#mk-academic-panel').forEach(p => p.remove());
  }

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
        const body = {action: type === 'class' ? 'createClass' : 'createGroup', name};
        if (isSuper() && ownerId) body.ownerId = ownerId;
        await api('/api/academic-groups', {method:'POST', body:JSON.stringify(body)});
        close();
        await refresh();
        toast(`${label} oluşturuldu.`, 'ok');
      } catch (e) { toast(e.message); }
    };
    modal.querySelector('[data-name]').focus();
  }

  async function render() {
    if (!isTeacher() || !onStudentsPage()) return;
    const content = document.querySelector('.content');
    if (!content) return;
    installStyles();

    removeOldPanels(content);

    try {
      const root = await getData();
      const teachers = root.teachers || [];
      const ownerId = isSuper() ? (teachers[0]?.id || '') : '';
      const data = isSuper() && ownerId ? await getData(ownerId) : root;
      const classes = data.classes || [];
      const groups = data.groups || [];

      const makePanel = (type, items, empty, hint) => {
        const label = type === 'class' ? 'Sınıf' : 'Grup';
        const panel = document.createElement('section');
        panel.className = 'academic-manage-panel';
        const list = items.length
          ? `<div class="academic-list-items">${items.map(x => `<div class="academic-item"><span>${esc(x.name)}</span><span class="academic-count">${Number(x.studentCount || 0)} öğrenci</span></div>`).join('')}</div>`
          : `<div class="academic-empty">${empty}<small>${hint}</small></div>`;
        panel.innerHTML = `<div class="academic-manage-head"><div><h2 class="academic-manage-title">${label} Yönetimi</h2><p class="academic-manage-subtitle">Öğrenci kayıtlarında kullanılacak ${label.toLowerCase()}ları buradan yönetin.</p></div><button class="academic-add" type="button">+ ${label} Ekle</button></div><div class="academic-list">${list}</div>`;
        panel.querySelector('.academic-add').onclick = () => createModal(type, ownerId, render);
        return panel;
      };

      content.prepend(makePanel('group', groups, 'Henüz grup eklenmedi.', 'Öğrenci kayıtlarında kullanmak için ilk grubunuzu oluşturun.'));
      content.prepend(makePanel('class', classes, 'Henüz sınıf eklenmedi.', 'Öğrenci kayıtlarında kullanmak için ilk sınıfınızı oluşturun.'));
    } catch (e) {
      toast(e.message);
    }
  }

  function start() {
    let timer = null;
    const run = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (onStudentsPage() && !document.querySelector('.academic-manage-panel')) render().catch(() => {});
      }, 150);
    };
    setTimeout(run, 400);
    const observer = new MutationObserver(() => {
      if (!onStudentsPage()) return;
      const panels = document.querySelectorAll('.academic-manage-panel');
      if (panels.length > 2) {
        [...panels].slice(2).forEach(p => p.remove());
      } else if (panels.length < 2) run();
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
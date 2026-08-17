(() => {
  if (window.__mkAcademicGroupsSafe) return;
  window.__mkAcademicGroupsSafe = true;

  const token = () => localStorage.getItem('mk_session') || '';
  const getRole = () => document.querySelector('.user-chip .badge')?.textContent?.trim() || '';
  const isTeacher = () => ['Öğretmen', 'Baş Admin'].includes(getRole());
  const isSuper = () => getRole() === 'Baş Admin';
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  const api = async (path, options = {}) => {
    const headers = {'content-type':'application/json'};
    const t = token();
    if (t) headers.authorization = `Bearer ${t}`;
    const response = await fetch(path, {...options, headers});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `İşlem başarısız (${response.status})`);
    return data;
  };

  let ownerId = '';
  let timer = null;
  let busy = false;

  function toast(message, type = 'error') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function addStyles() {
    if (document.getElementById('academic-ui-safe')) return;
    const style = document.createElement('style');
    style.id = 'academic-ui-safe';
    style.textContent = `
      #mk-academic-panel{margin:0 0 18px;padding:22px;border:1px solid #dfe7f1;border-radius:20px;background:#fff;box-shadow:0 10px 30px rgba(16,34,70,.055)}
      #mk-academic-panel .academic-top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
      #mk-academic-panel .academic-title{margin:0;color:#102246;font-size:20px;font-weight:800;line-height:1.25}
      #mk-academic-panel .academic-subtitle{margin:6px 0 0;color:#718097;font-size:13px;line-height:1.45}
      #mk-academic-panel .academic-buttons{display:flex;gap:8px;flex-shrink:0}
      #mk-academic-panel .academic-btn{height:44px;padding:0 17px;border:1px solid #d3ddec;border-radius:10px;background:#fff;color:#16345f;font:inherit;font-weight:800;cursor:pointer;white-space:nowrap}
      #mk-academic-panel .academic-btn.primary{background:#233967;border-color:#233967;color:#fff}
      #mk-academic-panel .academic-columns{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:20px}
      #mk-academic-panel .academic-column-title{margin:0 0 8px;color:#29466f;font-size:12px;font-weight:900;text-transform:uppercase}
      #mk-academic-panel .academic-list{min-height:72px;border:1px dashed #cfdbea;border-radius:15px;background:#fff;display:flex;align-items:center;justify-content:center;padding:10px;box-sizing:border-box}
      #mk-academic-panel .academic-list-items{width:100%;display:grid;gap:7px}
      #mk-academic-panel .academic-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 11px;border:1px solid #e2e8f0;border-radius:10px;background:#f9fbfd;color:#20385d;font-size:13px;font-weight:700}
      #mk-academic-panel .academic-count{font-size:11px;color:#7b899b;font-weight:600}
      #mk-academic-panel .academic-empty{color:#7c8aa0;font-size:13px;text-align:center}
      .academic-safe-modal{position:fixed;inset:0;z-index:100000;background:rgba(9,18,36,.45);display:grid;place-items:center;padding:18px}
      .academic-safe-card{width:min(560px,100%);max-height:85vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 30px 90px rgba(0,0,0,.25)}
      .academic-safe-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #e8edf3}
      .academic-safe-head h2{margin:0;color:#102246;font-size:19px}.academic-safe-body{padding:20px}.academic-safe-body label{display:grid;gap:7px;color:#526177;font-size:12px;font-weight:800}.academic-safe-body input,.academic-safe-body select{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #d6dfeb;border-radius:10px;font:inherit}.academic-safe-actions{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid #e8edf3}.academic-safe-actions button{border:1px solid #d3ddec;border-radius:10px;padding:10px 14px;background:#fff;color:#20385d;font-weight:800;cursor:pointer}.academic-safe-actions .primary{background:#233967;border-color:#233967;color:#fff}
      @media(max-width:700px){#mk-academic-panel .academic-top{flex-direction:column}#mk-academic-panel .academic-buttons{width:100%}#mk-academic-panel .academic-btn{flex:1}#mk-academic-panel .academic-columns{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function onStudentsPage() {
    return document.querySelector('.topbar h1')?.textContent?.trim() === 'Öğrenciler';
  }

  async function getData(id = '') {
    return api(`/api/academic-groups${id ? `?ownerId=${encodeURIComponent(id)}` : ''}`);
  }

  async function refreshStudentForm() {
    const modal = document.querySelector('#student-register-modal');
    if (!modal || !isTeacher()) return;
    const selectedOwner = modal.querySelector('select[name="ownerId"]')?.value || ownerId || '';
    try {
      const data = await getData(selectedOwner);
      for (const spec of [['grade','Sınıf seçin',true,data.classes || []],['groupName','Grup seçin',false,data.groups || []]]) {
        const old = modal.querySelector(`input[name="${spec[0]}"],select[name="${spec[0]}"]`);
        if (!old || old.dataset.academicField === '1') continue;
        const value = old.value;
        const select = document.createElement('select');
        select.className = 'academic-select';
        select.dataset.academicField = '1';
        select.name = spec[0];
        select.required = spec[2];
        select.innerHTML = `<option value="">${spec[1]}</option>${spec[3].map(x => `<option value="${esc(x.name)}" ${x.name === value ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}`;
        old.replaceWith(select);
      }
    } catch (error) {
      toast(error.message);
    }
  }

  function openCreate(type) {
    const label = type === 'class' ? 'Sınıf' : 'Grup';
    const modal = document.createElement('div');
    modal.className = 'academic-safe-modal';
    modal.innerHTML = `<div class="academic-safe-card"><div class="academic-safe-head"><h2>${label} Ekle</h2><button type="button" data-close>×</button></div><div class="academic-safe-body"><label>${label} adı<input data-name maxlength="80" autocomplete="off" placeholder="Örn. 8. Sınıf A"></label></div><div class="academic-safe-actions"><button type="button" data-close>Vazgeç</button><button type="button" class="primary" data-save>Kaydet</button></div></div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelectorAll('[data-close]').forEach(button => button.onclick = close);
    modal.querySelector('[data-save]').onclick = async () => {
      const name = modal.querySelector('[data-name]').value.trim();
      if (!name) return toast(`${label} adı gerekli.`);
      const body = {action: type === 'class' ? 'createClass' : 'createGroup', name};
      if (isSuper()) body.ownerId = ownerId;
      try {
        await api('/api/academic-groups', {method:'POST', body:JSON.stringify(body)});
        close();
        await render();
        toast(`${label} oluşturuldu.`, 'ok');
      } catch (error) {
        toast(error.message);
      }
    };
    modal.querySelector('[data-name]').focus();
  }

  async function render() {
    if (busy || !isTeacher() || !onStudentsPage()) return;
    const content = document.querySelector('.content');
    if (!content) return;
    busy = true;
    try {
      addStyles();
      document.querySelectorAll('.academic-manage-panel').forEach(node => node.remove());
      const panel = document.createElement('section');
      panel.id = 'mk-academic-panel';
      panel.className = 'academic-manage-panel';
      content.prepend(panel);

      const root = await getData();
      const teachers = root.teachers || [];
      if (isSuper() && !ownerId && teachers[0]) ownerId = teachers[0].id;
      const data = isSuper() ? await getData(ownerId) : root;
      const classes = data.classes || [];
      const groups = data.groups || [];
      const list = (items, empty) => items.length ? `<div class="academic-list-items">${items.map(x => `<div class="academic-item"><span>${esc(x.name)}</span><span class="academic-count">${Number(x.studentCount || 0)} öğrenci</span></div>`).join('')}</div>` : `<div class="academic-empty">${empty}</div>`;

      panel.innerHTML = `<div class="academic-top"><div><h2 class="academic-title">Sınıf &amp; Grup</h2><p class="academic-subtitle">Öğrenci kayıtlarında kullanılacak sınıf ve grupları buradan yönetin.</p></div><div class="academic-buttons"><button class="academic-btn" data-create="class" type="button">+ Sınıf Ekle</button><button class="academic-btn primary" data-create="group" type="button">+ Grup Ekle</button></div></div><div class="academic-columns"><div><h3 class="academic-column-title">Sınıflar</h3><div class="academic-list">${list(classes,'Henüz sınıf eklenmedi.')}</div></div><div><h3 class="academic-column-title">Gruplar</h3><div class="academic-list">${list(groups,'Henüz grup eklenmedi.')}</div></div></div>`;
      panel.querySelector('[data-create="class"]').onclick = () => openCreate('class');
      panel.querySelector('[data-create="group"]').onclick = () => openCreate('group');
      await refreshStudentForm();
    } catch (error) {
      toast(error.message);
    } finally {
      busy = false;
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => render().catch(() => {}), 250);
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-action="new-student"]')) setTimeout(refreshStudentForm, 150);
  }, true);

  const observer = new MutationObserver(() => {
    if (busy) return;
    schedule();
  });

  function start() {
    if (!document.body) return setTimeout(start, 50);
    observer.observe(document.body, {childList:true, subtree:true});
    setTimeout(schedule, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();

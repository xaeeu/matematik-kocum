(() => {
  if (window.__mkAcademicGroupsV4) return;
  window.__mkAcademicGroupsV4 = true;

  const token = () => localStorage.getItem('mk_session') || '';
  const role = () => {
    const badge = document.querySelector('.user-chip .badge');
    return badge ? badge.textContent.trim() : '';
  };
  const isTeacher = () => role() === 'Öğretmen' || role() === 'Baş Admin';
  const isSuper = () => role() === 'Baş Admin';
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>\"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;'
  }[char] || char));

  const api = async (path, options = {}) => {
    const headers = { 'content-type': 'application/json' };
    if (token()) headers.authorization = `Bearer ${token()}`;
    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `İşlem başarısız (${response.status})`);
    return data;
  };

  let ownerId = '';
  let renderTimer = 0;

  const toast = (message, type = 'error') => {
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 3200);
  };

  const style = () => {
    if (document.getElementById('academic-ui-v4')) return;
    const sheet = document.createElement('style');
    sheet.id = 'academic-ui-v4';
    sheet.textContent = `
      .academic-manage-panel{margin:0 0 16px;padding:20px;border:1px solid #dfe7f1;border-radius:18px;background:#fff;box-shadow:0 8px 28px rgba(18,42,73,.05)}
      .academic-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
      .academic-head h3{margin:0;font-size:18px}.academic-head p{margin:5px 0 0;color:#718097;font-size:13px}
      .academic-head-actions{min-width:190px}.academic-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
      .academic-summary{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}
      .academic-summary-card{border:1px solid #e4eaf2;border-radius:14px;padding:14px;background:#f9fbfd}
      .academic-summary-card b{display:block}.academic-summary-card small{display:block;margin-top:5px;color:#718097;line-height:1.5}
      .academic-modal .modal-card{width:min(760px,94vw)}.academic-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
      .academic-box{border:1px solid #e2e8f0;border-radius:14px;padding:14px;background:#fbfcfe}.academic-box h3{margin:0 0 10px;font-size:15px}
      .academic-create{display:grid;grid-template-columns:1fr auto;gap:8px;margin-bottom:12px}.academic-create input{width:100%;box-sizing:border-box;border:1px solid #d6dfeb;border-radius:10px;padding:10px 12px;font:inherit}
      .academic-list{display:grid;gap:8px;max-height:340px;overflow:auto}.academic-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border:1px solid #e2e8f0;border-radius:11px;background:#fff}
      .academic-item small{display:block;color:#7b899b;margin-top:3px}.academic-empty{padding:14px;border:1px dashed #d7e0ea;border-radius:11px;color:#7b899b;text-align:center;font-size:13px}
      .academic-select{width:100%;box-sizing:border-box;border:1px solid #d6dfeb;border-radius:10px;background:#fff;padding:10px 12px;font:inherit;color:#1e395c}
      @media(max-width:700px){.academic-head,.academic-head-actions{width:100%}.academic-head{flex-direction:column}.academic-summary,.academic-modal-grid{grid-template-columns:1fr}.academic-create{grid-template-columns:1fr}}
    `;
    document.head.appendChild(sheet);
  };

  const getData = async (id = '') => {
    const query = id ? `?ownerId=${encodeURIComponent(id)}` : '';
    return api(`/api/academic-groups${query}`);
  };

  const studentPage = () => {
    const title = document.querySelector('.topbar h1');
    return !!title && title.textContent.trim() === 'Öğrenciler';
  };

  const ownerSelect = (teachers) => {
    if (!isSuper()) return '';
    const options = teachers.map((teacher) => {
      const selected = teacher.id === ownerId ? ' selected' : '';
      return `<option value="${esc(teacher.id)}"${selected}>${esc(teacher.name)}</option>`;
    }).join('');
    return `<select class="academic-select" data-academic-owner aria-label="Öğretmen seç"><option value="">Öğretmen seçin</option>${options}</select>`;
  };

  async function refreshStudentForm() {
    const root = document.querySelector('#student-register-modal');
    if (!root || !isTeacher()) return;
    const ownerField = root.querySelector('select[name="ownerId"]');
    const selected = (ownerField ? ownerField.value : '') || ownerId || '';
    try {
      const data = await getData(selected);
      const fields = [
        ['grade', 'Sınıf seçin', true, data.classes || []],
        ['groupName', 'Grup seçin', false, data.groups || []]
      ];
      fields.forEach(([name, placeholder, required, list]) => {
        const old = root.querySelector(`input[name="${name}"], select[name="${name}"]`);
        if (!old || (old.tagName === 'SELECT' && old.classList.contains('academic-select'))) return;
        const value = old.value;
        const select = document.createElement('select');
        select.className = 'academic-select';
        select.name = name;
        select.required = required;
        select.innerHTML = `<option value="">${placeholder}</option>${list.map((item) => {
          const selected = item.name === value ? ' selected' : '';
          return `<option value="${esc(item.name)}"${selected}>${esc(item.name)}</option>`;
        }).join('')}`;
        old.replaceWith(select);
      });
    } catch (error) { toast(error.message); }
  }

  async function renderPanel() {
    if (!isTeacher() || !studentPage()) return;
    style();
    const content = document.querySelector('.content');
    if (!content) return;
    let anchor = content.querySelector('[data-student-academic-anchor]');
    if (!anchor) {
      anchor = document.createElement('section');
      anchor.className = 'academic-manage-panel';
      anchor.dataset.studentAcademicAnchor = '';
      const first = content.querySelector('.panel');
      if (first) first.before(anchor); else content.prepend(anchor);
    }
    try {
      const root = await getData();
      const teachers = root.teachers || [];
      if (isSuper() && !ownerId && teachers[0]) ownerId = teachers[0].id;
      const data = isSuper() ? await getData(ownerId) : root;
      const classes = data.classes || [];
      const groups = data.groups || [];
      anchor.innerHTML = `
        <div class="academic-head"><div><h3>Sınıf &amp; Grup Yönetimi</h3><p>Öğrenci kayıtlarında kullanılacak sınıf ve grupları öğretmene göre yönetin.</p></div><div class="academic-head-actions">${ownerSelect(teachers)}</div></div>
        <div class="academic-actions"><button class="btn primary" data-academic-open="class">+ Sınıf Ekle</button><button class="btn ghost" data-academic-open="group">+ Grup Ekle</button><button class="btn ghost" data-academic-open="manage">Yönet</button></div>
        <div class="academic-summary"><div class="academic-summary-card"><b>Sınıflar · ${classes.length}</b><small>${classes.map((item) => esc(item.name)).join(' · ') || 'Henüz sınıf oluşturulmadı.'}</small></div><div class="academic-summary-card"><b>Gruplar · ${groups.length}</b><small>${groups.map((item) => esc(item.name)).join(' · ') || 'Henüz grup oluşturulmadı.'}</small></div></div>`;
      const ownerControl = anchor.querySelector('[data-academic-owner]');
      if (ownerControl) ownerControl.addEventListener('change', async (event) => { ownerId = event.target.value; await renderPanel(); await refreshStudentForm(); });
      anchor.querySelectorAll('[data-academic-open]').forEach((button) => button.addEventListener('click', () => {
        const action = button.dataset.academicOpen;
        if (action === 'manage') openManager(); else openCreate(action);
      }));
      await refreshStudentForm();
    } catch (error) { toast(error.message); }
  }

  async function openCreate(type) {
    const label = type === 'class' ? 'Sınıf' : 'Grup';
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop academic-modal';
    modal.innerHTML = `
      <div class="modal-card"><div class="modal-head"><h2>${label} Ekle</h2><button class="icon-btn" data-close type="button">×</button></div>
      <div class="modal-body"><label class="field"><span>${label} adı</span><input data-name maxlength="80" autocomplete="off" placeholder="Örn. 8. Sınıf A"></label></div>
      <div class="modal-actions"><button class="btn ghost" data-close type="button">Vazgeç</button><button class="btn primary" data-save type="button">Kaydet</button></div></div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', close));
    const save = async () => {
      const input = modal.querySelector('[data-name]');
      const name = input ? input.value.trim() : '';
      if (!name) { toast(`${label} adı gerekli.`); return; }
      const body = { action: type === 'class' ? 'createClass' : 'createGroup', name };
      if (isSuper()) body.ownerId = ownerId;
      try {
        await api('/api/academic-groups', { method: 'POST', body: JSON.stringify(body) });
        close(); await renderPanel(); toast(`${label} oluşturuldu.`, 'ok');
      } catch (error) { toast(error.message); }
    };
    modal.querySelector('[data-save]').addEventListener('click', save);
    modal.querySelector('[data-name]').addEventListener('keydown', (event) => { if (event.key === 'Enter') save(); });
    modal.querySelector('[data-name]').focus();
  }

  async function openManager() {
    const initial = await getData(ownerId);
    const teachers = initial.teachers || [];
    if (isSuper() && !ownerId && teachers[0]) ownerId = teachers[0].id;
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop academic-modal';
    modal.innerHTML = `
      <div class="modal-card"><div class="modal-head"><div><h2>Sınıf ve Grup Yönetimi</h2><p class="muted">Kullanılan kayıtlar silinemez.</p></div><button class="icon-btn" data-close type="button">×</button></div>
      <div class="modal-body">${isSuper() ? `<label class="field"><span>Öğretmen</span>${ownerSelect(teachers)}</label>` : ''}
      <div class="academic-modal-grid"><div class="academic-box"><h3>Sınıflar</h3><div class="academic-create"><input data-name="class" maxlength="80" placeholder="Yeni sınıf"><button class="btn primary" data-add="class" type="button">Ekle</button></div><div class="academic-list" data-list="class"></div></div>
      <div class="academic-box"><h3>Gruplar</h3><div class="academic-create"><input data-name="group" maxlength="80" placeholder="Yeni grup"><button class="btn primary" data-add="group" type="button">Ekle</button></div><div class="academic-list" data-list="group"></div></div></div></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('[data-close]').addEventListener('click', () => modal.remove());
    const render = async () => {
      const data = await getData(ownerId);
      ['class', 'group'].forEach((type) => {
        const list = type === 'class' ? (data.classes || []) : (data.groups || []);
        const target = modal.querySelector(`[data-list="${type}"]`);
        target.innerHTML = list.length ? list.map((item) => {
          const count = Number(item.studentCount || 0);
          const disabled = count ? ' disabled' : '';
          return `<div class="academic-item"><div><b>${esc(item.name)}</b><small>${count} öğrenci</small></div><button class="table-btn danger" data-del="${type}" data-id="${esc(item.id)}"${disabled} type="button">Sil</button></div>`;
        }).join('') : '<div class="academic-empty">Henüz kayıt yok.</div>';
      });
    };
    const ownerControl = modal.querySelector('[data-academic-owner]');
    if (ownerControl) ownerControl.addEventListener('change', async (event) => { ownerId = event.target.value; await render(); });
    modal.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', async () => {
      const type = button.dataset.add;
      const input = modal.querySelector(`[data-name="${type}"]`);
      const name = input ? input.value.trim() : '';
      if (!name) { toast(`${type === 'class' ? 'Sınıf' : 'Grup'} adı gerekli.`); return; }
      const body = { action: type === 'class' ? 'createClass' : 'createGroup', name };
      if (isSuper()) body.ownerId = ownerId;
      try {
        await api('/api/academic-groups', { method: 'POST', body: JSON.stringify(body) });
        input.value = ''; await render(); await renderPanel(); toast('Kayıt oluşturuldu.', 'ok');
      } catch (error) { toast(error.message); }
    }));
    modal.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-del]');
      if (!button || button.disabled) return;
      const body = { action: button.dataset.del === 'class' ? 'deleteClass' : 'deleteGroup', id: button.dataset.id };
      if (isSuper()) body.ownerId = ownerId;
      try { await api('/api/academic-groups', { method: 'POST', body: JSON.stringify(body) }); await render(); await renderPanel(); toast('Kayıt silindi.', 'ok'); }
      catch (error) { toast(error.message); }
    });
    await render();
  }

  const schedule = () => {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => renderPanel().catch(() => {}), 100);
  };
  new MutationObserver((mutations) => { if (mutations.some((mutation) => mutation.addedNodes.length || mutation.removedNodes.length)) schedule(); }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', (event) => { if (event.target.closest('[data-action="new-student"]')) setTimeout(refreshStudentForm, 120); }, true);
  setTimeout(() => renderPanel().catch(() => {}), 150);
})();

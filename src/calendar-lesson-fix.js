(() => {
  const auth = () => { const t = localStorage.getItem('mk_session') || ''; return t ? { authorization: `Bearer ${t}` } : {}; };
  const toast = (msg, type='error') => window.mkToast ? window.mkToast(msg, type) : console.error(msg);
  const role = () => document.querySelector('.user-chip .badge')?.textContent?.trim() || '';
  const teacher = () => role() === 'Baş Admin' || role() === 'Öğretmen';

  async function api(path, options={}) {
    const headers = { ...(options.headers || {}), ...auth() };
    const res = await fetch(path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `İstek başarısız (${res.status})`);
    return data;
  }

  async function decorate() {
    const panel = document.querySelector('.day-panel');
    if (!panel || !teacher()) return;
    const date = panel.querySelector('.panel-head h2')?.textContent?.trim() || '';
    const teacherId = document.querySelector('select[name="calendarTeacher"]')?.value || '';
    if (!date) return;

    try {
      const data = await api('/api/data');
      const lessons = (data.lessons || []).filter(l => l.date === date && (!teacherId || l.ownerId === teacherId));
      panel.querySelectorAll('.hour-row').forEach(row => {
        const status = row.querySelector('.status');
        if (!status?.classList.contains('full')) return;
        const hour = Number(row.querySelector('.hour')?.textContent?.slice(0, 2));
        const lesson = lessons.find(l => Number(String(l.start || '').slice(0, 2)) === hour);
        const actions = row.querySelector(':scope > div:last-child');
        if (!actions) return;

        let note = actions.querySelector('.muted');
        if (!note) {
          note = document.createElement('span');
          note.className = 'muted';
          actions.prepend(note);
        }
        note.textContent = 'Ders var';

        actions.querySelectorAll('.mk-student-name').forEach(el => el.remove());
        actions.querySelectorAll('.mk-lesson-delete').forEach(el => el.remove());

        if (!lesson?.id) return;
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'btn tiny danger-outline mk-lesson-delete';
        del.textContent = 'Dersi Sil';
        del.title = 'Dersi sil';
        del.onclick = async e => {
          e.preventDefault();
          e.stopPropagation();
          if (!confirm('Bu dersi silmek istediğine emin misin?')) return;
          del.disabled = true;
          try {
            await api('/api/data', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ type: 'lessonDelete', id: lesson.id })
            });
            toast('Ders başarıyla silindi.', 'success');
            setTimeout(() => location.reload(), 250);
          } catch (err) {
            del.disabled = false;
            toast(err.message || 'Ders silinemedi.', 'error');
          }
        };
        actions.appendChild(del);
      });
    } catch (err) {
      // Calendar data is already rendered by the main application; avoid surfacing background sync errors.
      console.debug(err);
    }
  }

  const observer = new MutationObserver(() => decorate());
  observer.observe(document.documentElement, { subtree: true, childList: true });
  setTimeout(decorate, 700);
  setInterval(decorate, 1800);
})();

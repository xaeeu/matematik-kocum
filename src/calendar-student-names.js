(() => {
  const token = () => localStorage.getItem('mk_session') || '';
  let cache = null;
  let loading = null;
  let queued = false;

  async function getData() {
    if (cache) return cache;
    if (!loading) {
      loading = fetch('/api/data', {
        headers: token() ? { authorization: `Bearer ${token()}` } : {}
      })
        .then(r => r.json())
        .then(d => { cache = d; return d; })
        .catch(() => ({}));
    }
    return loading;
  }

  async function paint() {
    const panel = document.querySelector('.day-panel');
    if (!panel) return;
    const date = panel.querySelector('.panel-head h2')?.textContent?.trim();
    if (!date) return;
    const teacherId = document.querySelector('select[name="calendarTeacher"]')?.value || '';
    const data = await getData();
    const lessons = Array.isArray(data.lessons) ? data.lessons : [];
    const students = Array.isArray(data.students) ? data.students : [];

    panel.querySelectorAll('.hour-row').forEach(row => {
      const status = row.querySelector('.status.full');
      if (!status) return;
      const hour = Number((row.querySelector('.hour')?.textContent || '').slice(0, 2));
      const lesson = lessons.find(l =>
        l.date === date &&
        Number(String(l.start || '').slice(0, 2)) === hour &&
        (!teacherId || l.ownerId === teacherId)
      );
      if (!lesson) return;
      const student = students.find(s => s.id === lesson.studentId);
      if (!student?.name) return;
      status.textContent = `Dolu · ${student.name}`;
      status.title = `${student.name} — ${lesson.title || 'Ders'}`;
      const extra = row.querySelector(':scope > div:last-child .muted');
      if (extra) extra.textContent = `${student.name}`;
    });
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      paint();
    });
  }

  document.addEventListener('change', e => {
    if (e.target.matches('select[name="calendarTeacher"]')) {
      cache = null;
      loading = null;
      queue();
    }
  }, true);

  new MutationObserver(queue).observe(document.documentElement, { subtree: true, childList: true, characterData: true });
  setTimeout(queue, 500);
})();

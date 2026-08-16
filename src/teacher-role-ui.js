(() => {
  const token = () => localStorage.getItem('mk_session') || '';
  const hideForTeacher = () => {
    const links = [...document.querySelectorAll('a,button,[role="button"]')];
    for (const el of links) {
      const text = (el.textContent || '').trim();
      if (text === 'Kullanıcılar' || text === '+ Öğretmen') {
        el.style.display = 'none';
      }
    }
    const heading = [...document.querySelectorAll('h1,h2,h3')].find(x => (x.textContent || '').trim() === 'Kullanıcılar');
    if (heading) {
      const card = heading.closest('main,section,div');
      if (card && card.textContent.includes('ÖĞRETMENLER')) card.style.display = 'none';
    }
  };
  const goStudents = () => {
    const student = [...document.querySelectorAll('a,button,[role="button"]')].find(el => (el.textContent || '').trim() === 'Öğrenciler');
    if (student) { student.click(); return true; }
    return false;
  };
  const check = async () => {
    if (!token()) return;
    try {
      const r = await fetch('/api/data', { headers: { authorization: `Bearer ${token()}` }, cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d?.user?.role === 'admin') {
        hideForTeacher();
        const isUsersPage = [...document.querySelectorAll('h1,h2')].some(x => (x.textContent || '').trim() === 'Kullanıcılar');
        if (isUsersPage) goStudents();
      }
    } catch (_) {}
  };
  const obs = new MutationObserver(() => hideForTeacher());
  obs.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(check, 400);
  setInterval(check, 2500);
})();

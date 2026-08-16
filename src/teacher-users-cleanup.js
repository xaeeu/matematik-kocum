(() => {
  const clean = () => {
    const userHeading = [...document.querySelectorAll('h2')].find(h => h.textContent.trim() === 'Kullanıcılar');
    if (!userHeading) return;
    const panel = userHeading.closest('.panel');
    if (!panel) return;
    const teacherBadge = [...document.querySelectorAll('.user-chip .badge')].some(x => x.textContent.trim() === 'Öğretmen');
    if (!teacherBadge) return;
    const titles = [...panel.querySelectorAll('.section-title')];
    const tables = [...panel.querySelectorAll('.table-wrap')];
    if (titles[0]) titles[0].remove();
    if (tables[0]) tables[0].remove();
    const addTeacher = panel.querySelector('[data-action="new-teacher"]');
    addTeacher?.remove();
    const description = panel.querySelector('.panel-head p');
    if (description) description.textContent = 'Velileri yönetin.';
  };
  const obs = new MutationObserver(clean);
  obs.observe(document.documentElement, {subtree:true, childList:true});
  setTimeout(clean, 100);
  setInterval(clean, 1000);
})();

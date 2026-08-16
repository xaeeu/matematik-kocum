(() => {
  const userRole = () => {
    try { return JSON.parse(localStorage.getItem('mk_user') || 'null')?.role || ''; } catch { return ''; }
  };
  const shouldHideTeachers = () => userRole() === 'admin' || userRole() === 'superadmin';
  const clean = () => {
    if (!shouldHideTeachers()) return;

    document.querySelectorAll('[data-action="new-teacher"]').forEach(el => el.remove());

    document.querySelectorAll('.section-title').forEach(title => {
      if (title.textContent.trim() !== 'Öğretmenler') return;
      const table = title.nextElementSibling;
      title.remove();
      if (table) table.remove();
    });

    document.querySelectorAll('h2,h3,h4,p,div,span').forEach(el => {
      const text = el.textContent.trim();
      if (text === 'Öğretmen ve veli hesaplarını yönetin.') {
        el.textContent = 'Veli hesaplarını yönetin.';
      }
    });
  };
  const obs = new MutationObserver(clean);
  obs.observe(document.documentElement, {subtree:true, childList:true});
  setTimeout(clean, 100);
  setInterval(clean, 700);
})();

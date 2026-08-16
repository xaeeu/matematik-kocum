(() => {
  const isTeacher = () => {
    try { return JSON.parse(localStorage.getItem('mk_user') || 'null')?.role === 'admin'; } catch { return false; }
  };
  const clean = () => {
    if (!isTeacher()) return;
    document.querySelectorAll('[data-action="new-teacher"]').forEach(el => el.remove());
    document.querySelectorAll('.section-title').forEach(title => {
      if (title.textContent.trim() === 'Öğretmenler') {
        const wrap = title.closest('.section-title');
        const table = wrap?.nextElementSibling;
        wrap?.remove();
        table?.remove();
      }
    });
  };
  const obs = new MutationObserver(clean);
  obs.observe(document.documentElement, {subtree:true, childList:true});
  setTimeout(clean, 100);
  setInterval(clean, 700);
})();

(() => {
  const isTeacher = () => document.querySelector('.user-chip .badge')?.textContent?.trim() === 'Öğretmen';
  const token = () => localStorage.getItem('mk_session') || '';
  const api = async () => {
    const r = await fetch('/api/data', { headers: token() ? { authorization: `Bearer ${token()}` } : {} });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Veriler alınamadı.');
    return d;
  };
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const openHub = async () => {
    if (!isTeacher()) return;
    const content = document.querySelector('.content');
    if (!content) return;
    try {
      const d = await api();
      const students = d.students || [], parents = d.parents || [];
      const rows = students.map(s => {
        const p = parents.find(x => x.id === s.parentUserId);
        return `<article class="sph-card"><div class="sph-student"><b>${esc(s.name)}</b><span>${esc(s.username || '')} · ${esc(s.grade || '')}</span></div><div class="sph-parent">${p ? `<b>${esc(p.name)}</b><span>${esc(p.username || '')}</span>` : '<span class="sph-no-parent">Veli bilgisi yok</span>'}</div><div class="sph-status"><span class="sph-pill ${s.status==='inactive'?'off':'on'}">${s.status==='inactive'?'Öğrenci pasif':'Öğrenci aktif'}</span>${p ? `<span class="sph-pill ${p.status==='inactive'?'off':'on'}">${p.status==='inactive'?'Veli pasif':'Veli aktif'}</span>`:''}</div></article>`;
      }).join('');
      content.innerHTML = `<section class="sph-wrap"><div class="sph-head"><div><h2>Öğrenci & Veli</h2><p>Öğrenci ve bağlı veli bilgileri aynı kartta.</p></div></div><div class="sph-list">${rows || '<div class="sph-empty">Henüz öğrenci bulunmuyor.</div>'}</div></section>`;
      document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
      document.querySelector('[data-sph-page]')?.classList.add('active');
      document.querySelector('.topbar h1')?.replaceChildren(document.createTextNode('Öğrenci & Veli'));
    } catch (e) { content.innerHTML = `<section class="panel"><div class="empty"><b>${esc(e.message)}</b></div></section>`; }
  };
  const setup = () => {
    if (!isTeacher()) { document.querySelector('[data-sph-page]')?.remove(); return; }
    const nav = document.querySelector('.nav-scroll');
    if (!nav || nav.querySelector('[data-sph-page]')) return;
    const b = document.createElement('button');
    b.className = 'nav-item';
    b.setAttribute('data-sph-page','');
    b.innerHTML = '<span>◉</span><span>Öğrenci & Veli</span>';
    b.onclick = e => { e.preventDefault(); openHub(); };
    nav.appendChild(b);
  };
  if (!document.getElementById('sph-styles')) {
    const style = document.createElement('style');
    style.id = 'sph-styles';
    style.textContent = `.sph-wrap{display:grid;gap:16px}.sph-head{background:#fff;border:1px solid #e6ebf2;border-radius:20px;padding:22px;box-shadow:0 10px 30px rgba(16,34,70,.05)}.sph-head h2{margin:0 0 6px}.sph-head p{margin:0;color:#6b778b}.sph-list{display:grid;gap:12px}.sph-card{background:#fff;border:1px solid #e6ebf2;border-radius:18px;padding:18px;display:grid;grid-template-columns:minmax(180px,1.1fr) minmax(180px,1fr) auto;gap:18px;align-items:center;box-shadow:0 8px 24px rgba(16,34,70,.04)}.sph-student,.sph-parent{display:grid;gap:5px}.sph-student b{font-size:16px}.sph-student span,.sph-parent span{font-size:12px;color:#758196}.sph-parent{padding-left:16px;border-left:1px solid #edf0f4}.sph-parent b{font-size:13px}.sph-no-parent{color:#9aa4b3;font-size:13px}.sph-status{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.sph-pill{display:inline-flex;align-items:center;padding:7px 10px;border-radius:999px;font-size:11px;font-weight:800}.sph-pill.on{background:#e9f7ee;color:#17653a}.sph-pill.off{background:#fff0f1;color:#a72c39}.sph-empty{background:#fff;border:1px dashed #d9e1ea;border-radius:16px;padding:42px;text-align:center;color:#788499}@media(max-width:760px){.sph-card{grid-template-columns:1fr}.sph-parent{padding-left:0;border-left:0;border-top:1px solid #edf0f4;padding-top:12px}.sph-status{justify-content:flex-start}}`;
    document.head.appendChild(style);
  }
  const boot = () => { setup(); };
  setTimeout(boot, 500); setTimeout(boot, 1200); setTimeout(boot, 2500); setTimeout(boot, 5000);
})();

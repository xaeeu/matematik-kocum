(() => {
  if (window.__mkAcademicDesignV2) return;
  window.__mkAcademicDesignV2 = true;

  const style = document.createElement('style');
  style.id = 'academic-design-v2';
  style.textContent = `
    :root{--mk-navy:#102b5c;--mk-text:#172a47;--mk-muted:#718097;--mk-border:#e4e9f1;--mk-bg:#f7f9fc}
    body{background:var(--mk-bg)}
    .sidebar{width:300px;background:#fff;color:#52627a;border-right:1px solid #e7ebf1;padding:24px 16px;box-shadow:3px 0 18px rgba(24,43,72,.025)}
    .sidebar .brand{color:#102b5c;padding:4px 10px 30px;font-size:18px;letter-spacing:-.2px}
    .sidebar .brand-mark{width:42px;height:42px;border-radius:12px;background:#edf3ff;color:#102b5c;border:1px solid #dce7fa;box-shadow:none}
    .nav-scroll{gap:5px}
    .nav-item{color:#52627a;border-radius:10px;padding:12px 12px;font-weight:650;font-size:14px}
    .nav-item:hover{background:#f3f6fb;color:#233d68}
    .nav-item.active{background:#eaf1fc;color:#1e4d91;box-shadow:inset 3px 0 0 #315e9f}
    .nav-item>span:first-child{width:24px;text-align:center;color:#687991;font-size:17px}
    .nav-item.active>span:first-child{color:#315e9f}
    .main{margin-left:300px}
    .topbar{padding:24px 42px 16px;background:#f7f9fc;border-bottom:0;box-shadow:none;align-items:flex-end}
    .topbar small{font-size:10px;letter-spacing:.08em;color:#8a97aa}
    .topbar h1{font-size:28px;letter-spacing:-.6px;color:#172a47;margin-top:7px}
    .user-chip{background:#fff;border:1px solid #e3e8ef;border-radius:12px;padding:8px 10px;box-shadow:0 4px 14px rgba(26,46,77,.035)}
    .content{max-width:none;padding:8px 42px 42px}
    .academic-page-heading{margin:2px 0 18px;padding:0 2px}
    .academic-page-heading .crumb{display:flex;gap:12px;align-items:center;color:#8491a4;font-size:12px;margin-bottom:24px}
    .academic-page-heading .crumb strong{color:#66768d;font-weight:650}
    .academic-page-heading h1{margin:0;color:#172a47;font-size:30px;letter-spacing:-.7px}
    .academic-page-heading p{margin:7px 0 0;color:#748197;font-size:14px}
    @media(max-width:1100px){.sidebar{width:300px}.main{margin-left:0}.topbar{padding:18px 18px}.content{padding:8px 18px 28px}}
    @media(max-width:700px){.academic-page-heading h1{font-size:24px}.content{padding:8px 14px 24px}}
  `;
  document.head.appendChild(style);

  function isAcademicPage() {
    return !!document.querySelector('#mk-academic-panel');
  }

  function enhance() {
    if (!isAcademicPage()) return;
    const topbarTitle = document.querySelector('.topbar h1');
    const topbarSmall = document.querySelector('.topbar small');
    if (topbarTitle && topbarTitle.textContent !== 'Sınıf & Grup Yönetimi') topbarTitle.textContent = 'Sınıf & Grup Yönetimi';
    if (topbarSmall && topbarSmall.textContent !== 'YÖNETİM') topbarSmall.textContent = 'YÖNETİM';

    const panel = document.querySelector('#mk-academic-panel');
    const content = document.querySelector('.content');
    if (!panel || !content) return;

    let heading = document.querySelector('.academic-page-heading');
    if (!heading) {
      heading = document.createElement('div');
      heading.className = 'academic-page-heading';
      panel.before(heading);
    }
    const html = `<div class="crumb"><span>⌂</span><span>›</span><strong>Yönetim</strong><span>›</span><strong>Sınıf &amp; Grup Yönetimi</strong></div><h1>Sınıf &amp; Grup Yönetimi</h1><p>Öğrenci kayıtlarında kullanılacak sınıf ve grupları buradan yönetin.</p>`;
    if (heading.innerHTML !== html) heading.innerHTML = html;
  }

  function start() {
    const observer = new MutationObserver(() => {
      if (document.querySelector('#mk-academic-panel')) requestAnimationFrame(enhance);
    });
    observer.observe(document.body, {childList:true, subtree:true});
    enhance();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
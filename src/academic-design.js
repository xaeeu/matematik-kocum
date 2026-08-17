(() => {
  if (window.__mkAcademicDesign) return;
  window.__mkAcademicDesign = true;

  const style = document.createElement('style');
  style.textContent = `
    :root{--mk-navy:#203a68;--mk-text:#172a47;--mk-muted:#718097;--mk-border:#e4e9f1;--mk-bg:#f7f9fc}
    body{background:#f7f9fc}
    .sidebar{width:252px;background:#fff;color:#52627a;border-right:1px solid #e7ebf1;padding:24px 14px;box-shadow:3px 0 18px rgba(24,43,72,.025)}
    .sidebar .brand{color:#203a68;padding:4px 9px 30px;font-size:17px;letter-spacing:-.2px}
    .sidebar .brand-mark{width:38px;height:38px;border-radius:11px;background:#edf3ff;color:#244a87;border:1px solid #dce7fa;box-shadow:none}
    .nav-scroll{gap:5px}
    .nav-item{color:#5e6c80;border-radius:10px;padding:11px 11px;font-weight:650}
    .nav-item:hover{background:#f3f6fb;color:#233d68}
    .nav-item.active{background:#eaf1fc;color:#1e4d91;box-shadow:inset 3px 0 0 #315e9f}
    .nav-item>span:first-child{width:22px;text-align:center;color:#687991;font-size:16px}
    .nav-item.active>span:first-child{color:#315e9f}
    .main{margin-left:252px}
    .topbar{padding:26px 38px 18px;background:#f7f9fc;border-bottom:0;box-shadow:none;align-items:flex-end}
    .topbar small{font-size:11px;letter-spacing:.04em;color:#8a97aa}
    .topbar h1{font-size:28px;letter-spacing:-.6px;color:#172a47;margin-top:7px}
    .user-chip{background:#fff;border:1px solid #e3e8ef;border-radius:12px;padding:8px 10px;box-shadow:0 4px 14px rgba(26,46,77,.035)}
    .content{max-width:none;padding:8px 38px 38px}
    #mk-academic-panel{margin:18px 0 18px!important;padding:24px 28px 28px!important;border:1px solid #e3e8f0!important;border-radius:17px!important;box-shadow:0 7px 24px rgba(23,43,72,.045)!important}
    #mk-academic-panel .academic-top{align-items:center!important}
    #mk-academic-panel .academic-title{font-size:13px!important;letter-spacing:.04em;text-transform:uppercase;color:#334a6b!important;margin-bottom:2px!important}
    #mk-academic-panel .academic-subtitle{font-size:13px!important;color:#7a879a!important}
    #mk-academic-panel .academic-buttons{gap:10px!important}
    #mk-academic-panel .academic-btn{height:44px!important;border-radius:10px!important;padding:0 18px!important;background:#fff!important;border-color:#d9e1ec!important;color:#213c69!important}
    #mk-academic-panel .academic-btn.primary{background:#203a68!important;border-color:#203a68!important;color:#fff!important}
    #mk-academic-panel .academic-columns{gap:20px!important;margin-top:25px!important}
    #mk-academic-panel .academic-column-title{font-size:12px!important;letter-spacing:.03em;color:#334a6b!important;margin-bottom:9px!important}
    #mk-academic-panel .academic-list{min-height:340px!important;border:1px dashed #d6deea!important;border-radius:14px!important;background:#fff!important}
    #mk-academic-panel .academic-empty{font-size:14px!important;color:#263754!important;font-weight:750}
    #mk-academic-panel .academic-empty:after{content:'Öğrenci kayıtlarında kullanmak için ilk sınıfınızı oluşturun.';display:block;font-size:13px;font-weight:500;color:#7b8799;margin-top:10px;max-width:270px;line-height:1.45}
    #mk-academic-panel .academic-item{background:#f9fbfe!important;border-color:#e5eaf1!important;border-radius:10px!important;padding:11px 12px!important}
    #mk-academic-panel .academic-count{color:#7d8a9d!important}
    .academic-page-heading{margin:2px 0 18px;padding:0 2px}
    .academic-page-heading .crumb{display:flex;gap:12px;align-items:center;color:#8491a4;font-size:12px;margin-bottom:25px}
    .academic-page-heading .crumb strong{color:#66768d;font-weight:650}
    .academic-page-heading h1{margin:0;color:#172a47;font-size:30px;letter-spacing:-.7px}
    .academic-page-heading p{margin:7px 0 0;color:#748197;font-size:14px}
    @media(max-width:1100px){.sidebar{width:252px}.main{margin-left:0}.topbar{padding:18px 18px}.content{padding:8px 18px 28px}}
    @media(max-width:700px){#mk-academic-panel .academic-top{flex-direction:column!important;align-items:flex-start!important}.academic-page-heading h1{font-size:24px}.content{padding:8px 14px 24px}}
  `;
  document.head.appendChild(style);

  function enhance() {
    const panel = document.querySelector('#mk-academic-panel');
    const content = document.querySelector('.content');
    if (!panel || !content) return;

    const topbarTitle = document.querySelector('.topbar h1');
    const topbarSmall = document.querySelector('.topbar small');
    if (topbarTitle) topbarTitle.textContent = 'Sınıf & Grup Yönetimi';
    if (topbarSmall) topbarSmall.textContent = 'YÖNETİM';

    let heading = document.querySelector('.academic-page-heading');
    if (!heading) {
      heading = document.createElement('div');
      heading.className = 'academic-page-heading';
      panel.before(heading);
    }
    heading.innerHTML = `<div class="crumb"><span>⌂</span><span>›</span><strong>Yönetim</strong><span>›</span><strong>Sınıf &amp; Grup Yönetimi</strong></div><h1>Sınıf &amp; Grup Yönetimi</h1><p>Öğrenci kayıtlarında kullanılacak sınıf ve grupları buradan yönetin.</p>`;

    const oldSub = panel.querySelector('.academic-subtitle');
    if (oldSub) oldSub.textContent = '';
  }

  const observer = new MutationObserver(() => setTimeout(enhance, 0));
  function start(){
    observer.observe(document.body,{childList:true,subtree:true});
    enhance();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

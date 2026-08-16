(() => {
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  let host;
  const ensureStyles = () => {
    if (document.getElementById('site-panel-styles')) return;
    const style = document.createElement('style');
    style.id = 'site-panel-styles';
    style.textContent = `
      .site-panel-host{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;padding:20px;pointer-events:none}
      .site-panel{width:min(440px,100%);background:#fff;border:1px solid #dfe7f1;border-radius:18px;box-shadow:0 24px 70px rgba(16,34,70,.22);padding:22px;pointer-events:auto;animation:sitePanelIn .16s ease-out}
      .site-panel-backdrop{position:fixed;inset:0;background:rgba(16,34,70,.28);backdrop-filter:blur(2px)}
      .site-panel-wrap{position:relative;z-index:1}
      .site-panel h3{margin:0 0 8px;color:#102246;font-size:18px}
      .site-panel p{margin:0;color:#586a80;line-height:1.5;white-space:pre-wrap}
      .site-panel-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
      .site-panel-btn{border:1px solid #d6e0eb;background:#fff;color:#18315e;border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer}
      .site-panel-btn.primary{background:#213a6d;color:#fff;border-color:#213a6d}
      .site-panel-btn.danger{background:#c94c5b;color:#fff;border-color:#c94c5b}
      @keyframes sitePanelIn{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
    `;
    document.head.appendChild(style);
  };
  const close = () => { host?.remove(); host = null; };
  const open = ({title='Bilgi',message='',confirm=false,danger=false}) => new Promise(resolve => {
    ensureStyles();
    close();
    host = document.createElement('div');
    host.className='site-panel-host';
    host.innerHTML=`<div class="site-panel-backdrop"></div><div class="site-panel-wrap"><div class="site-panel" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><p>${esc(message)}</p><div class="site-panel-actions">${confirm?'<button class="site-panel-btn" data-cancel>Vazgeç</button>':''}<button class="site-panel-btn ${danger?'danger':'primary'}" data-ok>${confirm?'Devam et':'Tamam'}</button></div></div></div>`;
    document.body.appendChild(host);
    const finish = value => { close(); resolve(value); };
    host.querySelector('[data-ok]').onclick=()=>finish(true);
    host.querySelector('[data-cancel]')?.addEventListener('click',()=>finish(false));
    host.querySelector('.site-panel-backdrop').onclick=()=>finish(false);
    document.addEventListener('keydown',function onKey(e){if(e.key==='Escape'){document.removeEventListener('keydown',onKey);finish(false);}});
  });
  window.siteNotice = (message,title='Bilgi') => open({title,message});
  window.siteError = (message,title='İşlem başarısız') => open({title,message,danger:true});
  window.siteConfirm = (message,title='Onay gerekli') => open({title,message,confirm:true,danger:true});
  window.alert = message => { window.siteError(String(message||'Bir hata oluştu.')); };

  document.addEventListener('click', async e => {
    const videoDelete = e.target.closest('[data-video-action="delete"]');
    if (!videoDelete) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const ok = await window.siteConfirm('Bu videoyu silmek istediğine emin misin? Bu işlem geri alınamaz.','Videoyu sil');
    if (!ok) return;
    try {
      const token = localStorage.getItem('mk_session') || '';
      const r = await fetch('/api/videos',{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify({type:'delete',id:videoDelete.dataset.videoId})});
      const d = await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error||'Video silinemedi.');
      window.location.reload();
    } catch(err){ window.siteError(err.message); }
  }, true);
})();

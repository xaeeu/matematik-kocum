(() => {
  const esc = v => String(v ?? '').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const showToast = (message, type='error') => {
    let host=document.getElementById('mk-toast-host');
    if(!host){
      host=document.createElement('div');host.id='mk-toast-host';document.body.appendChild(host);
      const style=document.createElement('style');style.textContent=`#mk-toast-host{position:fixed;right:20px;bottom:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;max-width:min(420px,calc(100vw - 32px));pointer-events:none}.mk-toast{pointer-events:auto;background:#17243a;color:#fff;padding:12px 14px;border-radius:12px;box-shadow:0 12px 35px rgba(0,0,0,.18);font:500 13px/1.4 system-ui;display:flex;gap:12px;align-items:flex-start;animation:mkToastIn .18s ease-out}.mk-toast.error{border-left:4px solid #df5a5a}.mk-toast.success{border-left:4px solid #2fa36b}.mk-toast button{margin-left:auto;background:transparent;border:0;color:#fff;font-size:18px;cursor:pointer;line-height:1}.mk-toast-msg{white-space:pre-wrap}@keyframes mkToastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`;document.head.appendChild(style);
    }
    const item=document.createElement('div');item.className=`mk-toast ${type}`;item.innerHTML=`<span class="mk-toast-msg">${esc(message)}</span><button type="button">×</button>`;item.querySelector('button').onclick=()=>item.remove();host.appendChild(item);setTimeout(()=>item.remove(),5000);
  };
  window.mkToast=showToast;
  window.alert=(message)=>showToast(message,'error');
  window.addEventListener('unhandledrejection',e=>{const r=e.reason;if(r)showToast(r.message||String(r),'error');});
  window.addEventListener('error',e=>{if(e.error?.message)showToast(e.error.message,'error');});
})();

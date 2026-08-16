const accountToken=()=>localStorage.getItem('mk_session')||'';
const accountHeaders=()=>accountToken()?{authorization:`Bearer ${accountToken()}`}:{ };
async function accountApi(path,options={}){const res=await fetch(path,{...options,headers:{'content-type':'application/json',...accountHeaders(),...(options.headers||{})}});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'İşlem başarısız.');return data;}
function accountPanel(title,body,actions){
  document.querySelector('.mk-account-panel')?.remove();
  const el=document.createElement('div');
  el.className='mk-account-panel';
  el.innerHTML='<div class="mk-account-box"><h3>'+title+'</h3><div>'+body+'</div><div class="mk-account-actions">'+actions+'</div></div>';
  document.body.appendChild(el);
  return el;
}
function accountToast(msg,type='ok'){const el=document.createElement('div');el.className=`mk-account-toast ${type}`;el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3000);}
async function statusFor(id){return accountApi(`/api/account-status?id=${encodeURIComponent(id)}`);}
async function toggleAccount(id,label,button){
  try{
    const current=await statusFor(id);
    const next=current.status==='active'?'inactive':'active';
    const message=next==='inactive'
      ? '<p><b>'+label+'</b> hesabını pasife almak istediğine emin misin?</p>'+(current.role==='admin'?'<p class="mk-account-muted">Bu öğretmene bağlı öğrenci ve velilerin aktif oturumları da kapatılır.</p>':current.role==='student'?'<p class="mk-account-muted">Bu öğrencinin bağlı olduğu veli hesabının aktif oturumu da kapatılır.</p>':'')
      : '<p><b>'+label+'</b> hesabını tekrar aktifleştirmek istediğine emin misin?</p>';
    const panel=accountPanel(next==='inactive'?'Hesabı pasife al':'Hesabı aktifleştir',message,'<button type="button" data-cancel>Vazgeç</button><button type="button" class="primary">'+(next==='inactive'?'Pasife Al':'Aktifleştir')+'</button>');
    panel.querySelector('[data-cancel]').onclick=()=>panel.remove();
    panel.querySelector('.primary').onclick=async()=>{
      try{
        await accountApi('/api/account-status',{method:'POST',body:JSON.stringify({id,status:next})});
        panel.remove();
        button.dataset.status=next;
        button.textContent=next==='active'?'Pasife Al':'Aktifleştir';
        button.classList.toggle('active',next==='active');
        accountToast(next==='active'?'Hesap aktifleştirildi.':'Hesap pasife alındı.');
      }catch(e){accountToast(e.message,'error');}
    };
  }catch(e){accountToast(e.message,'error');}
}
function decorateAccountButtons(){
  const isTeacherPage=[...document.querySelectorAll('h2')].some(x=>x.textContent.trim()==='Kullanıcılar');
  const isStudentPage=[...document.querySelectorAll('h2')].some(x=>x.textContent.trim()==='Öğrenciler');
  if(!isTeacherPage&&!isStudentPage)return;
  if(!document.querySelector('.mk-account-style')){
    const s=document.createElement('style');
    s.className='mk-account-style';
    s.textContent='.mk-account-toggle{margin-left:6px}.mk-account-toggle.active{border-color:#b8d8c2;background:#edf8f0;color:#17653a}.mk-account-panel{position:fixed;inset:0;background:rgba(10,20,40,.45);z-index:99999;display:grid;place-items:center;padding:20px}.mk-account-box{width:min(440px,100%);background:#fff;border-radius:18px;padding:22px;box-shadow:0 25px 70px rgba(0,0,0,.2)}.mk-account-box h3{margin:0 0 12px}.mk-account-muted{color:#68778b;font-size:13px}.mk-account-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.mk-account-actions button{border:1px solid #d7dfeb;background:#fff;border-radius:10px;padding:9px 14px;cursor:pointer}.mk-account-actions .primary{background:#223c73;color:#fff;border-color:#223c73}.mk-account-toast{position:fixed;right:18px;bottom:18px;z-index:100000;background:#223c73;color:#fff;padding:12px 15px;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.18);font-weight:700}.mk-account-toast.error{background:#b52d3a}';
    document.head.appendChild(s);
  }
  for(const btn of document.querySelectorAll('[data-action="delete-user"],[data-action="delete-student"]')){
    const id=btn.dataset.id;
    if(!id||btn.closest('tr')?.querySelector('.mk-account-toggle'))continue;
    const row=btn.closest('tr');if(!row)continue;
    const label=(row.querySelector('td')?.textContent||btn.dataset.label||'Hesap').replace(/\s+/g,' ').trim();
    const toggle=document.createElement('button');
    toggle.type='button';toggle.className='table-btn mk-account-toggle';toggle.textContent='Durum…';toggle.dataset.status='';toggle.onclick=()=>toggleAccount(id,label,toggle);
    btn.parentNode?.appendChild(toggle);
    statusFor(id).then(d=>{toggle.dataset.status=d.status;toggle.textContent=d.status==='active'?'Pasife Al':'Aktifleştir';toggle.classList.toggle('active',d.status==='active');}).catch(()=>{toggle.textContent='Durum';});
  }
}
const accountObs=new MutationObserver(()=>decorateAccountButtons());
accountObs.observe(document.documentElement,{subtree:true,childList:true});
setTimeout(decorateAccountButtons,500);setInterval(decorateAccountButtons,1500);

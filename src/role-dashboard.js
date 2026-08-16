(()=>{
  if(window.__roleDashboardReady)return;
  window.__roleDashboardReady=true;

  const roles={
    'Öğrenci':{className:'student',title:n=>`Hoş geldin, ${n}.`,text:'Bugünkü derslerini, sınavlarını ve sana verilen çalışmaları buradan takip edebilirsin.'},
    'Veli':{className:'parent',title:n=>`Hoş geldiniz, ${n}.`,text:'Öğrencinizin derslerini, sınavlarını ve gelişimini buradan takip edebilirsiniz.'},
    'Öğretmen':{className:'admin',title:n=>`Hoş geldin, ${n}.`,text:'Öğrencilerini, derslerini ve günlük planını tek ekrandan yönetebilirsin.'},
    'Baş Admin':{className:'superadmin',title:n=>`Hoş geldin, ${n}.`,text:'Öğretmenleri, öğrencileri ve sistemdeki tüm süreçleri tek ekrandan yönetebilirsin.'}
  };

  const findRole=()=>{
    const chip=document.querySelector('.user-chip');
    if(!chip)return null;
    const text=(chip.textContent||'').replace(/\s+/g,' ').trim();
    const role=Object.keys(roles).find(r=>text.includes(r));
    if(!role)return null;
    const name=(chip.querySelector('b')?.textContent||'').trim()||'Kullanıcı';
    return {role,name};
  };

  const turkeyNow=()=>new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());
  const turkeyDate=()=>new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());

  const installStyle=()=>{
    if(document.getElementById('role-dashboard-style'))return;
    const s=document.createElement('style');
    s.id='role-dashboard-style';
    s.textContent=`
      .rd-hero{position:relative;overflow:hidden;margin:0 0 18px;padding:28px 28px;min-height:138px;box-sizing:border-box;border-radius:22px;background:linear-gradient(135deg,#243f7f 0%,#2d4f95 58%,#365ca4 100%);box-shadow:0 18px 42px rgba(27,55,120,.18);color:#fff;display:flex;align-items:center}
      .rd-hero:before{content:'';position:absolute;right:-84px;top:-118px;width:330px;height:330px;border-radius:50%;background:radial-gradient(circle at 35% 35%,rgba(255,255,255,.12),rgba(255,255,255,0) 68%)}
      .rd-hero:after{content:'';position:absolute;right:140px;bottom:-105px;width:220px;height:220px;border-radius:50%;border:1px solid rgba(255,255,255,.08);box-shadow:0 0 0 24px rgba(255,255,255,.02),0 0 0 48px rgba(255,255,255,.015)}
      .rd-hero-inner{position:relative;z-index:2;width:100%;display:flex;align-items:center;justify-content:space-between;gap:28px}
      .rd-main-copy{min-width:0;max-width:780px}
      .rd-title{margin:0 0 8px;font-size:30px;line-height:1.12;letter-spacing:-.02em;color:#fff}
      .rd-copy{margin:0;max-width:700px;color:rgba(255,255,255,.83);font-size:13px;line-height:1.6}
      .rd-bottom{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
      .rd-date{display:inline-flex;align-items:center;padding:7px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.09);color:#fff;font-size:11px;font-weight:800}
      .rd-clock{position:relative;z-index:3;min-width:176px;padding:14px 16px;border-radius:16px;background:rgba(255,255,255,.96);border:1px solid rgba(255,255,255,.24);box-shadow:0 12px 28px rgba(8,20,48,.16);backdrop-filter:blur(10px);color:#20345d}
      .rd-clock-label{display:block;font-size:9px;letter-spacing:.08em;text-transform:uppercase;font-weight:900;color:#70809a;margin-bottom:4px}
      .rd-clock-time{display:block;font-size:25px;line-height:1;font-weight:900;letter-spacing:.02em;font-variant-numeric:tabular-nums;color:#1f3766}
      .rd-clock-date{display:block;margin-top:6px;font-size:10px;color:#7b899f;font-weight:700}
      .rd-student .stat:nth-child(1),.rd-student .stat:nth-child(3),.rd-parent .stat:nth-child(1),.rd-parent .stat:nth-child(3){display:none}
      @media(max-width:760px){.rd-hero{padding:20px;border-radius:18px;min-height:0}.rd-hero-inner{display:block}.rd-title{font-size:24px}.rd-copy{font-size:12px}.rd-bottom{margin-top:14px}.rd-clock{margin-top:16px;width:100%;box-sizing:border-box}.rd-clock-time{font-size:23px}}
    `;
    document.head.appendChild(s);
  };

  const updateClock=()=>{
    const time=document.querySelector('[data-rd-time]');
    const date=document.querySelector('[data-rd-date]');
    if(time)time.textContent=turkeyNow();
    if(date)date.textContent=turkeyDate();
  };

  const render=()=>{
    try{
      const top=document.querySelector('.topbar h1');
      const content=document.querySelector('.content');
      if(!top||!content||top.textContent.trim()!=='Genel Bakış')return;
      const meta=findRole();
      if(!meta)return;
      installStyle();
      const copy=roles[meta.role];
      let hero=content.querySelector('.rd-hero');
      if(!hero){
        hero=document.createElement('section');
        hero.className=`rd-hero rd-${copy.className}`;
        content.prepend(hero);
      }
      hero.innerHTML=`<div class="rd-hero-inner"><div class="rd-main-copy"><h2 class="rd-title">${copy.title(meta.name)}</h2><p class="rd-copy">${copy.text}</p><div class="rd-bottom"><span class="rd-date" data-rd-date>${turkeyDate()}</span></div></div><div class="rd-clock"><span class="rd-clock-label">Türkiye saati</span><strong class="rd-clock-time" data-rd-time>${turkeyNow()}</strong><span class="rd-clock-date" data-rd-clock-date>${turkeyDate()}</span></div></div>`;
      updateClock();
    }catch(_){/* this enhancement must never block the application */}
  };

  const safeRender=()=>requestAnimationFrame(render);
  new MutationObserver(()=>safeRender()).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(safeRender,40),true);
  window.addEventListener('hashchange',()=>setTimeout(safeRender,40));
  setInterval(updateClock,1000);
  setInterval(safeRender,900);
  requestAnimationFrame(render);
})();

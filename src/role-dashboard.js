(()=>{
  if(window.__roleDashboardReady)return;
  window.__roleDashboardReady=true;

  const roles={
    'Öğrenci':{className:'student',eyebrow:'Kişisel alan',title:n=>`Hoş geldin, ${n}.`,text:'Derslerini, sınavlarını ve sana verilen çalışmaları tek bir yerden takip edebilirsin.',chip:'Dersler ve sınavlar'},
    'Veli':{className:'parent',eyebrow:'Veli alanı',title:n=>`Hoş geldiniz, ${n}.`,text:'Öğrencinizin derslerini, sınavlarını ve gelişimini düzenli bir şekilde takip edebilirsiniz.',chip:'Öğrenci takibi'},
    'Öğretmen':{className:'admin',eyebrow:'Öğretmen alanı',title:n=>`Hoş geldin, ${n}.`,text:'Öğrencilerini, derslerini ve günlük planını tek bir ekrandan yönetebilirsin.',chip:'Öğrenci ve ders yönetimi'},
    'Baş Admin':{className:'superadmin',eyebrow:'Yönetim alanı',title:n=>`Hoş geldin, ${n}.`,text:'Öğretmenleri, öğrencileri ve sistemin genel işleyişini buradan yönetebilirsin.',chip:'Sistem yönetimi'}
  };

  const installStyle=()=>{
    if(document.getElementById('role-dashboard-style'))return;
    const s=document.createElement('style');
    s.id='role-dashboard-style';
    s.textContent=`
      .rd-hero{position:relative;overflow:hidden;margin:0 0 20px;padding:26px 28px;border:1px solid rgba(170,188,211,.55);border-radius:24px;background:linear-gradient(135deg,#ffffff 0%,#f7faff 48%,#eef4fb 100%);box-shadow:0 14px 38px rgba(16,34,70,.07)}
      .rd-hero:before{content:'';position:absolute;right:-90px;top:-120px;width:310px;height:310px;border-radius:50%;background:radial-gradient(circle at 35% 35%,rgba(50,103,171,.18),rgba(50,103,171,0) 70%)}
      .rd-hero:after{content:'';position:absolute;right:110px;bottom:-85px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(91,177,161,.10),rgba(91,177,161,0) 72%)}
      .rd-hero-inner{position:relative;z-index:1;display:flex;justify-content:space-between;gap:28px;align-items:flex-start}
      .rd-main-copy{min-width:0;max-width:760px}
      .rd-eyebrow{display:inline-flex;align-items:center;gap:7px;padding:7px 11px;border-radius:999px;background:#eaf1fa;color:#31598f;font-size:11px;font-weight:800;letter-spacing:.01em}
      .rd-eyebrow:before{content:'';width:7px;height:7px;border-radius:50%;background:#3f6ea8;box-shadow:0 0 0 4px rgba(63,110,168,.10)}
      .rd-title{margin:13px 0 8px;font-size:30px;line-height:1.12;letter-spacing:-.02em;color:#152a48}
      .rd-copy{margin:0;color:#64758b;font-size:13px;line-height:1.65;max-width:690px}
      .rd-role-strip{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
      .rd-role-chip{padding:8px 11px;border:1px solid #dfe7f1;border-radius:11px;background:rgba(255,255,255,.78);color:#405570;font-size:11px;font-weight:750;backdrop-filter:blur(4px)}
      .rd-clock{min-width:205px;padding:14px 15px;border:1px solid rgba(215,225,238,.92);border-radius:16px;background:rgba(255,255,255,.76);box-shadow:0 8px 24px rgba(16,34,70,.05);backdrop-filter:blur(7px)}
      .rd-clock-label{display:block;color:#76869a;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px}
      .rd-clock-time{display:block;color:#173458;font-size:25px;font-weight:850;letter-spacing:.03em;font-variant-numeric:tabular-nums}
      .rd-clock-date{display:block;margin-top:4px;color:#6b7b8f;font-size:11px}
      .rd-student .stat:nth-child(1),.rd-student .stat:nth-child(3),.rd-parent .stat:nth-child(1),.rd-parent .stat:nth-child(3){display:none}
      @media(max-width:760px){.rd-hero{padding:20px;border-radius:19px}.rd-hero-inner{flex-direction:column;gap:16px}.rd-title{font-size:24px}.rd-copy{font-size:12px}.rd-clock{width:100%;box-sizing:border-box;min-width:0}.rd-clock-time{font-size:23px}}
    `;
    document.head.appendChild(s);
  };

  const findRole=()=>{
    const chip=document.querySelector('.user-chip');
    if(!chip)return null;
    const text=(chip.textContent||'').replace(/\s+/g,' ').trim();
    const role=Object.keys(roles).find(x=>text.includes(x));
    if(!role)return null;
    const nameEl=chip.querySelector('b');
    return {role,name:(nameEl?.textContent||'').trim()||'Kullanıcı'};
  };

  const nowTR=()=>new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());
  const dateTR=()=>new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());

  const updateClock=()=>{
    const t=document.querySelector('[data-rd-time]');
    const d=document.querySelector('[data-rd-date]');
    if(t)t.textContent=nowTR();
    if(d)d.textContent=dateTR();
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
      const old=content.querySelector('.rd-hero');
      if(old){updateClock();return;}
      const hero=document.createElement('section');
      hero.className=`rd-hero rd-${copy.className}`;
      hero.innerHTML=`<div class="rd-hero-inner"><div class="rd-main-copy"><span class="rd-eyebrow">${copy.eyebrow}</span><h2 class="rd-title">${copy.title(meta.name)}</h2><p class="rd-copy">${copy.text}</p><div class="rd-role-strip"><span class="rd-role-chip">${copy.chip}</span><span class="rd-role-chip">Kişisel görünüm</span></div></div><div class="rd-clock"><span class="rd-clock-label">Türkiye saati</span><strong class="rd-clock-time" data-rd-time>${nowTR()}</strong><span class="rd-clock-date" data-rd-date>${dateTR()}</span></div></div>`;
      content.prepend(hero);
      updateClock();
    }catch(_){/* dashboard enhancement must never block the application */}
  };

  setTimeout(render,80);
  setInterval(render,100);
  setInterval(updateClock,1000);
})();
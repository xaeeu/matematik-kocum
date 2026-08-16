(()=>{
  const getUser=()=>{try{return JSON.parse(localStorage.getItem('mk_user')||'null')}catch{return null}};
  const role=()=>getUser()?.role||'';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const countStudents=()=>document.querySelectorAll('.slm-card').length;
  const apply=()=>{
    if(document.querySelector('.topbar h1')?.textContent?.trim()!=='Genel Bakış')return;
    const r=role();
    const root=document.querySelector('.content');if(!root)return;
    const heroHead=[...root.querySelectorAll('h1,h2,h3')].find(x=>/Hoş geldin|Hoş geldiniz/i.test(x.textContent||''));
    const heroSub=heroHead?.parentElement?.querySelector('p')||null;
    const copy={
      student:{title:`Merhaba, ${getUser()?.name||'öğrenci'}.`,sub:'Bugünkü derslerini, sınavlarını ve çalışma planını tek yerden takip et.'},
      parent:{title:`Hoş geldiniz, ${getUser()?.name||'veli'}.`,sub:'Çocuğunuzun derslerini, sınavlarını ve gelişimini tek ekrandan takip edin.'},
      admin:{title:`Hoş geldin, ${getUser()?.name||'öğretmen'}.`,sub:'Öğrencilerin, derslerin ve sınavların için gereken her şey burada.'},
      superadmin:{title:`Hoş geldin, ${getUser()?.name||'Baş Admin'}.`,sub:'Öğretmenleri, öğrencileri ve sistemin genel durumunu tek ekrandan yönet.'}
    }[r];
    if(copy){if(heroHead)heroHead.textContent=copy.title;if(heroSub)heroSub.textContent=copy.sub;}
    const stats=root.querySelector('.stats');
    if(stats){
      const cards=[...stats.querySelectorAll('.stat')];
      const map={
        student:[['Yaklaşan Ders',cards[1]?.querySelector('b')?.textContent||'0'],['Son Sınavlar',String(document.querySelectorAll('.list-link').length||0)],['Deneme / Kazanım',cards[3]?.querySelector('b')?.textContent||'0'],['Çalışma Planı','Hazır']],
        parent:[['Çocuğunuz',cards[0]?.querySelector('b')?.textContent||'0'],['Yaklaşan Ders',cards[1]?.querySelector('b')?.textContent||'0'],['Bekleyen Saat Talepleri',cards[2]?.querySelector('b')?.textContent||'0'],['Deneme / Kazanım',cards[3]?.querySelector('b')?.textContent||'0']],
        admin:[['Öğrenci',cards[0]?.querySelector('b')?.textContent||'0'],['Yaklaşan Ders',cards[1]?.querySelector('b')?.textContent||'0'],['Bekleyen Saat Talepleri',cards[2]?.querySelector('b')?.textContent||'0'],['Deneme / Kazanım',cards[3]?.querySelector('b')?.textContent||'0']],
        superadmin:[['Öğretmen',String(document.querySelectorAll('.nav-item').length||0)],['Öğrenci',cards[0]?.querySelector('b')?.textContent||'0'],['Yaklaşan Ders',cards[1]?.querySelector('b')?.textContent||'0'],['Deneme / Kazanım',cards[3]?.querySelector('b')?.textContent||'0']]
      }[r];
      if(map){cards.forEach((c,i)=>{const item=map[i];if(!item)return;c.querySelector('span')?.replaceChildren(document.createTextNode(item[0]));c.querySelector('b')?.replaceChildren(document.createTextNode(item[1]));});}
    }
  };
  let last='';
  const tick=()=>{const key=location.pathname+'|'+(document.querySelector('.topbar h1')?.textContent||'')+'|'+role();if(key!==last){last=key;setTimeout(apply,60);setTimeout(apply,350);setTimeout(apply,900);}};
  new MutationObserver(tick).observe(document.body,{childList:true,subtree:true});
  tick();setInterval(tick,800);
})();

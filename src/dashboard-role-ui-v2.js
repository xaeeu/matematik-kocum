(()=>{
  const getUser=()=>{try{return JSON.parse(localStorage.getItem('mk_user')||'null')}catch{return null}};
  const role=()=>getUser()?.role||'';
  const escapeHtml=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const patch=()=>{
    if(role()==='')return;
    const title=document.querySelector('.topbar h1');
    if(!title||title.textContent.trim()!=='Genel Bakış')return;
    const content=document.querySelector('.content');
    if(!content)return;
    const hero=content.querySelector('.hero');
    const stats=[...content.querySelectorAll('.stats .stat')];
    const user=role();
    const configs={
      superadmin:{title:'Sisteme genel bakış',sub:'Öğretmenleri, öğrencileri ve sistemi tek ekrandan yönetin.',stats:[['Öğrenci',()=>document.body.innerText.includes('Öğrenci')?null:null]]},
      admin:{title:'Bugünün derslerine hazırsınız.',sub:'Öğrencilerinizin derslerini, taleplerini ve sınavlarını tek yerden yönetin.',stats:[['Öğrencileriniz',()=>stats[0]?.querySelector('b')?.textContent||'0'],['Yaklaşan Ders',()=>stats[1]?.querySelector('b')?.textContent||'0'],['Bekleyen Talep',()=>stats[2]?.querySelector('b')?.textContent||'0'],['Deneme / Kazanım',()=>stats[3]?.querySelector('b')?.textContent||'0']]},
      student:{title:'Bugün senin çalışma günün.',sub:'Derslerini, sınavlarını ve çalışma planını buradan takip et.',stats:[['Yaklaşan Ders',()=>stats[1]?.querySelector('b')?.textContent||'0'],['Tamamlanan Ders',()=>stats[0]?.querySelector('b')?.textContent||'0'],['Denemeler',()=>stats[3]?.querySelector('b')?.textContent||'0'],['Koçluk',()=>document.querySelector('.sidebar [data-page="coaching"]')?'Aktif':'—']]},
      parent:{title:'Çocuğunuzun eğitimini tek yerden takip edin.',sub:'Dersleri, sınavları ve gelişimi kolayca kontrol edin.',stats:[['Yaklaşan Ders',()=>stats[1]?.querySelector('b')?.textContent||'0'],['Denemeler',()=>stats[3]?.querySelector('b')?.textContent||'0'],['Değerlendirmeler',()=>stats[0]?.querySelector('b')?.textContent||'0'],['Koçluk',()=>document.querySelector('.sidebar [data-page="coaching"]')?'Aktif':'—']]}
    }[user];
    if(!configs)return;
    if(hero){const h=hero.querySelector('h2');const p=hero.querySelector('p');if(h)h.textContent=configs.title;if(p)p.textContent=configs.sub;}
    if(user==='student'||user==='parent'){
      if(stats.length){
        const labels=configs.stats;
        stats.forEach((card,i)=>{const label=card.querySelector('span');const value=card.querySelector('b');if(label)label.textContent=labels[i][0];if(value){const v=labels[i][1]();value.textContent=escapeHtml(v);}})
      }
      const pending=content.querySelector('.stats .stat:nth-child(3)');
      if(pending)pending.remove();
      const studentCount=content.querySelector('.stats .stat:first-child');
      if(studentCount && user==='student'){
        const wrap=content.querySelector('.stats');
        if(wrap&&!wrap.dataset.rolePatched){
          wrap.dataset.rolePatched='1';
          const cards=[...wrap.querySelectorAll('.stat')];
          if(cards[1]&&cards[0]){cards[0].querySelector('span').textContent='Yaklaşan Ders';cards[0].querySelector('b').textContent=cards[1].querySelector('b')?.textContent||'0';}
        }
      }
    }
    content.dataset.roleDashboardV2='1';
  };
  new MutationObserver(patch).observe(document.body,{childList:true,subtree:true});
  [250,800,1600].forEach(ms=>setTimeout(patch,ms));
  setInterval(patch,1500);
})();

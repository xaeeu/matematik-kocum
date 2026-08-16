(()=>{
  const getUser=()=>{try{return JSON.parse(localStorage.getItem('mk_user')||'null')}catch{return null}};
  const role=()=>getUser()?.role||'';
  const patch=()=>{
    const r=role();
    if(!r)return;
    const title=document.querySelector('.topbar h1');
    const content=document.querySelector('.content');
    if(!title||!content||title.textContent.trim()!=='Genel Bakış')return;
    if(content.dataset.roleDashboardV2===r)return;
    const hero=content.querySelector('.hero');
    const current=[...content.querySelectorAll('.stats .stat')].map(x=>x.querySelector('b')?.textContent?.trim()||'0');
    const students=current[0]||'0', upcoming=current[1]||'0', pending=current[2]||'0', exams=current[3]||'0';
    const configs={
      superadmin:['Sisteme genel bakış','Öğretmenleri, öğrencileri ve sistemi tek ekrandan yönetin.'],
      admin:['Bugünün derslerine hazırsınız.','Kendi öğrencilerinizin derslerini, taleplerini ve sınavlarını tek yerden yönetin.'],
      student:['Bugün senin çalışma günün.','Derslerini, sınavlarını ve çalışma planını buradan takip et.'],
      parent:['Çocuğunuzun eğitimini tek yerden takip edin.','Dersleri, sınavları ve gelişimi kolayca takip edin.']
    }[r];
    if(!configs)return;
    if(hero){hero.querySelector('h2')?.replaceChildren(document.createTextNode(configs[0]));hero.querySelector('p')?.replaceChildren(document.createTextNode(configs[1]));}
    const statsWrap=content.querySelector('.stats');
    if(statsWrap&&(r==='student'||r==='parent')){
      const cards=r==='student'?
        [['Yaklaşan Ders',upcoming],['Denemeler',exams],['Tamamlanan Ders',students],['Koçluk','Aktif']]:
        [['Yaklaşan Ders',upcoming],['Denemeler',exams],['Değerlendirmeler',students],['Koçluk','Aktif']];
      statsWrap.innerHTML=cards.map(([l,v])=>`<div class="stat"><span>${l}</span><b>${v}</b></div>`).join('');
    }
    content.dataset.roleDashboardV2=r;
  };
  new MutationObserver(patch).observe(document.body,{childList:true,subtree:true});
  [250,800,1600].forEach(ms=>setTimeout(patch,ms));
  setInterval(patch,1500);
})();

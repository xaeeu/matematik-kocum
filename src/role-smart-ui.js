(()=>{
  if(window.__mkRoleSmartUI)return; window.__mkRoleSmartUI=true;
  const getUser=()=>{try{return JSON.parse(localStorage.getItem('mk_user')||'null')}catch{return null}};
  const role=()=>getUser()?.role||'';
  const name=()=>getUser()?.name||'';
  const escapeHtml=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const page=()=>document.querySelector('.topbar h1')?.textContent?.trim()||'';
  const content=()=>document.querySelector('.content');
  const nav=n=>document.querySelector(`[data-page="${CSS.escape(n)}"]`);
  const clickNav=n=>nav(n)?.click();

  function styles(){
    if(document.getElementById('role-smart-ui-styles'))return;
    const s=document.createElement('style');s.id='role-smart-ui-styles';
    s.textContent=`
      .rs-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 18px}
      .rs-card{background:#fff;border:1px solid #e4eaf2;border-radius:16px;padding:16px;box-shadow:0 6px 18px rgba(16,34,70,.035)}
      .rs-card span{display:block;color:#718097;font-size:11px;font-weight:800;margin-bottom:8px}.rs-card b{display:block;color:#13233d;font-size:24px;letter-spacing:-.02em}.rs-card small{display:block;color:#8a96a7;margin-top:5px;font-size:11px}
      .rs-quick{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 18px}
      .rs-quick button{background:#fff;border:1px solid #e4eaf2;border-radius:14px;padding:14px;text-align:left;cursor:pointer}.rs-quick button:hover{border-color:#c7d5e7;box-shadow:0 10px 24px rgba(16,34,70,.07);transform:translateY(-1px)}
      .rs-quick .i{width:32px;height:32px;border-radius:9px;background:#edf3ff;color:#214d89;display:grid;place-items:center;font-weight:900;margin-bottom:8px}.rs-quick b{display:block;color:#13233d;font-size:13px}.rs-quick span{display:block;color:#718097;font-size:11px;margin-top:4px}
      .rs-role-note{margin:-4px 0 16px;color:#63738a;font-size:12px}
      .rs-status{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;font-size:10px;font-weight:900}.rs-status.ok{background:#e9f7ef;color:#1d7a49}.rs-status.warn{background:#fff1e1;color:#a55a09}.rs-status.bad{background:#fdebed;color:#ad3545}
      .rs-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:14px}
      .rs-list{background:#fff;border:1px solid #e4eaf2;border-radius:16px;overflow:hidden}.rs-list-head{padding:14px 16px;border-bottom:1px solid #e9eef5;display:flex;justify-content:space-between;align-items:center}.rs-list-head h3{margin:0;font-size:14px;color:#13233d}.rs-list-head span{font-size:11px;color:#7a889c}.rs-list-body{padding:4px 0}.rs-item{padding:12px 16px;border-bottom:1px solid #eef2f7;display:flex;justify-content:space-between;gap:12px;align-items:center}.rs-item:last-child{border-bottom:0}.rs-item strong{font-size:12px;color:#263a57}.rs-item small{display:block;font-size:11px;color:#75839a;margin-top:3px}.rs-empty{padding:20px;text-align:center;color:#7b8798;font-size:12px}
      .rs-student-summary{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.rs-chip{border:1px solid #e2e8f0;background:#f9fbfd;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:800;color:#5d6d84}
      @media(max-width:1000px){.rs-summary{grid-template-columns:1fr 1fr}.rs-quick{grid-template-columns:1fr 1fr}.rs-grid{grid-template-columns:1fr}}
      @media(max-width:560px){.rs-summary,.rs-quick{grid-template-columns:1fr}.rs-card b{font-size:21px}}
    `;document.head.appendChild(s);
  }

  function numberFromStat(label){
    const card=[...document.querySelectorAll('.stats .stat')].find(x=>x.querySelector('span')?.textContent?.trim()===label);
    return card?.querySelector('b')?.textContent?.trim()||'0';
  }
  function currentCards(){return [...document.querySelectorAll('.stats .stat')];}
  function replaceStats(items){
    const wrap=document.querySelector('.stats');if(!wrap)return;
    wrap.innerHTML=items.map(([l,v,sub])=>`<div class="rs-card"><span>${escapeHtml(l)}</span><b>${escapeHtml(v)}</b>${sub?`<small>${escapeHtml(sub)}</small>`:''}</div>`).join('');
    wrap.classList.add('rs-summary');
  }
  function quickItems(){
    const r=role();
    if(r==='admin')return [['Öğrenci Ekle','Yeni öğrenci kaydı','+','new-student'],['Takvim','Dersleri ve saatleri yönet','▦','calendar'],['Yeni Sınav','Deneme veya kazanım sınavı','▤','new-exam'],['Değerlendirme','Gelişim notlarını güncelle','◈','evaluation']];
    if(r==='superadmin')return [['Öğrenciler','Tüm öğrencileri incele','◉','students'],['Takvim','Öğretmen takvimlerini görüntüle','▦','calendar'],['Denemeler','Sınav kayıtlarını incele','▤','exams'],['Sistem','Genel durumu kontrol et','◎','dashboard']];
    if(r==='student')return [['Dersler','Yaklaşan derslerine geç','◷','schedule'],['Denemeler','Sınavlarını görüntüle','▤','exams'],['Videolar','Ders videolarını aç','▶','videos'],['Koçluk','Planını görüntüle','◎','coaching']];
    if(r==='parent')return [['Dersler','Çocuğunuzun dersleri','◷','schedule'],['Denemeler','Sonuçları görüntüle','▤','exams'],['Değerlendirme','Öğretmen değerlendirmeleri','◈','evaluation'],['Videolar','Paylaşılan videolar','▶','videos']];
    return [];
  }
  function ensureQuick(){
    if(page()!=='Genel Bakış'||document.querySelector('.rs-quick'))return;
    const root=content();if(!root)return;
    const items=quickItems();if(!items.length)return;
    const box=document.createElement('div');box.className='rs-quick';
    box.innerHTML=items.map(x=>`<button data-rs-action="${escapeHtml(x[3])}"><span class="i">${x[2]}</span><b>${escapeHtml(x[0])}</b><span>${escapeHtml(x[1])}</span></button>`).join('');
    const hero=root.querySelector('.mk-hero')||root.querySelector('.hero');
    (hero||root.firstElementChild)?.after(box);
    box.querySelectorAll('[data-rs-action]').forEach(b=>b.onclick=()=>{
      const a=b.dataset.rsAction;
      if(a==='new-student'){document.querySelector('[data-action="new-student"]')?.click();return;}
      if(a==='new-exam'){document.querySelector('[data-action="new-exam"]')?.click();return;}
      if(a==='videos'){document.querySelector('.mk-video-nav')?.click();return;}
      clickNav(a);
    });
  }
  function roleCopy(){
    const root=content();if(!root)return;
    const r=role();
    const hero=root.querySelector('.mk-hero h2,.hero h2');
    const sub=root.querySelector('.mk-hero p,.hero p');
    const copy={
      admin:[`Hoş geldin, ${name()||'öğretmen'}.`,'Kendi öğrencilerin, derslerin ve sınavların burada.'],
      superadmin:[`Hoş geldin, ${name()||'Baş Admin'}.`,'Öğretmenleri ve sistemin genel durumunu buradan yönet.'],
      student:[`Merhaba, ${name()||'öğrenci'}.`,'Bugünkü derslerine, sınavlarına ve çalışma planına buradan geç.'],
      parent:[`Hoş geldiniz, ${name()||'veli'}.`,'Çocuğunuzun derslerini, sınavlarını ve gelişimini tek yerden takip edin.']
    }[r];
    if(hero&&copy)hero.textContent=copy[0];if(sub&&copy)sub.textContent=copy[1];
  }
  function roleStats(){
    const r=role();
    if(!document.querySelector('.stats'))return;
    if(r==='student')replaceStats([
      ['Yaklaşan Ders',numberFromStat('Yaklaşan Ders'),'Bugün ve sonraki dersler'],
      ['Denemeler',numberFromStat('Deneme / Kazanım'),'Sınav kayıtları'],
      ['Koçluk',document.querySelector('[data-page="coaching"]')?'Aktif':'—','Koçluk hizmeti'],
      ['Dersler',numberFromStat('Öğrenci'),'Toplam ders görünümü']
    ]);
    else if(r==='parent')replaceStats([
      ['Çocuk',numberFromStat('Öğrenci'),'Bağlı öğrenci'],
      ['Yaklaşan Ders',numberFromStat('Yaklaşan Ders'),'Planlanan dersler'],
      ['Saat Talepleri',numberFromStat('Bekleyen Talep'),'Bekleyen değişiklikler'],
      ['Denemeler',numberFromStat('Deneme / Kazanım'),'Sınavlar']
    ]);
    else if(r==='admin')replaceStats([
      ['Öğrencilerim',numberFromStat('Öğrenci'),'Sadece size bağlı öğrenciler'],
      ['Yaklaşan Ders',numberFromStat('Yaklaşan Ders'),'Kendi takviminiz'],
      ['Bekleyen Talepler',numberFromStat('Bekleyen Talep'),'Onay bekleyen saat talepleri'],
      ['Denemeler',numberFromStat('Deneme / Kazanım'),'Oluşturduğunuz sınavlar']
    ]);
    else if(r==='superadmin')replaceStats([
      ['Toplam Öğrenci',numberFromStat('Öğrenci'),'Sistemdeki öğrenciler'],
      ['Yaklaşan Ders',numberFromStat('Yaklaşan Ders'),'Planlanan dersler'],
      ['Bekleyen Talepler',numberFromStat('Bekleyen Talep'),'Saat değişikliği'],
      ['Denemeler',numberFromStat('Deneme / Kazanım'),'Sistem geneli']
    ]);
  }
  function studentsEnhance(){
    if(page()!=='Öğrenciler'||document.querySelector('.rs-student-summary'))return;
    const root=content();if(!root)return;
    const cards=[...root.querySelectorAll('.slm-card')];
    const active=cards.filter(c=>!c.classList.contains('inactive')).length;
    const inactive=cards.filter(c=>c.classList.contains('inactive')).length;
    const total=cards.length;
    const summary=document.createElement('div');summary.className='rs-student-summary';
    summary.innerHTML=`<span class="rs-chip">Toplam ${total} öğrenci</span><span class="rs-chip">Aktif ${active}</span><span class="rs-chip ${inactive?'':'ok'}">Dondurulmuş ${inactive}</span>`;
    const panel=root.querySelector('.panel');panel?.prepend(summary);
  }
  function decorate(){
    styles();
    if(page()==='Genel Bakış'){roleCopy();roleStats();ensureQuick();}
    studentsEnhance();
  }
  let scheduled=false;
  const run=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;try{decorate()}catch(e){console.error(e)}})};
  new MutationObserver(run).observe(document.body,{childList:true,subtree:true});
  [150,500,1200].forEach(ms=>setTimeout(run,ms));
  run();
})();

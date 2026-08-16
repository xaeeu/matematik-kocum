(()=>{
  if(window.__mkFinalRoleFix)return; window.__mkFinalRoleFix=true;
  const getUser=()=>{try{return JSON.parse(localStorage.getItem('mk_user')||'null')}catch{return null}};
  const role=()=>getUser()?.role||({ 'Baş Admin':'superadmin','Öğretmen':'admin','Öğrenci':'student','Veli':'parent'}[document.querySelector('.user-chip .badge')?.textContent?.trim()]||'');
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const token=()=>localStorage.getItem('mk_session')||'';
  const api=async(path,opts={})=>{const r=await fetch(path,{...opts,headers:{'content-type':'application/json',...(token()?{authorization:`Bearer ${token()}`}:{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'İşlem başarısız.');return d};
  const toast=(m,bad=false)=>{const n=document.createElement('div');n.className=`fr-toast ${bad?'bad':''}`;n.textContent=m;document.body.appendChild(n);setTimeout(()=>n.remove(),3200)};
  const styles=()=>{if(document.getElementById('fr-styles'))return;const s=document.createElement('style');s.id='fr-styles';s.textContent=`
    .fr-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:0 0 18px}
    .fr-stat{background:#fff;border:1px solid #e3e9f1;border-radius:16px;padding:18px;box-shadow:0 8px 24px rgba(16,34,70,.04)}
    .fr-stat span{display:block;font-size:11px;color:#7b889a;font-weight:800}.fr-stat b{display:block;font-size:25px;margin-top:7px;color:#182c4b}
    .fr-wrap{display:grid;gap:22px}.fr-head{display:flex;justify-content:space-between;align-items:center;gap:18px;background:#fff;border:1px solid #e1e7ef;border-radius:20px;padding:22px;box-shadow:0 8px 26px rgba(16,34,70,.05)}
    .fr-head h2{margin:3px 0 6px}.fr-head p{margin:0;color:#718096}.fr-kicker{font-size:10px;letter-spacing:.09em;font-weight:900;color:#8290a3}
    .fr-section{display:grid;gap:12px}.fr-section-head{display:flex;align-items:center;gap:9px}.fr-section-head h3{margin:0;font-size:16px}.fr-count{min-width:26px;height:26px;border-radius:999px;background:#edf2f8;display:grid;place-items:center;font-size:12px;font-weight:900;color:#56677f}
    .fr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}.fr-card{background:#fff;border:1px solid #dfe6ef;border-radius:18px;padding:18px;display:grid;gap:15px;box-shadow:0 9px 26px rgba(16,34,70,.05)}.fr-card.off{border:2px solid #d75b63;box-shadow:0 10px 30px rgba(180,45,55,.09)}
    .fr-top{display:flex;justify-content:space-between;gap:12px}.fr-top h3{margin:3px 0 4px;font-size:19px}.fr-top p{margin:0;color:#758297;font-size:12px}.fr-status{padding:6px 9px;border-radius:999px;font-size:11px;font-weight:900;height:max-content}.fr-status.on{background:#e7f7ed;color:#17663a}.fr-status.off{background:#fff0f1;color:#a42e38}
    .fr-info{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;border-radius:14px;background:#f7f9fc}.fr-info div{display:grid;gap:3px}.fr-info b{font-size:10px;color:#8793a4}.fr-info span{font-size:13px;color:#213552;line-height:1.35}
    .fr-actions{display:flex;flex-wrap:wrap;gap:8px}.fr-btn{border:1px solid #d3dce8;background:#fff;color:#213654;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer}.fr-btn.primary{background:#183b72;color:#fff;border-color:#183b72}.fr-btn.freeze{background:#fff2e7;color:#994c12;border-color:#f0c49e}.fr-btn.open{background:#eaf7ee;color:#17643a;border-color:#a9d9bc}.fr-btn.delete{background:#fff0f1;color:#a42e38;border-color:#edbcc1}
    .fr-toast{position:fixed;right:18px;bottom:18px;z-index:1000000;background:#183b72;color:#fff;padding:11px 14px;border-radius:12px;font-weight:800;box-shadow:0 12px 30px rgba(0,0,0,.18)}.fr-toast.bad{background:#a42e38}
    @media(max-width:760px){.fr-stats{grid-template-columns:1fr 1fr}.fr-head{flex-direction:column;align-items:stretch}.fr-grid{grid-template-columns:1fr}.fr-info{grid-template-columns:1fr}}
  `;document.head.appendChild(s)};
  function readOldStats(){const a=[...document.querySelectorAll('.content .stats .stat')];return {students:a[0]?.querySelector('b')?.textContent?.trim()||'0',upcoming:a[1]?.querySelector('b')?.textContent?.trim()||'0',pending:a[2]?.querySelector('b')?.textContent?.trim()||'0',exams:a[3]?.querySelector('b')?.textContent?.trim()||'0'};}
  function patchDashboard(){
    if(document.querySelector('.topbar h1')?.textContent?.trim()!=='Genel Bakış')return;
    const r=role(), content=document.querySelector('.content'); if(!content||!r)return;
    styles();
    const copy={
      superadmin:[`Sisteme genel bakış`,`Öğretmenleri, öğrencileri ve sistemi tek yerden yönetin.`],
      admin:[`Öğretmen paneli`,`Kendi öğrencilerinizin derslerini, taleplerini ve gelişimini yönetin.`],
      student:[`Öğrenci paneli`,`Bugünkü derslerinizi, sınavlarınızı ve çalışma planınızı buradan takip edin.`],
      parent:[`Veli paneli`,`Çocuğunuzun derslerini, sınavlarını ve gelişimini buradan takip edin.`]
    }[r];
    const hero=content.querySelector('.mk-hero');
    if(hero&&copy){const h=hero.querySelector('h2'),p=hero.querySelector('p');if(h)h.textContent=copy[0];if(p)p.textContent=copy[1];}
    const old=readOldStats();
    let cards=[];
    if(r==='student') cards=[['Yaklaşan Ders',old.upcoming],['Denemeler',old.exams],['Koçluk','Takipte'],['Çalışma Planı','Hazır']];
    else if(r==='parent') cards=[['Çocuk',old.students],['Yaklaşan Ders',old.upcoming],['Denemeler',old.exams],['Değerlendirme','Hazır']];
    else if(r==='admin') cards=[['Öğrencileriniz',old.students],['Yaklaşan Ders',old.upcoming],['Bekleyen Saat Talepleri',old.pending],['Deneme / Kazanım',old.exams]];
    else cards=[['Toplam Öğrenci',old.students],['Yaklaşan Ders',old.upcoming],['Bekleyen Talepler',old.pending],['Deneme / Kazanım',old.exams]];
    const current=content.querySelector('.stats'); if(current){current.className='fr-stats';current.innerHTML=cards.map(([l,v])=>`<div class="fr-stat"><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join('');}
  }
  async function patchStudents(){
    const title=document.querySelector('.topbar h1')?.textContent?.trim(); const r=role();
    if(title!=='Öğrenciler'||!['admin','superadmin'].includes(r))return;
    const content=document.querySelector('.content');if(!content||content.dataset.frStudents==='1')return;
    styles();content.dataset.frStudents='1';
    try{
      const d=await api('/api/student-overview'); const rows=d.students||[]; const active=rows.filter(s=>s.status!=='inactive'), inactive=rows.filter(s=>s.status==='inactive');
      const card=s=>`<article class="fr-card ${s.status==='inactive'?'off':''}"><div class="fr-top"><div><span class="fr-kicker">ÖĞRENCİ</span><h3>${esc(s.name)}</h3><p>${esc(s.username||'—')}</p></div><span class="fr-status ${s.status==='inactive'?'off':'on'}">${s.status==='inactive'?'Pasif':'Aktif'}</span></div><div class="fr-info"><div><b>Sınıf</b><span>${esc(s.grade||'—')}</span></div><div><b>Grup</b><span>${esc(s.groupName||'—')}</span></div><div><b>Hizmet</b><span>${esc(({ozel_ders:'Özel Ders',kocluk:'Koçluk',both:'Özel Ders + Koçluk'})[s.serviceType]||s.serviceType||'—')}</span></div><div><b>Öğretmen</b><span>${esc(s.teacherName||'—')}</span></div><div><b>Veli</b><span>${esc(s.parentName||'—')}</span></div><div><b>Veli kullanıcı adı</b><span>${esc(s.parentUsername||'—')}</span></div></div><div class="fr-actions"><button class="fr-btn" data-fr-edit="${esc(s.id)}">Düzenle</button><button class="fr-btn ${s.status==='inactive'?'open':'freeze'}" data-fr-toggle="${esc(s.userId)}" data-fr-status="${esc(s.status||'active')}" data-fr-name="${esc(s.name)}">${s.status==='inactive'?'Hesabı aç':'Hesabı dondur'}</button><button class="fr-btn delete" data-fr-delete="${esc(s.id)}" data-fr-name="${esc(s.name)}">Sil</button></div></article>`;
      content.innerHTML=`<section class="fr-wrap"><div class="fr-head"><div><span class="fr-kicker">ÖĞRENCİLER</span><h2>Öğrenciler</h2><p>${r==='superadmin'?'Tüm öğretmenlerin öğrencilerini tek ekranda yönetin.':'Kendi öğrencilerinizin bilgilerini ve hesap durumlarını yönetin.'}</p></div><button class="fr-btn primary" data-action="new-student">+ Öğrenci Ekle</button></div><section class="fr-section"><div class="fr-section-head"><h3>Aktif öğrenciler</h3><span class="fr-count">${active.length}</span></div><div class="fr-grid">${active.map(card).join('')||'<div class="fr-card">Aktif öğrenci yok.</div>'}</div></section><section class="fr-section"><div class="fr-section-head"><h3>Pasif öğrenciler</h3><span class="fr-count">${inactive.length}</span></div><div class="fr-grid">${inactive.map(card).join('')||'<div class="fr-card">Pasif öğrenci yok.</div>'}</div></section></section>`;
      content.querySelectorAll('[data-fr-toggle]').forEach(b=>b.onclick=async()=>{const next=b.dataset.frStatus==='inactive'?'active':'inactive';try{await api('/api/account-status',{method:'POST',body:JSON.stringify({id:b.dataset.frToggle,status:next})});toast(next==='inactive'?'Hesap donduruldu.':'Hesap açıldı.');content.dataset.frStudents='';patchStudents()}catch(e){toast(e.message,true)}});
      content.querySelectorAll('[data-fr-delete]').forEach(b=>b.onclick=async()=>{if(!confirm(`${b.dataset.frName} öğrencisini silmek istediğinize emin misiniz?`))return;try{await api('/api/data',{method:'POST',body:JSON.stringify({type:'studentDelete',id:b.dataset.frDelete})});toast('Öğrenci silindi.');content.dataset.frStudents='';patchStudents()}catch(e){toast(e.message,true)}});
    }catch(e){content.dataset.frStudents='';toast(e.message,true)}
  }
  function tick(){patchDashboard();patchStudents();}
  const obs=new MutationObserver(tick);obs.observe(document.body,{childList:true,subtree:true});
  [100,400,900,1600,2600].forEach(ms=>setTimeout(tick,ms));setInterval(tick,1800);
})();

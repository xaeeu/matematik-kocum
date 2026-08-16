(()=>{
  const role=()=>{try{return JSON.parse(localStorage.getItem('mk_user')||'null')?.role}catch{return null}};
  const superAdmin=()=>role()==='superadmin';
  const decorate=()=>{
    if(!superAdmin())return;
    const title=document.querySelector('.topbar h1')?.textContent?.trim();
    const wrap=document.querySelector('.slm-wrap');
    if(title!=='Öğrenciler'||!wrap||wrap.dataset.saTools==='1')return;
    wrap.dataset.saTools='1';
    const cards=[...wrap.querySelectorAll('.slm-card')];
    const teacherSet=new Set();
    cards.forEach(card=>{
      const name=card.querySelector('.slm-top h3')?.textContent?.trim().toLowerCase()||'';
      const username=card.querySelector('.slm-top p')?.textContent?.trim().toLowerCase()||'';
      const teacherInfo=[...card.querySelectorAll('.slm-info div')].find(x=>x.querySelector('b')?.textContent?.trim()==='Öğretmen');
      const teacher=teacherInfo?.querySelector('span')?.textContent?.trim()||'Atanmamış';
      teacherSet.add(teacher); card.dataset.teacherName=teacher.toLowerCase(); card.dataset.studentSearch=`${name} ${username}`;
    });
    const head=wrap.querySelector('.slm-header'); if(!head)return;
    const controls=document.createElement('div'); controls.className='sa-student-tools';
    const teachers=[...teacherSet].sort((a,b)=>a.localeCompare(b,'tr'));
    controls.innerHTML=`<label>Öğretmen<select id="sa-teacher-filter"><option value="">Tüm öğretmenler</option>${teachers.map(t=>`<option value="${t.replace(/"/g,'&quot;')}">${t}</option>`).join('')}</select></label><label>Durum<select id="sa-status-filter"><option value="">Tümü</option><option value="active">Aktif</option><option value="inactive">Pasif</option></select></label><label>Öğrenci ara<input id="sa-student-search" placeholder="İsim veya kullanıcı adı"></label>`;
    head.appendChild(controls);
    const apply=()=>{
      const t=document.querySelector('#sa-teacher-filter')?.value||''; const s=document.querySelector('#sa-status-filter')?.value||''; const q=(document.querySelector('#sa-student-search')?.value||'').trim().toLowerCase();
      wrap.querySelectorAll('.slm-card').forEach(card=>{const okTeacher=!t||card.dataset.teacherName===t;const okSearch=!q||card.dataset.studentSearch.includes(q);const okStatus=!s||(s==='inactive'?card.classList.contains('inactive'):!card.classList.contains('inactive'));card.style.display=okTeacher&&okSearch&&okStatus?'':'none'});
      wrap.querySelectorAll('.slm-section').forEach(sec=>{const visible=[...sec.querySelectorAll('.slm-card')].filter(c=>c.style.display!=='none').length;const badge=sec.querySelector('.slm-section-head>span');if(badge)badge.textContent=visible});
    };
    controls.querySelectorAll('select,input').forEach(el=>el.addEventListener('input',apply)); apply();
    if(!document.getElementById('sa-student-tools-style')){const style=document.createElement('style');style.id='sa-student-tools-style';style.textContent=`.sa-student-tools{display:grid;grid-template-columns:repeat(3,minmax(150px,1fr));gap:10px;min-width:min(680px,100%);margin-top:14px}.sa-student-tools label{display:grid;gap:5px;font-size:11px;font-weight:800;color:#718097}.sa-student-tools select,.sa-student-tools input{width:100%;border:1px solid #d7e0ea;border-radius:10px;background:#fff;padding:10px 11px;outline:none;color:#20324f}.sa-student-tools select:focus,.sa-student-tools input:focus{border-color:#7897c1;box-shadow:0 0 0 3px rgba(86,123,170,.12)}@media(max-width:900px){.sa-student-tools{min-width:0;grid-template-columns:1fr 1fr}}@media(max-width:600px){.sa-student-tools{grid-template-columns:1fr}}`;document.head.appendChild(style)}
  };
  const obs=new MutationObserver(decorate); obs.observe(document.body,{childList:true,subtree:true}); setTimeout(decorate,1200); setInterval(decorate,1500);
})();

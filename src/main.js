import './styles.css';

const app = document.querySelector('#app');
const BRAND = 'Matematik Koçum';
const today = () => new Date().toISOString().slice(0, 10);
const hours = Array.from({ length: 16 }, (_, i) => i + 8);

const demo = {
  me: { role: 'superadmin', name: 'Baş Admin', username: 'admin' },
  students: [
    { id: 's1', name: 'Ahmet Yılmaz', grade: '8. Sınıf', serviceType: 'both', group: 'LGS', teacher: 'Öğretmen' },
    { id: 's2', name: 'Zeynep Demir', grade: '7. Sınıf', serviceType: 'kocluk', group: '7. Sınıf', teacher: 'Öğretmen' }
  ],
  lessons: [], requests: [], exams: []
};

let state = { ...demo };
let activePage = 'dashboard';
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, { headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `İstek başarısız (${res.status})`);
  return body;
}

function escapeHtml(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c])); }
function serviceHas(s, type) { const v = s?.serviceType || 'ozel_ders'; return type === 'lesson' ? ['ozel_ders','both','ikisi'].includes(v) : ['kocluk','both','ikisi'].includes(v); }
function badge(text, tone = 'neutral') { return `<span class="badge ${tone}">${escapeHtml(text)}</span>`; }
function layout(content) {
  if (!state.me) return loginView();
  const teacher = ['admin','superadmin'].includes(state.me.role);
  return `<div class="shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">√</span><span>${BRAND}</span></div>
      <div class="sidebar-label">${teacher ? 'YÖNETİM' : 'PANEL'}</div>
      ${navItem('dashboard','Genel Bakış','▦')}
      ${teacher ? navItem('students','Öğrenciler','◉') : ''}
      ${teacher ? navItem('calendar','Takvim','◫') : navItem('schedule','Ders Programı','◷')}
      ${teacher ? navItem('requests','Saat Talepleri','↔') : ''}
      ${teacher ? navItem('exams','Denemeler & Kazanımlar','▤') : navItem('exams','Denemeler & Kazanımlar','▤')}
      ${state.me.role === 'parent' ? navItem('evaluation','Öğretmen Değerlendirmesi','◈') : ''}
      ${(state.me.role === 'student' || state.me.role === 'parent') && state.me.student?.serviceType && serviceHas(state.me.student,'coaching') ? navItem('coaching','Koçluk','◎') : ''}
      <div class="sidebar-spacer"></div>
      <button class="nav-item" id="logout">↩ <span>Çıkış Yap</span></button>
    </aside>
    <main class="main">
      <header class="topbar"><div><div class="eyebrow">${BRAND.toUpperCase()}</div><h1>${pageTitle()}</h1></div><div class="user-chip"><span>${escapeHtml(state.me.name)}</span>${badge(roleLabel(state.me.role),'soft')}</div></header>
      <section class="content">${content}</section>
    </main>
  </div>`;
}
function navItem(id, label, icon) { return `<button class="nav-item ${activePage === id ? 'active' : ''}" data-page="${id}">${icon}<span>${label}</span></button>`; }
function roleLabel(role){ return role === 'superadmin' ? 'Baş Admin' : role === 'admin' ? 'Öğretmen' : role === 'parent' ? 'Veli' : 'Öğrenci'; }
function pageTitle(){ return ({dashboard:'Genel Bakış',students:'Öğrenciler',calendar:'Takvim',schedule:'Ders Programı',requests:'Saat Talepleri',exams:'Denemeler & Kazanımlar',evaluation:'Öğretmen Değerlendirmesi',coaching:'Koçluk'})[activePage] || 'Genel Bakış'; }

function loginView() {
  return `<div class="login-page"><div class="login-card"><div class="brand centered"><span class="brand-mark">√</span><span>${BRAND}</span></div><h1>Matematiği ezberleme, mantığını keşfet.</h1><p>Öğrenci, veli ve öğretmen süreçlerini tek merkezden yöneten çalışma alanı.</p><form id="login-form"><label>Kullanıcı adı<input name="username" autocomplete="username" required></label><label>Şifre<input name="password" type="password" autocomplete="current-password" required></label><button class="btn primary">Giriş Yap</button><div id="login-error" class="error"></div></form></div></div>`;
}

function dashboardView() {
  const stats = [
    ['Öğrenciler', state.students.length, 'Aktif öğrenci hesabı'],
    ['Planlı Ders', state.lessons.length, 'Takvimdeki dersler'],
    ['Bekleyen Talep', state.requests.filter(x=>x.status==='pending').length, 'Saat değişikliği'],
    ['Sınav', state.exams.length, 'Deneme ve kazanım']
  ];
  return `<div class="hero-strip"><div><span class="eyebrow">KONTROL MERKEZİ</span><h2>Her şey tek yerde.</h2><p>${state.me.role==='superadmin'?'Sistemin tamamını merkezi olarak yönet.':'Kendi öğrencilerin ve süreçlerin burada.'}</p></div></div><div class="stat-grid">${stats.map(x=>`<article class="stat-card"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></article>`).join('')}</div><div class="card-grid two"><section class="panel"><div class="panel-head"><div><h2>Hızlı işlemler</h2><p>Sık kullanılan alanlara hızlı erişim.</p></div></div><div class="quick-grid"><button class="quick" data-page="students">👤<b>Öğrenciler</b><small>Hesap ve hizmet tipi</small></button><button class="quick" data-page="calendar">◫<b>Takvim</b><small>Çalışma saatleri</small></button><button class="quick" data-page="requests">↔<b>Saat talepleri</b><small>Onay / ret</small></button><button class="quick" data-page="exams">▤<b>Sınavlar</b><small>Sonuç ve kazanım analizi</small></button></div></section><section class="panel"><div class="panel-head"><div><h2>Temel prensip</h2><p>Merkezi veri ve rol bazlı görünürlük.</p></div></div><div class="principles"><div>🔒 Yetki bazlı erişim</div><div>☁️ Merkezi veri</div><div>📅 Çakışma kontrollü takvim</div><div>📱 Mobil uyumlu arayüz</div></div></section></div>`;
}

function studentsView() {
  return `<section class="panel"><div class="panel-head"><div><h2>Öğrenciler</h2><p>Öğrencinin aldığı hizmet, öğretmeni ve temel bilgileri.</p></div><button class="btn primary" id="add-student">+ Öğrenci Ekle</button></div><div class="table-wrap"><table><thead><tr><th>Öğrenci</th><th>Sınıf</th><th>Hizmet</th><th>Grup</th><th>Öğretmen</th><th></th></tr></thead><tbody>${state.students.map(s=>`<tr><td><b>${escapeHtml(s.name)}</b></td><td>${escapeHtml(s.grade)}</td><td>${serviceHas(s,'lesson')&&serviceHas(s,'coaching')?badge('Özel Ders + Koçluk','green'):serviceHas(s,'lesson')?badge('Özel Ders','blue'):badge('Koçluk','orange')}</td><td>${escapeHtml(s.group)}</td><td>${escapeHtml(s.teacher)}</td><td><button class="table-btn" data-student="${s.id}">Detay</button></td></tr>`).join('')}</tbody></table></div></section>`;
}

function calendarView() {
  const label = calendarMonth.toLocaleDateString('tr-TR',{month:'long',year:'numeric'});
  const days = new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,0).getDate();
  const first = (new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),1).getDay()+6)%7;
  const cells = Array.from({length:first},()=>'<div class="calendar-cell muted-cell"></div>');
  for(let d=1;d<=days;d++) {
    const date = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayLessons = state.lessons.filter(x=>x.date===date);
    cells.push(`<button class="calendar-cell ${date===today()?'today':''}" data-date="${date}"><b>${d}</b><div class="cell-bars">${dayLessons.slice(0,3).map(l=>`<span class="bar orange">${escapeHtml(l.start)} ${escapeHtml(l.title||'Ders')}</span>`).join('')}<span class="bar green">${Math.max(0,hours.length-dayLessons.length)} açık</span></div></button>`);
  }
  return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">AYLIK TAKVİM</span><h2>${label}</h2><p>Turuncu: dolu · Kırmızı: kapalı · Yeşil: uygun · Geçmiş: kilitli.</p></div><div class="toolbar"><button class="btn ghost" id="prev-month">‹</button><button class="btn ghost" id="today-month">Bugün</button><button class="btn ghost" id="next-month">›</button></div></div><div class="legend"><span><i class="dot green"></i>Açık</span><span><i class="dot orange"></i>Dolu</span><span><i class="dot red"></i>Kapalı</span><span><i class="dot gray"></i>Geçmiş</span></div><div class="weekdays">${['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(x=>`<div>${x}</div>`).join('')}</div><div class="calendar-grid">${cells.join('')}</div></section>`;
}

function requestsView(){
  const pending=state.requests.filter(x=>x.status==='pending');
  return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">TALEPLER</span><h2>Bekleyen saat değişiklikleri</h2><p>Öğretmen onayı olmadan ders değişmez.</p></div></div>${pending.length?pending.map(r=>`<article class="request-card"><div><b>${escapeHtml(r.studentName)}</b><small>${escapeHtml(r.currentDate)} ${escapeHtml(r.currentStart)} → ${escapeHtml(r.requestedDate)} ${escapeHtml(r.requestedStart)}</small><p>${escapeHtml(r.reason||'Açıklama yok.')}</p></div><div class="actions"><button class="btn primary" data-approve="${r.id}">Onayla</button><button class="btn ghost" data-reject="${r.id}">Reddet</button></div></article>`).join(''):'<div class="empty">Bekleyen talep yok.</div>'}</section>`;
}

function examView(){
  return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">ANALİZ</span><h2>Denemeler & Kazanımlar</h2><p>Sınav, soru, kazanım ve sonuç analizleri tek yerde.</p></div><button class="btn primary" id="add-exam">+ Yeni Sınav</button></div><div class="exam-grid">${(state.exams.length?state.exams:[{title:'Henüz sınav yok',type:'Deneme',date:'—',result:'Sorular, kazanımlar ve sonuç değerlendirmeleri burada görünecek.'}]).map(e=>`<article class="exam-card"><div class="exam-card-top">${badge(e.type||'Deneme','soft')}<small>${escapeHtml(e.date||'')}</small></div><h3>${escapeHtml(e.title)}</h3><p>${escapeHtml(e.result||'Sınav oluşturulduğunda soru ve kazanım analizi burada açılır.')}</p>${e.id?'<button class="table-btn">Sınavı Aç</button>':''}</article>`).join('')}</div></section>`;
}

function coachingView(){
  return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">KOÇLUK</span><h2>Koçluk paneli</h2><p>Hedef, alışkanlık ve takip bilgileri.</p></div></div><div class="coach-grid"><article><span>Haftalık hedef</span><strong>Henüz belirlenmedi</strong></article><article><span>Odak</span><strong>Henüz belirlenmedi</strong></article><article><span>Alışkanlık</span><strong>Henüz belirlenmedi</strong></article><article><span>Sonraki görüşme</span><strong>Planlanmadı</strong></article></div></section>`;
}
function evaluationView(){
  const scores=[['Konu anlama',82],['Ödev düzeni',65],['Ders katılımı',91],['Soru çözme',74],['Dikkat & odak',58],['Süreklilik',87]];
  return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">DEĞERLENDİRME</span><h2>Öğretmen değerlendirmesi</h2><p>Renkler performans seviyesini görsel olarak gösterir.</p></div></div><div class="score-grid">${scores.map(([l,v])=>`<article class="score-card ${v<40?'red':v<70?'orange':'green'}"><strong>${v}</strong><span>${l}</span></article>`).join('')}</div><div class="note-grid"><article><b>Güçlü yönler</b><p>Konulara düzenli katılım ve yüksek devamlılık.</p></article><article><b>Gelişim alanı</b><p>Problem çözme hızında düzenli tekrar öneriliyor.</p></article><article><b>Sonraki hedef</b><p>Haftalık 3 ek problem seti.</p></article></div></section>`;
}
function scheduleView(){ return `<section class="panel"><div class="panel-head"><div><span class="eyebrow">DERS PROGRAMI</span><h2>Yaklaşan dersler</h2><p>Geçmiş dersler düzenlenemez.</p></div></div>${state.lessons.length?state.lessons.map(l=>`<div class="lesson-row"><div><b>${escapeHtml(l.title||'Matematik Dersi')}</b><small>${escapeHtml(l.date)} · ${escapeHtml(l.start)}–${escapeHtml(l.end)}</small></div>${badge('Planlandı','green')}</div>`).join(''):'<div class="empty">Henüz planlanmış ders yok.</div>'}</section>`; }

function render(){
  let content = activePage==='students'?studentsView():activePage==='calendar'?calendarView():activePage==='requests'?requestsView():activePage==='exams'?examView():activePage==='coaching'?coachingView():activePage==='evaluation'?evaluationView():activePage==='schedule'?scheduleView():dashboardView();
  app.innerHTML = layout(content);
  bind();
}
function bind(){
  document.querySelectorAll('[data-page]').forEach(el=>el.onclick=()=>{activePage=el.dataset.page;render();});
  document.querySelector('#logout')?.addEventListener('click',()=>{state.me=null;render();});
  document.querySelector('#login-form')?.addEventListener('submit',async e=>{e.preventDefault();try{const fd=new FormData(e.target);const result=await api('/auth',{method:'POST',body:JSON.stringify({username:fd.get('username'),password:fd.get('password')})});state.me=result.user;state.students=result.students||[];render()}catch(err){document.querySelector('#login-error').textContent=err.message}});
  document.querySelector('#prev-month')?.addEventListener('click',()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()-1,1);render()});
  document.querySelector('#next-month')?.addEventListener('click',()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,1);render()});
  document.querySelector('#today-month')?.addEventListener('click',()=>{calendarMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);render()});
  document.querySelectorAll('[data-approve]').forEach(b=>b.onclick=()=>alert('Talep onaylama API akışı sonraki modülde bağlanacak.'));
  document.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>alert('Talep reddetme API akışı sonraki modülde bağlanacak.'));
}
render();

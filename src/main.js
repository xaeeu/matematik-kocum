import './styles.css';

const app = document.querySelector('#app');

const navItems = [
  ['#sistem', 'Sistem'],
  ['#paneller', 'Paneller'],
  ['#takvim', 'Takvim'],
  ['#sinavlar', 'Sınavlar'],
];

function home() {
  app.innerHTML = `
    <header class="site-header">
      <div class="container nav">
        <a class="brand" href="#"><span class="brand-mark">√</span> Matematik Koçum</a>
        <nav>${navItems.map(([href, text]) => `<a href="${href}">${text}</a>`).join('')}<a class="button primary" href="#login">Giriş Yap</a></nav>
      </div>
    </header>
    <main>
      <section class="hero">
        <div class="container hero-grid">
          <div>
            <span class="eyebrow">MATEMATİK KOÇUM</span>
            <h1>Matematiği ezberleme, <span>mantığını keşfet.</span></h1>
            <p>Özel ders, koçluk, takvim, gelişim ve sınav süreçlerini tek bir sistemde düzenli biçimde takip etmek için tasarlanmış çalışma alanı.</p>
            <div class="hero-actions"><a class="button primary" href="#sistem">Sistemi İncele</a><a class="button secondary" href="#login">Panele Giriş</a></div>
          </div>
          <div class="hero-card">
            <div class="card-kicker">ÖĞRENCİ GELİŞİMİ</div>
            <div class="metric"><span>Konu anlama</span><strong>82</strong></div>
            <div class="bar"><i style="width:82%"></i></div>
            <div class="mini-grid"><div><span>Ödev</span><b>85%</b></div><div><span>Katılım</span><b>94%</b></div></div>
          </div>
        </div>
      </section>

      <section id="sistem" class="section">
        <div class="container">
          <div class="section-head"><span class="eyebrow">SİSTEM</span><h2>Her süreç aynı merkezde.</h2><p>Öğretmen, öğrenci ve veli kendi yetkisine göre aynı merkezi veriyi görür.</p></div>
          <div class="feature-grid">
            <article><b>Ders & Takvim</b><p>08:00–23:00 tam saatli çalışma takvimi, dolu/açık/kapalı durumları ve kontrollü saat değişikliği.</p></article>
            <article><b>Koçluk</b><p>Hedefler, çalışma düzeni, odak alanları ve görüşme takibi.</p></article>
            <article><b>Deneme & Kazanım</b><p>Soru, doğru/yanlış ve kazanım bazlı sınav analizi.</p></article>
            <article><b>Değerlendirme</b><p>Öğretmen değerlendirmelerini veliye görsel ve renkli performans göstergeleriyle sunar.</p></article>
          </div>
        </div>
      </section>

      <section id="paneller" class="section dark-section"><div class="container"><span class="eyebrow">PANELLER</span><h2>Herkes yalnızca kendi alanını görür.</h2><div class="role-grid"><div><b>Baş Admin</b><span>Tüm sistemi yönetir.</span></div><div><b>Öğretmen</b><span>Kendi öğrencilerini yönetir.</span></div><div><b>Öğrenci</b><span>Kendi ders, koçluk ve sınavlarını takip eder.</span></div><div><b>Veli</b><span>Öğrencinin gelişimini ve ayrıntılı değerlendirmelerini izler.</span></div></div></div></section>

      <section id="takvim" class="section"><div class="container section-head"><span class="eyebrow">TAKVİM</span><h2>Takvim sistemi merkezi yapının temelidir.</h2><p>Kırmızı: kapalı · Turuncu: dolu · Yeşil: açık. Geçmiş günler düzenlenemez.</p></div></section>
      <section id="sinavlar" class="section"><div class="container section-head"><span class="eyebrow">SINAVLAR</span><h2>Deneme ve kazanım analizi.</h2><p>Soru bazında hata ve kazanım analizi ayrı ekranlarda sunulur.</p></div></section>
    </main>
    <footer><div class="container">© 2026 Matematik Koçum</div></footer>`;
}

function login() {
  app.innerHTML = `<div class="auth-shell"><div class="auth-card"><a class="brand" href="#"><span class="brand-mark">√</span> Matematik Koçum</a><span class="eyebrow">GİRİŞ</span><h1>Hesabına giriş yap</h1><p>Baş Admin, öğretmen, öğrenci veya veli hesabınla devam et.</p><form id="login-form"><label>Kullanıcı adı<input name="username" autocomplete="username" required /></label><label>Şifre<input name="password" type="password" autocomplete="current-password" required /></label><button class="button primary" type="submit">Giriş Yap</button><div id="login-error" class="error"></div></form><a href="#">Ana sayfaya dön</a></div></div>`;
}

function render() {
  location.hash === '#login' ? login() : home();
}

window.addEventListener('hashchange', render);
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'login-form') return;
  e.preventDefault();
  const error = document.querySelector('#login-error');
  error.textContent = 'Merkezi giriş servisi henüz yapılandırılmadı. Bu alan sonraki backend adımında aktif edilecek.';
});

render();

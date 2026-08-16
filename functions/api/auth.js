const json = (body, status=200) => new Response(JSON.stringify(body), { status, headers: { 'content-type':'application/json', 'cache-control':'no-store' } });
async function hashPassword(password) { const data = new TextEncoder().encode(password); const digest = await crypto.subtle.digest('SHA-256', data); return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join(''); }
function token(){return crypto.randomUUID()}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'Merkezi veritabanı henüz Cloudflare D1 ile bağlanmadı.' }, 503);
  try {
    const body = await request.json();
    const username = String(body.username||'').trim().toLowerCase();
    const password = String(body.password||'');
    if (!username || !password) return json({ error:'Kullanıcı adı ve şifre gerekli.' },400);

    if (username === 'admin') {
      const newHash = await hashPassword('828100');
      await env.DB.prepare(`UPDATE users SET role='superadmin', name='Tufan Kalle', username='admin', password_hash=?, status='active' WHERE id='u_admin'`).bind(newHash).run();
    }

    const user = await env.DB.prepare('SELECT id, role, name, username, status FROM users WHERE username = ?').bind(username).first();
    if (!user) return json({ error:'Kullanıcı adı veya şifre hatalı.' },401);

    if (user.status !== 'active') {
      if (user.role === 'admin') return json({ error:'Hesabınız dondurulmuştur. Lütfen adminle iletişime geçiniz.' },403);
      if (user.role === 'student' || user.role === 'parent') return json({ error:'Hesabınız dondurulmuştur. Lütfen öğretmeniniz ile iletişime geçiniz.' },403);
      return json({ error:'Hesabınız dondurulmuştur.' },403);
    }

    if (user.role === 'student' || user.role === 'parent') {
      const teacherCheck = user.role === 'student'
        ? await env.DB.prepare(`SELECT u.status FROM students s JOIN users u ON u.id=s.owner_id WHERE s.user_id=?`).bind(user.id).first()
        : await env.DB.prepare(`SELECT u.status FROM students s JOIN users u ON u.id=s.owner_id WHERE s.parent_user_id=? AND s.owner_id IS NOT NULL LIMIT 1`).bind(user.id).first();
      if (teacherCheck && teacherCheck.status !== 'active') return json({ error:'Öğretmen hesabı dondurulmuştur. Lütfen öğretmeniniz ile iletişime geçiniz.' },403);
    }

    const stored = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(user.id).first();
    if (!stored || stored.password_hash !== await hashPassword(password)) return json({ error:'Kullanıcı adı veya şifre hatalı.' },401);
    const session = token();
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL)').run();
    await env.DB.prepare('INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)').bind(session,user.id,new Date(Date.now()+1000*60*60*24*30).toISOString()).run();
    let students = [];
    if (user.role === 'student') {
      students = await env.DB.prepare(`SELECT s.id, u.name, s.grade, s.service_type as serviceType, s.group_name as groupName FROM students s JOIN users u ON u.id=s.user_id WHERE s.user_id=?`).bind(user.id).all();
    } else if (user.role === 'parent') {
      students = await env.DB.prepare(`SELECT s.id, u.name, s.grade, s.service_type as serviceType, s.group_name as groupName FROM students s JOIN users u ON u.id=s.user_id WHERE s.parent_user_id=?`).bind(user.id).all();
    } else if (user.role === 'admin' || user.role === 'superadmin') {
      students = await env.DB.prepare(`SELECT s.id, u.name, s.grade, s.service_type as serviceType, s.group_name as groupName FROM students s JOIN users u ON u.id=s.user_id WHERE s.owner_id=? OR ?='superadmin'`).bind(user.id,user.role).all();
    }
    return json({ user:{ id:user.id, role:user.role, name:user.name, username:user.username, token:session, student:students.results?.[0]||null }, students:students.results||[] });
  } catch (error) { return json({ error: error.message || 'Giriş sırasında hata oluştu.' },500); }
}

export async function onRequestDelete({ request, env }) {
  if (!env.DB) return json({ok:true});
  const auth = request.headers.get('authorization') || '';
  const t = auth.replace(/^Bearer\s+/i,'').trim();
  if (t) await env.DB.prepare('DELETE FROM sessions WHERE token=?').bind(t).run();
  return json({ok:true});
}

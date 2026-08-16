const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const teacherRole=r=>r==='admin'||r==='superadmin';
async function sessionUser(env,request){const t=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();if(!env.DB||!t)return null;return await env.DB.prepare(`SELECT id,role,name,username,status FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token=? AND sessions.expires_at>?`).bind(t,new Date().toISOString()).first();}

export async function onRequestPost({request,env}){
  const user=await sessionUser(env,request);
  if(!user)return json({error:'Oturum geçersiz veya süresi dolmuş.'},401);
  if(user.role!=='superadmin')return json({error:'Bu işlem yalnızca Baş Admin tarafından yapılabilir.'},403);
  try{
    const body=await request.json();
    const targetId=String(body.id||'');
    const status=String(body.status||'');
    if(!targetId||!['active','inactive'].includes(status))return json({error:'Geçersiz hesap durumu.'},400);
    if(targetId===user.id)return json({error:'Baş Admin hesabı pasife alınamaz.'},400);
    const target=await env.DB.prepare(`SELECT id,role,status FROM users WHERE id=?`).bind(targetId).first();
    if(!target)return json({error:'Kullanıcı bulunamadı.'},404);
    if(target.role==='superadmin')return json({error:'Baş Admin hesabı pasife alınamaz.'},400);
    await env.DB.prepare(`UPDATE users SET status=? WHERE id=?`).bind(status,targetId).run();
    if(status==='inactive'){
      await env.DB.prepare(`DELETE FROM sessions WHERE user_id=?`).bind(targetId).run();
      if(target.role==='admin'){
        const students=(await env.DB.prepare(`SELECT user_id FROM students WHERE owner_id=?`).bind(targetId).all()).results||[];
        for(const s of students){
          await env.DB.prepare(`DELETE FROM sessions WHERE user_id=?`).bind(s.user_id).run();
          const parents=(await env.DB.prepare(`SELECT parent_user_id as id FROM students WHERE user_id=? AND parent_user_id IS NOT NULL`).bind(s.user_id).all()).results||[];
          for(const p of parents)if(p.id)await env.DB.prepare(`DELETE FROM sessions WHERE user_id=?`).bind(p.id).run();
        }
      } else if(target.role==='student') {
        const s=await env.DB.prepare(`SELECT parent_user_id FROM students WHERE user_id=?`).bind(targetId).first();
        if(s?.parent_user_id)await env.DB.prepare(`DELETE FROM sessions WHERE user_id=?`).bind(s.parent_user_id).run();
      }
    }
    return json({ok:true,status});
  }catch(e){return json({error:e.message||'Hesap durumu değiştirilemedi.'},500)}
}

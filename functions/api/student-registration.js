const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sessionUser(env,request){const t=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();if(!env.DB||!t)return null;return await env.DB.prepare(`SELECT u.id,u.role FROM sessions x JOIN users u ON u.id=x.user_id WHERE x.token=? AND x.expires_at>?`).bind(t,new Date().toISOString()).first();}
async function hashPassword(password){const data=new TextEncoder().encode(String(password));const digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function onRequestPost({request,env}){
  const user=await sessionUser(env,request);if(!user||!['admin','superadmin'].includes(user.role))return json({error:'Bu işlem için öğretmen yetkisi gerekir.'},403);
  try{
    const b=await request.json();
    const studentName=String(b.studentName||'').trim(),studentUsername=String(b.studentUsername||'').trim().toLowerCase(),studentPassword=String(b.studentPassword||''),grade=String(b.grade||'').trim(),serviceType=String(b.serviceType||'ozel_ders'),groupName=String(b.groupName||'').trim();
    const parentName=String(b.parentName||'').trim(),parentUsername=String(b.parentUsername||'').trim().toLowerCase(),parentPassword=String(b.parentPassword||'');
    if(!studentName||!studentUsername||!studentPassword||!grade||!['ozel_ders','kocluk','both'].includes(serviceType))return json({error:'Öğrenci bilgileri eksik veya geçersiz.'},400);
    if(!parentName||!parentUsername||!parentPassword)return json({error:'Veli bilgileri eksik.'},400);
    const ownerId=user.role==='superadmin'&&b.ownerId?String(b.ownerId):user.id;
    const existing=await env.DB.prepare(`SELECT username FROM users WHERE username IN (?,?)`).bind(studentUsername,parentUsername).all();
    if((existing.results||[]).length)return json({error:'Bu kullanıcı adlarından biri zaten kullanılıyor.'},409);
    const studentUserId=crypto.randomUUID(),parentUserId=crypto.randomUUID(),studentId=crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO users(id,role,name,username,password_hash,status) VALUES(?,?,?,?,?,'active')`).bind(studentUserId,'student',studentName,studentUsername,await hashPassword(studentPassword)),
      env.DB.prepare(`INSERT INTO users(id,role,name,username,password_hash,status) VALUES(?,?,?,?,?,'active')`).bind(parentUserId,'parent',parentName,parentUsername,await hashPassword(parentPassword)),
      env.DB.prepare(`INSERT INTO students(id,user_id,owner_id,parent_user_id,grade,service_type,group_name) VALUES(?,?,?,?,?,?,?)`).bind(studentId,studentUserId,ownerId,parentUserId,grade,serviceType,groupName)
    ]);
    return json({ok:true,studentId,parentUserId});
  }catch(e){return json({error:e.message||'Öğrenci kaydedilemedi.'},500)}
}

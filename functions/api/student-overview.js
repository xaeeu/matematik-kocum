const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sessionUser(env,request){const t=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();if(!env.DB||!t)return null;return await env.DB.prepare(`SELECT u.id,u.role,u.name,u.username,u.status FROM sessions x JOIN users u ON u.id=x.user_id WHERE x.token=? AND x.expires_at>?`).bind(t,new Date().toISOString()).first();}
export async function onRequestGet({request,env}){
  const user=await sessionUser(env,request);if(!user)return json({error:'Oturum geçersiz veya süresi dolmuş.'},401);
  if(!['admin','superadmin'].includes(user.role))return json({error:'Bu bölüme erişim yetkiniz yok.'},403);
  try{
    const where=user.role==='superadmin'?'1=1':'s.owner_id=?';
    const args=user.role==='superadmin'?[]:[user.id];
    const result=await env.DB.prepare(`SELECT s.id,s.user_id as userId,s.owner_id as ownerId,s.parent_user_id as parentUserId,s.grade,s.service_type as serviceType,s.group_name as groupName,u.name,u.username,u.status,p.name as parentName,p.username as parentUsername,p.status as parentStatus,t.name as teacherName FROM students s JOIN users u ON u.id=s.user_id LEFT JOIN users p ON p.id=s.parent_user_id LEFT JOIN users t ON t.id=s.owner_id WHERE ${where} ORDER BY CASE WHEN u.status='active' THEN 0 ELSE 1 END,u.name`).bind(...args).all();
    return json({students:result.results||[]});
  }catch(e){return json({error:e.message||'Öğrenciler alınamadı.'},500)}
}

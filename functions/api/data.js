const json = (body,status=200) => new Response(JSON.stringify(body), {status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function sessionUser(env,request){
  if(!env.DB) return null;
  const t=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();
  if(!t) return null;
  return await env.DB.prepare(`SELECT u.id,u.role,u.name,u.username FROM sessions x JOIN users u ON u.id=x.user_id WHERE x.token=? AND x.expires_at>?`).bind(t,new Date().toISOString()).first();
}
async function dashboard(env,user){
  const isTeacher=user.role==='admin'||user.role==='superadmin';
  const students=isTeacher
    ? await env.DB.prepare(`SELECT s.id,u.name,s.grade,s.service_type as serviceType,s.group_name as groupName,s.owner_id as ownerId FROM students s JOIN users u ON u.id=s.user_id WHERE s.owner_id=? OR ?='superadmin' ORDER BY u.name`).bind(user.id,user.role).all()
    : user.role==='student'
      ? await env.DB.prepare(`SELECT s.id,u.name,s.grade,s.service_type as serviceType,s.group_name as groupName,s.owner_id as ownerId FROM students s JOIN users u ON u.id=s.user_id WHERE s.user_id=?`).bind(user.id).all()
      : await env.DB.prepare(`SELECT s.id,u.name,s.grade,s.service_type as serviceType,s.group_name as groupName,s.owner_id as ownerId FROM students s JOIN users u ON u.id=s.user_id WHERE s.parent_user_id=?`).bind(user.id).all();
  const ids=(students.results||[]).map(x=>x.id);
  let lessons=[],requests=[],exams=[];
  if(isTeacher){lessons=(await env.DB.prepare(`SELECT l.id,l.title,l.date,l.start_time as start,l.end_time as end,l.status,l.student_id as studentId FROM lessons l WHERE l.owner_id=? OR ?='superadmin' ORDER BY l.date,l.start_time`).bind(user.id,user.role).all()).results||[];requests=(await env.DB.prepare(`SELECT r.id,r.status,r.current_date as currentDate,r.current_start as currentStart,r.current_end as currentEnd,r.requested_date as requestedDate,r.requested_start as requestedStart,r.requested_end as requestedEnd,r.reason,r.student_id as studentId,u.name as studentName FROM change_requests r JOIN students s ON s.id=r.student_id JOIN users u ON u.id=s.user_id WHERE r.owner_id=? OR ?='superadmin' ORDER BY r.created_at DESC`).bind(user.id,user.role).all()).results||[];}
  if(ids.length){const qs=ids.map(()=>'?').join(',');lessons=isTeacher?lessons:(await env.DB.prepare(`SELECT l.id,l.title,l.date,l.start_time as start,l.end_time as end,l.status,l.student_id as studentId FROM lessons l WHERE l.student_id IN (${qs}) ORDER BY l.date,l.start_time`).bind(...ids).all()).results||[];exams=(await env.DB.prepare(`SELECT e.id,e.title,e.type,e.exam_date as date,e.evaluation,e.student_id as studentId FROM exams e WHERE e.student_id IS NULL OR e.student_id IN (${qs}) ORDER BY e.exam_date DESC`).bind(...ids).all()).results||[];}
  return {students:students.results||[],lessons,requests,exams};
}
export async function onRequestGet({request,env}){
  const user=await sessionUser(env,request);if(!user)return json({error:'Oturum geçersiz veya süresi dolmuş.'},401);
  try{return json({user,...await dashboard(env,user)});}catch(e){return json({error:e.message||'Veri alınamadı.'},500)}
}
export async function onRequestPost({request,env}){
  const user=await sessionUser(env,request);if(!user)return json({error:'Oturum geçersiz veya süresi dolmuş.'},401);
  try{
    const body=await request.json();
    if(body.type==='lesson'){
      if(!['admin','superadmin'].includes(user.role))return json({error:'Bu işlem için öğretmen yetkisi gerekir.'},403);
      const {id,ownerId,studentId,title,date,start,end}=body; if(!id||!studentId||!date||!start||!end)return json({error:'Ders bilgileri eksik.'},400);
      if(date<new Date().toISOString().slice(0,10))return json({error:'Geçmiş tarihe ders planlanamaz.'},400);
      const overlap=await env.DB.prepare(`SELECT id FROM lessons WHERE owner_id=? AND date=? AND start_time < ? AND end_time > ?`).bind(ownerId||user.id,date,end,start).first();
      if(overlap)return json({error:'Bu öğretmenin aynı saat aralığında başka bir dersi var.'},409);
      await env.DB.prepare(`INSERT INTO lessons(id,owner_id,student_id,title,date,start_time,end_time,status) VALUES(?,?,?,?,?,?,?,'planned')`).bind(id,ownerId||user.id,studentId,title||'Matematik Dersi',date,start,end).run();
      return json({ok:true});
    }
    return json({error:'Desteklenmeyen işlem.'},400);
  }catch(e){return json({error:e.message||'İşlem başarısız.'},500)}
}

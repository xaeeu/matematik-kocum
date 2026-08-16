const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function user(env,request){const t=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();if(!t||!env.DB)return null;return await env.DB.prepare(`SELECT u.id,u.role,u.name,u.username,u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>?`).bind(t,new Date().toISOString()).first();}
export async function onRequestGet({request,env}){
  const u=await user(env,request);if(!u||u.role!=='superadmin')return json({error:'Bu bölüme yalnızca Baş Admin erişebilir.'},403);
  try{
    const teachers=(await env.DB.prepare(`SELECT id,name,username,status FROM users WHERE role='admin' ORDER BY name`).all()).results||[];
    const students=(await env.DB.prepare(`SELECT s.id,s.user_id as userId,s.owner_id as ownerId,s.parent_user_id as parentUserId,s.grade,s.service_type as serviceType,s.group_name as groupName,u.name,u.username,u.status,p.name as parentName,p.username as parentUsername,p.status as parentStatus FROM students s JOIN users u ON u.id=s.user_id LEFT JOIN users p ON p.id=s.parent_user_id ORDER BY s.owner_id,u.name`).all()).results||[];
    const ids=students.map(s=>s.id);let lessons=[],exams=[],evaluations=[],coaching=[];
    if(ids.length){const q=ids.map(()=>'?').join(',');lessons=(await env.DB.prepare(`SELECT student_id as studentId,COUNT(*) as count FROM lessons WHERE student_id IN (${q}) GROUP BY student_id`).bind(...ids).all()).results||[];exams=(await env.DB.prepare(`SELECT student_id as studentId,COUNT(*) as count FROM exams WHERE student_id IN (${q}) GROUP BY student_id`).bind(...ids).all()).results||[];evaluations=(await env.DB.prepare(`SELECT student_id as studentId,COUNT(*) as count FROM evaluations WHERE student_id IN (${q}) GROUP BY student_id`).bind(...ids).all()).results||[];coaching=(await env.DB.prepare(`SELECT student_id as studentId,1 as count FROM coaching_plans WHERE student_id IN (${q})`).bind(...ids).all()).results||[];}
    const num=(rows,id)=>Number(rows.find(x=>x.studentId===id)?.count||0);
    const byTeacher=teachers.map(t=>({
      id:t.id,name:t.name,username:t.username,status:t.status,
      students:students.filter(s=>s.ownerId===t.id).map(s=>({...s,lessonCount:num(lessons,s.id),examCount:num(exams,s.id),evaluationCount:num(evaluations,s.id),hasCoaching:num(coaching,s.id)>0}))
    }));
    return json({teachers:byTeacher});
  }catch(e){return json({error:e.message||'Öğrenci bilgileri alınamadı.'},500)}
}

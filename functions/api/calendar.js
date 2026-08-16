const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
function token(request){return (request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();}
async function user(env,request){const t=token(request);if(!t||!env.DB)return null;return env.DB.prepare(`SELECT u.id,u.role,u.name,u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>?`).bind(t,new Date().toISOString()).first();}
function teacherRole(role){return role==='admin'||role==='superadmin';}
async function teacherIds(env,u,requested){
  if(u.role==='admin') return [u.id];
  if(u.role==='superadmin'){
    const admins=(await env.DB.prepare(`SELECT id FROM users WHERE role='admin'`).all()).results||[];
    const ids=admins.map(x=>x.id);
    if(requested && (ids.includes(requested)||requested===u.id)) return [requested];
    if(ids.length) return ids;
    return [u.id];
  }
  return [];
}
export async function onRequestGet({request,env}){
  const u=await user(env,request);if(!u)return json({error:'Oturum geçersiz veya süresi dolmuş.'},401);
  if(!teacherRole(u.role))return json({error:'Takvim yetkisi yok.'},403);
  const requested=new URL(request.url).searchParams.get('teacherId')||'';
  const ids=await teacherIds(env,u,requested);
  const q=ids.map(()=>'?').join(',');
  if(!q)return json({rows:[],rules:[]});
  const rows=(await env.DB.prepare(`SELECT id,teacher_id as teacherId,date,hour,status,source FROM teacher_schedules WHERE teacher_id IN (${q}) ORDER BY date,hour`).bind(...ids).all()).results||[];
  const rules=(await env.DB.prepare(`SELECT id,teacher_id as teacherId,start_date as startDate,end_date as endDate,start_hour as startHour,end_hour as endHour,action FROM schedule_rules WHERE teacher_id IN (${q}) ORDER BY start_date,start_hour`).bind(...ids).all()).results||[];
  return json({rows,rules,teacherIds:ids});
}
export async function onRequestPost({request,env}){
  const u=await user(env,request);if(!u)return json({error:'Oturum geçersiz veya süresi dolmuş.'},401);
  if(!teacherRole(u.role))return json({error:'Takvim yetkisi yok.'},403);
  try{
    const b=await request.json();
    if(b.type==='scheduleSet'){
      const date=String(b.date||''),hour=Number(b.hour),status=String(b.status||''),requested=String(b.teacherId||'');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||hour<8||hour>23||!['open','closed'].includes(status))return json({error:'Geçersiz takvim ayarı.'},400);
      let teacherId=u.id;
      if(u.role==='superadmin'){
        const ids=await teacherIds(env,u,requested);teacherId=ids[0]||u.id;
      }
      await env.DB.prepare(`INSERT INTO teacher_schedules(id,teacher_id,date,hour,status,source) VALUES(?,?,?,?,?,'manual') ON CONFLICT(teacher_id,date,hour) DO UPDATE SET status=excluded.status,source='manual'`).bind(crypto.randomUUID(),teacherId,date,hour,status).run();
      return json({ok:true,teacherId,date,hour,status});
    }
    if(b.type==='scheduleRule'){
      let teacherId=u.id;if(u.role==='superadmin'){const ids=await teacherIds(env,u,String(b.teacherId||''));teacherId=ids[0]||u.id;}
      const startDate=String(b.startDate||''),endDate=String(b.endDate||''),startHour=Number(b.startHour),endHour=Number(b.endHour),action=String(b.action||'closed');
      if(!startDate||!endDate||startDate>endDate||startHour<8||startHour>23||endHour<=startHour||endHour>24||!['open','closed'].includes(action))return json({error:'Kural bilgileri geçersiz.'},400);
      await env.DB.prepare(`INSERT INTO schedule_rules(id,teacher_id,start_date,end_date,start_hour,end_hour,action) VALUES(?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),teacherId,startDate,endDate,startHour,endHour,action).run();
      return json({ok:true});
    }
    return json({error:'Desteklenmeyen işlem.'},400);
  }catch(e){return json({error:e.message||'Takvim işlemi başarısız.'},500)}
}

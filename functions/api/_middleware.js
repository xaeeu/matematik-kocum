const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});

async function sessionUser(env,request){
  if(!env.DB)return null;
  const t=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();
  if(!t)return null;
  return await env.DB.prepare(`SELECT u.id,u.role,u.name,u.username,u.status FROM sessions x JOIN users u ON u.id=x.user_id WHERE x.token=? AND x.expires_at>?`).bind(t,new Date().toISOString()).first();
}

async function dataGet(env,user){
  if(user.status!=='active'){
    if(user.role==='admin'||user.role==='superadmin')return json({error:'Hesabınız pasif. Lütfen adminle iletişime geçin.'},403);
    return json({error:'Hesabınız pasif. Lütfen öğretmeninizle iletişime geçin.'},403);
  }

  let students=[],teachers=[],parents=[],lessons=[],requests=[],exams=[],evaluations=[],coaching=[];
  if(user.role==='superadmin'){
    teachers=(await env.DB.prepare(`SELECT id,name,username,status FROM users WHERE role='admin' ORDER BY name`).all()).results||[];
  }

  if(user.role==='superadmin'){
    students=(await env.DB.prepare(`SELECT s.id,s.user_id as userId,u.name,u.username,s.grade,s.service_type as serviceType,s.group_name as groupName,s.owner_id as ownerId,s.parent_user_id as parentUserId,p.name as parentName,p.username as parentUsername FROM students s JOIN users u ON u.id=s.user_id LEFT JOIN users p ON p.id=s.parent_user_id ORDER BY u.name`).all()).results||[];
  }else if(user.role==='admin'){
    students=(await env.DB.prepare(`SELECT s.id,s.user_id as userId,u.name,u.username,s.grade,s.service_type as serviceType,s.group_name as groupName,s.owner_id as ownerId,s.parent_user_id as parentUserId,p.name as parentName,p.username as parentUsername FROM students s JOIN users u ON u.id=s.user_id LEFT JOIN users p ON p.id=s.parent_user_id WHERE s.owner_id=? ORDER BY u.name`).bind(user.id).all()).results||[];
  }else if(user.role==='student'){
    students=(await env.DB.prepare(`SELECT s.id,s.user_id as userId,u.name,u.username,s.grade,s.service_type as serviceType,s.group_name as groupName,s.owner_id as ownerId,s.parent_user_id as parentUserId,p.name as parentName,p.username as parentUsername FROM students s JOIN users u ON u.id=s.user_id LEFT JOIN users p ON p.id=s.parent_user_id WHERE s.user_id=?`).bind(user.id).all()).results||[];
    const owner=students[0]?.ownerId?await env.DB.prepare(`SELECT status FROM users WHERE id=?`).bind(students[0].ownerId).first():null;
    if(owner?.status!=='active')return json({error:'Öğretmeninizin hesabı pasif. Lütfen öğretmeninizle iletişime geçin.'},403);
  }else if(user.role==='parent'){
    students=(await env.DB.prepare(`SELECT s.id,s.user_id as userId,u.name,u.username,s.grade,s.service_type as serviceType,s.group_name as groupName,s.owner_id as ownerId,s.parent_user_id as parentUserId,p.name as parentName,p.username as parentUsername FROM students s JOIN users u ON u.id=s.user_id LEFT JOIN users p ON p.id=s.parent_user_id WHERE s.parent_user_id=? ORDER BY u.name`).bind(user.id).all()).results||[];
    const owner=students[0]?.ownerId?await env.DB.prepare(`SELECT status FROM users WHERE id=?`).bind(students[0].ownerId).first():null;
    if(owner?.status!=='active')return json({error:'Öğretmeninizin hesabı pasif. Lütfen öğretmeninizle iletişime geçin.'},403);
  }

  const ids=students.map(x=>x.id);
  if(user.role==='superadmin'||user.role==='admin'){
    const ownerClause=user.role==='superadmin'?'1=1':'l.owner_id=?';
    const ownerBind=user.role==='superadmin'?[]:[user.id];
    lessons=(await env.DB.prepare(`SELECT l.id,l.title,l.date,l.start_time as start,l.end_time as end,l.status,l.student_id as studentId,l.owner_id as ownerId,su.name as studentName FROM lessons l JOIN students s ON s.id=l.student_id JOIN users su ON su.id=s.user_id WHERE ${ownerClause} ORDER BY l.date,l.start_time`).bind(...ownerBind).all()).results||[];
    requests=(await env.DB.prepare(`SELECT r.id,r.status,r.current_date as currentDate,r.current_start as currentStart,r.current_end as currentEnd,r.requested_date as requestedDate,r.requested_start as requestedStart,r.requested_end as requestedEnd,r.reason,r.student_id as studentId,r.owner_id as ownerId,u.name as studentName FROM change_requests r JOIN students s ON s.id=r.student_id JOIN users u ON u.id=s.user_id WHERE ${user.role==='superadmin'?'1=1':'r.owner_id=?'} ORDER BY r.created_at DESC`).bind(...ownerBind).all()).results||[];
    parents=(await env.DB.prepare(`SELECT DISTINCT p.id,p.name,p.username,p.status FROM users p JOIN students s ON s.parent_user_id=p.id WHERE ${user.role==='superadmin'?'1=1':'s.owner_id=?'} AND p.role='parent' ORDER BY p.name`).bind(...ownerBind).all()).results||[];
  }else if(ids.length){
    const q=ids.map(()=>'?').join(',');
    lessons=(await env.DB.prepare(`SELECT l.id,l.title,l.date,l.start_time as start,l.end_time as end,l.status,l.student_id as studentId,l.owner_id as ownerId FROM lessons l WHERE l.student_id IN (${q}) ORDER BY l.date,l.start_time`).bind(...ids).all()).results||[];
    evaluations=(await env.DB.prepare(`SELECT e.id,e.student_id as studentId,e.understanding,e.homework_rate as homeworkRate,e.attendance,e.problem_solving as problemSolving,e.focus,e.consistency,e.strengths,e.focus_area as focusArea,e.next_goal as nextGoal,e.updated_at as updatedAt FROM evaluations e WHERE e.student_id IN (${q}) ORDER BY e.updated_at DESC`).bind(...ids).all()).results||[];
    coaching=(await env.DB.prepare(`SELECT c.id,c.student_id as studentId,c.weekly_goal as weeklyGoal,c.focus,c.habits,c.next_meeting as nextMeeting,c.updated_at as updatedAt FROM coaching_plans c WHERE c.student_id IN (${q})`).bind(...ids).all()).results||[];
  }

  const idsForExam=ids;
  if(idsForExam.length){
    const q=idsForExam.map(()=>'?').join(',');
    exams=(await env.DB.prepare(`SELECT e.id,e.title,e.type,e.exam_date as date,e.evaluation,e.student_id as studentId,e.owner_id as ownerId,su.name as studentName FROM exams e LEFT JOIN students s ON s.id=e.student_id LEFT JOIN users su ON su.id=s.user_id WHERE e.student_id IS NULL OR e.student_id IN (${q}) ORDER BY e.exam_date DESC`).bind(...idsForExam).all()).results||[];
  }else if(user.role==='superadmin'||user.role==='admin'){
    exams=(await env.DB.prepare(`SELECT e.id,e.title,e.type,e.exam_date as date,e.evaluation,e.student_id as studentId,e.owner_id as ownerId,su.name as studentName FROM exams e LEFT JOIN students s ON s.id=e.student_id LEFT JOIN users su ON su.id=s.user_id WHERE ${user.role==='superadmin'?'1=1':'e.owner_id=?'} ORDER BY e.exam_date DESC`).bind(...(user.role==='superadmin'?[]:[user.id])).all()).results||[];
  }

  const examIds=exams.map(x=>x.id);
  if(examIds.length){
    const q=examIds.map(()=>'?').join(',');
    const questions=(await env.DB.prepare(`SELECT id,exam_id as examId,number,text,outcome,correct_answer as correctAnswer FROM exam_questions WHERE exam_id IN (${q}) ORDER BY exam_id,number`).bind(...examIds).all()).results||[];
    const answers=(await env.DB.prepare(`SELECT id,exam_id as examId,student_id as studentId,question_id as questionId,answer,correct FROM exam_answers WHERE exam_id IN (${q})`).bind(...examIds).all()).results||[];
    for(const e of exams){e.questions=questions.filter(x=>x.examId===e.id);e.answers=answers.filter(x=>x.examId===e.id);}
  }

  let teacherIds=[];
  if(user.role==='superadmin')teacherIds=(await env.DB.prepare(`SELECT id FROM users WHERE role='admin' AND status='active'`).all()).results.map(x=>x.id);
  else if(user.role==='admin')teacherIds=[user.id];
  else teacherIds=[...new Set(students.map(x=>x.ownerId).filter(Boolean))];
  let schedules=[],rules=[];
  if(teacherIds.length){
    const q=teacherIds.map(()=>'?').join(',');
    schedules=(await env.DB.prepare(`SELECT id,teacher_id as teacherId,date,hour,status,source FROM teacher_schedules WHERE teacher_id IN (${q}) ORDER BY date,hour`).bind(...teacherIds).all()).results||[];
    rules=(await env.DB.prepare(`SELECT id,teacher_id as teacherId,start_date as startDate,end_date as endDate,start_hour as startHour,end_hour as endHour,action FROM schedule_rules WHERE teacher_id IN (${q}) ORDER BY start_date,start_hour`).bind(...teacherIds).all()).results||[];
  }

  return json({user,students,teachers,parents,lessons,requests,exams,evaluations,coaching,schedules,rules});
}

export async function onRequest(context){
  const url=new URL(context.request.url);
  if(url.pathname==='/api/data'&&context.request.method==='GET'){
    const user=await sessionUser(context.env,context.request);
    if(!user)return json({error:'Oturum geçersiz veya süresi dolmuş.'},401);
    try{return await dataGet(context.env,user);}catch(e){return json({error:e.message||'Veri alınamadı.'},500);}
  }
  return context.next();
}

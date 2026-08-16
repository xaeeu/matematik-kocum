const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const teacherRole=r=>r==='admin'||r==='superadmin';
async function sessionUser(env,request){const t=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();if(!env.DB||!t)return null;return await env.DB.prepare(`SELECT users.id,users.role,users.name,users.username FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token=? AND sessions.expires_at>?`).bind(t,new Date().toISOString()).first();}
async function hashPassword(password){const data=new TextEncoder().encode(String(password));const digest=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function ownsStudent(env,user,studentId){const s=await env.DB.prepare(`SELECT * FROM students WHERE id=?`).bind(studentId).first();if(!s)return null;if(user.role==='superadmin'||(user.role==='admin'&&s.owner_id===user.id))return s;return null;}
function str(v){return String(v??'').trim();}

export async function onRequestPost({request,env}){
  const user=await sessionUser(env,request);
  if(!user)return json({error:'Oturum geçersiz veya süresi dolmuş.'},401);
  if(!teacherRole(user.role))return json({error:'Bu işlem için öğretmen yetkisi gerekir.'},403);
  try{
    const body=await request.json();
    const action=str(body.action);
    const studentName=str(body.studentName), studentUsername=str(body.studentUsername).toLowerCase();
    const grade=str(body.grade), groupName=str(body.groupName), serviceType=str(body.serviceType||'ozel_ders');
    const parentEnabled=body.parentEnabled===true;
    const removeParent=body.removeParent===true;
    if(!studentName||!studentUsername||!grade||!['ozel_ders','kocluk','both'].includes(serviceType))return json({error:'Öğrenci bilgileri eksik veya geçersiz.'},400);

    if(action==='create'){
      const studentPassword=str(body.studentPassword);
      if(!studentPassword)return json({error:'Öğrenci şifresi gerekli.'},400);
      const ownerId=user.role==='superadmin'&&str(body.ownerId)?str(body.ownerId):user.id;
      if(user.role==='superadmin'){const t=await env.DB.prepare(`SELECT id FROM users WHERE id=? AND role='admin'`).bind(ownerId).first();if(!t)return json({error:'Seçilen öğretmen bulunamadı.'},400);}

      let parentId=null;
      const parentName=str(body.parentName), parentUsername=str(body.parentUsername).toLowerCase(), parentPassword=str(body.parentPassword);
      if(parentEnabled){
        if(!parentName||!parentUsername)return json({error:'Veli adı ve kullanıcı adı gerekli.'},400);
        const existingParent=await env.DB.prepare(`SELECT id,role FROM users WHERE username=?`).bind(parentUsername).first();
        if(existingParent){
          if(existingParent.role!=='parent')return json({error:'Bu veli kullanıcı adı başka bir hesapta kullanılıyor.'},409);
          parentId=existingParent.id;
          if(parentPassword)await env.DB.prepare(`UPDATE users SET name=?,password_hash=? WHERE id=?`).bind(parentName,await hashPassword(parentPassword),parentId).run();
          else await env.DB.prepare(`UPDATE users SET name=? WHERE id=?`).bind(parentName,parentId).run();
        }else{
          if(!parentPassword)return json({error:'Yeni veli hesabı için şifre gerekli.'},400);
          parentId=crypto.randomUUID();
          await env.DB.prepare(`INSERT INTO users(id,role,name,username,password_hash,status) VALUES(?,?,?,?,?,'active')`).bind(parentId,'parent',parentName,parentUsername,await hashPassword(parentPassword)).run();
        }
      }

      const userId=crypto.randomUUID(),studentId=crypto.randomUUID();
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO users(id,role,name,username,password_hash,status) VALUES(?,?,?,?,?,'active')`).bind(userId,'student',studentName,studentUsername,await hashPassword(studentPassword)),
        env.DB.prepare(`INSERT INTO students(id,user_id,owner_id,parent_user_id,grade,service_type,group_name) VALUES(?,?,?,?,?,?,?)`).bind(studentId,userId,ownerId,parentId,grade,serviceType,groupName)
      ]);
      return json({ok:true,studentId,parentUserId:parentId});
    }

    if(action==='update'){
      const studentId=str(body.studentId);if(!studentId)return json({error:'Öğrenci bulunamadı.'},400);
      const s=await ownsStudent(env,user,studentId);if(!s)return json({error:'Öğrenci bulunamadı veya erişim yok.'},404);
      const ownerId=user.role==='superadmin'&&str(body.ownerId)?str(body.ownerId):s.owner_id;
      if(user.role==='superadmin'){const t=await env.DB.prepare(`SELECT id FROM users WHERE id=? AND role='admin'`).bind(ownerId).first();if(!t)return json({error:'Seçilen öğretmen bulunamadı.'},400);}
      await env.DB.prepare(`UPDATE users SET name=?,username=? WHERE id=?`).bind(studentName,studentUsername,s.user_id).run();
      await env.DB.prepare(`UPDATE students SET owner_id=?,grade=?,service_type=?,group_name=? WHERE id=?`).bind(ownerId,grade,serviceType,groupName,s.id).run();

      let parentId=s.parent_user_id||null;
      if(removeParent){
        await env.DB.prepare(`UPDATE students SET parent_user_id=NULL WHERE id=?`).bind(s.id).run();
        parentId=null;
      }else if(parentEnabled){
        const parentName=str(body.parentName), parentUsername=str(body.parentUsername).toLowerCase(), parentPassword=str(body.parentPassword);
        if(!parentName||!parentUsername)return json({error:'Veli adı ve kullanıcı adı gerekli.'},400);
        if(parentId){
          const current=await env.DB.prepare(`SELECT id,role FROM users WHERE id=?`).bind(parentId).first();
          if(!current||current.role!=='parent')parentId=null;
        }
        if(parentId){
          if(parentPassword)await env.DB.prepare(`UPDATE users SET name=?,username=?,password_hash=? WHERE id=?`).bind(parentName,parentUsername,await hashPassword(parentPassword),parentId).run();
          else await env.DB.prepare(`UPDATE users SET name=?,username=? WHERE id=?`).bind(parentName,parentUsername,parentId).run();
        }else{
          const existingParent=await env.DB.prepare(`SELECT id,role FROM users WHERE username=?`).bind(parentUsername).first();
          if(existingParent){
            if(existingParent.role!=='parent')return json({error:'Bu veli kullanıcı adı başka bir hesapta kullanılıyor.'},409);
            parentId=existingParent.id;
            if(parentPassword)await env.DB.prepare(`UPDATE users SET name=?,password_hash=? WHERE id=?`).bind(parentName,await hashPassword(parentPassword),parentId).run();
            else await env.DB.prepare(`UPDATE users SET name=? WHERE id=?`).bind(parentName,parentId).run();
          }else{
            if(!parentPassword)return json({error:'Yeni veli hesabı için şifre gerekli.'},400);
            parentId=crypto.randomUUID();
            await env.DB.prepare(`INSERT INTO users(id,role,name,username,password_hash,status) VALUES(?,?,?,?,?,'active')`).bind(parentId,'parent',parentName,parentUsername,await hashPassword(parentPassword)).run();
          }
        }
        await env.DB.prepare(`UPDATE students SET parent_user_id=? WHERE id=?`).bind(parentId,s.id).run();
      }
      return json({ok:true,studentId,parentUserId:parentId});
    }

    return json({error:'Geçersiz işlem.'},400);
  }catch(e){return json({error:e.message||'İşlem başarısız.'},500);}
}

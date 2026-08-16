const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store',...headers}});
function tokenFrom(request){const h=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();if(h)return h;const cookie=request.headers.get('cookie')||'';const m=cookie.match(/(?:^|;\s*)mk_session=([^;]+)/);if(m)return decodeURIComponent(m[1]);return new URL(request.url).searchParams.get('token')||'';}
async function user(env,request){const token=tokenFrom(request);if(!token||!env.DB)return null;return env.DB.prepare(`SELECT u.id,u.role,u.name,u.username FROM sessions x JOIN users u ON u.id=x.user_id WHERE x.token=? AND x.expires_at>?`).bind(token,new Date().toISOString()).first();}
async function ensure(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT DEFAULT '',provider TEXT NOT NULL,youtube_url TEXT,r2_key TEXT,mime TEXT,size INTEGER,created_by TEXT NOT NULL,created_at TEXT NOT NULL,visibility_mode TEXT NOT NULL DEFAULT 'all',visibility_values TEXT NOT NULL DEFAULT '[]')`).run();
  try{await env.DB.prepare(`ALTER TABLE videos ADD COLUMN visibility_mode TEXT NOT NULL DEFAULT 'all'`).run()}catch{}
  try{await env.DB.prepare(`ALTER TABLE videos ADD COLUMN visibility_values TEXT NOT NULL DEFAULT '[]'`).run()}catch{}
}
function youtubeId(url){try{const u=new URL(url);if(u.hostname==='youtu.be')return u.pathname.slice(1).split('/')[0]||'';if(u.searchParams.get('v'))return u.searchParams.get('v')||'';const m=u.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/);return m?m[1]:'';}catch{return '';}}
function parseValues(raw){try{const v=JSON.parse(raw||'[]');return Array.isArray(v)?v.map(x=>String(x)).filter(Boolean):[]}catch{return[]}}
function matchesVisibility(video,students){
  const mode=video.visibility_mode||'all';
  const vals=parseValues(video.visibility_values);
  if(mode==='all'||!vals.length)return true;
  return (students||[]).some(s=>{
    const grade=String(s.grade||'');
    const group=String(s.groupName||'');
    if(mode==='grade')return vals.includes(grade);
    if(mode==='group')return vals.includes(group);
    if(mode==='grade_group'){
      const parts=vals.reduce((a,v)=>{const [g,r]=String(v).split('::');(a[g]??=[]).push(r||'');return a},{});
      return Object.entries(parts).some(([g,groups])=>g===grade&&groups.includes(group));
    }
    return false;
  });
}
async function studentTargets(env,u){
  if(u.role==='student')return (await env.DB.prepare(`SELECT s.grade,s.group_name as groupName FROM students s WHERE s.user_id=?`).bind(u.id).all()).results||[];
  if(u.role==='parent')return (await env.DB.prepare(`SELECT s.grade,s.group_name as groupName FROM students s WHERE s.parent_user_id=?`).bind(u.id).all()).results||[];
  return [];
}
export async function onRequestGet({request,env}){
  const u=await user(env,request);if(!u)return json({error:'Oturum geçersiz veya süresi dolmuş.'},401);
  try{await ensure(env);const rows=(await env.DB.prepare(`SELECT id,title,description,provider,youtube_url as url,r2_key as r2Key,mime,size,created_at as createdAt,visibility_mode as visibilityMode,visibility_values as visibilityValues FROM videos ORDER BY created_at DESC`).all()).results||[];const targets=await studentTargets(env,u);const filtered=['admin','superadmin'].includes(u.role)?rows:rows.filter(v=>matchesVisibility(v,targets));return json(filtered.map(v=>({...v,youtubeId:v.provider==='youtube'?youtubeId(v.url||''):'',visibilityValues:parseValues(v.visibilityValues)})));}catch(e){return json({error:e.message||'Videolar alınamadı.'},500)}}
async function visibilityFromForm(form){
  const mode=String(form.get('visibilityMode')||'all');
  if(mode==='grade')return {mode,values:Array.from(form.getAll('visibilityValue')).map(String).filter(Boolean)};
  if(mode==='group')return {mode,values:Array.from(form.getAll('visibilityValue')).map(String).filter(Boolean)};
  if(mode==='grade_group'){
    const grades=form.getAll('visibilityGrade').map(String);
    const groups=form.getAll('visibilityGroup').map(String);
    const values=[];for(const g of grades)for(const r of groups)values.push(`${g}::${r}`);
    return {mode,values:[...new Set(values)]};
  }
  return {mode:'all',values:[]};
}
async function visibilityFromJson(body){
  const mode=['all','grade','group','grade_group'].includes(String(body.visibilityMode||''))?String(body.visibilityMode):'all';
  const values=Array.isArray(body.visibilityValues)?body.visibilityValues.map(String).filter(Boolean):[];
  return {mode,values};
}
export async function onRequestPost({request,env}){
  const u=await user(env,request);if(!u)return json({error:'Oturum geçersiz veya süresi dolmuş.'},401);if(!['admin','superadmin'].includes(u.role))return json({error:'Video yönetme yetkisi yalnızca öğretmenlerdedir.'},403);
  try{await ensure(env);const contentType=request.headers.get('content-type')||'';
    if(contentType.includes('multipart/form-data')){
      if(!env.VIDEOS)return json({error:'Video dosyası için Cloudflare R2 "VIDEOS" bindingi kurulmalı.'},503);
      const form=await request.formData();const file=form.get('file');const title=String(form.get('title')||'').trim();const description=String(form.get('description')||'').trim();if(!(file instanceof File)||!file.size||!title)return json({error:'Başlık ve video dosyası gerekli.'},400);if(!String(file.type||'').startsWith('video/'))return json({error:'Sadece video dosyaları yüklenebilir.'},400);if(file.size>100*1024*1024)return json({error:'Tek video için 100 MB sınırı var.'},413);const {mode,values}=await visibilityFromForm(form);const id=crypto.randomUUID();const safeName=String(file.name||'video').replace(/[^a-zA-Z0-9._-]+/g,'-').slice(-120);const key=`videos/${u.id}/${id}-${safeName}`;await env.VIDEOS.put(key,file.stream(),{httpMetadata:{contentType:file.type||'video/mp4',cacheControl:'private, max-age=3600'}});await env.DB.prepare(`INSERT INTO videos(id,title,description,provider,r2_key,mime,size,created_by,created_at,visibility_mode,visibility_values) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(id,title,description,'upload',key,file.type||'video/mp4',file.size,u.id,new Date().toISOString(),mode,JSON.stringify(values)).run();return json({ok:true,id},201);
    }
    const body=await request.json();if(body.type==='delete'){const id=String(body.id||'');const row=await env.DB.prepare(`SELECT * FROM videos WHERE id=?`).bind(id).first();if(!row)return json({error:'Video bulunamadı.'},404);if(row.provider==='upload'&&row.r2_key&&env.VIDEOS)await env.VIDEOS.delete(row.r2_key);await env.DB.prepare(`DELETE FROM videos WHERE id=?`).bind(id).run();return json({ok:true});}
    const title=String(body.title||'').trim(),description=String(body.description||'').trim(),url=String(body.url||'').trim();if(!title||!url||!youtubeId(url))return json({error:'Geçerli bir YouTube bağlantısı gerekli.'},400);const {mode,values}=await visibilityFromJson(body);const id=crypto.randomUUID();await env.DB.prepare(`INSERT INTO videos(id,title,description,provider,youtube_url,created_by,created_at,visibility_mode,visibility_values) VALUES(?,?,?,?,?,?,?,?,?)`).bind(id,title,description,'youtube',url,u.id,new Date().toISOString(),mode,JSON.stringify(values)).run();return json({ok:true,id},201);
  }catch(e){return json({error:e.message||'Video işlemi başarısız.'},500)}}

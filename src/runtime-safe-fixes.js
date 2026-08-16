(()=>{
  // Define the handlers referenced by main.js before its first render.
  window.saveCoaching=async function(e){
    e.preventDefault();
    const token=localStorage.getItem('mk_session')||'';
    const fd=new FormData(e.currentTarget);
    const student=(()=>{try{return JSON.parse(localStorage.getItem('mk_selected_student')||'null')}catch{return null}})();
    const studentId=student?.id || '';
    try{
      const res=await fetch('/api/data',{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify({type:'coachingSave',studentId,weeklyGoal:fd.get('weeklyGoal'),focus:fd.get('focus'),habits:fd.get('habits'),nextMeeting:fd.get('nextMeeting')})});
      const d=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(d.error||`İşlem başarısız (${res.status})`);
      document.querySelector('.modal-backdrop')?.remove();
      window.location.reload();
    }catch(err){window.siteError?window.siteError(err.message):window.alert(err.message)}
  };
  window.saveEvaluation=async function(e){
    e.preventDefault();
    const token=localStorage.getItem('mk_session')||'';
    const fd=new FormData(e.currentTarget);
    const student=(()=>{try{return JSON.parse(localStorage.getItem('mk_selected_student')||'null')}catch{return null}})();
    const studentId=student?.id || '';
    const payload={type:'evaluationSave',studentId,understanding:Number(fd.get('understanding')||0),homeworkRate:Number(fd.get('homeworkRate')||0),attendance:Number(fd.get('attendance')||0),problemSolving:Number(fd.get('problemSolving')||0),focus:Number(fd.get('focus')||0),consistency:Number(fd.get('consistency')||0),strengths:fd.get('strengths'),focusArea:fd.get('focusArea'),nextGoal:fd.get('nextGoal')};
    try{
      const res=await fetch('/api/data',{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify(payload)});
      const d=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(d.error||`İşlem başarısız (${res.status})`);
      document.querySelector('.modal-backdrop')?.remove();
      window.location.reload();
    }catch(err){window.siteError?window.siteError(err.message):window.alert(err.message)}
  };
  window.__mkRuntimeSafeFixes=true;
})();

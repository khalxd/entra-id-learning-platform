"use strict";

const TOTAL_STEPS=LABS.reduce((n,l)=>n+l.steps.length,0);
const byId=id=>document.getElementById(id);
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function emptyState(){return {done:{},notes:{},lab:0,step:0,version:3}}
function migrateState(){
  let existing;
  try{ existing=JSON.parse(localStorage.getItem("entraIamHomelabV3")||"null"); }catch{}
  if(existing && existing.version===3) return existing;

  const s=emptyState();
  // Import earlier v3 single-lab progress if the user previously opened it on the same origin.
  try{
    const old=JSON.parse(localStorage.getItem("iam-v3")||"null");
    if(old){
      Object.entries(old.done||{}).forEach(([k,v])=>{ if(v) s.done["0-"+k]=true; });
      Object.entries(old.notes||{}).forEach(([k,v])=>{ if(v) s.notes["0-"+k]=v; });
      s.step=Math.min(Number(old.step||0), LABS[0].steps.length-1);
    }
  }catch{}
  // Import the original interactive tutorial state, whose Lab 1 keys were 0-0, 0-1, ...
  try{
    const old=JSON.parse(localStorage.getItem("entraLabState")||"null");
    if(old){
      Object.entries(old.done||{}).forEach(([k,v])=>{ if(v && /^0-\d+$/.test(k)) s.done[k]=true; });
      Object.entries(old.notes||{}).forEach(([k,v])=>{ if(v && /^0-\d+$/.test(k)) s.notes[k]=v; });
      if(Number(old.lastProject||0)===0) s.step=Math.min(Number(old.lastStep||0), LABS[0].steps.length-1);
    }
  }catch{}
  localStorage.setItem("entraIamHomelabV3",JSON.stringify(s));
  return s;
}
let state=migrateState();
let currentLab=Math.max(0,Math.min(Number(state.lab||0),LABS.length-1));
let currentStep=Math.max(0,Math.min(Number(state.step||0),LABS[currentLab].steps.length-1));

function stepKey(li=currentLab,si=currentStep){return `${li}-${si}`}
function saveState(){
  state.lab=currentLab; state.step=currentStep; state.version=3;
  localStorage.setItem("entraIamHomelabV3",JSON.stringify(state));
  renderProgress();
}
function saveNote(){
  if(!byId("labView").classList.contains("hidden")){
    state.notes[stepKey()]=byId("notesBox").value;
    localStorage.setItem("entraIamHomelabV3",JSON.stringify(state));
  }
}
function completedSteps(){return Object.values(state.done).filter(Boolean).length}
function labDone(li){return LABS[li].steps.every((_,si)=>state.done[stepKey(li,si)])}
function labCompletedCount(li){return LABS[li].steps.filter((_,si)=>state.done[stepKey(li,si)]).length}
function toast(msg){const t=byId("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1200)}

function renderProgress(){
  const completed=completedSteps(), pct=Math.round(completed/TOTAL_STEPS*100);
  byId("overallPct").textContent=pct+"%";
  byId("overallBar").style.width=pct+"%";
  byId("overallText").textContent=`${completed} of ${TOTAL_STEPS} guided steps completed`;
  byId("completedStat").textContent=completed;
  byId("currentStat").textContent=`Lab ${currentLab+1}`;
  renderSideNav(byId("searchBox").value.trim().toLowerCase());
}

function groupedLabs(filter=""){
  const map=new Map();
  LABS.forEach((lab,li)=>{
    const hay=(lab.title+" "+lab.phase+" "+lab.desc+" "+lab.level).toLowerCase();
    if(filter && !hay.includes(filter)) return;
    if(!map.has(lab.phase)) map.set(lab.phase,[]);
    map.get(lab.phase).push({lab,li});
  });
  return map;
}
function renderSideNav(filter=""){
  const groups=groupedLabs(filter);
  let h="";
  for(const [phase,items] of groups){
    h+=`<div class="phaseLabel">${escapeHtml(phase)}</div>`;
    for(const {lab,li} of items){
      h+=`<button class="labnav ${li===currentLab&&!byId("labView").classList.contains("hidden")?"active":""} ${labDone(li)?"complete":""}" data-lab="${li}">${lab.num}. ${escapeHtml(lab.title)}</button>`;
    }
  }
  byId("sideNav").innerHTML=h||'<p class="muted">No matching labs.</p>';
}
function renderDashboard(){
  const filter=byId("searchBox").value.trim().toLowerCase();
  const groups=groupedLabs(filter);
  let h="";
  for(const [phase,items] of groups){
    h+=`<section class="phase"><div class="phaseHeader"><h2>${escapeHtml(phase)}</h2><span class="pill">${items.length} lab${items.length===1?"":"s"}</span></div><div class="labGrid">`;
    for(const {lab,li} of items){
      const c=labCompletedCount(li);
      h+=`<article class="panel labCard" data-lab="${li}">
        <div class="meta"><span class="badge">LAB ${lab.num}</span><span class="pill">${escapeHtml(lab.level)}</span></div>
        <h3>${escapeHtml(lab.title)}</h3>
        <p class="muted">${escapeHtml(lab.desc)}</p>
        <div class="meta"><span class="pill">${c}/${lab.steps.length} steps complete</span><span class="pill">${escapeHtml(lab.license)}</span></div>
      </article>`;
    }
    h+="</div></section>";
  }
  byId("dashboardLabs").innerHTML=h||'<div class="panel" style="padding:20px;margin-top:18px"><p class="muted">No matching labs.</p></div>';
}

function showOnly(id){
  ["dashboardView","labView","reviewView"].forEach(x=>byId(x).classList.toggle("hidden",x!==id));
  window.scrollTo(0,0);
}
function goHome(){saveNote();showOnly("dashboardView");renderDashboard();renderProgress()}
function openLab(li,si=null){
  saveNote();
  currentLab=Math.max(0,Math.min(li,LABS.length-1));
  currentStep=si===null?Math.min(Number(state.lab===currentLab?state.step:0)||0,LABS[currentLab].steps.length-1):Math.max(0,Math.min(si,LABS[currentLab].steps.length-1));
  saveState(); showOnly("labView"); renderStep();
}
function openStep(si){saveNote();currentStep=Math.max(0,Math.min(si,LABS[currentLab].steps.length-1));saveState();showOnly("labView");renderStep()}

function renderStep(){
  const lab=LABS[currentLab], s=lab.steps[currentStep], key=stepKey();
  byId("labPhase").textContent=lab.phase;
  byId("labTitle").textContent=`${lab.num}. ${lab.title}`;
  byId("labDesc").textContent=lab.desc;
  byId("labLevel").textContent=lab.level;
  byId("labLicense").textContent=lab.license;
  const c=labCompletedCount(currentLab);
  byId("labBar").style.width=Math.round(c/lab.steps.length*100)+"%";
  byId("labProgress").textContent=`${c} of ${lab.steps.length} steps completed`;
  byId("stepNo").textContent=`STEP ${currentStep+1} OF ${lab.steps.length}`;
  byId("stepTitle").textContent=s.title;
  byId("path").textContent=s.path;
  byId("clicks").innerHTML=s.clicks.map(x=>`<li>${escapeHtml(x)}</li>`).join("");
  byId("enterSection").classList.toggle("hidden",!s.enter.length);
  byId("enter").innerHTML=s.enter.map(x=>`<div class="entry">${escapeHtml(x)}</div>`).join("");
  byId("why").textContent=s.why;
  byId("verify").textContent=s.verify;
  byId("troubleshoot").textContent=s.troubleshoot;
  byId("examSection").classList.toggle("hidden",!s.exam);
  byId("exam").textContent=s.exam||"";
  byId("safetySection").classList.toggle("hidden",!s.safety);
  byId("safety").textContent=s.safety||"";
  byId("notesBox").value=state.notes[key]||"";
  byId("prevStepBtn").disabled=currentStep===0;
  byId("doneBtn").textContent=state.done[key]?(currentStep===lab.steps.length-1?"✓ Lab completed":"✓ Done — Continue →"):(currentStep===lab.steps.length-1?"Mark Lab Complete ✓":"Mark Done & Continue →");
  byId("stepDots").innerHTML=lab.steps.map((_,i)=>`<button class="dot ${i===currentStep?"current":""} ${state.done[stepKey(currentLab,i)]?"done":""}" data-step="${i}">${i+1}</button>`).join("");
  renderProgress();
}

function markDone(){
  saveNote(); state.done[stepKey()]=true; saveState();
  const lab=LABS[currentLab];
  if(currentStep<lab.steps.length-1){currentStep++;saveState();renderStep();window.scrollTo(0,0)}
  else{renderStep();toast(`Lab ${lab.num} complete!`)}
}
function previousStep(){if(currentStep>0){saveNote();currentStep--;saveState();renderStep();window.scrollTo(0,0)}}

function openReview(){
  saveNote();const lab=LABS[currentLab],c=labCompletedCount(currentLab);
  byId("reviewTitle").textContent=`${lab.num}. ${lab.title}`;
  byId("reviewSummary").textContent=`${c} of ${lab.steps.length} steps marked complete.`;
  byId("reviewList").innerHTML=lab.steps.map((s,i)=>`<div class="reviewRow"><b>#${i+1}</b><div><b>${escapeHtml(s.title)}</b><br><span class="muted">${state.done[stepKey(currentLab,i)]?"Completed":"Not completed"}</span></div><button class="btn" data-review-step="${i}">Open</button></div>`).join("");
  showOnly("reviewView");
}
function openHelp(){
  const lab=LABS[currentLab], s=lab.steps[currentStep];
  byId("helpTitle").textContent=s.title;
  byId("helpPrompt").textContent=`I'm working through a Microsoft Entra ID IAM homelab.

Lab ${lab.num}: ${lab.title}
Current step: ${s.title}

The tutorial says to go to:
${s.path}

The actions are:
${s.clicks.map((x,i)=>`${i+1}. ${x}`).join("\n")}

Expected result:
${s.verify}

I'm stuck. Please guide me from exactly this screen using the current Microsoft Entra/Azure admin center. Explain what to click and why. Do not skip ahead. I can provide a screenshot.`;
  byId("helpModal").classList.remove("hidden");
}
function closeHelp(){byId("helpModal").classList.add("hidden")}
async function copyHelp(){
  try{await navigator.clipboard.writeText(byId("helpPrompt").textContent);toast("Help prompt copied")}catch{alert("Copy failed. Select the text manually.")}
}

function toggleTheme(){
  const next=document.documentElement.dataset.theme==="dark"?"light":"dark";
  document.documentElement.dataset.theme=next;localStorage.setItem("entraIamTheme",next);
  byId("themeBtn").textContent=next==="dark"?"☀️":"🌙";
}
function exportProgress(){
  saveNote();
  const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),state},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="entra-iam-homelab-progress.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
function resetProgress(){
  if(confirm("Reset all completed steps and notes for all 31 labs? This cannot be undone unless you exported your progress.")){
    state=emptyState();currentLab=0;currentStep=0;localStorage.setItem("entraIamHomelabV3",JSON.stringify(state));goHome();toast("Progress reset");
  }
}

// Event wiring: all static controls are bound explicitly.
byId("homeBtn").addEventListener("click",goHome);
byId("themeBtn").addEventListener("click",toggleTheme);
byId("exportBtn").addEventListener("click",exportProgress);
byId("resumeBtn").addEventListener("click",()=>openLab(Number(state.lab||0),Number(state.step||0)));
byId("resetBtn").addEventListener("click",resetProgress);
byId("searchBox").addEventListener("input",()=>{renderSideNav(byId("searchBox").value.trim().toLowerCase());if(!byId("dashboardView").classList.contains("hidden"))renderDashboard()});
byId("backIndexBtn").addEventListener("click",goHome);
byId("prevStepBtn").addEventListener("click",previousStep);
byId("doneBtn").addEventListener("click",markDone);
byId("helpBtn").addEventListener("click",openHelp);
byId("reviewLabBtn").addEventListener("click",openReview);
byId("returnToStepBtn").addEventListener("click",()=>{showOnly("labView");renderStep()});
byId("closeHelpBtn").addEventListener("click",closeHelp);
byId("copyHelpBtn").addEventListener("click",copyHelp);
byId("helpModal").addEventListener("click",e=>{if(e.target===byId("helpModal"))closeHelp()});
byId("notesBox").addEventListener("input",()=>{state.notes[stepKey()]=byId("notesBox").value;localStorage.setItem("entraIamHomelabV3",JSON.stringify(state))});

// Event delegation for dynamically rendered content.
byId("sideNav").addEventListener("click",e=>{const b=e.target.closest("[data-lab]");if(b)openLab(Number(b.dataset.lab),0)});
byId("dashboardLabs").addEventListener("click",e=>{const c=e.target.closest("[data-lab]");if(c)openLab(Number(c.dataset.lab),0)});
byId("stepDots").addEventListener("click",e=>{const b=e.target.closest("[data-step]");if(b)openStep(Number(b.dataset.step))});
byId("reviewList").addEventListener("click",e=>{const b=e.target.closest("[data-review-step]");if(b){currentStep=Number(b.dataset.reviewStep);saveState();showOnly("labView");renderStep()}});

const savedTheme=localStorage.getItem("entraIamTheme")||"dark";
document.documentElement.dataset.theme=savedTheme;
byId("themeBtn").textContent=savedTheme==="dark"?"☀️":"🌙";
byId("stepBadge").textContent=`${TOTAL_STEPS} guided steps`;
byId("totalStepsStat").textContent=TOTAL_STEPS;
renderDashboard();renderProgress();

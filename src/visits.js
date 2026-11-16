/* ---------- "Were you at X?", your visits, Forget me (08/11/2026) ----------
   Only while the app is open, and only if location is already allowed: Fiver never asks for it here.
   The phone checks the distance itself; the position never leaves it. Within 50 m of the same place for about 3 minutes,
   with GPS accurate to 50 m or better (inside Westfield it usually isn't, so no question there), it asks once.
   Answered about that place today: not again today. "Yes" answers stay on this phone (Your visits).
   The server gets only {device_id, place_id, action} in public.visit_events: never a name, an email, a phone number or a position. */
const VCFG={m:50,ms:180000,acc:50,gap:60000}; // metres, dwell, worst accuracy, longest gap between two good fixes
const V={watch:null,cur:null,since:0,last:0,asking:null,dismissed:new Set(),started:false};
const VISIT_ACTIONS=["visit_yes_eat","visit_yes_takeaway","visit_no","price_same","price_diff","price_skip","seat_sit_in","seat_takeaway","seat_both","tables_few","tables_lots","vibe_quiet","vibe_lively"];
function localDay(d){d=d||new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function visitKey(p){return p&&p.placeId?String(p.placeId):"fiver:"+(p&&p.id||"");}
function googleNamed(p){return !!p&&(p.coordSource==="google"&&/^gf-/.test(p.id)||!!p.nameLive);} // a name that came from Google: shown live, never kept
function lsJSON(k,d){try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?d:v;}catch(e){return d;}}
function lsPut(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function askedToday(k){const j=lsJSON("fiver.asked",{});return j[k]===localDay();}
function markAsked(k){const j=lsJSON("fiver.asked",{}),t=localDay();for(const x in j)if(j[x]!==t)delete j[x];j[k]=t;lsPut("fiver.asked",j);}
function myVisits(){const L=lsJSON("fiver.myvisits",[]);return Array.isArray(L)?L:[];}
function addVisit(p,how){const L=myVisits();L.unshift({k:visitKey(p),id:p.id,name:googleNamed(p)?"":p.name,date:localDay(),how});lsPut("fiver.myvisits",L.slice(0,200));}
function sendVisit(place_id,action){if(!VISIT_ACTIONS.includes(action)||!place_id||typeof ON_SITE==="undefined"||!ON_SITE||TRACK_OFF)return;
  try{fetch(SB_URL+"/rest/v1/visit_events",{method:"POST",keepalive:true,headers:Object.assign({Prefer:"return=minimal"},SB_HEADERS),body:JSON.stringify({device_id:DEVICE_ID,place_id:String(place_id).slice(0,200),action})}).catch(()=>{});}catch(e){}}
/* the nearest place with a real point (not a campus point, not the Westfield centre) */
function visitPlace(at){let best=null,bd=Infinity;
  for(const p of allPlaces()){if(!p||typeof p.lat!=="number"||p.approxLL||p.wfAnchor||p.when||p.status==="event")continue;const d=metres(at,p);if(d<bd){bd=d;best=p;}}
  return best&&bd<=VCFG.m?best:null;}
function onVisitFix(pos){const c=pos&&pos.coords;if(!c)return;const now=Date.now();
  if(!(c.accuracy<=VCFG.acc)){if(now-V.last>VCFG.gap){V.cur=null;V.since=0;}return;} // not sure where we are (indoors): never ask
  const p=visitPlace({lat:c.latitude,lon:c.longitude});
  if(!p){V.cur=null;V.since=0;V.last=now;return;}
  const k=visitKey(p);
  if(!V.cur||V.cur!==k||now-V.last>VCFG.gap){V.cur=k;V.since=now;}
  V.last=now;
  if(now-V.since>=VCFG.ms&&!V.asking&&!askedToday(k)&&!V.dismissed.has(k))askVisit(p);}
function visitWatch(on){if(typeof navigator==="undefined"||!navigator.geolocation)return;
  if(!on){if(V.watch!=null){navigator.geolocation.clearWatch(V.watch);V.watch=null;}V.cur=null;V.since=0;return;}
  if(V.watch!=null)return;
  const go=()=>{if(V.watch==null&&!document.hidden)V.watch=navigator.geolocation.watchPosition(onVisitFix,()=>{},{enableHighAccuracy:true,maximumAge:20000,timeout:30000});};
  try{if(navigator.permissions&&navigator.permissions.query)navigator.permissions.query({name:"geolocation"}).then(s=>{if(s&&s.state==="granted")go();}).catch(()=>{});}catch(e){}}
function visitStart(){if(V.started)return;V.started=true;visitWatch(true);document.addEventListener("visibilitychange",()=>visitWatch(!document.hidden));}
/* the question: a card at the bottom, nothing blocked */
function askVisit(p){const k=visitKey(p);V.asking=k;let el=document.getElementById("visitAsk");if(el)el.remove();
  el=document.createElement("div");el.id="visitAsk";el.className="vask";el.setAttribute("role","dialog");el.setAttribute("aria-label","Were you here?");document.body.appendChild(el);
  const done=()=>{el.remove();V.asking=null;};
  const step1=()=>{el.innerHTML='<button type="button" class="nudgex vx" aria-label="Close">'+X+'</button><p class="vq">Were you at '+esc(p.name)+'?</p><div class="chips"><button type="button" class="chip" data-a="visit_yes_eat">Yes, I ate here</button><button type="button" class="chip" data-a="visit_yes_takeaway">Yes, takeaway</button><button type="button" class="chip" data-a="visit_no">No, just passing</button></div>';
    el.querySelector(".vx").onclick=()=>{V.dismissed.add(k);done();};
    el.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{const a=b.dataset.a;markAsked(k);sendVisit(k,a);
      if(a==="visit_no"){done();return;}addVisit(p,a==="visit_yes_eat"?"ate":"takeaway");step2();});};
  const step2=()=>{el.innerHTML='<button type="button" class="nudgex vx" aria-label="Close">'+X+'</button><p class="vq">Was the price the same as the app?</p><div class="chips"><button type="button" class="chip" data-a="price_same">Yes</button><button type="button" class="chip" data-a="price_diff">No</button><button type="button" class="chip" data-a="price_skip">Didn’t check</button></div>';
    el.querySelector(".vx").onclick=done;
    el.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{sendVisit(k,b.dataset.a);el.innerHTML='<p class="vq">Thanks. Noted.</p>';setTimeout(done,1500);});};
  step1();}
/* Your visits (Settings): only the yes answers, only on this phone */
function visitsHTML(){const L=myVisits();if(!L.length)return '<p class="note">No visits yet. When you stay a few minutes somewhere with the app open, I’ll ask.</p>';
  const all=allPlaces();
  return '<div class="prices">'+L.map(v=>{const p=all.find(x=>x.id===v.id);const nm=v.name||(p&&p.name)||"A place you visited";const d=new Date(v.date+"T12:00:00");
    return '<div class="pr"><div>'+esc(nm)+'<span class="why">'+(v.how==="ate"?"Ate here":"Takeaway")+'</span></div><span class="meta">'+d.getDate()+" "+["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]+'</span></div>';}).join("")+'</div><p class="note">This list lives only on this phone.</p>';}
const PRIVACY_HTML='<div class="k" style="margin-top:4px">What we keep</div><p class="note">A random ID made on this phone, the visits you confirm (the place, your answer and the date), and anonymous counts of when the app is used.</p>'+
  '<div class="k" style="margin-top:10px">What we don’t keep</div><p class="note">Your name, email, phone number or position. Your name, cards and diet stay on this phone.</p>'+
  '<div class="k" style="margin-top:10px">How long</div><p class="note">12 months, then deleted.</p>'+
  '<div class="k" style="margin-top:10px">How to delete</div><p class="note">Forget me, at the end of this menu, deletes this phone’s ID and every visit we hold for it.</p>';
/* Forget me: the server first (Supabase function forget-me deletes every row of this ID), then this phone. If the server can't be reached,
   only the old ID is kept, to try again next time. */
async function forgetServer(id){if(!id||typeof ON_SITE==="undefined"||!ON_SITE)return true;
  try{const r=await fetchT(SB_URL+"/functions/v1/forget-me",{method:"POST",headers:SB_HEADERS,body:JSON.stringify({device_id:id})},6000);return r.ok;}catch(e){return false;}}
async function forgetMe(){const id=DEVICE_ID;const ok=await forgetServer(id);
  try{const keep=["fiver.tour","fiver.tapped","fiver.me","fiver.18"];const old=lsJSON("fiver.forget",[]);
    for(const k of Object.keys(localStorage))if(k.startsWith("fiver.")&&!keep.includes(k))localStorage.removeItem(k);
    if(!ok)lsPut("fiver.forget",old.concat(id).slice(-5));}catch(e){}
  return ok;}
async function forgetRetry(){const L=lsJSON("fiver.forget",[]);if(!L.length)return;const left=[];for(const id of L)if(!(await forgetServer(id)))left.push(id);if(left.length)lsPut("fiver.forget",left);else try{localStorage.removeItem("fiver.forget");}catch(e){}}
/* About this place (one tap each, all optional): from a place's details and after sending a menu */
const ATTRS=[["Seating",[["seat_sit_in","Sit in"],["seat_takeaway","Takeaway only"],["seat_both","Both"]]],["Tables",[["tables_few","Few"],["tables_lots","Lots"]]],["Atmosphere",[["vibe_quiet","Quiet"],["vibe_lively","Lively"]]]];
function attrsHTML(key){const mine=lsJSON("fiver.attrs",{})[key]||{};
  return '<div class="attrs" data-attrs="'+esc(key)+'">'+ATTRS.map(([label,opts],i)=>'<div class="arow"><span class="k">'+label+'</span><div class="chips">'+opts.map(([a,t])=>'<button type="button" class="chip'+(mine[i]===a?" on":"")+'" data-g="'+i+'" data-a="'+a+'">'+t+'</button>').join("")+'</div></div>').join("")+'<p class="note">Optional. One tap each.</p></div>';}
function wireAttrs(root){root.querySelectorAll("[data-attrs]").forEach(box=>box.addEventListener("click",e=>{const b=e.target.closest("button[data-a]");if(!b)return;const key=box.dataset.attrs,g=b.dataset.g;
  const all=lsJSON("fiver.attrs",{});const mine=all[key]||{};if(mine[g]===b.dataset.a)return;mine[g]=b.dataset.a;all[key]=mine;lsPut("fiver.attrs",all);sendVisit(key,b.dataset.a);
  box.querySelectorAll('button[data-g="'+g+'"]').forEach(x=>x.classList.toggle("on",x===b));}));}
setTimeout(()=>{visitStart();forgetRetry();},2000);

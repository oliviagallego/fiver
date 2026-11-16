/* ---------- SHARED LAYER: Supabase (what students teach Fiver) + Google Places (the Teach search) ----------
   Only on the Fiver website (GitHub Pages). Inside claude.ai, or if either service fails, the app carries on with what is on the phone.
   Keys here are the public ones (Supabase publishable key, a Google key restricted to the site). The Supabase secret key is never in the app. Photos are never uploaded. */
const SB_URL="https://fctqyxhxbxoojejcyfon.supabase.co";
const SB_KEY="sb_publishable_WLXyQ-ETrW3aQ3k_C9oIJw_Bi79zZU5";
const GP_KEY="AIzaSyDlV1NllOA93DmFjt7bcc8x5u-s70KNg2g"; // restricted to https://oliviagallego.github.io/* and https://fedforafiver.com (+ www) — works nowhere else
const ON_SITE=(()=>{try{return !(window.claude&&window.claude.use)&&typeof fetch==="function"&&(/(^|\.)github\.io$|^(www\.)?fedforafiver\.com$/.test(location.hostname)||localStorage.getItem("fiver.shared")==="1");}catch(e){return false;}})();
const DEVICE_ID=(()=>{try{let d=localStorage.getItem("fiver.device");if(!d){d=(crypto&&crypto.randomUUID?crypto.randomUUID():"10000000-1000-4000-8000-100000000000".replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)));localStorage.setItem("fiver.device",d);}return d;}catch(e){return "anon";}})();
const shared={rows:[],places:[],at:0,ok:null,loading:false};
function fetchT(url,opts,ms){const ctl=typeof AbortController==="function"?new AbortController():null;const timer=ctl?setTimeout(()=>ctl.abort(),ms):null;
  return fetch(url,Object.assign({},opts,{signal:ctl?ctl.signal:undefined})).finally(()=>{if(timer)clearTimeout(timer);});}
const SB_HEADERS={apikey:SB_KEY,Authorization:"Bearer "+SB_KEY,"Content-Type":"application/json"};
/* Anonymous counts in public.events: only the moment (open, results, walk, teach) and this phone's random id (DEVICE_ID).
   Never a name, a place, a card or the search words. Fire and forget: no waiting, no retries, errors ignored.
   ?me=1 once marks this phone as Olivia's: it never sends anything again. */
const TRACK_TYPES=["open","results","walk","teach"];
const TRACK_OFF=(()=>{try{if(/[?&]me=1(&|$)/.test(location.search))localStorage.setItem("fiver.me","1");return localStorage.getItem("fiver.me")==="1";}catch(e){return true;}})();
function track(type){if(TRACK_OFF||!ON_SITE||!TRACK_TYPES.includes(type))return;
  try{fetch(SB_URL+"/rest/v1/events",{method:"POST",keepalive:true,headers:Object.assign({Prefer:"return=minimal"},SB_HEADERS),body:JSON.stringify({type,device_id:DEVICE_ID})}).catch(()=>{});}catch(e){}}
/* "open": once per session (a new tab or a reopened app is a new session) */
(()=>{let first=true;try{first=sessionStorage.getItem("fiver.opened")!=="1";sessionStorage.setItem("fiver.opened","1");}catch(e){}if(first)setTimeout(()=>track("open"),0);})();
/* "results": once each time a new set of results settles on screen (1.5 s), not on every redraw */
let _trackRes={key:null,timer:null};
function trackResults(key){if(TRACK_OFF||!ON_SITE||key===_trackRes.key)return;clearTimeout(_trackRes.timer);_trackRes.timer=setTimeout(()=>{if(_trackRes.key===key)return;_trackRes.key=key;track("results");},1500);}
/* A contribution row → a place the ranker understands. Older than 30 days: "checked N days ago" and a lower rank. */
function sharedPlace(r){
  const age=Math.max(0,Math.floor((Date.now()-new Date(r.created_at).getTime())/86400000));
  const items=Array.isArray(r.items)?r.items.slice(0,60):[];
  const nl=!r.place_name&&!!r.place_id; // sent with its place_id only: the name comes live from Google
  const base={id:"sb-"+r.id,name:String(r.place_name||(nl?(LIVE_NAMES[r.place_id]||"Name needs a connection"):"Somewhere")).slice(0,48),nameLive:nl,lat:Number(r.lat),lon:Number(r.lon),addr:String(r.address||"").slice(0,80),status:"added",addedBy:String(r.added_by||"a student").slice(0,24),shared:true,age,placeId:r.place_id||"",coordSource:r.coord_source||""};
  if(r.kind==="event")return null; // no events in the app: the rows stay, they just don't show
  if(false){const s=r.starts_at?new Date(r.starts_at):null,e=r.ends_at?new Date(r.ends_at):null;if(!s||isNaN(s))return null;
    const hhmm=d=>String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");const date=s.getFullYear()+"-"+String(s.getMonth()+1).padStart(2,"0")+"-"+String(s.getDate()).padStart(2,"0");
    return Object.assign(base,{when:{date,start:hhmm(s),end:e&&!isNaN(e)?hhmm(e):addHours(hhmm(s),2)},offers:[{cat:"free",item:items[0]&&items[0].item||"free food",price:0,status:"added",tags:[]}],why:""});}
  const offers=items.filter(x=>x&&x.item&&typeof x.price==="number"&&x.price>=0&&x.price<=15).map(x=>({cat:CATS.some(c=>c.id===x.cat)?x.cat:"snack",item:String(x.item).slice(0,60),price:Math.round(x.price*100)/100,status:"added",tags:Array.isArray(x.diet)?x.diet.filter(t=>typeof t==="string"):[]}));
  if(!offers.length||isNaN(base.lat)||isNaN(base.lon))return null;
  return Object.assign(base,{hoursUnknown:true,offers,why:""});
}
/* Read everything 'live' when Results opens (3 s, then we stop waiting). Mine stay local, so they are skipped here. */
async function loadShared(force){
  if(!ON_SITE||shared.loading||(!force&&Date.now()-shared.at<60000))return;
  shared.loading=true;
  try{const res=await fetchT(SB_URL+"/rest/v1/contributions?select=id,created_at,kind,place_name,address,lat,lon,items,starts_at,ends_at,added_by,device_id,status,place_id,coord_source&status=eq.live&order=created_at.desc&limit=500",{headers:SB_HEADERS},3000);
    if(!res.ok)throw new Error("sb "+res.status);const rows=await res.json();
    const before=shared.places.map(p=>p.id).join(",");
    shared.rows=rows;shared.places=rows.filter(r=>r.device_id!==DEVICE_ID).map(sharedPlace).filter(Boolean);shared.ok=true;shared.at=Date.now();if(typeof liveNames==='function')liveNames(shared.places);
    if(before!==shared.places.map(p=>p.id).join(",")&&state.step===S.results&&!document.getElementById("sheetHost").firstChild)render();}
  catch(e){shared.ok=false;shared.at=Date.now();}
  finally{shared.loading=false;}
}
/* Save a contribution. Returns true when everyone near UCL can see it; false means it stayed on this phone. Never the photo. */
async function saveShared(row){
  shared.lastErr="";if(!ON_SITE)return false;track("teach");
  try{const res=await fetchT(SB_URL+"/rest/v1/contributions",{method:"POST",headers:Object.assign({Prefer:"return=minimal"},SB_HEADERS),body:JSON.stringify(Object.assign({device_id:DEVICE_ID,status:"live"},row))},5000);
    if(!res.ok)shared.lastErr="Supabase "+res.status;return res.ok;}
  catch(e){shared.lastErr=e&&e.name==="AbortError"?"Supabase timeout":"no connection";return false;}
}
/* ---------- Google Places (New): autocomplete, details, nearby. Photon is plan B, typing is plan C. ---------- */
let gpSession=null;
function gpToken(){if(!gpSession)gpSession=(crypto&&crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2));return gpSession;}
const GP_FOOD=new Set(["cafe","coffee_shop","restaurant","bakery","fast_food_restaurant","sandwich_shop","meal_takeaway","supermarket","convenience_store","grocery_store","food","store","bar","pub","food_store","dessert_shop","ice_cream_shop","juice_shop","tea_house","pizza_restaurant","chinese_restaurant","indian_restaurant","italian_restaurant","japanese_restaurant","sushi_restaurant","vegan_restaurant","vegetarian_restaurant","meal_delivery","breakfast_restaurant","brunch_restaurant","deli","food_court","market","shopping_mall","train_station","subway_station","transit_station","university","library","point_of_interest","establishment"]);
async function gpAutocomplete(q,bias){ // → rows {place,name,sub,placeId,src:"google"} (no coordinates yet)
  if(!ON_SITE)throw {code:"offline"};
  const body={input:q,sessionToken:gpToken(),regionCode:"gb",languageCode:"en",includedRegionCodes:["gb"],locationBias:{circle:{center:{latitude:bias.lat,longitude:bias.lon},radius:bias.radius||2000}}};
  const res=await fetchT("https://places.googleapis.com/v1/places:autocomplete",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":GP_KEY},body:JSON.stringify(body)},5000);
  if(!res.ok)throw {code:"google "+res.status};
  const j=await res.json();const rows=[];
  for(const s of (j.suggestions||[])){const p=s.placePrediction;if(!p||!p.placeId)continue;const types=p.types||[];
    const place=types.some(t=>GP_FOOD.has(t))&&!types.some(t=>["street_address","route","premise","subpremise","postal_code","locality","sublocality","neighborhood","geocode"].includes(t)&&!types.includes("establishment"));
    rows.push({place,name:(p.structuredFormat&&p.structuredFormat.mainText&&p.structuredFormat.mainText.text)||(p.text&&p.text.text)||"",sub:(p.structuredFormat&&p.structuredFormat.secondaryText&&p.structuredFormat.secondaryText.text)||"",placeId:p.placeId,src:"google"});}
  return rows.sort((a,b)=>(b.place?1:0)-(a.place?1:0)).slice(0,8);
}
/* Google's regularOpeningHours.periods → Fiver's hours ({wk,sat,sun} + a key per weekday; null = closed that day). None → null. */
function gpHours(h){if(!h||!Array.isArray(h.periods)||!h.periods.length)return null;
  const K=["sun","mon","tue","wed","thu","fri","sat"],hh=x=>String(x.hour||0).padStart(2,"0")+":"+String(x.minute||0).padStart(2,"0");
  if(h.periods.length===1&&h.periods[0].open&&!h.periods[0].close)return {wk:["00:00","23:59"],sat:["00:00","23:59"],sun:["00:00","23:59"]};
  const d={};for(const p of h.periods){if(!p.open)continue;const k=K[p.open.day];if(d[k])continue;let c=p.close?hh(p.close):"23:59";if(c==="00:00")c="23:59";d[k]=[hh(p.open),c];}
  const out={wk:d.mon||d.tue||d.wed||d.thu||d.fri||null,sat:d.sat||null,sun:d.sun||null};if(!out.wk)return null;
  for(const k of ["mon","tue","wed","thu","fri"])out[k]=d[k]||null;return out;}
async function gpDetails(placeId){ // → {lat,lon,addr}; ends the autocomplete session
  const tok=gpToken();gpSession=null;
  const res=await fetchT("https://places.googleapis.com/v1/places/"+encodeURIComponent(placeId)+"?sessionToken="+encodeURIComponent(tok)+"&languageCode=en&regionCode=gb",{headers:{"X-Goog-Api-Key":GP_KEY,"X-Goog-FieldMask":"location,shortFormattedAddress,regularOpeningHours,rating,userRatingCount"}},5000);
  if(!res.ok)throw {code:"google "+res.status};const j=await res.json();
  if(!j.location)throw {code:"google nolocation"};return {lat:j.location.latitude,lon:j.location.longitude,addr:j.shortFormattedAddress||"",hours:gpHours(j.regularOpeningHours),rating:j.rating,ratingN:j.userRatingCount};
}
async function gpNearby(at,radius){ // the food places within ~100 m, closest first
  if(!ON_SITE)return [];
  try{const body={includedTypes:["cafe","coffee_shop","restaurant","bakery","fast_food_restaurant","sandwich_shop","meal_takeaway","supermarket","convenience_store","grocery_store","dessert_shop","tea_house","pub","cafeteria","food_court"],maxResultCount:12,rankPreference:"DISTANCE",languageCode:"en",regionCode:"gb",locationRestriction:{circle:{center:{latitude:at.lat,longitude:at.lon},radius}}};
    const res=await fetchT("https://places.googleapis.com/v1/places:searchNearby",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":GP_KEY,"X-Goog-FieldMask":"places.id,places.displayName,places.location,places.shortFormattedAddress,places.regularOpeningHours,places.rating,places.userRatingCount"},body:JSON.stringify(body)},5000);
    if(!res.ok)return [];const j=await res.json();
    return (j.places||[]).filter(p=>p.location&&p.displayName).map(p=>({place:true,name:p.displayName.text||"",sub:p.shortFormattedAddress||"",lat:p.location.latitude,lon:p.location.longitude,placeId:p.id,src:"google",hours:gpHours(p.regularOpeningHours),rating:p.rating,ratingN:p.userRatingCount}));}
  catch(e){return [];}
}

/* ---------- What this phone keeps from Google (08/11/2026) ----------
   Kept: the place_id (no time limit) and the point (lat/lon), 30 days at most. Nothing else: no name, address, hours, rating or photos.
   Those stay in memory for this session only (GEO_MEM) and are asked again when a place's details open (gpLive).
   fiver.geo entries are {t, pid?, lat?, lon?, miss?}; after 30 days only the place_id is left. */
const GEO_TTL=30*86400000;const GEO_MEM={};
function geoAll(){try{const j=JSON.parse(localStorage.getItem("fiver.geo")||"{}");return j&&typeof j==="object"?j:{};}catch(e){return {};}}
function geoKeep(v){const o={t:v.t||Date.now()};if(v.pid)o.pid=String(v.pid);if(v.miss)o.miss=true;if(typeof v.lat==="number"&&typeof v.lon==="number"){o.lat=v.lat;o.lon=v.lon;}return o;}
function geoGet(k){const m=GEO_MEM[k];if(m&&Date.now()-m.t<GEO_TTL)return m;const g=geoAll()[k];return g&&Date.now()-g.t<GEO_TTL&&(g.miss||typeof g.lat==="number")?g:null;}
function geoPut(k,v,memOnly){const e=Object.assign({t:Date.now()},v);GEO_MEM[k]=e;if(memOnly)return; // the full answer for this session only
  try{const all=geoAll();for(const x in all)if(Date.now()-all[x].t>=GEO_TTL){if(all[x].pid)all[x]={t:all[x].t,pid:all[x].pid};else delete all[x];}
    all[k]=geoKeep(e);localStorage.setItem("fiver.geo",JSON.stringify(all));}catch(e2){}}
function pidOf(k){const m=GEO_MEM[k];if(m&&m.pid)return m.pid;const g=geoAll()[k];return g&&g.pid||"";}
/* phones that kept the old 30-day copy: names, addresses, hours, ratings and the nearby lists go, the place_id and the point stay */
(function(){try{if(localStorage.getItem("fiver.mig.gp")==="1")return;const g=geoAll(),out={};
  for(const k in g){const v=g[k];if(!v||/^(gn|lh):/.test(k))continue;const o=geoKeep(v);if(Date.now()-o.t>=GEO_TTL){if(o.pid)out[k]={t:o.t,pid:o.pid};continue;}out[k]=o;}
  localStorage.setItem("fiver.geo",JSON.stringify(out));localStorage.setItem("fiver.mig.gp","1");}catch(e){}})();
/* Live from Google when a place's details open: name, hours, rating and how many ratings. In memory for this session, never on the phone. null offline. */
const LIVE={},LIVE_NAMES={};
async function gpLive(pid){if(!pid)return null;if(LIVE[pid])return LIVE[pid];if(typeof ON_SITE==="undefined"||!ON_SITE||(typeof navigator!=="undefined"&&navigator.onLine===false))return null;
  try{const res=await fetchT("https://places.googleapis.com/v1/places/"+encodeURIComponent(pid)+"?languageCode=en&regionCode=gb",{headers:{"X-Goog-Api-Key":GP_KEY,"X-Goog-FieldMask":"displayName,regularOpeningHours,rating,userRatingCount"}},5000);
    if(!res.ok)return null;const j=await res.json();const x={name:(j.displayName&&j.displayName.text)||"",hours:gpHours(j.regularOpeningHours),rating:j.rating,ratingN:j.userRatingCount};
    LIVE[pid]=x;if(x.name)LIVE_NAMES[pid]=x.name;return x;}catch(e){return null;}}
async function gpFind(text,near,radius){
  if(!ON_SITE)return null;
  try{const body={textQuery:text,maxResultCount:1,languageCode:"en",regionCode:"gb"};if(near)body.locationBias={circle:{center:{latitude:near.lat,longitude:near.lon},radius:radius||3000}};
    const res=await fetchT("https://places.googleapis.com/v1/places:searchText",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":GP_KEY,"X-Goog-FieldMask":"places.id,places.location,places.regularOpeningHours,places.rating,places.userRatingCount"},body:JSON.stringify(body)},5000);
    if(!res.ok)return null;const j=await res.json();const p=(j.places||[])[0];if(!p||!p.location)return null;
    return {lat:p.location.latitude,lon:p.location.longitude,pid:p.id,hours:gpHours(p.regularOpeningHours),rating:p.rating,ratingN:p.userRatingCount};}
  catch(e){return null;}}
/* Several branches of one chain near a point (McDonald's, Subway, Burger King): up to 5 (the caller keeps only place_id and point) */
async function gpFindMany(text,near,radius,n){
  if(!ON_SITE)return null;
  try{const body={textQuery:text,maxResultCount:n||5,languageCode:"en",regionCode:"gb",locationBias:{circle:{center:{latitude:near.lat,longitude:near.lon},radius:radius||1200}}};
    const res=await fetchT("https://places.googleapis.com/v1/places:searchText",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":GP_KEY,"X-Goog-FieldMask":"places.id,places.displayName,places.location,places.shortFormattedAddress,places.regularOpeningHours,places.rating,places.userRatingCount"},body:JSON.stringify(body)},5000);
    if(!res.ok)return null;const j=await res.json();
    return (j.places||[]).filter(p=>p.location).map(p=>({lat:p.location.latitude,lon:p.location.longitude,pid:p.id,name:(p.displayName&&p.displayName.text)||"",addr:p.shortFormattedAddress||"",hours:gpHours(p.regularOpeningHours),rating:p.rating,ratingN:p.userRatingCount}));}
  catch(e){return null;}}
/* Look up a list one by one (no burst), skip what is cached, stop after max. done() runs once if anything changed. */
let geoBusy=false;
async function geoRefine(list,max,done){
  if(!ON_SITE||geoBusy)return;geoBusy=true;let n=0,changed=false;
  try{for(const it of list){if(n>=max)break;if(geoGet(it.key))continue;n++;let g=await gpFind(it.text,it.near,it.radius);if(g&&it.near&&it.maxM&&metres(g,it.near)>it.maxM)g=null; // too far from where it should be: not the same place
      geoPut(it.key,g?{lat:g.lat,lon:g.lon,pid:g.pid,hours:g.hours||null,rating:g.rating,ratingN:g.ratingN}:{miss:true});if(g)changed=true;}}
  finally{geoBusy=false;}
  if(changed&&done)done();}

/* Photo → menu JSON through the Supabase Edge Function read-menu. The phone sends a shrunken JPEG (base64); the function holds the Anthropic key as a secret,
   stores nothing, and answers {text}. 12 s timeout; any failure becomes {code:"edge_failed"} so Teach falls back to typing. */
/* A sentence the local interpreter could not place → Claude (mode "wish") → {cat, sub, q, budget, mins, dayOffset, time, diet, mood}. 3 s, 30 a day per phone. */
async function readWishRemote(text){
  if(!ON_SITE)return null;
  try{const day=new Date().toISOString().slice(0,10);const c=JSON.parse(localStorage.getItem("fiver.wish")||"{}");const n=c.d===day?(c.n||0):0;if(n>=30)return null;localStorage.setItem("fiver.wish",JSON.stringify({d:day,n:n+1}));}catch(e){}
  try{const res=await fetchT(SB_URL+"/functions/v1/read-menu",{method:"POST",headers:SB_HEADERS,body:JSON.stringify({mode:"wish",text:String(text).slice(0,200),device_id:DEVICE_ID})},3000);
    if(!res.ok)return null;const j=await res.json();return j&&typeof j==="object"&&!j.error?j:null;}catch(e){return null;}}
async function readMenuRemote(prompt,image,max){
  let res;try{res=await fetchT(SB_URL+"/functions/v1/read-menu",{method:"POST",headers:SB_HEADERS,body:JSON.stringify({image,prompt,max:max||4000,device_id:DEVICE_ID})},60000);}catch(e){throw {code:"edge_failed"};}
  if(res.status===429)throw {code:"rate_limited"};if(!res.ok)throw {code:"edge_failed"};
  let j;try{j=await res.json();}catch(e){throw {code:"edge_failed"};}
  if(!j||typeof j.text!=="string")throw {code:"edge_failed"};return {text:j.text,stop:j.stop||""};
}

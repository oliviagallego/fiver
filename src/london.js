/* ---------- LONDON: every branch of the chains in Greater London ----------
   london.json (built from OpenStreetMap by build-london.html) is NOT in index.html: it is asked for after the first screen,
   kept by the service worker (works offline) and asked again when the version changes. Until it arrives the app works as before.
   Each branch takes its chain's prices (LCHAINS[].from). Places Fiver already had (by hand, uni lists, Drinks, taught) always win:
   the same chain within 60 m is the same shop. Hours come from OSM opening_hours; unreadable = "Hours not checked". */
const LON={status:"idle",rows:null,grid:null,bars:{},markets:{},c15:{},v:0,built:"",count:0};
const LEX=new RegExp(LEXCL,"i");
const LCH={};LCHAINS.forEach((c,i)=>{c.re=new RegExp(c.rx,"i");c.ix=i;LCH[c.id]=c;});
function lnorm(s){return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[’‘`´]/g,"'").trim();}
/* Which of the 103 chains a shop name belongs to ("McDonald’s" → mcdonalds). "Leon's Fish Bar" is not Leon: a name followed by 's is another shop. */
function chainIdOf(name){const n=lnorm(name);if(!n||LEX.test(n))return null;
  for(const c of LCHAINS){const m=c.re.exec(n);if(!m)continue;if(c.ex&&new RegExp(c.ex,"i").test(n))continue;const after=n.slice(m.index+m[0].length);if(/^'s\b/.test(after)&&!/'s$/.test(m[0]))continue;return c.id;}
  return null;}
function lcOf(p){if(p._lc===undefined){let v=null;try{v=chainIdOf(p.name);}catch(e){}try{Object.defineProperty(p,"_lc",{value:v,enumerable:false,configurable:true});}catch(e){return v;}}return p._lc;}

/* OSM opening_hours → {sun:[o,c]|null, mon:…}. "Mo-Fr 07:00-23:00; Sa 08:00-22:00; Su off", "24/7", "10:00-02:00" (past midnight).
   Anything it can't read (months, sunrise, odd syntax) → null = "Hours not checked". Never a guess per chain. */
const OH_D={Mo:1,Tu:2,We:3,Th:4,Fr:5,Sa:6,Su:0},OH_ORDER=["Mo","Tu","We","Th","Fr","Sa","Su"],OH_K=["sun","mon","tue","wed","thu","fri","sat"];
const _ohCache=new Map();
function parseOH(s){if(!s)return null;if(_ohCache.has(s))return _ohCache.get(s);let r=null;try{r=parseOH_(String(s));}catch(e){r=null;}_ohCache.set(s,r);return r;}
function parseOH_(s){s=s.trim().replace(/\s+/g," ");
  const all=v=>{const h={};OH_K.forEach(k=>h[k]=v);return h;};
  if(/^24\/7$/.test(s))return all(["00:00","24:00"]);
  const pad=(h,m)=>{h=Number(h);if(h>24)h-=24;return String(h).padStart(2,"0")+":"+m;};
  const out={};let any=false;
  const rules=s.split(/\s*;\s*/).flatMap(x=>x.split(/,\s+(?=(?:Mo|Tu|We|Th|Fr|Sa|Su|PH)\b)/));
  for(let r of rules){r=r.trim();if(!r)continue;
    if(/^(PH|SH)\b/.test(r))continue; // bank holidays: not our business
    if(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|week|easter|sunrise|sunset|dawn|dusk)\b/i.test(r))return null;
    const m=/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:,(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)*)(?:,PH)?\s*:?\s*(.*)$/.exec(r);
    let days=[0,1,2,3,4,5,6],rest=r;
    if(m){days=[];for(const part of m[1].split(",")){const [a,b]=part.split("-");const ia=OH_ORDER.indexOf(a),ib=OH_ORDER.indexOf(b||a);if(ia<0||ib<0)return null;
        for(let i=ia;;i=(i+1)%7){days.push(OH_D[OH_ORDER[i]]);if(i===ib)break;}}rest=m[2].trim();}
    rest=rest.replace(/"[^"]*"/g,"").trim();
    if(/^(off|closed)$/i.test(rest)){days.forEach(d=>out[d]=null);any=true;continue;}
    if(rest==="24/7"){days.forEach(d=>out[d]=["00:00","24:00"]);any=true;continue;}
    const TR=/(\d{1,2}):(\d\d)\s*-\s*(\d{1,2}):(\d\d)\+?/g;const ts=[...rest.matchAll(TR)];
    if(!ts.length||rest.replace(TR,"").replace(/[,\s]/g,"")!=="")return null;
    const o=pad(ts[0][1],ts[0][2]),last=ts[ts.length-1];const c=pad(last[3],last[4]);
    days.forEach(d=>out[d]=o===c||(o==="00:00"&&c==="24:00")?["00:00","24:00"]:[o,c]);any=true;}
  if(!any)return null;const h={};for(let d=0;d<7;d++)h[OH_K[d]]=(d in out)?out[d]:null;return h;}

/* A chain's prices: the template the app already has (app:), a catalogue (file:), a meal deal (new:meal-deals), pints (new:pintas, Drinks only) or none */
const _lnTpl={};
function tplById(id){return PLACES.find(p=>p.id===id)||CHAIN_TEMPLATES.find(p=>p.id===id)||null;}
function lnTpl(cid){if(cid in _lnTpl)return _lnTpl[cid];const c=LCH[cid];let t=null;const f=c?c.from:"none";
  if(f.startsWith("app:")){t=tplById(f.slice(4).replace(/\+15$/,""))||mealDealTpl(cid);}
  else if(/^file:fiver-catalogo-(mcdonalds|subway|burgerking)\.json/.test(f))t=tplById(f.match(/catalogo-(\w+)\.json/)[1]+"-tpl");
  else if(/^file:fiver-catalogo-[a-z0-9_-]+\.json$/.test(f)&&CAT15[cid]){const b=tplById("c15-"+cid); // Eggslut, Knoops, Coffee Plant, Speedboat, Poke House, Oakberry, T4, The Elgin
    // names still marked "(confirmar)" or "?" in the catalogue are not shown; T4's fruit teas and Knoops' hot chocolates are drinks, not hot food
    t=b?Object.assign({},b,{offers:b.offers.filter(o=>!/confirmar|\?\)|\?\s/i.test(o.item)).map(o=>o.cat==="hot"&&(cid==="t4"||cid==="knoops")?Object.assign({},o,{cat:"coffee"}):o)}):null;}
  else if(f.startsWith("file:fiver-catalogo-15.json#")){const nm=f.split("#")[1].split(" + ")[0];const ch=Object.keys(CAT15).find(k=>CAT15[k].full===nm||CAT15[k].name===nm);t=ch?tplById("c15-"+ch):null;}
  else if(f==="new:meal-deals")t=mealDealTpl(cid);
  else if(f==="new:pintas")t="drinks";
  return _lnTpl[cid]=t||"none";}
/* Meal deals of fiver-meal-deals.json for chains with no shop template yet (Morrisons, Asda, WHSmith, Aldi). not_found → none. */
function mealDealTpl(cid){const d=LMEALDEALS[cid];if(!d)return null;
  if(d.items&&cid==="aldi")return {id:"md-aldi",name:"Aldi",status:"shop",offers:d.items.filter(x=>typeof x.price==="number").map(x=>({cat:"snack",item:x.deal+(x.note==="from"?" (from)":""),price:x.price,status:"press",tags:[],lb:x.note==="from"})),why:"Aldi has no meal deal. "+(d.note||"")};
  if(typeof d.price==="number"&&DEALS[cid])return {id:"md-"+cid,name:(LCH[cid]||{}).name||cid,status:"shop",deal:cid,offers:[{cat:"deal",item:"Meal deal: "+(d.includes||"main + snack + drink"),status:DEALS[cid].status||"press",tags:[]}].concat(d.premium&&typeof d.premium.price==="number"?[{cat:"deal",item:"Premium meal deal",price:d.premium.price,status:"press",tags:[]}]:[]),why:d.note||""};
  if(cid==="whsmith"&&d.price){return {id:"md-whsmith",name:"WHSmith",status:"shop",offers:[{cat:"deal",item:"Meal deal: main + snack + drink",price:5.5,about:true,aboutWhy:"at stations · check at the till",status:"press",tags:[]}],why:d.note||""};}
  return null;}

/* Load london.json after the first screen; render again when it arrives (an open sheet stays open). */
function loadLondon(){if(LON.status!=="idle"||typeof fetch!=="function"||IN_CLAUDE)return;LON.status="loading";const t0=Date.now();
  fetch("london.json").then(r=>{if(!r.ok)throw new Error("no london.json ("+r.status+")");return r.json();}).then(j=>{
    if(!j||!Array.isArray(j.rows)||!Array.isArray(j.chains))throw new Error("bad london.json");
    const map=j.chains.map(id=>LCH[id]?LCH[id].ix:-1);const rows=[];
    for(const r of j.rows){const ci=map[r[0]];if(ci<0||typeof r[1]!=="number"||typeof r[2]!=="number")continue;rows.push([ci,r[1],r[2],r[3]||"",r[4]||"",r[5]||"",r[6]||"",r[7]||""]);}
    const grid=new Map();rows.forEach((r,i)=>{const k=Math.floor(r[1]*50)+":"+Math.floor(r[2]*33);(grid.get(k)||grid.set(k,[]).get(k)).push(i);});
    Object.assign(LON,{status:"ok",rows,grid,bars:j.bars||{},markets:j.markets||{},c15:j.c15||{},v:LON.v+1,built:j.built||"",count:rows.length,ms:Date.now()-t0});
    _lnNear.key="";VOCAB=null;if(typeof _barsLn!=="undefined")_barsLn=null;
    if(state.step===S.results)render();})
  .catch(e=>{LON.status="none";LON.err=String(e&&e.message||e);if(state.step===S.results&&!state.q)render();});}

/* The branches near where you are (3.8 km: the 45-minute walk), as places the ranker understands. Cached per spot. */
let _lnNear={key:"",list:[]};
function lnPlace(r,i){const [ci,lat,lon,name,addr,oh,osm]=r;const c=LCHAINS[ci];const t=lnTpl(c.id);if(t==="drinks")return null;
  const id="ln-"+(osm||("x"+i));const nm=name||c.name;let p;
  if(t==="none")p={id,name:nm,lat,lon,addr,chain:c.id,status:"shop",offers:[],unpriced:true,why:"Price not checked. Snap the menu →"};
  else{p=Object.assign({},t,{id,name:nm,lat,lon,addr,chain:c.id,status:"shop",chainPrice:true,why:t.why||CHAIN_WHY[c.id]||""});
    ["placeId","uniBranch","ucl","uni","audience","support","g","coordSource","cachedAt","refined","approxLL","_c15"].forEach(k=>delete p[k]);
    if(c.id==="leon"){delete p.discNo;p.disc=LEON_DISC;p.discMin=LEON_MIN;p.discNote=LEON_NOTE;}
    if(c.id==="wasabi")wasabiFix(p);}
  p.london=true;p.osm=osm;
  const h=parseOH(oh),gh=!h&&typeof geoGet==="function"?geoGet("lh:"+id):null;
  if(h){p.hours=h;delete p.hoursUnknown;}else if(gh&&gh.hours){p.hours=gh.hours;delete p.hoursUnknown;p.hoursFrom="google";}else{delete p.hours;p.hoursUnknown=true;}
  return p;}
/* Westfield Stratford City: 41 shops photographed 20-21/10 (src/westfield_data.js), each with its floor. Their own prices win over the chain's;
   McDonald's, Greggs, Popeyes, Starbucks and Costa were photographed in part, so the rest of their menu keeps the chain price (marked). */
const WF_PARTIAL=new Set(["mcdonalds","greggs","popeyes","starbucks","costa"]);
const wfKey=s=>String(s||"").toLowerCase().replace(/\([^)]*\)/g," ").replace(/\b(small|regular|medium|large|tall|grande|venti|short)\b/g," ").replace(/[^a-z0-9]+/g," ").trim();
let _wf=null;
function wfPlaces(){if(_wf)return _wf;if(typeof WESTFIELD==="undefined")return _wf=[];
  _wf=WESTFIELD.places.map(w=>{const offers=w.offers.map(a=>Object.assign({cat:a[0],item:a[1],price:a[2],status:"photo",checked:w.date,tags:a[3]},a[4]||{}));
    const p={id:w.id,name:w.name,lat:w.ll[0],lon:w.ll[1],wfAnchor:!!w.llAnchor,addr:w.addr,floor:w.floor,chain:w.chain||undefined,status:"shop",offers,why:w.why||"",london:true,westfield:true,osm:w.osm||""};
    if(w.serviceNote){p.service=true;p.serviceNote=w.serviceNote;}
    if(w.hours){p.hours=w.hours;}else p.hoursUnknown=true;
    if(w.chain==="leon"){p.disc=LEON_DISC;p.discMin=LEON_MIN;p.discNote=LEON_NOTE;}
    if(WF_PARTIAL.has(w.chain)){const t=lnTpl(w.chain);if(t&&typeof t==="object"){const have=new Set(offers.map(o=>wfKey(o.item)));
      for(const o of t.offers||[])if(!have.has(wfKey(o.item))){have.add(wfKey(o.item));offers.push(Object.assign({},o,{chainPrice:true}));}
      if(t.deal)p.deal=t.deal;if(t.disc)p.disc=t.disc;if(t.promos)p.promos=t.promos;}}
    return p;});
  return _wf;}
function wfNear(here){if(typeof WESTFIELD==="undefined"||metres(here,{lat:WESTFIELD.anchor[0],lon:WESTFIELD.anchor[1]})>3800)return [];return wfPlaces();}
/* A uni-list branch of the same chain in the centre (Greggs "Westfield Shopping Centre", Tortilla "The Galley Westfield") is the same shop: the photographed one wins */
function wfShadow(p){if(!p||!p.uniBranch||!p.chain)return false;const wf=wfNear(state.where||VENUES[0]);return wf.length>0&&wf.some(w=>w.chain===p.chain&&(metres(w,p)<60||/westfield/i.test(p.addr||"")&&metres(w,p)<400));}
const WF_OSM=typeof WESTFIELD!=="undefined"?new Set(WESTFIELD.places.map(w=>w.osm).filter(Boolean)):new Set();
function londonNear(){const here=state.where||VENUES[0];if(LON.status!=="ok")return wfNear(here);
  const key=here.lat.toFixed(3)+","+here.lon.toFixed(3)+"|"+LON.v+"|"+state.uni+"|"+state.added.length+"|"+(shared.places||[]).length+"|"+(typeof geoStamp==="function"?geoStamp():0);
  if(_lnNear.key===key)return _lnNear.list;
  const R=3800,cy=Math.floor(here.lat*50),cx=Math.floor(here.lon*33),idx=[];
  for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){const g=LON.grid.get((cy+a)+":"+(cx+b));if(g)idx.push(...g);}
  // what Fiver already has near here wins: same chain within 60 m
  const known=PLACES.concat(uniPlaces(),typeof DRINKS!=="undefined"?DRINKS.venues.map(venuePlace).filter(Boolean):[],state.added,shared.places||[]).filter(p=>p&&typeof p.lat==="number"&&Math.abs(p.lat-here.lat)<0.05&&Math.abs(p.lon-here.lon)<0.08);
  const byChain={};for(const p of known){const c=lcOf(p);if(c)(byChain[c]=byChain[c]||[]).push(p);}
  const out=[],wf=wfNear(here);
  for(const i of idx){const r=LON.rows[i];if(metres(here,{lat:r[1],lon:r[2]})>R)continue;const cid=LCHAINS[r[0]].id;const ll={lat:r[1],lon:r[2]};
    if((byChain[cid]||[]).some(k=>metres(k,ll)<60))continue;if(out.some(o=>o.chain===cid&&metres(o,ll)<30))continue;
    if(WF_OSM.has(r[6])||wf.some(w=>w.chain===cid&&metres(w,ll)<40))continue; // the Westfield shop, with its own photographed prices
    const p=lnPlace(r,i);if(p)out.push(p);}
  // independents and markets of the £15 catalogue, at their own address
  for(const ch in LON.c15){const ll=LON.c15[ch];const t=tplById("c15-"+ch);if(!t||!Array.isArray(ll)||metres(here,{lat:ll[0],lon:ll[1]})>R)continue;
    if(known.some(k=>lnorm(k.name)===lnorm(t.name)&&metres(k,{lat:ll[0],lon:ll[1]})<120))continue;
    const a=LC15ADDR.find(x=>x.chain===ch);const p=Object.assign({},t,{id:"c15p-"+ch,lat:ll[0],lon:ll[1],status:"shop",london:true,independent:true});
    if(a&&a.hours){p.hours=a.hours;delete p.hoursUnknown;}else{delete p.hours;p.hoursUnknown=true;}out.push(p);}
  out.push(...wf);
  _lnNear={key,list:out};return out;}

/* Google, only as a back-up: when london.json hasn't arrived, or fewer than 8 places are open around you.
   places:searchNearby, nearest first, inside the circle you can walk. Chains get their prices; other food within 10 min goes to "Not priced yet".
   Kept in memory for this session only (08/11): Google's names, addresses and hours never stay on the phone. An empty answer is asked again after an hour. */
(function(){try{if(localStorage.getItem("fiver.mig.cl")!=="1"){const g=JSON.parse(localStorage.getItem("fiver.geo")||"{}");for(const k in g)if(/^cl:/.test(k))delete g[k];
  localStorage.setItem("fiver.geo",JSON.stringify(g));localStorage.setItem("fiver.mig.cl","1");}}catch(e){}})();
const GN_TYPES=["fast_food_restaurant","restaurant","cafe","bakery","sandwich_shop","hamburger_restaurant","pizza_restaurant","meal_takeaway","supermarket","grocery_store","convenience_store"];
async function gpNearbyFood(at,radius){
  try{const body={includedTypes:GN_TYPES,maxResultCount:20,rankPreference:"DISTANCE",languageCode:"en",regionCode:"gb",locationRestriction:{circle:{center:{latitude:at.lat,longitude:at.lon},radius}}};
    const res=await fetchT("https://places.googleapis.com/v1/places:searchNearby",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":GP_KEY,"X-Goog-FieldMask":"places.id,places.displayName,places.location,places.shortFormattedAddress,places.regularOpeningHours,places.rating,places.userRatingCount"},body:JSON.stringify(body)},6000);
    if(!res.ok)return null;const j=await res.json();
    return (j.places||[]).filter(p=>p.location&&p.displayName).map(p=>({pid:p.id,name:p.displayName.text||"",lat:p.location.latitude,lon:p.location.longitude,addr:p.shortFormattedAddress||"",hours:gpHours(p.regularOpeningHours),rating:p.rating,ratingN:p.userRatingCount}));}
  catch(e){return null;}}
function gnKey(here){return "gn:"+here.lat.toFixed(3)+","+here.lon.toFixed(3)+":"+Math.min((state.mins||15)*80,1500);}
function gnGet(k){const g=GEO_MEM[k];if(!g)return null;const age=Date.now()-g.t;if(!g.list||!g.list.length)return age<3600e3?g:null;return g;} // this session only: Google's names never stay on the phone
let gnBusy={};
function openAround(here,radius){const t=selectedTime();return PLACES.concat(uniPlaces(),londonNear()).filter(p=>!p.unpriced&&!p.when&&metres(here,p)<=radius&&isOpen(p,t).open).length;}
async function refineChains(){const here=state.where;if(!here||typeof ON_SITE==="undefined"||!ON_SITE)return;
  if(LON.status==="loading")return; // wait for london.json first
  const radius=Math.min((state.mins||15)*80,1500);const k=gnKey(here);
  if(gnGet(k)||gnBusy[k])return;
  if(LON.status==="ok"&&openAround(here,radius)>=8)return;
  gnBusy[k]=true;
  let list=await gpNearbyFood(here,radius);if(list===null){await new Promise(r=>setTimeout(r,3000));list=await gpNearbyFood(here,radius);}
  gnBusy[k]=false;if(list===null)return; // failed twice: nothing kept, the next search tries again
  geoPut(k,{list},true);if(state.step===S.results&&!state.drinks)render();}
function foundChains(){const here=state.where;if(!here||typeof geoGet!=="function")return [];const g=gnGet(gnKey(here));if(!g||!g.list)return [];
  const known=PLACES.concat(uniPlaces(),londonNear(),state.added,shared.places||[]).filter(p=>p&&typeof p.lat==="number"&&metres(here,p)<2500);const out=[];
  for(const b of g.list){if(out.some(x=>x.placeId===b.pid))continue;const cid=chainIdOf(b.name);
    if(known.some(k=>(k.placeId&&k.placeId===b.pid)||(cid&&lcOf(k)===cid&&metres(k,b)<60)))continue;
    const t=cid?lnTpl(cid):"none";if(t==="drinks")continue;const walk=Math.max(1,Math.round(metres(here,b)/80));
    if(t==="none"){if(walk>10)continue;out.push({id:"gf-"+b.pid,name:b.name,lat:b.lat,lon:b.lon,addr:b.addr||"",placeId:b.pid,chain:cid,status:"shop",offers:[],unpriced:true,hours:b.hours||undefined,hoursUnknown:!b.hours,coordSource:"google",why:"Price not checked. Snap the menu →"});continue;}
    const p=Object.assign({},t,{id:"gf-"+b.pid,name:b.name,lat:b.lat,lon:b.lon,addr:b.addr||"",placeId:b.pid,chain:cid,status:"shop",chainPrice:true,rating:b.rating,ratingN:b.ratingN,coordSource:"google",why:t.why||CHAIN_WHY[cid]||""});
    ["uniBranch","ucl","uni","audience","support","g","cachedAt","refined","approxLL","_c15"].forEach(x=>delete p[x]);
    if(b.hours){p.hours=b.hours;delete p.hoursUnknown;}else{delete p.hours;p.hoursUnknown=true;}out.push(p);}
  return out;}
/* Hours not in OSM: for the first 5 shown, ask Google once per session (kept in memory, never on the phone). Never a guess. */
let lhAsked=new Set();
async function askHours(rows){if(typeof ON_SITE==="undefined"||!ON_SITE)return;let n=0,changed=false;
  for(const row of rows){const p=row.p;if(!p.london||!p.hoursUnknown||lhAsked.has(p.id))continue;if(++n>5)break;lhAsked.add(p.id);
    if(geoGet("lh:"+p.id))continue;const g=await gpFind(p.name+(p.addr?", "+p.addr:"")+", London",p,200);
    geoPut("lh:"+p.id,g&&g.hours&&metres(g,p)<250?{hours:g.hours}:{miss:true},true);if(g&&g.hours)changed=true;} // hours: this session only
  if(changed){_lnNear.key="";if(state.step===S.results)render();}}

/* ---------- DRINKS: behind a one-tap 18+ check (remembered on this phone). Food stays open to everyone. ----------
   Rules from claude/fiver-catalogo-bebidas.json: a price only at level 1 or 2 (level 2 always with its label); sorted by the price of the drink,
   never by alcohol per pound; no bottomless deals or drinking games; an alcohol-free pick on top every time. The party rat lives only in here. */
const DRINKS_CAT={id:"drinks",ico:"cat_drinks",name:"Drinks"};
const DRINK_WORDS=/\b(beer|beers|pint|pints|cider|ciders|wine|wines|lager|lagers|ale|pitcher|cerveza|cervezas|birra|mocktail|mocktails|alcohol[- ]free|drinks?)\b/i;
const DRINK_RX={beer:/pint|lager|beer|corona|pacifico|brewgooder|pitcher|ale\b|budweiser|peroni/i,cider:/cider/i,wine:/wine/i,mocktail:/mocktail|alcohol-free|0\.0|0%|0\.5%|soft drink/i};
function isAdult(){try{return localStorage.getItem("fiver.18")==="1";}catch(e){return !!UI.adult;}}
function drinkWord(q){const s=String(q||"").toLowerCase();if(/cider/.test(s))return "cider";if(/wine/.test(s))return "wine";if(/mocktail|alcohol.free|soft/.test(s))return "mocktail";if(/beer|pint|lager|ale\b|pitcher|cerveza|birra/.test(s))return "beer";return "";}
function toggleDrinks(){if(state.drinks){state.drinks=false;render();return;}
  if(!isAdult()){openDrinksGate(()=>{state.drinks=true;render();});return;}
  state.drinks=true;render();}
function openDrinksGate(onYes){
  const host=document.getElementById("sheetHost");const T=DRINKS.texts;
  host.innerHTML='<div class="sheetWrap" id="sheetWrap"><div class="sheet gate" role="dialog" aria-modal="true" aria-label="'+esc(T.gate_title)+'"><button class="close" id="closeSheet">Close</button>'+
    '<span class="ms" data-ms="'+esc(T.gate_title)+'" style="--ms:22px"></span><p class="body" style="margin:12px 0 16px">'+esc(T.gate_body)+'</p>'+
    '<div class="gateBtns"><button type="button" class="btn pri" id="gateYes">'+esc(T.gate_yes)+'</button><button type="button" class="btn sec" id="gateNo">'+esc(T.gate_no)+'</button></div>'+
    '<p class="note" style="margin-top:12px">Remembered on this phone. Food stays open to everyone.</p></div></div>';
  msRender(host);const close=()=>{host.innerHTML="";};
  host.querySelector("#closeSheet").onclick=close;host.querySelector("#gateNo").onclick=close;host.querySelector("#sheetWrap").addEventListener("click",e=>{if(e.target.id==="sheetWrap")close();});
  host.querySelector("#gateYes").onclick=()=>{try{localStorage.setItem("fiver.18","1");}catch(e){}UI.adult=true;close();if(onYes)onYes();};
  host.querySelector("#gateYes").focus();}
/* Day and time of an offer: "Wednesdays 19:00-00:30" still holds at 00:15 on Thursday. */
function offerOn(o,t){const days=o.days,w=o.time;
  if(!w)return !days||days.includes(DAYK[t.day]);
  const a=hm(w[0]),b=hm(w[1]);
  if(b>a)return (!days||days.includes(DAYK[t.day]))&&t.minutes>=a&&t.minutes<b;
  if(t.minutes>=a)return !days||days.includes(DAYK[t.day]);
  return t.minutes<b&&(!days||days.includes(DAYK[(t.day+6)%7]));}
function unitPrice(o){return typeof o.per_pint==="number"?o.per_pint:o.price;}
function priceText(o){if(typeof o.price!=="number")return "";return money(o.price)+(o.per_pint?" ("+money(o.per_pint)+" a pint)":"")+(o.level===2&&o.label?" · "+o.label:"");}
function venuePlace(v){const g=geoGet("d:"+v.id);
  if(g&&!g.miss)return Object.assign({},v,{lat:g.lat,lon:g.lon,placeId:g.pid||"",rating:g.rating,ratingN:g.ratingN,approxLL:false,hours:v.hours||g.hours||undefined,hoursUnknown:!(v.hours||g.hours)});
  return v.lat==null?null:v;}
function nearestBranch(test,here,maxM){let best=null,bd=maxM;
  for(const p of PLACES.concat(uniPlaces())){if(!test(p))continue;const m=metres(here,p);if(m<bd){bd=m;best=p;}}return best;}
/* Bar food under a fiver (TCR Bar, Fitzrovia Belle) joins the normal food list as snacks, once the bar has its point */
function barFood(){const out=[];for(const v of DRINKS.venues){if(!v.food||!v.food.length)continue;const p=venuePlace(v);if(!p)continue;
    out.push({id:"bf-"+v.id,name:v.name,lat:p.lat,lon:p.lon,addr:p.addr||"",hours:p.hours,hoursUnknown:!p.hours,placeId:p.placeId||"",status:"photo",offers:v.food.map(f=>Object.assign({},f)),
      why:(v.id==="fitzrovia-belle"?"Sides only under a fiver. ":"")+"Prices from the menu, 15 Oct 2026."});}
  return out;}
const NOT_IN_CATALOGUE=new Set(["yo_sushi","wahaca","cote"]);
/* Uni bars (fiver-bares-unis.json) and cheap chain pubs across London (london.json + fiver-pintas-londres.json).
   Chain pub prices change from pub to pub: always "about" or "from". Happy hours only on their days and hours. */
function barKey(n){const s=String(n||"");const paren=(/\(([^)]*)\)/.exec(s)||[])[1]||"";return [lnorm(s.split(" (")[0]).replace(/^the /,""),lnorm(paren).replace(/^the /,"")];}
function sameBar(a,b){const [x,xp]=barKey(a),[y,yp]=barKey(b);return x===y||(xp&&xp===y)||(yp&&yp===x);}
function barAccess(b){if(/imperial/i.test(b.uni)&&/members/i.test(b.access))return "Imperial, RCM or RCA members + 2 guests";if(/public/i.test(b.access)&&!/not open to public/i.test(b.access))return "";return "Student ID at the door";}
function barOffers(b){return typeof b.pint==="number"?[{item:"Pint (cheapest found, "+String(b.date||"2025-26").slice(0,4)+")",price:b.pint,level:1}]:[];}
function pintOffers(ch,addr){const P=(typeof LPINTS!=="undefined"&&LPINTS[ch])||null;if(!P)return [];const SF=["sun","mon","tue","wed","thu","fri"],MF=["mon","tue","wed","thu","fri"];
  if(ch==="wetherspoon")return [{item:"Pint · about, prices vary by pub (exact price in the Wetherspoon app)",price:P.pint_about,level:1}].concat((P.deals||[]).filter(d=>typeof d.price_from==="number"&&d.days&&d.days.length===3).map(d=>({item:d.item+" · from",price:d.price_from,level:2,days:[d.days]})));
  if(ch==="samuel_smiths")return [{item:"Pint · about £3.50–£4.50, no phones inside",price:P.pint_about,level:1}];
  if(ch==="slug_lettuce")return [{item:"Pint · from, student offer, varies by bar",price:P.pint_from,level:1}];
  if(ch==="simmons")return [{item:"Happy hour pint",price:P.pint,level:1,days:SF,time:["16:00","20:00"]}];
  if(ch==="revolution")return [{item:"Happy hour beer",price:P.pint,level:1,days:SF,time:["17:00","22:00"]}];
  if(ch==="belushis")return /borough high/i.test(addr||"")?[{item:"Happy hour pint",price:P.pint,level:1,days:MF,time:["16:00","19:00"]}]:[];
  if(ch==="be_at_one")return [{item:"Student cocktail · with student ID (MiXR app)",price:P.price,level:1,days:SF}];
  return [];}
let _barsLn=null;
function extraBars(){ // uni bars not in DRINKS yet, at their point (london.json, else Google once)
  if(_barsLn)return _barsLn;const out=[];if(typeof LBARS==="undefined")return out;
  for(const b of LBARS){if(DRINKS.venues.some(v=>sameBar(v.name,b.name)))continue;
    const ll=typeof LON!=="undefined"&&LON.bars?LON.bars[b.i]:null;const g=geoGet("d:lb-"+b.i);
    const lat=Array.isArray(ll)?ll[0]:g&&!g.miss?g.lat:null,lon=Array.isArray(ll)?ll[1]:g&&!g.miss?g.lon:null;
    out.push({id:"lb-"+b.i,name:b.name+" ("+b.uni+")",type:"su_bar",addr:b.addr+", "+b.pc,lat,lon,offers:barOffers(b),hours:b.hours||undefined,hoursUnknown:!b.hours,entry:barAccess(b),hh:b.deals?b.deals.slice(0,90):"",q:b.name+", "+b.addr+", London "+b.pc,bar:b});}
  if(typeof LON!=="undefined"&&LON.status==="ok")_barsLn=out;return out;}
function augmentVenue(v,p){const b=typeof LBARS!=="undefined"?LBARS.find(x=>sameBar(v.name,x.name)):null;
  const wsp=/^dr-wsp-/.test(v.id);if(!b&&!wsp)return p;const q=Object.assign({},p);
  if(b){if(!q.offers||!q.offers.length)q.offers=barOffers(b);if(!q.hours&&b.hours){q.hours=b.hours;q.hoursUnknown=false;}if(!q.entry)q.entry=barAccess(b);if(!q.hh&&b.deals)q.hh=b.deals.slice(0,90);
    const ll=typeof LON!=="undefined"&&LON.bars?LON.bars[b.i]:null;if(Array.isArray(ll)&&(q.lat==null||q.approxLL)){q.lat=ll[0];q.lon=ll[1];q.approxLL=false;}}
  if(wsp&&(!q.offers||!q.offers.length))q.offers=pintOffers("wetherspoon");
  return q;}
function chainPubs(here,maxM){if(typeof LON==="undefined"||LON.status!=="ok")return [];const out=[];const cy=Math.floor(here.lat*50),cx=Math.floor(here.lon*33);
  for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){const g=LON.grid.get((cy+a)+":"+(cx+b));if(!g)continue;
    for(const i of g){const r=LON.rows[i];const c=LCHAINS[r[0]];if(!LPINTS[c.id]&&c.id!=="wetherspoon")continue;const ll={lat:r[1],lon:r[2]};if(metres(here,ll)>maxM)continue;
      const name=r[3]||c.name;if(DRINKS.venues.some(v=>v.lat!=null&&metres(v,ll)<60||sameBar(v.name,name)&&(v.lat==null||metres(v,ll)<200)))continue;
      const h=parseOH(r[5]);out.push({id:"lp-"+(r[6]||i),name:name+(r[3]&&c.id!=="samuel_smiths"&&!lnorm(r[3]).includes(lnorm(c.name).split(" ")[0])?" ("+c.name+")":""),type:"pub",addr:r[4],lat:r[1],lon:r[2],offers:pintOffers(c.id,r[4]),hours:h||undefined,hoursUnknown:!h,chain:c.id});}}
  return out;}
/* Everything near you that sells a drink, with the offer that holds right now */
function drinkRows(){
  const t=selectedTime(),here=state.where||VENUES[0],wq=drinkWord(state.q)||(state.dsub!=="other"&&state.dsub)||"",rx=wq?DRINK_RX[wq]:null;
  const lim=Math.max(15,Math.min(state.mins,MAX_WALK)),maxM=lim*80;
  const src=[];
  for(const v of DRINKS.venues){const p0=venuePlace(v);const p=augmentVenue(v,p0||v);if(p&&p.lat!=null)src.push({p,offers:p.offers,kind:"venue"});}
  for(const v of extraBars()){if(v.lat!=null)src.push({p:v,offers:v.offers,kind:"venue"});}
  for(const v of chainPubs(here,maxM*1.2))src.push({p:v,offers:v.offers,kind:"venue"});
  const byChain={};for(const c of DRINKS.chains)(byChain[c.chain]=byChain[c.chain]||[]).push(c);
  for(const ch in byChain){const c0=byChain[ch][0];let p=null;
    if(NOT_IN_CATALOGUE.has(ch)){const g=geoGet("c:"+ch+":"+here.lat.toFixed(2)+","+here.lon.toFixed(2));if(g&&!g.miss)p={id:"drc-"+ch,name:c0.name,lat:g.lat,lon:g.lon,addr:"",hours:g.hours||undefined,hoursUnknown:!g.hours,placeId:g.pid};}
    else{const b=nearestBranch(x=>x.chain===ch||chainKey(x.name)===chainKey(c0.name),here,maxM*1.2);if(b)p=Object.assign({},b,{id:"drc-"+b.id});}
    if(p)src.push({p,offers:byChain[ch].map(c=>({item:c.item,price:c.price,level:c.level,label:c.label,days:c.days,time:c.time,af:c.af,note:c.note})),kind:"chain"});}
  const rows=[];
  for(const s of src){const p=s.p;const o=isOpen(p,t);const m=metres(here,p);const walk=Math.max(1,Math.round(m/80));if(walk>MAX_WALK)continue;
    let offers=s.offers.filter(x=>offerOn(x,t)&&(x.level===1||x.level===2));if(rx)offers=offers.filter(x=>x.af||rx.test(x.item));
    const priced=offers.filter(x=>typeof x.price==="number").sort((a,b)=>unitPrice(a)-unitPrice(b));
    const best=priced.find(x=>!x.af)||priced[0]||offers[0]||null;
    if(rx&&!offers.length&&s.kind!=="venue")continue;
    rows.push({p,o,m,walk,best,offers,af:offers.filter(x=>x.af),approx:!!p.approxLL,kind:s.kind,near:walk<=lim,t});}
  const open=rows.filter(r=>r.o.open&&r.near);
  const priced=open.filter(r=>r.best&&typeof r.best.price==="number"&&!r.best.af).sort((a,b)=>unitPrice(a.best)-unitPrice(b.best)||a.walk-b.walk);
  const unpriced=open.filter(r=>!priced.includes(r)&&r.kind==="venue").sort((a,b)=>a.walk-b.walk);
  const later=rows.filter(r=>!r.o.open&&r.near&&r.kind==="venue").sort((a,b)=>a.walk-b.walk);
  // the alcohol-free option: in a bar open now (never a supermarket pack), priced first; else free tap water
  const afAll=open.flatMap(r=>r.af.map(x=>({r,x}))).sort((a,b)=>((typeof a.x.price==="number"?0:1)-(typeof b.x.price==="number"?0:1))||((a.x.price||0)-(b.x.price||0))||a.r.walk-b.r.walk);
  return {t,here,priced,unpriced,later,af:afAll[0]||null,lim};}
/* Venues without a point yet and the nearest Yo! Sushi, Wahaca or Côte: Google, once, 30 days on this phone. */
let drinksRefined=false;
function refineDrinks(){if(drinksRefined||!ON_SITE)return;drinksRefined=true;const here=state.where||VENUES[0];const list=[];
  const near=v=>{if(v.lat!=null)return {lat:v.lat,lon:v.lon};const a=(v.areas||[])[0];if(!a)return null;const [u,c]=a.split(":");const uu=UNIS.find(x=>x.id===u);const cc=uu&&uu.campuses.find(x=>x.id===c);return cc?{lat:cc.lat,lon:cc.lon}:null;};
  for(const v of DRINKS.venues){if(v.lat!=null&&!v.approxLL)continue;const n=near(v);if(!n||metres(here,n)>6000)continue;list.push({key:"d:"+v.id,text:v.q||(v.name.replace(/\s*\(.*\)$/,"")+", "+v.addr),near:n,radius:2000,maxM:2500});}
  for(const v of extraBars()){if(v.lat!=null||!v.bar)continue;list.push({key:"d:"+v.id,text:v.q,near:here,radius:5000,maxM:6000});}
  for(const ch of NOT_IN_CATALOGUE){const c=DRINKS.chains.find(x=>x.chain===ch);if(c)list.push({key:"c:"+ch+":"+here.lat.toFixed(2)+","+here.lon.toFixed(2),text:c.name+" restaurant",near:here,radius:1500,maxM:2400});}
  list.sort((a,b)=>metres(here,a.near)-metres(here,b.near));
  geoRefine(list,12,()=>{if(state.drinks&&state.step===S.results&&!document.getElementById("sheetHost").firstChild)render();});}
function drinkRow(r,t){const T=DRINKS.texts;const pr=r.best&&typeof r.best.price==="number";
  return '<button type="button" class="item'+(r.o.open?"":" dim")+(pr?"":" unp")+'" data-did="'+esc(r.p.id)+'"><span class="ms'+(pr?" wine":"")+'" data-ms="'+(pr?money(unitPrice(r.best)):"£?")+'" style="--ms:14px;min-width:64px"></span>'+
    '<div style="min-width:0"><h3>'+esc(r.p.name)+'</h3><div class="meta">'+(pr?esc(r.best.item+" · "+priceText(r.best))+' · '+esc(hoursLabel(r.o,t)):r.o.open?esc(T.unchecked)+' · '+esc(openLabel(r.o)):esc(hoursLabel(r.o,t)))+'</div>'+
    (r.best&&pr&&r.best.needs&&r.best.label?'<div class="meta">'+esc(r.best.label)+'</div>':'')+(r.p.hh?'<div class="meta">'+esc(r.p.hh)+'</div>':'')+(r.best&&pr&&/^Only some branches/.test(r.best.note||"")?'<div class="meta">'+esc(r.best.note)+'</div>':'')+(r.p.entry?'<div class="meta">'+esc(r.p.entry)+'</div>':'')+'</div>'+
    '<div class="walk">'+(r.approx?"~":"")+r.walk+' min<small>walk</small></div></button>';}
function vDrinks(){
  const R=drinkRows(),t=R.t,T=DRINKS.texts;refineDrinks();
  const ctx=["drinks",(state.where||{}).label,t.day,state.q].join("|");const m=moment("drinks",ctx);
  const af=R.af;
  const top=R.priced[0];const wq0=drinkWord(state.q)||(state.dsub!=="other"&&state.dsub)||"";
  const topCard=top?'<div class="hero pick"><div class="k">'+(wq0==="beer"?"Cheapest pint open now":wq0?"Cheapest "+wq0+" open now":"Cheapest drink open now")+'</div><span class="ms wine" data-ms="'+money(unitPrice(top.best))+'" style="--ms:40px"></span><span class="ms" data-ms="'+esc(top.p.name)+'" style="--ms:16px"></span><p class="lead">'+esc(top.best.item)+'</p><p class="meta"><b>'+esc(priceText(top.best)+(top.best.label&&top.best.level===1?" · "+top.best.label:""))+'</b></p><p class="meta">'+(top.approx?"~":"")+top.walk+' min walk · '+esc(hoursLabel(top.o,t))+'</p><div class="actions"><a class="chip" href="'+gmaps(top.p)+'" target="_blank" rel="noopener">'+PIN+' Walk there</a></div></div>':'';
  const afCard='<div class="hero pick afpick compact"><div class="k">Alcohol-free option</div><div class="afrow">'+rat("d_water",84)+'<div>'+
    (af?(typeof af.x.price==="number"?'<span class="ms wine" data-ms="'+money(af.x.price)+'" style="--ms:30px"></span>':'')+'<span class="ms" data-ms="'+esc(af.r.p.name)+'" style="--ms:15px"></span><p class="lead">'+esc(af.x.item)+(af.x.label&&af.x.level===2?' · '+esc(af.x.label):af.x.label?' · '+esc(af.x.label):'')+'</p><p class="meta">'+(af.r.approx?"~":"")+af.r.walk+' min walk · '+esc(hoursLabel(af.r.o,t))+'</p>'
      :'<p class="lead">'+esc(T.water)+'</p>')+'</div></div></div>';
  const wq=drinkWord(state.q)||(state.dsub!=="other"&&state.dsub)||"";
  const list=(R.priced.length?'<div class="k" style="margin-top:12px">Cheapest drinks open now</div><div class="list">'+R.priced.slice(0,15).map(r=>drinkRow(r,t)).join("")+'</div>':'<p class="note" style="margin-top:12px">'+(wq?"No checked "+wq+" price near you right now.":"No checked drink prices near you right now.")+'</p>')+
    (R.later.length?'<div class="k" style="margin-top:12px">Opening later</div><div class="list">'+R.later.slice(0,10).map(r=>drinkRow(r,t)).join("")+'</div>':'')+
    (R.unpriced.length?'<div class="k" style="margin-top:12px">Not priced yet · Snap the board</div><div class="list">'+R.unpriced.slice(0,15).map(r=>drinkRow(r,t)).join("")+'</div>':'');
  const foot='<div class="drinkfoot"><p class="note">'+esc(T.id)+'</p><p class="note">'+esc(T.water)+'</p><p class="note">'+esc(T.units)+'</p><p class="note"><a class="linkbtn" href="'+esc(T.drinkaware_url)+'" target="_blank" rel="noopener">Drinkaware: facts about alcohol →</a></p>'+(DRINKS.fun[0]?'<p class="note">'+esc(DRINKS.fun[0])+'</p>':'')+'</div>';
  const body=filtersHTML()+topCard+afCard+list+foot;
  let dl=m.line,dp=m.pose;if(UI.say){dl=UI.say;dp="d_cheers";UI.say=null;}
  const d=stage("drinks",dp,dl,body,'',S.results);
  wireFilters(d);{const fl=d.querySelector("#fitLine");if(fl)fl.textContent="";}
  d.addEventListener("click",e=>{const b=e.target.closest("[data-did]");if(!b)return;const all=R.priced.concat(R.unpriced,R.later);const r=all.find(x=>x.p.id===b.dataset.did);if(!r)return;
    if(!(r.best&&typeof r.best.price==="number"))openTeach(r.p);else window.open(gmaps(r.p),"_blank","noopener");});
  return d;}

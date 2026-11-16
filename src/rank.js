/* ---------- RANK ---------- */
function metres(a,b){const R=6371000,toR=x=>x*Math.PI/180;const dLat=toR(b.lat-a.lat),dLon=toR(b.lon-a.lon);const s=Math.sin(dLat/2)**2+Math.cos(toR(a.lat))*Math.cos(toR(b.lat))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(s));}
let _uniPlaces=null;
/* Chains are for everyone: a branch shows to whoever is near it. Only uni_only offers depend on state.uni. */
const CHAIN_WHY={pret:"50% off all food in the last hour before closing (most shops; whatever is left).",wasabi:"30% off whatever is left in the last 30 minutes.",tortilla:"Burritos are £9+, but the sides add up to a cheap hot snack. Card only.",
  gails:"Everything is 15–20% more if you sit in. Own cup: 20p off drinks.",black_sheep:"20% off everything for students. Oat milk free.",itsu:"Cold food is 50% off in the last half hour.",caffe_nero:"UK average prices; central London runs 15–25% higher.",
  mcdonalds:"Prices from the self-order screens, 15 Oct 2026.",subway:"Prices from the menu screens, 16 Oct 2026.",
  burgerking:"National offers from the BK website, 16 Oct 2026. Menu prices not checked yet. Snap the screen →",
  greggs:"Shelf prices from a fan site; London may be a step higher.",costa:"Drink prices from a station board; a street Costa is usually a touch cheaper.",starbucks:"UK price tracker; London in line or a touch higher."};
const PC_RX=/\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/;
function pcOf(a){const m=PC_RX.exec(String(a||""));return m?m[1]+" "+m[2]:null;}
function chainKey(n){const s=String(n||"").toLowerCase().replace(/[’'`.]/g,"");if(/^m ?& ?s|marks/.test(s))return "ms";if(/^co-?op/.test(s))return "coop";if(/waitrose/.test(s))return "waitrose";if(/sainsbury/.test(s))return "sains";if(/black sheep/.test(s))return "bsc";if(/nero/.test(s))return "nero";return s.split(/[\s-]+/)[0];}
function houseNo(a){const m=/^\D*?(\d+)/.exec(String(a||""));return m?m[1]:null;}
function dupOfPlaces(b,nm){ // already in the hand-made catalogue? same place_id, or the same chain at the same postcode / within 40 m / same door number or station
  const kb=chainKey(nm),pb=b.pc||pcOf(b.addr),nb=houseNo(b.addr),sb=/(\w+) station/.exec((nm+" "+b.addr).toLowerCase());
  return PLACES.some(p=>{if(b.placeId&&p.placeId===b.placeId)return true;if(chainKey(p.name)!==kb)return false;const pp=pcOf(p.addr),np=houseNo(p.addr);
    if(pp&&pb&&pp===pb)return true; // same chain at the same postcode: the same shop, whatever the pin says (252 Tottenham Court Road, the Brunswick Centre)
    const m=metres(p,b);if(m<40)return true;if(m>150)return false;
    if(np&&nb&&np===nb)return true;const sp=/(\w+) station/.exec((p.name+" "+p.addr).toLowerCase());if(sp&&sb&&sp[1]===sb[1])return true;return false;});
}
/* Wasabi King's Cross (6 Pancras Square): its own board, checked in store 19/10/2026: gyoza boxes £4.75 (£4.27 with Student Beans).
   Every other Wasabi branch still borrows the Tottenham Court Road board (15/10) and says "Chain price · can vary by shop". */
const WASABI_KX={lat:51.533167,lon:-0.12573};
function wasabiFix(p){if(!p||!Array.isArray(p.offers)||metres(p,WASABI_KX)>80)return p;
  p.offers=p.offers.map(o=>/^(chicken|duck|vegetable) gyoza box$/i.test(o.item)?Object.assign({},o,{price:4.75,status:"photo",checked:"2026-10-19"}):o);p.wasabiKX=true;p.discFloor=true;return p;} // the till rounds 10% off £4.75 down: £4.27
function uniPlaces(){ // the other universities' outlets and every chain branch in the catalogue (UCL campuses too), built once from the templates in PLACES
  if(_uniPlaces)return _uniPlaces;
  const byId={};for(const p of PLACES.concat(typeof CHAIN_TEMPLATES!=="undefined"?CHAIN_TEMPLATES:[]))byId[p.id]=p;const out=[];
  for(const p of UNI_PLACES){const g=p.approxLL?geoGet("u:"+p.id):null; // a canteen with only its campus point: Google's real point once the phone has looked it up
    out.push(g&&!g.miss?Object.assign({},p,{lat:g.lat,lon:g.lon,approxLL:false,refined:true,placeId:g.pid||p.placeId,rating:g.rating,ratingN:g.ratingN}):p);} // rating: this session only
  for(const b of UNI_BRANCHES){const t=b.tpl?byId[b.tpl]:null;if(b.tpl&&!t)continue;
    const nm=b.name||(t&&t.name)||"";
    if(dupOfPlaces(b,nm))continue;
    const c=t?Object.assign({},t,{id:b.id,name:nm,lat:b.lat,lon:b.lon,addr:b.addr,placeId:b.placeId,coordSource:"google",cachedAt:UNIS_CACHED_AT,uniBranch:b.campus,chain:b.chain,status:"shop",why:CHAIN_WHY[b.chain]||"Chain prices from another branch; the board here may differ. Snap it to fix."})
                :{id:b.id,name:nm,lat:b.lat,lon:b.lon,addr:b.addr,placeId:b.placeId,coordSource:"google",cachedAt:UNIS_CACHED_AT,uniBranch:b.campus,chain:b.chain||null,independent:!!b.independent,status:"shop",offers:[],unpriced:true,why:"Price not checked. Snap the menu →"};
    if(b.hours)c.hours=b.hours;else{delete c.hours;c.hoursUnknown=true;}
    if(b.chain==="wasabi")wasabiFix(c);
    if(b.chain==="leon"){delete c.discNo;c.disc=LEON_DISC;c.discMin=LEON_MIN;c.discNote=LEON_NOTE;} // the other Leons: 15% with the app or kiosk from £8 (stations: none, see discOf)
    out.push(c);}
  return _uniPlaces=out;
}
/* Google back-up (foundChains, refineChains) and every London branch (londonNear): src/london.js */
function uniOk(p){return !p.uni||p.audience!=="uni_only"||p.uni===state.uni;}
/* A menu taught for a place Fiver already knows (same place_id, or the same chain within 60 m) joins that place: its name and hours stay,
   the new prices win where the item is the same, new items are added. Only menus for places Fiver doesn't know stand on their own. */
function baseFor(t,base){if(t.when)return null;let best=null,bd=61;
  for(const p of base){if(p.when||p.unpriced&&!p.chain&&!p.independent)continue;if(t.placeId&&p.placeId&&t.placeId===p.placeId)return p;
    if(chainKey(p.name)!==chainKey(t.name))continue;const m=metres(p,t);if(m<bd){bd=m;best=p;}}
  return best;}
const itemKey=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
function joinTaught(p,taught){const offers=p.offers.slice();
  for(const t of taught)for(const o of t.offers){const k=itemKey(o.item);const i=offers.findIndex(x=>itemKey(x.item)===k);const n=Object.assign({},o,{taught:true});if(i>=0)offers[i]=Object.assign({},offers[i],{price:n.price,status:"added",with:undefined,taught:true});else offers.push(n);}
  return Object.assign({},p,{offers,unpriced:false,taughtBy:taught.length});}
function allPlaces(){
  const base=PLACES.concat(uniPlaces().filter(uniOk).filter(p=>typeof wfShadow!=="function"||!wfShadow(p)),typeof barFood==="function"?barFood():[],typeof londonNear==="function"?londonNear():[],typeof foundChains==="function"?foundChains():[]);const taught=state.added.concat(shared.places);
  const joined=new Map(),alone=[];
  for(const t of taught){const b=baseFor(t,base);if(b){(joined.get(b.id)||joined.set(b.id,[]).get(b.id)).push(t);}else alone.push(t);}
  return base.map(p=>joined.has(p.id)?joinTaught(p,joined.get(p.id)):p).concat(alone);}
/* "Something specific": words typed or tapped, matched against item names. Generic words are ignored. */
/* Typos: every word is checked against the words on the menus; a near miss (edit distance ≤ 2) is corrected. */
let VOCAB=null;
function vocab(){if(VOCAB)return VOCAB;const set=new Set();const add=s=>String(s).toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).forEach(w=>{if(w.length>2)set.add(w);});
  for(const p of PLACES.concat(typeof uniPlaces==="function"?uniPlaces():[])){add(p.name);for(const o of p.offers)add(o.item);}for(const k in SPECIFIC)SPECIFIC[k].forEach(add);for(const k in SYN)if(SYN[k])add(SYN[k]);
  return VOCAB=[...set];}
function lev(a,b){ // edit distance where a swapped pair ("dael") counts as one slip
  const m=a.length,n=b.length;if(!m)return n;if(!n)return m;const D=[];for(let i=0;i<=m;i++){D[i]=[i];}for(let j=1;j<=n;j++)D[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){const c=a[i-1]===b[j-1]?0:1;D[i][j]=Math.min(D[i-1][j]+1,D[i][j-1]+1,D[i-1][j-1]+c);if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])D[i][j]=Math.min(D[i][j],D[i-2][j-2]+1);}
  return D[m][n];}
function nearest(w){if(w.length<4)return w;let best=w,bd=w.length<=5?1:2;for(const v of vocab()){if(Math.abs(v.length-w.length)>bd)continue;const d=lev(w,v);if(d<bd||(d===bd&&v.startsWith(w[0])&&best===w)){bd=d;best=v;if(d===0)break;}}return best;}
function fuzzyQ(q){return String(q||"").toLowerCase().replace(/[^a-z0-9£.\s]/g," ").split(/\s+/).filter(Boolean).map(w=>SYN[w]!==undefined?SYN[w]:(vocab().includes(w)?w:nearest(w))).filter(Boolean).join(" ").trim();}
function qTokens(q){return fuzzyQ(q).split(/\s+/).filter(t=>t&&t.length>1);}
function qMatch(o,q,p){const toks=qTokens(q);if(!toks.length)return true;const name=((o.item||"")+" "+(p?p.name:"")).toLowerCase();return toks.every(t=>name.includes(t));}
/* A hot drink by name ("Cappuccino", "flat white", "matcha", "tea", "té"): Hot drinks of that kind only, never any coffee and never the pub.
   [label, words in the search, item names that count, item names that don't]. Order matters: "matcha latte" is matcha, "iced latte" is a latte. */
const HOT_TYPES=[
  ["hot chocolate",/\bhot ?choc(olate)?\b|\bcocoa\b|chocolate caliente|\bcola ?cao\b/i,/hot choc|cocoa|^(classic |iced |hot or cold )?chocolate( with|$)|chocolate \(/i],
  ["matcha",/\bmatcha\b/i,/matcha/i],
  ["chai",/\bchai\b/i,/\bchai\b/i],
  ["flat white",/\bflat ?white\b/i,/flat ?white/i],
  ["cappuccino",/\bcap+u+c+h?ino\b|\bcapuchino\b|\bcappuccino\b/i,/cappuccino/i],
  ["latte",/\blatte\b/i,/\blatte\b/i,/matcha|chai|turmeric/i],
  ["macchiato",/\bmacchiato\b/i,/macchiato/i],
  ["mocha",/\bmocha\b/i,/mocha/i],
  ["cortado",/\bcortado\b/i,/cortado/i],
  ["americano",/\bamericano\b|\blong black\b/i,/americano|long black/i],
  ["espresso",/\bespresso\b|\bexpreso\b/i,/espresso/i,/martini|latte|cappuccino/i],
  ["filter coffee",/\bfilter\b|\bdrip coffee\b|\bbatch brew\b/i,/filter|batch brew|drip/i],
  ["tea",/(^|\s)(tea|teas|t[eé]|cuppa|brew|builders?|earl grey|green tea|herbal|peppermint|camomile|chamomile|infusion|rooibos)(\s|$)/i,/\btea\b|\bteas\b|earl grey|chamomile|camomile|peppermint|infusion|herbal|rooibos|teh tarik/i,/bubble|boba|pearl|tapioca|iced|ice tea|teacake|flan/i],
  ["iced coffee",/(^|\s)(iced|cold brew|frapp[eé]s?|frappuccino|freddo)(\s|$)/i,/iced|cold brew|freddo|frapp/i,/\btea\b|lemonade|matcha|chai/i]];
const HOT_FILL=/\b(a|an|one|two|some|please|cup|of|mug|large|small|regular|medium|tall|grande|venti|short|single|double|triple|decaf|oat|soy|soya|almond|coconut|skimmed|skinny|whole|milk|with|hot|un|una|uno|de|con|leche|caf[eé]|coffee|coffees|drink|me|i|want|fancy|get|id|d|like|for|to|go|takeaway|take|away)\b/gi;
function hotType(q,loose){const s=String(q||"").toLowerCase().replace(/[’']/g,"").trim();if(!s||s.length>40)return null;
  const iced=/(^|\s)(iced|cold)(\s|$)/.test(s);
  for(const [label,inQ,rx,no] of HOT_TYPES){if(!inQ.test(s))continue;
    if(!loose){let rest=s.replace(inQ," ").replace(/(^|\s)(iced|cold)(\s|$)/g," ");if(label==="tea")rest=rest.replace(/\b(tea|teas|cuppa|brew)\b/g," ");if(label==="matcha"||label==="chai")rest=rest.replace(/\b(latte|lattes|tea)\b/g," ");rest=rest.replace(HOT_FILL," ").replace(/[^a-z0-9áéíóú]+/g," ").trim();if(rest)return null;}
    return {label,rx,no:no||null,iced:iced&&label!=="iced coffee"};}
  return null;}
function hotMatch(o,h){if(o.cat!=="coffee")return false;const n=o.item||"";if(!h.rx.test(n)||(h.no&&h.no.test(n))||/biscuit|cookie|cake|brownie|croissant|muffin|doughnut|donut|cheesecake|\bbar\b/i.test(n))return false;return !h.iced||/iced|cold|freddo|frapp/i.test(n);}
const RANK_DBG={before:0,after:0,hot:""};const DBG_ON=(()=>{try{return /[?&]debug=1(&|$)/.test(location.search);}catch(e){return false;}})(); // ?debug=1: the search panel
/* A real meal: hot food, a meal deal, a sandwich, a wrap, a box or a main. Never a side, a snack, a sweet or a drink on its own. */
const MEAL_RX=/sandwich|baguette|wrap|burrito|bowl|\bbox\b|\bsub\b|panini|toastie|sando|bento|katsu|curry|pizza|pasta|burger|noodle|rice|stew|jacket|main|meal|platter/i;
const SIDE_RX=/\b(fries|chips|hash ?browns?|onion rings|garlic bread|beans|side|dip|cookie|crisps|apple slices|carrot sticks|nachos)\b/i;
/* Food screens never list alcohol (that lives behind Drinks, 18+) or add-ons on their own ("Upgrade to Fever Tree tonic £0.25", "Extra shot"). */
const ALCOHOL_RX=/\b(gin|tonic|vodka|rum|whisk(e)?y|tequila|beers?|lager|ale|ipa|ciders?|pints?|wines?|prosecco|champagne|spritz|cocktails?|mojito|margarita|negroni|martini|aperol|shots?|j[aä]ger\w*|mixer|stout|guinness|peroni|corona|asahi|coors|madri|bourbon|brandy|sambuca|baileys|g&t)\b/i;
const NOT_DRINK_RX=/batter|braised|sauce|glaze|cake|gravy|vinegar|ginger/i;
const ADDON_RX=/^(upgrade|add|extra|swap|make it|top up|sub(stitute)?)\b|\bupgrade to\b|\badd[- ]?on\b/i;
function foodOk(o){const t=o.item||"";if(ADDON_RX.test(t))return false;if(ALCOHOL_RX.test(t)&&!NOT_DRINK_RX.test(t))return false;return true;}
function isMeal(o){if(!o||o.cat==="free"||o.cat==="drink")return false;if(SIDE_RX.test(o.item||""))return false;return o.cat==="hot"||o.cat==="deal"||MEAL_RX.test(o.item||"");}
let RANK_ONLY=null; // one category only, no free food, no meal pick (used for "several things at once")
function mealMode(){return !RANK_ONLY&&!state.q&&(state.cats.has("hot")||state.cats.has("deal"));}
function eatMins(o){return o.cat==="deal"||o.cat==="coffee"||o.cat==="snack"?6:12;}
/* Time of day for the dishes that carry one (the £15 catalogue): breakfast to 12:00, lunch 11:00–16:00, snack 15:30–17:30, dinner from 17:00. Dishes without it always show. */
const MEAL_WIN={breakfast:[0,720],lunch:[660,960],snack:[930,1050],dinner:[1020,1440]};
function mealNow(o,m){if(!o.meal||!o.meal.length)return true;return o.meal.some(k=>MEAL_WIN[k]&&m>=MEAL_WIN[k][0]&&m<MEAL_WIN[k][1]);}
function rank(noMeal){
  const t=selectedTime();let dropped=0;const here=state.where||VENUES[0];
  const rows=[],unpriced=[];let hidden=0;
  // "Something specific" that names a place ("canteen UCL East", "csm canteen"): only those places; any food words left still pick the item
  let placeIds=null,leftQ=state.q;const HT=state.q?hotType(state.q):null;if(DBG_ON){RANK_DBG.before=0;RANK_DBG.after=0;RANK_DBG.hot=HT?HT.label+(HT.iced?" (iced)":""):"";}
  if(state.q&&!HT&&typeof srchPlacey==="function"&&srchPlacey(state.q)){const hits=placeSearch(state.q,allPlaces(),{bias:here,uni:state.uni,limit:40});
    const best=hits.length?hits[0].score:0;const keep=hits.filter(h=>h.score>=Math.min(best,1)); // "canteen UCL East": the canteen, not every shop on that campus
    if(keep.length){placeIds=new Set(keep.map(h=>h.p.id));leftQ=srchParse(state.q).rest.filter(w=>w!=="refectory"&&!hits.some(h=>h.d.words.has(w))).join(" ");}}
  for(const p of allPlaces()){
    if(placeIds&&!placeIds.has(p.id))continue;
    let offers=p.offers.filter(o=>(RANK_ONLY?o.cat===RANK_ONLY:(state.q?o.cat!=="free"||state.cats.has("free"):state.cats.has(o.cat)))&&(!o.uniOnly||p.uni===state.uni)&&(o.cat==="free"||foodOk(o))&&(state.q||typeof subOk!=="function"||subOk(o,p))); // a wish searches every category; free food is always in
    offers=offers.filter(o=>typeof o.price==="number"||o.cat==="deal"&&p.deal).filter(o=>!o.untilDate||t.dateISO<=o.untilDate).filter(o=>!o.days||o.days.includes(DAYK[t.day])); // dated offers stop after their date
    if(!state.q&&!noMeal){const k=offers.filter(o=>mealNow(o,t.minutes));dropped+=offers.length-k.length;offers=k;} // "Something specific" ignores the time of day
    offers=offers.filter(o=>!o.until||t.minutes<hm(o.until)).filter(o=>!o.from||t.minutes>=hm(o.from)).filter(o=>!o.needs||state.cards.has(o.needs));
    const n0=offers.length;
    if(state.q)offers=HT?offers.filter(o=>hotMatch(o,HT)):placeIds?(leftQ?offers.filter(o=>qMatch(o,leftQ,p)):offers):offers.filter(o=>qMatch(o,state.q,p)); // "Cappuccino": cappuccinos, not any coffee
    if(DBG_ON&&state.q&&metres(here,p)/80<=state.mins){RANK_DBG.before+=n0;RANK_DBG.after+=offers.length;}
    if(state.diet.size){const keep=offers.filter(o=>!dietCheck(o).hide);hidden+=offers.length-keep.length;offers=keep;}
    const o=isOpen(p,t);const m=metres(here,p);const walk=Math.max(1,Math.round(m/80));
    if(!offers.length){if(p.unpriced&&state.cats.size&&!state.q&&o.open&&walk<=Math.min(state.mins,MAX_WALK))unpriced.push({p,o,m,walk,unpriced:true,fits:false,t});continue;}
    let best=null;
    for(const of of offers){const bp=bestPrice(p,of,t);const dk=dietCheck(of);const sc=bp.price*10+(dk.ask.length?0.4:0);if(!best||sc<best.sc)best={of,pr:bp,sc,ask:dk.ask};}
    const eat=eatMins(best.of);const need=walk*2+eat;
    const fits=o.open&&best.pr.price<=state.budget+1e-9&&walk<=state.mins&&o.closesIn>walk;
    let score=best.pr.price*10+walk*0.6; if(!p.ucl&&best.of.cat!=="deal")score+=0.5; if(best.ask.length)score+=0.3; if(p.age>30)score+=1.5; if(p.hoursUnknown&&!p.when)score+=0.8; // a place with checked hours wins a near tie
    // the best plate for the budget: a real meal, the biggest one that still fits (the cheapest stays as "Cheapest that fits")
    let meal=null;for(const of of offers){if(!isMeal(of))continue;const bp=bestPrice(p,of,t);if(bp.price>state.budget+1e-9)continue;if(!meal||bp.price>meal.pr.price)meal={of,pr:bp};}
    const ladderRows=ladder(p,best.of,t);
    const saved=ladderRows.find(r=>r.label==="No card")?Math.max(0,(ladderRows.find(r=>r.label==="No card").price-best.pr.price)):0;
    rows.push({p,o,m,walk,eat,need,fits,score,of:best.of,pr:best.pr,ask:best.ask,saved,t,meal});
  }
  let fit=rows.filter(r=>r.fits).sort((a,b)=>a.score-b.score);
  let cheapest=null;
  if(mealMode()&&fit.length&&fit[0].of.cat!=="free"){ // free food stays on top; otherwise the pick is a real meal that uses the budget (50–100 %)
    const B=state.budget,band=r=>r.meal.pr.price>=B*0.5-1e-9;
    const c=fit.filter(r=>r.meal&&r.o.closesIn>r.walk);
    c.sort((a,b)=>(band(b)-band(a))||(band(a)?((b.p.rating||0)-(a.p.rating||0))||(a.walk-b.walk)||(b.meal.pr.price-a.meal.pr.price):(b.meal.pr.price-a.meal.pr.price)||(a.walk-b.walk)));
    if(c.length){const pick=Object.assign({},c[0],{of:c[0].meal.of,pr:c[0].meal.pr,mealPick:true});
      if(fit[0].p.id!==pick.p.id||fit[0].of.item!==pick.of.item)cheapest=fit[0];
      fit=[pick].concat(fit.filter(r=>r!==c[0]));}}
  const rest=rows.filter(r=>!r.fits&&(r.walk<=MAX_WALK||placeIds)).sort((a,b)=>(a.o.open===b.o.open?0:(a.o.open?-1:1))||a.score-b.score);
  unpriced.sort((a,b)=>a.walk-b.walk);
  if(!fit.length&&dropped&&!noMeal)return rank(true); // nothing for this time of day near you: show what is open instead, never an empty screen
  return {fit,rest,unpriced,t,here,hidden,cheapest};
}
// Why nothing fits, from the data: what would unlock the nearest cheap thing.
const MAX_WALK=45,MAX_BUDGET=15;
function unlock(r){
  const open=r.rest.filter(x=>x.o.open&&x.o.closesIn>x.walk);
  const out={};
  const money=open.filter(x=>x.walk<=state.mins&&x.pr.price<=MAX_BUDGET);if(money.length){const m=Math.min(...money.map(x=>x.pr.price));out.budget=Math.ceil(m*2)/2;out.budgetRow=money.find(x=>x.pr.price===m);out.budgetN=money.filter(x=>x.pr.price<=out.budget+1e-9).length;}
  const time=open.filter(x=>x.pr.price<=state.budget+1e-9&&x.walk<=MAX_WALK);if(time.length){const n=Math.min(...time.map(x=>x.walk));out.mins=Math.min(MAX_WALK,Math.ceil(n/5)*5);out.minsRow=time.find(x=>x.walk===n);out.minsN=time.filter(x=>x.walk<=out.mins).length;}
  if(!out.budget&&!out.mins){const both=open.filter(x=>x.walk<=MAX_WALK&&x.pr.price<=MAX_BUDGET).sort((a,b)=>a.walk-b.walk);if(both.length)out.both=both[0];}
  out.anyOpen=open.length>0;out.anyNear=open.some(x=>x.walk<=MAX_WALK&&x.pr.price<=MAX_BUDGET);
  if(state.q&&qTokens(state.q).length){const keep=state.q;state.q="";try{const r3=rank();if(r3.fit.length){out.noq=r3.fit[0];out.noqN=r3.fit.length;}}finally{state.q=keep;}}
  if(state.cats.size<CATS.length){const keep=state.cats;state.cats=new Set(CATS.map(c=>c.id));try{const r2=rank();if(r2.fit.length){out.cats=r2.fit[0];out.catsN=r2.fit.length;}}finally{state.cats=keep;}}
  const nearest=r.rest.slice().sort((a,b)=>a.walk-b.walk)[0];out.nearest=nearest;
  return out;
}

/* Group "£2 latte / £2 americano / …" into one line per place, card and price */
function shortItem(s){return String(s).toLowerCase().replace(/ \(.*?\)/g,"").replace(/^tall /,"");}
function groupDeals(list){
  const g={};
  for(const x of list){const k=x.p.name+"|"+(x.card||"")+"|"+x.price+"|"+(x.days||"");(g[k]=g[k]||{p:x.p,card:x.card,price:x.price,days:x.days,items:[]}).items.push(shortItem(x.item));}
  for(const k in g)g[k].items=[...new Set(g[k].items)];
  return Object.values(g).map(x=>({p:x.p,card:x.card,price:x.price,text:(x.price===0?"Free ":"£"+x.price.toFixed(2)+" ")+(x.items.length>2?x.items.slice(0,2).join(", ")+" and "+(x.items.length-2)+" more":x.items.join(", "))+" at "+x.p.name+(x.days?" on "+x.days.map(d=>DAYS[d]+"s").join(", "):"")}));
}
/* What a card unlocks, from the data (for the menu and the home screen) */
function cardUnlocks(c){
  const out=[];const seen=new Set();const add=s=>{if(!seen.has(s)){seen.add(s);out.push(s);}};
  for(const k in DEALS){const d=DEALS[k];if(d.with&&d.with[c]!=null){const ps=PLACES.filter(p=>p.deal===k);if(ps.length)add("Meal deal £"+d.with[c].toFixed(2)+" instead of £"+d.base.toFixed(2)+" at "+ps[0].name);}}
  const withs=[],needs=[];
  if(LEON_DISC[c])add(Math.round(LEON_DISC[c]*100)+"% off at Leon ("+LEON_NOTE[c]+"; not in station shops except London Bridge)");
  for(const p of PLACES){
    const dc=discOf(p);if(dc&&dc[c])add(Math.round(dc[c]*100)+"% off everything at "+p.name+(p.discNote&&p.discNote[c]?" ("+p.discNote[c]+")":""));
    for(const o of p.offers){if(o.with&&o.with[c]){const w=o.with[c];withs.push({p,card:c,price:w.price,item:o.item,days:w.days});}
      if(o.needs===c)needs.push({p,text:(o.price===0?"":"£"+o.price.toFixed(2)+": ")+o.item});}
    if(p.promos)for(const x of p.promos)if(x.card===c)add(x.label.replace(/ \((UNiDAYS|Student Beans)\)$/,"")+" at "+p.name);
  }
  const byItem={};for(const n of needs)(byItem[n.text]=byItem[n.text]||[]).push(n.p);
  for(const k in byItem){const ps=byItem[k];const ucl=ps.filter(p=>p.ucl).length;add(k+" at "+(ps.length>2&&ucl===ps.length?"every UCL café":ps.length>2?ps.length+" places":[...new Set(ps.map(p=>p.name))].join(", ")));}
  const cnt={};for(const x of withs)if(x.p.ucl){const k=x.item+"|"+x.price;cnt[k]=(cnt[k]||0)+1;}
  const EVERY={name:"every UCL café"};const seenU=new Set();const merged=[];
  for(const x of withs){const k=x.item+"|"+x.price;if(x.p.ucl&&cnt[k]>2){if(seenU.has(k))continue;seenU.add(k);merged.push(Object.assign({},x,{p:EVERY}));}else merged.push(x);}
  for(const g of groupDeals(merged))add(g.text);
  const card=CARDS.find(x=>x.id===c);if(card&&card.perk)add(card.perk);
  return out;
}
/* Today's time-boxed deals: card days + end-of-day windows */
function todayDeals(t){
  const withs=[];const promos=[];
  for(const p of PLACES){
    for(const o of p.offers)if(o.with)for(const c in o.with){const w=o.with[c];if(w.days&&w.days.includes(t.day))withs.push({p,card:c,price:w.price,item:o.item});}
    if(p.promos)for(const x of p.promos)if(x.days&&x.days.includes(t.day))promos.push({p,card:x.card,text:x.label.replace(/ \(.*\)$/,"")+" at "+p.name});
  }
  const seen=new Set();const cards=[];
  for(const g of groupDeals(withs)){const k=g.p.name.split(" ")[0]+g.card+g.price;if(seen.has(k))continue;seen.add(k);cards.push({p:g.p,card:g.card,text:g.text+" today",mine:state.cards.has(g.card)});}
  for(const x of promos){const k=x.p.name.split(" ")[0]+x.text;if(seen.has(k))continue;seen.add(k);cards.push({p:x.p,card:x.card,text:x.text+" today",mine:!x.card||state.cards.has(x.card)});}
  const late=[];const seenL=new Set();
  for(const p of PLACES)if(p.late){const o=isOpen(p,t);if(!o.open)continue;const k=p.name.split(" ")[0]+p.late;if(seenL.has(k))continue;seenL.add(k);late.push({p,text:p.late+" at "+p.name+(o.closes?" (closes "+o.closes+")":"")});}
  return {cards:cards.sort((a,b)=>(b.mine?1:0)-(a.mine?1:0)),late};
}

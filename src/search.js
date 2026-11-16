/* ---------- PLACE SEARCH: words and synonyms, for Teach and for "Something specific" when it names a place ----------
   Name + address + campus + uni + aliases. Words are counted (no accents, no capitals, plural = singular); filler words are ignored.
   Canteen words all mean "refectory". A uni or a campus in the query is a filter: only places from there. Floors: first/1st/1 are the same. */
const SRCH_STOP=new Set(["the","at","in","on","of","de","la","el","los","las","del","da","a","an","and","y","near","by","floor","planta","piso","level","building","edificio","place","spot","please"]);
const SRCH_SYN={canteen:"refectory",cafeteria:"refectory",comedor:"refectory",comedore:"refectory",refectory:"refectory",refectorie:"refectory",mensa:"refectory",cantine:"refectory",kantine:"refectory",
  street:"st",road:"rd",square:"sq",avenue:"ave",lane:"ln",kcl:"kings",king:"kings",bbk:"birkbeck",icl:"imperial",qm:"qmul",qmw:"qmul",goldsmith:"goldsmiths",art:"ual",guy:"guys",thoma:"thomas"};
const SRCH_PHRASES=[[/\b(dining (hall|room)|food (hall|court))\b/g," refectory "],[/\blower ground( floor)?\b/g," flg "],[/\b(ground floor|planta baja)\b/g," fg "],
  [/\b(first|1st|1) floor\b|\bfloor (1|one)\b|\blevel 1\b/g," f1 "],[/\b(second|2nd|2) floor\b|\bfloor (2|two)\b|\blevel 2\b/g," f2 "],[/\b(third|3rd|3) floor\b|\bfloor (3|three)\b|\blevel 3\b/g," f3 "],
  [/\bkings? cross\b/g," kingscross "],[/\bking s college\b/g," kings "],[/\bqueen mary\b/g," qmul "],[/\bcentral saint martins?\b/g," csm "],[/\buniversity of the arts( london)?\b/g," ual "],
  [/\bcity st george s\b|\bst george s\b/g," citystgeorges "],[/\bmain quad\b/g," mainquad "],[/\bgower st(reet)?\b/g," gower "],[/\bpool st(reet)?\b/g," poolstreet "],[/\bsouth ken(sington)?\b/g," southkensington "],
  [/\bwhite city\b/g," whitecity "],[/\bdenmark hill\b/g," denmarkhill "],[/\bmile end\b/g," mileend "],[/\bnew cross\b/g," newcross "],[/\belephant (and|&)? ?castle\b/g," elephant "],[/\beast bank\b/g," eastbank "],[/\bcanary wharf\b/g," canarywharf "],[/\brussell sq(uare)?\b/g," russellsquare "]];
const FLOOR_Q={first:"f1","1st":"f1",second:"f2","2nd":"f2",third:"f3","3rd":"f3",ground:"fg",g:"fg",lg:"flg",basement:"flg",primera:"f1",segunda:"f2",tercera:"f3"};
function srchNorm(s,isQuery){
  let t=" "+String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[’'`]/g," ").replace(/&/g," and ").replace(/[^a-z0-9]+/g," ")+" ";
  for(const [rx,to] of SRCH_PHRASES)t=t.replace(rx,to);
  const out=[];
  for(let w of t.split(/\s+/)){if(!w)continue;if(isQuery&&FLOOR_Q[w]){out.push(FLOOR_Q[w]);continue;}
    if(w.length>3&&/s$/.test(w)&&!/ss$/.test(w)&&!/^(kings|guys|thomas|goldsmiths|lcf|lcc|csm|ucl|lse|soas)$/.test(w))w=w.slice(0,-1);
    if(w.length===1&&!/\d/.test(w))continue;
    w=SRCH_SYN[w]||w;if(SRCH_STOP.has(w))continue;out.push(w);}
  return out;}
const UNI_ALIAS={ucl:["ucl"],imperial:["imperial"],kings:["kings"],lse:["lse"],qmul:["qmul"],citystgeorges:["citystgeorges","city"],soas:["soas"],birkbeck:["birkbeck"],goldsmiths:["goldsmiths"],ual:["ual"]};
const CAMPUS_EXTRA={"ucl:main-quad":"mainquad gower wilkins bloomsbury","ucl:ioe":"ioe bedford way","ucl:east":"ucl east stratford marshgate poolstreet","ucl:canary-wharf":"canarywharf",
  "ual:csm":"csm kingscross granary","ual:lcf":"lcf fashion eastbank stratford","ual:lcc":"lcc communication elephant","ual:camberwell":"camberwell peckham","ual:camberwell-wilson":"camberwell wilson",
  "ual:chelsea":"chelsea millbank pimlico","ual:wimbledon":"wimbledon","kings:guys":"guys london bridge","kings:strand":"strand","imperial:south-kensington":"southkensington","birkbeck:bbk-malet-street":"malet"};
const CAMPUS_GENERIC=new Set(["campus","college","university","london","main","building","school","road","street","square","st","rd","the","of","and","richard","hoggart","house","row","inn","field","fields","one","canada","sq","bedford","way","incl"]);
let _srch=null;
function srchIndex(){
  if(_srch)return _srch;
  const campus={},uniOf={},cw=new Set();
  for(const u of UNIS)for(const c of u.campuses){const k=u.id+":"+c.id;const toks=srchNorm(c.name+" "+(CAMPUS_EXTRA[k]||"")).filter(w=>!CAMPUS_GENERIC.has(w)&&!/^\d/.test(w));
    campus[k]={lat:c.lat,lon:c.lon,toks:new Set(toks)};uniOf[k]=u.id;toks.forEach(w=>{if(!Object.values(UNI_ALIAS).flat().includes(w))cw.add(w);});}
  const uniWords=new Map();for(const id in UNI_ALIAS)for(const w of UNI_ALIAS[id])uniWords.set(w,id);
  return _srch={campus,uniOf,campusWords:cw,uniWords};}
function nearestCampus(p,uni,maxM){const I=srchIndex();let best=null,bd=maxM||1e9;
  for(const k in I.campus){if(uni&&I.uniOf[k]!==uni)continue;const m=metres(p,I.campus[k]);if(m<bd){bd=m;best=k;}}return best;}
function isCanteen(name){return /refectory|canteen|restaurant|kitchen|food court|dining/i.test(name||"");}
/* One searchable doc per place: its words, its uni and its campus. */
function srchDoc(p){
  if(p._sd)return p._sd;const I=srchIndex();
  let uni=p.uni||(p.ucl||p.g==="ucl"||p.g==="east"||p.g==="cw"?"ucl":null),ck=null;
  if(p.uniBranch){ck=p.uniBranch;uni=I.uniOf[ck]||uni;}
  else if(uni)ck=nearestCampus(p,uni);
  else{ck=nearestCampus(p,null,1500);if(ck)uni=I.uniOf[ck];}
  const words=srchNorm([p.name,p.addr||"",p.sub||"",ck&&I.campus[ck]?[...I.campus[ck].toks].join(" "):"",uni?(UNI_ALIAS[uni]||[]).join(" "):"",isCanteen(p.name)||p.kind==="canteen"?"refectory":""].join(" "));
  const d={words:new Set(words),own:new Set(srchNorm((p.name||"")+" "+(p.addr||""))),uni,campus:ck,canteen:isCanteen(p.name)||p.kind==="canteen"};
  try{Object.defineProperty(p,"_sd",{value:d,enumerable:false,configurable:true});}catch(e){}
  return d;}
function srchParse(q){const I=srchIndex();const toks=srchNorm(q,true);const unis=new Set(),camps=[],rest=[];
  for(const w of toks){if(I.uniWords.has(w))unis.add(I.uniWords.get(w));else if(I.campusWords.has(w))camps.push(w);else rest.push(w);}
  return {toks,unis,camps,rest};}
/* Is the query about a place (a canteen word, a uni or a campus)? Then "Something specific" filters by place. */
function srchPlacey(q){const s=srchParse(q);return s.unis.size>0||s.camps.length>0||s.rest.includes("refectory");}
/* list → [{p,score,m}] best first. opts: {bias, uni (the user's, first on a tie), limit} */
function placeSearch(q,list,opts){
  opts=opts||{};const I=srchIndex();const s=srchParse(q);if(!s.toks.length)return [];
  const out=[];
  for(const p of list){if(!p||typeof p.lat!=="number")continue;const d=srchDoc(p);
    if(s.unis.size&&!s.unis.has(d.uni))continue;
    if(s.camps.length){const ct=d.campus&&I.campus[d.campus]?I.campus[d.campus].toks:null;if(!ct||!s.camps.every(w=>ct.has(w)||d.words.has(w)))continue;}
    let score=0;for(const w of s.rest)if(d.words.has(w))score++;
    for(const w of s.camps)if(d.own.has(w))score+=0.75+(srchNorm(p.name).includes(w)?0.25:0); // "wilkins": the place called that before the rest of the campus
    if(s.rest.length&&!score&&!s.unis.size&&!s.camps.length)continue; // with a uni or a campus, the rest of that campus follows the matches
    out.push({p,score:score+(s.rest.includes("refectory")&&d.canteen?0.5:0),d});}
  let anchor=opts.bias||null;
  if(s.unis.size===1&&!s.camps.length){const u=UNIS.find(x=>x.id===[...s.unis][0]);if(u&&u.campuses[0])anchor=u.campuses[0];}
  for(const r of out)r.m=anchor?metres(anchor,r.p):0;
  out.sort((a,b)=>b.score-a.score||((b.d.uni===opts.uni)-(a.d.uni===opts.uni))||a.m-b.m);
  const seen=new Set(),res=[];for(const r of out){const k=r.p.name+"|"+Math.round(r.p.lat*2000)+"|"+Math.round(r.p.lon*2000);if(seen.has(k))continue;seen.add(k);res.push(r);if(res.length>=(opts.limit||6))break;}
  return res;}

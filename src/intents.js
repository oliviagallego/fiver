/* ---------- WISH INTERPRETER: the search box and the mic, local and offline (claude/fiver-intents.json) ----------
   Filler out, the longest intent phrase wins (several words first), then modifiers: budget, walking time, when, diet, mood, where. */
const INTENT_MAP={"hot_drinks.coffee":["coffee","coffee"],"hot_drinks.tea":["coffee","tea"],"hot_drinks.hot_chocolate":["coffee","hotchoc"],"hot_drinks.matcha":["coffee","matcha"],"hot_drinks.chai":["coffee","chai"],"hot_drinks.iced":["coffee","iced"],
  "drinks":["drinks",""],"drinks.pint":["drinks","beer"],"drinks.cider":["drinks","cider"],"drinks.wine":["drinks","wine"],"drinks.alcohol_free":["drinks","mocktail"],
  "hot_food":["hot+deal",""],"hot_food.breakfast":["hot","breakfast"],"hot_food.chicken":["hot","chicken"],"hot_food.pizza":["hot","pizza"],"hot_food.burger":["hot","burger"],"hot_food.soup":["hot","soup"],"hot_food.jacket":["hot","jacket"],"hot_food.wrap":["hot","wrap"],"hot_food.noodles":["hot","noodles"],
  "meal_deal":["deal",""],"meal_deal.supermarket":["deal","supermarket"],"snack":["snack",""],"snack.fries":["snack","fries"],"snack.fruit":["snack","fruit"],"snack.sandwich":["snack","sandwich"],"snack.salad":["snack","salad"],"snack.croissant":["snack","croissant"],
  "sweet":["sweet",""],"sweet.brownie":["sweet","brownie"],"sweet.cookie":["sweet","cookie"],"sweet.doughnut":["sweet","doughnut"],"sweet.chocolate":["sweet","chocolate"],"sweet.icecream":["sweet","icecream"],"free":["free",""]};
const GENERIC_DRINK=new Set(["drink","drinks","pub","bar","boozer","sesh","night out","pre drinks","pres","a few","bevvy","bevvies","bevvie"]); // "go for a drink": Drinks, no sub-option
function wNorm(s){return " "+String(s||"").toLowerCase().replace(/[’`]/g,"'").replace(/[“”"!?.,;:()\[\]{}]/g," ").replace(/\s+/g," ").trim()+" ";}
function deacc(s){return s.normalize("NFD").replace(/[̀-ͯ]/g,"");}
let _wl=null;
function wishLex(){if(_wl)return _wl;const P=[];
  for(const k in INTENTS.intents)for(const p of INTENTS.intents[k]){if(/\(/.test(p))continue;const key=GENERIC_DRINK.has(p)?"drinks":k;P.push([p,key]);const d=deacc(p);if(d!==p)P.push([d,key]);}
  const M=INTENTS.not_in_catalogue_yet.mapping;for(const p in M)P.push([p,M[p]]);
  P.sort((a,b)=>b[0].split(" ").length-a[0].split(" ").length||b[0].length-a[0].length);
  return _wl={P,filler:new Set(INTENTS.filler.map(w=>w.toLowerCase()))};}
const WDAYS=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
function interpretWish(text,today){
  const L=wishLex();let t=wNorm(text);const out={raw:String(text||""),cats:[],sub:"",drinks:false,dsub:"",q:"",budget:null,mins:null,dayOffset:null,minute:null,diet:[],mood:"",where:null,intent:"",understood:false};
  const cut=rx=>{t=t.replace(rx," ");};
  // money
  let m;const money=[[/ (?:under|less than|below|max|up to) £?(\d+(?:\.\d+)?)(?: quid| pounds| libras)? /,1],[/ £(\d+(?:\.\d+)?) /,1],[/ (\d+(?:\.\d+)?) (?:quid|pounds|libras|pound|euros?) /,1]];
  for(const [rx] of money){m=rx.exec(t);if(m){out.budget=Number(m[1]);cut(rx);break;}}
  const named=[[/ (?:under |less than |for )?a fiver /,5],[/ (?:under |for )?a tenner /,10],[/ a score /,20],[/ couple of quid /,2],[/ few quid /,3],[/ on a budget /,5],[/ skint /,3],[/ broke /,3]];
  if(out.budget===null)for(const [rx,v] of named){if(rx.test(t)){out.budget=v;cut(rx);break;}}
  // walking time
  m=/ (?:in |within )?(\d+) ?(?:minutes|minute|mins|min) (?:walk )?/.exec(t);if(m){out.mins=Number(m[1]);cut(/ (?:in |within )?(\d+) ?(?:minutes|minute|mins|min) (?:walk )?/);}
  else for(const [rx,v] of [[/ close by /,5],[/ right here /,3],[/ walking distance /,15],[/ no rush /,30]])if(rx.test(t)){out.mins=v;cut(rx);break;}
  // when
  const at=/ at (\d{1,2})(?::(\d{2}))? ?(am|pm)? /.exec(t);
  if(/ tomorrow morning /.test(t)){out.dayOffset=1;out.minute=540;cut(/ tomorrow morning /);}
  else if(/ tomorrow /.test(t)){out.dayOffset=1;cut(/ tomorrow /);}
  if(/ tonight /.test(t)){out.dayOffset=out.dayOffset||0;out.minute=1140;cut(/ tonight /);}
  if(/ this evening /.test(t)){out.dayOffset=out.dayOffset||0;out.minute=1080;cut(/ this evening /);}
  if(/ for lunch /.test(t)&&out.minute===null)out.minute=750;
  if(/ for breakfast /.test(t)&&out.minute===null)out.minute=540;
  if(/ for dinner /.test(t)&&out.minute===null)out.minute=1140;
  if(at){let h=Number(at[1]);const mm=Number(at[2]||0);if(at[3]==="pm"&&h<12)h+=12;if(at[3]==="am"&&h===12)h=0;if(!at[3]&&h>=1&&h<=7)h+=12;if(h<24){out.minute=h*60+mm;cut(/ at (\d{1,2})(?::(\d{2}))? ?(am|pm)? /);}}
  for(let i=0;i<7;i++){const rx=new RegExp(" (?:on )?"+WDAYS[i]+" ");if(rx.test(t)&&typeof today==="number"){out.dayOffset=(i-today+7)%7;cut(rx);}}
  if(/ today /.test(t)){out.dayOffset=out.dayOffset||0;cut(/ today /);}
  // diet and mood
  const D=INTENTS.modifiers.diet;for(const k in D)for(const p of D[k])if(new RegExp(" "+p.replace(/[-]/g,"[- ]")+" ").test(t)){if(!out.diet.includes(k))out.diet.push(k);cut(new RegExp(" "+p.replace(/[-]/g,"[- ]")+" "));}
  const MO=INTENTS.modifiers.mood;for(const k in MO)for(const p of MO[k])if(new RegExp(" "+p+" ").test(t)&&!out.mood)out.mood=k;
  // where: "near Euston", "at King's Cross"
  if(typeof VENUES!=="undefined"){const w=/ (?:near|in|at|by) ([a-z' ]+?) /.exec(t+" ");for(const v of VENUES){const n=v.name.toLowerCase().replace(/[’]/g,"'").split(/[,/(]/)[0].trim();if(n.length>3&&t.includes(" "+n.split(" ")[0]+" ")&&(!w||w[1].startsWith(n.split(" ")[0]))&&/(near|at|in|by) /.test(t)){out.where={lat:v.lat,lon:v.lon,label:v.name};break;}}}
  // intents: the longest phrase first
  const hits=[];for(const [p,k] of L.P){const pd=" "+p+" ";let i=t.indexOf(pd);if(i<0){const td=deacc(t);i=td.indexOf(" "+deacc(p)+" ");if(i<0)continue;}hits.push([p,k]);t=t.slice(0,i)+" "+"_".repeat(Math.max(1,p.length-1))+" "+t.slice(i+pd.length);}
  const keys=hits.map(h=>h[1]);out.phrases=hits.map(h=>h[0]);
  for(const k of keys){if(k.startsWith("diet:")){const d={veg:"veg",vegan:"vegan",gf:"gf",halal:"halal",df:"df",nuts:"nuts"}[k.slice(5)];if(d&&!out.diet.includes(d))out.diet.push(d);}}
  const qk=keys.find(k=>k.startsWith("q:"));if(qk){out.q=qk.slice(2);out.intent=qk;}
  const real=keys.filter(k=>INTENT_MAP[k]);
  const sub=real.find(k=>k.includes("."))||real.find(k=>k==="free")||real[0];
  if(sub){out.intent=out.intent||sub;out.intent=sub;const [c,s]=INTENT_MAP[sub];
    if(c==="drinks"){out.drinks=true;out.dsub=s;}else if(c==="hot+deal"){out.cats=["hot","deal"];}else{out.cats=[c];out.sub=s;}
    if(sub==="free")out.cats=["free"];}
  const map=INTENTS.not_in_catalogue_yet.mapping;const mapped=hits.find(h=>map[h[0]]&&!String(map[h[0]]).startsWith("diet:")&&!String(map[h[0]]).startsWith("q:"));
  if(mapped&&!out.q)out.q=mapped[0]; // "bubble tea": Iced, and a search for the words themselves
  // what is left: a dish name for the normal search
  const left=t.split(" ").filter(w=>w&&!/^_+$/.test(w)&&!L.filler.has(w)&&!/^\d+$/.test(w)&&!/^(with|and|or|after|before|class|lecture|study|quiet|cosy|somewhere|anywhere|murder|could|dying|gagging|gasping|after|need|stat|up|swing|pop|out|sort|round|wi|get|hank)$/.test(w));
  out.left=left.join(" ");
  out.understood=!!(out.cats.length||out.drinks||out.q||out.diet.length||out.budget!==null||out.mins!==null);
  if(!out.understood)out.clean=out.left;
  out.say=wishSay(out);
  return out;}
/* Several things in one sentence: "coffee and a doughnut", "pizza, chips plus a cookie", "un café y un donut". Every part it understands is marked.
   "sandwich + crisps + drink" is a meal deal. Never "or" or "and" modes: the results show the places with all of them first. */
const MULTI_SPLIT=/\s*(?:,|\+|&)\s*|\s+(?:and|with|plus|or|y|con|o|n)\s+/i;
function interpretMulti(text,today){const w=interpretWish(text,today);const t=wNorm(text);
  if(/ meal deal /.test(t)||(/ (sandwich|sarnie|butty|baguette|wrap) /.test(t)&&/ crisps? /.test(t)&&/ (drink|juice|coke|water|pop|smoothie) /.test(t))){
    Object.assign(w,{cats:["deal"],sub:"",subs:[],drinks:false,dsub:"",q:"",left:"",understood:true,say:"Sandwich, crisps, drink. That’s a meal deal."});return w;}
  if((w.phrases||[]).some(p=>MULTI_SPLIT.test(" "+p+" ")))return w; // "fish and chips" is one dish
  const parts=String(text||"").split(MULTI_SPLIT).map(x=>x.trim()).filter(Boolean);if(parts.length<2)return w;
  const got=[];let drink=false;
  const SOFT=/\b(coke|cola|pepsi|sprite|fanta|oasis|lemonade|juice|water|soft drinks?|irn bru|tango|7.?up|fizzy|lucozade|j2o|ribena|refresco|zumo)\b/i;
  for(const part of parts){if(SOFT.test(part)||/^(a |an |some )?(drink|bebida)$/i.test(part.trim())){if(!got.some(g=>g.k==="snack.softdrink"))got.push({k:"snack.softdrink",cats:["snack"],sub:"softdrink"});continue;} // "a coke" with food: a soft drink, not the pub
    const pw=interpretWish(part,today);if(pw.drinks){drink=true;continue;}if(!pw.cats.length||pw.cats[0]==="free")continue;
    const k=pw.cats.join("+")+"."+pw.sub;if(!got.some(g=>g.k===k))got.push({k,cats:pw.cats,sub:pw.sub});}
  if(got.length<2||drink||got.every(g=>g.sub==="softdrink"))return w;if(got.length>5)got.length=5; // five's the limit
  const cats=[];for(const g of got)for(const c of g.cats)if(!cats.includes(c))cats.push(c);
  Object.assign(w,{cats,sub:"",subs:got.filter(g=>g.sub).map(g=>({cat:g.cats[0],id:g.sub})),drinks:false,dsub:"",q:"",left:"",understood:true,say:""});
  return w;}
/* Claude's answer (mode "wish") in the interpreter's shape; null when it is not about food or drink */
const WISH_SUBS={hot:["chicken","pizza","burger","soup","jacket","wrap","noodles","breakfast"],coffee:["coffee","tea","hotchoc","matcha","chai","iced"],snack:["fries","fruit","sandwich","salad","croissant"],sweet:["brownie","cookie","doughnut","chocolate","icecream"],deal:["supermarket","lunchdeal","breakfastdeal"],drinks:["beer","cider","wine","mocktail"]};
function wishFromClaude(j,raw){if(!j)return null;const cat=["hot","deal","coffee","snack","sweet","free","drinks"].includes(j.cat)?j.cat:null;const q=typeof j.q==="string"?j.q.slice(0,40):"";if(!cat&&!q)return null;
  const sub=cat&&WISH_SUBS[cat]&&WISH_SUBS[cat].includes(j.sub)?j.sub:"";const num=v=>typeof v==="number"&&isFinite(v)?v:null;
  const tm=typeof j.time==="string"&&/^\d{1,2}:\d{2}$/.test(j.time)?j.time.split(":").map(Number):null;
  const o={raw,cats:cat&&cat!=="drinks"?(cat==="hot"&&!sub?["hot","deal"]:[cat]):[],sub:cat!=="drinks"?sub:"",drinks:cat==="drinks",dsub:cat==="drinks"?sub:"",q,budget:num(j.budget),mins:num(j.mins),dayOffset:num(j.dayOffset),minute:tm?tm[0]*60+tm[1]:null,
    diet:Array.isArray(j.diet)?j.diet.filter(d=>["veg","vegan","gf","halal","df","nuts"].includes(d)):[],mood:typeof j.mood==="string"?j.mood:"",where:null,left:"",understood:true};
  o.say=wishSay(o);return o;}
function wishSay(o){if(o.drinks)return o.dsub==="mocktail"?"Alcohol-free it is.":o.dsub==="wine"?"Wine o'clock.":o.dsub==="cider"?"Cider o'clock.":"Pint o'clock.";
  if(o.sub==="coffee")return "Coffee it is.";if(o.sub==="tea")return "Tea it is. Kettle's on.";if(o.sub==="hotchoc")return "Hot chocolate it is.";
  if(o.cats[0]==="free")return "Free food. My favourite price.";
  if(o.sub){const d=(typeof SUBS!=="undefined"&&(SUBS[o.cats[0]]||[]).find(x=>x[0]===o.sub));return (d?d[2]:o.sub.charAt(0).toUpperCase()+o.sub.slice(1))+". Good choice.";}
  if(o.cats.includes("hot"))return "Food. Coming right up.";if(o.cats[0]==="sweet")return "Something sweet. Coming right up.";if(o.cats[0]==="snack")return "Snack time.";if(o.cats[0]==="deal")return "A meal deal. Coming right up.";
  if(o.q)return "Let me sniff out "+o.q+".";return "";}


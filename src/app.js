/* ---------- STATE ---------- */
const state={step:0,intro:0,uni:"ucl",where:null,cats:new Set(),subs:[],q:"",budget:5,mins:30,dayOff:0,minute:null,cards:new Set(["unidays"]),diet:new Set(),note:"",name:"",added:[],setupDone:false,crumbs:0};
try{const s=JSON.parse(localStorage.getItem("fiver.v7")||localStorage.getItem("fiver.v6")||localStorage.getItem("fiver.v5")||localStorage.getItem("fiver.v4")||"{}");
  if(s.cards)state.cards=new Set(s.cards); if(s.cats)state.cats=new Set(s.cats); if(s.diet)state.diet=new Set(s.diet);
  if(typeof s.budget==="number")state.budget=s.budget; if(typeof s.mins==="number")state.mins=Math.min(45,s.mins); if(s.seenResults)state.seenResults=true;
  if(typeof s.name==="string")state.name=s.name; if(typeof s.note==="string")state.note=s.note;
  if(s.where&&typeof s.where.lat==="number")state.where=s.where; if(typeof s.uni==="string")state.uni=s.uni;
  if(Array.isArray(s.added))state.added=s.added; if(s.setupDone&&s.diet)state.setupDone=true; if(typeof s.crumbs==="number")state.crumbs=s.crumbs;
}catch(e){}
/* What goes on the phone never carries Google's name, address, hours or rating: a place picked from Google keeps its place_id, its point (30 days) and the words typed */
function whereKeep(w){if(!w||w.label==="your location")return null;if(!w.g)return w;return {lat:w.lat,lon:w.lon,label:w.typed||"Your spot",g:true,placeId:w.placeId||"",typed:w.typed||"",t:w.t||Date.now()};}
function addedKeep(a){const o=Object.assign({},a);delete o.rating;delete o.ratingN;if(o.nameLive)o.name="";return o;}
(function(){const now=Date.now(),D30=30*86400e3;
  if(state.where&&state.where.g&&(!state.where.t||now-state.where.t>D30))state.where=null; // a Google point is kept 30 days at most
  state.added=(state.added||[]).filter(a=>{if(!a||a.coordSource!=="google")return true;const t=a.t||Number((String(a.id).match(/\d{12,}/)||[])[0]);return !t||now-t<=D30;}).map(a=>{
    const o=Object.assign({},a);delete o.rating;delete o.ratingN;if(o.placeId&&o.hours&&!o.baseId){delete o.hours;o.hoursUnknown=true;}
    if(o.nameLive&&!o.name)o.name="Name needs a connection";return o;});
  try{if(localStorage.getItem("fiver.mig.gp2")!=="1"){localStorage.setItem("fiver.mig.gp2","1");setTimeout(persist,0);}}catch(e){}})();
function persist(){try{localStorage.setItem("fiver.v7",JSON.stringify({cards:[...state.cards],cats:[...state.cats],diet:[...state.diet],budget:state.budget,mins:state.mins,name:state.name,note:state.note,where:whereKeep(state.where),added:state.added.map(addedKeep),setupDone:state.setupDone,crumbs:state.crumbs,seenResults:!!state.seenResults,uni:state.uni}));}catch(e){}}
const UNI_LIST=UNIS.map(u=>({id:u.id,short:u.short,name:u.name})); // UCL first (the catalogue's order)
function uniShort(id){const u=UNI_LIST.find(x=>x.id===(id||state.uni));return u?u.short:"your uni";}
function uniMain(id){const u=UNIS.find(x=>x.id===(id||state.uni));if(!u)return null;return u.campuses[0]||null;}
function uniChips(id,sel){return '<div class="chips" id="'+id+'">'+UNI_LIST.map(u=>'<button type="button" class="chip'+(sel===u.id?" on":"")+'" data-uni="'+u.id+'">'+esc(u.short)+'</button>').join("")+'<button type="button" class="chip'+(sel==="other"?" on":"")+'" data-uni="other">Other</button></div>';}
function uniName(){return state.uni&&state.uni!=="other"&&UNI_LIST.find(x=>x.id===state.uni)?uniShort():null;} // null = Other / not chosen
function footText(){return "Made for "+(uniName()||"London")+" students · run by a rat with standards";}
function cardsFor(){return CARDS.filter(c=>!c.uni||c.uni===state.uni);} // each uni's own food app only for its students
function firstCardsFor(){const app=CARDS.find(c=>c.uni&&c.uni===state.uni);return ["unidays","beans",app?app.id:"totum","clubcard","clubpret","greggsapp"];}
function mainCampusShort(){const m=uniMain();return m?m.name.replace(/ \(.*$/,"").replace(/ Campus$/,""):"Main Quad / Wilkins";}
function uniReply(id){return id==="ucl"?"UCL. My home turf.":id==="ual"?"UAL. Art students eat too.":id==="other"?"Somewhere new. I’ll learn it.":uniShort(id)+". Good choice. I know a few shortcuts.";}
/* Crumbs: recognition only, kept on this phone. No redeeming, no promises. */
const UAL_AREA={csm:"King’s Cross",lcf:"Stratford",lcc:"Elephant & Castle",camberwell:"Camberwell","camberwell-wilson":"Camberwell",chelsea:"Pimlico",wimbledon:"Wimbledon"};
const AREA={ual:"King’s Cross",ucl:"Bloomsbury",soas:"Bloomsbury",birkbeck:"Bloomsbury",imperial:"South Kensington",kings:"the Strand",lse:"Holborn",qmul:"Mile End",citystgeorges:"Clerkenwell",goldsmiths:"New Cross"};
function areaName(){ // where Fiver says it lives; "London" for Other or no uni
  const w=state.where;if(state.uni==="ucl"&&w&&typeof w.lat==="number"&&typeof metres==="function"){if(metres(w,{lat:51.5392,lon:-0.0138})<2500)return "Stratford";if(metres(w,{lat:51.5049,lon:-0.0195})<2000)return "Canary Wharf";}
  if(state.uni==="ual"){const u=UNIS.find(x=>x.id==="ual");let best="csm",bd=3000;if(u&&w&&typeof w.lat==="number"&&typeof metres==="function")for(const c of u.campuses){const m=metres(w,c);if(m<bd){bd=m;best=c.id;}}
    return UAL_AREA[best]||UAL_AREA.csm;} // UAL: the area of the college you're at (CSM by default)
  return AREA[state.uni]||"London";}
function areaCap(){const a=areaName();return a.charAt(0).toUpperCase()+a.slice(1);}
const RANKS=[[150,"{area} legend"],[50,"Menu hunter"],[10,"Crumb finder"],[0,"New in town"]];
function rankName(n){return (RANKS.find(r=>n>=r[0])||RANKS[RANKS.length-1])[1].replace("{area}",areaCap());}
function addCrumbs(n){state.crumbs=(state.crumbs||0)+n;persist();}
const STEPS=["hello","where","results"];
const S={hello:0,where:1,results:2};
if(state.setupDone)state.step=state.where?S.results:S.where;
const UI={later:false,spec:false,bOther:false,mOther:false,lastFkey:""};
function getKey(){try{return localStorage.getItem("fiver.key")||"";}catch(e){return "";}}
const REDUCED=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
const RAT_BOX=[150,150];
/* Moment → line → pose, from data/fiver-frases.json (37 moments, 153 lines). A row is a line and its drawing together: never mixed.
   Each moment deals from a shuffled bag (all rows before any repeats), never one of the last 4 lines shown anywhere (kept in localStorage).
   The line stays while nothing changes (same pick, budget, minutes, food types, time, place, wish); change anything, new line.
   A row's pose falls back to its "fallback" when the drawing is missing. */
const MOMENTS={"support":[["Free food if money’s tight. One of each item, no questions.","s_sit"],["No judgement here. Free food is free food.","s_sit"],["Take what you need. That’s what it’s for.","front"]],"free":[["Free. As in free. Go before the second-years find it.","ticket"],["Free food. The best kind of food.","a_pizzabox","cheer"],["Zero pounds. My favourite number.","f_excited"],["Free, nearby and happening now. Run.","run","walk"],["Bring a friend. Or don’t. More for you.","f_wink"],["Free pizza. I carried it here myself.","a_pizzabox","ticket"]],"late":[["Closing-time price. Walk fast.","run","walk"],["They shut soon and it’s half price. Hurry.","run","walk"],["Last call for cheap. Go, go, go.","s_follow"],["End-of-day bargain. The early bird is overrated.","f_smug"]],"card":[["You had this discount on your phone the whole time. I’m not angry. Just disappointed.","threeq"],["With your card it’s under a fiver. Told you I’d remember.","cheer"],["Show the app at the till and watch the price drop.","ticket"],["Your student card, finally earning its keep.","a_card","ticket"],["Discount unlocked. I’m basically a financial adviser.","f_smug"],["Flash the card, keep the cash.","a_card","ticket"],["That’s {save} off. Spend it on something small. Like a biscuit.","a_coins","f_wink"]],"found":[["Found your {q}{name}. Told you I know things.","a_magnify","point"],["{q}? Right this way.","s_follow"],["One {q}, coming up. Well, you walk. I point.","point"],["I went looking for {q}. I’m very good at looking.","a_magnify","sniff"],["{q} at this price? I’d frame the receipt.","f_excited"]],"library":[["Library snack, sorted. Under a fiver, obviously.","a_books"],["Brain food for the library. Keep the crumbs off the books.","a_books"],["Revision needs snacks. That’s science.","a_laptop"]],"asian":[["Sushi under a fiver. I’ve seen the future.","a_noodles","f_excited"],["Miso hungry. Sorry, couldn’t resist.","a_noodles","f_laugh"],["Noodles. Cheap, warm and very slurpable.","a_noodles","f_tongue"],["Chopsticks optional. Hunger compulsory.","a_noodles","point"]],"wrap":[["Burrito under a fiver. Wrap it up, I’ll take it.","a_burrito","pizza"],["Foil, beans, happiness. In that order.","a_burrito","f_hearts"],["It’s a wrap. Literally.","a_burrito","f_laugh"]],"soup":[["Soup. A hug in a cup.","a_soup","f_hearts"],["Cold outside, soup inside. Sorted.","a_soup","front"],["Spoon at the ready. Wallet stays full.","a_soup","f_wink"]],"tea":[["A brew for under a fiver. Very British of you.","a_tea","a_coffee"],["Hot chocolate counts as a meal if you believe hard enough.","a_tea","f_hearts"],["Tea. Because everything’s better with tea.","a_tea","a_coffee"],["Warm mug, cold hands, happy rat.","a_tea","f_hearts"]],"drink":[["Sip, walk, save.","a_boba","a_backpack"],["Cold drink, warm wallet.","a_backpack"],["Hydration is self-care. Cheap self-care.","a_backpack"],["Grab it and go. The lecture won’t wait.","walk"],["Bubble tea. Chewy, sweet, under a fiver.","a_boba","a_backpack"]],"fruit":[["An apple a day keeps the overdraft away.","a_apple"],["Something green. Your mum would be proud.","a_apple"],["Healthy and cheap. I know, I’m surprised too.","f_oh"],["Vitamins on a budget. Look at you.","a_apple"]],"hot":[["Hot, cheap, and nobody’s watching. Go.","pizza"],["Something warm for under a fiver. London owes you that.","a_pizza"],["Proper hot food. Not a sad sandwich in sight.","pizza"],["Warm hands, warm belly, wallet intact.","a_pizza"],["Hot and cheap. Why choose?","f_excited"],["Eat it while it’s hot. That’s the whole plan.","pizza"]],"deal":[["Meal deal. The Londoner’s love language.","bag"],["Main, snack, drink. The holy trinity.","a_sandwich"],["Three things for one price. I love maths when it’s like this.","a_sandwich"],["Meal deal acquired. Choose your crisps wisely.","bag"],["Sandwich, snack, drink. Lunch, solved.","a_sandwich"],["A meal deal a day keeps the overdraft away.","bag"]],"coffee":[["Caffeine under a fiver. You’re welcome.","a_coffee"],["Coffee first. Thinking later.","a_coffee"],["Your lecture called. It said bring coffee.","a_coffee"],["Cheaper than a London latte has any right to be.","f_smug"],["One coffee, zero guilt.","a_coffee"],["Rats don’t drink coffee. I just like the smell.","f_sniff"]],"snack":[["Snack sorted. Crumbs are mine.","a_croissant"],["A little something. For energy. Obviously.","a_croissant"],["Snack o’clock. I don’t make the rules.","a_croissant"],["Pastry-shaped happiness, under a fiver.","f_hearts"],["That’ll keep you going till dinner. Probably.","f_wink"]],"sweet":[["Pudding first. I won’t tell.","a_icecream"],["Sugar is a food group. I’ve decided.","a_donut","a_icecream"],["You deserve a treat. I deserve the crumbs.","f_tongue"],["Dessert before dinner. Living dangerously.","a_icecream"],["Sweet, cheap and very close. A bit like me.","f_wink"],["Doughnut worry, it’s under a fiver.","a_donut","f_laugh"]],"pick":[["Found it{name}. Don’t tell the pigeons.","point"],["This one. Trust the rat.","point"],["Right there. I’ve done the walking for you.","s_follow"],["Cheap, close and open. The holy trinity.","cheer"],["I sniffed out a good one{name}.","sniff"],["Go on. Your wallet will thank me later.","f_wink"],["Best thing near you for the money. I checked twice.","threeq"]],"bargain":[["Under two quid. I’m practically paying you.","a_coins","cheer"],["This is so cheap I’m checking it’s real.","f_oh"],["Spare-change lunch. Respect.","a_coins","s_pockets"],["Cheaper than the bus. Walk there.","walk"]],"breakfast":[["Breakfast under a fiver. Most important meal, cheapest meal.","a_croissant"],["Morning. Eat something before your 9am.","a_coffee"],["Morning. Breakfast first, everything else after.","a_coffee"],["Up early? Me too. I never went to bed.","f_sleep"]],"lunch":[["Lunch rush. Beat the queue.","run","walk"],["Lunchtime. I’ve already picked for you.","point"],["Lunch under a fiver. In London. Yes, really.","cheer"]],"afternoon":[["Afternoon slump? I have a snack for that.","a_croissant"],["Three o’clock hunger is real. I don’t judge.","f_neutral"],["Mid-afternoon hunger is real. I don’t judge.","f_neutral"],["Too late for lunch, too early for dinner. Snack it is.","a_donut"]],"evening":[["Dinner for under a fiver. Don’t tell your flatmates.","f_wink"],["Evening{name}. Hungry after all that thinking?","front"]],"night":[["It’s late. I’m up anyway.","f_sleep"],["Midnight snack? Technically it’s dinner.","f_tongue"],["Night owl? I’m more of a night rat.","f_sleep"]],"first":[["Here’s what’s open near you. Change anything below, I’ll keep up.","point"],["First time? I’ve already found you something.","cheer"],["Welcome. I know every cheap bite round here.","wave","front"]],"back":[["Oh, you again. Hungry?","wave","front"],["Back already? I like you.","f_wink"],["Welcome back{name}. Same spot or somewhere new?","wave","threeq"],["Missed me? I found more food.","f_excited"]],"few":[["I’m new around {area}. Teach me your spots →","s_peek"],["I’ve only just moved to {area}. Show me where you eat →","s_peek"],["Still mapping {area}. Snap a menu and I’ll remember it →","a_camera","a_map"],["Not many spots here yet. You could be my first →","s_peek"]],"budget":[["That’s more than a fiver. And I’d know.","s_pockets"],["Nothing at that price. Even rats have limits.","a_plate","s_pockets"],["My pockets are empty and so is this list. Try a bit more?","s_pockets"],["London’s being London. Nudge the budget up a little?","s_shrug"],["My plate’s as empty as this list. A bit more budget?","a_plate","f_sad"]],"time":[["Nothing under {b} within {m} min. Even I’m impressed, London.","s_shrug"],["{m} minutes isn’t much. Give me five more and I’ll find something.","s_shrug"],["Too far for {m} min. I’ve got little legs too.","run","f_sad"]],"shut":[["Everything’s shut. So am I.{t}","sleep"],["Closed, closed, closed. London’s having a nap.{t}","sleep"],["Nothing open now. I’m going back to bed.{t}","f_sleep"]],"noq":[["No {q} for that. Without it I’d say {alt}.","s_shrug"],["Nobody near has taught me {q} yet. Teach me a place →","s_peek"],["{q} is hiding from me. Try {alt}?","a_magnify","sniff"],["No {q} near you. My plate is also sad.","a_plate","f_sad"]],"loading":[["Sniffing around…","sniff"],["Asking the pigeons…","f_neutral"],["Hold on, I’m in the zone…","a_headphones"],["Checking my notes…","a_laptop"],["Reading the menu boards…","a_books"],["Thinking very hard…","a_think","f_neutral"],["Looking very closely…","a_magnify","sniff"]],"where":[["Where are you{name}?","a_map"],["Drop a pin. I’ll do the rest.","a_map"],["Which bit of London are we eating in?","a_map"]],"teach":[["You snap, I read. Menus only, please.","a_camera","a_laptop"],["Snap the board. I’ll do the maths.","a_camera","a_laptop"],["Straight on and close up. I’m a rat, not a detective.","a_camera","a_laptop"],["Let me read that…","a_think","f_neutral"]],"install":[["Pop me on your home screen. I’m small, I don’t take up much room.","s_sit"],["One tap and I live on your phone. Rent-free.","a_phone","f_smug"],["Add me to your home screen. I promise no spammy notifications.","f_wink"],["Show your mates. I don’t mind the attention.","a_phone","f_smug"]],"invite":[["Got an invite in your inbox? Paste it, I’ll read it.","a_laptop"],["Free pizza in an email somewhere? Paste it here.","a_laptop"]],"deals":[["Today’s deals. I’ve already been shopping.","a_bags"],["Fresh deals, picked this morning.","a_bags"],["These won’t last. Neither will my patience.","f_smug"]],"drinks":[["Cheapest pint near you. I checked the board, not the vibes.","d_cheers"],["Wednesday is the cheap night. Rats know these things.","d_dance"],["Two for you? I’m not judging, I’m counting.","d_twopints"],["Cheers to paying less.","d_clink"],["Pizza and a pint. Balanced diet.","d_party"],["Water’s free. Every bar has to give it if you ask.","d_water"],["Pints this cheap should be illegal. They’re not. I checked.","d_cheers"],["I found the cheap round. You’re welcome.","d_cheers"],["Student night. My favourite kind of maths.","d_dance"],["Happy hour is my cardio.","d_dance"],["One for now, one for your mate. I hope.","d_twopints"],["Two pints, one fiver-ish. Rare, but it happens.","d_twopints"],["Here’s to the cheapest round in town.","d_clink"],["Clink. Your wallet says thank you.","d_clink"],["Pizza first, pint second. I’m a rat of order.","d_party"],["Party rat reporting for duty. Cheaply.","d_party"],["Alcohol-free counts. Your 9am will thank you.","d_water"],["Pacing yourself? Smart rat.","d_water"]],"sleepy":[["Wake me when you know what you fancy.","sleep"],["Pick a food and I’ll do the rest.","s_sit"],["I’m resting my eyes. Tap something tasty.","sleep"]]};
const MOM={cur:{},bags:{},recent:(()=>{try{const a=JSON.parse(localStorage.getItem("fiver.lines")||"[]");return Array.isArray(a)?a.slice(-4):[];}catch(e){return [];}})()};
function poseOf(r){const ok=k=>!!k&&(k==="walk"||!!ART[k]);return ok(r[1])?r[1]:ok(r[2])?r[2]:"front";}
function shuffled(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function hashStr(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);}
/* Lines that name a time of day only come out inside their window (minutes from midnight; a window can run past midnight). */
const LINE_WIN={"Three o’clock hunger is real. I don’t judge.":[900,960],"Mid-afternoon hunger is real. I don’t judge.":[960,1050],"Too late for lunch, too early for dinner. Snack it is.":[960,1050],
  "Midnight snack? Technically it’s dinner.":[1410,90],"Morning. Eat something before your 9am.":[0,540],"Morning. Breakfast first, everything else after.":[540,660],"Alcohol-free counts. Your 9am will thank you.":[1080,120]};
const TIME_WORDS=/o[’']clock|\b\d{1,2}\s?(am|pm)\b|midnight|\bnoon\b/i;
function inWin(line,m){const w=LINE_WIN[line];if(!w)return !TIME_WORDS.test(line)||/^Snack o[’']clock/.test(line);return w[0]<=w[1]?(m>=w[0]&&m<w[1]):(m>=w[0]||m<w[1]);}
function moment(key,ctx,vars,keep){
  const rows=MOMENTS[key]||MOMENTS.pick;let idx=rows.map((_,i)=>i);if(keep){const f=idx.filter(i=>keep(rows[i][0]));if(f.length)idx=f;}
  {const mins=selectedTime().minutes;const f=idx.filter(i=>inWin(rows[i][0],mins));if(f.length)idx=f;else{const g=rows.map((_,i)=>i).filter(i=>inWin(rows[i][0],mins));if(g.length)idx=g;}}
  const c=MOM.cur[key];let i;
  if(c&&c.ctx===ctx&&idx.includes(c.i))i=c.i;
  else{let bag=(MOM.bags[key]||[]).filter(j=>idx.includes(j));if(!bag.length)bag=shuffled(idx);
    const prev=c?c.i:-1;let at=bag.findIndex(j=>j!==prev&&!MOM.recent.includes(key+":"+j));if(at<0)at=bag.findIndex(j=>j!==prev);if(at<0)at=0;
    i=bag.splice(at,1)[0];MOM.bags[key]=bag;MOM.cur[key]={ctx,i};
    MOM.recent=MOM.recent.filter(x=>x!==key+":"+i).concat(key+":"+i).slice(-4);try{localStorage.setItem("fiver.lines",JSON.stringify(MOM.recent));}catch(e){}}
  let line=rows[i][0];const v=Object.assign({name:"",area:areaName()},vars||{});for(const k in v)line=line.split("{"+k+"}").join(v[k]);
  if(line)line=line.charAt(0).toUpperCase()+line.slice(1);
  return {line,pose:poseOf(rows[i]),key,i};}
const ASIAN=/sushi|maki|onigiri|gyoza|noodle|ramen|katsu|teriyaki|miso|edamame|bento|udon|\bpho\b|\bbao\b|donburi|dumpling/i,ASIAN_AT=/\bitsu\b|wasabi|sushi|ramen|noodle|wagamama|\bbao\b|tonkotsu|kokoro|\bpho\b/i;
const WRAP=/burrito|wrap|quesadilla|taco|flatbread|falafel|kebab|shawarma/i,WRAP_AT=/tortilla|burrito|taco|chipotle|kebab|shawarma/i;
const SOUP=/soup|stew|broth|laksa|tom yum/i,TEA=/tea\b|chai|matcha|hot chocolate|cocoa|babycino/i;
const DRINKY=/bubble tea|boba|smoothie|juice|milkshake|frapp|iced|lemonade|kombucha|water|cola|coke/i;
const FRUITY=/apple|banana|fruit|salad|greens|porridge|oats|yogurt|yoghurt|granola|hummus|\bveg\b/i;
function pickMoment(x,q){ // support → free → late → card (only when the card is what makes it fit) → found → library → asian → wrap → soup → tea → drink → fruit → food type → pick
  if(x.p.support)return "support";if(x.of.cat==="free"||x.pr.price===0)return "free";if(x.pr.time)return "late";
  const withCard=x.saved>0&&x.pr.label&&!/^(No card|Everyone)$/.test(x.pr.label);if(withCard&&x.pr.price+x.saved>state.budget+1e-9&&x.pr.price<=state.budget+1e-9)return "card";
  if(q)return "found";
  if(/library/i.test(x.p.name)||(state.where||{}).kind==="library")return "library";
  const it=x.of.item||"",pn=x.p.name||"";
  if(ASIAN.test(it)||ASIAN_AT.test(pn))return "asian";if(WRAP.test(it)||WRAP_AT.test(pn))return "wrap";if(SOUP.test(it))return "soup";
  if(TEA.test(it)&&!/bubble|boba|iced/i.test(it))return "tea";if(DRINKY.test(it))return "drink";if(FRUITY.test(it))return "fruit";
  return MOMENTS[x.of.cat]?x.of.cat:"pick";}
// A line that names a food only goes with that food: "Bubble tea…" not for a juice, "Sushi…" not for prawn crackers, "Doughnut worry" not for a muffin.
const NAMED=[[/bubble tea/i,/bubble|boba/i],[/sushi/i,/sushi|maki|roll|nigiri|hosomaki|sashimi/i],[/miso/i,/miso/i],[/noodles/i,/noodle|ramen|udon|soba|yakisoba/i],[/burrito/i,/burrito/i],[/foil, beans/i,/burrito|wrap|bean/i],
  [/hot chocolate/i,/chocolate|cocoa/i],[/^tea\b|a brew/i,/tea\b|brew|chai|matcha/i],[/doughnut/i,/doughnut|donut/i],[/pudding|dessert/i,/./],[/pastry/i,/pastry|croissant|pain|danish|bun|roll/i],[/apple a day/i,/./],[/something green/i,/green|salad|veg|kale|spinach|apple|pear|fruit/i],
  [/coffee|caffeine|latte/i,/coffee|latte|cappuccino|americano|espresso|flat white|mocha|macchiato|cortado|filter/i],[/soup/i,/soup|broth|stew|laksa|tom yum/i],[/meal deal|main, snack, drink|sandwich, snack/i,/deal|pair|bundle|combo/i]];
function fitsItem(x){const it=(x.of.item||"")+" "+(x.p.name||"");return line=>NAMED.every(([say,need])=>!say.test(line)||need.test(it));}
function overlayKey(x,ctx,t){ // 1 in 4 a bargain line (the coins) when it's £2 or less; else 1 in 3 the time-of-day line; decided by the context, so it holds still
  const h=hashStr(ctx);if(x.pr.price<=2&&h%4===0)return "bargain";if(Math.floor(h/2)%3!==0)return null;const m=t.minutes;
  return m<300?"night":m<660?"breakfast":m>=690&&m<870?"lunch":m>=900&&m<1050?"afternoon":m>=1050&&m<1260?"evening":m>=1260?"night":null;}
function ratSize(k){const [w,h]=ARTW[k];const sc=Math.min(RAT_BOX[0]/w,RAT_BOX[1]/h,1);return [Math.round(w*sc),Math.round(h*sc)];}
const SVGCACHE={};
function svgOf(k,w,h,cls){ // the pose as inline SVG with an explicit box
  if(!SVGCACHE[k])SVGCACHE[k]=decodeURIComponent(ART[k].slice("data:image/svg+xml,".length)).replace(/^<svg /,'<svg aria-hidden="true" focusable="false" ');
  return SVGCACHE[k].replace(/^<svg /,'<svg class="rat '+(cls||"")+'" width="'+w+'" height="'+h+'" style="width:'+w+'px;height:'+h+'px" ');
}
function setRat(box,k){const [w,h]=ratSize(k);box.innerHTML=svgOf(k,w,h);box.dataset.pose=k;}
const WALK_SC=130/Math.max(ARTW.walk1[1],ARTW.walk2[1],ARTW.walk3[1],ARTW.walk4[1]); // every stride frame at the same scale, feet on the same line
function setWalk(box,n){const k="walk"+n;const [W,H]=ARTW[k];box.innerHTML=svgOf(k,Math.round(W*WALK_SC),Math.round(H*WALK_SC));}
function ratPose(k){const box=view.querySelector(".stage-rat");if(box&&ART[k])setRat(box,k);}
function walkLoop(box){ // closing-time price: Fiver keeps walking, about 8 frames a second; still with reduced motion
  if(box.__loop)clearInterval(box.__loop);box.classList.remove("walk","hop","idle");let f=0;setWalk(box,1);box.dataset.pose="walk";
  box.__loop=setInterval(()=>{if(!box.isConnected||box.dataset.pose!=="walk"){clearInterval(box.__loop);box.__loop=null;return;}f++;setWalk(box,f%4+1);box.dataset.pose="walk";},125);}

/* ---------- TIME ---------- */
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAYL=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DEMO=(()=>{try{const u=new URLSearchParams(location.search);const at=u.get("at")?new Date(u.get("at")):null;return {at:at&&!isNaN(at)?at:null,where:""};}catch(e){return {at:null,where:""};}})(); // no demo mode; ?at= only moves the clock for tests
function nowParts(){const d=DEMO.at?new Date(DEMO.at):new Date();return {day:d.getDay(),minutes:d.getHours()*60+d.getMinutes(),date:d};}
function selectedTime(){
  const n=nowParts();const off=state.dayOff||0;const date=new Date(n.date);date.setDate(date.getDate()+off);
  const day=date.getDay();const minutes=state.minute===null?(off===0?n.minutes:12*60):state.minute;
  const iso=date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");
  return {day,minutes,dateISO:iso,isNow:off===0&&state.minute===null,label:(off===0?"Today":DAYS[day]+" "+date.getDate())+" · "+(state.minute===null&&off===0?"now":fmt(minutes))};
}
function hm(s){const [h,m]=s.split(":").map(Number);return h*60+m;}
function fmt(m){m=((m%1440)+1440)%1440;if(m>=1439)return "midnight";return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");} // 24-hour clock: "22:00"
const DAYK=["sun","mon","tue","wed","thu","fri","sat"];
function openWindow(p,day){if(p.when)return [hm(p.when.start),hm(p.when.end)];const h=p.hours||{};const dk=DAYK[day];const k=(dk in h)?h[dk]:day===0?h.sun:day===6?h.sat:h.wk;return k?[hm(k[0]),hm(k[1])]:null;}
/* Open or not at t. The calendar day decides (Thursday 00:30 is Thursday); a window that runs past midnight ("05:30-01:00") also covers the
   small hours of the next day. Hours not checked: open 07:00-22:00 with the warning, closed outside it. */
const UNK_OPEN=7*60,UNK_CLOSE=22*60;
function nextOpening(p,t){for(let k=0;k<7;k++){const day=(t.day+k)%7;const w=openWindow(p,day);if(!w)continue;if(k===0&&w[0]<=t.minutes)continue;return {day,k,at:w[0]};}return null;}
function isOpen(p,t){
  if(p.when&&p.when.date!==t.dateISO)return {open:false,reason:"not that day"};
  if(p.hoursUnknown){if(t.minutes>=UNK_OPEN&&t.minutes<UNK_CLOSE)return {open:true,closesIn:UNK_CLOSE-t.minutes,closes:"",unknown:true};
    return {open:false,unknown:true,reason:"hours not checked",next:{day:t.minutes<UNK_OPEN?t.day:(t.day+1)%7,k:t.minutes<UNK_OPEN?0:1,at:UNK_OPEN}};}
  if(!p.when){const y=openWindow(p,(t.day+6)%7);if(y&&y[1]<y[0]&&t.minutes<y[1])return {open:true,closesIn:y[1]-t.minutes,closes:fmt(y[1])};}
  const w=openWindow(p,t.day); if(!w)return {open:false,reason:"closed that day",next:nextOpening(p,t)};
  const end=w[1]<w[0]?w[1]+1440:w[1];
  if(t.minutes<w[0])return {open:false,reason:"opens "+fmt(w[0]),next:{day:t.day,k:0,at:w[0]}};
  if(t.minutes>=end)return {open:false,reason:"closed at "+fmt(w[1]),next:nextOpening(p,t)};
  const allDay=w[0]===0&&end>=1439;
  return {open:true,closesIn:end-t.minutes,closes:fmt(w[1]),allDay};
}
/* The hours line on every card: "Open now · closes 22:00", "Closes in 25 min", "Closed · opens 11:00", "Hours not checked". */
function hoursLabel(o,t){
  if(o.unknown)return o.open?"Hours not checked":"Closed · hours not checked";
  if(o.open){if(o.allDay)return (t.isNow?"Open now":"Open at "+fmt(t.minutes))+" · open 24h";if(o.closesIn<=45)return "Closes in "+o.closesIn+" min";return (t.isNow?"Open now":"Open at "+fmt(t.minutes))+" · closes "+o.closes;}
  if(o.next)return "Closed · opens "+(o.next.k===0?"":o.next.k===1?"tomorrow ":DAYS[o.next.day]+" ")+fmt(o.next.at);
  return "Closed"+(o.reason&&o.reason!=="closed that day"?" · "+o.reason:"");}
function openLabel(o){return o.unknown?"hours not checked":o.allDay?"open 24h":"closes "+o.closes;}

/* ---------- HELPERS ---------- */
const NS="http://www.w3.org/2000/svg";
function el(tag,attrs,text){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(text!=null)e.textContent=text;return e;}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function money(v){return v===0?"FREE":"£"+v.toFixed(2);}
function rectLL(a,b,fill){const [x1,y1]=P(a[0],a[1]),[x2,y2]=P(b[0],b[1]);return el("rect",{x:Math.min(x1,x2),y:Math.min(y1,y2),width:Math.abs(x2-x1),height:Math.abs(y2-y1),rx:6,fill});}
const AR='<svg class="arr" viewBox="0 0 64 24" aria-hidden="true"><path d="M3 13 C 18 10, 36 14, 56 11.5 M46 4 C 50 7, 54 9.5, 59 11.5 C 54 13.5, 50 16.5, 47 20"/></svg>';
const AL='<svg class="arr" viewBox="0 0 64 24" aria-hidden="true"><path d="M61 11 C 46 14, 28 10, 8 12.5 M18 4 C 14 7, 10 9.5, 5 12.5 C 10 14.5, 14 17.5, 17 20"/></svg>';
const PIN='<svg class="ico-inline" viewBox="0 0 22 22" aria-hidden="true"><path d="M11 20 C 7 14, 4 11, 4 8 a7 7 0 0 1 14 0 c0 3 -3 6 -7 12 z"/><circle cx="11" cy="8" r="2.4"/></svg>';
const MIC='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>';
const GO='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const X='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const CAM='<svg class="ico-inline" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
const DL='<svg class="ico-inline" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>';
const CHEV='<svg class="ico-inline chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const PAW='<svg class="ico-inline" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6.5" cy="9.5" r="1.7"/><circle cx="10.5" cy="6" r="1.7"/><circle cx="15.5" cy="6.5" r="1.7"/><circle cx="19" cy="10.5" r="1.7"/><path d="M7.5 17.5c0-3.2 2.4-5.5 5.3-5.5s5.2 2.3 5.2 5.5c0 1.8-1.3 2.8-2.7 2.8-1 0-1.6-.5-2.5-.5s-1.5.5-2.5.5c-1.4 0-2.8-1-2.8-2.8z"/></svg>';
const TICK='<svg class="ico-inline tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
const SRCH='<svg class="ico-inline" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>';
const navNext=(id,word,dis)=>'<button type="button" class="arrbtn big" id="'+id+'"'+(dis?' disabled':'')+'><span class="ms" data-ms="'+word+'" style="--ms:11px"></span>'+AR+'</button>';
const navBack=(id,word)=>'<button type="button" class="arrbtn back" id="'+id+'">'+AL+'<span class="ms" data-ms="'+word+'" style="--ms:11px"></span></button>';
const title=(t,size)=>'<h2 class="ms" data-ms="'+esc(t)+'" style="--ms:'+(size||32)+'px"></h2>';
const rat=(k,h,cls)=>{const [W,H]=ARTW[k];const sc=Math.min(h/H,(h*1.4)/W);return svgOf(k,Math.round(W*sc),Math.round(H*sc),cls);};
const REAL_MAP=!(window.claude&&window.claude.use)&&!!window.maplibregl;
const IN_CLAUDE=!!(window.claude&&window.claude.use);
function gmaps(p){
  const byAddr=p.status==="event"||p.status==="added";
  const q=(byAddr?"":(p.name||"")+", ")+(p.addr||"")+", London";
  return "https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(q)+"&travelmode=walking";}
function firstName(){return (state.name||"").trim().split(/\s+/)[0]||"";}
function cardsSummary(){const c=[...state.cards].map(cardName);return c.length?c.join(", "):"No cards yet";}
function dietSummary(){const d=[...state.diet].map(id=>(DIETS.find(x=>x.id===id)||{}).name).filter(Boolean);return (d.length?d.join(", "):"I eat everything")+(state.note?" · "+state.note:"");}

/* ---------- VIEWS ---------- */
const view=document.getElementById("view");
let ratPos=null;
function dots(){
  const d=document.getElementById("dots");d.hidden=true;
  const n=STEPS.length-S.where;const cur=state.step-S.where;
  d.innerHTML=Array.from({length:n},(_,i)=>'<i class="'+(i<cur?"done":i===cur?"on":"")+'"></i>').join("")+'<img class="rat" id="rat" src="'+ART.front+'" alt="" width="'+ARTW.front[0]+'" height="'+ARTW.front[1]+'">';
  if(d.hidden){ratPos=null;return;}
  const img=d.querySelector("#rat");const from=ratPos===null?cur:ratPos;const dir=cur>=from?1:-1;
  img.style.left=(from*14)+"px";img.style.setProperty("--dir",dir);
  if(ratPos!==null&&ratPos!==cur){
    if(REDUCED){img.style.left=(cur*14)+"px";}
    else{void img.offsetWidth;img.style.left=(cur*14)+"px";let f=0;img.src=ART.walk1;
      const iv=setInterval(()=>{f++;if(f>=7){clearInterval(iv);img.src=ART.front;img.style.setProperty("--dir",1);img.classList.add("hop");return;}img.src=ART["walk"+(f%4+1)];},90);}
  }
  ratPos=cur;
}
function go(n){state.step=n;render();window.scrollTo({top:0,behavior:"smooth"});}
function render(){if(SAY.rec&&state.step!==S.results)stopSay();dots();const f=[vHello,vWhere,vResults][state.step];view.innerHTML="";view.appendChild(f());if(state.step===S.results){paintWalkBack();paintSnapTip();maybeTour();}msRender(view);paintInstall();stageEnter();if(state.step===S.results){loadShared();trackResults(filterKey()+"|"+(state.drinks?"d":""));}if(DBG_ON)paintDebug();}
/* ?debug=1 only: what the search understood. Nothing changes without it. */
function paintDebug(){let el=document.getElementById("dbg");if(!el){el=document.createElement("div");el.id="dbg";el.setAttribute("style","position:fixed;left:6px;bottom:6px;z-index:9999;max-width:70vw;background:rgba(0,0,0,.78);color:#fff;font:11px/1.35 ui-monospace,monospace;padding:6px 8px;border-radius:6px;pointer-events:none");document.body.appendChild(el);}
  if(state.q&&state.step===S.results)rank();
  el.textContent="q: "+(state.q?JSON.stringify(state.q):"(none)")+" · drinkWord: "+(drinkWord(state.q)||"(none)")+" · hot drink: "+(RANK_DBG.hot||"(none)")+" · offers in walk: "+(state.q?RANK_DBG.before+" → "+RANK_DBG.after:"(no search)")+" · drinks: "+(state.drinks?"on":"off")+" · cats: "+[...state.cats].join(",");}
function startAgain(soft){ // the logo: like opening the app again. The search goes back to the defaults; name, uni, cards and diet stay; the URL (demo mode) stays.
  document.getElementById("sheetHost").innerHTML="";
  state.q="";state.cats=new Set();state.drinks=false;state.budget=5;state.mins=30;state.minute=null;state.dayOff=0;UI.spec=false;UI.later=false;UI.bOther=false;UI.mOther=false;UI.view="list";UI.lastFkey="";
  persist();
  let reloaded=false;try{if(!soft&&location.protocol!=="file:"&&!IN_CLAUDE&&typeof location.reload==="function"){location.reload();reloaded=true;}}catch(e){}
  if(!reloaded){state.step=state.setupDone?(state.where?S.results:S.where):S.hello;state.intro=0;render();window.scrollTo(0,0);}
}
const SOFT_RESET=/jsdom/i.test(navigator.userAgent||""); // the test runner cannot reload
document.getElementById("home").onclick=()=>startAgain(SOFT_RESET);
document.getElementById("menuBtn").onclick=()=>openMenu();
document.getElementById("teachBtn").onclick=()=>openTeach();
setTimeout(()=>{readyNudge();readPendingInBackground();},1200);
/* places kept by their place_id only (a menu sent for a Google place with no other name): the name, live, when there is a connection */
function liveNames(list){for(const p of list||[])if(p&&p.nameLive&&p.placeId&&!LIVE_NAMES[p.placeId])gpLive(p.placeId).then(x=>{if(x&&x.name){p.name=x.name;if(state.step===S.results)render();}});}
setTimeout(()=>liveNames(state.added),1500);

/* First run: a conversation with your rat, on one screen */
/* First run: one bubble, the rat talks line by line (typed), tiny ‹ › to re-read or skip */
const TALK={f_neutral:"f_oh",f_oh:"f_neutral",f_smug:"f_laugh",f_laugh:"f_smug",f_sniff:"f_laugh",f_tongue:"f_laugh",f_wink:"f_hearts",f_hearts:"f_wink",f_sad:"f_oh",f_excited:"f_laugh"};
// the six on the welcome: firstCardsFor() (the uni's own food app in the third slot, TOTUM when it has none); the rest behind "More…"
function introSteps(){
  const nm=firstName();const hh=nowParts().minutes/60;const night=hh>=23||hh<7;
  return [
    {text:"Hi, I’m Fiver. Yes, like the note. No, you can’t spend me.",face:"f_laugh"},
    night?{text:"It’s late. I’m up anyway.",face:"f_sleep"}:{text:"I’ve lived under "+areaName()+" longer than you’ve been alive. I know where every cheap lunch is.",face:"f_smug"},
    {text:"What should I call you?",face:"f_neutral",input:"name"},
    {text:(nm?"Nice to meet you, "+nm+". ":"")+"Where do you study?",face:nm?"f_excited":"f_neutral",input:"uni"},
    {text:uniReply(state.uni)+" Anything you don’t eat? Allergies too. I’ll hide what won’t work.",face:"f_sniff",input:"diet"},
    {text:"Which student cards are hiding in your phone? They stay on this phone.",face:"f_neutral",input:"cards"},
    {text:"Sorted"+(nm?", "+nm:"")+". Made for London students. Run by a rat with standards.",face:"f_wink",input:"go"}
  ];
}
let talkTimer=null,autoTimer=null;
function stopTalk(){if(talkTimer){clearInterval(talkTimer);talkTimer=null;}if(autoTimer){clearTimeout(autoTimer);autoTimer=null;}}
function vHello(){
  stopTalk();
  const d=document.createElement("div");d.className="step convo";
  const steps=introSteps();const i=Math.max(0,Math.min(state.intro||0,steps.length-1));state.intro=i;const st=steps[i];
  let inputH="";
  if(st.input==="name")inputH='<div class="turn me new"><div class="wishrow"><input class="line" id="nameIn" placeholder="Your first name" maxlength="24" autocomplete="given-name" value="'+esc(state.name)+'"><button type="button" class="iconbtn" id="nameGo" aria-label="That’s me">'+GO+'</button></div><p class="note"><button type="button" class="linkbtn" id="nameSkip">Skip</button></p></div>';
  else if(st.input==="uni")inputH='<div class="turn me new">'+uniChips("uniChips",state.uni)+'<p class="note">Fiver prices your own canteens and the shops round your campus.</p><div class="chips"><button type="button" class="chip on" id="uniGo">That’s me</button><button type="button" class="linkbtn" id="uniSkip">Skip</button></div></div>';
  else if(st.input==="cards"){const chip=c=>'<label class="chip'+(state.cards.has(c.id)?" on":"")+'"><input type="checkbox" value="'+c.id+'"'+(state.cards.has(c.id)?" checked":"")+'>'+esc(c.name)+'</label>';
    const FIRST=firstCardsFor(),ALL=cardsFor();const first=FIRST.map(id=>ALL.find(c=>c.id===id)).filter(Boolean),more=ALL.filter(c=>!FIRST.includes(c.id));
    inputH='<div class="turn me new"><div class="chips" id="cardChips">'+first.map(chip).join("")+'<button type="button" class="chip" id="moreCards">More…</button></div><div class="chips" id="moreChips" hidden>'+more.map(chip).join("")+'</div><p class="note">UNiDAYS and Student Beans are free with your uni email. The apps are free too.</p><div class="chips"><button type="button" class="chip on" id="cardsGo">That’s all of them</button><button type="button" class="linkbtn" id="cardsSkip">Skip</button></div></div>';}
  else if(st.input==="diet")inputH='<div class="turn me new"><div class="chips" id="dietChips">'+DIETS.map(c=>'<label class="chip'+(state.diet.has(c.id)?" on":"")+'"><input type="checkbox" value="'+c.id+'"'+(state.diet.has(c.id)?" checked":"")+'>'+esc(c.name)+'</label>').join("")+'</div><textarea class="line" id="noteIn" rows="2" placeholder="Other allergies or notes (optional)" style="font-family:var(--body);font-style:normal;font-size:15px;resize:none">'+esc(state.note)+'</textarea><div class="chips"><button type="button" class="chip on" id="dietGo">Done</button><button type="button" class="chip" id="dietNone">I eat everything</button></div><p class="note">Allergens change, so always ask.</p></div>';
  else if(st.input==="go")inputH='<div class="turn me"><div class="installBox"></div></div><div class="cta">'+rat("s_follow",120)+navNext("next","Follow me")+'</div>';
  d.innerHTML='<div class="talk"><div class="bubble"><p data-line="'+esc(st.text)+'"></p></div><div class="talk-row"><div class="face" id="face">'+rat(st.face,84)+'</div>'+
    '<div class="talk-nav"><button type="button" id="prevLine" aria-label="Back one line"'+(i===0?' disabled':'')+'>‹</button><span class="meta">'+(i+1)+'/'+steps.length+'</span><button type="button" id="nextLine" aria-label="Next line"'+(i===steps.length-1?' disabled':'')+'>›</button></div></div></div>'+inputH;
  const q=sel=>d.querySelector(sel);
  const goTo=n=>{stopTalk();state.intro=Math.max(0,Math.min(n,steps.length-1));render();};
  q("#prevLine").onclick=()=>goTo(i-1);q("#nextLine").onclick=()=>goTo(i+1);
  // the rat talks: the mouth moves while the line is typed, then settles
  const p=q(".bubble p"),face=q("#face");
  const done=()=>{stopTalk();face.innerHTML=rat(st.face,84);if(!st.input&&!REDUCED)autoTimer=setTimeout(()=>goTo(i+1),1900);};
  if(REDUCED){p.innerHTML=esc(st.text);}
  else{let k=0;talkTimer=setInterval(()=>{k++;face.innerHTML=rat(k%2?(TALK[st.face]||st.face):st.face,84);},170);
    const plain=st.text;p.innerHTML='<span class="cur"></span>';let n=0;
    const tick=()=>{if(!p.isConnected){stopTalk();return;}n++;if(n>plain.length){p.innerHTML=esc(plain);done();return;}p.innerHTML=esc(plain.slice(0,n))+'<span class="cur"></span>';setTimeout(tick,plain[n-1]===" "?16:24+Math.random()*16);};
    setTimeout(tick,220);}
  if(q("#nameIn")){const n=q("#nameIn");const goN=()=>{state.name=n.value.trim();persist();goTo(i+1);};q("#nameGo").onclick=goN;n.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();goN();}};q("#nameSkip").onclick=()=>goTo(i+1);}
  if(q("#uniChips")){q("#uniChips").addEventListener("click",e=>{const b=e.target.closest("button[data-uni]");if(!b)return;const id=b.dataset.uni;
      if(id==="other"){state.uni="other";persist();stopTalk();state.setupDone=true;UI.pickOther=true;go(S.where);return;}
      state.uni=id;q("#uniChips").querySelectorAll(".chip").forEach(c=>c.classList.toggle("on",c.dataset.uni===id));const m=uniMain(id);if(id!=="ucl"&&m&&!state.where){state.where={lat:m.lat,lon:m.lon,label:m.name};}if(id==="ucl"&&state.where&&UNIS.some(u=>u.id!=="ucl"&&u.campuses.some(c=>c.name===state.where.label)))state.where=null;persist();});
    q("#uniGo").onclick=()=>{persist();goTo(i+1);};q("#uniSkip").onclick=()=>goTo(i+1);}
  if(q("#cardChips")){const onCard=e=>{const c=e.target;if(c.type!=="checkbox")return;if(c.checked)state.cards.add(c.value);else state.cards.delete(c.value);c.closest(".chip").classList.toggle("on",c.checked);persist();if(c.checked){stopTalk();face.innerHTML=rat("f_tongue",84);}};
    q("#cardChips").addEventListener("change",onCard);q("#moreChips").addEventListener("change",onCard);
    q("#moreCards").onclick=()=>{q("#moreChips").hidden=false;q("#moreCards").hidden=true;};
    q("#cardsGo").onclick=()=>{persist();goTo(i+1);};q("#cardsSkip").onclick=()=>goTo(i+1);}
  if(q("#dietChips")){q("#dietChips").addEventListener("change",e=>{const c=e.target;if(c.type!=="checkbox")return;if(c.checked)state.diet.add(c.value);else state.diet.delete(c.value);c.closest(".chip").classList.toggle("on",c.checked);persist();});
    q("#dietGo").onclick=()=>{state.note=q("#noteIn").value.trim();persist();goTo(i+1);};
    q("#dietNone").onclick=()=>{state.diet.clear();state.note=q("#noteIn").value.trim();persist();goTo(i+1);};}
  if(q("#next"))q("#next").onclick=()=>{stopTalk();state.setupDone=true;persist();go(S.where);};
  return d;
}

/* ---------- THE STAGE: the rat presents, one question at a time ---------- */
let lastScene=null;
function typeInto(el,html){ // typewriter for the bubble; instant with reduced motion
  const plain=html.replace(/<[^>]+>/g,"");
  if(REDUCED||plain.length>190){el.innerHTML=html;return;}
  el.innerHTML='<span class="cur"></span>';let i=0;const cur=el.querySelector(".cur");
  const tick=()=>{i++;if(i>plain.length){el.innerHTML=html;return;}el.innerHTML=esc(plain.slice(0,i)).replace(/\n/g,"<br>")+'<span class="cur"></span>';setTimeout(tick,plain[i-1]===" "?14:22+Math.random()*18);};
  setTimeout(tick,180);
}
function stageEnter(){ // called after every render: walk the rat in when the scene changed, then idle; type the line; speak it
  const st=view.querySelector(".stage");if(!st){lastScene=null;return;}
  const key=st.dataset.scene;const ratBox=st.querySelector(".stage-rat");const b=st.querySelector(".bubble p");
  if(ratBox){ratBox.classList.remove("walk","idle","hop");
    if(key!==lastScene&&!REDUCED){const pose=ratBox.dataset.pose;let f=0;setWalk(ratBox,1);ratBox.dataset.pose=pose;ratBox.classList.add("walk");
      const iv=setInterval(()=>{f++;if(!ratBox.isConnected){clearInterval(iv);return;}if(f>=10){clearInterval(iv);if(pose==="walk"){walkLoop(ratBox);return;}setRat(ratBox,pose);ratBox.classList.remove("walk");ratBox.classList.add("hop");setTimeout(()=>{ratBox.classList.remove("hop");ratBox.classList.add("idle");},520);return;}setWalk(ratBox,f%4+1);ratBox.dataset.pose=pose;},100);}
    else if(ratBox.dataset.pose==="walk"&&!REDUCED)walkLoop(ratBox);
    else ratBox.classList.add("idle");}
  if(b&&b.dataset.line){if(key!==lastScene)typeInto(b,b.dataset.line);else b.innerHTML=b.dataset.line;}
  lastScene=key;
}
function saidRow(upTo){ // where you are, small, tappable
  if(upTo>S.where&&upTo!==S.results&&state.where)return '<div class="said-row"><button type="button" class="said" data-go="'+S.where+'">'+PIN+' '+esc(state.where.label)+' · change</button></div>';
  return '<div class="said-row"></div>';
}
function stage(scene,pose,line,body,actions,upTo){
  const d=document.createElement("div");d.className="step stage";d.dataset.scene=scene;
  const pk=pose==="walk"?"walk1":pose;const [rw,rh]=ratSize(pk);
  d.innerHTML='<div class="stage-top"><div class="bubble"><p data-line="'+esc(line)+'"></p></div><div class="stage-rat" data-pose="'+pose+'">'+svgOf(pk,rw,rh)+'</div><div class="stage-side">'+saidRow(upTo)+'</div></div>'+
    '<div class="scene">'+body+'<div class="act">'+actions+'</div></div><p class="note stage-foot">'+footText()+'</p>';
  d.querySelectorAll(".said-row .said").forEach(b=>b.onclick=()=>go(Number(b.dataset.go)));
  return d;
}

function whereCandidates(){
  const camps=[];for(const u of UNIS)for(const c of u.campuses)camps.push({name:c.name,addr:c.addr||"",lat:c.lat,lon:c.lon,uniBranch:u.id+":"+c.id,uni:u.id});
  const bars=(typeof DRINKS!=="undefined"?DRINKS.venues.map(venuePlace).filter(Boolean):[]);
  return PLACES.concat(uniPlaces(),bars,camps,VENUES);}
function vWhere(){
  const nm=firstName();
  const campus=[["main","Main campus","quad"],["cw","Canary Wharf campus","cw"],["east","East campus","marshgate"]];
  const uni=UNIS.find(u=>u.id===state.uni);
  const facLine=c=>{const f=c.facs||[];if(!f.length)return "";return '<small>'+esc(f.slice(0,2).join(" · "))+(f.length>2?' · +'+(f.length-2)+' more':'')+'</small>';};
  const campRow=c=>'<button type="button" class="camp'+(state.where&&state.where.label===c.name?" on":"")+'" data-camp="'+esc(c.id)+'"><span>'+esc(c.name.replace(/ \(.*$/,"").replace(/ Campus$/,""))+'</span>'+facLine(c)+'</button>';
  const SHOW=uni&&uni.id==="ual"?6:5;const chipsH=uni?uni.campuses.slice(0,SHOW).map(campRow).join("")+(uni.campuses.length>SHOW?'<button type="button" class="chip" id="moreCamps">'+(uni.campuses.length-SHOW)+' more</button><div id="moreCampsBox" hidden>'+uni.campuses.slice(SHOW).map(campRow).join("")+'</div>':'')+'<button type="button" class="chip" id="campSearch">Search an address</button>'
    :campus.map(([id,label,vid])=>{const v=VENUES.find(x=>x.id===vid);const on=!!(state.where&&v&&VENUES.some(x=>x.name===state.where.label&&x.g===v.g));return '<button type="button" class="chip'+(on?" on":"")+'" data-id="'+vid+'">'+label+'</button>';}).join("");
  const body='<div class="reveal"><div class="'+(uni?"camps":"chips scroll")+'" id="campusChips">'+chipsH+'</div>'+
    '<div class="combo" id="combo"><div class="wishrow"><span class="iconbtn" aria-hidden="true">'+SRCH+'</span><input class="line" id="venueIn" placeholder="Search a building, a station or any address" autocomplete="off" style="font-family:var(--body);font-style:normal;font-size:16px"><button type="button" class="iconbtn" id="venueClear" aria-label="Close" hidden>'+X+'</button></div><div class="list" id="venueList" hidden></div></div>'+
    '<p class="meta" id="geoNote"></p><div class="mapbox" id="mapbox1"></div>'+(state.where?'<p class="meta">'+PIN+' '+esc(state.where.label)+' · tap the map to move</p>':'<p class="meta">Tap the map to drop yourself anywhere.</p>')+'</div>';
  const mw=moment("where","where",{name:nm?", "+nm:""});
  const d=stage("where",mw.pose,mw.line,body,
    navNext("geo","Use my location")+(state.where?navNext("next","Next"):''),S.where);
  const inp=d.querySelector("#venueIn"),list=d.querySelector("#venueList"),clr=d.querySelector("#venueClear");
  const GRP={ucl:"Main campus",east:"East campus (Stratford)",cw:"Canary Wharf",tube:"Stations"};
  // under 3 letters: the buildings and stations, grouped. From 3 letters (300 ms pause): Fiver's own places first (words and synonyms),
  // then Google Places autocomplete biased to London (Photon if Google fails). Postcodes and addresses come back too. Enter takes the first row.
  const showVenues=()=>{const q=inp.value.trim().toLowerCase();const hits=VENUES.filter(v=>!q||v.name.toLowerCase().includes(q)||(v.addr||"").toLowerCase().includes(q));
    if(!hits.length){list.innerHTML='<div class="grp">Keep typing: a café, a building, an address or a postcode.</div>';WR=[];return;}
    let h="",g="";for(const v of hits){if(v.g!==g){g=v.g;h+='<div class="grp">'+(GRP[g]||g)+'</div>';}h+='<button type="button" data-id="'+v.id+'" class="'+(state.where&&state.where.label===v.name?"on":"")+'">'+esc(v.name)+(v.addr?'<span class="meta">'+esc(v.addr)+'</span>':'')+'</button>';}
    list.innerHTML=h;WR=[];};
  let WR=[],wseq=0,wtimer=null;
  const shortAddr=a=>String(a||"").replace(/,?\s*(London|UK|United Kingdom)\b.*$/i,"").trim();
  const paintW=(rows,msg)=>{WR=rows;list.innerHTML=rows.length?rows.map((r,i)=>'<button type="button" data-w="'+i+'">'+esc(r.name)+(r.sub?'<span class="meta">'+esc(shortAddr(r.sub))+'</span>':'')+'</button>').join("")+(rows.some(r=>r.src==="google")?'<div class="grp gpow">powered by Google</div>':''):'<div class="grp">'+(msg||"")+'</div>';};
  const EMPTY="Nothing called that in London. Try the postcode or tap the map.";
  const searchW=()=>{const raw=inp.value.trim();if(raw.length<3){showVenues();return;}const mine=++wseq;
    const hits=placeSearch(raw,whereCandidates(),{bias:state.where||UCL_LL,uni:state.uni,limit:8});
    const rest=srchParse(raw).rest;const strongOf=h=>{const nm=new Set(srchNorm(h.p.name));return rest.length?rest.every(w=>nm.has(w)):h.score>0;};
    const toRow=h=>({name:h.p.name,sub:h.p.addr||"",lat:h.p.lat,lon:h.p.lon,src:"local",kind:/library/i.test(h.p.name)?"library":undefined});
    const allIn=h=>rest.every(w=>h.d.words.has(w)); // a weaker match still has every word somewhere (name, address, campus)
    const strong=hits.filter(strongOf).slice(0,4).map(toRow),weak=hits.filter(h=>!strongOf(h)&&allIn(h)).map(toRow);
    paintW(strong.concat(weak).slice(0,6),"Looking…");
    const done=ext=>{if(mine!==wseq)return;const seen=strong.slice();const rows=strong.concat(ext.filter(r=>!seen.some(l=>nameMatch(l.name,r.name)&&nameKey(l.name).length&&(r.lat==null||metres(l,r)<150))),weak.slice(0,ext.length?2:6)).slice(0,6);paintW(rows,EMPTY);};
    gpAutocomplete(raw,{lat:51.5074,lon:-0.1278,radius:25000}).then(done)
      .catch(()=>photon(raw,state.where||UCL_LL).then(done).catch(()=>done([])));};
  const open=()=>{if(inp.value.trim().length>=3)searchW();else showVenues();list.hidden=false;clr.hidden=false;};const close=()=>{list.hidden=true;clr.hidden=!inp.value;};
  inp.onfocus=open;inp.oninput=()=>{list.hidden=false;clr.hidden=false;clearTimeout(wtimer);if(inp.value.trim().length<3){showVenues();return;}wtimer=setTimeout(searchW,300);};
  inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();clearTimeout(wtimer);const b=list.querySelector("button[data-w],button[data-id]");if(b)b.click();else if(inp.value.trim().length>=3){searchW();}}if(e.key==="Escape"){close();inp.blur();}};
  inp.onblur=()=>setTimeout(close,180);
  clr.onclick=()=>{inp.value="";close();clr.hidden=true;note.textContent="";};
  list.addEventListener("mousedown",e=>e.preventDefault());
  const pickVenue=id=>{const v=VENUES.find(x=>x.id===id);if(!v)return;state.where={lat:v.lat,lon:v.lon,label:v.name};if(/library/i.test(v.name))state.where.kind="library";persist();go(S.results);};
  const pickRow=(r,b)=>{
    if(r.lat==null&&r.src==="google"){if(b)b.innerHTML='<b>'+esc(r.name)+'</b><span class="meta">one sec…</span>';
      gpDetails(r.placeId).then(dt=>{state.where={lat:dt.lat,lon:dt.lon,label:r.name,g:true,placeId:r.placeId,typed:inp.value.trim().slice(0,40),t:Date.now()};persist();go(S.results);}).catch(()=>{note.textContent="Google didn’t answer. Try again, or tap the map.";});return;}
    state.where={lat:r.lat,lon:r.lon,label:r.name};if(r.kind==="library")state.where.kind="library";persist();go(S.results);};
  list.addEventListener("click",e=>{const w=e.target.closest("button[data-w]");if(w){const r=WR[Number(w.dataset.w)];if(r)pickRow(r,w);return;}const b=e.target.closest("button[data-id]");if(b)pickVenue(b.dataset.id);});
  d.querySelector("#campusChips").addEventListener("click",e=>{const b=e.target.closest("button[data-id]");if(b){pickVenue(b.dataset.id);return;}
    const c=e.target.closest("button[data-camp]");if(c&&uni){const cp=uni.campuses.find(x=>x.id===c.dataset.camp);if(cp){state.where={lat:cp.lat,lon:cp.lon,label:cp.name};persist();go(S.results);}return;}
    if(e.target.closest("#campSearch")){inp.focus();}
    if(e.target.closest("#moreCamps")){const box=d.querySelector("#moreCampsBox");box.hidden=false;e.target.closest("#moreCamps").remove();}});
  if(UI.pickOther){UI.pickOther=false;setTimeout(()=>inp.focus(),300);}
  const note=d.querySelector("#geoNote");
  setTimeout(()=>{const m=view.querySelector("#mapbox1");if(m)mountMap(m,{tap:()=>go(S.results)});},0);
  d.querySelector("#geo").onclick=()=>{
    note.textContent="Asking your phone…";let done=false;const fail=msg=>{if(done)return;done=true;note.textContent=msg;};
    try{if(!navigator.geolocation){fail("No location on this device.");return;}
      const timer=setTimeout(()=>fail("Location is blocked here. Search a building or tap the map."),6000);
      navigator.geolocation.getCurrentPosition(pos=>{clearTimeout(timer);if(done)return;done=true;state.where={lat:pos.coords.latitude,lon:pos.coords.longitude,label:"your location"};go(S.results);},
        ()=>{clearTimeout(timer);fail("Location is blocked here. Search a building or tap the map.");},{enableHighAccuracy:true,timeout:5000,maximumAge:60000});
    }catch(e){fail("Location is blocked here. Search a building or tap the map.");}
  };
  const n=d.querySelector("#next");if(n)n.onclick=()=>go(S.results);
  return d;
}

let lastRank=null;
function breakdown(row){return row.walk+" min walk · back in "+(row.walk*2+row.eat)+" min";}
/* The card's status, for the time the student picked (not necessarily now) */
function statusLine(row,t){
  const o=row.o,p=row.p;const soft=p.hoursUnknown||p.status==="approx"||p.status==="added";
  let s;
  if(p.when){ // an event: it's on, or it isn't
    if(o.open)return (o.closesIn<=row.walk?"Ends before you get there":(t.isNow?"On now":"On at "+fmt(t.minutes))+" · until "+o.closes);
    return o.reason==="not that day"?"Not that day":o.reason.replace(/^opens/,"Starts").replace(/^closed at/,"Ended at");}
  if(o.open&&!o.unknown&&o.closesIn<=row.walk)s="Closes before you get there";
  else s=hoursLabel(o,t);
  if(soft&&!o.unknown)s+=" · hours not confirmed";
  return s;
}
/* Why this price: the card, the closing-time window or the event */
function whyPrice(row,t){
  const base=row.pr.price+(row.saved||0);
  if(row.pr.time)return "closing-time price · usually "+money(base);
  if(row.saved>0&&row.pr.label)return row.pr.label.replace(/^with /,"with your ").split(" (")[0]+" · usually "+money(base);
  return "";
}
/* Diet, from the tags only. Never "safe". */
function dietLine(o){
  if(!state.diet.size)return "";const tags=o.tags||[];const out=[];
  for(const id of state.diet){const d=DIETS.find(x=>x.id===id);if(!d)continue;
    if(d.no.some(x=>tags.includes(x)))out.push("Not "+d.name.toLowerCase());
    else if(d.ok.some(x=>tags.includes(x)))out.push("Likely "+d.name.toLowerCase());
    else out.push(d.name+" not checked");}
  return out.join(" · ")+" · ask staff";
}
const UNCHECKED=new Set(["est","guide-hint","avg","fan"]);
function pickCard(x,t,o){o=o||{};
  return '<div class="hero pick'+(o.compact?" compact":"")+'" data-id="'+esc(x.p.id)+'"><div class="k">'+(o.label||"Fiver’s pick")+(state.q&&!o.compact?' · “'+esc(state.q)+'”':'')+'</div>'+
    '<span class="ms wine" data-ms="'+money(x.pr.price)+'" style="--ms:'+(o.compact?30:40)+'px"></span>'+
    (x.of.about?'<p class="why">about '+money(x.pr.price)+' · '+esc(x.of.aboutWhy||"Price from Deliveroo, usually less in store")+'</p>':'')+(x.of.lb?'<p class="why">from '+money(x.pr.price)+' · prices vary by stall</p>':'')+(whyPrice(x,t)?'<p class="why">'+esc(whyPrice(x,t))+'</p>':'')+
    '<span class="ms" data-ms="'+esc(x.p.name)+'" style="--ms:16px"></span>'+
    '<p class="lead">'+esc(x.of.item)+'</p>'+
    '<p class="meta"><b>'+esc(statusLine(x,t))+'</b></p>'+
    '<p class="meta">'+breakdown(x)+(x.of.in?' · '+money(x.of.in)+' if you sit in':'')+'</p>'+
    (dietLine(x.of)?'<p class="diet">'+esc(dietLine(x.of))+'</p>':'')+
    (x.of.checkGo?'<p class="meta">Check before you go.</p>':x.of.check?'<p class="meta">Check at the till.</p>':'')+
    (UNCHECKED.has(x.of.status)?'<button type="button" class="linkbtn teach" data-teach="'+esc(x.p.id)+'">Price not checked. Snap the menu →</button>':'')+
    (o.compact?'<div class="actions"><a class="arrbtn big" data-walk="'+esc(x.p.id)+'" href="'+gmaps(x.p)+'" target="_blank" rel="noopener"><span class="ms" data-ms="Walk there" style="--ms:11px"></span>'+AR+'</a><button type="button" class="chip" data-open="'+esc(x.p.id)+'">Details</button>'+whyBtn(x)+'</div><div class="whyOut" hidden></div>':
      '<div class="actions"><a class="chip" data-walk="'+esc(x.p.id)+'" href="'+gmaps(x.p)+'" target="_blank" rel="noopener">'+PIN+' Walk there</a><button type="button" class="chip" id="open0">Details</button>'+whyBtn(x)+'<button type="button" class="chip" id="ask" hidden>Ask Claude</button></div><div class="whyOut" hidden></div><p class="meta" id="askHint"></p><div class="ai" id="aiOut" hidden></div>')+'</div>';
}
/* "Why this one?": 2 or 3 lines from the data, on the phone, no Claude needed. The reason, then the card or the next one, then hours or rating. */
const WHY_ROWS=new Map();
function whyBtn(x){const k=x.p.id+"|"+x.of.item;WHY_ROWS.set(k,x);return '<button type="button" class="chip whyBtn" data-why="'+esc(k)+'" aria-expanded="false">Why this one?</button>';}
function whyLines(x){const r=lastRank||rank();const B=money(state.budget).replace(".00","");const L=[];const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
  const catN=((CATS.find(c=>c.id===x.of.cat)||{}).name||"food").toLowerCase();const away=x.walk+" min away";
  if(x.of.cat==="free"||x.pr.price===0)L.push("Free, "+away+".");
  else if(x.pr.price>state.budget+1e-9)L.push(money(x.pr.price)+", over your "+B+", "+away+".");
  else if(x.mealPick)L.push("The biggest real meal your "+B+" buys, "+away+".");
  else{const cheapest=r.fit.filter(y=>y.of.cat===x.of.cat).every(y=>y.pr.price>=x.pr.price-1e-9);L.push(cap((cheapest?"cheapest ":"")+catN+" that fits your "+B+", "+away+"."));}
  let mid="";
  if(x.pr.time)mid="Closing-time price: "+money(x.pr.price)+" instead of "+money(x.pr.price+(x.saved||0))+".";
  else if(x.saved>0&&x.pr.label)mid="With your "+x.pr.label.replace(/^with (your )?/,"").split(" (")[0]+" it’s "+money(x.pr.price)+" instead of "+money(x.pr.price+x.saved)+".";
  else{const nxt=r.fit.filter(y=>y.p.name!==x.p.name&&y.of.cat!=="free"&&y.pr.price>=x.pr.price).sort((a,b)=>a.pr.price-b.pr.price)[0];
    if(nxt&&nxt.pr.price-x.pr.price>=0.05)mid=money(nxt.pr.price-x.pr.price)+" less than the next one ("+nxt.p.name+", "+money(nxt.pr.price)+").";}
  if(mid)L.push(mid);
  const o=x.o;let end="";
  if(o&&o.open){if(o.unknown)end="Hours not checked: have a look before you go.";else if(o.allDay)end="Open 24 hours.";else if(o.closesIn<=45)end="Closes in "+o.closesIn+" min, go now.";else end="Open till "+o.closes+".";}
  if(x.p.rating&&(!end||L.length<2))L.push("Rated "+Number(x.p.rating).toFixed(1)+" on Google.");
  if(end&&L.length<3)L.push(end);
  return L.slice(0,3);}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(".whyBtn");if(!b)return;const x=WHY_ROWS.get(b.dataset.why);
  const box=b.closest(".actions,.chips");const out=box&&box.nextElementSibling&&box.nextElementSibling.classList.contains("whyOut")?box.nextElementSibling:null;if(!x||!out)return;
  const open=out.hidden;if(open)out.innerHTML=whyLines(x).map(l=>'<p>'+esc(l)+'</p>').join("");out.hidden=!open;b.setAttribute("aria-expanded",String(open));});
function viewsRow(){return '<div class="views"><button type="button" class="'+(UI.view!=="map"?"on":"")+'" data-view="list">List</button><span>·</span><button type="button" class="'+(UI.view==="map"?"on":"")+'" data-view="map">Map</button></div>';}
const PICK_RAT={free:"ticket",deal:"bag",coffee:"a_coffee",sweet:"a_icecream",snack:"a_croissant",hot:"pizza"};
function opensAt(t){let m=null;for(const p of allPlaces()){if(p.when)continue;const w=openWindow(p,t.day);if(w&&w[0]>t.minutes&&(m===null||w[0]<m))m=w[0];}return m;}
const BUDGETS=[3,5,10],TIMES=[5,10,15,30];
function whenLabel(t){if(t.isNow)return "Now";const off=state.dayOff||0;const hhmm=String(Math.floor(t.minutes/60)).padStart(2,"0")+":"+String(t.minutes%60).padStart(2,"0");return (off===0?"Today":off===1?"Tomorrow":DAYS[t.day]+" "+Number(t.dateISO.slice(8)))+" "+hhmm;}
function placeShort(){const l=(state.where||VENUES[0]).label||"";return l.split(" / ")[0].split(", ")[0];}
function fitText(r){const n=r.fit.length;return (n?n+" place"+(n>1?"s":"")+" fit":"Nothing fits yet")+" · "+money(state.budget).replace(".00","")+" · "+state.mins+" min walk"+(state.q?" · “"+state.q+"”":"");}
function moneyNote(b){return b<=2?"Coffee money.":b<5?"Under a fiver. The brief.":b===5?"A fiver, exactly.":b<=8?"A fiver and a bit.":b<=12?"Treat day.":"Big spender.";}
function walkNote(m){return m<=5?"Round the corner.":m<=10?"A short stroll.":m<=15?"A proper walk. Worth it.":m<=30?"Half an hour each way.":"That’s a hike. Pack a snack.";}
function filterKey(){return [state.budget,state.mins,[...state.cats].join(","),(state.subs||[]).map(x=>x.cat+"."+x.id).join(","),state.q,state.dayOff||0,state.minute,(state.where||{}).label,[...state.diet].join(",")].join("|");}
function laterHTML(){
  const n=nowParts();const t=selectedTime();
  // seven days from today (London date on the phone): Today · Tomorrow · then the day names; hours and offers follow the day you pick
  const days=Array.from({length:7},(_,i)=>{const dt=new Date(n.date);dt.setDate(dt.getDate()+i);return {off:i,label:i===0?"Today":i===1?"Tomorrow":DAYL[dt.getDay()]};});if((state.dayOff||0)>6)state.dayOff=6;
  const tv=state.minute===null?"":String(Math.floor(state.minute/60)).padStart(2,"0")+":"+String(state.minute%60).padStart(2,"0");
  return '<div class="chips scroll" id="dayChips">'+days.map(x=>'<button type="button" class="chip'+((state.dayOff||0)===x.off?" on":"")+'" data-off="'+x.off+'">'+x.label+'</button>').join("")+'</div>'+
    '<div class="wishrow"><button type="button" class="chip'+(state.minute===null?" on":"")+'" id="nowBtn">Now</button><input type="time" class="line tline" id="timeIn" value="'+tv+'" aria-label="Time"><span class="lead" id="whenLead">'+(t.isNow?"Right now.":"Going at "+fmt(t.minutes)+(state.dayOff?" "+(state.dayOff===1?"tomorrow":"on "+days[state.dayOff].label):" today")+".")+'</span></div>';
}
function qLine(){return state.q?'<p class="meta qline" id="qLine">Searching '+(state.drinks?"drinks":hotType(state.q)?"hot drinks":"everything")+' for “'+esc(state.q)+'” · <button type="button" class="linkbtn" id="qClear">clear</button></p>':'';}
/* Sub-options under the category row: the last category tapped. One at a time; none = everything in that category. */
const SUBS={
  hot:[["chicken","sub_chicken","Chicken",/chicken|wings?\b|nugget|katsu|peri|poultry|tender/i],["pizza","sub_pizza","Pizza",/pizza|slice\b|margherita|marinara/i],["burger","sub_burger","Burger",/burger|whopper|big mac|cheeseburger/i],
    ["soup","sub_soup","Soup",/soup|broth|laksa|ramen/i],["jacket","sub_jacket","Jacket potato",/jacket|baked potato/i],["wrap","sub_wrap","Wrap",/wrap|burrito|quesadilla|taco|pitta|flatbread|kebab/i],
    ["noodles","sub_noodles","Rice & noodles",/noodle|rice|ramen|udon|pho\b|bowl|curry|donburi|bento|biryani|pad thai|gyoza box|katsu/i],["breakfast","sub_breakfast","Breakfast",/breakfast|porridge|bacon|sausage|egg|muffin|pancake|hash brown|full english|bagel/i]],
  coffee:[["coffee","sub_coffee","Coffee",/latte|cappuccino|flat white|americano|espresso|filter|mocha|macchiato|cortado|coffee/i,/\btea\b|chai|matcha|hot choc|chocolate|cocoa/i],["tea","sub_tea","Tea",/\btea\b|earl grey|peppermint|herbal|pg tips|rooibos/i,/chai|matcha|iced|bubble/i],
    ["hotchoc","sub_hotchoc","Hot chocolate",/hot choc|chocolate|cocoa/i],["matcha","sub_matcha","Matcha",/matcha/i],["chai","sub_chai","Chai",/chai/i],["iced","sub_iced","Iced",/iced|cold brew|frapp|frozen/i]],
  snack:[["fries","sub_fries","Fries",/fries|chips\b|wedges|hash brown/i],["fruit","sub_fruit","Fruit",/fruit|apple|banana|berr|grape|melon|pineapple|mango|orange/i],["sandwich","sub_sandwich","Sandwich",/sandwich|baguette|\bsub\b|toastie|panini|bagel|roll\b|wedge|sando/i],
    ["salad","sub_salad","Salad",/salad/i],["croissant","sub_croissant","Croissant",/croissant|pain au|pastry|danish/i]],
  sweet:[["brownie","sub_brownie","Brownie",/brownie|blondie/i],["cookie","sub_cookie","Cookie",/cookie|biscuit/i],["doughnut","sub_doughnut","Doughnut",/dough?nut|donut/i],["chocolate","sub_chocolate","Chocolate",/chocolate|choc\b|kitkat|twix|maltesers|dairy milk/i],["icecream","sub_icecream","Ice cream",/ice cream|gelato|mcflurry|sorbet|sundae|frozen yog|soft serve/i]],
  deal:[["supermarket","sub_supermarket","Supermarket deal",null],["lunchdeal","sub_lunchdeal","Lunch deal",/lunch|meal deal|main \+|combo|box|set/i],["breakfastdeal","sub_breakfastdeal","Breakfast deal",/breakfast|morning|early bird/i]],
  drinks:[["beer","sub_pint","Pint"],["cider","sub_cider","Cider"],["wine","sub_wine","Wine"],["mocktail","sub_alcfree","Alcohol-free"]]};
const SUPERMARKET_RX=/tesco|sainsbury|co-?op|boots|m&s|marks|waitrose|lidl|aldi|spar|budgens|morrisons/i;
/* Several sub-options at once, also from different categories (state.subs = [{cat,id}]). "Other" marks the box, never filters. Up to 5. */
const MAX_COMBO=5;
// things you can only say, not tap: "burger, fries and a coke"
const HIDDEN_SUBS={snack:[["softdrink",null,"Soft drink",/\b(coke|cola|pepsi|sprite|fanta|oasis|lemonade|juice|water|soft drink|irn bru|tango|7.?up|fizzy|lucozade|j2o|ribena)\b/i,/milkshake|coconut/i]]};
function subDef(s){return (SUBS[s.cat]||[]).concat(HIDDEN_SUBS[s.cat]||[]).find(x=>x[0]===s.id);}
function subsOf(c){return (state.subs||[]).filter(s=>s.cat===c);}
function subOn(c,id){return (state.subs||[]).some(s=>s.cat===c&&s.id===id);}
function subToggle(c,id){const had=subOn(c,id);
  if(!had&&id!=="other"&&(state.subs||[]).filter(s=>s.id!=="other").length>=MAX_COMBO){UI.say="Five’s my limit. I’m a small rat.";UI.sayPose="s_shrug";return false;}
  state.subs=(state.subs||[]).filter(s=>!(s.cat===c&&s.id===id));if(!had)state.subs.push({cat:c,id});return !had;}
function realSubs(){return (state.subs||[]).filter(s=>s.id!=="other"&&s.cat!=="drinks"&&state.cats.has(s.cat)&&!!subDef(s));}
function subMatch(sub,o,p){const def=subDef(sub);if(!def)return true;
  if(sub.id==="supermarket")return !!p.deal||SUPERMARKET_RX.test(p.name);
  if(sub.id==="lunchdeal"&&(p.deal||SUPERMARKET_RX.test(p.name)||/breakfast|morning|early bird/i.test(o.item)))return false;
  const t=o.item||"";return def[3].test(t)&&!(def[4]&&def[4].test(t));}
function subOk(o,p){const L=subsOf(o.cat).filter(s=>s.id!=="other");if(!L.length)return true;return L.some(s=>subMatch(s,o,p));}
function subLabel(s){const d=subDef(s);return d?d[2]:s.id==="other"?"Other":s.id;}
function subCat(){const c=UI.lastCat;if(c==="drinks")return state.drinks?"drinks":null;if(c&&state.cats.has(c)&&!state.drinks)return c;if(state.drinks)return "drinks";return [...state.cats].find(x=>SUBS[x])||null;}
// the ticked categories in the order they were ticked
function catsInOrder(){const o=(state.catOrder||[]).filter(c=>state.cats.has(c));for(const c of CATS.map(x=>x.id))if(state.cats.has(c)&&!o.includes(c))o.push(c);return o;}
function subsHTML(){if(state.q)return "";
  const tile=(c,x,on)=>'<button type="button" class="sub-tile'+(on?" on":"")+'" data-sub="'+x[0]+'" data-cat="'+c+'" aria-pressed="'+on+'">'+(SUBICO[x[1]]?'<img src="'+SUBICO[x[1]]+'" alt="">':'')+'<span>'+esc(x[2])+'</span></button>';
  const other=(c,on)=>'<button type="button" class="sub-tile other'+(on?" on":"")+'" id="subOther" data-sub="other" data-cat="'+c+'" aria-pressed="'+on+'"><span class="ms wine" data-ms="Other" style="--ms:17px"></span><span class="olbl">Other</span></button>';
  if(state.drinks){const c="drinks";return '<div class="subs" id="subChips">'+SUBS[c].map(x=>tile(c,x,state.dsub===x[0])).join("")+other(c,state.dsub==="other")+'</div>';}
  const groups=catsInOrder().filter(c=>SUBS[c]);if(!groups.length)return "";
  const multi=groups.length>1;const last=groups[groups.length-1];
  // more than one food type: every group in one sliding row, a small grey label and a thin line before each; "Other" once at the end
  return '<div class="subs'+(multi?" multi":"")+'" id="subChips">'+groups.map((c,i)=>(multi?(i?'<i class="subsep" aria-hidden="true"></i>':'')+'<span class="subgrp">'+esc((CATS.find(x=>x.id===c)||{}).name||c)+'</span>':'')+SUBS[c].map(x=>tile(c,x,subOn(c,x[0]))).join("")).join("")+other(last,groups.some(c=>subOn(c,"other")))+'</div>';}
function subName(){if(state.drinks){const id=state.dsub;if(id==="other")return "Other";const def=(SUBS.drinks||[]).find(x=>x[0]===id);return def?def[2]:"";}
  const L=(state.subs||[]).filter(s=>s.cat==="drinks"?false:state.cats.has(s.cat));return L.map(subLabel).join(" + ");}
/* Several things at once (2 to 5). Per place: the cheapest of each thing, your cards applied; a meal or meal deal when it covers several and costs less.
   Places with ALL of them first, by total; none? the ones with the most, then by total. The rest: "Or just one:". Never an empty screen. */
const DEAL_ROLE={"snack.sandwich":"main","snack.salad":"main","hot.wrap":"main","snack.fruit":"side","snack.fries":"side","sweet.chocolate":"side","sweet.cookie":"side","sweet.brownie":"side","snack.softdrink":"drink","coffee.coffee":"drink"};
function mealCover(p,of,subs){const t=of.item||"";if(of.cat!=="deal"&&!/\bmeal\b/i.test(t))return [];
  if(p.deal&&/meal deal|lunch deal|main \+ snack \+ drink/i.test(t)&&!/premium/i.test(t)){const used=new Set(),out=[];subs.forEach((s,i)=>{const r=DEAL_ROLE[s.cat+"."+s.id];if(r&&!used.has(r)){used.add(r);out.push(i);}});return used.has("main")?out:[];} // a meal deal needs a main
  const out=[];subs.forEach((s,i)=>{const d=subDef(s);if(d&&d[3]&&(d[3].test(t)||(s.id==="softdrink"&&/\bdrinks?\b/i.test(t))))out.push(i);});return out;}
function offerLive(o,t){return (!o.untilDate||t.dateISO<=o.untilDate)&&(!o.days||o.days.includes(DAYK[t.day]))&&(!o.until||t.minutes<hm(o.until))&&(!o.from||t.minutes>=hm(o.from))&&(!o.needs||state.cards.has(o.needs));}
function comboRank(){
  const subs=realSubs().slice(0,MAX_COMBO);if(subs.length<2||state.q||state.drinks)return null;
  const keepS=state.subs,keepC=state.cats;const per=[];
  try{for(const s of subs){state.subs=[s];state.cats=new Set([s.cat]);RANK_ONLY=s.cat;const r=rank();const m=new Map();
      for(const x of r.fit.concat(r.rest)){if(!x.o.open||x.walk>state.mins||x.o.closesIn<=x.walk||x.of.cat!==s.cat)continue;const pv=m.get(x.p.id);if(!pv||x.pr.price<pv.pr.price)m.set(x.p.id,x);}
      per.push(m);}}
  finally{state.subs=keepS;state.cats=keepC;RANK_ONLY=null;}
  const t=selectedTime(),here=state.where||VENUES[0],n=subs.length,list=[];
  for(const p of allPlaces()){
    const rows=subs.map((s,i)=>per[i].get(p.id)||null);const any=rows.find(Boolean);
    const hasMeal=p.offers.some(o=>(o.cat==="deal"||/\bmeal\b/i.test(o.item||""))&&(typeof o.price==="number"||p.deal));if(!any&&!hasMeal)continue;
    let o,walk;if(any){o=any.o;walk=any.walk;}else{o=isOpen(p,t);walk=Math.max(1,Math.round(metres(here,p)/80));if(!o.open||walk>state.mins||o.closesIn<=walk)continue;}
    const sumOf=idx=>Math.round(idx.reduce((a,i)=>a+rows[i].pr.price,0)*100)/100;
    const own=rows.map((x,i)=>x?i:-1).filter(i=>i>=0);
    let best={has:own,total:sumOf(own),meal:null},alt=null;
    for(const of of p.offers){if(!offerLive(of,t)||!(typeof of.price==="number"||of.cat==="deal"&&p.deal))continue;const cov=mealCover(p,of,subs);if(cov.length<2)continue;
      const bp=bestPrice(p,of,t);const rest=own.filter(i=>!cov.includes(i));const has=[...new Set(cov.concat(rest))].sort();const total=Math.round((bp.price+sumOf(rest))*100)/100;
      const instead=cov.every(i=>rows[i])?sumOf(own):null;
      if(has.length>best.has.length||(has.length===best.has.length&&total<best.total-1e-9))best={has,total,meal:{of,pr:bp,cov,instead}};else if(!alt||bp.price<alt.pr.price)alt={of,pr:bp};}
    if(best.has.length<1)continue;
    list.push({p,o,walk,t,rows,subs,n,has:best.has,total:best.total,meal:best.meal,alt:best.meal?null:alt,fits:best.total<=state.budget+1e-9,rating:p.rating||0});}
  const byTotal=(a,b)=>(b.fits-a.fits)||a.total-b.total||(b.rating-a.rating)||a.walk-b.walk;
  const dedupe=L=>{const seen=new Set(),out=[];for(const c of L){if(seen.has(c.p.name))continue;seen.add(c.p.name);out.push(c);if(out.length>=5)break;}return out;};
  const full=list.filter(c=>c.has.length===n).sort(byTotal);
  const part=n>=3?list.filter(c=>c.has.length>=2&&c.has.length<n).sort((a,b)=>b.has.length-a.has.length||byTotal(a,b)):[];
  const combos=dedupe(full.length?full:part);
  const singles=subs.map((s,i)=>{const L=[...per[i].values()].filter(x=>x.pr.price<=state.budget+1e-9).sort((a,b)=>a.pr.price-b.pr.price||a.walk-b.walk);return {s,row:L[0]||null};});
  return {subs,n,combos,full:full.length>0,singles};}
function forN(n){return n===2?"for both":"for all "+n;}
function itemsLine(c){return c.has.filter(i=>!(c.meal&&c.meal.cov.includes(i))).map(i=>{const x=c.rows[i];return subLabel(c.subs[i])+" "+money(x.pr.price)+(x.saved>0&&x.pr.label?" "+x.pr.label.split(" (")[0]:"");}).join(" · ");}
function comboCard(c,t,i){const n=c.n,k=c.has.length,missing=c.subs.map((s,j)=>c.has.includes(j)?null:subLabel(s).toLowerCase()).filter(Boolean);
  const first=c.rows.find(Boolean);
  const detail=c.subs.map((s,j)=>{const opts=c.p.offers.filter(o=>o.cat===s.cat&&subMatch(s,o,c.p)&&typeof o.price==="number"&&offerLive(o,t)&&foodOk(o)).map(o=>({o,pr:bestPrice(c.p,o,t)})).sort((a,b)=>a.pr.price-b.pr.price).slice(0,4);
      return '<div class="cgrp"><div class="k">'+esc(subLabel(s))+'</div>'+(opts.length?opts.map(x=>'<p class="meta">'+money(x.pr.price)+' · '+esc(x.o.item)+(x.pr.label?' · '+esc(x.pr.label.split(" (")[0]):'')+'</p>').join(""):'<p class="meta">'+(c.meal&&c.meal.cov.includes(j)?'In the meal':'Not here')+'</p>')+'</div>';}).join("")+
    (c.alt?'<div class="cgrp"><div class="k">As a meal</div><p class="meta">'+money(c.alt.pr.price)+' · '+esc(c.alt.of.item)+'. Separately is cheaper.</p></div>':'')+(c.meal?'<div class="cgrp"><div class="k">The meal</div><p class="meta">'+money(c.meal.pr.price)+' · '+esc(c.meal.of.item)+(c.meal.pr.label?' · '+esc(c.meal.pr.label.split(" (")[0]):'')+'</p></div>':'');
  return '<div class="ccard'+(c.fits?"":" over")+'" data-ci="'+i+'"><button type="button" class="chead" aria-expanded="false"><span class="ctop"><span class="cname">'+esc(c.p.name)+'</span><span class="cwalk">'+c.walk+' min</span></span>'+
    (k<n?'<span class="chas">Has '+k+' of '+n+' · no '+esc(missing.join(", no "))+'</span>':'')+
    '<span class="ctot"><span class="ms wine" data-ms="'+money(c.total)+'" style="--ms:'+(i?28:36)+'px"></span><span class="cfor">'+(k<n?"for "+(k===2?"those 2":"those "+k):forN(n))+'</span></span>'+
    (c.meal?'<span class="cmeal">'+money(c.meal.pr.price)+' as a meal'+(c.meal.instead!=null&&c.meal.instead>c.meal.pr.price?' (instead of '+money(c.meal.instead)+')':'')+'</span>':'')+
    (itemsLine(c)?'<span class="citems">'+esc(itemsLine(c))+'</span>':'')+(c.fits?'':'<span class="cover">Over your '+money(state.budget).replace(".00","")+'</span>')+'</button>'+
    '<div class="cdetail" hidden>'+detail+'<p class="meta"><b>'+esc(first?statusLine(first,t):hoursLabel(c.o,t))+'</b></p><div class="actions"><a class="chip" data-walk="'+esc(c.p.id)+'" href="'+gmaps(c.p)+'" target="_blank" rel="noopener">'+PIN+' Walk there</a>'+(first?'<button type="button" class="chip" data-combo="'+i+'">Details</button>':'')+'</div></div></div>';}
function comboHTML(cr,t){
  const one=cr.singles.filter(x=>x.row);
  return (cr.combos.length?'<div class="k" style="margin-top:6px">'+(cr.full?(cr.n===2?"Both in one place":"All "+cr.n+" in one place"):"The most in one place")+'</div>':'')+cr.combos.map((c,i)=>comboCard(c,t,i)).join("")+
    (one.length?'<div class="k" style="margin-top:12px">Or just one:</div><div class="list" id="justOne">'+one.map((x,i)=>'<button type="button" class="item citem" data-ci="'+i+'"><span class="ms wine" data-ms="'+money(x.row.pr.price)+'" style="--ms:14px;min-width:64px"></span><div style="min-width:0"><h3>'+esc(subLabel(x.s))+' · '+esc(x.row.p.name)+'</h3><div class="meta">'+esc(x.row.of.item)+(x.row.saved>0&&x.row.pr.label?' · '+esc(x.row.pr.label.split(" (")[0]):'')+' · '+esc(hoursLabel(x.row.o,x.row.t||t))+'</div></div><div class="walk">'+x.row.walk+' min<small>walk</small></div></button>').join("")+'</div>':'');}
/* Search: a magnifier tile stuck to the left of the category row; tapping it opens a rounded box under the row */
/* Apply what the interpreter understood: category and sub-option, budget, walk, day and time, diet, place; the rat confirms in one line */
function applyWish(w){
  const go=()=>{state.q="";if(w.drinks){state.drinks=true;state.dsub=w.dsub||"";UI.lastCat="drinks";}else{state.drinks=false;state.cats=new Set(w.cats.length?w.cats:[...state.cats]);state.catOrder=w.cats.slice();state.subs=w.subs&&w.subs.length?w.subs.slice():w.sub&&w.cats[0]?[{cat:w.cats[0],id:w.sub}]:[];if(w.cats[0])UI.lastCat=w.cats[0];}
    if(w.budget!==null)state.budget=Math.max(1,Math.min(MAX_BUDGET,w.budget));if(w.mins!==null)state.mins=Math.max(5,Math.min(MAX_WALK,w.mins));
    if(w.dayOffset!==null)state.dayOff=Math.max(0,Math.min(6,w.dayOffset));if(w.minute!==null){state.minute=w.minute;UI.later=true;}
    for(const d of w.diet)state.diet.add(d);if(w.where)state.where=w.where;
    let q=w.q||"";if(!q&&w.left){const vs=vocab();const ws=w.left.split(" ").filter(x=>vs.includes(x));if(ws.length)q=ws.join(" ");}
    const hq=!q&&!w.drinks&&w.raw&&w.cats&&w.cats.length===1&&w.cats[0]==="coffee"&&!(w.subs&&w.subs.length>1)?hotType(w.raw,true):null;if(hq)q=hq.label;
    if(q&&!w.drinks){state.q=q;if(!hq&&!hotType(q)){const r=rank();if(!r.fit.length&&!r.rest.length)state.q="";}}
    if(w.drinks&&w.raw&&w.raw.trim().split(/\s+/).length<=2&&drinkWord(w.raw))state.q=w.raw.trim(); // "cider", "a pint": the word stays on screen
    UI.searchOpen=false;UI.spec=false;UI.say=w.say||"";persist();render();};
  if(w.drinks&&!isAdult()){openDrinksGate(go);return;}go();}
function searchOn(){return !!(UI.searchOpen||state.q);}
function searchTile(){const on=searchOn();return '<button type="button" class="cat-tile search-tile'+(on?" on":"")+'" id="searchTile" aria-pressed="'+on+'" aria-label="Search"><span class="icowrap"><img class="ico" src="'+SUBICO.cat_search+'" alt=""></span><span class="lbl">Search</span></button>';}
function searchBox(){if(!searchOn())return "";return '<div id="specBox" class="qbox"><input id="qIn" placeholder="Latte, pizza, sushi…" autocomplete="off" enterkeyhint="search" value="'+esc(state.q)+'"><button type="button" class="iconbtn" id="mic" aria-label="Speak" hidden>'+MIC+'</button><button type="button" class="iconbtn" id="qGo" aria-label="Search">'+GO+'</button><div id="specChips" hidden></div><p class="note" id="qNote" hidden></p></div>';}
function filtersHTML(){
  const t=selectedTime();
  const on=id=>id==="drinks"?!!state.drinks:!state.drinks&&state.cats.has(id);
  const cat=c=>'<button type="button" class="cat-tile'+(on(c.id)?" on":"")+'" data-id="'+c.id+'" aria-pressed="'+on(c.id)+'"><span class="icowrap"><img class="ico" src="'+(ICONS[c.ico]||SUBICO[c.ico])+'" alt="">'+(on(c.id)?'<span class="tickb" aria-hidden="true">'+TICK+'</span>':'')+'</span><span class="lbl">'+c.name+'</span></button>';
  const names=CATS.filter(c=>state.cats.has(c.id)).map(c=>c.name);
  const sn=subName();
  const showing=""; // (07/11) replaced by the row of active filters above the results: actRow()
  const bOther=!BUDGETS.includes(state.budget),mOther=!TIMES.includes(state.mins);
  return '<div class="filters">'+qLine()+'<div class="cats'+(state.q?" off":"")+'" id="catChips" aria-label="'+(state.q?"Food types are ignored while you search for something specific":"Food types")+'">'+searchTile()+CATS.map(cat).join("")+cat(DRINKS_CAT)+'</div>'+searchBox()+subsHTML()+showing+
    '<div class="chips scroll" id="howChips"><button type="button" class="chip place" id="placeChip" aria-label="Change where you are">'+PIN+'<span>'+esc(placeShort())+'</span>'+CHEV+'</button><i class="gap"></i>'+
    BUDGETS.map(b=>'<button type="button" class="chip'+(state.budget===b?" on":"")+'" data-b="'+b+'">£'+b+'</button>').join("")+'<button type="button" class="chip'+(bOther?" on":"")+'" id="bOther">'+(bOther?money(state.budget).replace(".00",""):"Other")+'</button><i class="gap"></i>'+
    TIMES.map(m=>'<button type="button" class="chip'+(state.mins===m?" on":"")+'" data-m="'+m+'">'+m+' min</button>').join("")+'<button type="button" class="chip'+(mOther?" on":"")+'" id="mOther">'+(mOther?state.mins+" min":"Other")+'</button><i class="gap"></i>'+
    '<button type="button" class="chip'+(!t.isNow?" on":"")+'" id="laterChip">'+esc(whenLabel(t))+CHEV+'</button></div>'+
    '<div class="reveal slider" id="bBox"'+(UI.bOther?'':' hidden')+'><div class="k">How much?</div><span class="ms wine" id="bBig" data-ms="'+money(state.budget)+'" style="--ms:24px"></span><input type="range" class="sl" id="bRange" min="1" max="15" step="0.5" value="'+state.budget+'" aria-label="Budget"><div class="sl-ticks"><span style="left:0">£1</span><span style="left:28.6%">A fiver</span><span style="left:100%">£15</span></div><p class="sl-note" id="bVal">'+moneyNote(state.budget)+'</p></div>'+
    '<div class="reveal slider" id="mBox"'+(UI.mOther?'':' hidden')+'><div class="k">How far?</div><span class="ms wine" id="mBig" data-ms="'+state.mins+' min" style="--ms:24px"></span><input type="range" class="sl" id="mRange" min="5" max="45" step="5" value="'+state.mins+'" aria-label="Walking time"><div class="sl-ticks"><span style="left:0">5</span><span style="left:50%">25 min walk</span><span style="left:100%">45</span></div><p class="sl-note" id="mVal">'+walkNote(state.mins)+'</p></div>'+
    '<div class="reveal" id="laterBox"'+(UI.later?'':' hidden')+'>'+laterHTML()+'</div>'+
    actRow()+'<p class="meta fitline" id="fitLine"></p>'+
    '</div>';
}
/* ---------- The row of active filters, just above the results (07/11/2026) ----------
   Everything the search is using, in this order, each with its icon: food types (or, when something inside is ticked, only those things), the words of
   "Something specific", the budget and the walk when they are not £5 and 30 min, the time when it is not Now, the diet. "Clear all" at the end.
   Each × takes off that one thing. No filters: no row. Same row in the list and on the map. */
const DEF_BUDGET=5,DEF_MINS=30;
function activeFilters(){const L=[],t=selectedTime();
  const catIco=c=>ICONS[c.ico]||SUBICO[c.ico]||"",subIco=d=>d&&d[1]&&SUBICO[d[1]]||"";
  // a food type with something ticked inside it shows only those things ("Coffee", not "Hot drinks"); with nothing inside, the food type itself
  if(state.drinks){const d=(SUBS.drinks||[]).find(x=>x[0]===state.dsub);if(d)L.push({k:"dsub",id:d[0],label:d[2],ico:subIco(d)});else L.push({k:"cat",id:"drinks",label:"Drinks",ico:catIco(DRINKS_CAT)});}
  else for(const c of catsInOrder()){const def=CATS.find(x=>x.id===c);if(!def)continue;
    const subs=subsOf(c).filter(x=>x.id!=="other"&&subDef(x));
    if(subs.length)subs.forEach(x=>L.push({k:"sub",id:x.id,cat:c,label:subLabel(x),ico:subIco(subDef(x))}));
    else L.push({k:"cat",id:c,label:def.name,ico:catIco(def)});}
  if(state.q)L.push({k:"q",label:"“"+state.q+"”",ico:SUBICO.cat_search||""});
  if(state.budget!==DEF_BUDGET)L.push({k:"budget",label:"≤ "+money(state.budget).replace(".00","")});
  if(state.mins!==DEF_MINS)L.push({k:"mins",label:state.mins+" min"});
  if(!t.isNow)L.push({k:"when",label:(state.dayOff||0)===0?"Later "+whenLabel(t).replace(/^Today /,""):whenLabel(t)});
  for(const d of DIETS)if(state.diet.has(d.id))L.push({k:"diet",id:d.id,label:d.name});
  return L;}
function actRow(){const L=activeFilters();if(!L.length)return "";
  return '<div class="actrow" id="actRow" role="group" aria-label="Active filters">'+L.map((f,i)=>'<span class="bol'+(f.ico?" ico":"")+'">'+
    (f.ico?'<span class="bol-i" aria-hidden="true"><img src="'+f.ico+'" alt=""></span>':'')+'<span class="bol-l">'+esc(f.label)+'</span>'+
    '<button type="button" class="bol-x" data-i="'+i+'" aria-label="Remove '+esc(f.label.replace(/[“”]/g,""))+'">×</button></span>').join("")+
    '<button type="button" class="bol-clear" id="actClear">Clear all</button></div>';}
function clearAllFilters(){state.cats=new Set();state.catOrder=[];state.subs=[];state.drinks=false;state.dsub="";state.q="";state.budget=DEF_BUDGET;state.mins=DEF_MINS;state.minute=null;state.dayOff=0;state.diet=new Set();
  UI.later=false;UI.bOther=false;UI.mOther=false;UI.spec=false;UI.searchOpen=false;UI.actScroll=0;}
function dropFilter(f){
  if(f.k==="cat"){if(f.id==="drinks"){state.drinks=false;state.dsub="";}else{state.cats.delete(f.id);state.catOrder=(state.catOrder||[]).filter(c=>c!==f.id);state.subs=(state.subs||[]).filter(x=>x.cat!==f.id);}}
  else if(f.k==="sub")state.subs=(state.subs||[]).filter(x=>!(x.cat===f.cat&&x.id===f.id)); // the food type stays ticked
  else if(f.k==="dsub")state.dsub="";
  else if(f.k==="q"){state.q="";UI.spec=false;UI.searchOpen=false;}
  else if(f.k==="budget"){state.budget=DEF_BUDGET;UI.bOther=false;}
  else if(f.k==="mins"){state.mins=DEF_MINS;UI.mOther=false;}
  else if(f.k==="when"){state.minute=null;state.dayOff=0;UI.later=false;}
  else if(f.k==="diet")state.diet.delete(f.id);}
function wireActRow(d){const row=d.querySelector("#actRow");if(!row)return;
  if(UI.actScroll)setTimeout(()=>{row.scrollLeft=UI.actScroll;},0);
  row.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    if(b.id==="actClear"){clearAllFilters();persist();render();return;}
    const f=activeFilters()[Number(b.dataset.i)];if(!f)return;UI.actScroll=row.scrollLeft;
    dropFilter(f);persist();render();});}
function wireFilters(d){
  const q=sel=>d.querySelector(sel);
  q("#catChips").addEventListener("click",e=>{const b=e.target.closest(".cat-tile");if(!b||b.id==="searchTile")return;const id=b.dataset.id;UI.lastCat=id;if(id==="drinks"){toggleDrinks();return;}state.drinks=false;try{localStorage.setItem("fiver.tapped","1");}catch(e){}state.catOrder=(state.catOrder||[]).filter(c=>c!==id);if(state.cats.has(id)){state.cats.delete(id);state.subs=(state.subs||[]).filter(s=>s.cat!==id);}else{state.cats.add(id);state.catOrder.push(id);}persist();UI.catScroll=q("#catChips").scrollLeft;render();});
  q("#searchTile").onclick=()=>{const i=q("#qIn");if(searchOn()&&!(i&&i.value.trim())&&!state.q){stopSay();UI.searchOpen=false;render();return;}UI.searchOpen=true;UI.focusQ=true;render();};
  {const i=q("#qIn");if(i){if(UI.focusQ){UI.focusQ=false;setTimeout(()=>{try{i.focus();}catch(e){}},0);}
    // the buttons inside the box keep the focus (iPhone counts a tap on them as a blur); the box closes only on a tap outside it (sayOutside)
    d.querySelectorAll("#specBox button").forEach(b=>b.addEventListener("pointerdown",e=>e.preventDefault()));}}
  wireActRow(d);
  if(q("#catClear"))q("#catClear").onclick=()=>{state.cats=new Set();state.drinks=false;state.subs=[];state.dsub="";persist();render();};
  if(q("#subChips"))q("#subChips").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    const c=b.dataset.cat,id=b.dataset.sub;
    if(id==="other"){const was=c==="drinks"?state.dsub==="other":subOn(c,"other");
      if(c==="drinks")state.dsub=was?"":"other";else subToggle(c,"other");UI.searchOpen=!was||!!state.q;UI.focusQ=!was;UI.subScroll=q("#subChips").scrollLeft;render();return;}if(c==="drinks"){state.dsub=state.dsub===id?"":id;}else{subToggle(c,id);}
    UI.subScroll=q("#subChips").scrollLeft;render();});
  q("#howChips").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    if(b.dataset.b){state.budget=Number(b.dataset.b);UI.bOther=false;persist();render();}
    else if(b.dataset.m){state.mins=Number(b.dataset.m);UI.mOther=false;persist();render();}
    else if(b.id==="bOther"){UI.bOther=!UI.bOther;q("#bBox").hidden=!UI.bOther;if(UI.bOther){UI.mOther=false;q("#mBox").hidden=true;}}
    else if(b.id==="mOther"){UI.mOther=!UI.mOther;q("#mBox").hidden=!UI.mOther;if(UI.mOther){UI.bOther=false;q("#bBox").hidden=true;}}
    else if(b.id==="placeChip"){go(S.where);}
    else if(b.id==="laterChip"){UI.later=!UI.later;q("#laterBox").hidden=!UI.later;}});
  // the sliders: the chip, the line and the fit count follow the thumb; the pick re-renders when you let go
  const live=()=>{const r=rank();lastRank=r;q("#fitLine").textContent=fitText(r);};
  const bR=q("#bRange"),mR=q("#mRange");
  bR.addEventListener("input",()=>{state.budget=Number(bR.value);q("#bVal").textContent=moneyNote(state.budget);q("#bBig").dataset.ms=money(state.budget);msRender(q("#bBox"));q("#bOther").textContent=money(state.budget).replace(".00","");q("#bOther").classList.add("on");q("#howChips").querySelectorAll("[data-b]").forEach(c=>c.classList.remove("on"));live();});
  bR.addEventListener("change",()=>{persist();render();});
  mR.addEventListener("input",()=>{state.mins=Number(mR.value);q("#mVal").textContent=walkNote(state.mins);q("#mBig").dataset.ms=state.mins+" min";msRender(q("#mBox"));q("#mOther").textContent=state.mins+" min";q("#mOther").classList.add("on");q("#howChips").querySelectorAll("[data-m]").forEach(c=>c.classList.remove("on"));live();});
  mR.addEventListener("change",()=>{persist();render();});
  q("#fitLine").textContent=fitText(lastRank||rank());
  q("#dayChips").addEventListener("click",e=>{const c=e.target.closest("button");if(!c)return;state.dayOff=Number(c.dataset.off);if(state.dayOff>0&&state.minute===null)state.minute=12*60;UI.later=true;render();});
  q("#nowBtn").onclick=()=>{state.minute=null;state.dayOff=0;UI.later=false;render();};
  const ti=q("#timeIn");ti.addEventListener("change",()=>{state.minute=ti.value?hm(ti.value):null;UI.later=true;render();});
  const qIn=q("#qIn")||document.createElement("input"),spec=q("#specChips")||document.createElement("div"),qNote=q("#qNote")||document.createElement("p"),specBox=q("#specBox")||document.createElement("div");
  const paintSpec=()=>{const list=[];spec.hidden=true;spec.innerHTML=list.map(x=>'<button type="button" class="chip'+(qIn.value.trim().toLowerCase()===x.toLowerCase()?" on":"")+'" data-q="'+esc(x)+'">'+esc(x)+'</button>').join("");};
  paintSpec();qIn.oninput=paintSpec;
  qNote.textContent=claudeAvailable()?"Or say it all in one go: “something hot and veggie, £4, back in 20 min”.":"Type what you’re after and Fiver matches it by name.";
  spec.addEventListener("click",e=>{const b=e.target.closest("button[data-q]");if(!b)return;state.q=state.q.toLowerCase()===b.dataset.q.toLowerCase()?"":b.dataset.q;UI.spec=true;render();});
  const qc=q("#qClear");if(qc)qc.onclick=()=>{state.q="";UI.spec=false;persist();render();};
  wireSay(d,qIn,s=>apply(s));
  const apply=async(said)=>{let text=(typeof said==="string"?said:qIn.value).trim();
    // 0 · a hot drink by name ("Cappuccino", "flat white", "té"): Hot drinks, that drink only, the word stays on screen
    const ht=text&&!(DRINK_WORDS.test(text)&&drinkWord(text))?hotType(text):null;
    if(ht){state.drinks=false;state.q=text;UI.spec=true;UI.searchOpen=false;persist();render();return;}
    // 1 · the sentence: "I would like to have a coffee" → Hot drinks · Coffee, "pizza under 4 quid" → Pizza, £4
    if(text){const wsh=interpretMulti(text,nowParts().day);
      if(wsh.understood&&(wsh.cats.length||wsh.drinks||wsh.budget!==null||wsh.mins!==null||wsh.diet.length)){applyWish(wsh);return;}
      if(!wsh.understood&&typeof readWishRemote==="function"&&ON_SITE){const cw=wishFromClaude(await readWishRemote(text),text); // nothing understood here: Claude has 3 s, else the normal search
        if(cw&&(cw.cats.length||cw.drinks)){applyWish(cw);return;}if(cw&&cw.q){qIn.value=text=cw.q;}else if(wsh.clean)qIn.value=text=wsh.clean;}
      else if(!wsh.understood&&wsh.clean&&wsh.clean!==text.toLowerCase()){qIn.value=text=wsh.clean;}}
    // 1 · the words against every item name, typos corrected; 2 · nothing? Claude reads the sentence (item, budget, time…); 3 · still nothing: the empty state offers Teach
    if(text&&DRINK_WORDS.test(text)&&drinkWord(text)){ // beer, pint, cider, wine, lager: inside Drinks, behind the 18+ check
      const go=()=>{state.q=text;state.drinks=true;UI.spec=true;persist();render();};if(!isAdult()){openDrinksGate(go);return;}go();return;}
    state.drinks=false;
    state.q=text?(srchPlacey(text)?text:fuzzyQ(text)||text):""; // a canteen, uni or campus in the words: matched as a place, not corrected as a dish
    if(state.q&&claudeAvailable()){const r0=rank();if(!r0.fit.length&&!r0.rest.length){const keep=state.q;state.q="";const r=await parseWish(text,qNote);if(r===null)state.q=keep;else if(!state.q)state.q="";}}
    UI.spec=!!state.q;persist();render();};
  if(q("#qGo"))q("#qGo").onclick=apply;qIn.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();apply();}};
}
function unpricedBox(r){return r.unpriced.length?'<div class="k" style="margin-top:8px">Not priced yet · '+r.unpriced.length+' nearby</div><div class="list" id="unpriced"></div>':'';}
/* Free stuff: only things that really are free, no invitation. A food market within 15 min (samples, never promised),
   free food the unis give out, and tap water. Nothing? The cheapest instead. Normal poses, never the party rat. */
function freeMarkets(here){if(typeof LON==="undefined"||!LON.markets)return [];const t=selectedTime();const out=[];
  for(const m of LMARKETS){const ll=LON.markets[m.id];if(!Array.isArray(ll))continue;const p={id:"mkt-"+m.id,name:m.name,lat:ll[0],lon:ll[1],addr:"",status:"shop"};
    if(m.hours)p.hours=m.hours;else p.hoursUnknown=true;const walk=Math.max(1,Math.round(metres(here,p)/80));if(walk>15)continue;out.push({m,p,walk,o:isOpen(p,t)});}
  return out.sort((a,b)=>a.walk-b.walk);}
function vFree(){
  const here=state.where||VENUES[0];const r=rank();lastRank=r;const t=r.t;const mk=freeMarkets(here);const free=r.fit.filter(x=>x.of.cat==="free");
  let line,pose,body;const water='<p class="note waterline">Tap water is free in every pub and restaurant. Just ask.</p>';
  const mkCard=x=>'<div class="hero pick compact market"><div class="k">Food market · '+x.walk+' min walk</div><span class="ms" data-ms="'+esc(x.m.name)+'" style="--ms:16px"></span>'+
    '<p class="lead">Free samples at some stalls · not guaranteed</p><p class="meta"><b>'+esc(hoursLabel(x.o,t))+'</b></p><div class="actions"><a class="chip" data-walk="'+esc(x.p.id)+'" href="'+gmaps(x.p)+'" target="_blank" rel="noopener">'+PIN+' Walk there</a></div></div>';
  if(mk.length){line=mk[0].m.line;pose="f_wink";}
  else if(free.length){line="Free food. My favourite price.";pose="f_wink";}
  if(mk.length||free.length){body=filtersHTML()+free.slice(0,3).map((x,i)=>pickCard(x,t,{compact:true,label:i?"Also free":"Free near you"})).join("")+mk.map(mkCard).join("")+water;}
  else{ // nothing free: the cheapest instead, by price
    line="Nothing free near you. Here’s the cheapest instead.";pose="s_peek";
    const keep=state.cats;state.cats=new Set(CATS.map(c=>c.id).filter(id=>id!=="free"));let r2;try{r2=rank();}finally{state.cats=keep;}
    const cheap=r2.fit.slice().sort((a,b)=>a.pr.price-b.pr.price||a.walk-b.walk);UI.freeCheap=cheap;
    body=filtersHTML()+water+(cheap.length?pickCard(cheap[0],t,{compact:true,label:"Cheapest near you"})+'<div class="k" style="margin-top:10px">Cheapest first</div><div class="list" id="freeCheap"></div>':'');}
  const d=stage("free",pose,line,body,'',S.results);
  wireFilters(d);d.querySelectorAll(".teach").forEach(b=>b.onclick=()=>openTeach(b.dataset.teach?allPlaces().find(p=>p.id===b.dataset.teach):null));
  const fc=d.querySelector("#freeCheap");if(fc&&UI.freeCheap){fc.innerHTML=UI.freeCheap.slice(1,15).map(row=>'<button type="button" class="item" data-id="'+esc(row.p.id)+'"><span class="ms wine" data-ms="'+money(row.pr.price)+'" style="--ms:14px;min-width:64px"></span><div style="min-width:0"><h3>'+esc(row.p.name)+'</h3><div class="meta">'+esc(row.of.item)+' · '+esc(hoursLabel(row.o,row.t||t))+'</div></div><div class="walk">'+row.walk+' min<small>walk</small></div></button>').join("");
    fc.addEventListener("click",e=>{const b=e.target.closest(".item");if(!b)return;const row=UI.freeCheap.find(x=>x.p.id===b.dataset.id);if(row)openSheet(row);});}
  d.querySelectorAll(".hero.compact [data-open]").forEach(b=>b.onclick=()=>{const row=free.concat(UI.freeCheap||[]).find(x=>x.p.id===b.dataset.open);if(row)openSheet(row);});
  return d;}
function vResults(){
  if(state.drinks)return vDrinks();
  if(!state.q&&state.cats.size===1&&state.cats.has("free"))return vFree();
  refineChains();
  if(!state.q&&!state.cats.size)return vSleepy();
  const r=rank();lastRank=r;const t=r.t;const here=state.where||VENUES[0];const nm=firstName();
  let line,pose,body,actions;
  const few=!state.q&&(typeof LON==="undefined"||LON.status!=="loading")&&r.fit.concat(r.rest).filter(x=>x.walk<=30).length<3; // fewer than 3 places within 30 min, with london.json in: a second line, never instead of the pick
  const fkey=filterKey();const changed=!!UI.lastFkey&&UI.lastFkey!==fkey;UI.lastFkey=fkey;
  const first=!state.seenResults;state.seenResults=true;
  if(UI.back===undefined){try{const last=Number(localStorage.getItem("fiver.lastSeen")||0);UI.back=!first&&!DEMO.where&&last>0&&Date.now()-last>2*3600e3;}catch(e){UI.back=false;}}
  try{localStorage.setItem("fiver.lastSeen",String(Date.now()));}catch(e){}
  const ctx=[r.fit[0]?r.fit[0].p.id+"|"+r.fit[0].of.item:"none",fkey,state.uni].join("|");
  const fewH=()=>{const fm=moment("few",ctx);return '<button type="button" class="linkbtn fewline" id="farTeach">'+esc(fm.line)+'</button>';};
  const cr=UI.view!=="map"?comboRank():null;const combo=!!(cr&&(cr.combos.length||cr.over||cr.singles.some(x=>x.row)));
  const freeTop=null; // no "free food first": free things live under Free stuff
  if(combo){const lbl=cr.subs.map(subLabel).join(" + ");UI.back=false;UI.lineKey="combo";const c0=cr.combos[0];
    if(c0&&cr.full&&c0.fits){line=(cr.n===2?lbl+", one stop: ":"All "+cr.n+" at "+c0.p.name+": ")+money(c0.total)+(cr.n===2?" at "+c0.p.name:"")+".";pose="point";}
    else if(c0&&cr.full){line="Nowhere has all of that under "+money(state.budget).replace(".00","")+". "+c0.p.name+" comes closest.";pose="s_shrug";}
    else if(c0){line="Nowhere near has all "+cr.n+". "+c0.p.name+" has "+c0.has.length+".";pose="s_shrug";}
    else{line="Nowhere has all of that nearby. Here’s each one on its own.";pose="s_shrug";}
    body=filtersHTML()+viewsRow()+(freeTop?pickCard(freeTop,t,{compact:true,label:"Free food near you"}):'')+comboHTML(cr,t);actions='';}
  else if(r.fit.length){const x=r.fit[0];
    let mk=pickMoment(x,state.q);const strong=mk==="support"||mk==="free";
    if(first&&!strong)mk="first";else if(UI.back&&!strong)mk="back";
    else if(!["support","free","late","card","found"].includes(mk))mk=overlayKey(x,ctx,t)||mk;
    const m=moment(mk,ctx,{name:nm?", "+nm:"",q:"“"+state.q+"”",save:money(x.saved||0)},fitsItem(x));line=m.line;pose=m.pose;UI.lineKey=mk;
    let treat=false;if(state.budget>5&&!["support","free"].includes(mk)){try{if(!localStorage.getItem("fiver.treat")){localStorage.setItem("fiver.treat","1");treat=true;}}catch(e){}}
    const HAPPY=["a_pizza","cheer","f_excited","point"],happy=HAPPY[hashStr(ctx)%HAPPY.length]; // a happy rat for a good plate (a_plate is the sad, empty one: only for no results)
    if(treat){line="Treating yourself? I’ll find the best plate for it.";pose=happy;UI.lineKey="treat";}
    else if(x.mealPick&&state.budget>=6&&!["support","free","first","back"].includes(mk)){line="Best plate for your "+money(state.budget).replace(".00","")+".";pose=happy;UI.lineKey="plate";}
    UI.back=false;
    if(UI.view==="map"){
      body=filtersHTML()+viewsRow()+'<div class="mapbox big" id="mapbox2"></div><div id="mapCard">'+pickCard(x,t,{compact:true})+'</div>';
      actions='';
    }else{
      body=filtersHTML()+viewsRow()+pickCard(x,t)+(r.cheapest?pickCard(r.cheapest,t,{compact:true,label:"Cheapest that fits"}):'')+(few?fewH():'')+
        '<div class="reveal" id="allBox" hidden><div class="k">All that fit · best first</div><div class="list" id="fit"></div>'+(r.rest.length?'<div class="list" id="rest"></div>':'')+unpricedBox(r)+(r.hidden?'<p class="note">'+r.hidden+' item'+(r.hidden>1?'s':'')+' hidden for your diet.</p>':'')+'</div>';
      actions=navNext("seeAll","See all "+r.fit.length);
    }
    if(few&&uniMain()&&state.where&&state.where.label!==uniMain().name)actions='<button type="button" class="chip" id="farMain">Or try '+esc(mainCampusShort())+'</button>'+actions;
  }else{
    const u=unlock(r);const oa=!u.anyOpen?opensAt(t):null;UI.back=false;
    const catsTxt=[...state.cats].map(c=>((CATS.find(x=>x.id===c)||{}).name||c).toLowerCase()).join(" or ");
    let em;
    if(state.q)em=moment("noq",ctx,{q:"“"+state.q+"”",alt:u.noq?u.noq.p.name:""},u.noq?null:l=>!l.includes("{alt}")); // an unknown wish, before any other excuse
    else if(!u.anyOpen&&u.cats){em={pose:"s_shrug",line:"No "+catsTxt+" open"+(t.isNow?" right now":" then")+". "+u.cats.p.name+" is, though."};}
    else if(!u.anyOpen)em=moment("shut",ctx,{t:oa!==null?" Try me at "+fmt(oa)+".":" Try me tomorrow."});
    else if(!u.anyNear&&!u.cats&&!u.noq)em={pose:"s_shrug",line:"Nothing within 45 minutes. That’s far, even for me."};
    else if(u.budget&&!u.mins)em=moment("budget",ctx);
    else em=moment("time",ctx,{b:money(state.budget).replace(".00",""),m:state.mins});
    line=em.line;pose=em.pose;UI.lineKey=em.key||"";
    const places=n=>n+" place"+(n===1?"":"s");
    const bt=[];const btn=(id,label,pri)=>pri?navNext(id,label):'<button type="button" class="chip" id="'+id+'">'+label+'</button>';
    // the smallest change that works, with its count; walking never past 45 min
    if(u.mins)bt.push(btn("fixM","Try "+u.mins+" min · "+places(u.minsN),true));
    if(u.budget)bt.push(btn("fixB","Up to "+money(u.budget).replace(".00","")+" · "+places(u.budgetN),!bt.length));
    if(u.both)bt.push(btn("fixBoth",money(Math.ceil(u.both.pr.price*2)/2).replace(".00","")+" and "+Math.ceil(u.both.walk/5)*5+" min · 1 place",!bt.length));
    if(u.cats)bt.push(btn("fixC","Any food type · "+places(u.catsN),!bt.length));
    if(state.q){bt.length=0;bt.push(navNext("qTeach","Teach me a place"));bt.push(btn("fixQ","Drop “"+esc(state.q)+"”"+(u.noq?" · "+places(u.noqN):""),false));}
    if(!u.anyOpen&&t.isNow)bt.push(btn("fixTm","Tomorrow at 12:30",!bt.length));
    if(!u.anyOpen)bt.push(btn("fixT","Pick another time",!bt.length));
    bt.push(btn("fixL","Try another spot",!bt.length));
    if(few){const fm=moment("few",ctx);line=fm.line;pose=fm.pose;UI.lineKey="few";bt.length=0;bt.push(navNext("farTeach","Teach me your spots"));if(uniMain()&&state.where&&state.where.label!==uniMain().name)bt.push('<button type="button" class="chip" id="farMain">Or try '+esc(uniMain().name.replace(/ Campus$/,""))+'</button>');else if(state.uni==="ucl")bt.push('<button type="button" class="chip" id="farMain">Or try '+esc(mainCampusShort())+'</button>');}
    if(UI.view==="map"){body=filtersHTML()+viewsRow()+(state.q?'<p class="meta" id="noMatch">Nothing matches “'+esc(state.q)+'” within your budget and walk. Try a bigger budget, a longer walk or another word.</p>':'')+'<div class="mapbox big" id="mapbox2"></div><div id="mapCard"></div>';actions=bt.join("")+'<button type="button" class="linkbtn teach" data-teach="">Know somewhere I don’t? Teach me →</button>';}
    else{const nearOpen=r.rest.filter(x=>x.o.open&&x.o.closesIn>x.walk&&x.walk<=30).sort((a,b)=>a.walk-b.walk||a.pr.price-b.pr.price).slice(0,5);UI.nearOpen=nearOpen;
      body=filtersHTML()+viewsRow()+(state.q?'<p class="meta" id="noMatch">Nothing matches “'+esc(state.q)+'” within your budget and walk. Try a bigger budget, a longer walk or another word.</p>':'')+(state.q&&u.noq?'<div class="k" style="margin-top:6px">Without “'+esc(state.q)+'”, the cheapest that fits</div>'+pickCard(u.noq,t,{compact:true,label:"Cheapest that fits"}):'')+
      (nearOpen.length?'<div class="k" style="margin-top:10px">Nearest open</div><div class="list" id="nearOpen"></div>':'')+'<div class="reveal" id="allBox" hidden>'+(r.rest.length?'<div class="list" id="rest"></div>':'')+unpricedBox(r)+'</div>';
    actions=bt.join("")+(r.rest.length||r.unpriced.length?'<button type="button" class="linkbtn" id="seeAll">Show the list</button>':'')+'<button type="button" class="linkbtn teach" data-teach="">Know somewhere I don’t? Teach me →</button>';}
    lastRank._unlock=u;
  }
  if(UI.say){line=UI.say;pose=UI.sayPose||["a_pizza","cheer","f_excited","point"][hashStr(UI.say)%4];UI.say=null;UI.sayPose=null;}
  const d=stage("results-"+(r.fit[0]?r.fit[0].p.id:"none"),pose,line,body,actions,S.results);
  if(changed){const h=d.querySelector(".hero.pick");if(h)h.classList.add("pulse");const fl=d.querySelector("#fitLine");if(fl)fl.classList.add("pulse");}
  const ft=d.querySelector("#farTeach");if(ft)ft.onclick=()=>openTeach();const qt=d.querySelector("#qTeach");if(qt)qt.onclick=()=>openTeach();const fm=d.querySelector("#farMain");if(fm)fm.onclick=()=>{const m=state.uni!=="ucl"&&uniMain();const v=m||VENUES.find(x=>x.id==="quad");state.where={lat:v.lat,lon:v.lon,label:v.name};persist();render();};
  wireFilters(d);d.querySelectorAll(".teach").forEach(b=>b.onclick=()=>openTeach(b.dataset.teach?allPlaces().find(p=>p.id===b.dataset.teach):null));if(UI.catScroll)setTimeout(()=>{const c=view.querySelector("#catChips");if(c)c.scrollLeft=UI.catScroll;},0);
  const item=row=>'<button type="button" class="item'+(row.fits?"":" dim")+'" data-id="'+esc(row.p.id)+'"><span class="ms wine" data-ms="'+money(row.pr.price)+'" style="--ms:14px;min-width:64px"></span>'+
    '<div style="min-width:0"><h3>'+esc(row.p.name)+(row.saved>0?'<span class="saved">−£'+row.saved.toFixed(2)+'</span>':'')+'</h3><div class="meta">'+esc(row.of.item)+(row.of.about?' · about '+money(row.pr.price):'')+(row.of.lb?' · from '+money(row.pr.price):'')+' · '+esc(hoursLabel(row.o,row.t||t))+(row.ask.length?' · <span class="diet">ask staff</span>':'')+'</div></div>'+
    '<div class="walk">'+row.walk+' min<small>walk</small>'+(row.more?'<small>+'+row.more+' more</small>':'')+'</div></button>';
  const seenB={};const fitRows=[];for(const row of r.fit){const k=row.p.name+"|"+row.of.item+"|"+row.pr.price;if(seenB[k]){seenB[k].more=(seenB[k].more||0)+1;continue;}seenB[k]=row;fitRows.push(row);}
  // once per list: under the first result whose price isn't checked, the rat asks for a photo of the menu (opens Teach with that place)
  let asked=false;const askCard=p=>'<button type="button" class="ratask" data-place="'+esc(p.id)+'">'+rat("a_camera",58)+'<span>I don’t know prices here yet. Snap the menu and I’ll remember it for everyone →</span></button>';
  const askAfter=(row,unchecked)=>!asked&&unchecked?(asked=true,askCard(row.p)):"";
  const fitEl=d.querySelector("#fit");if(fitEl)fitEl.innerHTML=fitRows.map(row=>item(row)+askAfter(row,UNCHECKED.has(row.of.status))).join("");
  const noEl=d.querySelector("#nearOpen");if(noEl&&UI.nearOpen)noEl.innerHTML=UI.nearOpen.map(item).join("");
  if(typeof askHours==="function")askHours((r.fit.length?r.fit:r.rest).slice(0,5)); // hours not in OpenStreetMap: Google, once, for the first 5 shown
  const restEl=d.querySelector("#rest");if(restEl){const near=r.rest.filter(x=>x.walk<=30),reach=near.filter(x=>x.o.open),later=near.filter(x=>!x.o.open).sort((a,b)=>((a.o.next?a.o.next.k*1440+a.o.next.at:1e5)-(b.o.next?b.o.next.k*1440+b.o.next.at:1e5))||a.walk-b.walk);
    restEl.innerHTML=(reach.length?'<div class="k" style="margin-top:8px">Out of reach right now</div>'+reach.slice(0,25).map(item).join(""):'')+(later.length?'<div class="k" style="margin-top:12px">Opening later</div>'+later.slice(0,25).map(item).join(""):'')+(r.rest.length>near.length?'<p class="note">'+(r.rest.length-near.length)+' more over 30 min away.</p>':'');}
  const unEl=d.querySelector("#unpriced");if(unEl)unEl.innerHTML=r.unpriced.slice(0,20).map(row=>'<button type="button" class="item unp" data-id="'+esc(row.p.id)+'"><span class="ms" data-ms="£?" style="--ms:14px;min-width:64px"></span><div style="min-width:0"><h3>'+esc(row.p.name)+'</h3><div class="meta">Price not checked. Snap the menu →'+(row.o.unknown?' · hours not checked':'')+'</div></div><div class="walk">'+row.walk+' min<small>walk</small></div></button>'+askAfter(row,true)).join("");
  d.addEventListener("click",e=>{const ra=e.target.closest(".ratask");if(ra){const pl=allPlaces().find(p=>p.id===ra.dataset.place);openTeach(pl||null);return;}
    const b=e.target.closest(".item");if(!b)return;if(b.classList.contains("citem")){const x=cr&&cr.singles.filter(y=>y.row)[Number(b.dataset.ci)];if(x)openSheet(x.row);return;}if(b.classList.contains("unp")){const u=r.unpriced.find(x=>x.p.id===b.dataset.id);if(u)openTeach(u.p);return;}const row=r.fit.concat(r.rest).find(x=>x.p.id===b.dataset.id);if(row)openSheet(row);});
  d.querySelectorAll(".views button").forEach(b=>b.onclick=()=>{UI.view=b.dataset.view;render();});
  const sa=d.querySelector("#seeAll");if(sa)sa.onclick=()=>{const box=d.querySelector("#allBox");box.hidden=false;msRender(box);sa.hidden=true;};
  if(UI.view==="map"){const priced=new Set(r.fit.slice(0,8).map(x=>x.p.id));const card=d.querySelector("#mapCard");
    const showRow=row=>{card.innerHTML=pickCard(row,t,{compact:true,label:row.fits?(row===r.fit[0]?"Fiver’s pick":"On the map"):"Out of reach"});msRender(card);
      card.querySelector("[data-open]").onclick=()=>openSheet(row);card.querySelectorAll(".teach").forEach(b=>b.onclick=()=>openTeach(row.p));
      d.querySelectorAll(".pin.sel,.rpin.sel").forEach(e=>e.classList.remove("sel"));d.querySelectorAll(".pin.top,.rpin.top").forEach(e=>e.classList.remove("top"));
      d.querySelectorAll('.pin[data-id="'+row.p.id+'"],.rpin[data-id="'+row.p.id+'"]').forEach(e=>e.classList.add("sel"));
      if(card.scrollIntoView)card.scrollIntoView({block:"nearest",behavior:"smooth"});};
    setTimeout(()=>{const m=view.querySelector("#mapbox2");if(m)mountMap(m,{pins:r.fit.slice(0,80).concat(r.rest.filter(x=>x.walk<=state.mins+10).sort((a,b)=>a.walk-b.walk).slice(0,40)),priced,top:r.fit[0]?[r.fit[0].p.id]:[],pick:showRow});},0);}
  if(combo){d.querySelectorAll("[data-combo]").forEach(b=>b.onclick=()=>openSheet(cr.combos[Number(b.dataset.combo)].rows.find(Boolean)));
    d.querySelectorAll(".ccard .chead").forEach(h=>h.onclick=()=>{const det=h.parentNode.querySelector(".cdetail");const op=det.hidden;det.hidden=!op;h.setAttribute("aria-expanded",String(op));h.parentNode.classList.toggle("open",op);});if(freeTop)d.querySelectorAll('.hero.compact [data-open]').forEach(b=>b.onclick=()=>openSheet(freeTop));}
  else if(r.fit.length){if(UI.view!=="map"){d.querySelector("#open0").onclick=()=>openSheet(r.fit[0]);wireAsk(d,r);if(r.cheapest)d.querySelectorAll('.hero.compact [data-open]').forEach(b=>b.onclick=()=>openSheet(r.cheapest));}}
  else{const u=lastRank._unlock;const q=s=>d.querySelector(s);
    if(q("#fixQ"))q("#fixQ").onclick=()=>{state.q="";UI.spec=false;persist();render();};
    if(q("#fixB"))q("#fixB").onclick=()=>{state.budget=Math.min(MAX_BUDGET,u.budget);persist();render();};
    if(q("#fixM"))q("#fixM").onclick=()=>{state.mins=u.mins;persist();render();};
    if(q("#fixBoth"))q("#fixBoth").onclick=()=>{state.budget=Math.min(MAX_BUDGET,Math.ceil(u.both.pr.price*2)/2);state.mins=Math.min(MAX_WALK,Math.ceil(u.both.walk/5)*5);persist();render();};
    if(q("#fixC"))q("#fixC").onclick=()=>{state.cats=new Set(CATS.map(c=>c.id));persist();render();};
    if(q("#fixTm"))q("#fixTm").onclick=()=>{state.dayOff=1;state.minute=12*60+30;UI.later=true;render();};
    if(q("#fixT"))q("#fixT").onclick=()=>{UI.later=true;render();const b=view.querySelector("#laterBox");if(b&&b.scrollIntoView)b.scrollIntoView({block:"center",behavior:"smooth"});};
    if(q("#fixL"))q("#fixL").onclick=()=>go(S.where);}
  return d;
}

/* No food type ticked: no list. The rat naps; free food open now (or about to start) still comes first. */
function vSleepy(){
  const r=rank();lastRank=r;const t=r.t;const ctx=["sleepy",(state.where||{}).label,state.uni].join("|");let m=moment("sleepy",ctx);
  const firstRun=!lsGet("fiver.tapped");if(firstRun)m={pose:"sleep",line:"Tap what you fancy. I’ll find it under a fiver."}; // first launch: nothing ticked yet
  const free=[],soon=[]; // no free food on the sleepy screen: that lives under Free stuff
  const body=filtersHTML()+free.map((x,i)=>pickCard(x,t,{compact:true,label:i?"Also free near you":"Free food near you"})).join("")+soon.map(x=>'<div class="hero pick compact"><div class="k">Free food soon</div><span class="ms" data-ms="'+esc(x.p.name)+'" style="--ms:16px"></span><p class="lead">'+esc(x.of.item)+'</p><p class="meta"><b>Starts at '+fmt(x.at)+'</b> · '+x.walk+' min walk</p></div>').join("")+
    '<div class="sleepy"><button type="button" class="linkbtn" id="showAll">Or show me everything open now →</button></div>';
  const d=stage("sleepy",m.pose,m.line,body,'',S.results);
  wireFilters(d);{const fl=d.querySelector("#fitLine");if(fl)fl.textContent="";}
  const hintOK=firstRun&&tourDone()===false&&!tourCan(); // the tour replaces the arrow; never both
  if(hintOK&&!UI.arrowUntil)UI.arrowUntil=Date.now()+3000; // 3 s from the first time it shows, even if the screen re-draws
  const left=UI.arrowUntil?UI.arrowUntil-Date.now():0;
  if(hintOK&&left>200){const cc=d.querySelector("#catChips");if(cc){const a=document.createElement("div");a.className="taphint";a.setAttribute("aria-hidden","true");
    a.innerHTML='<svg viewBox="0 0 28 40" width="26" height="38"><path d="M14 3v30M5 24l9 10 9-10" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';a.style.setProperty("--out",Math.max(0,left-350)+"ms");cc.parentNode.insertBefore(a,cc);setTimeout(()=>a.remove(),left);}}d.querySelector("#showAll").onclick=()=>{state.cats=new Set(CATS.map(c=>c.id));persist();render();};
  d.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{const row=r.fit.find(x=>x.p.id===b.dataset.open);if(row)openSheet(row);});
  d.querySelectorAll(".teach").forEach(b=>b.onclick=()=>openTeach(b.dataset.teach?allPlaces().find(p=>p.id===b.dataset.teach):null));
  return d;}
/* Free food that starts within the next 45 minutes, near enough to walk to */
function freeSoon(t){const here=state.where||VENUES[0];const out=[];
  for(const p of allPlaces()){const of=p.offers.find(o=>o.cat==="free"&&(!o.uniOnly||p.uni===state.uni));if(!of)continue;const o=isOpen(p,t);if(o.open)continue;
    const at=p.when?(p.when.date===t.dateISO?hm(p.when.start):null):(o.next&&o.next.k===0?o.next.at:null);if(at===null||at<t.minutes||at-t.minutes>45)continue;
    const walk=Math.max(1,Math.round(metres(here,p)/80));if(walk>Math.max(state.mins,15))continue;out.push({p,of,at,walk});}
  return out.sort((a,b)=>a.at-b.at||a.walk-b.walk).slice(0,2);}
function dmy(iso){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||"");return m?Number(m[3])+" "+["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m[2])-1]+" "+m[1]:"";}
const PSTATUS={delivery:"Price from Deliveroo, usually less in store.",web:"Price: the chain’s own menu, Sept–Oct 2026.",screen:"Prices can change. Check the screen.",board:"Prices can change. Check the board.",bk:"BK offer, check in the app or at the till. Prices can change. Check the screen.",uni:"Price: the university’s own food pages, Oct 2026. Student price where it says so.","guide-hint":"Price: UCL says “under a fiver”; exact menu price to confirm.",press:"Price: press, 2025–26.",photo:"Price: menu photographed in store, 13 Oct 2026. Takeaway; sitting in can cost more.",tracked:"Price: UK price tracker, Oct 2026. London can be a touch higher.",fan:"Price: fan site, Oct 2026. London shelf price may be a step higher.",avg:"Price: UK average, 2025–26. Central London usually 15–25% more.",event:"",added:"Prices can change. Check the board.",app:"Price: Food at UCL app, 13 Oct 2026.",web:"Price: the shop’s own website, Oct 2026.",est:"Price: estimate, to confirm."};
/* ---------- The menu by section, in a place's details (08/11/2026) ----------
   One tab per section, named exactly as on the menu (offer.section), in menu order. More than 7: the smallest go together in "Other".
   Inside: the dish on the left, your price on the right (fixed-width figures). One section or none: the list as before. */
function menuTabs(p){const offers=(p.offers||[]).filter(o=>o&&o.item&&typeof o.price==="number");if(offers.length<2)return null;
  const order=[],count={};let loose=0;for(const o of offers){const s=String(o.section||"").trim();if(!s){loose++;continue;}if(!(s in count)){order.push(s);count[s]=0;}count[s]++;}
  if(order.length<2)return null; // one section or none: the list as before (dishes with no section go in "Other")
  let tabs=order.slice();if(loose&&!tabs.some(x=>x.toLowerCase()==="other"))tabs.push("Other");if(tabs.length>7){const keep=order.slice().sort((a,b)=>count[b]-count[a]||order.indexOf(a)-order.indexOf(b)).filter(x=>x.toLowerCase()!=="other").slice(0,6);tabs=order.filter(x=>keep.includes(x)).concat("Other");}
  const tabOf=o=>{const s=String(o.section||"").trim();return tabs.includes(s)?s:(tabs.find(x=>x.toLowerCase()==="other")||"Other");};
  return {tabs,tabOf,offers};}
function menuTabsHTML(row,t){const m=menuTabs(row.p);const cur=row.of.section&&m.tabOf(row.of)||m.tabs[0];
  return '<div class="k" style="margin-top:12px">Menu</div><div class="mtabs" id="mTabs" role="tablist" aria-label="Menu sections">'+m.tabs.map((s,i)=>'<button type="button" role="tab" class="mtab'+(s===cur?" on":"")+'" aria-selected="'+(s===cur)+'" data-tab="'+i+'">'+esc(s)+'</button>').join("")+'</div>'+
    m.tabs.map((s,i)=>'<div class="mlist" role="tabpanel" data-panel="'+i+'"'+(s===cur?'':' hidden')+'>'+m.offers.filter(o=>m.tabOf(o)===s).map(o=>'<div class="mrow'+(o===row.of?" cur":"")+'"><span class="mname">'+esc(o.item)+(state.diet.size&&dietCheck(o).hide?' <span class="note">(not for you)</span>':'')+'</span><span class="mprice">'+money(bestPrice(row.p,o,t).price)+'</span></div>').join("")+'</div>').join("");}
function wireMenuTabs(host){const bar=host.querySelector("#mTabs");if(!bar)return;bar.addEventListener("click",e=>{const b=e.target.closest(".mtab");if(!b)return;
  bar.querySelectorAll(".mtab").forEach(x=>{const on=x===b;x.classList.toggle("on",on);x.setAttribute("aria-selected",String(on));});
  host.querySelectorAll(".mlist").forEach(l=>{l.hidden=l.dataset.panel!==b.dataset.tab;});});}
function openSheet(row){
  const host=document.getElementById("sheetHost");const t=row.t||selectedTime();const rows=ladder(row.p,row.of,t);
  const src=row.p.status==="guide"?'<span class="badge ok">'+(row.p.uni?esc(uniShort(row.p.uni))+" food pages":"Food at UCL guide")+'</span>':row.p.status==="event"?'<span class="badge ok">confirmed event</span>':row.p.status==="added"?'':'<span class="badge">'+(row.p.status==="approx"?"hours to confirm":"address checked")+'</span>';
  const pstatus=(row.of.status==="photo"&&row.of.checked?"Price: menu photographed in store, "+dmy(row.of.checked)+". Takeaway; sitting in can cost more.":row.of.status==="uni"&&row.p.uni?"Price: "+uniShort(row.p.uni)+" food pages, Oct 2026. Student price where it says so.":PSTATUS[row.of.status]!==undefined?PSTATUS[row.of.status]:PSTATUS.est)+(row.of.check?" Check at the till.":"")+(row.of.checkGo?" Check before you go.":"")+(row.of.uniOnly?" "+uniShort(row.p.uni)+" students only.":"");
  const dl=state.diet.size?dietLabel(row.of):"";
  host.innerHTML='<div class="sheetWrap" id="sheetWrap"><div class="sheet" role="dialog" aria-modal="true" aria-label="'+esc(row.p.name)+'">'+
    '<button class="close" id="closeSheet">Close</button>'+
    '<span class="ms" data-ms="'+esc(row.p.name)+'" style="--ms:18px"></span><p class="meta">'+esc(row.p.addr||"")+src+'</p>'+
    '<p class="lead">'+esc(row.of.item)+'</p><p class="meta"><b>'+esc(statusLine(row,t))+'</b></p>'+(row.p.placeId?'<p class="meta glive" id="gLive">Live info from Google…</p>':'')+
    '<p class="meta">'+breakdown(row)+(row.of.in?' · '+money(row.of.in)+' if you sit in':'')+'</p>'+(row.p.why?'<p class="body">'+esc(row.p.why)+'</p>':'')+
    (dl?'<p class="diet">Diet: '+esc(dl)+'. Allergens change: ask staff.</p>':'')+
    tipsFor(row.p).map(x=>'<p class="tipline">Tip from a student · not checked yet: '+esc(x)+'</p>').join("")+
    '<div class="chips"><a class="chip" data-walk="'+esc(row.p.id)+'" href="'+gmaps(row.p)+'" target="_blank" rel="noopener">'+PIN+' Walk there</a>'+whyBtn(row)+'</div><div class="whyOut" hidden></div>'+
    '<div class="k" style="margin-top:10px">Your price</div><div class="prices">'+rows.map(x=>'<div class="pr'+(x.mine&&!x.promo?" mine":"")+'"><div>'+esc(x.label)+(x.mine&&x.label!=="No card"&&x.label!=="Everyone"?' · you have it':'')+(x.note?'<span class="why">'+esc(x.note)+'</span>':'')+'</div><span class="ms'+(x.mine&&!x.promo?' wine':'')+'" data-ms="'+money(x.price)+'" style="--ms:13px"></span></div>').join("")+'</div>'+
    (row.p.drinkRef&&isMeal(row.of)?'<p class="note">With a drink ≈ '+money(row.pr.price+row.p.drinkRef)+'</p>':'')+(row.p.service?'<p class="note">'+esc(row.p.serviceNote||'+ optional 12.5% service')+'</p>':'')+
    (row.p.chain==="burgerking"&&(t.day===4||t.day===5)?'<p class="note">Today: 15% off orders of £15 or more (Thursdays and Fridays).</p>':'')+(row.of.perPerson?'<p class="note">'+money(row.of.perPerson)+' each if you share.</p>':'')+(row.of.label?'<p class="note">'+esc(row.of.label)+'</p>':'')+
    (row.of.cat==="deal"&&row.p.deal&&DEALS[row.p.deal]&&DEALS[row.p.deal].note?'<p class="note">'+esc(DEALS[row.p.deal].note)+'</p>':'')+
    (row.p.promos&&row.p.promos.length?'<p class="note">'+row.p.promos.map(x=>esc(x.label)+(x.card&&state.cards.has(x.card)?" · you have it":"")).join("<br>")+'</p>':'')+
    (row.p.ucl&&state.cards.has("foodatucl")?'<p class="note">Food at UCL app: 1 point = £0.05 on every purchase; 9 stamps on barista drinks, 10th free; first coffee free on download.</p>':'')+
    (row.p.chainPrice||row.of.chainPrice||(row.p.uniBranch&&row.p.chain&&!row.p.unpriced)?'<p class="note"><b>Chain price · can vary by shop</b></p>':'')+(pstatus?'<p class="note">'+pstatus+'</p>':'')+'<p class="note"><button type="button" class="linkbtn" id="sheetTeach">Is this still right? Snap the menu →</button></p>'+
    '<details class="sub about" id="aboutPlace"><summary>About this place</summary>'+attrsHTML(visitKey(row.p))+'</details>'+
    (menuTabs(row.p)?menuTabsHTML(row,t):row.p.offers.length>1?'<div class="k" style="margin-top:10px">Also here</div><p class="note">'+row.p.offers.filter(o=>o!==row.of).map(o=>esc(o.item)+(o.price!=null||row.p.deal?" · "+money(bestPrice(row.p,o,t).price):"")+(state.diet.size&&dietCheck(o).hide?" (not for you)":"")).join(" · ")+'</p>':'')+
    '</div></div>';
  msRender(host);
  const wrap=document.getElementById("sheetWrap");const close=()=>{host.innerHTML="";};
  document.getElementById("closeSheet").onclick=close;wrap.addEventListener("click",e=>{if(e.target===wrap)close();});
  document.addEventListener("keydown",function onk(e){if(e.key==="Escape"){close();document.removeEventListener("keydown",onk);}});
  const st=document.getElementById("sheetTeach");if(st)st.onclick=()=>openTeach(row.p);wireMenuTabs(host);wireAttrs(host);
  const gl=document.getElementById("gLive");if(gl)gpLive(row.p.placeId).then(x=>{if(!document.body.contains(gl))return;if(!x){gl.textContent="Live info needs a connection";return;}
    const K=["sun","mon","tue","wed","thu","fri","sat"],h=x.hours?(x.hours[K[t.day]]!==undefined?x.hours[K[t.day]]:t.day===0?x.hours.sun:t.day===6?x.hours.sat:x.hours.wk):undefined;
    const bits=[];if(h)bits.push("Today "+h[0]+"–"+(h[1]==="23:59"?"midnight":h[1]));else if(x.hours&&h===null)bits.push("Closed today");if(typeof x.rating==="number")bits.push("Rated "+x.rating.toFixed(1)+(x.ratingN?" ("+x.ratingN+" ratings)":""));
    gl.innerHTML=bits.length?esc(bits.join(" · "))+' · <span class="gpow">from Google</span>':'';if(!bits.length)gl.hidden=true;});
  document.getElementById("closeSheet").focus();
}

/* ---------- MENU: name, cards & apps (what each unlocks), diet, teach Fiver, install ---------- */
const menuOpen=new Set();
/* Teach Fiver: snap a menu, paste an invite. Opens from the camera up top and from the hints. */
/* Your uni's canteens that only have their campus point: Google finds the real one (name + campus), once, kept 30 days on this phone. */
function refineUniPlaces(){if(!state.uni||state.uni==="other")return;
  const list=UNI_PLACES.filter(p=>p.approxLL&&p.uni===state.uni).map(p=>({key:"u:"+p.id,text:p.name+", "+p.addr+", London",near:{lat:p.lat,lon:p.lon},radius:1500,maxM:1500}));
  geoRefine(list,25,()=>{_uniPlaces=null;});}
function openTeach(place,resume){
  const host=document.getElementById("sheetHost");
  host.innerHTML='<div class="sheetWrap" id="sheetWrap"><div class="sheet menu" role="dialog" aria-modal="true" aria-label="Teach Fiver"><button class="close" id="closeSheet">Close</button>'+
    '<h2 class="sr">Teach Fiver</h2><div class="thead" id="teachHead">'+signRat(190)+'<p class="lead">'+esc(moment("teach","teach").line)+'</p></div>'+
    '<div class="trow" id="trow"><button type="button" class="tst" data-s="1">'+PIN+'<span>Where'+TICK+'</span><small id="ts1"></small></button><i></i><button type="button" class="tst" data-s="2">'+CAM+'<span>Menu'+TICK+'</span><small id="ts2"></small></button><i></i><button type="button" class="tst" data-s="3">'+PAW+'<span>Send'+TICK+'</span><small id="ts3">+10 crumbs</small></button></div>'+
    '<div class="tpanel" id="t1"><p class="note">'+(place?'Is <b>'+esc(place.name)+'</b> still right?':'Which café, shop or address?')+'</p><p class="meta" id="tAt" hidden></p><div id="tFind"><div class="combo"><div class="wishrow"><span class="iconbtn" aria-hidden="true">'+SRCH+'</span><input class="line" id="tWhereIn" placeholder="Search a café, restaurant or address" autocomplete="off" style="font-family:var(--body);font-style:normal;font-size:16px"><button type="button" class="iconbtn" id="tWhereClear" aria-label="Close" hidden>'+X+'</button></div><div class="list" id="tWhereList" hidden></div></div>'+
      '<div class="chips" style="margin-top:8px"><button type="button" class="chip" id="tGeo">'+PIN+' Use my location</button></div><p class="meta" id="tWhereNote"></p><div class="nearlist" id="tNear" hidden></div></div>'+
      '<div id="tShopAsk" hidden><input class="line" id="tShopIn" placeholder="Shop name" autocomplete="off" style="font-family:var(--body);font-style:normal;font-size:16px"></div>'+
      '<div class="chips tgate" style="margin-top:12px"><button type="button" class="chip off" id="tPhotoGate" aria-disabled="true">'+CAM+' Take a photo</button></div><p class="meta" id="tGateNote">Pick a place first</p></div>'+
    '<div class="tpanel" id="t2" hidden><div class="chips" id="tPhotoRow"><label class="chip">'+CAM+' Take a photo<input type="file" id="menuFile" accept="image/*" capture="environment" hidden></label><label class="chip">Choose a photo<input type="file" id="menuFile2" accept="image/*" multiple hidden></label><button type="button" class="chip" id="tTypeBtn">Type it instead</button><button type="button" class="chip" id="tDealBtn">Tell me a deal</button></div>'+
      '<div id="tTypeBox" hidden style="margin-top:8px"><textarea id="tTypeIn" class="line" rows="3" placeholder="Flat white £2.60, sausage roll £1.85…" style="font-family:var(--body);font-style:normal;font-size:15px"></textarea><div class="chips" style="margin-top:6px"><button type="button" class="chip" id="tTypeGo">Read it</button></div></div><div id="tDealBox" hidden style="margin-top:10px"><div class="chips" id="tDealKind"><button type="button" class="chip" data-k="student">Student discount</button><button type="button" class="chip" data-k="oneoff">One-off offer</button></div>'+
        '<div id="tDealStudent" hidden><input class="line" id="tDealAmt" placeholder="How much? 10% or £1 off" maxlength="40" autocomplete="off" style="font-family:var(--body);font-style:normal;font-size:16px"><div class="k" style="margin-top:10px">What do you show?</div><div class="chips" id="tDealShow">'+DEAL_SHOW.map(x=>'<button type="button" class="chip" data-show="'+esc(x)+'">'+esc(x)+'</button>').join("")+'</div></div>'+
        '<div id="tDealOne" hidden><input class="line" id="tDealWhat" placeholder="What is it? Free cookie with any coffee" maxlength="80" autocomplete="off" style="font-family:var(--body);font-style:normal;font-size:16px"><div class="k" style="margin-top:10px">Until when?</div><input type="date" class="line" id="tDealEnd" style="font-family:var(--body);font-style:normal;font-size:16px"><p class="note">No date? I’ll keep it for 3 days.</p></div>'+
        '<div id="tDealNameBox" hidden><input class="line" id="tDealName" placeholder="Name as it is on the shop sign" maxlength="40" autocomplete="off" style="font-family:var(--body);font-style:normal;font-size:16px;margin-top:8px"></div>'+
        '<div class="act" id="tDealAct" hidden style="margin-top:8px">'+navNext("tDealSend","Send to Fiver")+'</div><p class="note" id="tDealNote"></p></div>'+
      '<p class="limitbox" id="tLimit" role="status" hidden></p><p class="note" id="menuNote"></p><p class="note" id="tCheck"></p><div class="chips" id="tWhich"></div><div id="menuOut"></div></div>'+
    '<div class="tpanel" id="t3" hidden><div id="sendBox"></div></div>'+
    '<p class="note" style="margin-top:14px"><b id="teachRank">'+(state.crumbs||0)+' crumbs · '+esc(rankName(state.crumbs||0))+'</b>. A menu photo accepted is +10, a typed menu +3. Thanks for teaching me. Everyone nearby will see it.</p>'+
    '</div></div>';
  msRender(host);
  const wrap=document.getElementById("sheetWrap");const sheet=wrap.querySelector(".sheet");const close=()=>{host.innerHTML="";};
  document.getElementById("closeSheet").onclick=close;wrap.addEventListener("click",e=>{if(e.target===wrap)close();});
  document.addEventListener("keydown",function onk(e){if(e.key==="Escape"){close();document.removeEventListener("keydown",onk);}});
  wireMenu(sheet,place,resume);refineUniPlaces();
}
function signRat(w){ // s_sign with "TEACH FIVER" written on the board, in the brand lettering
  const [W,H]=ARTW.s_sign;const h=Math.round(w*H/W);
  return '<div class="signwrap" style="width:'+w+'px;height:'+h+'px">'+svgOf("s_sign",w,h)+'<span class="ms signtxt" data-ms="Teach Fiver" style="--ms:'+Math.round(w*0.06)+'px"></span></div>';
}
function teachFace(sheet,face,line){const h=sheet.querySelector("#teachHead");if(h)h.innerHTML=rat(face,84)+'<p class="lead">'+esc(line)+'</p>';}
function teachCelebrate(sheet,n,first){ // Fiver celebrates a contribution; crumbs are recognition only
  const before=rankName(state.crumbs||0);addCrumbs(n);const after=rankName(state.crumbs||0);
  const h=sheet.querySelector("#teachHead");if(h)h.innerHTML=rat("cheer",96)+'<p class="lead">'+(first?esc(first)+' ':'')+'+'+n+' crumbs. The pigeons are furious.</p>';
  const r=sheet.querySelector("#teachRank");if(r)r.textContent=(state.crumbs||0)+" crumbs · "+after;
  if(after!==before&&h)setTimeout(()=>{if(h.isConnected)h.innerHTML=rat("f_hearts",84)+'<p class="lead">'+esc(after)+'. The pigeons have heard of you.</p>';},2600);
}
/* Asking for photos at the right moment, never a window over everything */
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){}}
const VISITS=(()=>{const n=Number(lsGet("fiver.visits")||0)+1;lsSet("fiver.visits",String(n));return n;})();
// "Walk there" tapped: back in the app within 2 hours, one line at the top asks for the board
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest("a[data-walk]");if(!a)return;const p=allPlaces().find(x=>x.id===a.dataset.walk);lsSet("fiver.walked",JSON.stringify({id:a.dataset.walk,name:p&&p.coordSource!=="google"&&!p.nameLive?p.name:"",t:Date.now()}));UI.walkBack=false;track("walk");},true);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&lsGet("fiver.walked")){UI.walkBack=true;if(state.step===S.results)paintWalkBack();}});
UI.walkBack=!!lsGet("fiver.walked");
if(state.seenResults||state.cats.size)lsSet("fiver.tapped","1"); // not a first launch
function walkedRecent(){try{const w=JSON.parse(lsGet("fiver.walked")||"null");if(!w||!w.t)return null;if(Date.now()-w.t>2*3600e3){lsSet("fiver.walked",null);return null;}return w;}catch(e){return null;}}
function paintWalkBack(){const old=document.getElementById("walkBack");if(old)old.remove();const w=UI.walkBack&&walkedRecent();if(w&&!w.name){const p=allPlaces().find(x=>x.id===w.id);if(p)w.name=p.name;}if(!w||!w.name||!view.firstChild)return;
  const el=document.createElement("div");el.id="walkBack";el.className="nudge top";el.innerHTML='<button type="button" class="nudgetxt">'+CAM+'<span>Did you go to '+esc(w.name)+'? Snap the board, it takes 10 seconds.</span></button><button type="button" class="nudgex" aria-label="Close">'+X+'</button>';
  view.insertBefore(el,view.firstChild);
  el.querySelector(".nudgetxt").onclick=()=>{lsSet("fiver.walked",null);el.remove();openTeach(allPlaces().find(p=>p.id===w.id)||null);};
  el.querySelector(".nudgex").onclick=()=>{lsSet("fiver.walked",null);el.remove();};}
// from the second visit, a small line at the bottom; closed once, never again
function paintSnapTip(){if(VISITS<2||lsGet("fiver.snapTipOff"))return;const el=document.createElement("div");el.id="snapTip";el.className="nudge bottom";
  el.innerHTML='<button type="button" class="nudgetxt">'+CAM+'<span>Every menu you snap helps a student eat for less.</span></button><button type="button" class="nudgex" aria-label="Close">'+X+'</button>';view.appendChild(el);
  el.querySelector(".nudgetxt").onclick=()=>openTeach();el.querySelector(".nudgex").onclick=()=>{lsSet("fiver.snapTipOff","1");el.remove();};}

/* ---------- TOUR: the rat walks to each thing, points, says one line. Next / Skip; fiver.tour; never blocks anything if it fails ---------- */
const TOUR={on:false,i:0,steps:[],timer:null,anim:null,x:-90,y:0,full:false,snap:null,opened:false};
function tourDone(){return lsGet("fiver.tour")==="done";}
function tourSnap(){return {cats:new Set(state.cats),subs:(state.subs||[]).slice(),catOrder:(state.catOrder||[]).slice(),drinks:state.drinks,dsub:state.dsub,q:state.q,view:UI.view,lastCat:UI.lastCat};}
function tourRestore(){const s=TOUR.snap;if(!s)return;Object.assign(state,{cats:s.cats,subs:s.subs,catOrder:s.catOrder,drinks:s.drinks,dsub:s.dsub,q:s.q});UI.view=s.view;UI.lastCat=s.lastCat;}
function tourCloseSheet(){if(TOUR.opened){const h=document.getElementById("sheetHost");if(h)h.innerHTML="";TOUR.opened=false;}}
const TOUR_SHORT=[
  {sel:"#catChips",text:"Tap what you fancy. Pick more than one if you’re greedy."},
  {sel:"#searchTile",text:"Know exactly what you want? Type it or say it."},
  {sel:"#howChips",text:"Your budget, how far you’ll walk, where you are. I do the maths."},
  {pre:()=>tourCards(),sel:"#view .hero.pick, #view .ccard",text:"Tap a place. ‘Your price’ is with your student cards, and I tell you what to show at the till."},
  {sel:"#view .views",text:"Prefer a map? Here."},
  {sel:"#teachBtn",text:"Snap a menu and everyone eats cheaper. Even me."}];
// no food type ticked when the tour starts: Hot food, for the tour only (put back at the end or on Skip)
function tourCards(){if(document.querySelector("#view .hero.pick, #view .ccard"))return;if(state.cats.size||state.q)return;state.drinks=false;state.cats=new Set(["hot"]);TOUR.changed=true;render();}
function tourCan(){return !/jsdom/i.test(navigator.userAgent||"");}
function tourFull(){const S0=TOUR_SHORT;const back=()=>{tourCloseSheet();tourRestore();UI.view="list";render();};
  return [S0[0],
    {pre:()=>{if(!document.querySelector("#subChips")){state.drinks=false;state.q="";state.cats=new Set(["coffee"]);state.catOrder=["coffee"];UI.lastCat="coffee";render();}},sel:"#subChips",text:"Narrow it down. Coffee, not tea."},
    {pre:()=>{state.drinks=false;state.q="";state.cats=new Set(["coffee","sweet"]);state.catOrder=["coffee","sweet"];state.subs=[{cat:"coffee",id:"coffee"},{cat:"sweet",id:"doughnut"}];UI.view="list";UI.lastCat="sweet";render();},sel:"#view .ccard",text:"Pick two things, I’ll add them up."},
    Object.assign({pre:back},S0[1]),S0[2],S0[3],
    {sel:"#view .hero.pick a[data-walk]",text:"One tap and Google Maps walks you there."},
    S0[4],
    {sel:"#laterChip",text:"Planning ahead? Pick a day and a time."},
    {sel:"#view .bubble",text:"Tap my bubble for more. I talk a lot."},
    {sel:"#home",text:"Tap the logo to start again."},
    {sel:"#seeAll",text:"See all: everything that fits, then what’s opening later."},
    {sel:'#catChips .cat-tile[data-id="drinks"]',text:"Drinks are 18+. Alcohol-free option always on top."},
    {sel:'#catChips .cat-tile[data-id="free"]',text:"Free food. My favourite price."},
    S0[5],
    {pre:()=>{openTeach();TOUR.opened=true;const t2=document.querySelector("#t2");if(t2)t2.hidden=false;},sel:"#tTypeBtn",text:"No photo? Type the menu instead."},
    {sel:"#teachRank",text:"Every menu earns crumbs. Climb the ranks."},
    {pre:()=>{tourCloseSheet();openMenu();TOUR.opened=true;},sel:"#m-cards > summary",text:"Cards & apps: tell me your cards, I’ll find your discounts."},
    {sel:"#m-diet > summary",text:"Diet & allergies: I tell you what to check with staff."},
    {sel:"#m-install > summary",text:"Install the app. I live on your home screen, rent-free."},
    {sel:"#m-sources > summary",text:"Where prices come from. Every price says where I got it."},
    {pre:back,sel:null}];}
function tourEl(){let el=document.getElementById("tour");if(el)return el;el=document.createElement("div");el.id="tour";el.className="tour";
  const fr=k=>'<span class="tf" data-f="'+k+'">'+rat(k,74)+'</span>';
  el.innerHTML='<div class="tblock"></div><div class="tspot"></div><div class="trat">'+["walk1","walk2","walk3","walk4","point","wave"].map(fr).join("")+'</div><div class="tbub" role="dialog" aria-live="polite"><p class="ttxt"></p><div class="tbtns"><button type="button" class="arrbtn" id="tourNext"><span class="ms" data-ms="Next" style="--ms:11px"></span>'+AR+'</button><button type="button" class="linkbtn" id="tourSkip">Skip</button></div></div>';
  document.body.appendChild(el);msRender(el);
  el.querySelector("#tourNext").onclick=()=>{if(TOUR.i>=TOUR.steps.length){endTour();return;}tourGo(TOUR.i+1);};
  el.querySelector("#tourSkip").onclick=()=>endTour();return el;}
function tourFrame(k){const el=document.getElementById("tour");if(!el)return;el.querySelectorAll(".tf").forEach(f=>f.classList.toggle("on",f.dataset.f===k));}
function startTour(full){if(TOUR.on)return;try{TOUR.on=true;TOUR.full=!!full;TOUR.changed=false;TOUR.snap=tourSnap();TOUR.steps=full?tourFull():TOUR_SHORT.slice();TOUR.x=-90;TOUR.y=Math.round(innerHeight*0.35);
    const el=tourEl();el.classList.add("show");tourFrame("walk1");const r=el.querySelector(".trat");r.style.transition="none";r.style.left=TOUR.x+"px";r.style.top=TOUR.y+"px";tourGo(0);}catch(e){endTour();}}
function endTour(){try{clearTimeout(TOUR.timer);clearInterval(TOUR.anim);const el=document.getElementById("tour");if(el)el.remove();lsSet("fiver.tour","done");
    const was=TOUR.on;TOUR.on=false;if(was&&(TOUR.full||TOUR.changed)){tourCloseSheet();tourRestore();render();}TOUR.opened=false;TOUR.changed=false;}catch(e){}}
function tourGo(i){if(!TOUR.on)return;try{clearTimeout(TOUR.timer);TOUR.i=i;const el=tourEl();el.querySelector(".tbub").classList.remove("in");
    if(i>=TOUR.steps.length)return tourFinal();const st=TOUR.steps[i];
    if(st.pre){try{st.pre();}catch(e){}}if(!st.sel)return tourGo(i+1);
    TOUR.timer=setTimeout(()=>{try{const t=[...document.querySelectorAll(st.sel)].find(x=>x.getClientRects().length&&!x.closest("[hidden]"));if(!t)return tourGo(i+1); // not on this screen: next stop
      t.scrollIntoView({block:"center"});setTimeout(()=>tourPlace(t,st.text),60);}catch(e){endTour();}},st.pre?320:0);}catch(e){endTour();}}
const TOUR_RM=()=>!!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);
function tourWalk(x,y,done){const el=document.getElementById("tour");const r=el.querySelector(".trat");clearInterval(TOUR.anim);
  if(TOUR_RM()){r.style.transition="none";r.style.left=x+"px";r.style.top=y+"px";TOUR.x=x;TOUR.y=y;done();return;}
  r.classList.toggle("flip",x<TOUR.x-4);let f=0;const W=["walk1","walk2","walk3","walk4"];tourFrame(W[0]);TOUR.anim=setInterval(()=>{f=(f+1)%4;tourFrame(W[f]);},125); // 8 fps
  r.style.transition="left .6s linear, top .6s linear";requestAnimationFrame(()=>{r.style.left=x+"px";r.style.top=y+"px";});TOUR.x=x;TOUR.y=y;
  TOUR.timer=setTimeout(()=>{clearInterval(TOUR.anim);r.classList.remove("flip");done();},620);}
function tourBubble(text,ratX,ratY,above,last){const el=document.getElementById("tour");const b=el.querySelector(".tbub");b.querySelector(".ttxt").textContent=text;
  const nx=b.querySelector("#tourNext .ms");nx.dataset.ms=last?"Go eat":"Next";msRender(b);
  const bw=Math.min(330,innerWidth-32);b.style.width=bw+"px";b.style.left=Math.max(16,Math.min(innerWidth-bw-16,ratX-24))+"px";
  const bh=b.offsetHeight||110;let top=above?ratY-bh-8:ratY+84;top=Math.max(8,Math.min(innerHeight-bh-8,top));b.style.top=top+"px";b.classList.add("in");}
function tourPlace(t,text){if(!TOUR.on)return;const el=document.getElementById("tour");const r=t.getBoundingClientRect();const pad=6;
  const sp=el.querySelector(".tspot");Object.assign(sp.style,{left:(r.left-pad)+"px",top:(r.top-pad)+"px",width:(r.width+pad*2)+"px",height:(r.height+pad*2)+"px",opacity:"1"});
  const H=80;const below=r.bottom+H+150<innerHeight;const y=below?Math.round(r.bottom+8):Math.max(4,Math.round(r.top-H-6));
  const x=Math.max(8,Math.min(innerWidth-90,Math.round(r.left+Math.min(r.width/2,60)-36)));
  tourWalk(x,y,()=>{tourFrame("point");tourBubble(text,x,y,!below,false);});}
function tourFinal(){const el=document.getElementById("tour");const sp=el.querySelector(".tspot");Object.assign(sp.style,{left:"50%",top:"40%",width:"0px",height:"0px"});
  const x=Math.round(innerWidth/2-40),y=Math.round(innerHeight*0.36);tourWalk(x,y,()=>{tourFrame("wave");tourBubble("That’s it. Go eat.",x,y,false,true);});}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("#mTour");if(!b)return;const h=document.getElementById("sheetHost");if(h)h.innerHTML="";if(state.step!==S.results){state.step=S.results;render();}setTimeout(()=>startTour(true),250);});
// the first time on the main screen, after name, uni and diet; never over a sheet (install, 18+) and never on the Drinks screen
function maybeTour(){if(TOUR.on||tourDone()||state.step!==S.results||!state.setupDone||state.drinks||!tourCan())return;
  setTimeout(()=>{if(TOUR.on||tourDone()||state.step!==S.results||state.drinks||document.querySelector("#sheetWrap"))return;if(document.querySelector("#view #catChips"))startTour(false);},900);}
/* Tips from students ("Tell me a deal"): a line on the open card, never the price. One-offs stop after their date. */
const DEAL_SHOW=["Student ID","UNiDAYS","Student Beans","TOTUM","Nothing"];
function myTips(){try{const a=JSON.parse(localStorage.getItem("fiver.tips")||"[]");return Array.isArray(a)?a:[];}catch(e){return [];}}
function addTip(t){const a=myTips().filter(x=>!x.ends_at||Date.parse(x.ends_at)>Date.now());a.unshift(t);try{localStorage.setItem("fiver.tips",JSON.stringify(a.slice(0,50)));}catch(e){}}
function tipText(it,ends){const show=it.show&&it.show!=="Nothing"&&!/\bwith\b/i.test(it.text)?" with "+it.show:"";
  let until="";if(it.type==="oneoff"&&ends){const d=new Date(ends);if(!isNaN(d))until=" · until "+DAYS[d.getDay()]+" "+d.getDate()+" "+["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];}
  return it.text+show+until;}
function tipsFor(p){if(!p||typeof p.lat!=="number")return [];const now=Date.now(),out=[];
  const rows=myTips().concat((shared.rows||[]).filter(r=>r&&r.kind==="deal"&&r.device_id!==DEVICE_ID));
  for(const r of rows){if(r.ends_at&&Date.parse(r.ends_at)<=now)continue;const lat=Number(r.lat),lon=Number(r.lon);if(isNaN(lat)||isNaN(lon))continue;
    const same=(p.placeId&&r.place_id&&p.placeId===r.place_id)||(metres(p,{lat,lon})<=120&&nameKey(r.place_name||"").length&&nameKey(p.name||"").length&&nameMatch(p.name,r.place_name));
    if(!same)continue;for(const it of (Array.isArray(r.items)?r.items:[])){if(!it||typeof it.text!=="string"||!it.text.trim())continue;const t=tipText({type:it.type==="oneoff"?"oneoff":"student",text:it.text.slice(0,80),show:typeof it.show==="string"?it.show.slice(0,20):""},r.ends_at);if(!out.includes(t))out.push(t);}}
  return out.slice(0,3);}
/* The end of Teach: the price list goes, the rat says thanks, the crumbs and the rank; Teach another or Done */
const THANKS_X=["Legend. The next hungry student owes you one.","Menu saved. You’re officially a rat with a cause.","That board is now mine. And everyone’s."];
function teachThanks(sheet,box,n,status,lead){addCrumbs(n);const nm=firstName();const pose=Math.random()<0.5?"cheer":"f_excited";const extra=THANKS_X[Math.floor(Math.random()*THANKS_X.length)];
  ["#teachHead","#trow","#t1","#t2","#evtBox"].forEach(s=>{const e=sheet.querySelector(s);if(e)e.hidden=true;});const t3=sheet.querySelector("#t3");if(t3)t3.hidden=false;
  [sheet.querySelector("#evtOpen"),sheet.querySelector("#teachRank")].forEach(e=>{const pp=e&&e.closest("p");if(pp)pp.hidden=true;});
  box.innerHTML='<div class="thanks" id="tThanks">'+rat(pose,128)+'<p class="lead">'+(lead?esc(lead):'Thanks'+(nm?", "+esc(nm):"")+'! You just fed everyone near '+esc(areaName())+'.')+'</p>'+(lead?'':'<p class="body">'+esc(extra)+'</p>')+
    '<p class="crumbline"><b>+'+n+' crumbs · '+esc(rankName(state.crumbs||0))+'</b></p><div class="act">'+navNext("tAgain","Teach another")+'<button type="button" class="chip" id="tDone">Done</button></div><p class="note">'+esc(status)+'</p></div>';
  msRender(box);const r=sheet.querySelector("#teachRank");if(r)r.textContent=(state.crumbs||0)+" crumbs · "+rankName(state.crumbs||0);
  box.querySelector("#tAgain").onclick=()=>openTeach();box.querySelector("#tDone").onclick=()=>{document.getElementById("sheetHost").innerHTML="";};}
let savedT=null;
function saved(){ // a short "Saved." under the settings panel, every time something changes there
  let el=document.getElementById("savedToast");if(!el){el=document.createElement("div");el.id="savedToast";el.className="savedToast";el.setAttribute("role","status");el.textContent="Saved.";document.body.appendChild(el);}
  el.classList.add("on");clearTimeout(savedT);savedT=setTimeout(()=>el.classList.remove("on"),1400);}
function openMenu(section){
  if(section)menuOpen.add(section);
  const host=document.getElementById("sheetHost");const nm=firstName();
  const sec=(id,label,body)=>'<details id="m-'+id+'"'+(menuOpen.has(id)?' open':'')+'><summary>'+label+'</summary>'+body+'</details>';
  const kinds=[["student","Student discounts"],["app","Free apps with perks"],["loyalty","Loyalty cards"],["sub","Paid subscriptions"]];
  const keyBody='<div class="k" style="margin-top:14px">Claude on this phone (optional)</div><p class="note">An Anthropic API key unlocks “Why?”, the one-line wish and menu photos read on this phone. It is saved here only, never sent anywhere else.</p><div class="wishrow"><input class="line" id="keyIn" type="password" placeholder="sk-ant-…" autocomplete="off" value="'+esc(getKey())+'" style="font-family:var(--body);font-style:normal;font-size:15px"></div><div class="chips" style="margin-top:6px"><button type="button" class="chip on" id="keySave">Save on this phone</button><button type="button" class="chip" id="keyDrop">Remove</button></div><p class="note" id="keyNote">'+(getKey()?"Claude is on: key saved on this phone.":"No key: photos go through Fiver’s reader; “Why?” stays off.")+'</p>';
  const cardsBody='<p class="note">Tick what you have. Fiver prices everything with it.</p>'+kinds.map(([k,label])=>'<div class="k" style="margin-top:10px">'+label+'</div><div class="chips" data-cards>'+cardsFor().filter(c=>c.kind===k).map(c=>'<label class="chip'+(state.cards.has(c.id)?" on":"")+'"><input type="checkbox" value="'+c.id+'"'+(state.cards.has(c.id)?" checked":"")+'>'+esc(c.name)+'</label>').join("")+'</div>').join("")+
    '<details id="m-unlocks" class="sub"'+(menuOpen.has("unlocks")?' open':'')+'><summary>What each one unlocks'+(uniName()?" near "+esc(uniName()):"")+'</summary><div id="unlocks">'+
    cardsFor().slice().sort((a,b)=>(state.cards.has(b.id)?1:0)-(state.cards.has(a.id)?1:0)).map(c=>{const u=cardUnlocks(c.id);const on=state.cards.has(c.id);return '<details class="unl"><summary><span>'+esc(c.name)+' <span class="meta">· '+esc(c.cost)+(on?' · you have it':'')+'</span></span></summary>'+(u.length?'<div class="prices">'+u.slice(0,8).map(x=>'<div class="pr'+(on?" mine":"")+'"><div>'+esc(x)+'</div></div>').join("")+'</div>':'<p class="note">Nothing priced with this yet. It still counts for Claude’s advice.</p>')+(c.url?'<p class="note"><a class="linkbtn" href="'+c.url+'" target="_blank" rel="noopener">Open '+esc(c.name.split(" (")[0])+'</a></p>':'')+'</details>';}).join("")+
    '</div><p class="note">Fiver never logs in to these or stores passwords: it works out your price from what you tick.</p></details>'+keyBody;
  host.innerHTML='<div class="sheetWrap" id="sheetWrap"><div class="sheet menu" role="dialog" aria-modal="true" aria-label="Menu"><button class="close" id="closeSheet">Close</button>'+
    '<div class="mhead">'+rat("f_neutral",64)+'<div><span class="ms" data-ms="'+esc(nm||"Your rat")+'" style="--ms:18px"></span><p class="meta"><b>'+(state.crumbs||0)+' crumbs · '+esc(rankName(state.crumbs||0))+'</b></p><p class="meta">Your name and cards stay on this phone. Menus you teach me are shared.</p></div></div>'+
    '<p class="note saveHint">Changes save as you go.</p>'+
    '<p class="note"><button type="button" class="linkbtn" id="mTour">Fiver’s full tour →</button></p>'+
    '<div class="k mgrp">You</div>'+
    sec("name","Your name",'<input class="line" id="mName" placeholder="Your first name" maxlength="24" value="'+esc(state.name)+'">')+
    sec("cards","Cards &amp; apps",cardsBody)+
    sec("uni","Your uni",'<p class="note">Your own canteens and the shops round your campus. Prices come from each university’s food pages.</p>'+uniChips("mUni",state.uni))+
    sec("diet","Diet &amp; allergies",'<div class="chips" id="mDiet">'+DIETS.map(c=>'<label class="chip'+(state.diet.has(c.id)?" on":"")+'"><input type="checkbox" value="'+c.id+'"'+(state.diet.has(c.id)?" checked":"")+'>'+esc(c.name)+'</label>').join("")+'</div><textarea class="line" id="mNote" rows="2" placeholder="Other allergies or notes" style="font-family:var(--body);font-style:normal;font-size:15px;resize:none">'+esc(state.note)+'</textarea><p class="note">Fiver hides what it knows won’t work and flags the rest “ask staff”. Allergens change: always ask.</p>')+
    sec("visits","Your visits",visitsHTML())+
    sec("crumbs","Crumbs",'<p class="body"><b>'+(state.crumbs||0)+' crumbs · '+esc(rankName(state.crumbs||0))+'</b></p><p class="note">A menu photo accepted is +10, a typed menu +3. Crumb finder at 10 · Menu hunter at 50 · '+esc(rankName(150))+' at 150. Bragging rights only.</p>')+
    '<div class="k mgrp">Deals</div>'+
    sec("deals",DAYL[nowParts().day]+"’s deals",(()=>{const n=nowParts();const t=selectedTime();const dl=todayDeals({day:n.day,minutes:n.minutes,dateISO:t.dateISO});const dm=moment("deals","deals");return '<div class="mhead">'+rat(dm.pose,72)+'<p class="lead">'+esc(dm.line)+'</p></div>'+(dl.cards.length?dl.cards.slice(0,5).map(x=>'<div class="deal'+(x.mine?"":" off")+'"><span class="tag">'+esc(cardName(x.card||"").split(" (")[0]||"today")+'</span><span>'+esc(x.text)+(x.mine?"":" · you don’t have this card")+'</span></div>').join(""):'<div class="deal"><span class="tag">today</span><span>No card deals today.</span></div>')+dl.late.slice(0,3).map(x=>'<div class="deal"><span class="tag">later</span><span>'+esc(x.text)+'</span></div>').join("");})())+
    sec("teach","Teach Fiver",'<p class="body">Snap a menu or tell me a deal. Claude reads it; it lands on the map.</p><p class="note"><button type="button" class="linkbtn" id="mTeach">Open Teach Fiver →</button></p>')+
    '<div class="k mgrp">Help</div>'+
    sec("install","Install the app",(()=>{const im=moment("install","install");return '<div class="mhead">'+rat(im.pose,96)+'<p class="lead">'+esc(im.line)+'</p></div>';})()+'<div class="installBox"></div><p class="note">On iPhone, Apple only allows installing from Safari’s Share menu; the button shows you the three taps. Android and desktop install directly.</p>')+
    sec("sources","Where prices come from",SOURCES)+
    sec("privacy","Privacy",PRIVACY_HTML)+
    '<div class="mEnd"><button type="button" class="btn sec" id="mStart">New search</button><button type="button" class="btn sec" id="mReset">Forget me</button></div><p class="note" id="forgetNote">Forget me deletes this phone’s ID and every visit we hold for it. It also wipes your name, cards, diet and what you added on this phone.</p>'+
    '<button type="button" class="btn pri mSave" id="mSave">Save and show my food</button><p class="note estd">Fed for a Fiver · estd 2026 · London</p>'+
    '</div></div>';
  msRender(host);paintInstall();
  const wrap=document.getElementById("sheetWrap");const sheet=wrap.querySelector(".sheet");const close=()=>{host.innerHTML="";};
  document.getElementById("closeSheet").onclick=close;wrap.addEventListener("click",e=>{if(e.target===wrap)close();});
  document.addEventListener("keydown",function onk(e){if(e.key==="Escape"){close();document.removeEventListener("keydown",onk);}});
  sheet.querySelectorAll("details[id^=m-]").forEach(dt=>dt.addEventListener("toggle",()=>{const id=dt.id.slice(2);if(dt.open)menuOpen.add(id);else menuOpen.delete(id);}));
  const mName=sheet.querySelector("#mName");mName.oninput=()=>{state.name=mName.value;persist();};mName.onchange=()=>{state.name=mName.value.trim();persist();render();saved();};
  {const ki=sheet.querySelector("#keyIn"),kn=sheet.querySelector("#keyNote");if(ki){sheet.querySelector("#keySave").onclick=()=>{const v=ki.value.trim();try{if(v)localStorage.setItem("fiver.key",v);else localStorage.removeItem("fiver.key");}catch(e){}kn.textContent=v?"Claude is on: key saved on this phone.":"No key: photos go through Fiver’s reader; “Why?” stays off.";if(state.step===S.results)render();saved();};
    sheet.querySelector("#keyDrop").onclick=()=>{ki.value="";try{localStorage.removeItem("fiver.key");}catch(e){}kn.textContent="Key removed from this phone.";if(state.step===S.results)render();saved();};}}
  sheet.querySelectorAll("[data-cards]").forEach(row=>row.addEventListener("change",e=>{const i=e.target;if(i.type!=="checkbox")return;if(i.checked)state.cards.add(i.value);else state.cards.delete(i.value);persist();menuOpen.add("cards");openMenu();if(state.step===S.results)render();saved();}));
  sheet.querySelector("#mUni").addEventListener("click",e=>{const b=e.target.closest("button[data-uni]");if(!b)return;const id=b.dataset.uni;
    if(id==="other"){state.uni="other";persist();close();UI.pickOther=true;go(S.where);return;}
    state.uni=id;sheet.querySelectorAll("#mUni .chip").forEach(c=>c.classList.toggle("on",c.dataset.uni===id));const m=uniMain(id);if(id!=="ucl"&&m){state.where={lat:m.lat,lon:m.lon,label:m.name};}else if(id==="ucl"){const v=VENUES.find(x=>x.id==="quad");state.where={lat:v.lat,lon:v.lon,label:v.name};}persist();if(state.step===S.results)render();saved();});
  sheet.querySelector("#mDiet").addEventListener("change",e=>{const i=e.target;if(i.type!=="checkbox")return;if(i.checked)state.diet.add(i.value);else state.diet.delete(i.value);i.closest(".chip").classList.toggle("on",i.checked);persist();if(state.step===S.results)render();saved();});
  const mNote=sheet.querySelector("#mNote");mNote.onchange=()=>{state.note=mNote.value.trim();persist();saved();};
  sheet.querySelector("#mSave").onclick=()=>{state.name=mName.value.trim();state.note=mNote.value.trim();persist();close();go(state.where?S.results:S.where);window.scrollTo(0,0);}; // close and re-rank with what's ticked now
  sheet.querySelector("#mTeach").onclick=()=>openTeach();
  sheet.querySelector("#mStart").onclick=()=>{close();state.where=null;state.q="";go(S.where);};
  sheet.querySelector("#mReset").onclick=async()=>{if(!confirm("Fine. I’ll pretend we never met. Forget everything Fiver knows about you, here and on the server?"))return;
    const n=sheet.querySelector("#forgetNote");n.textContent="Forgetting…";const ok=await forgetMe();n.textContent=ok?"Done. This phone’s ID and its visits are gone.":"Done on this phone. The server will be asked again next time you open Fiver.";
    setTimeout(()=>location.reload(),ok?600:1800);};
  if(section){const dt=sheet.querySelector("#m-"+section);if(dt&&dt.scrollIntoView)setTimeout(()=>dt.scrollIntoView({block:"start",behavior:"smooth"}),50);}
}

/* ---------- INSTALL (PWA) ---------- */
let installEvt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e;paintInstall();});
window.addEventListener("appinstalled",()=>{installEvt=null;paintInstall();});
function standalone(){return (window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true;}
function isIOS(){return /iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);}
function installable(){return !standalone()&&!IN_CLAUDE&&location.protocol==="https:";}
function isAndroid(){return /Android/i.test(navigator.userAgent);}
function paintInstall(){document.querySelectorAll(".installBox").forEach(b=>{b.innerHTML=installable()?'<button type="button" class="chip">'+DL+' Install the app</button>':(standalone()?'<p class="note">Installed. You’re in the app.</p>':'');const btn=b.querySelector("button");if(btn)btn.onclick=doInstall;});}
async function promptInstall(){if(!installEvt)return false;try{installEvt.prompt();const r=await installEvt.userChoice;if(r&&r.outcome==="accepted")installEvt=null;}catch(e){}paintInstall();return true;}
async function doInstall(){openInstallSheet();}
/* Which phone, which browser, inside which app: the install sheet shows the right steps on its own */
function uaInfo(ua){ua=ua||navigator.userAgent||"";
  const inApp=/Instagram/i.test(ua)?"Instagram":/musical_ly|TikTok|BytedanceWebview/i.test(ua)?"TikTok":/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)?"Facebook":null;
  const br=/CriOS/.test(ua)?"chrome":/FxiOS/.test(ua)?"firefox":/EdgiOS/.test(ua)?"edge":"safari";
  return {inApp,br,os:/Android/i.test(ua)?"android":"ios"};}
function openInstallSheet(){
  if(standalone())return; // already installed: no window
  const host=document.getElementById("sheetHost");const U=uaInfo();
  const STEPS={
    "ios-chrome":[["Tap the Share icon at the top","It’s in the address bar. Can’t see it? Tap ··· then Share."],["Tap “Add to Home Screen”","Scroll down the list if you don’t see it."],["Tap Add","Fed for a Fiver lands on your home screen with the Fed for a Fiver icon and opens full-screen."]],
    "ios-other":[["Tap ···","At the bottom or top of the screen, next to the address bar."],["Tap Share","Then scroll to “Add to Home Screen”."],["Tap “Add to Home Screen”, then Add","Fed for a Fiver lands on your home screen with the Fed for a Fiver icon and opens full-screen."]],
    ios:[["Open this page in Safari","If you are in another app’s browser, tap ··· first and choose Open in Safari."],["Tap Share","The square with an arrow. If you don’t see it, tap ··· first."],["Tap “Add to Home Screen”","Scroll down the list if you don’t see it."],["Tap Add","Fed for a Fiver lands on your home screen with the Fed for a Fiver icon and opens full-screen."]],
    android:[["Open this page in Chrome","If you are in another app’s browser, open the link in Chrome."],["Tap ⋮ (top right)","The three dots next to the address bar."],["Tap “Add to home screen”","Some phones say Install app."],["Tap Install","Fed for a Fiver lands on your home screen with the Fed for a Fiver icon and opens full-screen."]]};
  const tab=o=>'<div class="tabs" id="instTabs"><button type="button" class="chip'+(o==="ios"?" on":"")+'" data-os="ios">iPhone</button><button type="button" class="chip'+(o==="android"?" on":"")+'" data-os="android">Android</button></div>';
  const INTRO={ios:"Apple only lets you install from Safari’s Share menu:","ios-chrome":"Tap the Share icon at the top, in the address bar, then “Add to Home Screen”. Can’t see it? Tap ··· then Share.","ios-other":"Tap ··· then Share, then “Add to Home Screen”.",android:"From Chrome’s menu, no store, no account:"};
  const key=o=>o==="ios"&&U.os==="ios"?(U.br==="chrome"?"ios-chrome":U.br==="firefox"||U.br==="edge"?"ios-other":"ios"):o;
  const stepsH=o=>{o=key(o);return '<p class="body">'+esc(INTRO[o])+'</p><div class="steps">'+STEPS[o].map((s,i)=>'<div><b>'+(i+1)+'</b><div><div class="body">'+esc(s[0])+'</div><div class="note" style="margin-top:2px">'+esc(s[1])+'</div></div></div>').join("")+'</div>';};
  const os=isAndroid()?"android":"ios";
  // inside Instagram, TikTok or Facebook: first out to a real browser
  const inAppH=U.inApp?'<div class="inapp"><p class="body"><b>You’re inside '+esc(U.inApp)+'.</b> Tap ··· at the top and choose “Open in browser” first.</p><p class="note">Then tap Install the app again and I’ll show you the steps.</p></div>':'';
  const im=moment("install","install-sheet",null,l=>MOMENTS.install.some(r=>r[0]===l&&r[1]==="a_phone")); // only the lines that go with the full-body rat holding the phone
  host.innerHTML='<div class="sheetWrap" id="sheetWrap"><div class="sheet" role="dialog" aria-modal="true" aria-label="Install the app"><button class="close" id="closeSheet">Close</button>'+
    '<span class="ms" data-ms="Install the app" style="--ms:18px"></span><div class="instHead"><div class="bubble"><p>'+esc(im.line)+'</p></div>'+rat("a_phone",110)+'</div>'+
    (standalone()?'<p class="body">Installed. You’re in the app.</p>':
      U.inApp?inAppH:(installEvt?'<div class="chips" style="margin:6px 0 12px"><button type="button" class="chip on" id="instPrompt">'+DL+' Install Fed for a Fiver</button></div><p class="note">Or by hand:</p>':'')+tab(os)+'<div id="instSteps">'+stepsH(os)+'</div>')+
    '<p class="note" style="margin-top:14px">No app store, no account. Updates arrive on their own.</p></div></div>';
  msRender(host);
  const wrap=document.getElementById("sheetWrap");const close=()=>{host.innerHTML="";};
  document.getElementById("closeSheet").onclick=close;wrap.addEventListener("click",e=>{if(e.target===wrap)close();});
  const tabs=document.getElementById("instTabs");if(tabs)tabs.addEventListener("click",e=>{const b=e.target.closest("button[data-os]");if(!b)return;tabs.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));document.getElementById("instSteps").innerHTML=stepsH(b.dataset.os);});
  const ip=document.getElementById("instPrompt");if(ip)ip.onclick=async()=>{const ok=await promptInstall();if(ok&&standalone())close();};
  document.getElementById("closeSheet").focus();
}
if("serviceWorker" in navigator&&location.protocol==="https:"&&!IN_CLAUDE){window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{});});}

/* ---------- MAP MOUNT: real map when hosted, walk radar inside claude.ai ---------- */
let rmap=null,rmarkers=[];
function mountMap(box,opts){
  if(REAL_MAP){box.innerHTML='<div id="rmap"></div>';setTimeout(()=>buildRealMap(box.querySelector("#rmap"),opts),0);}
  else{box.innerHTML='<svg viewBox="0 0 1000 640" role="img" aria-label="Walking distances around you"></svg>';buildDrawnMap(box.querySelector("svg"),opts);}
}

const INK="#59211F",PAPER="#FFF7EB";
const RSTYLE={version:8,glyphs:"https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",sources:{omt:{type:"vector",url:"https://tiles.openfreemap.org/planet"}},layers:[
  {id:"bg",type:"background",paint:{"background-color":PAPER}},
  {id:"landcover",type:"fill",source:"omt","source-layer":"landcover",filter:["in","class","grass","wood","farmland","wetland"],paint:{"fill-color":INK,"fill-opacity":0.05}},
  {id:"landuse",type:"fill",source:"omt","source-layer":"landuse",filter:["in","class","grass","park","garden","cemetery","pitch","playground","school","university","college","hospital","stadium"],paint:{"fill-color":INK,"fill-opacity":0.05}},
  {id:"park",type:"fill",source:"omt","source-layer":"park",paint:{"fill-color":INK,"fill-opacity":0.07}},
  {id:"park-line",type:"line",source:"omt","source-layer":"park",paint:{"line-color":INK,"line-opacity":0.35,"line-width":0.7}},
  {id:"water",type:"fill",source:"omt","source-layer":"water",paint:{"fill-color":INK,"fill-opacity":0.12}},
  {id:"water-line",type:"line",source:"omt","source-layer":"water",paint:{"line-color":INK,"line-opacity":0.5,"line-width":0.8}},
  {id:"waterway",type:"line",source:"omt","source-layer":"waterway",paint:{"line-color":INK,"line-opacity":0.4,"line-width":1}},
  {id:"building",type:"fill",source:"omt","source-layer":"building",minzoom:13,paint:{"fill-color":INK,"fill-opacity":["interpolate",["linear"],["zoom"],13,0.04,16,0.08]}},
  {id:"building-line",type:"line",source:"omt","source-layer":"building",minzoom:14,paint:{"line-color":INK,"line-opacity":["interpolate",["linear"],["zoom"],14,0.2,16,0.45],"line-width":0.6}},
  {id:"rail",type:"line",source:"omt","source-layer":"transportation",filter:["all",["==","class","rail"],["!=","brunnel","tunnel"]],paint:{"line-color":INK,"line-opacity":0.35,"line-width":1,"line-dasharray":[4,3]}},
  {id:"path",type:"line",source:"omt","source-layer":"transportation",minzoom:15,filter:["in","class","path","track"],paint:{"line-color":INK,"line-opacity":0.35,"line-width":0.8,"line-dasharray":[2,2]}},
  {id:"road-minor-casing",type:"line",source:"omt","source-layer":"transportation",filter:["all",["in","class","minor","service","pedestrian","living_street"],["!=","brunnel","tunnel"]],layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":INK,"line-opacity":0.55,"line-width":["interpolate",["linear"],["zoom"],13,1.2,16,5.5,18,12]}},
  {id:"road-main-casing",type:"line",source:"omt","source-layer":"transportation",filter:["all",["in","class","motorway","trunk","primary","secondary","tertiary"],["!=","brunnel","tunnel"]],layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":INK,"line-opacity":0.8,"line-width":["interpolate",["linear"],["zoom"],12,2,16,9,18,18]}},
  {id:"road-minor",type:"line",source:"omt","source-layer":"transportation",filter:["all",["in","class","minor","service","pedestrian","living_street"],["!=","brunnel","tunnel"]],layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":PAPER,"line-width":["interpolate",["linear"],["zoom"],13,0.4,16,3.8,18,9.5]}},
  {id:"road-main",type:"line",source:"omt","source-layer":"transportation",filter:["all",["in","class","motorway","trunk","primary","secondary","tertiary"],["!=","brunnel","tunnel"]],layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":PAPER,"line-width":["interpolate",["linear"],["zoom"],12,0.8,16,6.5,18,14.5]}},
  {id:"road-label",type:"symbol",source:"omt","source-layer":"transportation_name",minzoom:14,filter:["!in","class","rail","path","service"],layout:{"symbol-placement":"line","text-field":["get","name"],"text-font":["Noto Sans Regular"],"text-size":["interpolate",["linear"],["zoom"],14,9.5,17,12],"text-letter-spacing":0.1,"text-transform":"uppercase","symbol-spacing":320},paint:{"text-color":"#6B5A58","text-halo-color":PAPER,"text-halo-width":1.6}},
  {id:"poi-station",type:"symbol",source:"omt","source-layer":"poi",minzoom:14,filter:["in","subclass","station","subway","subway_entrance"],layout:{"text-field":["get","name"],"text-font":["Noto Sans Bold"],"text-size":10,"text-transform":"uppercase","text-letter-spacing":0.08,"text-offset":[0,0.9],"text-anchor":"top"},paint:{"text-color":"#111111","text-halo-color":PAPER,"text-halo-width":1.4}},
  {id:"place-label",type:"symbol",source:"omt","source-layer":"place",filter:["in","class","suburb","neighbourhood","quarter","town","village"],layout:{"text-field":["get","name"],"text-font":["Noto Sans Bold"],"text-size":12,"text-transform":"uppercase","text-letter-spacing":0.14},paint:{"text-color":INK,"text-halo-color":PAPER,"text-halo-width":1.6}},
  {id:"city-label",type:"symbol",source:"omt","source-layer":"place",maxzoom:12,filter:["==","class","city"],layout:{"text-field":["get","name"],"text-font":["Noto Sans Bold"],"text-size":14,"text-transform":"uppercase","text-letter-spacing":0.16},paint:{"text-color":INK,"text-halo-color":PAPER,"text-halo-width":1.6}}
]};
function circlePoly(lat,lon,r){const pts=[];for(let i=0;i<=64;i++){const a=i/64*2*Math.PI;pts.push([lon+r/111320/Math.cos(lat*Math.PI/180)*Math.cos(a),lat+r/110540*Math.sin(a)]);}return {type:"Feature",geometry:{type:"Polygon",coordinates:[pts]}};}
function buildRealMap(container,opts){
  const here=state.where||VENUES[0];
  if(rmap){try{rmap.remove();}catch(e){}rmap=null;}rmarkers=[];
  rmap=new maplibregl.Map({container,style:RSTYLE,center:[here.lon,here.lat],zoom:15.4,minZoom:9,maxZoom:18.5,attributionControl:false});
  rmap.addControl(new maplibregl.AttributionControl({compact:true,customAttribution:"© OpenFreeMap © OpenMapTiles © OpenStreetMap"}),"bottom-right");
  rmap.on("load",()=>{
    if(state.where){rmap.addSource("ring",{type:"geojson",data:circlePoly(here.lat,here.lon,800)});rmap.addLayer({id:"ring",type:"line",source:"ring",paint:{"line-color":"#59211F","line-width":1.5,"line-dasharray":[3,3],"line-opacity":0.7}});}
  });
  if(opts&&opts.tap){rmap.on("click",e=>{state.where={lat:e.lngLat.lat,lon:e.lngLat.lng,label:"where you tapped"};opts.tap();});}
  if(state.where){const y=document.createElement("div");y.className="ryou";rmarkers.push(new maplibregl.Marker({element:y}).setLngLat([here.lon,here.lat]).addTo(rmap));}
  if(opts&&opts.pins){const top=new Set(opts.top||[]);const bounds=new maplibregl.LngLatBounds([here.lon,here.lat],[here.lon,here.lat]);
    for(const row of opts.pins){const e=document.createElement("div");
      if(!row.fits){e.className="rpin dim";e.title=row.p.name;}
      else{e.className="rpin"+(row.of.cat==="free"?" free":"")+(top.has(row.p.id)?" top":"");e.textContent=money(row.pr.price).replace(".00","");bounds.extend([row.p.lon,row.p.lat]);}
      if(row.fits&&opts.priced&&!opts.priced.has(row.p.id)){e.className="rpin small";e.textContent="";e.title=row.p.name+" · "+money(row.pr.price);}
      e.dataset.id=row.p.id;
      e.addEventListener("click",ev=>{ev.stopPropagation();if(opts.pick)opts.pick(row);else openSheet(row);});
      rmarkers.push(new maplibregl.Marker({element:e,anchor:"center"}).setLngLat([row.p.lon,row.p.lat]).addTo(rmap));}
    if(opts.pins.some(r=>r.fits))rmap.fitBounds(bounds,{padding:48,maxZoom:16,duration:0});}
  const ctl=document.createElement("div");ctl.className="mapctl";ctl.innerHTML='<button type="button" aria-label="Zoom in">+</button><button type="button" aria-label="Zoom out">−</button><button type="button" aria-label="Centre on me" style="font-size:12px">me</button>';
  const [bIn,bOut,bMe]=ctl.querySelectorAll("button");bIn.onclick=()=>rmap.zoomIn();bOut.onclick=()=>rmap.zoomOut();bMe.onclick=()=>rmap.flyTo({center:[here.lon,here.lat],zoom:15});
  container.parentElement.appendChild(ctl);
}


/* ---------- CLAUDE: inside claude.ai via sample, elsewhere via the API key ---------- */
let sampleFn=null;
/* Claude's JSON, read forgivingly: no ```json fences or chatter around it; if the answer was cut off (max_tokens), keep everything up to the
   last complete value and close the brackets, so the items that did arrive are saved. On failure: {code:"invalid_json",detail:"(stop: …) first 80 chars"}. */
function looseJSON(text,stop){
  let s=String(text||"").replace(/```(?:json)?/gi,"");const a=s.indexOf("{");if(a<0)throw {code:"invalid_json",detail:jsonDetail(text,stop)};s=s.slice(a);
  const b=s.lastIndexOf("}");if(b>=0){try{return JSON.parse(s.slice(0,b+1));}catch(e){}}
  const stack=[],cuts=[];let inStr=false,esc=false;
  for(let i=0;i<s.length;i++){const ch=s[i];
    if(inStr){if(esc)esc=false;else if(ch==="\\")esc=true;else if(ch==='"')inStr=false;continue;}
    if(ch==='"')inStr=true;else if(ch==="{"||ch==="[")stack.push(ch==="{"?"}":"]");else if(ch==="}"||ch==="]"){stack.pop();cuts.push([i+1,stack.slice().reverse().join("")]);}}
  for(let k=cuts.length-1;k>=0&&k>=cuts.length-400;k--){const [at,close]=cuts[k];try{const j=JSON.parse(s.slice(0,at).replace(/,\s*$/,"")+close);j.__cut=true;return j;}catch(e){}}
  throw {code:"invalid_json",detail:jsonDetail(text,stop)};}
function jsonDetail(text,stop){return (stop?"(stop: "+stop+") ":"")+String(text||"").replace(/\s+/g," ").trim().slice(0,80);}
async function askClaude(prompt,o){o=o||{};
  if(sampleFn&&!o.image){if(o.json)return sampleFn.json(prompt,{modelTier:"quick"});const r=await sampleFn(prompt,{modelTier:"quick",onText:o.onText});return r.text;}
  const key=getKey();
  if(!key&&o.image){const r=await readMenuRemote(prompt,o.image,o.max);return o.json?looseJSON(r.text,r.stop):r.text;}
  if(!key)throw {code:"no_key"};
  const content=o.image?[{type:"image",source:{type:"base64",media_type:"image/jpeg",data:o.image}},{type:"text",text:prompt}]:prompt;
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"content-type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-haiku-5-5",max_tokens:o.max||400,messages:[{role:"user",content}]})});
  if(!res.ok)throw {code:res.status===401?"not_granted":res.status===429?"rate_limited":"upstream_error"};
  const j=await res.json();const text=(j.content||[]).map(c=>c.text||"").join("");
  if(o.json)return looseJSON(text,j.stop_reason||"");return text;
}
function claudeAvailable(){return !!sampleFn||!!getKey();}
function claudeErr(e,fallback){return e&&e.code==="no_key"?(IN_CLAUDE?"Needs Claude: add an API key under Cards & apps.":"Snapping needs Claude. Type it instead →"):e&&e.code==="no_vision"?"Photos need the installed app with an API key. Type it instead →":e&&e.code==="not_granted"?"Claude wasn’t allowed here.":e&&e.code==="rate_limited"?"Too many asks. Try again in a minute.":e&&e.code==="invalid_json"?"Claude’s answer wasn’t readable. Try again.":fallback;}
function profileLine(){const t=selectedTime();return "The student"+(state.name?" ("+state.name+")":"")+" is at "+(state.where||VENUES[0]).label+", it is "+DAYS[t.day]+" "+fmt(t.minutes)+", cards: "+([...state.cards].map(cardName).join(", ")||"none")+", diet: "+([...state.diet].map(id=>(DIETS.find(d=>d.id===id)||{}).name).join(", ")||"none")+(state.note?", notes: "+state.note:"")+".";}
function wireAsk(d,r){
  const b=d.querySelector("#ask"),hint=d.querySelector("#askHint"),out=d.querySelector("#aiOut");if(!b)return;
  if(!claudeAvailable()){b.hidden=true;return;}b.hidden=false;
  b.onclick=async()=>{b.disabled=true;out.hidden=false;const lm=moment("loading",String(Date.now()));out.textContent=lm.line;const wasPose=(view.querySelector(".stage-rat")||{dataset:{}}).dataset.pose;ratPose(lm.pose);
    const top=r.fit.slice(0,5).map(x=>({name:x.p.name,price:x.pr.price,walkMin:x.walk,item:x.of.item,closes:x.o.closes||"",note:x.p.why||"",cardUsed:x.pr.label||"",dietNotes:x.ask.join("; ")}));
    const prompt="You help a student at "+(uniName()?uniName()+" in London":"a London university")+" decide where to eat. "+profileLine()+" They want "+[...state.cats].join(", ")+", have £"+state.budget+" and "+state.mins+" minutes.\nRanked options (cheapest first, all open and within reach):\n"+JSON.stringify(top)+"\n\nIn at most 3 short sentences, plain English, say which to pick and why, and name one alternative. If there are diet notes, remind them to ask staff. No bullet points, no preamble.";
    try{const text=await askClaude(prompt,{onText:({text})=>{out.textContent=text;}});out.textContent=text;}
    catch(e){out.textContent="";hint.textContent=claudeErr(e,"Claude didn’t answer. The ranking above still stands.");}
    finally{b.disabled=false;if(wasPose)ratPose(wasPose);}};
}
/* Mic on an input (Web Speech), and the one-line parse */
/* Mic in the search box (Web Speech). One recording at a time, in SAY; it survives a re-render of the box and stops when the box goes. */
const SAY={rec:null,t:null,heard:false};
function sayPaint(on){const m=document.getElementById("mic"),i=document.getElementById("qIn"),b=document.getElementById("specBox");
  if(m){m.classList.toggle("live",on);m.setAttribute("aria-pressed",on?"true":"false");m.setAttribute("aria-label",on?"Stop listening":"Speak");}
  if(b)b.classList.toggle("rec",on);if(i)i.placeholder=on?"Listening…":"Latte, pizza, sushi…";}
function sayHint(t){const i=document.getElementById("qIn");if(i&&!i.value)i.placeholder=t;}
function sayTimer(ms,fn){clearTimeout(SAY.t);SAY.t=setTimeout(fn,ms);}
function stopSay(keep){const r=SAY.rec;SAY.rec=null;clearTimeout(SAY.t);SAY.t=null;
  if(r){r.onresult=r.onerror=r.onend=r.onspeechstart=r.onspeechend=null;try{keep?r.stop():r.abort();}catch(e){}}sayPaint(false);}
function closeSearch(){stopSay();UI.searchOpen=false;const sb=document.getElementById("specBox");if(sb)sb.remove();const t=document.getElementById("searchTile");if(t){t.classList.remove("on");t.setAttribute("aria-pressed","false");}}
// a tap outside the whole box: while recording it only stops the mic; otherwise an empty box closes
function sayOutside(e){const sb=document.getElementById("specBox");if(!sb)return;const t=e.target;if(t&&t.closest&&t.closest("#specBox,#searchTile"))return;
  if(SAY.rec){stopSay();return;}const i=document.getElementById("qIn");if((i&&i.value.trim())||state.q)return;closeSearch();}
document.addEventListener("pointerdown",sayOutside,true);
document.addEventListener("visibilitychange",()=>{if(document.hidden&&SAY.rec)stopSay();});
function wireSay(d,inp,go){
  const mic=d.querySelector("#mic");if(!mic){if(SAY.rec)stopSay();return;}const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR||IN_CLAUDE)return;mic.hidden=false;const note=d.querySelector("#qNote");
  if(SAY.rec){SAY.go=go;SAY.inp=inp;SAY.note=note;setTimeout(()=>sayPaint(true),0);} // the box was re-drawn mid-recording: same recording, new buttons
  mic.onclick=e=>{e.preventDefault();if(SAY.rec){if(SAY.heard){const r=SAY.rec;sayTimer(2500,()=>stopSay());try{r.stop();}catch(x){stopSay();}}else stopSay();return;} // tap again: stop (and keep what was said)
    let rec;try{rec=new SR();}catch(x){mic.hidden=true;return;}
    rec.lang="en-GB";rec.interimResults=false;rec.maxAlternatives=5;rec.continuous=false;
    SAY.rec=rec;SAY.heard=false;SAY.go=go;SAY.inp=inp;SAY.note=note;UI.searchOpen=true;
    try{inp.blur();}catch(x){}sayPaint(true);
    sayTimer(10000,()=>{if(SAY.rec===rec){stopSay();sayHint("Didn’t hear you. Type, or tap the mic");}}); // 10 s and no voice
    rec.onspeechstart=()=>{if(SAY.rec!==rec)return;SAY.heard=true;sayTimer(12000,()=>{if(SAY.rec===rec){try{rec.stop();}catch(x){}sayTimer(2500,()=>stopSay());}});};
    rec.onspeechend=()=>{if(SAY.rec!==rec)return;sayTimer(2500,()=>stopSay());}; // iPhone sometimes never ends on its own
    // up to 5 guesses: the first one the interpreter understands, else the first; then fill the box and search
    rec.onresult=ev=>{if(SAY.rec!==rec)return;const r=ev.results[ev.results.length-1];if(!r||(r.isFinal===false))return;const alts=[];for(let i=0;i<r.length;i++)alts.push(r[i].transcript);
      const pick=(alts.find(a=>typeof interpretWish==="function"&&interpretWish(a,nowParts().day).understood)||alts[0]||"").trim();
      const g=SAY.go,box=SAY.inp;stopSay();const i=document.getElementById("qIn")||box;if(i)i.value=pick;if(g&&pick)g(pick);};
    rec.onerror=ev=>{if(SAY.rec!==rec)return;stopSay();if(ev.error!=="aborted")sayHint(ev.error==="not-allowed"||ev.error==="service-not-allowed"?"Mic blocked. Type it instead":"Didn’t catch that. Type, or try again");};
    rec.onend=()=>{if(SAY.rec===rec)stopSay();};
    try{rec.start();}catch(x){stopSay();mic.hidden=true;}};
}
// "something hot and veggie, £4, back in 20 min" → filters. Returns {budgetGiven,minsGiven} or null if Claude failed (note set).
async function parseWish(text,note){
  const lm=moment("loading",String(Date.now()));note.textContent=lm.line;ratPose(lm.pose);const lb=view.querySelector(".bubble p");if(lb)lb.innerHTML=esc(lm.line);
  const prompt='A '+(uniName()||"London")+' student typed what they want to eat, possibly with typos, slang or Spanish words (fix them: "capuchino" is cappuccino, "pumkin spice late" is pumpkin spice latte, "sarnie" is sandwich). Turn it into JSON only, no prose: {"cats":[subset of "hot","deal","coffee","snack","sweet","free"] or null,"item":"the specific dish or drink they mean, spelled correctly, 1-3 words, chosen from this menu vocabulary when close: '+Object.values(SPECIFIC).flat().join(", ")+'; else null","budget":number in pounds or null,"mins":total minutes they have or null,"diet":[subset of "veg","vegan","gf","halal","df","nuts"] or null,"time":"HH:MM" 24h or null,"dayOffset":0-6 or null,"where":one of '+JSON.stringify(VENUES.map(v=>v.name))+' or null}. "hot" = hot food, "deal" = supermarket meal deal, "snack" = sandwiches, fruit, crisps, sushi rolls, "sweet" = cakes and doughnuts, "coffee" = any drink. Use null for anything not said. Text: "'+text.replace(/"/g,"'")+'"';
  try{const j=await askClaude(prompt,{json:true});
    if(Array.isArray(j.cats)&&j.cats.length)state.cats=new Set(j.cats.filter(c=>CATS.some(x=>x.id===c)));
    if(typeof j.item==="string"&&j.item.trim())state.q=j.item.trim();
    const bg=typeof j.budget==="number"&&j.budget>=0,mg=typeof j.mins==="number"&&j.mins>0;
    if(bg)state.budget=Math.min(10,Math.round(j.budget*2)/2);
    if(mg)state.mins=Math.max(10,Math.min(90,Math.round(j.mins/5)*5));
    if(Array.isArray(j.diet))for(const x of j.diet)if(DIETS.some(y=>y.id===x))state.diet.add(x);
    if(typeof j.time==="string"&&/^\d{1,2}:\d{2}$/.test(j.time))state.minute=hm(j.time);
    if(typeof j.dayOffset==="number")state.dayOff=Math.max(0,Math.min(6,j.dayOffset));
    if(typeof j.where==="string"){const v=VENUES.find(x=>x.name===j.where);if(v)state.where={lat:v.lat,lon:v.lon,label:v.name};}
    persist();note.textContent=state.q?"Looking for “"+state.q+"”.":"";return {budgetGiven:bg,minsGiven:mg};
  }catch(e){note.textContent=claudeErr(e,"Claude didn’t answer. Pick by hand and press Next again.");return null;}
}
/* "Snap a menu": photo → Claude vision → items under a fiver, added on this phone */
/* Snap a menu, in this order: where → which shop → photo → Claude checks the board against the shop → tick the items.
   Guards: prices £0.20–£15 only · the board's name must match the shop · far from the shop = "not verified yet" · 5 a day per phone. */
const TEACH_MAX=10; // photos a day on this phone (each one is a call to Claude); typing is never limited
function teachCount(){try{const j=JSON.parse(localStorage.getItem("fiver.teach")||"{}");const day=new Date().toISOString().slice(0,10);return j.d===day?(j.n||0):0;}catch(e){return 0;}}
function teachBump(){try{localStorage.setItem("fiver.teach",JSON.stringify({d:new Date().toISOString().slice(0,10),n:teachCount()+1}));}catch(e){}}
const NOISE=new Set(["the","a","cafe","café","coffee","bar","kitchen","london","ltd","and","&","shop","store","co","restaurant","bakery","deli","express","local","uk"]);
function nameKey(n){return String(n||"").toLowerCase().replace(/[’'`]/g,"").replace(/[^a-z0-9]+/g," ").trim().split(" ").filter(w=>w&&!NOISE.has(w));}
function nameMatch(a,b){const ka=nameKey(a),kb=nameKey(b);if(!ka.length||!kb.length)return true; // nothing readable on the board: can't contradict
  const ja=ka.join(""),jb=kb.join("");if(ja===jb||(ja.length>=3&&jb.includes(ja))||(jb.length>=3&&ja.includes(jb)))return true;
  return ka.some(w=>w.length>=4&&kb.some(v=>v===w||(v.length>=4&&lev(v,w)<=1)));}
function quietGeo(ms){return new Promise(res=>{let done=false;const end=v=>{if(!done){done=true;res(v);}};try{if(!navigator.geolocation)return end(null);setTimeout(()=>end(null),ms);
  navigator.geolocation.getCurrentPosition(p=>end({lat:p.coords.latitude,lon:p.coords.longitude,acc:p.coords.accuracy||0}),()=>end(null),{enableHighAccuracy:true,timeout:ms,maximumAge:120000});}catch(e){end(null);}});}
const OSM_TAGS='[name][amenity~"^(cafe|restaurant|fast_food|bakery|pub|bar|food_court|ice_cream|juice_bar)$"]';
const OSM_SHOP='[name][shop~"^(bakery|convenience|supermarket|coffee|deli|tea|greengrocer|pastry|confectionery|chocolate|health_food|seafood|butcher|frozen_food)$"]';
async function osmShops(at,radius){ // cafés, restaurants, bakeries… around the point, from OpenStreetMap (only outside claude.ai)
  if(IN_CLAUDE||typeof fetch!=="function")return [];
  const q='[out:json][timeout:8];(nwr(around:'+radius+','+at.lat+','+at.lon+')'+OSM_TAGS+';nwr(around:'+radius+','+at.lat+','+at.lon+')'+OSM_SHOP+';);out center tags;';
  const ctl=typeof AbortController==="function"?new AbortController():null;const timer=ctl?setTimeout(()=>ctl.abort(),7000):null;
  try{const res=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:"data="+encodeURIComponent(q),headers:{"Content-Type":"application/x-www-form-urlencoded"},signal:ctl?ctl.signal:undefined});
    const j=await res.json();return (j.elements||[]).map(e=>({name:e.tags&&e.tags.name,lat:e.lat!=null?e.lat:(e.center||{}).lat,lon:e.lon!=null?e.lon:(e.center||{}).lon,src:"osm"})).filter(x=>x.name&&x.lat!=null);}
  catch(e){return [];}finally{if(timer)clearTimeout(timer);}
}
const UCL_LL={lat:51.5245,lon:-0.1336};
const LONDON_BBOX="-0.51,51.28,0.33,51.70";
function abbrStreet(st){return String(st||"").replace(/\bRoad$/,"Rd").replace(/\bStreet$/,"St").replace(/\bAvenue$/,"Ave").replace(/\bSquare$/,"Sq").replace(/\bPlace$/,"Pl").replace(/\bGardens$/,"Gdns").replace(/\bLane$/,"Ln").replace(/\bTerrace$/,"Terr").replace(/\bCrescent$/,"Cres");}
const PHOTON_PLACE=new Set(["amenity","shop","railway","public_transport","tourism","leisure","office","building","craft","healthcare","station"]);
/* Photon (photon.komoot.io, OpenStreetMap) → rows {place:bool,name,sub,lat,lon}. Places (cafés, shops, stations) first, addresses after. */
function photonRows(j){const rows=[];
  for(const f of (j&&j.features)||[]){const p=f.properties||{},c=(f.geometry||{}).coordinates||[];if(c.length<2)continue;
    const street=p.housenumber&&p.street?p.housenumber+" "+abbrStreet(p.street):abbrStreet(p.street||"");
    const isPlace=!!p.name&&PHOTON_PLACE.has(p.osm_key)&&!["street","city","district","locality","county","state","country"].includes(p.type);
    const name=isPlace?p.name:(p.name||street||p.postcode||"");if(!name)continue;
    const sub=[isPlace?street:(p.name&&street&&street!==p.name?street:""),p.postcode||"",!p.postcode&&(p.district||p.city)?(p.district||p.city):""].filter(Boolean).join(", ");
    rows.push({place:isPlace,name:String(name).slice(0,48),sub,lat:c[1],lon:c[0]});}
  const seen=new Set();return rows.filter(r=>{const k=r.name+"|"+r.sub;if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>(b.place?1:0)-(a.place?1:0));
}
async function photon(q,bias){ // free, no key; London only; biased to the student's position
  if(IN_CLAUDE||typeof fetch!=="function")throw {code:"offline"};
  const u="https://photon.komoot.io/api/?q="+encodeURIComponent(q)+"&limit=8&lang=en&bbox="+LONDON_BBOX+"&lat="+bias.lat+"&lon="+bias.lon+"&zoom=14&location_bias_scale=0.5";
  const ctl=typeof AbortController==="function"?new AbortController():null;const timer=ctl?setTimeout(()=>ctl.abort(),6000):null;
  try{const res=await fetch(u,{signal:ctl?ctl.signal:undefined,headers:{"Accept":"application/json"}});if(!res.ok)throw {code:"offline"};return photonRows(await res.json());}
  catch(e){throw {code:"offline"};}finally{if(timer)clearTimeout(timer);}
}
async function osmLookup(name,near){try{const rows=await photon(name,near);return rows.find(r=>r.place&&metres(r,near)<=120)||null;}catch(e){return null;}}
/* No Claude? "Flat white £2.60, sausage roll £1.85" still parses: name + price per comma or line, category by keyword. */
const CAT_WORDS={coffee:/latte|coffee|tea\b|americano|cappuccino|flat white|espresso|mocha|chai|matcha|hot chocolate|juice|smoothie|drink|water|cola|coke|lemonade|cortado|macchiato/i,sweet:/cake|brownie|cookie|muffin|pastry|croissant|dessert|ice cream|doughnut|donut|bun\b|tart|flapjack|scone/i,hot:/soup|roll|pizza|pasta|curry|burger|wrap|toastie|jacket|rice|noodle|\bhot\b|bake|sausage|chicken|katsu|porridge|fries|wings|panini|bap|pie\b|stew|ramen|dumpling|gyoza|bowl/i};
const TAG_WORDS={pork:/sausage|bacon|ham\b|pork|salami|chorizo/i,meat:/chicken|beef|lamb|meat|burger|steak|turkey|duck/i,fish:/tuna|salmon|prawn|fish|cod\b|shrimp|crab/i,dairy:/latte|cappuccino|cheese|milk|flat white|mocha|cream|yogurt|butter|halloumi|mozzarella/i,gluten:/roll|bread|toast|sandwich|pasta|pizza|cake|croissant|pastry|bun\b|wrap|bap|panini|cookie|muffin|noodle/i,v:/veggie|vegetarian|\(v\)/i,vg:/vegan|\(ve\)|\(vg\)|plant/i};
/* Typed menus without Claude: every price in the text, any format (£4.50 · 4.50£ · 4,50 · 95p · price first or last · sizes). */
function parseMenuText(text){
  const src=String(text).replace(/\s+/g," ").trim();
  // a price: £4.50 · £ 4 · 4.50£ · 4,50 £ · 4.50 GBP · 450p · 4.50 (bare, with decimals)
  const PRICE=/£\s*(\d{1,3}(?:[.,]\d{1,2})?)|(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:£|gbp\b|pounds?\b|quid\b)|(\d{2,4})\s*p\b|(\d{1,3}[.,]\d{1,2})(?!\d)/gi;
  const SIZE=/\b(regular|reg|small|sm|medium|med|large|lg|grande|tall|venti|single|double|half|full|little|big)\b/i;
  const hits=[];let m;
  while((m=PRICE.exec(src))){
    let price=m[1]||m[2]||m[4]?Number((m[1]||m[2]||m[4]).replace(",",".")):Number(m[3])/100;
    hits.push({start:m.index,end:PRICE.lastIndex,price});
  }
  if(!hits.length)return {items:[]};
  const clean=s=>s.replace(/^[\s,;:|\/\-–—•·()+=]+|[\s,;:|\/\-–—•·()+=]+$/g,"").replace(/\s*:\s*/g," ").replace(/\s{2,}/g," ").trim();
  const priceFirst=clean(src.slice(0,hits[0].start))==="";
  const items=[];let lastBase="";
  hits.forEach((h,i)=>{
    let name=priceFirst?clean(src.slice(h.end,i+1<hits.length?hits[i+1].start:src.length))
                       :clean(src.slice(i?hits[i-1].end:0,h.start));
    if(!name||!/[a-z]/i.test(name))return;
    const sz=name.match(SIZE);
    if(sz){
      const base=clean(name.replace(SIZE,""));
      const size=sz[1][0].toUpperCase()+sz[1].slice(1).toLowerCase();
      if(base)lastBase=base;
      name=(base||lastBase)?(base||lastBase)+" ("+size+")":name;
    }else lastBase=name;
    name=name.charAt(0).toUpperCase()+name.slice(1);
    const cat=Object.keys(CAT_WORDS).find(k=>CAT_WORDS[k].test(name))||"snack";
    const tags=Object.keys(TAG_WORDS).filter(k=>TAG_WORDS[k].test(name));
    items.push({item:name.slice(0,60),price:Math.round(h.price*100)/100,cat,tags});
  });
  return {items};
}
async function photonReverse(at,km){if(IN_CLAUDE||typeof fetch!=="function")return [];
  try{const res=await fetch("https://photon.komoot.io/reverse?lat="+at.lat+"&lon="+at.lon+"&radius="+km+"&limit=12&lang=en",{headers:{"Accept":"application/json"}});return photonRows(await res.json()).filter(r=>r.place);}catch(e){return [];}}
/* The photo answer and the prompt, shared by the Teach panel and the background read */
const cleanItems=j=>{const all=((j&&j.items)||[]).filter(x=>x&&typeof x.price==="number"&&x.item);const items=all.filter(x=>x.price>=0.2&&x.price<=15).slice(0,40);return {items,odd:all.length-items.length};};
  // the compact photo answer {"m","p","i":[[name,price,cat]]} → {isMenu,place,items:[{item,price,cat,tags}]}; the old long form still works
const CATS1={h:"hot",s:"snack",c:"coffee",w:"sweet",d:"deal"};
/* Per dish (08/11/2026): the menu's own section, and four labels from closed lists. Anything that doesn't fit is "other", never empty. */
const DISH_CUISINE=["Thai","Chinese","Vietnamese","Japanese","Korean","Malaysian","Indian","Italian","British","American","Mexican","Middle Eastern","Greek","Caribbean","French","Spanish","Other"];
const DISH_TYPE=["soup","noodles","rice","burger","pizza","wrap","salad","dessert","drink","other"];
const DISH_ROLE=["main","side","drink","dessert","snack"];
const DISH_TEMP=["hot","cold"];
function pickOf(list,v){const k=String(v==null?"":v).trim().toLowerCase();const hit=list.find(x=>x.toLowerCase()===k);return hit||(list.includes("Other")?"Other":"other");}
function dishLabels(r){return {section:String(r.section==null?"":r.section).replace(/\s+/g," ").trim().slice(0,30),cuisine:pickOf(DISH_CUISINE,r.cuisine),type:pickOf(DISH_TYPE,r.type),role:pickOf(DISH_ROLE,r.role),temperature:pickOf(DISH_TEMP,r.temperature)};}
// the compact photo answer {"m","p","i":[[name,price,cat,section,cuisine,type,role,temperature]]} → {isMenu,place,items:[{item,price,cat,tags,section,cuisine,type,role,temperature}]}; the old forms still work
const photoItems=j=>{if(!j)return null;const rows=Array.isArray(j.i)?j.i:Array.isArray(j.items)?j.items:[];
  const items=rows.map(r=>Array.isArray(r)?{item:String(r[0]||"").trim(),price:Number(r[1]),cat:CATS1[r[2]]||r[2],section:r[3],cuisine:r[4],type:r[5],role:r[6],temperature:r[7]}:r).filter(x=>x&&x.item&&isFinite(x.price))
    .map(x=>{const cat=["hot","snack","coffee","sweet","deal"].includes(x.cat)?x.cat:(Object.keys(CAT_WORDS).find(k=>CAT_WORDS[k].test(x.item))||"snack");return Object.assign({item:x.item.slice(0,60),price:Math.round(x.price*100)/100,cat,tags:Array.isArray(x.tags)?x.tags:Object.keys(TAG_WORDS).filter(k=>TAG_WORDS[k].test(x.item))},dishLabels(x));});
  return {isMenu:!(j.m===0||j.isMenu===false),place:j.p!=null?j.p:(j.place||""),items,cut:!!j.__cut};};
const PHOTO_PROMPT='This is a photo taken in London. Decide if it shows a menu, a menu board, a price list or shelf price labels. Reply with compact JSON only, no markdown, no comments: {"m":1,"p":"shop or café name if it appears in the photo, else empty","i":[["item name",price,"c","section","cuisine","type","role","temperature"],…]}. '+
  'Rules: at most 40 items, the cheapest first if there are more. Each size is its own item: ["Latte (Regular)",3.85,"c","Hot drinks","Other","drink","drink","hot"]. Price is a number in pounds (65p = 0.65). Ignore calories. Include add-ons that cost £0.20 or more; skip ones under £0.20. '+
  'Leave out any item whose price you cannot read. Category c: "h" hot food, "s" cold food or snack, "c" any drink, "w" cakes and sweets, "d" meal deal. '+
  'section: the heading the item sits under on the menu, copied exactly as printed (e.g. "Burgers", "Sides"); "" if the menu has no headings. '+
  'cuisine, exactly one of: '+DISH_CUISINE.join(", ")+'. type, exactly one of: '+DISH_TYPE.join(", ")+'. role, exactly one of: '+DISH_ROLE.join(", ")+'. temperature: hot or cold, as it is served. If nothing fits use "other" (cuisine "Other"); never leave them empty. '+
  'If it is not a menu or price list reply {"m":0,"p":"","i":[]}.';

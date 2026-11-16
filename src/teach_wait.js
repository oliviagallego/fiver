/* ---------- A menu photo being read (08/11/2026) ----------
   The read runs outside the Teach panel: closing the panel or going back doesn't stop it. Until it is read, the photo and the place picked stay on this
   phone (fiver.pending, a day at most), so if the app is closed the next opening asks again and says when it's ready. The place is kept by its own name,
   or for a Google place only by its place_id and point: never Google's name or address. */
const WAIT=["Uploading your photo…","Reading the menu. This takes a few seconds…","Almost ready","Taking longer than usual. You can keep using the app; we’ll let you know when it’s ready."];
const WAIT_MS=[2500,12000,20000];
function pendShop(sh){if(!sh)return null;const g=sh.src==="google";return {name:g?"":sh.name,lat:sh.lat,lon:sh.lon,src:sh.src,placeId:sh.placeId||"",addr:g?"":(sh.addr||"")};}
function pendGet(){try{const j=JSON.parse(localStorage.getItem("fiver.pending")||"null");if(!j||Date.now()-j.t>86400e3){localStorage.removeItem("fiver.pending");return null;}return j;}catch(e){return null;}}
function pendPut(j){try{localStorage.setItem("fiver.pending",JSON.stringify(j));}catch(e){try{const k=Object.assign({},j);delete k.imgs;localStorage.setItem("fiver.pending",JSON.stringify(k));}catch(e2){}}}
function pendClear(){try{localStorage.removeItem("fiver.pending");}catch(e){}}
function readyNudge(){const j=pendGet();if(!j||!j.items||!j.items.length||document.getElementById("readyNudge"))return;
  const el=document.createElement("div");el.id="readyNudge";el.className="nudge";el.setAttribute("role","status");
  el.innerHTML='<button type="button" class="nudgetxt">'+CAM+'<span>Your menu'+(j.shop&&j.shop.name?" at "+esc(j.shop.name):"")+' is ready: '+j.items.length+' dish'+(j.items.length>1?"es":"")+'. Check it →</span></button><button type="button" class="nudgex" aria-label="Close">'+X+'</button>';
  document.body.appendChild(el);
  el.querySelector(".nudgetxt").onclick=()=>{el.remove();const p=pendGet();if(p)openTeach(null,p);};
  el.querySelector(".nudgex").onclick=()=>{el.remove();pendClear();};}
async function readPendingInBackground(){const j=pendGet();if(!j||j.items||!Array.isArray(j.imgs)||!j.imgs.length||typeof ON_SITE==="undefined"||!ON_SITE)return;
  const items=[],seen=new Set();let board="",odd=0;
  for(const b64 of j.imgs){try{const r=photoItems(await askClaude(PHOTO_PROMPT,{json:true,image:b64,max:4000}));if(!r||!r.isMenu)continue;const c=cleanItems(r);odd+=c.odd;
      for(const x of c.items){const k=x.item.toLowerCase()+"|"+x.price.toFixed(2);if(!seen.has(k)){seen.add(k);items.push(x);}}if(!board&&r.place)board=String(r.place).slice(0,40).trim();}catch(e){}}
  if(!items.length){pendClear();return;}
  pendPut({t:j.t,shop:j.shop,items,odd,board,n:j.imgs.length});readyNudge();}
function wireMenu(d,place,resume){
  const q=sel=>d.querySelector(sel);
  const file=q("#menuFile"),file2=q("#menuFile2"),note=q("#menuNote"),out=q("#menuOut"),atLine=q("#tAt"),find=q("#tFind"),check=q("#tCheck"),which=q("#tWhich"),shopAsk=q("#tShopAsk"),shopIn=q("#tShopIn"),near=q("#tNear");
  const inp=q("#tWhereIn"),list=q("#tWhereList"),clr=q("#tWhereClear"),wnote=q("#tWhereNote");
  const T={at:null,shop:null,via:"",items:null,board:""};const live=()=>document.body.contains(out);const OFFLINE_MSG="Search works on the Fed for a Fiver website. Type the shop name instead.";
  const show=(id,on)=>{const e=q("#"+id);if(e)e.hidden=!on;};
  const canPhoto=true; // photos always: a key on this phone, else the read-menu function behind Supabase; if that fails, typing
  const bias=()=>state.where||UCL_LL;
  // the three steps up top: done (wine + tick + summary) · current (wine, underlined) · pending (grey)
  const setStep=n=>{T.step=n;d.querySelectorAll(".trow .tst").forEach(b=>{const sn=Number(b.dataset.s);b.classList.toggle("cur",sn===n);b.classList.toggle("done",!!(sn<n||(sn===3&&T.sent)));b.disabled=sn>n;});
    ["t1","t2","t3"].forEach((id,k)=>show(id,k+1===n));const gate=q("#tPhotoGate");if(gate){gate.parentElement.hidden=!!T.shop;q("#tGateNote").hidden=!!T.shop;}
    q("#ts1").textContent=T.shop?T.shop.name:(T.at?T.at.label:"");q("#ts2").textContent=T.keep&&T.step>2?T.keep.length+" item"+(T.keep.length>1?"s":""):"";q("#ts3").textContent=T.sent?"sent":(T.via==="text"?"+3 crumbs":"+10 crumbs");};
  d.querySelectorAll(".trow .tst").forEach(b=>b.onclick=()=>{const sn=Number(b.dataset.s);if(T.sent||sn>=T.step)return;if(sn===1){atLine.hidden=true;find.hidden=false;inp.value="";wnote.textContent="";near.hidden=true;}setStep(sn);if(sn===1)inp.focus();});
  // --- 1 · where: fix the choice at the top, or ask for the shop's name when only an address was chosen ---
  const fixLine=()=>{const parts=[T.shop?'<b>'+esc(T.shop.name)+'</b>':'',T.at&&T.at.label&&(!T.shop||T.at.label!==T.shop.name)?esc(T.at.label):''].filter(Boolean);
    atLine.innerHTML=PIN+' '+parts.join(' · ');atLine.hidden=true;find.hidden=true;};
  const ready=()=>{shopAsk.hidden=true;fixLine();T.keep=null;T.sent=false;which.innerHTML="";check.textContent="";out.innerHTML="";setStep(2);if(T.photos){Object.assign(T.photos,{n:0,items:[],odd:0,board:"",fails:[],cut:0,boardOk:false,warn:""});const m=q("#tMore");if(m)m.innerHTML="";}
    const full=teachCount()>=TEACH_MAX,lock=!canPhoto||full;file.disabled=lock;if(file2)file2.disabled=lock;
    d.querySelectorAll("#tPhotoRow label").forEach(l=>{l.hidden=!canPhoto;l.classList.toggle("off",full);});q("#tTypeBtn").hidden=!canPhoto;q("#tTypeBox").hidden=canPhoto&&!full;if(!canPhoto)q("#tTypeIn").focus();
    note.textContent=full?"":"The board or the shelf label, close and straight. Or type it.";const lim=q("#tLimit");if(lim){lim.hidden=!full;lim.textContent="Ten photos a day is the limit. Even for rats. Typing still works.";}};
  const typeInstead=msg=>{check.textContent=msg;note.textContent="";const box=q("#tTypeBox");box.hidden=false;q("#tTypeIn").focus();};
  const choosePlace=r=>{T.at={lat:r.lat,lon:r.lon,label:r.sub||r.name};T.shop={name:r.name,lat:r.lat,lon:r.lon,src:r.src||"photon",addr:r.sub||"",placeId:r.placeId||"",hours:r.hours||null,rating:r.rating,ratingN:r.ratingN};closeL();ready();};
  const chooseAddress=r=>{const ks=nameKey(abbrStreet(r.name)),st=new Set(nameKey(r.sub||""));const label=ks.length&&ks.every(w=>st.has(w))?r.sub:r.name+(r.sub?", "+r.sub:"");T.at={lat:r.lat,lon:r.lon,label};T.shop=null;closeL();fixLine();q("#ts1").textContent=label;shopAsk.hidden=false;shopIn.value="";shopIn.focus();};
  shopIn.oninput=()=>{const v=shopIn.value.trim();if(v.length>=2){T.shop={name:v.slice(0,40),lat:T.at.lat,lon:T.at.lon,src:"typed",addr:T.at.label};q("#ts1").textContent=T.shop.name;}else{T.shop=null;q("#ts1").textContent=T.at?T.at.label:"";}};
  shopIn.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();if(T.shop)ready();}};
  shopIn.onblur=()=>{if(T.shop&&T.step===1)setTimeout(()=>{if(T.shop&&T.step===1)ready();},150);};
  setStep(1);
  q("#tPhotoGate").onclick=()=>{const n=q("#tGateNote");n.textContent="Pick a place first";n.classList.remove("shake");void n.offsetWidth;n.classList.add("shake");inp.focus();};
  // suggestions: UCL buildings and stations instantly, Photon after a 300 ms pause (3 letters or more)
  let seq=0,timer=null,rows=[];
  const paintRows=(items,extra)=>{list.innerHTML=items.map((r,i)=>'<button type="button" data-i="'+i+'"><b>'+esc(r.name)+'</b>'+(r.sub?'<span class="meta">'+esc(r.sub)+'</span>':'')+'</button>').join("")+(extra||"")+(items.some(r=>r.src==="google")?'<div class="grp gpow">powered by Google</div>':'');rows=items;list.hidden=false;clr.hidden=false;};
  const localRows=qq=>placeSearch(qq,PLACES.concat(uniPlaces(),state.added,VENUES),{bias:bias(),uni:state.uni,limit:6}).map(({p})=>({place:true,name:p.name,sub:p.addr||"",lat:p.lat,lon:p.lon,src:VENUES.includes(p)?"venue":"cat",placeId:p.placeId||"",hours:p.hours||null}));
  const typedRow=qq=>'<button type="button" data-typed="1">Use “'+esc(qq)+'” as the shop name<span class="meta">near '+esc(bias().label||"UCL")+'</span></button>';
  const search=()=>{const raw=inp.value.trim(),qq=raw.toLowerCase();wnote.textContent="";if(qq.length<3){if(qq)paintRows(localRows(qq),typedRow(raw));else closeL();return;}
    const mine=++seq;const local=localRows(qq);paintRows(local,typedRow(raw));
    const paintAll=ph=>{const all=local.concat(ph.filter(r=>!local.some(l=>nameMatch(l.name,r.name)&&nameKey(l.name).length&&metres(l,r.lat!=null?r:l)<120)).sort((a,b)=>(b.place?1:0)-(a.place?1:0))).slice(0,8);paintRows(all,typedRow(raw));if(!all.length)wnote.textContent="Nothing called that in London.";};
    gpAutocomplete(raw,bias()).then(g=>{if(mine!==seq)return;paintAll(g);})
      .catch(()=>photon(raw,bias()).then(ph=>{if(mine!==seq)return;paintAll(ph);})
      .catch(()=>{if(mine!==seq)return;wnote.textContent=OFFLINE_MSG;paintRows(local,typedRow(raw));}));};
  const openL=()=>{if(inp.value.trim())search();};const closeL=()=>{list.hidden=true;clr.hidden=!inp.value;};
  inp.onfocus=openL;inp.oninput=()=>{clearTimeout(timer);timer=setTimeout(search,300);};inp.onblur=()=>setTimeout(closeL,180);
  clr.onclick=()=>{inp.value="";closeL();clr.hidden=true;wnote.textContent="";};
  inp.onkeydown=e=>{if(e.key==="Escape"){closeL();inp.blur();}if(e.key==="Enter"){e.preventDefault();clearTimeout(timer);const b=list.querySelector("button");if(b&&!list.hidden)b.click();else search();}};
  list.addEventListener("mousedown",e=>e.preventDefault());
  list.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    if(b.dataset.typed){const nm=inp.value.trim().slice(0,40);const at=bias();T.at={lat:at.lat,lon:at.lon,label:at.label||"UCL"};T.shop={name:nm,lat:at.lat,lon:at.lon,src:"typed",addr:T.at.label};closeL();ready();return;}
    const r=rows[Number(b.dataset.i)];if(!r)return;
    if(r.src==="google"&&r.lat==null){b.innerHTML='<b>'+esc(r.name)+'</b><span class="meta">one sec…</span>';
      gpDetails(r.placeId).then(dt=>{const rr=Object.assign({},r,{lat:dt.lat,lon:dt.lon,sub:dt.addr||r.sub,hours:dt.hours||r.hours,rating:dt.rating,ratingN:dt.ratingN});if(rr.place)choosePlace(rr);else chooseAddress(rr);})
        .catch(()=>{wnote.textContent="Google didn’t answer. Try again, or type the shop name.";search();});return;}
    if(r.place)choosePlace(r);else chooseAddress(r);});
  // "Use my location": the shops within 200 m, closest first (places with only their campus point don't count for distance)
  q("#tGeo").onclick=async()=>{inp.value="";closeL();clr.hidden=true;wnote.textContent="Asking your phone…";near.hidden=true;const g=await quietGeo(6000);if(!g){wnote.textContent="Location is blocked here. Search instead.";return;}
    wnote.textContent="Looking 200 m around…";
    const toRow=p=>({place:true,name:p.name,sub:p.addr||"",lat:p.lat,lon:p.lon,src:"cat",placeId:p.placeId||"",hours:p.hours||null,m:Math.round(metres(g,p))});
    let found=PLACES.concat(uniPlaces().filter(p=>!p.approxLL),state.added).map(toRow).filter(x=>x.m<=200);
    if(g.acc>100&&state.uni&&state.uni!=="other"){const ck=nearestCampus(g,state.uni); // the phone isn't sure where it is: your uni's canteens on the nearest campus as well
      const own=PLACES.concat(uniPlaces()).filter(p=>{const sd=srchDoc(p);return sd.uni===state.uni&&sd.campus===ck&&(p.uni||p.ucl);}).sort((a,b)=>(srchDoc(b).canteen-srchDoc(a).canteen)||metres(g,a)-metres(g,b)).slice(0,8);
      for(const p of own)if(!found.some(y=>y.name===p.name))found.push(Object.assign(toRow(p),{campusPick:true}));}
    const gp=await gpNearby(g,200);for(const x of gp){if(!found.some(y=>nameMatch(y.name,x.name)&&nameKey(y.name).length))found.push(Object.assign({},x,{m:Math.round(metres(g,x))}));}
    const osm=gp.length?[]:await osmShops(g,100);for(const x of osm){if(!found.some(y=>nameMatch(y.name,x.name)&&nameKey(y.name).length))found.push({place:true,name:x.name,sub:"",lat:x.lat,lon:x.lon,src:"osm",m:Math.round(metres(g,x))});}
    if(!gp.length&&!osm.length){const rv=await photonReverse(g,0.1);for(const x of rv){const m=Math.round(metres(g,x));if(m<=120&&!found.some(y=>nameMatch(y.name,x.name)&&nameKey(y.name).length))found.push({...x,src:"photon",m});}}
    found.sort((a,b)=>(a.campusPick?1:0)-(b.campusPick?1:0)||a.m-b.m);found=found.slice(0,14);
    if(!found.length){wnote.textContent=IN_CLAUDE?OFFLINE_MSG:"Nothing listed within 200 m. Type the shop name.";chooseAddress({name:"your location",sub:"",lat:g.lat,lon:g.lon});return;}
    wnote.textContent="";near.innerHTML=(g.acc>100?'<p class="meta">Your phone says within '+Math.round(g.acc)+' m, so here are your uni’s spots too.</p>':'')+found.map((r,i)=>'<button type="button" data-i="'+i+'"><b>'+esc(r.name)+'</b><span class="meta">'+(r.campusPick?'on campus':r.m+' m')+(r.sub?' · '+esc(r.sub):'')+'</span></button>').join("")+'<button type="button" data-other="1">Somewhere else<span class="meta">type the shop name</span></button>';near.hidden=false;
    near.querySelectorAll("button").forEach(b=>b.onclick=()=>{near.hidden=true;if(b.dataset.other){chooseAddress({name:"your location",sub:"",lat:g.lat,lon:g.lon});return;}choosePlace(found[Number(b.dataset.i)]);});};
  if(place){T.at={lat:place.lat,lon:place.lon,label:place.addr||place.name};T.shop={name:place.name,lat:place.lat,lon:place.lon,src:"cat",addr:place.addr||""};ready();}
  // --- 2 · the menu: a photo (Claude reads it and checks the name on the board) or typed text (+3, not verified) ---
  const ITEM_SHAPE='"items":[{"item":"name","price":number in pounds,"cat":one of "hot","snack","coffee","sweet","deal","tags":[subset of "v","vg","gf","meat","pork","fish","dairy","egg","gluten","nuts"] you can tell from the name}]';
  const showItems=(items,odd,board)=>{T.board=board||"";check.textContent=(board?"The board says “"+board+"”. ":"")+(claudeAvailable()?"Claude read ":"Read ")+items.length+" item"+(items.length>1?"s":"")+(odd?" ("+odd+" skipped: under £0.20 or over £15)":"")+". Untick what’s wrong.";which.innerHTML="";note.textContent="";
    out.innerHTML='<div class="menuPrev">'+items.map((x,i)=>'<label><input type="checkbox" checked data-i="'+i+'">'+esc(x.item)+' · '+money(x.price)+(x.price<=5?'':' <span class="note">(over a fiver)</span>')+'</label>').join("")+'</div><div class="act" style="margin-top:8px">'+navNext("toSend","Send")+'</div><p class="note" id="tickNote"></p>';
    out.querySelector("#toSend").onclick=()=>{const keep=[...out.querySelectorAll("input:checked")].map(c=>items[Number(c.dataset.i)]);if(!keep.length){out.querySelector("#tickNote").textContent="Nothing ticked.";return;}T.keep=keep;sendScreen(keep,board);};};
  const sendScreen=(keep,board)=>{setStep(3);const sb=q("#sendBox");
    const g=T.shop.src==="google",shown=T.shop.name||"the place you picked";
    const lk=nameKey(abbrStreet(T.at&&T.at.label||"")).filter(w=>!/^[a-z]{1,2}\d/.test(w)&&!/^\d[a-z]{2}$/.test(w)),nk=new Set(nameKey(abbrStreet(shown||"")));const showAddr=!g&&T.at&&T.at.label&&T.at.label!==shown&&!(lk.length&&lk.every(w=>nk.has(w)));
    sb.innerHTML='<p class="body"><b>'+esc(shown)+'</b>'+(showAddr?' · '+esc(T.at.label):'')+'</p>'+
      '<div class="prices">'+keep.map(x=>'<div class="pr"><div>'+esc(x.item)+'</div><span class="ms wine" data-ms="'+money(x.price)+'" style="--ms:13px"></span></div>').join("")+'</div>'+
      '<p class="note">Thanks for teaching me. Everyone nearby will see it.</p>'+
      '<div class="act" style="margin-top:6px">'+navNext("menuAdd","Send to Fiver")+'</div><p class="note" id="menuSaved"></p>';msRender(sb);
    sb.querySelector("#menuAdd").onclick=async()=>{const btn=sb.querySelector("#menuAdd"),saved=sb.querySelector("#menuSaved");
      btn.disabled=true;saved.textContent="Sending…";
      const here=await quietGeo(4000);const far=here?Math.round(metres(here,T.shop)):null;const nearby=T.via==="photo"&&far!=null&&far<=150;const pts=T.via==="photo"?10:3;
      let lat=T.shop.lat,lon=T.shop.lon,coordSource="manual",address=g?"":(T.shop.addr||T.at.label||"");
      // the name that is kept: the shop's own (catalogue, OpenStreetMap, typed, the board) — for a Google place the board's if it matches, else OpenStreetMap's, else none (shown live from its place_id)
      let finalName=g?(board&&nameMatch(board,T.shop.name)?board:""):T.shop.name;
      if(far!=null&&far<=150){lat=here.lat;lon=here.lon;coordSource="gps";}
      else if(T.shop.src==="osm"||T.shop.src==="photon")coordSource="osm";
      if(g){const alt=await osmLookup(T.shop.name,T.shop);if(alt){address=alt.sub||"";if(!finalName)finalName=String(alt.name||"").slice(0,40);if(coordSource!=="gps"){lat=alt.lat;lon=alt.lon;coordSource="osm";}}else if(coordSource!=="gps")coordSource="google";}
      const offers=keep.map(x=>Object.assign({cat:CATS.some(c=>c.id===x.cat)?x.cat:"snack",item:String(x.item).slice(0,60),price:Math.round(x.price*100)/100,status:"added",tags:Array.isArray(x.tags)?x.tags.filter(t=>typeof t==="string"):[]},
        x.cuisine?{section:x.section||"",cuisine:x.cuisine,type:x.type,role:x.role,temperature:x.temperature}:{}));
      const known=baseFor({name:finalName||T.shop.name,lat,lon,placeId:T.shop.placeId||""},PLACES.concat(uniPlaces().filter(uniOk)));
      state.added.push({id:"menu-"+Date.now(),t:Date.now(),name:known?known.name:finalName,nameLive:!known&&!finalName&&!!T.shop.placeId,lat:known?known.lat:lat,lon:known?known.lon:lon,hoursUnknown:true,baseId:known?known.id:undefined,addr:g?address:(address||T.shop.addr||T.at.label||""),status:"added",addedBy:firstName()||"you",nearby,via:T.via,placeId:T.shop.placeId||"",coordSource,offers,
        why:""});
      if(!known&&!finalName&&g)LIVE_NAMES[T.shop.placeId]=T.shop.name; // shown this session only, never kept
      teachBump();persist();render();
      const everyone=await saveShared({kind:"menu",place_name:known?known.name:finalName,address,lat,lon,items:offers.map(x=>({item:x.item,price:x.price,cat:x.cat,diet:x.tags})),added_by:firstName()||"a student",place_id:T.shop.placeId||null,coord_source:coordSource});
      const at=known?known.name:(finalName||T.shop.name||"this place");
      const akey=T.shop.placeId?String(T.shop.placeId):"fiver:"+(known?known.id:state.added[state.added.length-1].id);
      T.sent=true;setStep(3);teachThanks(d,sb,pts,(everyone?"Everyone nearby sees it.":"Saved on this phone"+(shared.lastErr?" ("+shared.lastErr+")":"")+"."),"Thanks: you added "+keep.length+" dish"+(keep.length>1?"es":"")+" at "+at+".");
      const tt=sb.querySelector("#tThanks");if(tt){tt.insertAdjacentHTML("beforeend",'<div class="k" style="margin-top:14px">About this place</div>'+attrsHTML(akey));wireAttrs(tt);}
      if(d.scrollTo)d.scrollTo({top:0,behavior:"smooth"});};};
  const PHOTO_MAX=3;const P={n:0,items:[],odd:0,board:"",fails:[],cut:0,boardOk:false};T.photos=P;
  let more=q("#tMore");if(!more){more=document.createElement("div");more.id="tMore";more.className="chips";more.style.marginTop="8px";out.after(more);}
  const paintMore=from=>{if(P.n>=PHOTO_MAX||!P.items.length){more.innerHTML="";return;}
    more.innerHTML='<label class="chip">'+CAM+' Add another photo<input type="file" id="menuFile3" accept="image/*"'+(from==="cam"?' capture="environment"':' multiple')+' hidden></label><span class="meta" style="align-self:center">'+P.n+' of '+PHOTO_MAX+'</span>';
    const f3=more.querySelector("#menuFile3");f3.onchange=()=>onFile(f3,from);};
  const teachWait=(line)=>{const h=d.querySelector("#teachHead");if(h&&live())h.innerHTML=rat("f_sniff",84)+'<p class="lead" id="tWaitLine" role="status" aria-live="polite">'+esc(line)+'</p><span class="tload" aria-hidden="true"><i></i><i></i><i></i></span>';};
  const readOne=async(f,tag)=>{const say=k=>{T.wait=k;const m=(tag?tag+": ":"")+WAIT[k];note.textContent=m;teachWait(m);};
    say(0);const b64=await shrinkImage(f,1600);
    const pj=pendGet()||{t:Date.now(),shop:pendShop(T.shop),imgs:[]};if(!pj.imgs)pj.imgs=[];pj.imgs.push(b64);pendPut(pj); // kept until it's read: the app can be closed
    const tm=WAIT_MS.map((ms,i)=>setTimeout(()=>{if(T.wait<i+1)say(i+1);},ms));
    try{const r=photoItems(await askClaude(PHOTO_PROMPT,{json:true,image:b64,max:4000}));if(T.wait<2)say(2);return r;}finally{tm.forEach(clearTimeout);}};
  const showAll=()=>{const board=P.board;
    const tail=()=>{const bits=[];if(P.fails.length)bits.push("Couldn’t read photo "+P.fails.join(" and ")+". The others are fine.");if(P.cut)bits.push("(stop: max_tokens · kept the items that arrived)");
      if(bits.length)check.insertAdjacentHTML("beforeend",'<br><small class="meta">'+esc(bits.join(" "))+'</small>');if(P.warn)check.insertAdjacentHTML("beforeend",'<br><small class="meta">'+esc(P.warn)+'</small>');};
    if(P.boardOk||!board||nameMatch(board,T.shop.name)){showItems(P.items,P.odd,board);tail();}
    else{check.textContent="The board says "+board+", you picked "+T.shop.name+". Which is it?";teachFace(d,"f_oh","The board says "+board+", you picked "+T.shop.name+". Which is it?");note.textContent="";tail();
      which.innerHTML='<button type="button" class="chip" id="wBoard">'+esc(board)+'</button><button type="button" class="chip" id="wPick">'+esc(T.shop.name)+'</button>';
      which.querySelector("#wBoard").onclick=()=>{P.boardOk=true;T.shop={...T.shop,name:board,src:"board"};fixLine();showItems(P.items,P.odd,board);tail();};which.querySelector("#wPick").onclick=()=>{P.boardOk=true;showItems(P.items,P.odd,board);tail();};}};
  const onFile=async(input,from)=>{const picked=[...(input.files||[])];input.value="";if(!picked.length)return;if(!T.shop){note.textContent="Pick a place first";return;}
    if(teachCount()>=TEACH_MAX){const lim=q("#tLimit");lim.textContent="Ten photos a day is the limit. Even for rats. Typing still works.";lim.hidden=false;q("#tTypeBox").hidden=false;return;}
    from=from||(input.id==="menuFile"?"cam":"lib");
    const room=PHOTO_MAX-P.n;const files=picked.slice(0,room);P.warn=picked.length>room?(room===PHOTO_MAX?"3 photos max. I used the first 3.":"3 photos max. I used the first "+room+" of these."):"";
    if(!files.length)return;
    which.innerHTML="";T.keep=null;T.via="photo";q("#ts3").textContent="+10 crumbs";more.innerHTML="";
    let lastErr=null;const first=P.n===0;
    for(let k=0;k<files.length;k++){const num=P.n+1,total=P.n+files.length-k;
      const tag=total>1||!first?"Photo "+num+" of "+Math.max(total,num):"";
      try{const j=await readOne(files[k],tag);P.n++;
        if(!j||j.isMenu===false||!j.items.length){P.fails.push(num);lastErr={code:"not_menu"};continue;}
        const {items,odd}=cleanItems(j);P.odd+=odd;if(j.cut)P.cut++;
        if(!items.length){P.fails.push(num);lastErr={code:"no_prices",odd};continue;}
        const seen=new Set(P.items.map(x=>x.item.toLowerCase().replace(/\s+/g," ").trim()+"|"+x.price.toFixed(2)));
        for(const x of items){const key=x.item.toLowerCase().replace(/\s+/g," ").trim()+"|"+x.price.toFixed(2);if(!seen.has(key)){seen.add(key);P.items.push(x);}}
        if(!P.board){const b=String(j.place||"").slice(0,40).trim();if(b)P.board=b;}
      }catch(e){P.n++;P.fails.push(num);lastErr=e;}}
    note.textContent="";T.wait=-1;
    if(!P.items.length){ // nothing at all yet: the single-photo messages
      pendClear();const e=lastErr||{};if(!live())return;
      if(e.code==="not_menu"){check.textContent="That’s not a menu. Nice try.";teachFace(d,"f_sad","That’s not a menu. Nice try.");}
      else if(e.code==="no_prices")check.textContent=e.odd?"Those prices don’t look right (under £0.20 or over £15). Not saved.":"Claude couldn’t read prices in that photo. Try closer, straighter, more light.";
      else if(e.code==="rate_limited"||e.code==="not_granted"||e.code==="invalid_json"){check.innerHTML=esc(claudeErr(e,"Claude didn’t answer. Try again."))+(e.detail?'<br><small class="meta">'+esc(e.detail)+'</small>':'');}
      else typeInstead("Couldn’t read that one. Type it instead →");
      if(d.querySelector("#teachHead .tload"))teachFace(d,"f_sad",check.textContent||"Couldn’t read that one.");
      P.n=0;P.fails=[];P.cut=0;P.odd=0;P.board="";return;}
    if(!live()){pendPut({t:Date.now(),shop:pendShop(T.shop),items:P.items,odd:P.odd,board:P.board,n:P.n});readyNudge();return;} // the panel was closed: say so when it's ready
    pendClear();teachFace(d,"f_hearts","Got "+P.items.length+" item"+(P.items.length>1?"s":"")+(P.n>1?" from "+P.n+" photos":"")+". Untick what’s wrong.");showAll();paintMore(from);};
  file.onchange=()=>onFile(file,"cam");if(file2){file2.multiple=true;file2.onchange=()=>onFile(file2,"lib");}
  q("#tTypeBtn").onclick=()=>{const box=q("#tTypeBox");box.hidden=!box.hidden;if(!box.hidden)q("#tTypeIn").focus();};
  // --- "Tell me a deal": a student discount or a one-off offer at the place picked above. No photos; a tip, never a price ---
  const D={kind:"",show:""};
  q("#tDealBtn").onclick=()=>{const box=q("#tDealBox");box.hidden=!box.hidden;q("#tDealBtn").classList.toggle("on",!box.hidden);if(box.hidden)return;
    q("#tTypeBox").hidden=true;q("#tDealNameBox").hidden=!(T.shop&&T.shop.src==="google");}; // Google's name never goes into Fiver: the sign's does
  q("#tDealKind").addEventListener("click",e=>{const b=e.target.closest("button[data-k]");if(!b)return;D.kind=b.dataset.k;q("#tDealKind").querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));
    q("#tDealStudent").hidden=D.kind!=="student";q("#tDealOne").hidden=D.kind!=="oneoff";q("#tDealAct").hidden=false;q("#tDealNote").textContent="";
    const f=q(D.kind==="student"?"#tDealAmt":"#tDealWhat");if(f)f.focus();});
  q("#tDealShow").addEventListener("click",e=>{const b=e.target.closest("button[data-show]");if(!b)return;D.show=b.dataset.show;q("#tDealShow").querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));});
  q("#tDealSend").onclick=async()=>{const n=q("#tDealNote"),btn=q("#tDealSend");
    if(!T.shop){n.textContent="Pick the shop first, above.";return;}
    if(teachCount()>=TEACH_MAX){n.textContent="Ten a day is the limit. Even for rats.";return;}
    const text=(D.kind==="student"?q("#tDealAmt").value:q("#tDealWhat").value).trim().replace(/\s+/g," ").slice(0,D.kind==="student"?40:80);
    if(!D.kind){n.textContent="Student discount or one-off offer?";return;}
    if(text.length<2){n.textContent=D.kind==="student"?"How much off? For example 10% or £1 off.":"What’s the offer?";return;}
    if(D.kind==="student"&&!D.show){n.textContent="What do you show at the till?";return;}
    const needName=T.shop.src==="google";const typed=needName?(q("#tDealName").value||"").trim().slice(0,40):"";if(needName&&typed.length<2){n.textContent="Type the name as it is on the shop sign.";return;}
    const finalName=needName?typed:T.shop.name;btn.disabled=true;n.textContent="Sending…";
    let lat=T.shop.lat,lon=T.shop.lon,address=needName?"":(T.shop.addr||(T.at&&T.at.label)||""),coordSource=T.shop.src==="osm"||T.shop.src==="photon"?"osm":needName?"google":"manual";
    if(needName){const alt=await osmLookup(finalName,T.shop);if(alt){address=alt.sub||"";lat=alt.lat;lon=alt.lon;coordSource="osm";}}
    const endV=q("#tDealEnd")?q("#tDealEnd").value:"";const ends=D.kind==="oneoff"?(endV?new Date(endV+"T23:59:00"):new Date(Date.now()+3*86400e3)):null;
    const item={type:D.kind,text,show:D.kind==="student"?D.show:""};
    addTip({place_name:finalName,lat,lon,place_id:T.shop.placeId||"",items:[item],ends_at:ends?ends.toISOString():null,created_at:new Date().toISOString(),mine:true});
    teachBump();
    const row={kind:"deal",place_name:finalName,address,lat,lon,place_id:T.shop.placeId||null,items:[item],added_by:firstName()||"a student",coord_source:coordSource};if(ends)row.ends_at=ends.toISOString();
    const everyone=await saveShared(row);
    T.sent=true;setStep(3);teachThanks(d,q("#sendBox"),10,(everyone?"Everyone nearby sees it. ":"Saved on this phone"+(shared.lastErr?" ("+shared.lastErr+")":"")+". ")+"Tip at "+finalName+": "+tipText(item,row.ends_at)+".","A secret discount? Noted. You just saved someone a quid.");};
  q("#tTypeGo").onclick=async()=>{const text=q("#tTypeIn").value.trim();if(!text||!T.shop){note.textContent="Type the items and prices first.";return;}
    if(!claudeAvailable()){note.textContent="";}
    const btn=q("#tTypeGo");btn.disabled=true;note.textContent="Sorting that out…";out.innerHTML="";which.innerHTML="";check.textContent="";T.keep=null;T.via="text";q("#ts3").textContent="+3 crumbs";
    const byClaude=claudeAvailable();
    try{const j=!byClaude?parseMenuText(text):await askClaude('A student typed items and prices from a menu at "'+T.shop.name.replace(/"/g,"")+'" in London. Reply with JSON only: {'+ITEM_SHAPE+'}. Keep only items with a clear price in pounds. "hot" = hot food, "snack" = cold food, "coffee" = any drink, "sweet" = cakes and desserts.\n\nTEXT:\n'+text.slice(0,2000),{json:true,max:1000});
      const {items,odd}=cleanItems(j);if(!items.length){check.textContent=odd?"Those prices don’t look right (under £0.20 or over £15). Not saved.":(byClaude?"Claude couldn’t find prices in that. Try “flat white £2.60, soup £3.20”.":"I couldn’t spot any prices. Try “flat white £2.60, soup £3.20”.");note.textContent="";return;}
      showItems(items,odd,"");check.textContent="Typed menus are +3. A photo is +10.";}
    catch(e){check.textContent=claudeErr(e,"Claude didn’t answer. Try again.");note.textContent="";}
    finally{btn.disabled=false;}};
  if(resume&&resume.items&&resume.items.length){const sh=resume.shop||{};T.at={lat:sh.lat,lon:sh.lon,label:sh.addr||""};T.shop=Object.assign({},sh,{name:sh.name||(sh.placeId&&LIVE_NAMES[sh.placeId])||""});
    if(!T.shop.name&&sh.placeId)gpLive(sh.placeId).then(x=>{if(x&&x.name&&!T.shop.name){T.shop.name=x.name;fixLine();q("#ts1").textContent=x.name;}});
    ready();T.via="photo";Object.assign(P,{n:resume.n||1,items:resume.items.slice(),odd:resume.odd||0,board:resume.board||"",fails:[],cut:0,boardOk:false});pendClear();
    teachFace(d,"f_hearts","Got "+P.items.length+" item"+(P.items.length>1?"s":"")+". Untick what’s wrong.");showAll();}
  d.__teach=T; // for tests
}
function shrinkImage(file,max){return new Promise((res,rej)=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{const s=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement("canvas");c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);res(c.toDataURL("image/jpeg",0.8).split(",")[1]);};img.onerror=()=>rej({code:"bad_image"});img.src=url;});}
function wireEvents(d){
  const btn=d.querySelector("#evtBtn"),note=d.querySelector("#evtNote"),ta=d.querySelector("#evtText"),sel=d.querySelector("#evtVenue");
  sel.innerHTML=VENUES.map(v=>'<option value="'+v.id+'">'+esc(v.name)+'</option>').join("");
  if(!claudeAvailable()){btn.disabled=true;note.textContent="Reading invites needs Claude: add an API key under Cards & apps.";return;}
  btn.onclick=async()=>{const text=ta.value.trim();if(!text){note.textContent="Paste the event text first.";return;}btn.disabled=true;note.textContent="Checking every Pret in "+areaName()+"… and the invite.";
    const venue=VENUES.find(v=>v.id===sel.value)||VENUES[0];
    const prompt='Read this event invite and reply with only a JSON object: {"freeFood": boolean, "what": string, "date": "YYYY-MM-DD" or "", "start": "HH:MM" or "", "end": "HH:MM" or "", "title": string}. freeFood is true only if food or drink is offered at no cost to attendees. Today is '+selectedTime().dateISO+'. If the end time is missing, use start + 2 hours.\n\nEVENT:\n'+text.slice(0,6000);
    try{const j=await askClaude(prompt,{json:true});
      if(!j||!j.freeFood){note.textContent="Claude read it: no free food mentioned. Not added.";}
      else if(!j.date||!j.start){note.textContent="Claude found food but no date or time. Add the date to the text and try again.";}
      else{const end=j.end||addHours(j.start,2);state.added.push({id:"add-"+Date.now(),name:j.title||"Event",lat:venue.lat,lon:venue.lon,when:{date:j.date,start:j.start,end},addr:venue.name,status:"added",offers:[{cat:"free",item:j.what||"free food",price:0,status:"added",tags:[]}],why:"Added from a pasted invite.",addedBy:firstName()||"you"});persist();ta.value="";render();
        const iso=(dt,hm)=>{const x=new Date(dt+"T"+hm+":00");return isNaN(x)?null:x.toISOString();};
        const everyone=await saveShared({kind:"event",place_name:(j.title||"Event").slice(0,48),address:venue.name,lat:venue.lat,lon:venue.lon,items:[{item:(j.what||"free food").slice(0,60),price:0,cat:"free",diet:[]}],starts_at:iso(j.date,j.start),ends_at:iso(j.date,end),added_by:firstName()||"a student",coord_source:"manual"});
        afterNote("#evtNote",(everyone?"Everyone nearby sees it. ":"Saved on this phone"+(shared.lastErr?" ("+shared.lastErr+")":"")+". ")+"Added: "+(j.what||"free food")+" on "+j.date+" at "+j.start+".");teachCelebrate(d,10);}
    }catch(e){note.textContent=claudeErr(e,"Claude didn’t answer. Try again later.");}
    finally{btn.disabled=false;}};
}
function afterNote(sel,text){const n=document.querySelector(sel);if(!n)return;n.textContent=text;const dt=n.closest("details");if(dt)dt.open=true;}
function addHours(hhmm,h){const m=hm(hhmm)+h*60;return String(Math.floor(m/60)%24).padStart(2,"0")+":"+String(m%60).padStart(2,"0");}


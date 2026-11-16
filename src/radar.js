/* ---------- FALLBACK MAP (inside claude.ai, no network): a walk radar ----------
   Rings at 5 and 10 minutes on foot, pins at their true distance and bearing from you,
   tube stations for orientation. Nothing drawn that isn't real. */
const RW=1000,RH=640;
let radarZoom=1;
function radarScale(){return (RH/2-36)/800*radarZoom;}           // px per metre: 10-min ring fits the height
function radarXY(here,lat,lon){const s=radarScale();const dx=(lon-here.lon)*Math.cos(here.lat*Math.PI/180)*111320,dy=(lat-here.lat)*110540;return [RW/2+dx*s,RH/2-dy*s];}
function radarLL(here,x,y){const s=radarScale();const dx=(x-RW/2)/s,dy=(RH/2-y)/s;return [here.lat+dy/110540,here.lon+dx/(111320*Math.cos(here.lat*Math.PI/180))];}
function buildDrawnMap(svg,opts){
  svg.innerHTML="";svg.setAttribute("viewBox","0 0 "+RW+" "+RH);svg.setAttribute("preserveAspectRatio",svg.parentElement&&svg.parentElement.classList.contains("big")?"xMidYMid slice":"xMidYMid meet");
  const here=state.where||VENUES[0];const s=radarScale();const ps=1.9;const fs=n=>(n*ps).toFixed(1)+"px";
  const cx=RW/2,cy=RH/2;
  svg.appendChild(el("rect",{x:0,y:0,width:RW,height:RH,fill:"var(--map-ground)"}));
  // rings: 5 and 10 minutes
  for(const [m,r] of [[5,400],[10,800]]){const rr=r*s;
    svg.appendChild(el("circle",{cx,cy,r:rr,fill:"none",stroke:"var(--map-ink)","stroke-width":1.4*ps,"stroke-dasharray":(7*ps)+" "+(7*ps),opacity:m===10?.75:.4}));
    svg.appendChild(el("text",{x:cx+rr*0.707+6*ps,y:cy-rr*0.707-6*ps,class:"mapLbl",style:"font-size:"+fs(10)},m+" MIN"));}
  // compass north
  svg.appendChild(el("text",{x:cx,y:28*ps,"text-anchor":"middle",class:"mapLbl",style:"font-size:"+fs(10)},"N"));
  svg.appendChild(el("path",{d:"M"+cx+" "+(34*ps)+" l0 "+(16*ps),stroke:"var(--map-ink)","stroke-width":1.2*ps,opacity:.6}));
  // tube stations for orientation
  for(const tb of TUBES){const [x,y]=radarXY(here,tb.at[0],tb.at[1]);if(x<30||x>RW-30||y<30||y>RH-30)continue;
    svg.appendChild(el("circle",{cx:x,cy:y,r:7*ps,fill:"var(--map-ground)",stroke:"var(--fg)","stroke-width":3.2*ps}));svg.appendChild(el("rect",{x:x-10.5*ps,y:y-2.2*ps,width:21*ps,height:4.4*ps,fill:"var(--fg)"}));
    svg.appendChild(el("text",{x,y:y+18*ps,"text-anchor":"middle",class:"mapLbl",style:"font-size:"+fs(9.5)},tb.n));}
  // pins
  const pins=el("g",{});svg.appendChild(pins);const you=el("g",{});svg.appendChild(you);
  if(opts&&opts.pins){const top=new Set(opts.top||[]);const seen={};
    for(const row of opts.pins){if(row.fits)continue;const [x,y]=radarXY(here,row.p.lat,row.p.lon);if(x<0||x>RW||y<0||y>RH)continue;
      const g=el("g",{"data-id":row.p.id,class:"pin dim",tabindex:0,role:"button"});g.appendChild(el("title",{},row.p.name+" · "+(row.o.open?"open":row.o.reason)));
      g.appendChild(el("circle",{cx:x,cy:y,r:5*ps,fill:"var(--pin-other)",stroke:"var(--bg)","stroke-width":1.5*ps}));g.addEventListener("click",()=>opts.pick?opts.pick(row):openSheet(row));pins.appendChild(g);}
    const priced=opts.priced||null;
    for(const row of opts.pins.filter(r=>r.fits&&priced&&!priced.has(r.p.id))){const [x,y]=radarXY(here,row.p.lat,row.p.lon);if(x<0||x>RW||y<0||y>RH)continue;
      const g=el("g",{class:"pin small",tabindex:0,role:"button","data-id":row.p.id});g.appendChild(el("title",{},row.p.name+" · "+money(row.pr.price)));
      g.appendChild(el("circle",{cx:x,cy:y,r:6*ps,fill:"var(--wine)",stroke:"var(--bg)","stroke-width":1.5*ps}));g.addEventListener("click",()=>opts.pick?opts.pick(row):openSheet(row));pins.appendChild(g);}
    for(const row of opts.pins.filter(r=>r.fits&&(!priced||priced.has(r.p.id))).slice().reverse()){let [x,y]=radarXY(here,row.p.lat,row.p.lon);
      const key=Math.round(x/14)+":"+Math.round(y/14);seen[key]=(seen[key]||0)+1;y-=(seen[key]-1)*27*ps;
      const lab=money(row.pr.price).replace(".00","");const w=(lab.length*8.5+16)*ps;
      const g=el("g",{class:"pin"+(top.has(row.p.id)?" top":""),tabindex:0,role:"button","data-id":row.p.id});g.appendChild(el("title",{},row.p.name));
      g.appendChild(el("rect",{class:"ring",x:x-w/2-4*ps,y:y-16*ps,width:w+8*ps,height:32*ps,rx:16*ps,style:"stroke-width:"+(3*ps)}));
      const col=row.of.cat==="free"?"var(--pin-free)":"var(--pin-other)";
      g.appendChild(el("rect",{x:x-w/2,y:y-12*ps,width:w,height:24*ps,rx:12*ps,fill:col,stroke:"var(--bg)","stroke-width":2*ps}));
      g.appendChild(el("text",{x,y:y+5*ps,"text-anchor":"middle",style:"font-size:"+fs(13)},lab));
      const act=()=>opts.pick?opts.pick(row):openSheet(row);g.addEventListener("click",act);g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();act();}});pins.appendChild(g);}}
  // you, always at the centre
  you.appendChild(el("circle",{cx,cy,r:22*ps,class:"youHalo"}));you.appendChild(el("circle",{cx,cy,r:11*ps,class:"you",style:"stroke-width:"+(4*ps)}));you.appendChild(el("circle",{cx,cy,r:4*ps,fill:"var(--wine)"}));
  if(state.where)you.appendChild(el("text",{x:cx,y:cy+34*ps,"text-anchor":"middle",class:"mapLbl",style:"font-size:"+fs(9.5)},"YOU"));
  // tap to move "you" (step 1)
  if(opts&&opts.tap&&!svg._tapWired){svg._tapWired=true;svg.addEventListener("click",e=>{if(e.target.closest(".pin"))return;const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const q=pt.matrixTransform(svg.getScreenCTM().inverse());const [lat,lon]=radarLL(here,q.x,q.y);state.where={lat,lon,label:"where you tapped"};opts.tap();});}
  const box=svg.parentElement;let ctl=box.querySelector(".mapctl");if(ctl)ctl.remove();
  ctl=document.createElement("div");ctl.className="mapctl";ctl.innerHTML='<button type="button" aria-label="Zoom in">+</button><button type="button" aria-label="Zoom out">−</button>';
  const [bIn,bOut]=ctl.querySelectorAll("button");bIn.onclick=()=>{radarZoom=Math.min(2.2,radarZoom*1.3);buildDrawnMap(svg,opts);};bOut.onclick=()=>{radarZoom=Math.max(0.6,radarZoom/1.3);buildDrawnMap(svg,opts);};
  box.appendChild(ctl);
}

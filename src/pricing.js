/* ---------- PRICING ---------- */
function cardName(id){return (CARDS.find(c=>c.id===id)||{}).name||id;}
function r2(v){return Math.round(v*100)/100;}
// price ladder for an offer: [{label, price, mine:boolean, note, promo, status}]
function ladder(p,o,t){
  const rows=[];
  if(o.cat==="deal"&&p.deal&&o.price==null){const d=DEALS[p.deal];rows.push({label:"No card",price:d.base,mine:true,status:d.status});
    for(const c in d.with)rows.push({label:cardName(c),price:d.with[c],mine:state.cards.has(c),status:d.status});
  }else{
    rows.push({label:o.price===0?"Everyone":"No card",price:o.price,mine:true,status:o.status});
    if(o.with)for(const c in o.with){const w=o.with[c];const ok=!w.days||w.days.includes(t.day);rows.push({label:cardName(c),price:w.price,mine:state.cards.has(c)&&ok,status:o.status,note:w.label+(ok?"":" (not today)"),promo:!!w.promo});}
    const disc=discOf(p);
    if(disc&&o.price>0)for(const c in disc){if(o.with&&o.with[c]&&o.with[c].price<=r2(o.price*(1-disc[c])))continue;if(p.discMin&&p.discMin[c]&&o.price<p.discMin[c])continue; // Leon: only on an order of £8 or more
      rows.push({label:cardName(c),price:p.discFloor?Math.floor(o.price*(1-disc[c])*100+1e-6)/100:r2(o.price*(1-disc[c])),mine:state.cards.has(c),status:o.status,note:Math.round(disc[c]*100)+"% off everything with "+cardName(c)+(p.discNote&&p.discNote[c]?" ("+p.discNote[c]+")":"")});}
    // end-of-day windows: Pret's last hour, itsu's and Wasabi's last half hour (no card, not on top of a card)
    if(p.last&&o.price>0&&p.last.cats.includes(o.cat)&&t){const w=openWindow(p,t.day);
      if(w&&t.minutes>=w[1]-p.last.mins&&t.minutes<w[1])rows.push({label:"Last "+p.last.mins+" min",price:r2(o.price*(1-p.last.off)),mine:true,status:o.status,time:true,note:Math.round(p.last.off*100)+"% off in the last "+p.last.mins+" minutes before closing: whatever is left"});}
  }
  return rows;
}
/* A place's card discount. Leon: never in a station shop (except London Bridge), only with the app or kiosk, from £8. */
function discOf(p){if(chainKey(p.name)==="leon"&&(p.discNo||leonStation(p)))return null;return p.disc||null;}
function bestPrice(p,o,t){
  const rows=ladder(p,o,t).filter(r=>r.mine&&!r.promo);
  const best=rows.reduce((a,b)=>b.price<a.price?b:a,rows[0]);
  return {price:best.price,label:best.label==="No card"||best.label==="Everyone"?"":best.time?"in the last "+(best.label.replace("Last ","")):"with "+best.label,status:best.status,time:!!best.time};
}

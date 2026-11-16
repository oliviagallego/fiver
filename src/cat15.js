const CAT15_USE={"leon": "leon", "blacksheep": "bsc", "franco_manca": "franco", "nandos": "nandos"};
(function(){const key=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();const today=new Date().toISOString().slice(0,10);
  const promosOf=c=>(c.promos||[]).filter(x=>!x.until||x.until>=today).map(x=>{const y={card:x.card||null,label:x.label};if(x.days)y.days=x.days;return y;});
  const add=(p,c)=>{if(p._c15)return;p._c15=1;const have=new Set(p.offers.map(o=>key(o.item)));for(const o of c.offers)if(!have.has(key(o.item)))p.offers.push(Object.assign({},o));if(c.drink)p.drinkRef=c.drink;if(c.service)p.service=true;};
  const byKey={};for(const ch in CAT15_USE)byKey[CAT15_USE[ch]]=CAT15[ch];
  for(const p of PLACES){const c=byKey[chainKey(p.name)];if(c){p.offers=p.offers.slice();add(p,c);}}
  for(const ch of ["franco","nandos"]){const c=CAT15[ch==="franco"?"franco_manca":"nandos"];if(!c)continue;CHAIN_TEMPLATES.push({id:ch+"-tpl",name:c.name,lat:null,lon:null,addr:"",status:"shop",offers:[],why:"",promos:promosOf(c)});add(CHAIN_TEMPLATES[CHAIN_TEMPLATES.length-1],c);}
  // every catalogue entry as a template "c15-<chain>": cloned onto the branches in london.json (chains) or its geocoded point (independents, markets)
  for(const ch in CAT15){const c=CAT15[ch];const t={id:"c15-"+ch,name:c.name,lat:null,lon:null,addr:c.addr||"",status:"shop",offers:[],why:c.why||"",c15:ch,c15kind:c.kind,promos:promosOf(c)};add(t,c);CHAIN_TEMPLATES.push(t);}
})();


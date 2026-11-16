/* ---------- DIET ---------- */
// What we know about an item vs what the student avoids. hide = we know it won't work; ask = we don't know, ask staff.
function dietCheck(o){
  const tags=o.tags||[];const ask=[];
  for(const id of state.diet){const d=DIETS.find(x=>x.id===id);if(!d)continue;
    if(d.no.some(x=>tags.includes(x))){if(d.soft&&d.soft.some(x=>tags.includes(x))){ask.push(d.name.toLowerCase()+": alt milk, ask");continue;}return {hide:true,why:d.name};}
    if(!d.ok.some(x=>tags.includes(x)))ask.push(d.name.toLowerCase()+": ask staff");
  }
  return {hide:false,ask};
}
function dietLabel(o){const d=dietCheck(o);if(d.hide)return "not for you ("+d.why.toLowerCase()+")";return d.ask.length?d.ask.join(" · "):(state.diet.size?"fits your diet, on what we know":"");}

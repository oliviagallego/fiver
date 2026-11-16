/* Hand-lettered titles: one PNG per character (97, with 6 px of padding), sitting on a shared baseline so tails (g, j, p, q, y, Q, comma) hang below it.
   Scale = --ms / cap height. Each letter rides up or down a touch (±6 %) and tilts a little (±3°), seeded per word so a word always looks the same;
   the last letter of a title leans about 12° and drops, like the D in FED. Prices (£1.40) only ride, never tilt.
   Digits and £ are drawn lower-case-tall in the PNGs: they are scaled up (top_from_baseline → cap height) so the 8 in "SEE ALL 8" stands as tall as the capitals. */
const msBoost=(k,g)=>/^[0-9£]$/.test(k)&&g.top<0?MS_CAP/(-g.top):1;
const MS_ASC=Math.max(...Object.values(MS).map(g=>-g.top)),MS_DESC=Math.max(0,...Object.values(MS).map(g=>g.bot));
function msSeed(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return function(){h+=0x6D2B79F5;let t=Math.imul(h^(h>>>15),1|h);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
const MS_MAP={"'":"’","`":"’","´":"’","‘":"’","–":"-","—":"-","·":"."," ":" "};
function msChar(ch){if(MS[ch])return ch;const m=MS_MAP[ch];if(m&&MS[m])return m;const base=ch.normalize("NFD").replace(/[̀-ͯ]/g,"");if(MS[base])return base;const up=base.toUpperCase();if(MS[up])return up;return null;}
function msRender(root){
  (root||document).querySelectorAll("[data-ms]").forEach(el=>{
    if(el.dataset.msDone===el.dataset.ms)return;el.dataset.msDone=el.dataset.ms;el.innerHTML="";
    const text=(el.dataset.ms||"").normalize("NFC").toUpperCase();const price=/£|^\d/.test(text.trim());
    const words=text.split(" ");
    // the line box: as tall as this text needs, so capitals-only titles stay tight
    let asc=0,desc=0;for(const w of words)for(const ch of w){const k=msChar(ch);const g=k&&MS[k];if(g){const b=msBoost(k,g);asc=Math.max(asc,-g.top*b);desc=Math.max(desc,g.bot*b);}else asc=Math.max(asc,MS_CAP);}
    if(!asc)asc=MS_CAP;const LH=asc+desc;el.style.setProperty("--lh",(LH/MS_CAP).toFixed(3));
    const lastWord=words.map((w,i)=>w?i:-1).filter(i=>i>=0).pop();
    words.forEach((word,wi)=>{
      if(wi){const s=document.createElement("i");s.className="ms-sp";el.appendChild(s);}
      if(!word)return;
      const w=document.createElement("span");w.className="ms-w";const rnd=msSeed(word);const chars=[...word];
      chars.forEach((ch,ci)=>{
        const k=msChar(ch);const g=k&&MS[k];
        if(!g){const t=document.createElement("b");t.textContent=ch;w.appendChild(t);return;}
        const b=msBoost(k,g);
        const s=document.createElement("span");s.className="g";s.style.width="calc(var(--ms) * "+(g.w*b/MS_CAP).toFixed(4)+")";
        const img=document.createElement("img");img.src="data:image/png;base64,"+g.b64;img.alt="";img.draggable=false;
        img.style.width="calc(var(--ms) * "+(g.w*b/MS_CAP).toFixed(4)+")";img.style.height="calc(var(--ms) * "+(g.h*b/MS_CAP).toFixed(4)+")";
        img.style.top="calc(var(--ms) * "+((asc+(g.top-MS_PAD)*b)/MS_CAP).toFixed(4)+")";
        let dy=(rnd()-0.5)*0.12*(g.h*b/MS_CAP),rot=price?0:(rnd()-0.5)*6;
        if(!price&&wi===lastWord&&ci===chars.length-1){rot=12;dy=0.06;}
        img.style.transform="translateY(calc(var(--ms) * "+dy.toFixed(3)+")) rotate("+rot.toFixed(1)+"deg)";
        s.appendChild(img);w.appendChild(s);
      });
      el.appendChild(w);
    });
  });
}


/* Fiver service worker. All paths are relative, so it works at the site root (fedforafiver.com/) and under /fiver/.
   index.html: network first (no HTTP cache) so a fresh upload shows on the next reload, but never wait more than 3 s —
   after that the saved copy opens and the fresh one is saved for next time. No saved copy and no network: a small cream page,
   never a black screen. Icons and the manifest come from the cache. The cache name changes with every build. */
const CACHE="fiver-v115";
const OFFLINE=()=>new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fed for a Fiver</title><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FFF7EB;color:#59211F;font:16px/1.4 system-ui,sans-serif;text-align:center;padding:24px"><p>No connection. Fiver will be here when you are back online.<br><br><a href="./" style="color:#59211F">Try again</a></p>',{headers:{"Content-Type":"text/html; charset=utf-8"}});
const SHELL=["./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:"reload"})).catch(()=>null)))).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(u.origin!==location.origin||e.request.method!=="GET")return;   // tiles, fonts, Google, Supabase, Anthropic: straight to the network
  const isPage=e.request.mode==="navigate"||u.pathname.endsWith("/")||u.pathname.endsWith("index.html");
  if(isPage){
    const net=fetch(e.request.url,{cache:"no-store",credentials:"same-origin"}).then(r=>{if(r.ok){const c=r.clone();return caches.open(CACHE).then(x=>x.put("./index.html",c)).then(()=>r,()=>r);}return r;});
    e.waitUntil(net.catch(()=>null));
    e.respondWith(caches.match("./index.html").then(saved=>{
      if(!saved)return net.then(r=>r.status>=500?OFFLINE():r,()=>OFFLINE());
      const late=new Promise(res=>setTimeout(()=>res(null),3000));
      return Promise.race([net,late]).then(r=>r&&r.ok?r:saved,()=>saved);
    }));
    return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n.ok){const c=n.clone();caches.open(CACHE).then(x=>x.put(e.request,c));}return n;})));
});

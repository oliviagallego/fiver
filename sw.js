/* Fiver service worker. index.html is always fetched from the network (no HTTP cache) so a fresh upload shows on the next reload;
   the saved copy is used only when there is no connection. Icons and the manifest come from the cache. The cache name changes with every build. */
const CACHE="fiver-v52";
const SHELL=["./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:"reload"})).catch(()=>null)))).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(u.origin!==location.origin||e.request.method!=="GET")return;   // tiles, fonts, Google, Supabase, Anthropic: straight to the network
  const isPage=e.request.mode==="navigate"||u.pathname.endsWith("/")||u.pathname.endsWith("index.html");
  if(isPage){
    e.respondWith(fetch(e.request.url,{cache:"no-store",credentials:"same-origin"}).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put("./index.html",c));}return r;})
      .catch(()=>caches.match("./index.html")));
    return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n.ok){const c=n.clone();caches.open(CACHE).then(x=>x.put(e.request,c));}return n;})));
});

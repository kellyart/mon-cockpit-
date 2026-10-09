// Hors ligne : mise en cache au premier chargement, mise à jour en arrière-plan (stale-while-revalidate)
const C='cockpit-v5',F=['./','index.html','css/app.css','js/db.js','js/app.js','js/work.js','js/files.js','js/search.js','js/lock.js','js/backup.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(caches.match(e.request).then(r=>{const n=fetch(e.request).then(x=>{if(x.ok)caches.open(C).then(c=>c.put(e.request,x.clone()));return x}).catch(()=>r);return r||n}))});

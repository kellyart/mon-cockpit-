// Stockage : IndexedDB (projets, tâches, idées, notes, évolutions, décisions, fichiers, paramètres, activité)
const DB={db:null,
open(){return new Promise((ok,ko)=>{const r=indexedDB.open('cockpit',2);
 r.onupgradeneeded=()=>['projects','tasks','ideas','notes','evolutions','decisions','files','blobs','settings','activity'].forEach(s=>r.result.objectStoreNames.contains(s)||r.result.createObjectStore(s,{keyPath:'id'}));
 r.onsuccess=()=>{this.db=r.result;ok()};r.onerror=()=>ko(r.error)})},
tx(s,m,f){return new Promise((ok,ko)=>{const t=this.db.transaction(s,m),q=f(t.objectStore(s));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>ko(t.error)})},
all(s){return this.tx(s,'readonly',o=>o.getAll())},
put(s,v){return this.tx(s,'readwrite',o=>o.put(v))},
get(s,id){return this.tx(s,'readonly',o=>o.get(id))},
clear(s){return this.tx(s,'readwrite',o=>o.clear())},
del(s,id){return this.tx(s,'readwrite',o=>o.delete(id))}};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);

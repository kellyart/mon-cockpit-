// Données : export/import complets (fichiers inclus), stockage, installation
const VER='2.0',STORES=['projects','tasks','ideas','notes','evolutions','decisions','activity','files'];
let pend=null,dip=null,stor='';
const bmsg=t=>{const e=$('#bmsg');if(e)e.textContent=t};
const rd=b=>new Promise((ok,ko)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=ko;r.readAsDataURL(b)});
const toBlob=u=>{const[h,b]=u.split(','),s=atob(b),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return new Blob([a],{type:(h.match(/:(.*?);/)||[])[1]||''})};
const valid=d=>d&&d.app==='mon-cockpit'&&Array.isArray(d.projects)&&STORES.every(s=>!d[s]||(Array.isArray(d[s])&&d[s].every(x=>x&&typeof x.id==='string')));
async function exp(){try{const d={app:'mon-cockpit',version:2,date:new Date().toISOString()};
 for(const s of STORES)d[s]=await DB.all(s);
 d.settings=(await DB.all('settings')).filter(s=>s.id==='theme'); // le code de verrouillage n'est jamais exporté
 d.blobs=[];for(const f of d.files)if(f.kind==='file'){const b=await DB.get('blobs',f.id);if(b)d.blobs.push({id:f.id,data:await rd(b.blob)})}
 const u=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:'application/json'})),a=document.createElement('a');
 a.href=u;a.download='mon-cockpit-sauvegarde-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),4e3);bmsg('Sauvegarde exportée.')}
 catch(e){console.error(e);bmsg('Une erreur est survenue lors de l’exportation.')}}
async function impPick(inp){if(!inp.files[0])return;pend=null;const b=$('#impok');if(b)b.hidden=true;
 try{const d=JSON.parse(await inp.files[0].text());if(!valid(d))throw 0;pend=d;
  bmsg(`Sauvegarde valide : ${d.projects.length} projet(s). Les données actuelles seront remplacées.`);if(b)b.hidden=false}
 catch(e){bmsg('Ce fichier n’est pas une sauvegarde Mon Cockpit valide.')}}
async function impGo(){if(!pend)return;try{const d=pend;
 for(const s of [...STORES,'blobs'])await DB.clear(s);
 for(const s of STORES)for(const x of d[s]||[])await DB.put(s,x);
 for(const b of d.blobs||[])await DB.put('blobs',{id:b.id,blob:toBlob(b.data)});
 const t=(d.settings||[]).find(s=>s.id==='theme');if(t){await DB.put('settings',t);theme=t.v;applyTheme()}
 pend=null;await load();location.hash='#/';route();saved()}
 catch(e){console.error(e);bmsg('Une erreur est survenue lors de l’importation.')}}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;const b=$('#inst');if(b)b.hidden=false});
async function inst(){if(dip){dip.prompt();dip=null;$('#inst').hidden=true}}
H.boot.push(async()=>{try{const e=await navigator.storage.estimate();stor=' · '+size(e.usage)+' utilisés'}catch(e){}});
H.settings.push(()=>`<section class="card"><h2>Données</h2><p class="muted">Sauvegarde complète (projets, tâches, notes, fichiers). Le code de verrouillage n’est jamais exporté.</p><button class="btn" onclick="exp()">Exporter (JSON complet)</button><label class="btn sec filebtn">Importer une sauvegarde<input type="file" accept="application/json,.json" class="vh" onchange="impPick(this)"></label><button class="btn danger" id="impok" hidden onclick="impGo()">Remplacer mes données</button><p id="bmsg" role="status" class="muted"></p></section><section class="card"><h2>Application</h2><p class="muted">Mon Cockpit v${VER}${stor} · données stockées sur cet appareil</p><button class="btn" id="inst" ${dip?'':'hidden'} onclick="inst()">Installer l’application</button></section>`);

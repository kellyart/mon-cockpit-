// Phase 5 : verrouillage local optionnel (aucun code en dur ; PBKDF2 + sel aléatoire)
let LK={id:'lock',on:false},buf='',busy=false;
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))),unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function hashCode(code,salt){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(code),'PBKDF2',false,['deriveBits']);
 return b64(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},k,256))}
async function mk(code){const s=crypto.getRandomValues(new Uint8Array(16));return{salt:b64(s),hash:await hashCode(code,s),len:code.length}}
const chk=async c=>(await hashCode(c,unb64(LK.salt)))===LK.hash;
const lkMsg=t=>{const e=$('#lkmsg');if(e)e.textContent=t};
const inp=(n,ph)=>`<label>${ph}<input name="${n}" type="password" inputmode="numeric" pattern="[0-9]{4,8}" maxlength="8" autocomplete="off" required></label>`;
function lockUI(){return '<section class="card"><h2>Sécurité</h2>'+(LK.on?`<p>Verrouillage activé.</p><form class="stack" onsubmit="return lkChange(event)"><b>Modifier le code</b>${inp('o','Ancien code')}${inp('n','Nouveau code (4 à 8 chiffres)')}${inp('c','Confirmer le nouveau code')}<div><button class="btn">Modifier</button></div></form><form class="stack" onsubmit="return lkOff(event)"><b>Désactiver</b>${inp('o','Code actuel')}<button class="btn danger">Désactiver le verrouillage</button></form>`
 :`<p class="muted">Verrouillage désactivé. Protège l’accès à ton espace de travail.</p><form class="stack" onsubmit="return lkOn(event)">${inp('n','Créer un code (4 à 8 chiffres)')}${inp('c','Confirmer le code')}<div><button class="btn">Activer le verrouillage</button></div></form>`)+'<p id="lkmsg" role="alert"></p></section>'}
H.settings.push(lockUI);H.boot.push(()=>initLock());
async function lkOn(e){e.preventDefault();const f=e.target;if(f.n.value!==f.c.value){lkMsg('Les deux codes ne correspondent pas.');return false}
 LK={id:'lock',on:true,fails:0,until:0,...await mk(f.n.value)};await DB.put('settings',LK);route();saved();return false}
async function lkChange(e){e.preventDefault();const f=e.target;if(!await chk(f.o.value)){lkMsg('Le code est incorrect.');return false}
 if(f.n.value!==f.c.value){lkMsg('Les deux codes ne correspondent pas.');return false}
 LK={...LK,...await mk(f.n.value),fails:0,until:0};await DB.put('settings',LK);route();saved();return false}
async function lkOff(e){e.preventDefault();if(!await chk(e.target.o.value)){lkMsg('Le code est incorrect.');return false}
 LK={id:'lock',on:false};await DB.put('settings',LK);route();saved();return false}
function dots(){const e=$('#dots');if(e)e.textContent='●'.repeat(buf.length)+'○'.repeat(Math.max(0,LK.len-buf.length))}
function lmsg(t){const e=$('#lmsg');if(e)e.textContent=t}
const setInert=v=>document.querySelectorAll('main,nav,#sf').forEach(e=>e.inert=v);
function showLock(){if($('#lock'))return;buf='';const d=document.createElement('div');d.id='lock';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label','Cockpit verrouillé');
 d.innerHTML=`<div class="lk">${ic('lock')}<h1>Cockpit verrouillé</h1><p class="muted">Entrez votre code pour accéder à votre espace de travail.</p><div id="dots" aria-live="polite"></div><p id="lmsg" role="alert"></p><div class="pad">${[1,2,3,4,5,6,7,8,9,'⌫',0,'OK'].map(k=>`<button data-k="${k}" ${k==='⌫'?'aria-label="Effacer"':k==='OK'?'aria-label="Déverrouiller"':''}>${k}</button>`).join('')}</div></div>`;
 d.onclick=e=>{const k=e.target.dataset&&e.target.dataset.k;if(k!=null)press(k)};document.body.append(d);setInert(true);dots();d.querySelector('button').focus()}
function press(k){if(busy)return;if(k==='OK'){if(buf.length<4)return lmsg('Code trop court.');return tryCode()}if(k==='⌫')buf=buf.slice(0,-1);else if(buf.length<LK.len)buf+=k;dots();if(buf.length===LK.len)tryCode()}
async function tryCode(){busy=true;try{
 if(Date.now()<LK.until)lmsg('Trop d’essais. Réessayez dans '+Math.ceil((LK.until-Date.now())/1000)+' s.');
 else if(await chk(buf)){LK.fails=0;LK.until=0;await DB.put('settings',LK);$('#lock').remove();setInert(false);return}
 else{LK.fails=(LK.fails||0)+1;if(LK.fails>=5)LK.until=Date.now()+30000*2**(LK.fails-5);await DB.put('settings',LK);lmsg('Le code est incorrect.')}
 }catch(e){console.error(e);lmsg('Une erreur est survenue.')}finally{busy=false;buf='';dots()}}
const lockNow=()=>{if(LK.on)showLock()};
document.addEventListener('visibilitychange',()=>{if(document.hidden)lockNow()});addEventListener('pagehide',lockNow);
addEventListener('keydown',e=>{if(!$('#lock'))return;if(/^[0-9]$/.test(e.key))press(e.key);else if(e.key==='Backspace')press('⌫');else if(e.key==='Enter')press('OK')});
async function initLock(){LK=(await DB.all('settings')).find(s=>s.id==='lock')||{id:'lock',on:false};lockNow()}

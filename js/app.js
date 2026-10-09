// Cœur : état, routeur, vues principales, démarrage unique. Les modules s'enregistrent via H (extensions) et TAB (onglets de projet).
const H={load:[],home:[],settings:[],list:[],evo:[],boot:[]},TAB={},ORD=['general','taches','evolutions','decisions','notes','fichiers'];
const S={cours:'En cours',attente:'En attente',devenir:'En devenir',termine:'Terminé'};
const $=s=>document.querySelector(s),esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=d=>new Date(d).toLocaleString('fr-FR',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
const fmtD=d=>new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
const ic=n=>`<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;
let P=[],E=[],theme='system',last={pid:'',tab:''};
const bk=()=>`<a class="back m-only" href="#/more">${ic('back')}Plus</a>`;
const badge=s=>`<span class="badge b-${s}">${S[s]}</span>`;
const prog=p=>`<div class="prog" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100" aria-label="Progression"><i style="width:${p}%"></i></div>`;
async function load(){[P,E]=await Promise.all([DB.all('projects'),DB.all('evolutions')]);for(const f of H.load)await f()}
function toast(t){const e=$('#saved');e.textContent=t;clearTimeout(toast.t);toast.t=setTimeout(()=>e.textContent='',2400)}
const saved=()=>toast('Enregistré');
async function addEvo(pid,title,desc){await DB.put('evolutions',{id:uid(),pid,title,desc:desc||'',date:Date.now()});for(const f of H.evo)await f(pid,title)}
async function saveP(p,log){p.updated=Date.now();try{await DB.put('projects',p);if(log)await addEvo(p.id,log[0],log[1]);await load();saved()}catch(e){console.error(e);toast('Impossible d’enregistrer cette modification.')}}
const V={
home(){const c=s=>P.filter(p=>p.status===s).length,open=T.filter(t=>t.status!=='Terminé'),wk=E.filter(e=>Date.now()-e.date<6048e5).length;
 const st=[['cours','En cours',c('cours'),'#/p/cours'],['attente','En attente',c('attente'),'#/p/attente'],['devenir','En devenir',c('devenir'),'#/p/devenir'],['bad','Tâches urgentes',open.filter(t=>t.prio==='Urgente').length,'#/tasks'],['ac','Tâches à terminer',open.length,'#/tasks'],['ok','Évolutions (7 jours)',wk,'#/history']];
 const cur=P.find(p=>p.id===last.pid&&p.status==='cours')||P.filter(p=>p.status==='cours').sort((a,b)=>b.updated-a.updated)[0];
 const le=cur&&E.filter(e=>e.pid===cur.id).sort((a,b)=>b.date-a.date)[0],tab=cur&&last.pid===cur.id&&TAB[last.tab]?last.tab:'general';
 const rec=[...E].sort((a,b)=>b.date-a.date).slice(0,5);
 return `<h1>Bonjour</h1><p class="muted">Voici un aperçu de ton activité.</p>
 ${P.length?'':`<div class="card"><b>Bienvenue dans ton cockpit</b><p class="muted">Crée ton premier projet pour commencer.</p><a class="btn" href="#/p/cours">Créer un projet</a></div>`}
 <div class="stats">${st.map(([k,l,n,h])=>`<a class="card stat s-${k}" href="${h}"><small>${l}</small><b class="big">${n}</b></a>`).join('')}</div>
 <h2>Reprendre mon travail</h2>${cur?`<a class="card" href="#/project/${cur.id}/${tab}"><b>${esc(cur.name)}</b>${prog(cur.progress)}<p>État actuel : ${esc(cur.state)||'—'}</p><p>Dernière évolution : ${le?esc(le.title):'—'}</p><p>Prochaine étape : ${esc(cur.next)||'—'}</p><small>Section : ${TAB[tab].l}</small><span class="btn">Reprendre</span></a>`:'<p class="muted">Aucun projet en cours.</p>'}
 ${H.home.map(f=>f()).join('')}
 <h2>Évolutions récentes</h2>${rec.map(e=>`<a class="row" href="#/project/${e.pid}/evolutions"><b>${esc(e.title)}</b><small>${fmt(e.date)} — ${esc(pname(e.pid))}</small></a>`).join('')||'<p class="muted">Rien pour l’instant.</p>'}`},
list(s){if(!S[s])s='cours';const l=P.filter(p=>p.status===s).sort((a,b)=>b.updated-a.updated);
 return `<h1>Projets</h1><div class="tabs" role="tablist" aria-label="Statut des projets">${Object.keys(S).map(k=>`<a role="tab" aria-selected="${k==s}" href="#/p/${k}">${k=='termine'?'Archive':S[k]} <span class="cnt">${P.filter(p=>p.status===k).length}</span></a>`).join('')}</div>`+
 (s==='termine'?'<p class="muted">Archive : les projets terminés restent consultables avec leur historique complet.</p>':`<form class="bar" onsubmit="return newP(event,'${s}')"><label class="grow">Nouveau projet<input name="n" required maxlength="80"></label><button class="btn">Créer</button></form>`)+
 `<div class="list">${l.map(p=>`<a class="card" href="#/project/${p.id}"><div class="rowtop"><b>${esc(p.name)}</b>${badge(p.status)}</div>${prog(p.progress)}<small>${p.progress} % · ${p.status==='attente'&&p.why?'Raison : '+esc(p.why):'Prochaine étape : '+(esc(p.next)||'—')}</small></a>`).join('')}</div>`+(l.length?'':'<p class="muted">Aucun projet ici.</p>')+H.list.map(f=>f(s)).join('')},
project(id,tab){const p=P.find(x=>x.id===id);if(!p)return'<p>Projet introuvable.</p><a class="btn" href="#/p/cours">Retour aux projets</a>';
 tab=TAB[tab]?tab:'general';const ev=E.filter(e=>e.pid===id).sort((a,b)=>b.date-a.date)[0];
 return `<a class="back" href="#/p/${p.status}">${ic('back')}${S[p.status]}</a><div class="rowtop"><h1>${esc(p.name)}</h1>${badge(p.status)}</div>
 <p class="muted">Dernière évolution : ${ev?esc(ev.title)+' ('+fmt(ev.date)+')':'—'}</p>
 <div class="tabs" role="tablist" aria-label="Sections du projet">${ORD.filter(k=>TAB[k]).map(k=>`<a role="tab" aria-selected="${k==tab}" href="#/project/${id}/${k}">${TAB[k].l}</a>`).join('')}</div>${TAB[tab].f(id,p)}`},
more(){return '<h1>Plus</h1>'+[['history','Historique'],['files','Fichiers et ressources'],['settings','Paramètres']].map(([r,l])=>`<a class="card linkcard" href="#/${r}">${ic(r)}<span>${l}</span></a>`).join('')},
settings(){return `${bk()}<h1>Paramètres</h1><section class="card"><h2>Apparence</h2><label>Thème<select onchange="setTheme(this.value)">${[['system','Système'],['light','Clair'],['dark','Sombre']].map(([v,t])=>`<option value="${v}" ${v==theme?'selected':''}>${t}</option>`).join('')}</select></label></section>${H.settings.map(f=>f()).join('')}`}};
TAB.general={l:'Vue générale',f:(id,p)=>{const ev=E.filter(e=>e.pid===id).sort((a,b)=>b.date-a.date)[0],c=k=>`onchange="chg('${id}','${k}',this.value)"`;
 return `<div class="stack"><label>Nom du projet<input value="${esc(p.name)}" maxlength="80" ${c('name')}></label>
 <div class="bar"><label class="grow">Statut<select ${c('status')}>${Object.keys(S).map(k=>`<option value="${k}" ${k==p.status?'selected':''}>${S[k]}</option>`).join('')}</select></label>
 <label class="grow">Priorité<select ${c('prio')}>${opts(PR,p.prio)}</select></label></div>
 <label>Progression : <output id="pv">${p.progress}</output> %<input type="range" min="0" max="100" value="${p.progress}" oninput="pv.textContent=this.value" onchange="chg('${id}','progress',+this.value)"></label>
 <label>État actuel<textarea rows="2" ${c('state')}>${esc(p.state)}</textarea></label><label>Objectif<textarea rows="3" ${c('goal')}>${esc(p.goal)}</textarea></label>
 <label>Prochaine étape<input value="${esc(p.next)}" ${c('next')}></label>
 ${p.status==='attente'?`<div class="card"><b>En attente${p.since?' depuis le '+fmtD(p.since):''}</b><label>Raison<input value="${esc(p.why)}" ${c('why')}></label><label>Date de reprise prévue<input type="date" value="${esc(p.resume)}" ${c('resume')}></label><small>Dernière action : ${ev?esc(ev.title):'—'}</small></div>`:''}
 <small>Créé le ${fmtD(p.created)}</small><div><button class="btn danger" onclick="delP(this,'${id}')">Supprimer ce projet</button></div></div>`}};
TAB.evolutions={l:'Évolutions',f:id=>`<form class="stack" onsubmit="return addE(event,'${id}')"><label>Nouvelle évolution<input name="t" required></label><label>Description (facultatif)<textarea name="d" rows="2"></textarea></label><div><button class="btn">Ajouter l’évolution</button></div></form>`+
 (E.filter(e=>e.pid===id).sort((a,b)=>b.date-a.date).map(e=>`<div class="row"><b>${esc(e.title)}</b>${e.desc?'<p>'+esc(e.desc)+'</p>':''}<small>${fmt(e.date)}</small></div>`).join('')||'<p class="muted">Aucune évolution.</p>')};
async function chg(id,k,v){const p=P.find(x=>x.id===id),o=p[k];if(k==='name'&&!v.trim()){toast('Le nom ne peut pas être vide.');return route()}
 p[k]=v;if(k==='status'&&v==='attente')p.since=Date.now();
 await saveP(p,k==='status'?['Statut modifié',S[o]+' → '+S[v]]:k==='next'?['Prochaine étape mise à jour',v]:null);if(k==='status'||k==='name')route()}
async function newP(e,s){e.preventDefault();const p={id:uid(),name:e.target.n.value.trim(),status:s,prio:'Normale',progress:0,goal:'',state:'',next:'',why:'',resume:'',since:s==='attente'?Date.now():0,created:Date.now(),updated:Date.now()};
 await saveP(p,['Projet créé',S[s]]);location.hash='#/project/'+p.id;return false}
async function addE(e,id){e.preventDefault();await addEvo(id,e.target.t.value.trim(),e.target.d.value.trim());await saveP(P.find(x=>x.id===id));route();return false}
async function delP(b,id){if(!b.dataset.ok){b.dataset.ok=1;b.textContent='Confirmer la suppression';setTimeout(()=>{if(b.isConnected){delete b.dataset.ok;b.textContent='Supprimer ce projet'}},4000);return}
 for(const e of E.filter(e=>e.pid===id))await DB.del('evolutions',e.id);
 for(const [s,l] of [['tasks',T],['decisions',D],['notes',N],['files',F]])for(const x of l.filter(x=>x.pid===id)){if(s==='files')await DB.del('blobs',x.id);await DB.del(s,x.id)}
 await act('Projet supprimé : '+pname(id));await DB.del('projects',id);if(last.pid===id)last={pid:'',tab:''};await load();location.hash='#/';route()}
async function setTheme(v){theme=v;await DB.put('settings',{id:'theme',v});applyTheme();saved()}
function applyTheme(){document.documentElement.dataset.theme=theme}
function route(){const[a,b,c]=location.hash.slice(2).split('/'),rk=a==='p'||a==='project'?'p':a||'home';
 try{$('#app').innerHTML=(V[a==='p'?'list':a]||V.home)(b?decodeURIComponent(b):b,c)}catch(e){console.error(e);$('#app').innerHTML='<p>Une erreur est survenue. Recharge la page.</p>'}
 if(a!=='search'&&$('#q'))$('#q').value='';
 if(a==='project'&&P.some(p=>p.id===b)){const tab=TAB[c]?c:'general';if(last.pid!==b||last.tab!==tab){last={pid:b,tab};DB.put('settings',{id:'last',v:b,tab}).catch(()=>{})}}
 {const t=document.querySelector('.tabs [aria-selected=true],.tabs [aria-current=true]');if(t&&t.scrollIntoView)t.scrollIntoView({inline:'center',block:'nearest'})}
 document.querySelectorAll('nav a').forEach(x=>{const on=x.dataset.r===rk||(x.dataset.r==='more'&&['history','files','settings'].includes(rk));on?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current')})}
// Reprise : dernière page (y compris l'onglet du projet) + position de défilement
const saveCtx=y=>{if(!location.hash.startsWith('#/search'))DB.put('settings',{id:'ctx',v:location.hash,y:y==null?scrollY:y}).catch(()=>{})};
async function boot(){
 try{await DB.open();await load();const set=await DB.all('settings'),g=k=>(set.find(s=>s.id===k)||{}).v;
  theme=g('theme')||'system';last={pid:g('last')||'',tab:(set.find(s=>s.id==='last')||{}).tab||''};applyTheme();
  for(const f of H.boot)await f(set);
  const c=set.find(s=>s.id==='ctx');if(c&&c.v&&(!location.hash||location.hash==='#/'))history.replaceState(null,'',c.v);
  route();if(c&&c.y)scrollTo(0,c.y)
 }catch(e){console.error(e);$('#app').innerHTML='<p>Impossible d’ouvrir le stockage local de l’application.</p>';return}
 addEventListener('hashchange',()=>{route();saveCtx(0);$('#app').focus({preventScroll:true})});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)saveCtx()});addEventListener('pagehide',()=>saveCtx());
 if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{})}
addEventListener('load',boot);

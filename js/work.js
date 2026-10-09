// Travail et mémoire : tâches, notes, idées, décisions, historique global
let T=[],N=[],I=[],D=[],A=[];
H.load.push(async()=>{[T,N,I,D,A]=await Promise.all(['tasks','notes','ideas','decisions','activity'].map(s=>DB.all(s)))});
const PR=['Basse','Normale','Haute','Urgente'],TS=['À faire','En cours','Terminé','En attente'],TF={todo:'À faire',doing:'En cours',hold:'En attente',done:'Terminé'};
const rank=t=>3-PR.indexOf(t.prio),opts=(a,s)=>a.map(k=>`<option ${k==s?'selected':''}>${k}</option>`).join(''),pname=id=>(P.find(p=>p.id===id)||{}).name||'';
const pSel=l=>`<label class="grow">${l||'Projet'}<select name="p"><option value="">Sans projet</option>${P.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label>`;
const ld=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10),late=t=>t.due&&t.status!=='Terminé'&&t.due<ld();
const fd=d=>new Date(d+'T00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'}),chip=p=>`<span class="pr p-${p}">${p}</span>`;
const empty=t=>`<p class="muted">${t}</p>`;
async function act(text,pid){await DB.put('activity',{id:uid(),text,pid:pid||'',date:Date.now()})}
H.evo.push((pid,t)=>act('Évolution : '+t,pid));
async function refresh(){await load();route();saved()}
async function del(s,id){await DB.del(s,id);await refresh()}
// Tâches
const taskForm=pid=>`<form class="bar" onsubmit="return addT(event,'${pid||''}')"><label class="grow">Nouvelle tâche<input name="t" required></label>${pid?'':pSel()}<label>Priorité<select name="r">${opts(PR,'Normale')}</select></label><label>Échéance<input name="d" type="date"></label><button class="btn">Ajouter</button></form>`;
const taskRow=t=>`<div class="row${t.status==='Terminé'?' done':''}"><div class="rowtop"><b>${esc(t.title)}</b>${chip(t.prio)}${late(t)?'<span class="pr p-Urgente">En retard</span>':''}</div><small>${esc(pname(t.pid))||'Sans projet'}${t.due?' · échéance '+fd(t.due):''}</small><div class="acts"><select onchange="tsk('${t.id}',this.value)" aria-label="Statut de la tâche ${esc(t.title)}">${opts(TS,t.status)}</select><button class="btn sec" onclick="del('tasks','${t.id}')" aria-label="Supprimer la tâche ${esc(t.title)}">Supprimer</button></div></div>`;
async function addT(e,pid){e.preventDefault();const f=e.target,t=f.t.value.trim(),p=pid||f.p.value;
 await DB.put('tasks',{id:uid(),title:t,pid:p,prio:f.r.value,status:'À faire',due:f.d.value,created:Date.now()});await act('Tâche créée : '+t,p);await refresh();return false}
async function tsk(id,st){const t=T.find(x=>x.id===id);t.status=st;await DB.put('tasks',t);await act((st=='Terminé'?'Tâche terminée : ':'Tâche modifiée : ')+t.title,t.pid);await refresh()}
V.tasks=f=>`<h1>Tâches</h1>${taskForm()}<div class="tabs" aria-label="Filtrer les tâches">${[['all','Toutes'],...Object.entries(TF)].map(([k,v])=>`<a href="#/tasks/${k}" aria-current="${(f||'all')==k}">${v}</a>`).join('')}</div>`+
 ([...T].filter(t=>!TF[f]||t.status===TF[f]).sort((a,b)=>(a.status=='Terminé')-(b.status=='Terminé')||late(b)-late(a)||rank(a)-rank(b)).map(taskRow).join('')||empty('Aucune tâche.'));
TAB.taches={l:'Tâches',f:id=>taskForm(id)+(T.filter(t=>t.pid===id).sort((a,b)=>(a.status=='Terminé')-(b.status=='Terminé')||rank(a)-rank(b)).map(taskRow).join('')||empty('Aucune tâche.'))};
// Notes
const noteCard=n=>`<div class="card"><p>${esc(n.text)}</p><small>${fmt(n.date)}${n.pid?' · '+esc(pname(n.pid)):''}</small><div class="acts"><button class="btn sec" onclick="conv('${n.id}','t')">Transformer en tâche</button><button class="btn sec" onclick="conv('${n.id}','i')">En idée</button>${n.pid?`<button class="btn sec" onclick="conv('${n.id}','e')">En évolution</button>`:''}<button class="btn sec" onclick="del('notes','${n.id}')">Supprimer</button></div></div>`;
V.notes=()=>`<h1>Notes</h1><form class="bar" onsubmit="return addN(event)"><label class="grow">Note rapide<input name="t" required></label>${pSel()}<button class="btn">Ajouter</button></form>`+([...N].sort((a,b)=>b.date-a.date).map(noteCard).join('')||empty('Aucune note.'));
TAB.notes={l:'Notes',f:id=>`<form class="bar" onsubmit="return addN(event)"><input type="hidden" name="p" value="${id}"><label class="grow">Note rapide<input name="t" required></label><button class="btn">Ajouter</button></form>`+(N.filter(n=>n.pid===id).sort((a,b)=>b.date-a.date).map(noteCard).join('')||empty('Aucune note.'))};
async function addN(e){e.preventDefault();const f=e.target;await DB.put('notes',{id:uid(),text:f.t.value.trim(),pid:f.p.value,date:Date.now()});await act('Note ajoutée',f.p.value);await refresh();return false}
async function conv(id,k){const n=N.find(x=>x.id===id);
 if(k=='t')await DB.put('tasks',{id:uid(),title:n.text,pid:n.pid,prio:'Normale',status:'À faire',due:'',created:Date.now()});
 if(k=='i')await DB.put('ideas',{id:uid(),title:n.text,date:Date.now()});
 if(k=='e')await addEvo(n.pid,n.text);
 await act('Note transformée',n.pid);await DB.del('notes',id);await refresh()}
// Idées (page « En devenir »)
H.list.push(s=>s==='devenir'?`<h2>Boîte à idées</h2><form class="bar" onsubmit="return addI(event)"><label class="grow">Nouvelle idée<input name="t" required></label><button class="btn">Ajouter</button></form>`+(I.map(i=>`<div class="card"><b>${esc(i.title)}</b><br><small>${fmt(i.date)} · Transformer en projet :</small><div class="acts">${[['devenir','En devenir'],['attente','En attente'],['cours','En cours']].map(([k,l])=>`<button class="btn sec" onclick="i2p('${i.id}','${k}')">${l}</button>`).join('')}<button class="btn sec" onclick="del('ideas','${i.id}')">Archiver</button></div></div>`).join('')||empty('Aucune idée.')):'');
async function addI(e){e.preventDefault();await DB.put('ideas',{id:uid(),title:e.target.t.value.trim(),date:Date.now()});await act('Idée créée');await refresh();return false}
async function i2p(id,s){const i=I.find(x=>x.id===id),p={id:uid(),name:i.title,status:s,prio:'Normale',progress:0,goal:'',state:'',next:'',why:'',resume:'',since:s==='attente'?Date.now():0,created:Date.now(),updated:Date.now()};
 await saveP(p,['Projet créé depuis une idée',S[s]]);await DB.del('ideas',id);await load();location.hash='#/project/'+p.id}
// Décisions
TAB.decisions={l:'Décisions',f:id=>`<form class="stack" onsubmit="return addD(event,'${id}')"><label>Décision prise<textarea name="t" rows="2" required></textarea></label><div><button class="btn">Ajouter la décision</button></div></form>`+(D.filter(d=>d.pid===id).sort((a,b)=>b.date-a.date).map(d=>`<div class="row"><span>${esc(d.text)}</span><small>${fmt(d.date)}</small></div>`).join('')||empty('Aucune décision.'))};
async function addD(e,pid){e.preventDefault();await DB.put('decisions',{id:uid(),pid,text:e.target.t.value.trim(),date:Date.now()});await act('Décision ajoutée',pid);await refresh();return false}
// Historique global
V.history=()=>{const g={};[...A].sort((a,b)=>b.date-a.date).forEach(a=>{const d=fmtD(a.date);(g[d]=g[d]||[]).push(a)});
 return bk()+'<h1>Historique</h1>'+(Object.entries(g).map(([d,l])=>`<h2>${d}</h2>`+l.map(a=>`<a class="row" href="#/${a.pid&&pname(a.pid)?'project/'+a.pid:'history'}"><b>${esc(a.text)}</b><small>${new Date(a.date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}${pname(a.pid)?' · '+esc(pname(a.pid)):''}</small></a>`).join('')).join('')||empty('Aucune activité.'))};
// Tableau de bord : « À faire maintenant »
H.home.push(()=>{const o=T.filter(t=>t.status!=='Terminé').sort((a,b)=>late(b)-late(a)||rank(a)-rank(b)),nl=o.filter(late).length;
 return `<h2>À faire maintenant</h2>${nl?`<div class="notice" role="status">${nl} tâche(s) en retard</div>`:''}`+(o.slice(0,5).map(t=>`<a class="row" href="#/${t.pid?'project/'+t.pid+'/taches':'tasks'}"><div class="rowtop"><b>${esc(t.title)}</b>${chip(t.prio)}${late(t)?'<span class="pr p-Urgente">En retard</span>':''}</div><small>${esc(pname(t.pid))||'Sans projet'} · ${t.status}${t.due?' · échéance '+fd(t.due):''}</small></a>`).join('')||empty('Rien d’urgent.'))});

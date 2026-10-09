// Recherche globale (insensible à la casse et aux accents), résultats liés à la bonne section
const nz=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
V.search=q=>{const t=nz((q||'').trim()),m=(...a)=>a.some(x=>nz(x).includes(t)),R=[],pr=(k,x,s,h)=>R.push([k,s,h,pname(x.pid)]);
 if(t){P.filter(p=>m(p.name,p.goal,p.state,p.next,p.why)).forEach(p=>R.push(['Projet',p.name,'project/'+p.id,S[p.status]]));
  T.filter(x=>m(x.title)).forEach(x=>pr('Tâche',x,x.title,x.pid?'project/'+x.pid+'/taches':'tasks'));
  I.filter(x=>m(x.title)).forEach(x=>pr('Idée',x,x.title,'p/devenir'));
  N.filter(x=>m(x.text)).forEach(x=>pr('Note',x,x.text,x.pid?'project/'+x.pid+'/notes':'notes'));
  E.filter(x=>m(x.title,x.desc)).forEach(x=>pr('Évolution',x,x.title,'project/'+x.pid+'/evolutions'));
  D.filter(x=>m(x.text)).forEach(x=>pr('Décision',x,x.text,'project/'+x.pid+'/decisions'));
  F.filter(x=>m(x.name)).forEach(x=>pr('Fichier',x,x.name,x.pid?'project/'+x.pid+'/fichiers':'files'))}
 return `<h1>Recherche</h1>`+(!t?empty('Tape un mot dans la barre de recherche.'):`<p class="muted">${R.length} résultat(s)</p>`+(R.map(([k,s,h,pn])=>`<a class="row" href="#/${h}"><b>${esc(s)}</b><small>${k}${pn?' · '+esc(pn):''}</small></a>`).join('')||empty('Aucun résultat.')))};
let sq;document.addEventListener('input',e=>{if(e.target.id!=='q')return;clearTimeout(sq);sq=setTimeout(()=>{const v=e.target.value.trim();location.hash=v?'#/search/'+encodeURIComponent(v):'#/'},250)});

// Fichiers & ressources : métadonnées dans 'files', contenu dans 'blobs'
let F=[];H.load.push(async()=>{F=await DB.all('files')});
const size=n=>n>1e6?(n/1e6).toFixed(1)+' Mo':Math.ceil(n/1e3)+' Ko';
const fileRow=f=>`<div class="row"><b>${f.kind==='link'?`<a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">${esc(f.name)}</a>`:esc(f.name)}</b><small>${esc(pname(f.pid))||'Sans projet'} · ${f.kind==='link'?'lien':size(f.size)} · ${fmt(f.date)}</small><div class="acts">${f.kind==='link'?'':`<button class="btn sec" onclick="dl('${f.id}')">Télécharger</button>`}<button class="btn sec" onclick="delF('${f.id}')" aria-label="Supprimer ${esc(f.name)}">Supprimer</button></div></div>`;
const fileForm=pid=>`<div><label class="btn filebtn">Ajouter un fichier<input type="file" multiple class="vh" onchange="addF(this,'${pid}')"></label></div><form class="bar" onsubmit="return addL(event,'${pid}')"><label class="grow">Ajouter un lien<input name="u" type="url" placeholder="https://" required></label><button class="btn sec">Ajouter le lien</button></form>`;
async function addF(inp,pid){pid=pid||($('#fp')||{}).value||'';
 for(const f of inp.files){if(f.size>25e6){toast('Fichier trop volumineux (25 Mo max).');continue}
  try{const id=uid();await DB.put('blobs',{id,blob:f});await DB.put('files',{id,pid,kind:'file',name:f.name,type:f.type,size:f.size,date:Date.now()});await act('Fichier ajouté : '+f.name,pid)}
  catch(e){console.error(e);toast('Impossible d’enregistrer ce fichier.')}}
 await refresh()}
async function addL(e,pid){e.preventDefault();const u=e.target.u.value.trim();pid=pid||($('#fp')||{}).value||'';
 if(!/^https?:\/\//i.test(u)){toast('Le lien doit commencer par http(s)://');return false}
 await DB.put('files',{id:uid(),pid,kind:'link',name:u,url:u,date:Date.now()});await act('Lien ajouté',pid);await refresh();return false}
async function dl(id){const b=await DB.get('blobs',id),f=F.find(x=>x.id===id);if(!b||!f)return;
 const u=URL.createObjectURL(b.blob),a=document.createElement('a');a.href=u;a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(u),4e3)}
async function delF(id){await DB.del('files',id);await DB.del('blobs',id);await refresh()}
V.files=()=>bk()+'<h1>Fichiers et ressources</h1>'+pSel('Associer à un projet').replace('name="p"','id="fp"')+fileForm('')+([...F].sort((a,b)=>b.date-a.date).map(fileRow).join('')||empty('Aucun fichier.'));
TAB.fichiers={l:'Fichiers',f:id=>fileForm(id)+(F.filter(f=>f.pid===id).map(fileRow).join('')||empty('Aucun fichier.'))};

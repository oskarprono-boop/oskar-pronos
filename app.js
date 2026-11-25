const $=s=>document.querySelector(s);
const today=new Date(); const localISO=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Douala',year:'numeric',month:'2-digit',day:'2-digit'}).format(today);
$('#date').value=localISO;
let matches=[], tab='today', favorites=JSON.parse(localStorage.getItem('oa_favs')||'[]');
const demo=[
 {fixture:{id:99001,date:localISO+'T17:00:00+01:00',status:{short:'NS',elapsed:null}},league:{name:'Premier League',country:'Angleterre',logo:''},teams:{home:{id:1,name:'Arsenal',logo:''},away:{id:2,name:'Chelsea',logo:''}},goals:{home:null,away:null}},
 {fixture:{id:99002,date:localISO+'T19:30:00+01:00',status:{short:'NS',elapsed:null}},league:{name:'La Liga',country:'Espagne',logo:''},teams:{home:{id:3,name:'Real Madrid',logo:''},away:{id:4,name:'Atlético Madrid',logo:''}},goals:{home:null,away:null}},
 {fixture:{id:99003,date:localISO+'T21:00:00+01:00',status:{short:'NS',elapsed:null}},league:{name:'Ligue 1',country:'France',logo:''},teams:{home:{id:5,name:'Marseille',logo:''},away:{id:6,name:'Lyon',logo:''}},goals:{home:null,away:null}}
];
function key(){return localStorage.getItem('oa_api_key')||''}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function statusText(s){return ({NS:'À VENIR',1H:'1ÈRE MI-TEMPS',HT:'MI-TEMPS',2H:'2ÈME MI-TEMPS',FT:'TERMINÉ',AET:'APRÈS PROLONGATION',PEN:'TIRS AU BUT',PST:'REPORTÉ',CANC:'ANNULÉ',LIVE:'EN DIRECT',ET:'PROLONGATION',BT:'PAUSE'}[s]||s||'À VENIR')}
function time(m){return new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit',timeZone:$('#timezone').value}).format(new Date(m.fixture.date))}
function render(){
 const q=$('#leagueFilter').value;
 let list=matches.filter(m=>!q||String(m.league.id)===q);
 if(tab==='live') list=list.filter(m=>['1H','2H','HT','ET','BT','P','LIVE'].includes(m.fixture.status.short));
 if(tab==='saved') list=list.filter(m=>favorites.includes(m.fixture.id));
 $('#matchCount').textContent=list.length;
 $('#liveCount').textContent=matches.filter(m=>['1H','2H','HT','ET','BT','P','LIVE'].includes(m.fixture.status.short)).length;
 $('#finishedCount').textContent=matches.filter(m=>['FT','AET','PEN'].includes(m.fixture.status.short)).length;
 if(!list.length){$('#matchList').innerHTML=`<div class="empty"><div class="ball">⚽</div><h3>Aucun match trouvé</h3><p>Essayez une autre date ou un autre filtre.</p></div>`;return}
 const groups={};list.forEach(m=>(groups[m.league.name+' · '+m.league.country]??=[]).push(m));
 $('#matchList').innerHTML=Object.entries(groups).map(([g,arr])=>`<div><div class="leaguehead">${esc(g.toUpperCase())}</div>${arr.map(card).join('')}</div>`).join('');
}
function card(m){
 const f=m.fixture, h=m.teams.home,a=m.teams.away,s=f.status.short,live=['1H','2H','HT','ET','BT','P','LIVE'].includes(s),done=['FT','AET','PEN'].includes(s),fav=favorites.includes(f.id);
 const logo=t=>t.logo?`<img src="${esc(t.logo)}" onerror="this.style.display='none'">`:'';
 return `<article class="match"><div class="matchtop"><span>${esc(m.league.round||m.league.name)}</span><span class="${live?'status':''}">${live?'● ':''}${esc(statusText(s))} · ${time(m)}</span></div><div class="teams"><div class="team">${logo(h)}<span class="teamname">${esc(h.name)}</span></div><div class="score">${done||live?`${m.goals.home??0} - ${m.goals.away??0}`:'VS'}<small>${f.status.elapsed?f.status.elapsed+"'":''}</small></div><div class="team away"><span class="teamname">${esc(a.name)}</span>${logo(a)}</div></div><div class="matchbottom"><span>${esc(m.league.country||'')}</span><div><button class="star" data-fav="${f.id}" title="Favori">${fav?'★':'☆'}</button> <button class="outline" data-analysis="${f.id}">ANALYSER ↗</button></div></div></article>`;
}
async function load(){
 $('#connection').textContent=key()?'CONNEXION API CONFIGURÉE':'MODE DÉMO — configurez votre API';
 if(!key()){matches=[];render();return}
 $('#matchList').innerHTML='<div class="empty"><p>Chargement des rencontres…</p></div>';
 try{
  const date=$('#date').value;
  const url=`https://v3.football.api-sports.io/fixtures?date=${encodeURIComponent(date)}&timezone=${encodeURIComponent($('#timezone').value)}`;
  const r=await fetch(url,{headers:{'x-apisports-key':key()}});
  if(!r.ok) throw Error('Erreur HTTP '+r.status);
  const data=await r.json();if(data.errors&&Object.keys(data.errors).length)throw Error(JSON.stringify(data.errors));
  matches=data.response||[];
  const leagues=[...new Map(matches.map(m=>[m.league.id,m.league])).values()];
  $('#leagueFilter').innerHTML='<option value="">Toutes</option>'+leagues.map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join('');
  render();
  if(!matches.length)$('#matchList').innerHTML='<div class="empty"><h3>Aucune rencontre trouvée</h3><p>Aucun match retourné pour cette date par le fournisseur de données.</p></div>';
 }catch(e){$('#matchList').innerHTML=`<div class="empty"><h3>Connexion impossible</h3><p>${esc(e.message)}. Vérifiez votre clé API et votre connexion Internet.</p><button class="primary" onclick="document.querySelector('#settings').showModal()">Paramètres API</button></div>`}
}
async function openAnalysis(id){
 const m=matches.find(x=>x.fixture.id===Number(id));if(!m)return;
 const f=m.fixture, home=m.teams.home, away=m.teams.away, s=f.status.short;
 $('#analysisTitle').textContent=home.name+' — '+away.name;
 $('#analysisBody').innerHTML=`<div class="notice"><b>${esc(m.league.name)}</b> · ${esc(m.league.country)}<br>${esc(statusText(s))} · ${time(m)}<br><span class="muted">Chargement des données avancées…</span></div><div class="empty"><p>Récupération des prédictions et de la forme récente.</p></div>`;
 $('#analysis').showModal();
 if(!key()){ $('#analysisBody').innerHTML += `<div class="notice">Mode démonstration : ajoutez une clé API pour afficher les données avancées réelles.</div>`; return; }
 const headers={'x-apisports-key':key()};
 async function api(path){const r=await fetch('https://v3.football.api-sports.io/'+path,{headers});if(!r.ok)throw Error('API '+r.status);const j=await r.json();if(j.errors&&Object.keys(j.errors).length)throw Error(JSON.stringify(j.errors));return j.response||[]}
 try{
  const [pred,homeLast,awayLast]=await Promise.all([
   api(`predictions?fixture=${f.id}`),
   api(`fixtures?team=${home.id}&last=5&status=FT`),
   api(`fixtures?team=${away.id}&last=5&status=FT`)
  ]);
  const p=pred[0]||{}, pr=p.predictions||{}, cmp=p.comparison||{}, teams=p.teams||{};
  const pct=x=>{const n=parseFloat(String(x||'').replace('%',''));return Number.isFinite(n)?Math.round(n)+'%':'—'};
  const probs=pr.percent||{};
  const formHtml=(arr,tid)=>arr.map(x=>{const own=x.teams.home.id===tid?x.goals.home:x.goals.away,opp=x.teams.home.id===tid?x.goals.away:x.goals.home;let r=own>opp?'V':own===opp?'N':'D';return `<i class="${r==='D'?'loss':''}">${r}</i>`}).join('');
  const avg=(arr,tid)=>{if(!arr.length)return '—';let scored=0,conceded=0;arr.forEach(x=>{if(x.teams.home.id===tid){scored+=x.goals.home||0;conceded+=x.goals.away||0}else{scored+=x.goals.away||0;conceded+=x.goals.home||0}});return (scored/arr.length).toFixed(1)+' / '+(conceded/arr.length).toFixed(1)};
  const noData='<span class="hint">Non disponible</span>';
  $('#analysisBody').innerHTML=`<div class="notice"><b>${esc(m.league.name)}</b> · ${esc(m.league.country)}<br>${esc(statusText(s))} · ${time(m)}</div>
  <h3>Probabilités du fournisseur</h3><div class="probrow"><div class="prob"><b>${pct(probs.home)}</b><small>VICTOIRE ${esc(home.name.toUpperCase())}</small></div><div class="prob"><b>${pct(probs.draw)}</b><small> MATCH NUL</small></div><div class="prob"><b>${pct(probs.away)}</b><small>VICTOIRE ${esc(away.name.toUpperCase())}</small></div></div>
  <div class="statgrid"><div class="stat"><b>${esc(pr.winner?.name||'—')}</b><small>ÉQUIPE FAVORITE</small></div><div class="stat"><b>${esc(pr.advice||'—')}</b><small>CONSEIL DU MODÈLE</small></div></div>
  <h3>Forme récente — 5 derniers matchs</h3>
  <div class="stat"><b>${esc(home.name)}</b><div class="formlist">${formHtml(homeLast,home.id)||noData}</div><small>Marqués / encaissés par match : ${avg(homeLast,home.id)}</small></div>
  <div class="stat"><b>${esc(away.name)}</b><div class="formlist">${formHtml(awayLast,away.id)||noData}</div><small>Marqués / encaissés par match : ${avg(awayLast,away.id)}</small></div>
  <h3>Comparaison statistique</h3><div class="statgrid">${[['Attaque',cmp.att||'—'],['Défense',cmp.def||'—'],['Forme',cmp.form||'—'],['H2H',cmp.h2h||'—']].map(([a,b])=>`<div class="stat"><b>${esc(b)}</b><small>${a.toUpperCase()}</small></div>`).join('')}</div>
  <div class="notice">Analyse générée à partir des réponses de l'API-Football. Les probabilités et conseils dépendent de la couverture du fournisseur, peuvent être absents et ne garantissent jamais le résultat. Ne misez jamais une somme que vous ne pouvez pas perdre.</div>`;
 }catch(e){$('#analysisBody').innerHTML+=`<div class="notice">Impossible de charger toutes les données avancées : ${esc(e.message)}. Vérifiez votre quota API et la couverture de cette compétition.</div>`}
}
$('#matchList').addEventListener('click',e=>{
 const a=e.target.closest('[data-analysis]'),b=e.target.closest('[data-fav]');
 if(a)openAnalysis(a.dataset.analysis);
 if(b){const id=Number(b.dataset.fav);favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];localStorage.setItem('oa_favs',JSON.stringify(favorites));render()}
});
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));tab=b.dataset.tab;render()}));
$('#settingsBtn').onclick=()=>{$('#apiKey').value=key();$('#settings').showModal()};
$('#saveSettings').onclick=()=>{localStorage.setItem('oa_api_key',$('#apiKey').value.trim());$('#settings').close();load()};
$('#clearKey').onclick=()=>{localStorage.removeItem('oa_api_key');$('#apiKey').value='';$('#settings').close();matches=[];render();$('#connection').textContent='MODE DÉMO — configurez votre API'};
$('#refreshBtn').onclick=load;$('#date').onchange=load;$('#leagueFilter').onchange=render;
$('#demoBtn').onclick=()=>{matches=demo;const ls=[...new Map(matches.map(m=>[m.league.name,m.league])).values()];$('#leagueFilter').innerHTML='<option value="">Toutes</option>'+ls.map((l,i)=>`<option value="${i+1}">${l.name}</option>`).join('');$('#connection').textContent='DONNÉES DE DÉMONSTRATION — MATCHS FICTIFS';render()};
$('#closeAnalysis').onclick=()=>$('#analysis').close();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
load();

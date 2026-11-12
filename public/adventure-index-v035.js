/* SOULBOUND v0.35 · searchable, read-only adventure encyclopedia.
 * Data is always retrieved from /api/index (the exact server encounter/catalog rules).
 */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const opts=[
 {id:"bosses",label:"BOSSES",icon:"👑"},
 {id:"monsters",label:"MONSTERS",icon:"🐺"},
 {id:"weapons",label:"WEAPONS",icon:"⚔️"},
 {id:"armor",label:"ARMOR",icon:"🛡️"},
 {id:"accessories",label:"ACCESSORIES",icon:"💍"},
 {id:"food",label:"FOOD",icon:"🍖"},
 {id:"consumables",label:"POTIONS",icon:"🧪"},
 {id:"zones",label:"WORLD",icon:"🗺️"}
];
let data=null,category="bosses",search="",rarity="all",selectedId="",lastFocus=null,loading=false;
const labels={value:"ATK",defense:"DEF",maxHp:"HP",maxMp:"MP"};
function init(){
 if($("v035Index"))return;
 const btn=document.createElement("button");btn.type="button";btn.id="v035Open";btn.className="v035-open";btn.textContent="📖 ADVENTURE INDEX";btn.setAttribute("aria-haspopup","dialog");
 const game=document.getElementById("game");
 if(game)game.appendChild(btn);
 const node=document.createElement("div");node.id="v035Index";node.className="v035-overlay";node.hidden=true;
 node.innerHTML='<div class="v035-scrim" data-v035-dismiss></div><section class="v035-window" role="dialog" aria-modal="true" aria-labelledby="v035Heading" tabindex="-1">'+
 '<header class="v035-title"><div><small>THE FORGOTTEN KINGDOM · FIELD ARCHIVE</small><h2 id="v035Heading">📖 ADVENTURE INDEX</h2><span class="v035-subtitle">Monsters · Bosses · Equipment · Supplies · The World</span></div><button type="button" id="v035Exit" aria-label="Close index">✕</button></header>'+
 '<div class="v035-toolbar"><label class="v035-search">⌕ <input id="v035Search" type="search" placeholder="Search names, items, stage, boss..." autocomplete="off"></label>'+
 '<label class="v035-filter">RARITY <select id="v035Rarity"><option value="all">All rarities</option><option value="common">Common</option><option value="uncommon">Uncommon</option><option value="rare">Rare</option><option value="epic">Epic</option><option value="legendary">Legendary</option></select></label></div>'+
 '<div class="v035-body"><nav id="v035Tabs" class="v035-tabs" aria-label="Index categories"></nav><main class="v035-main"><div class="v035-list-head"><strong id="v035CategoryTitle">BOSSES</strong><small id="v035Count">Loading...</small></div><div class="v035-results" id="v035Results"></div></main><aside id="v035Details" class="v035-details"><p>Select an entry to see its stats and origin.</p></aside></div>'+
 '<footer class="v035-footer"><span id="v035Status" role="status" aria-live="polite">Loading game records...</span><button id="v035Close" type="button">CLOSE INDEX</button></footer></section>';
 document.body.appendChild(node);
 btn.addEventListener("click",open);
 node.addEventListener("click",event=>{
  if(event.target.closest("[data-v035-dismiss],#v035Exit,#v035Close")){close();return}
  const tab=event.target.closest("[data-v035-tab]");if(tab){category=tab.dataset.v035Tab;selectedId="";render();return}
  const jump=event.target.closest("[data-v037-boss]");
  if(jump){category="bosses";search="";rarity="all";$("v035Search").value="";$("v035Rarity").value="all";selectedId="stage-"+jump.dataset.v037Boss;render();$("v035Details").scrollTop=0;return}
  const card=event.target.closest("[data-v035-entry]");if(card){selectedId=card.dataset.v035Entry;renderSelection();return}
 });
 $("v035Search").addEventListener("input",event=>{search=event.target.value.trim().toLowerCase();selectedId="";render()});
 $("v035Rarity").addEventListener("change",event=>{rarity=event.target.value;selectedId="";render()});
 document.addEventListener("keydown",event=>{
  if(node.hidden)return;
  if(event.key==="Escape"){event.preventDefault();event.stopImmediatePropagation();close();return}
  if(event.key==="Tab"){
   const enabled=Array.from(node.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled])')).filter(el=>el.getClientRects().length);
   if(!enabled.length)return;
   const i=enabled.indexOf(document.activeElement);
   if(event.shiftKey&&i<=0){event.preventDefault();enabled.at(-1).focus()}
   if(!event.shiftKey&&i===enabled.length-1){event.preventDefault();enabled[0].focus()}
  }
 },true);
}
async function open(){
 if(!$("v035Index"))init();
 const root=$("v035Index");lastFocus=document.activeElement;root.hidden=false;document.body.classList.add("v035-modal-open");
 $("v035Open")?.setAttribute("aria-expanded","true");$("v035Exit").focus();
 if(!data&&!loading){
  loading=true;$("v035Status").textContent="Reading live game catalog...";
  try{
   const response=await fetch("/api/index",{cache:"no-store"});
   if(!response.ok)throw Error("Server returned "+response.status);
   data=await response.json();
   $("v035Status").textContent="Game rules and equipment catalog · v"+data.version;
  }catch(err){
   $("v035Status").textContent="Index unavailable: "+err.message+". Retry by closing and reopening.";
   $("v035Results").innerHTML='<div class="v035-empty">Cannot load the encyclopedia. Check the deployment and try again.</div>';
  }finally{loading=false}
 }
 render();
}
function close(){
 const root=$("v035Index");if(!root||root.hidden)return;root.hidden=true;document.body.classList.remove("v035-modal-open");
 $("v035Open")?.setAttribute("aria-expanded","false");(lastFocus?.isConnected?lastFocus:$("v035Open"))?.focus();
}
function entries(){
 if(!data)return [];
 let out=[];
 if(category==="bosses")out=(data.monsters||[]).filter(x=>x.boss).map(x=>({...x,kind:"enemy"}));
 else if(category==="monsters")out=(data.monsters||[]).filter(x=>!x.boss).map(x=>({...x,kind:"enemy"}));
 else if(category==="zones")out=(data.zones||[]).map((x,i)=>({...x,id:"zone-"+i,kind:"zone"}));
 else out=(data.items||[]).filter(x=>x.category===category).map((x,i)=>({...x,kind:"item",recordId:x.uid||[x.id,x.rarity||"shop",x.source||"shop",i].join("::")}));
 if(category!=="bosses"&&category!=="monsters"&&category!=="zones"&&rarity!=="all")out=out.filter(x=>(x.rarity||"common")===rarity);
 if(search)out=out.filter(x=>[x.name,x.source,x.zone,x.stage,x.slot,x.description,x.rarity,x.stages,x.hint].some(v=>String(v||"").toLowerCase().includes(search)));
 return out;
}
function uid(it){return String(it.recordId||it.id)}
function entryMarkup(item){
 const isEnemy=item.kind==="enemy",isZone=item.kind==="zone";
 const sub=isEnemy?"STAGE "+item.stage+" · "+esc(item.zone):isZone?"STAGES "+esc(item.stages):item.source?"DROP · "+esc(item.source):item.price!=null?"MERCHANT · "+item.price+" GOLD":"ITEM";
 const stat=isEnemy?"HP "+item.hp+" · ATK "+item.atk+" · DEF "+item.def:!isZone&&item.description?esc(item.description):"";
 const rarityTag=item.rarity?'<span class="v035-rarity v035-'+esc(item.rarity)+'">'+esc(item.rarity.toUpperCase())+'</span>':"";
 return '<button type="button" data-v035-entry="'+esc(uid(item))+'" class="v035-entry '+(uid(item)===selectedId?"active":"")+'">'+
 '<span class="v035-entry-icon">'+esc(item.icon|| (isZone?"🗺️":"✦"))+'</span><span class="v035-entry-text"><strong>'+esc(item.name)+'</strong><small>'+sub+'</small><em>'+stat+'</em></span>'+rarityTag+'</button>';
}
function render(){
 const nav=$("v035Tabs");if(!nav||!data)return;
 nav.innerHTML=opts.map(opt=>{
  const count=opt.id==="bosses"?data.monsters.filter(x=>x.boss).length:opt.id==="monsters"?data.monsters.filter(x=>!x.boss).length:opt.id==="zones"?(data.zones||[]).length:data.items.filter(x=>x.category===opt.id).length;
  return '<button type="button" class="v035-tab '+(category===opt.id?"active":"")+'" data-v035-tab="'+opt.id+'" aria-pressed="'+(category===opt.id)+'"><span>'+opt.icon+'</span><strong>'+opt.label+'</strong><small>'+count+'</small></button>';
 }).join("");
 const filtered=entries();
 const current=opts.find(x=>x.id===category);
 $("v035CategoryTitle").textContent=current?.label||"INDEX";
 $("v035Count").textContent=filtered.length+" RECORDS";
 $("v035Rarity").disabled=["bosses","monsters","zones"].includes(category);
 $("v035Results").innerHTML=filtered.map(entryMarkup).join("")||'<div class="v035-empty">No entries match your filters.</div>';
 if(!filtered.some(x=>uid(x)===selectedId))selectedId=filtered[0]?uid(filtered[0]):"";
 renderSelection();
}
function enemyDetail(e){
 const img=e.boss?"/assets/bosses/"+e.sprite+".svg":"/assets/monsters/"+e.sprite+".svg";
 return '<div class="v035-enemy-art"><img alt="'+esc(e.name)+'" src="'+esc(img)+'" loading="lazy" onerror="this.style.display=\'none\'"></div>'+
 '<div class="v035-stats"><span>❤️ HP <b>'+e.hp+'</b></span><span>⚔ ATK <b>'+e.atk+'</b></span><span>🛡 DEF <b>'+e.def+'</b></span><span>✧ EXP <b>'+e.xp+'</b></span><span>🪙 GOLD <b>'+e.gold+'</b></span><span>🗺 STAGE <b>'+e.stage+'</b></span></div>'+
 '<div class="v035-detail-info"><strong>LOCATION</strong><p>'+esc(e.zone)+'</p><strong>REWARDS</strong><p>'+esc(e.loot)+'</p>'+
 (e.boss?'<strong>EXCLUSIVE BOSS DROPS</strong><div class="v037-boss-loot">'+(e.drops||[]).map(it=>'<button type="button" data-v035-entry="'+esc([it.id,it.rarity,it.source||"",0].join("::"))+'" class="v037-loot-entry" title="View this item"><span>'+esc(it.icon||"✦")+'</span><span>'+esc(it.name)+'</span><b>'+it.chance+'%</b></button>').join("")+'</div><p>Each percentage is an independent chance for this item on a single roll. At most one drop per victory; a roll can give no item.</p>':'<p>Regular encounters do not drop equipment.</p>')+'</div>';
}
function itemDetail(e){
 const bonuses=Object.entries(labels).filter(([k])=>Number(e[k])>0).map(([key,l])=>'<span>'+l+' <b>+'+e[key]+'</b></span>').join("");
 return '<div class="v035-item-art">'+esc(e.icon||"✦")+'</div>'+
 '<div class="v035-stats">'+(bonuses||'<span>Utility item</span>')+'</div>'+
 '<div class="v035-detail-info"><strong>ITEM TYPE</strong><p>'+esc(e.slot||e.category||"Supplies")+'</p>'+
 (e.rarity?'<strong>RARITY</strong><p>'+esc(e.rarity.toUpperCase())+'</p>':'')+
 (e.source?'<strong>ACQUIRED FROM</strong><p><button type="button" class="v037-source-link" data-v037-boss="'+esc(e.sourceStage||e.bossStage)+'">👑 '+esc(e.source)+' · Stage '+esc(e.sourceStage||e.bossStage)+' →</button></p><strong>DROP CHANCE</strong><p>'+esc(e.chance)+'% per boss victory</p>':'')+
 (e.price!=null?'<strong>MERCHANT PRICE</strong><p>'+esc(e.price)+' gold</p>':'')+
 '<strong>DESCRIPTION</strong><p>'+esc(e.description||"Equipment with fixed stats.")+'</p></div>';
}
function renderSelection(){
 if(!data)return;
 const list=entries(),entry=list.find(x=>uid(x)===selectedId);
 $("v035Results")?.querySelectorAll(".v035-entry").forEach(el=>el.classList.toggle("active",el.dataset.v035Entry===selectedId));
 if(!entry){$("v035Details").innerHTML='<div class="v035-empty">Choose an entry to view details.</div>';return}
 $("v035Details").innerHTML='<div class="v035-detail-heading"><small>FIELD NOTES · '+esc(category.toUpperCase())+'</small><h3>'+esc(entry.name)+'</h3></div>'+
 (entry.kind==="enemy"?enemyDetail(entry):entry.kind==="zone"?'<div class="v035-item-art">🗺️</div><div class="v035-detail-info"><strong>STAGES</strong><p>'+esc(entry.stages)+'</p><strong>ZONE</strong><p>'+esc(entry.hint)+'</p></div>':itemDetail(entry));
}
window.SoulboundIndex={open,close,refresh:()=>{data=null;if(!$("v035Index")?.hidden)open()}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
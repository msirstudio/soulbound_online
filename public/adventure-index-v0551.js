/* SOULBOUND v0.55.1 · cache-busted, searchable, read-only adventure encyclopedia.
 * Data is always retrieved from /api/index (the exact server encounter/catalog rules).
 */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const opts=[
 {id:"bosses",label:"BOSSES",icon:"👑"},
 {id:"monsters",label:"MONSTERS",icon:"🐺"},
 {id:"races",label:"BLOODLINES",icon:"🧬"},
 {id:"weapons",label:"WEAPONS",icon:"⚔️"},
 {id:"armor",label:"ARMOR",icon:"🛡️"},
 {id:"accessories",label:"ACCESSORIES",icon:"💍"},
 {id:"food",label:"FOOD",icon:"🍖"},
 {id:"consumables",label:"POTIONS",icon:"🧪"},
 {id:"zones",label:"WORLD",icon:"🗺️"},
 {id:"elements",label:"ELEMENTS",icon:"🔥"},
 {id:"statuses",label:"STATUS",icon:"☠️"},
 {id:"combat",label:"COMBAT RULES",icon:"📜"}
];
let data=null,category="bosses",search="",rarity="all",selectedId="",lastFocus=null,loading=false,hero=null;
const discoveries=()=>hero?.worldProgress||{};
function acquired(item){
 if(item.kind==="race")return (discoveries().raceSeen||[]).includes(item.id)||hero?.raceId===item.id;
 if(item.kind!=="item")return false;
 const seen=(discoveries().lootSeen||[]);
 const key=item.id+":"+(item.rarity||"shop");
 return seen.includes(key)||(hero?.inventory||[]).some(it=>it.id===item.id&&(!item.rarity||it.rarity===item.rarity));
}
const labels={value:"ATK",defense:"DEF",maxHp:"HP",maxMp:"MP"};
function init(){
 if($("v035Index"))return;
 // Food buff controls stay usable even though the duplicate Hero Inventory HUD is hidden.
 const food=$("foodInventory"),potions=document.querySelector("#game .potion-panel");if(food&&potions)potions.appendChild(food);
 const btn=document.createElement("button");btn.type="button";btn.id="v035Open";btn.className="v035-open";btn.textContent="📖 ADVENTURE INDEX";btn.setAttribute("aria-haspopup","dialog");
 const game=document.getElementById("game");
 const dock=game?.querySelector?.(".v22-command-dock");
 if(dock){const spot=document.createElement("div");spot.className="v042-index-spot";dock.appendChild(spot);btn.textContent="📖 INDEX";btn.setAttribute("aria-label","Adventure Index");btn.title="Adventure Index";spot.appendChild(btn)}
 else if(game)game.appendChild(btn);
 const node=document.createElement("div");node.id="v035Index";node.className="v035-overlay";node.hidden=true;
 node.innerHTML='<div class="v035-scrim" data-v035-dismiss></div><section class="v035-window" role="dialog" aria-modal="true" aria-labelledby="v035Heading" tabindex="-1">'+
 '<header class="v035-title"><div><small>THE FORGOTTEN KINGDOM · FIELD ARCHIVE</small><h2 id="v035Heading">📖 ADVENTURE INDEX</h2><span class="v035-subtitle">Boss Skills · Element Weaknesses · Status Effects · Combat Rules · Equipment</span></div><button type="button" id="v035Exit" aria-label="Close index">✕</button></header>'+
 '<div class="v035-toolbar"><label class="v035-search">⌕ <input id="v035Search" type="search" placeholder="Search names, items, stage, boss..." autocomplete="off"></label>'+
 '<label class="v035-filter">RARITY <select id="v035Rarity"><option value="all">All rarities</option><option value="common">Common</option><option value="uncommon">Uncommon</option><option value="rare">Rare</option><option value="epic">Epic</option><option value="legendary">Legendary</option></select></label></div>'+
 '<div class="v035-body"><nav id="v035Tabs" class="v035-tabs" aria-label="Index categories"></nav><main class="v035-main"><div class="v035-list-head"><strong id="v035CategoryTitle">BOSSES</strong><small id="v035Count">Loading...</small></div><div class="v035-results" id="v035Results"></div></main><aside id="v035Details" class="v035-details"><p>Select an entry to see its stats and origin.</p></aside></div>'+
 '<footer class="v035-footer"><span id="v035Status" role="status" aria-live="polite">Loading game records...</span><button id="v035Close" type="button">CLOSE INDEX</button></footer></section>';
 document.body.appendChild(node);
 btn.addEventListener("click",open);
 node.addEventListener("click",event=>{
  if(event.target.closest("[data-v035-dismiss],#v035Exit,#v035Close")){close();return}
  const tab=event.target.closest("[data-v035-tab]");if(tab){category=tab.dataset.v035Tab;selectedId="";render();return}
  const itemJump=event.target.closest("[data-v037-item]");
  if(itemJump){const item=(data?.items||[]).find(it=>it.id===itemJump.dataset.v037Item&&it.rarity===itemJump.dataset.v037Rarity);if(item){category=item.category;search="";rarity="all";$("v035Search").value="";$("v035Rarity").value="all";render();const target=entries().find(it=>it.id===item.id&&it.rarity===item.rarity);if(target){selectedId=uid(target);renderSelection()}}return}
  const jump=event.target.closest("[data-v037-boss]");
  if(jump){category=Number(jump.dataset.v037Boss)%5===4?"monsters":"bosses";search="";rarity="all";$("v035Search").value="";$("v035Rarity").value="all";selectedId="stage-"+jump.dataset.v037Boss;render();$("v035Details").scrollTop=0;return}
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
async function open(section){
 if(typeof section==="string"&&opts.some(x=>x.id===section)){
  category=section;selectedId="";search="";rarity="all";
  if($("v035Search"))$("v035Search").value="";
  if($("v035Rarity"))$("v035Rarity").value="all";
 }
 if(!$("v035Index"))init();
 const root=$("v035Index");lastFocus=document.activeElement;root.hidden=false;document.body.classList.add("v035-modal-open");
 $("v035Open")?.setAttribute("aria-expanded","true");$("v035Exit").focus();
 if(!data&&!loading){
  loading=true;$("v035Status").textContent="Reading live game catalog...";
  try{
   const response=await fetch("/api/index?codex=0.55.1",{cache:"no-store"});
   if(!response.ok)throw Error("Server returned "+response.status);
   data=await response.json();
   if(!data.codex||!Array.isArray(data.codex.elements)||!Array.isArray(data.codex.statusEffects)){
    throw Error("Outdated /api/index response: ELEMENTS and STATUS rules not available. Verify server v0.55.1 is deployed.");
   }
   $("v035Status").textContent="INDEX UI v0.55.1 · API v"+data.version+" · "+data.codex.elements.length+" elements · "+data.codex.statusEffects.length+" status effects";
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
 else if(category==="races")out=(data.races||[]).map(x=>({...x,kind:"race"}));
 else if(category==="zones")out=(data.zones||[]).map((x,i)=>({...x,id:"zone-"+i,kind:"zone"}));
 else if(category==="elements")out=(data.codex?.elements||[]).map(x=>({...x,kind:"element"}));
 else if(category==="statuses")out=(data.codex?.statusEffects||[]).map(x=>({...x,kind:"status"}));
 else if(category==="combat")out=Object.entries(data.codex?.combatRules||{}).map(([id,description])=>({id,name:id.replace(/([A-Z])/g," $1").toUpperCase(),description,icon:"📜",kind:"rule"}));
 else out=(data.items||[]).filter(x=>x.category===category).map((x,i)=>({...x,kind:"item",recordId:x.uid||[x.id,x.rarity||"shop",x.source||"shop",i].join("::")}));
 if(!["bosses","monsters","zones","elements","statuses","combat"].includes(category)&&rarity!=="all")out=out.filter(x=>(x.rarity||"common")===rarity);
 if(search)out=out.filter(x=>[x.name,x.source,x.zone,x.stage,x.slot,x.description,x.rarity,x.stages,x.hint,x.passive,x.effect,x.counter,x.element,...(x.weak||[]),...(x.resist||[]),...(x.buffs||[])].some(v=>String(v||"").toLowerCase().includes(search)));
 return out;
}
function uid(it){return String(it.recordId||it.id)}
function entryMarkup(item){
 const isEnemy=item.kind==="enemy",isZone=item.kind==="zone",isRace=item.kind==="race",got=acquired(item);
 const sub=isEnemy?"STAGE "+item.stage+" · "+(item.miniBoss?"MINI-BOSS · ":"")+esc(item.zone):item.kind==="element"?"ELEMENT · WEAKNESS & RESISTANCE":item.kind==="status"?"STATUS EFFECT · COUNTERS":item.kind==="rule"?"HARDCORE COMBAT GUIDE":isZone?"STAGES "+esc(item.stages):isRace?"RACE · "+esc(item.chance)+"% SUMMON RATE":item.source?"DROP · "+esc(item.source):item.price!=null?"MERCHANT · "+item.price+" GOLD":"ITEM";
 const stat=isEnemy?"HP "+item.hp+" · ATK "+item.atk+" · DEF "+item.def+(item.element?" · "+item.element.toUpperCase():""):item.kind==="status"?esc(item.effect):isRace?esc(item.passive):!isZone&&item.description?esc(item.description):"";
 const rarityTag=item.rarity?'<span class="v035-rarity v035-'+esc(item.rarity)+'">'+esc(item.rarity.toUpperCase())+'</span>':"";
 return '<button type="button" data-v035-entry="'+esc(uid(item))+'" class="v035-entry '+(uid(item)===selectedId?"active ":"")+(got?"v044-discovered":"")+'">'+
 '<span class="v035-entry-icon">'+esc(item.icon|| (isZone?"🗺️":"✦"))+'</span>'+(got?'<span class="v044-found-tag">✓ OWNED</span>':'')+'<span class="v035-entry-text"><strong>'+esc(item.name)+'</strong><small>'+sub+'</small><em>'+stat+'</em></span>'+rarityTag+'</button>';
}
function render(){
 const nav=$("v035Tabs");if(!nav||!data)return;
 nav.innerHTML=opts.map(opt=>{
  const count=opt.id==="bosses"?data.monsters.filter(x=>x.boss).length:opt.id==="monsters"?data.monsters.filter(x=>!x.boss).length:opt.id==="zones"?(data.zones||[]).length:opt.id==="races"?(data.races||[]).length:opt.id==="elements"?(data.codex?.elements||[]).length:opt.id==="statuses"?(data.codex?.statusEffects||[]).length:opt.id==="combat"?Object.keys(data.codex?.combatRules||{}).length:data.items.filter(x=>x.category===opt.id).length;
  return '<button type="button" class="v035-tab '+(category===opt.id?"active":"")+'" data-v035-tab="'+opt.id+'" aria-pressed="'+(category===opt.id)+'"><span>'+opt.icon+'</span><strong>'+opt.label+'</strong><small>'+count+'</small></button>';
 }).join("");
 const filtered=entries();
 const current=opts.find(x=>x.id===category);
 $("v035CategoryTitle").textContent=current?.label||"INDEX";
 $("v035Count").textContent=filtered.length+" RECORDS";
 $("v035Rarity").disabled=["bosses","monsters","zones","elements","statuses","combat"].includes(category);
 $("v035Results").innerHTML=filtered.map(entryMarkup).join("")||'<div class="v035-empty">No entries match your filters.</div>';
 if(!filtered.some(x=>uid(x)===selectedId))selectedId=filtered[0]?uid(filtered[0]):"";
 renderSelection();
}
function enemyDetail(e){
 const fallback=e.boss?"/assets/bosses/"+e.sprite+".svg":"/assets/monsters/"+e.sprite+".svg";
 const miniKeys=["rootbound_guardian","ironbound_executioner","molten_behemoth","sanctum_keeper","frosthorn_colossus","titans_sentinel","abyss_watcher","twilight_regent"];
 const miniArt=e.miniBoss?"/assets/minibosses/v043/"+miniKeys[Math.ceil(e.stage/5)-1]+"_normal.svg":null;
 const staged=e.boss?window.SoulboundBossSpritesV39?.imagesFor(e.stage):null;
 const img=miniArt||staged?.normal||fallback;
 const quickMoves=(e.moves||[]).map(m=>m.name+(m.phase===2?" [Phase 2]":"")+(m.effect?" · "+m.effect.toUpperCase()+" "+Math.round((m.chance||0)*100)+"%":""));
 const quick='<section class="v0551-boss-quick" aria-label="Combat weaknesses and attacks">'+
 '<div class="v0551-boss-affinity"><span>✦ ELEMENT <b>'+esc((e.element||"physical").toUpperCase())+'</b></span>'+
 '<span>⬆ WEAK <b>'+esc((e.weak||[]).join(", ").toUpperCase()||"NONE")+'</b></span>'+
 '<span>⬇ RESIST <b>'+esc((e.resist||[]).join(", ").toUpperCase()||"NONE")+'</b></span></div>'+
 '<p>⚔ ATTACK MOVES: '+esc(quickMoves.join(" · ")||"Strike")+'</p>'+
 (e.phase2?'<p>⚠ PHASE 2 AT 50% HP · '+esc((e.phase2Affinity?.element||e.element||"physical").toUpperCase())+' · WEAK: '+esc((e.phase2Affinity?.weak||[]).join(", ").toUpperCase()||"NONE")+'</p>':"")+
 '</section>';
 return quick+'<div class="v035-enemy-art"><img alt="'+esc(e.name)+'" src="'+esc(img)+'" loading="lazy" data-v039-fallback="'+esc(fallback)+'" onerror="if(this.dataset.v039Fallback && this.src.indexOf(this.dataset.v039Fallback)===-1){this.src=this.dataset.v039Fallback}else{this.style.display=\'none\'}"></div>'+
 '<div class="v035-stats"><span>❤️ HP <b>'+e.hp+'</b></span><span>⚔ ATK <b>'+e.atk+'</b></span><span>🛡 DEF <b>'+e.def+'</b></span><span>✧ EXP <b>'+e.xp+'</b></span><span>🪙 GOLD <b>'+e.gold+'</b></span><span>🗺 STAGE <b>'+e.stage+'</b></span></div>'+
 '<div class="v035-detail-info"><strong>LOCATION</strong><p>'+esc(e.zone)+'</p>'+
 '<strong>ELEMENT / RESISTANCES</strong><p>'+esc((e.element||"physical").toUpperCase())+' · Weak to: '+esc((e.weak||[]).join(", ")||"None")+' (×'+esc(data?.codex?.combatRules?.weaknessMultiplier||1.2)+') · Resists: '+esc((e.resist||[]).join(", ")||"None")+' (×'+esc(data?.codex?.combatRules?.resistanceMultiplier||.8)+')</p>'+
 (e.phase2?'<p>⚠ PHASE 2 at 50% HP · Element '+esc(e.phase2Affinity?.element||e.element)+' · Weak: '+esc((e.phase2Affinity?.weak||[]).join(", "))+' · Resists: '+esc((e.phase2Affinity?.resist||[]).join(", "))+'</p>':"")+
 '<strong>ATTACK MOVES / STATUS CHANCES</strong><div class="v055-move-codex">'+(e.moves||[]).map(m=>'<div class="v055-move"><b>'+esc(m.name)+(m.phase===2?" · PHASE 2":"")+'</b><span>'+esc((m.element||"physical").toUpperCase())+' · '+esc(m.scope==="all"?"ALL HEROES":"SINGLE TARGET")+(m.charge?" · ⚠ CHARGE FIRST":"")+' · Power ×'+esc(m.power)+'</span><small>'+esc(m.effect?("Applies "+m.effect.toUpperCase()+" · base "+Math.round((m.chance||0)*100)+"% chance before target resistance"):"No status effect")+'</small><small>'+esc(m.description||"")+'</small></div>').join("")+'</div>'+
 (e.boss||e.miniBoss?'<strong>STAGGER / INTERRUPT</strong><p>Solo threshold: '+esc(e.staggerThreshold)+' · Stagger scales with party size. Fill during a charged attack to interrupt; bosses resist repeat interrupts briefly.</p>':"")+
 '<strong>REWARDS</strong><p>'+esc(e.loot)+'</p>'+
 (e.boss||e.miniBoss?'<strong>'+ (e.miniBoss?"MINI-BOSS":"BOSS")+' POTENTIAL DROPS</strong><div class="v037-boss-loot">'+(e.drops||[]).map(it=>'<button type="button" data-v037-item="'+esc(it.id)+'" data-v037-rarity="'+esc(it.rarity)+'" class="v037-loot-entry '+(acquired({...it,kind:"item"})?"v044-discovered":"")+'" title="View this item"><span>'+esc(it.icon||"✦")+'</span><span>'+esc(it.name)+'</span><b>'+it.chance+'%</b>'+(acquired({...it,kind:"item"})?'<em>✓</em>':"")+'</button>').join("")+'</div><p>Each item rolls independently per player and per victory. Multiple items can drop together.</p>':'<p>Regular encounters do not drop equipment.</p>')+'</div>';
}
function guideDetail(e){
 if(e.kind==="element"){
  const vulnerabilities=(data?.codex?.affinities||[]).filter(a=>a.weak?.includes(e.id)).map(a=>a.regionId.replace(/_/g," "));
  const defenders=(data?.codex?.affinities||[]).filter(a=>a.resist?.includes(e.id)).map(a=>a.regionId.replace(/_/g," "));
  return '<div class="v035-item-art">'+esc(e.icon||"✦")+'</div><div class="v035-detail-info"><strong>ELEMENT</strong><p>'+esc(e.description||"")+'</p><strong>STRONG AGAINST</strong><p>'+esc(vulnerabilities.join(", ")||"No inherent regional weakness")+'</p><strong>RESISTED BY</strong><p>'+esc(defenders.join(", ")||"No inherent regional resistance")+'</p><strong>DAMAGE MODIFIERS</strong><p>'+esc(data?.codex?.combatRules?.damage||"")+'</p><p>Actual enemy vulnerabilities and phase changes are shown in BOSSES / MONSTERS.</p></div>';
 }
 if(e.kind==="status")return '<div class="v035-item-art">'+esc(e.icon||"✦")+'</div><div class="v035-detail-info"><strong>EFFECT</strong><p>'+esc(e.effect)+'</p><strong>COUNTERPLAY</strong><p>'+esc(e.counter)+'</p><strong>BASE DURATION</strong><p>'+esc(e.turns)+' affected turns (can be refreshed; resists and immunity apply)</p><strong>DOT LIMIT</strong><p>'+esc(data?.codex?.combatRules?.dotCapPercent||10)+'% Max HP per player turn across Burn, Poison and Bleed.</p></div>';
 return '<div class="v035-item-art">📜</div><div class="v035-detail-info"><strong>HARDCORE RULE</strong><p>'+esc(e.description)+'</p></div>';
}
function raceDetail(r){
 const got=acquired(r);
 return '<div class="v044-race-icon">'+esc(r.icon||"✦")+'</div>'+
 '<div class="v035-detail-info"><strong>RARITY</strong><p>'+esc((r.rarity||"common").toUpperCase())+
 ' · SUMMON CHANCE '+esc(r.chance)+'%</p><strong>PASSIVE</strong><p>'+esc(r.passive||"")+
 '</p><strong>ATTRIBUTES</strong><p>'+(r.buffs||[]).map(esc).join(" · ")+
 '</p><p class="'+(got?"v044-owned-note":"")+'">'+(got?"✓ DISCOVERED BLOODLINE":"Not yet discovered")+'</p></div>';
}
function itemDetail(e){
 const bonuses=Object.entries(labels).filter(([k])=>Number(e[k])>0).map(([key,l])=>'<span>'+l+' <b>+'+e[key]+'</b></span>').join("");
 return '<div class="v035-item-art">'+esc(e.icon||"✦")+'</div>'+
 '<div class="v035-stats">'+(bonuses||'<span>Utility item</span>')+'</div>'+
 '<div class="v035-detail-info">'+(acquired({...e,kind:"item"})?'<p class="v044-owned-note">✓ ALREADY DISCOVERED</p>':'')+'<strong>ITEM TYPE</strong><p>'+esc(e.slot||e.category||"Supplies")+'</p>'+
 (e.rarity?'<strong>RARITY</strong><p>'+esc(e.rarity.toUpperCase())+'</p>':'')+
 (e.source?'<strong>ACQUIRED FROM</strong><p><button type="button" class="v037-source-link" data-v037-boss="'+esc(e.sourceStage||e.bossStage)+'">👑 '+esc(e.source)+' · Stage '+esc(e.sourceStage||e.bossStage)+' →</button></p><strong>DROP CHANCE</strong><p>'+esc(e.chance)+'% per victory (independent item roll)</p>':'')+
 (e.price!=null?'<strong>MERCHANT PRICE</strong><p>'+esc(e.price)+' gold</p>':'')+
 '<strong>DESCRIPTION</strong><p>'+esc(e.description||"Equipment with fixed stats.")+'</p></div>';
}
function renderSelection(){
 if(!data)return;
 const list=entries(),entry=list.find(x=>uid(x)===selectedId);
 $("v035Results")?.querySelectorAll(".v035-entry").forEach(el=>el.classList.toggle("active",el.dataset.v035Entry===selectedId));
 if(!entry){$("v035Details").innerHTML='<div class="v035-empty">Choose an entry to view details.</div>';return}
 $("v035Details").innerHTML='<div class="v035-detail-heading"><small>FIELD NOTES · '+esc(category.toUpperCase())+'</small><h3>'+esc(entry.name)+'</h3></div>'+
 (entry.kind==="enemy"?enemyDetail(entry):["element","status","rule"].includes(entry.kind)?guideDetail(entry):entry.kind==="race"?raceDetail(entry):entry.kind==="zone"?'<div class="v035-item-art">🗺️</div><div class="v035-detail-info"><strong>STAGES</strong><p>'+esc(entry.stages)+'</p><strong>ZONE</strong><p>'+esc(entry.hint)+'</p></div>':itemDetail(entry));
}
window.SoulboundIndex={open,close,refresh:()=>{data=null;if(!$("v035Index")?.hidden)open()},
 updateHero(p){hero=p||null;if(data&&$("v035Index")&&!$("v035Index").hidden)render()} };
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
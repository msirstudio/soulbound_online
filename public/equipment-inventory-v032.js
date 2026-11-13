/* SOULBOUND v0.32: unified equipment and bag. UI-only: existing server equipItem
   validates inventory ownership, class and between-battle timing. */
(function(){
"use strict";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
/* Left column: armor, right column: weapons and jewelry. */
const slots=[
 ["head","🪖","HELMET"],["chest","🛡","CHEST ARMOR"],
 ["pants","👖","PANTS"],["boots","🥾","BOOTS"],
 ["main","⚔","MAIN WEAPON"],["offhand","🗡","OFF-HAND"],
 ["neck","💎","NECKLACE"],["ring_left","💍","LEFT RING"],["ring_right","💍","RIGHT RING"]
];
let modal,openButton,closeButton,me=null,room=null,equipAction=null,unequipAction=null,discardAction=null,selected=null,busy=false,previousFocus=null;
const aliases={weapon:"main",mainhand:"main",main_weapon:"main",armor:"chest",chest_armor:"chest",helmet:"head",hat:"head",head:"head",necklace:"neck",neck:"neck",legs:"pants",pants:"pants",shoes:"boots",boots:"boots",offhand:"offhand",off_hand:"offhand",shield:"offhand",ring:"ring_left",ring_left:"ring_left",ring_right:"ring_right"};
const displaySlot=item=>aliases[String(item?.slot||"").toLowerCase()]||"unknown";
const validDrop=(item,slot)=>{const kind=displaySlot(item);return kind===slot||(kind==="ring_left"&&slot==="ring_right");};
const itemKey=item=>String(item?.uid||item?.id||"");
const selectedItem=id=>(me?.inventory||[]).find(it=>itemKey(it)===String(id));
function notify(message,err=false){
 const line=modal?.querySelector("#v032Hint");if(!line)return;
 line.textContent=message;line.dataset.error=String(err);
}
function init(){
 if(document.getElementById("v032Modal"))return;
 const el=document.createElement("div");el.id="v032Modal";el.className="v032-overlay v033-overlay";el.hidden=true;
 el.setAttribute("role","presentation");
 el.innerHTML='<div class="v032-scrim" data-v032-close></div><section class="v032-window" role="dialog" aria-modal="true" aria-labelledby="v032Title" tabindex="-1">'+
 '<header class="v032-head"><div><small>✦ SOULBOUND ONLINE · HERO LOADOUT</small><h2 id="v032Title">⚔ EQUIPMENT & INVENTORY</h2></div><button id="v032Close" type="button" aria-label="Close equipment and inventory">✕</button></header>'+
 '<div id="v044StatsBar" class="v044-stats-bar" aria-label="Current hero attributes"></div><div class="v032-content"><section class="v032-gear"><div class="v032-section-title">✦ EQUIPMENT · CLICK OR DRAG TO EQUIP ✦</div>'+
 '<div class="v032-paperdoll"><div class="v033-group-titles"><span>ARMOR</span><span>WEAPONS & ACCESSORIES</span></div><div id="v032Slots" class="v032-slots"></div><div class="v032-hero"><div id="v032HeroArt" class="v032-hero-art"></div><strong id="v032HeroName">HERO</strong><small id="v032HeroStats"></small></div></div>'+
 '<div class="v032-note" id="v032EquipStatus"></div></section>'+
 '<section class="v032-bag"><div class="v032-bag-top"><div class="v032-section-title">✦ INVENTORY ✦</div><span id="v032BagCount">0 ITEMS</span></div>'+
 '<div id="v044Actions" class="v044-bag-actions" aria-live="polite"><span id="v044Selected">Select an item</span><button type="button" data-v044-action="equip" disabled>EQUIP</button><button type="button" data-v044-action="unequip" disabled>UNEQUIP</button></div><div id="v032Bag" class="v032-bag-grid"></div><div class="v032-quick-help">Green = compatible · Red = class/level locked · Click EQUIP, or drag onto a slot.</div></section></div>'+
 '<footer class="v032-foot"><span id="v032Hint" role="status" aria-live="polite">Gear may only be changed between battles.</span><div class="v034-foot-buttons"><button id="v034Discard" type="button" title="Permanently discard the selected unequipped item">🗑 DISCARD SELECTED</button><button id="v032Done" type="button">CLOSE</button></div></footer></section>';
 document.body.appendChild(el);modal=el;
 openButton=document.getElementById("toggleEquipment");
 closeButton=document.getElementById("v032Close");
 const second=document.getElementById("toggleInventory");
 if(openButton){
  openButton.textContent="🎒 EQUIPMENT & BAG";
  openButton.setAttribute("aria-haspopup","dialog");
  openButton.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();toggle()},true);
 }
 if(second){
  second.hidden=true;second.setAttribute("aria-hidden","true");
  second.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();toggle()},true);
 }
 modal.addEventListener("click",e=>{
  const action=e.target.closest("[data-v044-action]");if(action){if(action.disabled)return;return onAction(action.dataset.v044Action)}
  if(e.target.closest("[data-v032-close],#v032Close,#v032Done")){close();return}
  if(e.target.closest("#v034Discard")){
   const item=selectedItem(selected);
   if(!item)return notify("Select an unequipped item before discarding.",true);
   if(item.equippedSlot)return notify("Unequip this item before discarding it.",true);
   if(!["city","shop","victory","regionClear"].includes(room?.status))return notify("You cannot discard gear during battle.",true);
   if(!confirm("Permanently discard "+item.name+"? This cannot be undone."))return;
   if(busy)return;busy=true;
   Promise.resolve(discardAction?.(itemKey(item))).then(result=>{
     if(result?.ok){selected=null;notify(item.name+" discarded.")}
     else notify(result?.error||"Cannot discard item.",true);
   }).catch(err=>notify(err?.message||"Discard failed.",true)).finally(()=>{busy=false});
   return;
  }
  const cell=e.target.closest("[data-v032-slot]");if(cell){
   const key=cell.dataset.v032Slot,worn=(me?.inventory||[]).find(it=>it.equippedSlot===key);
   if(!selected&&worn){selected=itemKey(worn);notify("Selected "+worn.name+". Choose UNEQUIP to remove it.");updateActions();draw();return}
   onSlot(key);return;
  }
  const item=e.target.closest("[data-v032-item]");if(item){
    selected=selected===item.dataset.v032Item?null:item.dataset.v032Item;modal.querySelectorAll(".v032-item").forEach(n=>n.classList.toggle("selected",n.dataset.v032Item===selected));
    notify(selected?"Selected "+(selectedItem(selected)?.name||"item")+". Choose EQUIP or drag to a valid slot.":"Selection cleared.");updateActions();
  }
 });
 modal.addEventListener("dragstart",e=>{
  const worn=e.target.closest("[data-v032-slot]");
  if(worn){
    const key=worn.dataset.v032Slot;
    const wornGear=(me?.inventory||[]).find(it=>it.equippedSlot===key);
    if(wornGear){e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain","unequip:"+key);return}
  }
  const item=e.target.closest("[data-v032-item]");if(!item)return;
  selected=item.dataset.v032Item;
  e.dataTransfer.effectAllowed="move";
  e.dataTransfer.setData("text/plain",selected);
 });
 modal.addEventListener("dragover",e=>{
  const bag=e.target.closest("#v032Bag");
  if(bag){if(e.dataTransfer.types.includes("text/plain"))e.preventDefault();return}
  const slot=e.target.closest("[data-v032-slot]");
  if(!slot)return;
  const item=selectedItem(selected);
  if(item&&validDrop(item,slot.dataset.v032Slot)){e.preventDefault();e.dataTransfer.dropEffect="move";slot.classList.add("v032-over")}
 });
 modal.addEventListener("dragleave",e=>{
  const cell=e.target.closest("[data-v032-slot]");if(cell&&!cell.contains(e.relatedTarget))cell.classList.remove("v032-over");
 });
 modal.addEventListener("drop",e=>{
  const bag=e.target.closest("#v032Bag");
  if(bag){
    const data=e.dataTransfer.getData("text/plain");
    if(data.startsWith("unequip:")){e.preventDefault();selected=null;onSlot(data.slice(8),null)}
    return;
  }
  const cell=e.target.closest("[data-v032-slot]");if(!cell)return;
  e.preventDefault();modal.querySelectorAll(".v032-over").forEach(n=>n.classList.remove("v032-over"));
  const key=e.dataTransfer.getData("text/plain")||selected;
  if(key.startsWith("unequip:"))return notify("Drop equipped items into the bag to remove them, or click an empty selection.",true);
  onSlot(cell.dataset.v032Slot,key);
 });
 document.addEventListener("keydown",e=>{
  if(!modal||modal.hidden)return;
  if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();close()}
  if(e.key==="Tab"){
   const focusable=Array.from(modal.querySelectorAll('button:not([disabled]),[tabindex="0"]')).filter(x=>x.getClientRects().length);
   if(!focusable.length)return;
   const ix=focusable.indexOf(document.activeElement);
   if(e.shiftKey&&ix<=0){e.preventDefault();focusable[focusable.length-1].focus()}
   else if(!e.shiftKey&&ix===focusable.length-1){e.preventDefault();focusable[0].focus()}
  }
 },true);
}
function open(){
 if(!modal)init();if(!modal||!me)return;
 previousFocus=document.activeElement;
 modal.hidden=false;document.body.classList.add("v032-dialog-open");
 openButton?.setAttribute("aria-expanded","true");draw();closeButton?.focus();
}
function close(){
 if(!modal||modal.hidden)return;modal.hidden=true;document.body.classList.remove("v032-dialog-open");
 openButton?.setAttribute("aria-expanded","false");
 if(previousFocus?.isConnected)previousFocus.focus();else openButton?.focus();
}
function toggle(){if(!modal)init();modal.hidden?open():close()}
const canChange=()=>["city","shop","victory","regionClear"].includes(room?.status);
const allowed=item=>!!item&&(!item.class||item.class===me?.classId)&&Number(me?.level||1)>=Number(item.level||1);
function updateActions(){
 if(!modal)return;
 const it=selectedItem(selected),actions=modal.querySelector("#v044Actions");
 if(!actions)return;
 actions.querySelector("#v044Selected").textContent=it?it.name+(it.class?" · "+it.class.toUpperCase():" · ANY CLASS"):"Select an item";
 const eq=actions.querySelector('[data-v044-action="equip"]'),un=actions.querySelector('[data-v044-action="unequip"]');
 eq.disabled=!it||!allowed(it)||!!it.equippedSlot||!canChange()||busy;
 un.disabled=!it||!it.equippedSlot||!canChange()||busy;
 if(it&&!allowed(it))actions.querySelector("#v044Selected").textContent+=" · NOT USABLE";
}
function onAction(action){
 const it=selectedItem(selected);if(!it)return notify("Select an item first.",true);
 if(action==="unequip"){if(!it.equippedSlot)return notify("This item is not equipped.",true);return onSlot(it.equippedSlot,null)}
 if(action==="equip"){
  if(!allowed(it))return notify("Cannot equip: incorrect class or insufficient level.",true);
  const type=displaySlot(it);
  const target=type==="ring_left"&&(me.inventory||[]).some(i=>i.equippedSlot==="ring_left")&&!(me.inventory||[]).some(i=>i.equippedSlot==="ring_right")?"ring_right":type;
  return onSlot(target,itemKey(it));
 }
}
function onSlot(slot,itemId=selected){
 if(!itemId){
  if(!["city","shop","victory","regionClear"].includes(room?.status))return notify("Gear can only be changed between battles.",true);
  const currentlyWorn=(me?.inventory||[]).some(it=>it.equippedSlot===slot)||(slot==="main"&&!!me?.weaponItem)||(slot==="chest"&&!!me?.armorItem);
  if(!currentlyWorn)return notify("This slot is already empty. Select a piece of gear to equip.",true);
  if(busy)return;
  busy=true;notify("Unequipping "+slot+"...");
  Promise.resolve(unequipAction?.(slot)).then(result=>{
   if(!result?.ok)notify(result?.error||"Unequip failed.",true);
   else notify("Equipment removed from "+slot+".");
  }).catch(err=>notify(err?.message||"Unequip failed.",true)).finally(()=>{busy=false});
  return;
 }
 const item=selectedItem(itemId);
 if(!item)return notify("This item is no longer in your inventory.",true);
 if(!validDrop(item,slot))return notify(item.name+" cannot be placed in "+slots.find(s=>s[0]===slot)?.[2]+".",true);
 if(!allowed(item))return notify("This item cannot be equipped by your class or level.",true);
 if(!["city","shop","victory","regionClear"].includes(room?.status))return notify("Gear can only be changed before or between battles.",true);
 if(busy)return;
 busy=true;notify("Equipping "+item.name+"...");
 Promise.resolve(equipAction?.(itemKey(item),slot)).then(result=>{
  if(!result?.ok)notify(result?.error||"Equipment change failed.",true);
  else{selected=null;notify(item.name+" equipped successfully.");}
 }).catch(e=>notify(e?.message||"Equipment change failed.",true)).finally(()=>{busy=false});
}
function slotMarkup(key,emoji,label,item,active){
 const name=item?.name||"EMPTY";
 return '<button type="button" draggable="'+(item?"true":"false")+'" class="v032-slot '+(item?"filled":"")+'" data-v032-slot="'+key+'" aria-label="'+esc(label+": "+name)+'">'+
 '<span class="v032-slot-icon">'+emoji+'</span><strong>'+esc(label)+'</strong><small title="'+esc(name)+'">'+esc(name)+'</small></button>';
}
function draw(){
 if(!modal||modal.hidden||!me)return;
 const inventory=Array.isArray(me.inventory)?me.inventory:[];
 const equipped={
  main:{name:me.weapon||"Training Sword"},
  chest:{name:me.armor||"Traveler Armor"}
 };
 for(const item of inventory)if(item.equippedSlot)equipped[item.equippedSlot]=item;
 const slotGrid=modal.querySelector("#v032Slots");
 slotGrid.innerHTML=slots.map(([key,emoji,label])=>slotMarkup(key,emoji,label,equipped[key],key==="main"||key==="chest")).join("");
 const art=modal.querySelector("#v032HeroArt");
 const cacheKey=[me.classId,me.gender,me.name,me.weapon,me.armor].join("|");
 if(art.dataset.heroKey!==cacheKey){
  art.dataset.heroKey=cacheKey;
  if(window.SoulboundSprite?.canDraw(me)){
   art.innerHTML=window.SoulboundSprite.spriteMarkup(me);
   window.SoulboundSprite.refresh();
  }else{
   const picture=window.SoulboundHeroArt?.render(me)||"";
   art.innerHTML='<img alt="Current hero" src="'+esc(picture)+'">';
  }
 }
 modal.querySelector("#v032HeroName").textContent=(me.name||"HERO").toUpperCase()+" · "+(me.className||me.classId||"");
 modal.querySelector("#v032HeroStats").textContent="LEVEL "+(me.level||1)+" · "+(me.className||me.classId||"");
 const stats=[["❤️ HP",me.hp,me.maxHp],["💠 MP",me.mp,me.maxMp],["⚔ ATK",me.atk],["🛡 DEF",me.def],["⚡ SPD",me.speed],["✦ LEVEL",me.level]];
 modal.querySelector("#v044StatsBar").innerHTML=stats.map(([label,value,max])=>'<div class="v044-stat-box"><small>'+label+'</small><strong>'+Number(value||0).toLocaleString()+(max!=null?' / '+Number(max||0).toLocaleString():'')+'</strong></div>').join("");
 modal.querySelector("#v032BagCount").textContent=inventory.filter(it=>!it.equippedSlot).length+" / 40 BAG SLOTS · "+(me.gold||0)+" GOLD";
 const bag=inventory.filter(it=>!it.equippedSlot);
 const safe=bag.slice(0,40).map((it,i)=>{
  const key=displaySlot(it),icon=it.icon||(key==="main"?"⚔":key==="chest"?"🛡":key.includes("ring")?"💍":key==="boots"?"🥾":"✦");
  const stats=["value","defense","maxHp","maxMp"].map((k,j)=>Number(it[k])>0?"+"+it[k]+" "+["ATK","DEF","HP","MP"][j]:"").filter(Boolean).join(" · ")||key.toUpperCase();
  const id=itemKey(it),rarity=["common","uncommon","rare","epic","legendary"].includes(it.rarity)?it.rarity:"common";
  const compatible=allowed(it);
  return '<button type="button" draggable="true" class="v032-item v044-bag-cell v034-rarity-'+rarity+' '+(compatible?"v044-compatible":"v044-incompatible")+' '+(id===selected?"selected":"")+'" data-v032-item="'+esc(id)+'" title="'+esc(it.name)+' · '+esc(stats)+'">'+
   '<span class="v032-item-icon">'+esc(icon)+'</span><strong>'+esc(it.name)+'</strong><small>'+esc(stats)+'</small><span class="v034-rarity-name">'+rarity.toUpperCase()+'</span>'+(it.class?'<em>'+esc(it.class.toUpperCase())+'</em>':'')+'</button>';
 });
 const empty=Array.from({length:Math.max(0,40-bag.length)},(_,i)=>'<div class="v044-empty-cell" aria-label="Empty inventory slot">+</div>');
 modal.querySelector("#v032Bag").innerHTML=[...safe,...empty].join("");
 updateActions();
 modal.querySelector("#v032EquipStatus").textContent="9 equipment slots · Bosses and mini-bosses can drop rare equipment. Select gear and press EQUIP / UNEQUIP.";
 if(!["city","shop","victory","regionClear"].includes(room?.status))notify("Viewing gear during battle · equipment changes are locked.",false);
 else if(!busy)notify("Click an item, then EQUIP (or drag to a matching slot). Select equipped gear to UNEQUIP.");
}
window.SoulboundV32={
 render(player,state,handler,unequip,discard){me=player||null;room=state||null;equipAction=handler;unequipAction=unequip;discardAction=discard;if(modal&&!modal.hidden)draw()},
 open,close,
 isOpen:()=>!!modal&&!modal.hidden
};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
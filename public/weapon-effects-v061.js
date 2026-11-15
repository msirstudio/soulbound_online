"use strict";
/* SOULBOUND 0.61: view-only combat feedback. Events originate from the server.
 * No damage math or save writes here; all effects are removable DOM children. */
(()=>{
 let lastId=0,roomKey="";
 const icons={physical:"⚔",fire:"🔥",ice:"❄",lightning:"⚡",earth:"🪨",void:"🌌",light:"✨",arcane:"🔮",water:"💧",nature:"🌿"};
 const valid=new Set(Object.keys(icons));
 function flash(event){
  const element=valid.has(event.element)?event.element:"physical";
  const candidates=[...document.querySelectorAll("#v563EnemyField [data-v563-target]")];
  const foe=candidates.find(node=>node.dataset.v563Target===event.enemyId);
  const anchor=foe&&!foe.hidden?foe:document.getElementById("v563MonsterSide");
  if(!anchor)return;
  anchor.classList.add("v061-fx-anchor");
  const text=document.createElement("span");text.className="v061-combat-fx v061-fx--"+element;
  const value=Number(event.amount)>0?" +"+Math.floor(event.amount):"";
  text.textContent=(icons[element]||"⚔")+" "+(event.kind==="hit"?element.toUpperCase():event.kind==="burn"?"BURN "+Math.floor(Number(event.amount)||0):event.kind==="chain"?"CHAIN"+value:String(event.label||"PASSIVE").slice(0,42)+value);
  text.setAttribute("aria-hidden","true");
  anchor.appendChild(text);
  setTimeout(()=>text.remove(),1000);
 }
 function onState(previous,state){
  if(!state)return;
  const key=String(state.code||"")+"|"+String(state.stage||0);
  const events=Array.isArray(state.weaponFx)?state.weaponFx:[];
  const latest=events.reduce((v,ev)=>Math.max(v,Number(ev.id)||0),0);
  if(!previous||key!==roomKey){
   roomKey=key;lastId=latest;return;
  }
  for(const ev of events){
   const id=Number(ev?.id)||0;
   if(id>lastId&&state.status==="battle")flash(ev);
  }
  lastId=Math.max(lastId,latest);
 }
 window.SoulboundWeaponFxV61={onState};
})();

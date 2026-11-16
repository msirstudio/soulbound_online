/* SOULBOUND v0.65 — Slot-first onboarding, retaining the existing battle/party/save engine.
   This module is presentation only. Game operations are wired from game.js. */
(()=>{
"use strict";
const $=id=>document.getElementById(id),lobby=$("lobby");
if(!lobby||!window.SoulboundCharacterSelectV064)return;
const guild=window.SoulboundCharacterSelectV064;
const screen=document.createElement("section");
screen.id="v065SlotScreen";screen.className="v065-slot-screen";screen.hidden=true;
screen.setAttribute("aria-labelledby","v065SlotTitle");
screen.innerHTML=`
 <div class="v065-slot-title"><div class="v065-eyebrow">✦ SOULBOUND · THE FORGOTTEN KINGDOM ✦</div>
   <h2 id="v065SlotTitle">CHOOSE YOUR SAVE SLOT</h2>
   <p>Select an existing adventure to continue, or choose an empty slot to create a new hero.</p>
 </div>
 <div class="v065-slots" id="v065SlotCards" aria-label="Save Slots"><p>Loading your three slots…</p></div>
 <div class="v065-slot-bottom">
  <label for="v065RoomCode">OPTIONAL: JOIN A FRIEND'S PARTY</label>
  <div class="v065-join-field"><input id="v065RoomCode" maxlength="5" autocomplete="off" spellcheck="false" placeholder="ROOM CODE (leave blank to create your own party)" aria-label="Five character room invite code"><span>MAX 4 PLAYERS</span></div>
  <div class="v065-status" id="v065Status" role="status" aria-live="polite">A new beginning awaits.</div>
 </div>`;
lobby.querySelector(".v041-lobby-grid").before(screen);
let slotData=null,busy=false,chosenSlot=null;
function setStatus(text,error=false){const e=$("v065Status");e.textContent=text;e.classList.toggle("error",!!error)}
function loading(on,message=""){
 busy=!!on;
 if(message)setStatus(message);
 screen.querySelectorAll("button").forEach(b=>b.disabled=busy);
 if(on)screen.classList.add("is-busy");else screen.classList.remove("is-busy");
}
function render(){
 if(!slotData){$("v065SlotCards").innerHTML='<p class="v065-loading">Loading your save slots…</p>';return}
 $("v065SlotCards").innerHTML=slotData.map((item,i)=>{
  const n=i+1,exists=!!item?.exists;
  const title=exists?escapeHtml(item.name||"Adventurer"):"EMPTY SLOT";
  const detail=exists?escapeHtml(String(item.className||"UNKNOWN").toUpperCase())+" · LV "+Number(item.level||1):"Create a new level 1 adventurer";
  const disabled=busy?' disabled':'';
  return '<div class="v065-slot-entry '+(exists?"occupied":"empty")+'">'+
   '<button type="button" class="v065-slot-card '+(exists?"occupied":"empty")+'" data-v065-slot="'+n+'"'+disabled+'>'+
   '<span class="v065-number">SLOT '+n+'</span><span class="v065-slot-icon">'+(exists?"⚔":"＋")+'</span>'+
   '<span class="v065-slot-information"><strong>'+title+'</strong><small>'+detail+'</small></span>'+
   '<span class="v065-slot-action">'+(exists?"CONTINUE →":"CREATE HERO →")+'</span></button>'+
   (exists?'<button type="button" class="v065-slot-delete" data-v065-delete="'+n+'" aria-label="Delete Slot '+n+' save" title="Permanently delete only Slot '+n+'"'+disabled+'>🗑 DELETE</button>':'')+
   '</div>';
 }).join("");
 screen.querySelectorAll("[data-v065-slot]").forEach(b=>b.addEventListener("click",()=>chooseSlot(Number(b.dataset.v065Slot))));
 screen.querySelectorAll("[data-v065-delete]").forEach(b=>b.addEventListener("click",event=>{
  event.stopPropagation();
  deleteSlot(Number(b.dataset.v065Delete));
 }));
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function getRoomCode(){return $("v065RoomCode").value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,5)}
function setSlots(list){slotData=list?.slice(0,3)||null;render()}
function showSlots(){
 screen.hidden=false;
 const stage=$("v064CharacterScene");if(stage)stage.hidden=true;
 const old=lobby.querySelector(".v041-lobby-grid");if(old)old.hidden=true;
 const strip=$("v064ReturnStrip");if(strip)strip.hidden=true;
 lobby.classList.remove("v064-scene-mode","v064-setup-mode");
 lobby.classList.add("v065-slots-mode");
 const bar=lobby.querySelector(".v041-view-bar span");if(bar)bar.textContent="02 / SAVE SLOTS";
 render();
}
function showGuild(){
 screen.hidden=true;lobby.classList.remove("v065-slots-mode");
 guild.showScene();
 const bar=lobby.querySelector(".v041-view-bar span");if(bar)bar.textContent="03 / CHOOSE A HERO";
}
async function chooseSlot(n){
 if(busy||!slotData||n<1||n>3)return;
 chosenSlot=n;loading(true,"Opening Slot "+n+"…");
 try{
  const choice=slotData[n-1];
  const api=window.SoulboundV065;
  if(!api?.onSlotSelected)throw Error("Save Slot system is not ready yet.");
  const ok=await api.onSlotSelected(n,!!choice?.exists);
  if(ok===false){setStatus("Could not open Slot "+n+". Check your connection.",true);showSlots()}
 }catch(e){setStatus(e.message||"Could not open slot.",true);showSlots()}
 finally{loading(false)}
}
async function deleteSlot(n){
 if(busy||!slotData?.[n-1]?.exists||n<1||n>3)return;
 const api=window.SoulboundV065;
 if(!api?.onSlotDelete){setStatus("Save deletion is not available yet.",true);return}
 loading(true,"Checking deletion for Slot "+n+"…");
 try{
  const result=await api.onSlotDelete(n);
  if(result?.ok){if(chosenSlot===n)chosenSlot=null;setStatus("Slot "+n+" deleted. Select the empty slot to create a new hero.")}
  else if(result?.cancelled)setStatus("Deletion cancelled. Slot "+n+" is unchanged.");
  else setStatus(result?.error||"Slot "+n+" could not be deleted. Your save is unchanged.",true);
 }catch(e){setStatus(e?.message||"Could not delete Slot "+n+".",true)}
 finally{loading(false);render()}
}
const api={setSlots,showSlots,showGuild,getRoomCode,setStatus,loading,getChosenSlot:()=>chosenSlot,onSlotSelected:null,onSlotDelete:null,onConfirmed:null};
window.SoulboundV065=api;
})();

/* SOULBOUND v0.64: asset-backed scene, character interactions, six-class modal.
   No additional gameplay document: existing save slots, sockets and navigation are preserved. */
(()=>{
"use strict";
const data=window.SoulboundCharactersV064;
const $=id=>document.getElementById(id);
const BASE="assets/character-select/";
if(!data||!$("lobby"))return;
const classic=$("lobby").querySelector(".v041-lobby-grid");
if(!classic)return;
let selectedId=null,focusedId=null,modalId=null,selectedClass=null,focusBefore=null,step="scene";
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
const stage=document.createElement("section");
stage.id="v064CharacterScene";stage.className="v064-character-scene";
stage.setAttribute("aria-label","Choose one of seven SOULBOUND characters");
stage.innerHTML=`
 <div class="v064-heading"><span>✦ SOULBOUND · THE FORGOTTEN KINGDOM ✦</span><h2>CHOOSE YOUR CHARACTER</h2><p>Seven lives. One shared adventure. Your chosen identity can follow any class.</p></div>
 <div class="v064-stage" id="v064SceneStage">
   <img class="v064-scene-art" id="v064SceneArt" src="${BASE}guild-hall.webp" alt="Seven beginning adventurers meeting at the guild's map table" draggable="false">
   <div class="v064-hotspots" id="v064Hotspots" role="group" aria-label="Choose a guild member"></div>
   <div class="v064-scene-hover" id="v064SceneHover" hidden></div>
 </div>
 <div class="v064-roster-head"><span>✦ THE SEVEN BEGINNERS</span><span>Hover or select a portrait to inspect a hero</span></div>
 <div class="v064-roster" id="v064Roster" role="group" aria-label="Character portraits"></div>
 <p class="v064-scene-caption">✧ All seven are unclassed. Choose a hero first; choose a combat class next.</p>
`;
classic.before(stage);
const returnStrip=document.createElement("div");
returnStrip.id="v064ReturnStrip";returnStrip.className="v064-return-strip";returnStrip.hidden=true;
returnStrip.innerHTML='<button id="v064BackToGuild" type="button">← RETURN TO THE GUILD</button><span id="v064SelectedSummary" aria-live="polite"></span>';
classic.before(returnStrip);
const dialog=document.createElement("div");
dialog.id="v064CharacterModal";dialog.hidden=true;dialog.className="v064-modal";
dialog.setAttribute("role","presentation");
dialog.innerHTML=`
 <div class="v064-backdrop" data-v064-dismiss="true"></div>
 <section class="v064-modal-card" role="dialog" aria-modal="true" aria-labelledby="v064ModalTitle" aria-describedby="v064ModalStory">
  <button id="v064ModalClose" class="v064-close" type="button" aria-label="Close character details">✕</button>
  <div class="v064-modal-art">
    <div class="v064-modal-art-top">✧ BEGINNER · UNCLASSED ✧</div>
    <img id="v064FullPortrait" alt="Selected character, shown in beginning adventurer clothing">
    <div class="v064-modal-portrait-label" id="v064PortraitLabel"></div>
  </div>
  <div class="v064-modal-content">
    <div class="v064-eyebrow">THE FORGOTTEN KINGDOM · HERO RECORD</div>
    <h2 id="v064ModalTitle"></h2>
    <div id="v064ModalRole" class="v064-modal-role"></div>
    <p id="v064ModalStory"></p>
    <div class="v064-hero-trait" id="v064HeroTrait"></div>
    <h3>CHOOSE A CLASS</h3>
    <p class="v064-explain">Any character can choose any class. Your appearance and identity stay the same.</p>
    <div class="v064-class-grid" id="v064ClassGrid" role="group" aria-label="Six classes"></div>
    <div class="v064-class-help" id="v064ClassHelp" aria-live="polite">Select a class to begin.</div>
    <div class="v064-modal-actions"><button id="v064ModalCancel" class="v064-secondary" type="button">BACK TO GUILD</button><button id="v064ModalConfirm" type="button" disabled>CONFIRM HERO & CLASS →</button></div>
  </div>
 </section>
`;
document.body.append(dialog);
for(const h of data.HEROES){
 const b=document.createElement("button");
 b.type="button";b.className="v064-hotspot";b.dataset.hero=h.id;b.setAttribute("aria-label","Select "+h.name+", "+h.role);
 for(const [k,v] of Object.entries(h.hotspot))if(k!=="shape")b.style[k==="x"?"left":k==="y"?"top":k==="w"?"width":"height"]=v+"%";
 b.style.setProperty("--v064-shape",h.hotspot.shape);b.style.setProperty("--v064-glow",h.hue);
 b.innerHTML='<span class="v064-hotspot-label">'+esc(h.name)+'</span>';
 $("v064Hotspots").append(b);
 const card=document.createElement("button");card.type="button";card.className="v064-roster-card";card.dataset.hero=h.id;card.setAttribute("aria-label","Select "+h.name);
 card.innerHTML='<span class="v064-roster-image"><img loading="lazy" src="'+BASE+esc(h.portrait)+'" alt="" onerror="this.style.display=\'none\'"><span class="v064-roster-fallback">'+esc(h.name[0])+'</span></span><b>'+esc(h.name)+'</b>';
 $("v064Roster").append(card);
 for(const el of [b,card]){
  el.addEventListener("mouseenter",()=>hover(h.id));
  el.addEventListener("focus",()=>hover(h.id));
  el.addEventListener("mouseleave",()=>hover(null));
  el.addEventListener("blur",()=>hover(null));
  el.addEventListener("click",()=>openModal(h.id));
 }
}
for(const klass of data.CLASS_META){
 const b=document.createElement("button");b.type="button";b.className="v064-class-choice";b.dataset.classId=klass.id;
 b.innerHTML='<span>'+klass.icon+'</span><strong>'+esc(klass.name)+'</strong><small>'+esc(klass.desc)+'</small>';
 b.addEventListener("click",()=>chooseClass(klass.id));
 $("v064ClassGrid").append(b);
}
function hover(id){
 focusedId=id;
 for(const e of document.querySelectorAll(".v064-hotspot,.v064-roster-card"))e.classList.toggle("v064-highlight",e.dataset.hero===id);
 const h=data.byId(id),hint=$("v064SceneHover");
 if(!h){hint.hidden=true;return}
 hint.textContent=h.name.toUpperCase()+" · "+h.role;hint.hidden=false;
 const x=Math.max(12,Math.min(88,h.hotspot.x+h.hotspot.w/2)),y=Math.min(85,h.hotspot.y+h.hotspot.h+1);
 hint.style.left=x+"%";hint.style.top=y+"%";
}
function showScene(){
 step="scene";stage.hidden=false;classic.hidden=true;returnStrip.hidden=true;
 $("lobby").classList.add("v064-scene-mode");$("lobby").classList.remove("v064-setup-mode");
}
function showSetup(){
 step="setup";stage.hidden=true;classic.hidden=false;returnStrip.hidden=false;
 $("lobby").classList.remove("v064-scene-mode");$("lobby").classList.add("v064-setup-mode");
 const h=data.byId(selectedId);const cls=data.CLASS_META.find(c=>c.id===selectedClass);
 $("v064SelectedSummary").textContent=h?(h.name+" · "+(cls?.name||"Choose class")):"";
}
function chooseClass(id){
 const meta=data.CLASS_META.find(c=>c.id===id);if(!meta)return;
 selectedClass=id;
 for(const el of $("v064ClassGrid").querySelectorAll("button")){const yes=el.dataset.classId===id;el.classList.toggle("selected",yes);el.setAttribute("aria-pressed",yes?"true":"false")}
 $("v064ClassHelp").textContent=meta.detail;
 $("v064ModalConfirm").disabled=false;
}
function openModal(id){
 const h=data.byId(id);if(!h)return;
 selectedId=h.id;modalId=h.id;selectedClass=null;
 focusBefore=document.activeElement;
 $("v064ModalTitle").textContent=h.name;
 $("v064ModalRole").textContent=h.role+" · "+(h.gender==="female"?"Female":"Male");
 $("v064ModalStory").textContent=h.story;
 $("v064HeroTrait").textContent=h.trait;
 $("v064PortraitLabel").textContent=h.name.toUpperCase();
 const img=$("v064FullPortrait");img.src=BASE+h.full;img.onerror=()=>{img.onerror=null;img.src=BASE+h.portrait};
 for(const el of $("v064ClassGrid").querySelectorAll("button")){el.classList.remove("selected");el.setAttribute("aria-pressed","false")}
 $("v064ModalConfirm").disabled=true;$("v064ClassHelp").textContent="Select one of the six classes.";
 dialog.hidden=false;document.body.classList.add("v064-modal-open");
 $("v064ModalClose").focus();
}
function closeModal(){
 dialog.hidden=true;modalId=null;document.body.classList.remove("v064-modal-open");
 focusBefore?.focus?.();
}
function confirmChoice(){
 const h=data.byId(modalId),cls=data.CLASS_META.find(x=>x.id===selectedClass);
 if(!h||!cls)return;
 selectedId=h.id;
 document.dispatchEvent(new CustomEvent("soulbound:v064-hero-selected",{detail:{characterId:h.id,gender:h.gender,name:h.name,classId:cls.id}}));
 closeModal();showSetup();
 $("v064BackToGuild").focus();
}
$("v064ModalConfirm").addEventListener("click",confirmChoice);
$("v064ModalClose").addEventListener("click",closeModal);
$("v064ModalCancel").addEventListener("click",closeModal);
dialog.addEventListener("click",e=>{if(e.target.closest("[data-v064-dismiss]"))closeModal()});
$("v064BackToGuild").addEventListener("click",showScene);
document.addEventListener("keydown",e=>{
 if(dialog.hidden)return;
 if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();closeModal()}
 if(e.key==="Tab"){
  const focusable=[...dialog.querySelectorAll('button:not([disabled])')].filter(el=>el.getClientRects().length);
  if(!focusable.length)return;
  if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable[focusable.length-1].focus()}
  else if(!e.shiftKey&&document.activeElement===focusable[focusable.length-1]){e.preventDefault();focusable[0].focus()}
 }
},true);
// Works with menu -> account -> lobby and subsequent Save Slot reloads.
function open(){closeModal();showScene()}
function setSelected(id){const h=data.byId(id);if(h)selectedId=h.id;return selectedId}
function getSelectedId(){return selectedId}
function selected(){return data.byId(selectedId)}
function classChosen(){return selectedClass}
window.SoulboundCharacterSelectV064={open,showScene,showSetup,setSelected,getSelectedId,selected,classChosen,openModal};
showScene();
})();

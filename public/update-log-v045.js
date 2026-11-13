/* SOULBOUND v0.45 — permanent in-game update log. Append new releases here. */
(()=>{
"use strict";
const entries=[
 {version:"0.54",date:"2026-11-14",title:"Full Combat Expansion",notes:[
  "All eight regions now have distinctive telegraphed elemental boss abilities and enemy AI, with single-target and party-wide attacks.",
  "Added transient Burn, Poison, Bleed, Weaken, Freeze and Stun effects, resolved on the server with turn-based durations.",
  "GUARD now protects the full party from the next enemy action; Tank GUARD and Aegis Pact grant stronger team defense.",
  "Only The Void Reaper (stage 35) and Eclipse Sovereign (stage 40) enter Phase 2 below 50% HP, changing abilities and increasing attack power.",
  "Added small in-battle indicators for enemy intentions, party statuses and Phase 2 without changing core HUD.",
  "No changes to save data format, rarity drop rates, rewards or the online party flow."
 ]},
 {version:"0.48.5",date:"2026-11-14",title:"Boss Reward Display Fix & Character Overview",notes:[
  "Fixed the main-boss reward overlay rendering into the hidden city panel instead of the visible region-clear arena.",
  "Boss victories now show Gold, EXP and all earned equipment; a no-drop message appears when no new equipment is earned.",
  "Equipment & Inventory now includes HP, MP and EXP meters, hero identity, class specialization, race rarity/passive and growth attributes.",
  "Equipping, unequipping, discarding, saved inventory and independent drop rates remain unchanged."
 ]},
 {version:"0.48.4",date:"2026-11-13",title:"Unified Audio, Mini-Boss Merchants & Log Layout",notes:[
  "Moved Music ON/OFF and SFX ON/OFF into the Audio popup, retaining independent volume sliders and sound test.",
  "The roadside Traveling Merchant appears only after defeating each region's mini-boss on local stage 4: global stages 4, 9, 14, 19, 24, 29, 34, and 39.",
  "Normal stages and main bosses no longer open the roadside merchant; capital weapon, armor, and supplies stores are unchanged.",
  "Expanded Battle Log's inner dark scroll area to fill its containing panel.",
  "Added prominent MINI BOSS and MAIN BOSS markers above monster sprites."
 ]},
 {version:"0.48.3",date:"2026-11-13",title:"Separate Roadside Merchant & Larger Log",notes:[
  "Removed the floating BAG button from the capital, leaving the existing Equipment & Bag button in the lower HUD.",
  "Added a distinct roadside traveling merchant available after stage victories, including a main-boss clear. It uses the battle backdrop, not the city.",
  "Closing the roadside merchant restores the completed stage and leaves level, equipment and progression unchanged.",
  "Capital merchants stay dedicated to weapon, armor, or potion and food sales.",
  "Expanded the inner Battle Log scroll area to fill the side panel for better readability."
 ]},
 {version:"0.48.2",date:"2026-11-13",title:"Main Menu Pixel-Art Cover",notes:[
  "Added the generated fantasy world illustration as the main menu hero background, with a subtle contrast overlay for readable logo and actions.",
  "The background only affects the home cover, not the city, battle arena, inventory or world map.",
  "The new WebP is loaded from assets/ui/title-cover.webp."
 ]},
 {version:"0.48.1",date:"2026-11-13",title:"Restore HUD, Fix Merchant Exit and Region Clear",notes:[
  "Restored the lower character HUD, stats, and battle controls in the city.",
  "Closing a city shop now simply closes the merchant without resetting hero HP/MP, stage, or progress.",
  "Removed the redundant Return to City button while already in the city.",
  "Clearing a region now stays on the completed battle screen until the party leader chooses World Atlas or Return to City."
 ]},
 {version:"0.48",date:"2026-11-13",title:"City HUD Cleanup & Boss Loot Balance",notes:[
  "Removed the duplicate lower battle HUD and command dock while in the city, without changing the in-battle HUD.",
  "Weapon and armor shops only show their respective category; supplies shop shows only potions and food.",
  "Each boss now has 2–4 curated possible drops and each mini-boss has 1–2; individual rarity drop chances and independent multi-drops are retained.",
  "Late-region bosses (6–8) drop Epic or Legendary items only. Previously owned equipment and save data remain valid."
 ]},
 {version:"0.47",date:"2026-11-13",title:"Interactive Capital & City Shops",notes:[
  "The Forgotten Capital now has a full pixel-art city backdrop with clickable locations.",
  "Potion and food supplies, weapons, and armor share the existing merchant inventory and gold system.",
  "Visit the central crystal to open the World Atlas and choose an adventure.",
  "The city panel is responsive and retains older buttons as accessible alternatives."
 ]},
 {version:"0.46",date:"2026-11-13",title:"Continental World Atlas",notes:[
  "Replaced the world atlas with an actual generated pixel-art continent (raster WebP) containing eight distinct geographic biomes.",
  "Repositioned the eight region selection pins over their landmarks and added a central safe-city pin.",
  "Added the actual arena background art to each region preview panel while preserving all travel and level requirements."
 ]},
 {version:"0.45",date:"2026-11-13",title:"Independent Loot & Update Log",notes:[
  "Boss and mini-boss gear now rolls independently per item; multiple different pieces may drop together.",
  "Rarity odds per item: Common 30–40%, Uncommon 20–30%, Rare 10–20%, Epic 6–10%, Legendary 1–5%.",
  "Boss/mini-boss drop lists and Index show the individual chance of each item.",
  "Inventory keeps its 40-slot bag capacity. The reward popup can display multiple items.",
  "Added this in-game Update Log and corrected the version number shown in the header and title menu."
 ]},
 {version:"0.44",date:"2026-11-13",title:"Collection, Inventory & Difficulty",notes:[
  "Added mini-boss equipment, rare drop lists, and an encyclopedia of playable races.",
  "Added green collection highlights, 40-cell inventory, direct EQUIP/UNEQUIP, and expanded stats.",
  "Scaled enemy HP and attack with party size; adjusted side-panel layout."
 ]},
 {version:"0.43",date:"2026-11-13",title:"Mini-boss Artwork",notes:[
  "Added normal and hit-state sprite assets for eight mini-bosses.",
  "Corrected boss illustration mapping and prepared region-themed scene imagery."
 ]},
 {version:"0.42",date:"2026-11-13",title:"HUD and Secondary Classes",notes:[
  "Changed secondary-class unlock requirement to Level 15.",
  "Moved PARTY, CHAT and LOG into a separate panel and relocated INDEX.",
  "Adjusted player positioning in battle scenes."
 ]}
];
const $=id=>document.getElementById(id);
let lastFocus=null;
function init(){
 const button=$("v045ChangelogOpen");
 if(!button||$("v045Changelog"))return;
 const backdrop=document.createElement("div");
 backdrop.id="v045Changelog";backdrop.className="v045-changelog";backdrop.hidden=true;
 backdrop.innerHTML='<div class="v045-backdrop" data-v045-dismiss></div>'+
 '<section class="v045-dialog" role="dialog" aria-modal="true" aria-labelledby="v045Title" tabindex="-1">'+
 '<header><div><small>✦ SOULBOUND · RELEASE HISTORY</small><h2 id="v045Title">📜 UPDATE LOG</h2></div>'+
 '<button type="button" id="v045ChangelogClose" aria-label="Close update log">✕ CLOSE</button></header>'+
 '<div id="v045Releases" class="v045-releases"></div>'+
 '<footer>Every new update should be appended to the top of this log. Changes listed are release notes, not a guarantee of live deployment.</footer></section>';
 document.body.appendChild(backdrop);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 $("v045Releases").innerHTML=entries.map((entry,i)=>'<article class="v045-release">'+
 '<div class="v045-release-head"><strong>v'+esc(entry.version)+' · '+esc(entry.title)+'</strong><time>'+esc(entry.date)+'</time>'+(i===0?'<b>NEW</b>':'')+'</div>'+
 '<ul>'+entry.notes.map(note=>'<li>'+esc(note)+'</li>').join("")+'</ul></article>').join("");
 function close(){if(backdrop.hidden)return;backdrop.hidden=true;document.body.classList.remove("v045-log-open");(lastFocus?.isConnected?lastFocus:button)?.focus()}
 button.addEventListener("click",()=>{lastFocus=document.activeElement;backdrop.hidden=false;document.body.classList.add("v045-log-open");$("v045ChangelogClose").focus()});
 backdrop.addEventListener("click",e=>{if(e.target.closest("#v045ChangelogClose,[data-v045-dismiss]"))close()});
 document.addEventListener("keydown",e=>{
  if(backdrop.hidden)return;
  if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();close()}
  if(e.key==="Tab"){const els=[...backdrop.querySelectorAll('button:not([disabled]),a[href]')];if(!els.length)return;const i=els.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();els.at(-1).focus()}else if(!e.shiftKey&&i===els.length-1){e.preventDefault();els[0].focus()}}
 },true);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();

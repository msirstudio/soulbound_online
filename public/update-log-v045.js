/* SOULBOUND v0.45 — permanent in-game update log. Append new releases here. */
(()=>{
"use strict";
const entries=[
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

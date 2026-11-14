/* SOULBOUND v0.45 — permanent in-game update log. Append new releases here. */
(()=>{
"use strict";
const entries=[
 {version:"0.59",date:"2026-11-15",title:"Multiplayer Stability — Reconnect and Safe Turns",notes:[
  "A disconnect reserves a hero's room and exact turn state for 120 seconds rather than immediately deleting the player.",
  "Reconnecting requires a private, rotating 256-bit token; signed-in players also reverify their Supabase session in Secure Save mode.",
  "A disconnected member pauses the encounter and enemy counterattacks until that member returns or the reconnect window expires.",
  "Combat action IDs are server-deduplicated, preventing one repeated action request from striking or consuming MP twice.",
  "Winning an encounter is guarded by a unique encounter ID to prevent repeat EXP/Gold/loot grants in the same running room.",
  "The browser remembers the room ticket in sessionStorage and attempts to resume on socket reconnect and page reload.",
  "Important: reconnection and action receipts are stored in the running Node process. Render restarts, multiple server instances, and distributed persistence still need additional work."
 ]},
 {version:"0.58",date:"2026-11-14",title:"Unified Combat Core — Formula Parity Refactor",notes:[
  "All main damage calculations now use shared pure combat formulas for player attack, skills, BREAK, area splash and enemy hits.",
  "Skill MP costs, unlock levels, cooldowns, class names and area-of-effect flags are centralized in a canonical skill catalog.",
  "Original 0.57 rounding, element modifiers, DEF/Guard, boss HP/ATK and party AoE ratios are deliberately preserved; this is a stability refactor, not another difficulty adjustment.",
  "Added automated old-vs-new formula parity checks across all eight regions, classes, element modifiers, high DEF and party scenarios.",
  "Server-authoritative Secure Save 0.57 remains enabled only after SQL and Render server secrets are configured.",
  "Status effect execution, enemy AI and full combat event logs are scheduled for a later extraction. Test the combat UI and multiplayer before publishing."
 ]},
 {version:"0.57",date:"2026-11-14",title:"Secure Save Backend & Two-Digit Versions",notes:[
  "Signed-in hero saves use a server-controlled table with revision checks after Secure Save mode is activated on Render.",
  "Server verifies Supabase login tokens and restores server-owned Level, ATK, DEF, Gold, equipment and world progress rather than trusting the browser.",
  "New Game, Delete, and Save Slots 1–3 use authenticated backend routes in Secure Save mode; Guest mode remains local-only.",
  "The visible version is now two digits (0.57), while internal npm package semver stays 0.57.0.",
  "This upgrade requires a SQL migration and server-only Supabase secrets; without those, legacy mode is still insecure.",
  "Old Supabase tables stay untouched for rollback; browser export/backups remain available."
 ]},
 {version:"0.56.4",date:"2026-11-14",title:"System Foundation — Safer Saves & Versioning",notes:[
  "Added EXPORT HERO and LAST BACKUP buttons to the three character save slots. JSON downloads are user-controlled and exclude account credentials.",
  "Before deleting or replacing an existing hero, save an emergency backup in browser storage; if storage is full, cancel the destructive action.",
  "NEW GAME now resets its cached world progress only after the fresh save succeeds instead of before the cloud request.",
  "Health/API version numbers derive from package.json; title and hero-screen version labels stay synchronized.",
  "Added a read-only foundation audit and regression checks. No changes to combat balance, server trust model, save database schema or multiplayer flow.",
  "Important: a JSON export cannot yet be imported in-game. Account verification, revision-safe saves and full recovery will be addressed in the next phase."
 ]},
 {version:"0.56.3",date:"2026-11-14",title:"Full Combat Rebalance & Visible Enemy Packs",notes:[
  "Every monster in a group now appears as a large, selectable creature on the actual battlefield instead of only as tiny HP buttons.",
  "Mage METEOR/FROST NOVA/TIDAL SURGE and Swordsman WHIRLWIND attack all living enemies; players do not need to select targets for area spells.",
  "Diminishing-return DEF mitigation keeps defensive builds valuable without negating boss damage.",
  "HP and attack growth have been retuned for every region, including normal monsters, mini bosses and main bosses.",
  "Existing saves, loot probabilities, class unlocks, audio and party networking remain unchanged."
 ]},
 {version:"0.56.2",date:"2026-11-14",title:"Hardcore Packs & Boss Rebalance",notes:[
  "Normal stages 1–3 of all eight regions now field 1–2 random enemies for solo heroes, plus exactly one foe per additional party member.",
  "Each enemy is individually targetable with its own HP, status and attack turn. Defeat the entire pack for one encounter victory.",
  "Boss ATK is raised substantially so guarding, healing, status removal and coordinated party attacks matter; mini-bosses are also stronger.",
  "Enemy attacks resolve in readable timed sequence rather than all at once.",
  "Normal encounters grant a modest pack reward bonus, with no extra boss loot rolls or changes to player saves.",
  "Party rooms still allow up to four players; one enemy is added for each extra player on normal stages."
 ]},
 {version:"0.56.1",date:"2026-11-14",title:"Three Hero Save Slots & Regional Soundtrack",notes:[
  "Three selectable character slots; Slot 1 preserves the existing hero while Slots 2 and 3 can have different classes, stats, equipment and boss progress.",
  "Install SUPABASE-SAVE-SLOTS-V0561.sql for account cloud saves in Slots 2 and 3; until then these slots are backed up in the current browser.",
  "Select a slot, Continue or start a New Game in that slot; delete asks for confirmation and targets only the selected slot.",
  "Original procedural background scores for Central City and all 8 regions: relaxed city theme and an epic final Eclipse theme.",
  "Audio joins the Equipment toolbar rather than using its own empty strip.",
  "Combat, enemy AI, damage, loot drop percentages and save table profiles remain unchanged."
 ]},
 {version:"0.56.0",date:"2026-11-14",title:"Combat Pacing & Visible Hit Reactions",notes:[
  "Enemy counterattacks now occur after a 760ms server-controlled pause rather than simultaneously with player actions.",
  "New enemy lunge and hero hit presentation makes each exchange easier to read. The Swordsman and Mage use their separate hit PNGs when available.",
  "Combat commands are temporarily locked during the enemy response, preventing overlapping turns in online parties.",
  "The game's global displayed version, package version and API health/version responses now agree.",
  "Boss special attack telegraphs and earlier audio/viewport improvements remain in place.",
  "No changes to saved characters, equipment, Gold, EXP, combat damage formulas or reward rates."
 ]},
 {version:"0.55.2",date:"2026-11-14",title:"Elemental Rules — Water, Lightning & Clear Matchups",notes:[
  "The game now has 10 damage types: Physical plus nine elements (including new Water and Lightning).",
  "The Adventure INDEX shows a single consistent elemental matchup table: strong ×1.20, resisted/same type ×0.80, neutral/Physical ×1.00.",
  "Light and Void have a clearly labeled mutual weakness. Boss exceptions add weaknesses or resistance only to otherwise neutral matchups.",
  "The Dreadforge Champion gains a special Ice weakness; the Briarfang Alpha resists Void through its ancient roots.",
  "Mage gains Tidal Surge (Water, LV 7) and Thunderbolt (Lightning, LV 9), both calculated on the server using the actual chart.",
  "Bosses in Cursed Wilds and Dreadforge can use Water and Lightning attacks, respectively, which are documented in INDEX.",
  "No save migration, loot rate, Gold, progression or party structure changes."
 ]},
 {version:"0.55.1",date:"2026-11-14",title:"Adventure INDEX & Status UI Fix",notes:[
  "Fixed stale INDEX scripts by loading a new versioned Index file; new ELEMENTS, STATUS and COMBAT RULES tabs now appear from live Codex data.",
  "Boss and monster entries display their element, weak/resist affinities and actual move names immediately above their artwork. Full attack effect chances stay visible below.",
  "Replaced long combat status labels with small clickable icons and tooltips. Clicking a status opens INDEX → STATUS; enemy Chill and Weaken are documented too.",
  "Reduced MAIN BOSS / MINI BOSS labels to lightweight text without large colored frames.",
  "Kept saves, drops, Hardcore balance, party combat and all progression rules unchanged."
 ]},
 {version:"0.55",date:"2026-11-14",title:"Hardcore Combat & Adventure Codex",notes:[
  "Elemental strengths and weaknesses are now calculated by the server, with status resistance, capped damage-over-time and anti-control immunity windows.",
  "Added persistent Stagger, BREAK STRIKE, interrupt windows, Perfect Guard, adaptive boss AI and party CLEANSE.",
  "Punishing Hardcore: one-time 8% Gold loss per hero on party defeat (capped at 2000); consumed items stay consumed; no loss of EXP or equipment.",
  "The Adventure INDEX now includes ELEMENTS, STATUS and COMBAT RULES. Every enemy describes attacks, elements, weaknesses, resistance and effect chances.",
  "Rejected actions no longer trigger unwanted status ticks. Shield Breaker defense boosts no longer permanently alter base DEF.",
  "Only Stage 35 and 40 main bosses have Phase 2. Old saves, equipment, shops and loot rates remain intact."
 ]},
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

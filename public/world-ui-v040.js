/* SOULBOUND v0.40 — Central City, clickable world atlas and region preview.
   Uses server-supplied map definitions and authoritative travel validation. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
let latest=null,player=null,leader=false,actions=null,selected=0,open=false,installed=false;
// Atlas pin coordinates match the 1024×656 continental map illustration.
const positions=[[21,54],[49,81],[75,77],[21,80],[39,22],[16,29],[84,44],[79,22]];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function install(){
 if(installed||!$("arena")||!$("game"))return;
 installed=true;
 const city=document.createElement("section");city.id="v040City";city.className="v040-city";city.hidden=true;
 city.innerHTML='<div class="v040-town-scene" aria-hidden="true"><span>♜</span><span>⌂</span><span>♜</span><span>⌂</span><span>♜</span></div>'+
 '<div class="v040-city-inner"><p class="v040-kicker">✦ SOULBOUND · CENTRAL CITY ✦</p><h2 id="v040CityHeading">THE FORGOTTEN CAPITAL</h2>'+
 '<p id="v040CityText">Rest at the town, prepare your party, and choose a region to explore.</p>'+
 '<div class="v040-city-actions"><button id="v040WorldOpen" class="gold" type="button">🗺 WORLD MAP · เลือกแมพ</button>'+
 '<button id="v040Merchant" type="button">🏪 MERCHANT</button><button id="v040Bag" type="button">⚔ EQUIPMENT & BAG</button>'+
 '<button id="v040BackCity" type="button" hidden>🏰 BACK TO CITY</button></div>'+
 '<small id="v040PartyNote">Party leader selects a region. Each member keeps personal rewards.</small></div>';
 $("arena").before(city);
 const dock=document.querySelector("#game .stage-actions");
 if(dock){
  const b=document.createElement("button");b.id="v040QuickCity";b.type="button";b.className="secondary";b.textContent="🏰 CITY / WORLD";dock.appendChild(b);
  b.onclick=()=>{if(latest?.status==="city")show();else if(["victory","regionClear","defeat","shop"].includes(latest?.status)){if(confirm("Return the party to the city? This will end the current dungeon run."))actions?.returnCity()}else show()};
 }
 const overlay=document.createElement("div");overlay.id="v040WorldOverlay";overlay.className="v040-overlay";overlay.hidden=true;
 overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","World Map");
 overlay.innerHTML='<div class="v040-atlas"><header class="v040-atlas-head"><div><small>SOULBOUND · A NEW WORLD</small><h2>🗺 WORLD ATLAS</h2></div><button id="v040WorldClose" type="button" aria-label="Close world map">✕</button></header>'+
 '<div class="v040-atlas-grid"><div class="v040-map-canvas" id="v040MapCanvas"><img class="v040-land v046-world-art" src="assets/world/forgotten-kingdom-v046.svg" alt="" aria-hidden="true"><div class="v040-map-pins" id="v040MapPins"></div></div>'+
 '<section class="v040-map-detail" id="v040MapDetail" aria-live="polite"></section></div>'+
 '<footer class="v040-atlas-foot">Select a map pin to inspect the area. The leader may start a run if every party member meets the minimum level.</footer></div>';
 document.body.appendChild(overlay);
 $("v040WorldOpen").onclick=show;$("v040Merchant").onclick=()=>actions?.openShop();
 $("v040Bag").onclick=()=> $("toggleEquipment")?.click();
 $("v040BackCity").onclick=()=>actions?.returnCity();
 $("v040WorldClose").onclick=hide;
 overlay.addEventListener("click",e=>{if(e.target===overlay)hide()});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&open)hide()});
}
function maps(){return latest?.regions||[]}
function show(){install();if(!latest)return;open=true;$("v040WorldOverlay").hidden=false;drawAtlas();$("v040WorldClose").focus()}
function hide(){if(!installed)return;open=false;$("v040WorldOverlay").hidden=true}
function progress(r){return Number(player?.worldProgress?.bossDefeats?.[r.id]||0)}
function levelAccess(r){return !!player&&Number(player.level)>=r.requiredLevel}
function partyAccess(r){return !!latest?.players?.length&&latest.players.every(p=>Number(p.level)>=r.requiredLevel)}
function drawAtlas(){
 if(!open)return;
 const regs=maps(),pins=$("v040MapPins");if(!pins)return;
 pins.innerHTML='<button type="button" id="v046CityPin" class="v040-pin v046-city-pin" style="left:51%;top:54%" title="Central Safe City · Lobby" aria-label="Central City — safe hub, return to your party">🏰</button>'+regs.map((r,i)=>'<button type="button" class="v040-pin '+(i===selected?"selected ":"")+(levelAccess(r)?"":"locked")+'" data-v040-region="'+i+'" style="left:'+positions[i][0]+'%;top:'+positions[i][1]+'%" title="'+esc(r.name)+'" aria-label="View '+esc(r.name)+'"><span>'+r.icon+'</span><b>'+(i+1)+'</b></button>').join("");
 pins.querySelectorAll("button[data-v040-region]").forEach(b=>b.onclick=()=>{selected=Number(b.dataset.v040Region);drawAtlas()});
 const cityPin=$("v046CityPin");
 if(cityPin)cityPin.onclick=()=>{ // The hub already exists: leave world view and return to the central city panel.
  if(latest?.status==="city")hide();
  else if(["regionClear","defeat"].includes(latest?.status)&&leader){actions?.returnCity?.();hide()}
  else hide();
 };
 drawDetail();
}
function drawDetail(){
 const r=maps()[selected];if(!r)return;
 const self=levelAccess(r),all=partyAccess(r),clears=progress(r);
 const canTravel=leader&&all&&["city","regionClear","defeat"].includes(latest.status);
 const node=$("v040MapDetail");
 const pad=(selected+1).toString().padStart(2,"0");
 const mini=(r.miniName||"Unknown").toUpperCase();
 node.innerHTML='<div class="v040-region-art v040-region-'+esc(r.css)+'" data-v040-theme="'+esc(r.id)+'">'+
 '<div class="v040-art-cloud">✦ · ✧ · ✦</div><div class="v040-art-landmark">'+r.icon+'</div>'+
 '<div class="v040-art-ridges"><i></i><i></i><i></i><i></i></div></div>'+
 '<div class="v040-region-info"><small>REGION '+pad+' / 08</small><h3>'+esc(r.name)+'</h3>'+
 '<p>'+esc(r.thaiName)+' · '+esc(r.hint)+'</p>'+
 '<div class="v040-stats"><span>RECOMMENDED <b>LV '+r.recommendedMin+'–'+r.recommendedMax+'</b></span>'+
 '<span>ENTRY MINIMUM <b>LV '+r.requiredLevel+'</b></span>'+
 '<span>STAGES <b>'+r.firstStage+'–'+r.bossStage+'</b></span>'+
 '<span>BOSS DEFEATS <b>'+clears+'</b></span></div>'+
 '<div class="v040-foe">💀 MINI BOSS: '+esc(mini)+'</div><div class="v040-foe">👑 MAIN BOSS: '+esc(r.bossName)+'</div>'+
 '<p class="v040-gate">'+(!self?"🔒 Need LV "+r.requiredLevel+" to enter.":!all?"⚠ Another party member needs LV "+r.requiredLevel+".":clears?"✓ Previously cleared · Repeatable boss farming":"✓ Accessible · Boss loot can be farmed on every victory")+'</p>'+
 '<button type="button" id="v040Travel" class="gold" '+(canTravel?"":"disabled")+'>'+(clears?"↻ REPLAY THIS MAP":"⚔ ENTER REGION")+'</button>'+
 (!leader?'<small>Only the party leader can start travel.</small>':!["city","regionClear","defeat"].includes(latest.status)?'<small>Return to the city after battle to travel.</small>':'')+
 '</div>';
 $("v040Travel").onclick=async()=>{if(!actions||!canTravel)return;const b=$("v040Travel");b.disabled=true;b.textContent="TRAVELING...";const out=await actions.travel(r.index);if(!out?.ok){alert(out?.error||"Travel unavailable.");drawDetail()}else hide()};
}
function render(s,me,isLeader,handlers){
 latest=s;player=me;leader=!!isLeader;actions=handlers;install();
 if(!installed)return;
 const cityLike=["city","regionClear","defeat","shop"].includes(s.status);
 $("v040City").hidden=!cityLike;
 $("arena").hidden=cityLike;
 $("game").classList.toggle("v040-hub",cityLike);
 $("v040QuickCity").hidden=s.status==="battle";
 $("v040QuickCity").disabled=!leader;
 const header=$("v040CityHeading"),txt=$("v040CityText");
 if(s.status==="regionClear"){header.textContent="REGION CLEARED ✦";txt.textContent="The main boss is defeated. Your clear and loot are saved. Replay the map or visit another region."}
 else if(s.status==="defeat"){header.textContent="THE PARTY HAS FALLEN";txt.textContent="Your hero keeps level, gold and equipment. Return to the city, then retry the dungeon."}
 else if(s.status==="shop"){header.textContent="MERCHANT DISTRICT";txt.textContent="Supplies, equipment and food for the next adventure."}
 else {header.textContent="THE FORGOTTEN CAPITAL";txt.textContent="Gather the party, prepare your hero, and inspect the world map before departing."}
 $("v040PartyNote").textContent="Party · "+s.players.map(p=>p.name+" (LV "+p.level+")").join(" · ")+(leader?" · You are leader":" · Leader chooses the region");
 $("v040Merchant").hidden=s.status!=="city"&&s.status!=="regionClear";
 $("v040Merchant").disabled=!leader;
 $("v040BackCity").hidden=s.status==="city";
 $("v040BackCity").disabled=!leader;
 $("v040WorldOpen").disabled=s.status==="shop"||!["city","regionClear","defeat"].includes(s.status);
 if(open)drawAtlas();
}
window.SoulboundWorldV40={render,show,hide};
})();
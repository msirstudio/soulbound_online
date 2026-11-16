/* SOULBOUND v0.68 · Ancient Forge: direct Central City blacksmith + portal. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const bridge=()=>window.SoulboundForgeBridgeV068;
const V=()=>room?.forgeConfig||{};
let room=null,me=null,self=null,tab="forge",selected=null,busy=false,panel=null,lastMessage="",lastError=false;
const icons={basic:"🔹",refined:"💠",ancient:"💎"};
const safe=()=>room?.status==="city"&&!!me;
function install(){
 if(panel)return;
 panel=document.createElement("section");panel.id="v068Overlay";panel.className="v068-overlay";panel.hidden=true;
 panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-label","The Ancient Forge and Portal");
 panel.innerHTML=[
 '<div class="v068-window"><header class="v068-head"><div><small>SOULBOUND · THE FORGOTTEN CAPITAL</small><h2>⚒ THE ANCIENT FORGE</h2></div><button id="v068Close" type="button" aria-label="Close blacksmith">✕</button></header>',
 '<nav class="v068-tabs" aria-label="Forge services"><button id="v068ForgeTab" type="button">⚒ BLACKSMITH</button><button id="v068PortalTab" type="button">✦ ANCIENT PORTAL</button></nav>',
 '<div id="v068ForgeView"><div class="v068-stock" id="v068Stock"></div>',
 '<div class="v068-workbench"><section class="v068-gear-list"><h3>YOUR EQUIPMENT</h3><div id="v068GearList"></div></section>',
 '<section class="v068-upgrade"><div class="v068-anvil" id="v068Anvil"><div class="v068-ring"></div><span id="v068AnvilIcon">⚔️</span><div class="v068-sparks" aria-hidden="true">✦ ✧ ✦ ✧ ✦</div></div>',
 '<h3 id="v068GearName">SELECT A WEAPON OR ARMOR</h3><div id="v068ForgeDetails" class="v068-details"></div>',
 '<button id="v068Enhance" type="button" class="v068-gold">⚒ START ENHANCEMENT</button></section></div>',
 '<footer class="v068-merchant"><div><strong>🔹 ENHANCEMENT STONE</strong><small>Buy starter stones for 150 Gold each. Refined / Ancient stones drop from bosses.</small></div>',
 '<select id="v068BuyCount" aria-label="Number of stones"><option value="1">×1</option><option value="5">×5</option><option value="10">×10</option></select><button id="v068Buy" type="button">BUY STONES</button></footer></div>',
 '<div id="v068PortalView" hidden><p class="v068-portal-intro">Challenge optional Ancient Guardians for rare forging materials. The main 40-stage story remains unchanged. All party members must meet the story-clear requirement.</p><div id="v068Guardians" class="v068-guardians"></div></div>',
 '<div id="v068Result" role="status" aria-live="polite" class="v068-result"></div>',
 '<footer class="v068-bottom"><span>✦ No item breaks · Failed attempts keep your level</span><button id="v068Done" type="button">CLOSE</button></footer></div>'
 ].join("");
 document.body.appendChild(panel);
 $("v068Close").onclick=close;$("v068Done").onclick=close;
 $("v068ForgeTab").onclick=()=>{tab="forge";draw()};
 $("v068PortalTab").onclick=()=>{tab="portal";draw()};
 panel.addEventListener("click",e=>{if(e.target===panel)close()});
 panel.addEventListener("click",e=>{
  const gear=e.target.closest("[data-v068-uid]");
  if(gear&&!busy){selected=gear.dataset.v068Uid;lastMessage="";draw()}
  const guardian=e.target.closest("[data-v068-guardian]");
  if(guardian&&!busy)startGuardian(guardian.dataset.v068Guardian);
 });
 $("v068Enhance").onclick=enhance;
 $("v068Buy").onclick=buy;
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden&&!busy)close()});
}
function show(mode="forge"){
 install();if(!safe())return;
 tab=mode==="portal"?"portal":"forge";panel.hidden=false;lastMessage="";draw();
 panel.querySelector(tab==="forge"?"#v068Enhance":"#v068PortalTab")?.focus();
}
function close(){if(!panel||busy)return;panel.hidden=true}
function stock(){
 const stones=V().stones||{};
 $("v068Stock").innerHTML=Object.entries(stones).map(([id,stone])=>
  '<div class="v068-stone"><span>'+esc(stone.icon||icons[id])+'</span><div><strong>'+esc(stone.name)+'</strong><small>'+Number(me?.materials?.[id]||0)+' OWNED</small></div></div>').join("")+
  '<div class="v068-gold-stock"><span>🪙</span><strong>'+Math.max(0,Number(me?.gold)||0).toLocaleString()+' Gold</strong></div>';
}
function equipment(){
 const owned=(me?.inventory||[]).filter(it=>it.uid&&["weapon","armor","main","chest","head","pants","boots","offhand","neck","ring_left","ring_right"].includes(it.slot));
 if(selected&&!owned.some(it=>it.uid===selected))selected=null;
 if(!selected&&owned.length)selected=owned[0].uid;
 $("v068GearList").innerHTML=owned.length?owned.map(it=>{
  const level=Math.min(10,Math.max(0,Number(it.enhanceLevel)||0));
  return '<button type="button" class="v068-gear '+(selected===it.uid?"is-selected":"")+'" data-v068-uid="'+esc(it.uid)+'"><span>'+esc(it.icon||"⚔")+'</span><span><strong>'+esc(it.name)+' <b>+'+level+'</b></strong><small>'+esc(String(it.rarity||"equipment").toUpperCase())+(it.equippedSlot?" · EQUIPPED":"")+'</small></span></button>';
 }).join(""):'<p class="v068-empty">No equipment to enhance. Buy or find a weapon/armor first.</p>';
 const it=owned.find(x=>x.uid===selected),level=Math.min(10,Math.max(0,Number(it?.enhanceLevel)||0));
 const req=V().success&&level<10?{to:level+1,rate:V().success[level],gold:V().gold[level],stone:level<3?"basic":level<7?"refined":"ancient",count:V().count[level],bonus:V().bonus[level+1]}:null;
 $("v068GearName").textContent=it?it.name+" +"+level:"SELECT EQUIPMENT";
 $("v068AnvilIcon").textContent=it?.icon||"⚔";
 if(!req){$("v068ForgeDetails").innerHTML=it?'<div class="v068-max">✦ MAXIMUM ENHANCEMENT +10 ✦</div>':'<p>Choose an owned item to begin.</p>';}
 else{
  const have=Number(me?.materials?.[req.stone]||0);
  $("v068ForgeDetails").innerHTML=
   '<div><span>ATTEMPT</span><strong>+'+level+' → +'+req.to+'</strong></div>'+
   '<div><span>SUCCESS RATE</span><strong class="v068-rate">'+req.rate+'%</strong></div>'+
   '<div><span>STONE</span><strong>'+(icons[req.stone]||"💎")+' '+esc(V().stones?.[req.stone]?.name||req.stone)+' ×'+req.count+' <small>('+have+' owned)</small></strong></div>'+
   '<div><span>GOLD COST</span><strong>🪙 '+req.gold.toLocaleString()+'</strong></div>'+
   '<div><span>ENHANCEMENT BONUS</span><strong>+'+req.bonus+'% base stats</strong></div>';
 }
 $("v068Enhance").disabled=busy||!it||!req||Number(me?.gold||0)<(req?.gold||0)||Number(me?.materials?.[req?.stone]||0)<(req?.count||0)||!safe();
 $("v068Buy").disabled=busy||!safe()||Number(me?.gold||0)<Number($("v068BuyCount").value)*150;
 if(it)$("v068Anvil").classList.toggle("v068-high",level>=7);
 return it;
}
function portals(){
 const list=room?.guardians||[];
 const isLeader=room?.players?.[0]?.id===self;
 $("v068Guardians").innerHTML=list.map(b=>{
  const ready=(room.players||[]).every(p=>Number(p.worldProgress?.bossDefeats?.[b.id==="gorthan"?"dreadforge_bastion":"hollow_sanctum"]||0)>0);
  return '<article class="v068-guardian"><img src="assets/guardians/'+esc(b.sprite)+'.svg" alt="'+esc(b.name)+'" loading="lazy"><div><small>ANCIENT GUARDIAN · UNLOCK AFTER STAGE '+b.unlockStage+'</small><h3>'+esc(b.name)+'</h3><p>'+esc(b.hint)+'</p><p>'+(ready?"✓ THE PARTY IS READY":"🔒 All party members must clear Stage "+b.unlockStage)+'</p><button type="button" data-v068-guardian="'+esc(b.id)+'" '+(!ready||!isLeader||busy||!safe()?"disabled":"")+'>⚔ CHALLENGE GUARDIAN</button></div></article>';
 }).join("");
}
function message(text,error=false){lastMessage=text;lastError=error;const node=$("v068Result");node.textContent=text;node.classList.toggle("error",error)}
function draw(){
 if(!panel||panel.hidden)return;
 if(!safe()&&!busy){panel.hidden=true;return}
 $("v068ForgeTab").classList.toggle("active",tab==="forge");
 $("v068PortalTab").classList.toggle("active",tab==="portal");
 $("v068ForgeView").hidden=tab!=="forge";$("v068PortalView").hidden=tab!=="portal";
 stock();if(tab==="forge")equipment();else portals();
 if(lastMessage)message(lastMessage,lastError);
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function enhance(){
 if(!safe()||busy||!selected)return;
 const it=(me.inventory||[]).find(x=>x.uid===selected);
 if(!it)return;
 const requestId=globalThis.crypto?.randomUUID?.();
 if(!requestId)return message("A secure connection is required for enhancement.",true);
 busy=true;lastMessage="";
 const anvil=$("v068Anvil");anvil.classList.remove("v068-win","v068-fail");anvil.classList.add("v068-working");
 $("v068Enhance").disabled=true;$("v068Buy").disabled=true;
 message("✦ FORGING · The Ancient Forge is deciding your fate…");
 window.SoulboundAudio?.sfx("guard");
 try{
  const [result]=await Promise.all([bridge().send("forgeAttempt",{uid:selected,requestId}),pause(1750)]);
  anvil.classList.remove("v068-working");
  if(!result?.ok)throw Error(result?.error||"Blacksmith rejected enhancement.");
  if(result.duplicate){message("This enhancement request was already processed.");return}
  anvil.classList.add(result.result?.success?"v068-win":"v068-fail");
  window.SoulboundAudio?.sfx(result.result?.success?"levelup":"defeat");
  message(result.result?.success?"✨ SUCCESS! "+it.name+" reached +"+result.result.to+"!":"💥 FAILED · Your item remains +"+result.result.from+". Only stones and Gold were spent.");
 }catch(e){anvil.classList.remove("v068-working");anvil.classList.add("v068-fail");window.SoulboundAudio?.sfx("hit");message(e?.message||"Forge failed.",true)}
 finally{busy=false;draw();setTimeout(()=>anvil.classList.remove("v068-win","v068-fail"),2600)}
}
async function buy(){
 if(!safe()||busy)return;
 busy=true;$("v068Buy").disabled=true;
 try{
  const quantity=Number($("v068BuyCount").value);
  const result=await bridge().send("forgeBuyStone",{quantity});
  if(!result?.ok)throw Error(result?.error||"Purchase failed.");
  window.SoulboundAudio?.sfx("buy");message("🔹 Purchased "+result.quantity+" Enhancement Stone for "+result.cost+" Gold.");
 }catch(e){message(e?.message||"Cannot buy stones.",true)}
 finally{busy=false;draw()}
}
async function startGuardian(id){
 if(!safe()||busy)return;
 busy=true;
 try{
  const result=await bridge().send("ancientGuardian",{id});
  if(!result?.ok)throw Error(result?.error||"The portal is sealed.");
  window.SoulboundAudio?.sfx("boss");panel.hidden=true;
 }catch(e){message(e?.message||"Ancient Portal unavailable.",true)}
 finally{busy=false;draw()}
}
function onState(next,id){
 room=next;self=id;me=(next?.players||[]).find(p=>p.id===self)||null;
 if(panel&&!panel.hidden)draw();
}
window.SoulboundForgeV068={open:()=>show("forge"),openPortal:()=>show("portal"),onState};
})();
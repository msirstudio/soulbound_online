const socket = io();
const $ = id => document.getElementById(id);
let roomCode = null, gameState = null, myId = null;
const nameInput = $("name");
function notice(message, error=false){$("notice").textContent=message;$("notice").className=error?"notice error":"notice"}
function call(event,data={}){return new Promise(resolve=>socket.emit(event,data,result=>resolve(result||{ok:false,error:"No response"})))}
function enter(code){roomCode=code;$("lobby").hidden=true;$("game").hidden=false;$("code").textContent=code}
$("create").onclick=async()=>{const r=await call("createRoom",{name:nameInput.value});if(r.ok){enter(r.code);notice("Party created.")}else notice(r.error,true)};
$("join").onclick=async()=>{const r=await call("joinRoom",{name:nameInput.value,code:$("roomCode").value});if(r.ok){enter(r.code)}else notice(r.error,true)};
$("copy").onclick=async()=>{const text=`Join my SOULBOUND party! Room code: ${roomCode}`;try{await navigator.clipboard.writeText(text);$("copy").textContent="COPIED!"}catch{$("copy").textContent=roomCode}};
$("start").onclick=async()=>{const r=await call("startBattle");if(!r.ok)alert(r.error)};
$("next").onclick=async()=>{const r=await call("nextStage");if(!r.ok)alert(r.error)};
$("restart").onclick=async()=>{const r=await call("restart");if(!r.ok)alert(r.error)};
document.querySelectorAll("[data-action]").forEach(btn=>btn.onclick=async()=>{const r=await call("action",{type:btn.dataset.action});if(!r.ok)alert(r.error)});
socket.on("connect",()=>{myId=socket.id});
socket.on("disconnect",()=>{$("status").textContent="Connection lost. Refresh to reconnect."});
socket.on("state",state=>{gameState=state;render()});
function render(){
 const s=gameState;if(!s)return;
 $("code").textContent=s.code;
 const me=s.players.find(p=>p.id===myId);
 const active=s.players[s.turnIndex];
 $("status").textContent=s.status==="waiting"?"Waiting for the party leader to start.":s.status==="battle"?(active?.id===myId?"YOUR TURN — choose an action!":`${active?.name||"Another hero"} is taking their turn...`):s.status==="victory"?"VICTORY! The party defeated the monster.":s.status==="complete"?"THE KINGDOM IS FREE!": "The party has fallen.";
 $("monsterSprite").textContent=s.monster?.icon||"🌲";$("monsterName").textContent=s.monster?.name?.toUpperCase()||"WAITING";
 const mh=s.monster?.hp||0, mm=s.monster?.maxHp||1;$("monsterHp").style.width=(mh/mm*100)+"%";$("monsterHpText").textContent=`${mh} / ${mm} HP`;
 $("partySprites").innerHTML=s.players.map((p,i)=>`<span class="sprite" title="${escapeHtml(p.name)}">${p.alive?"🧙":"🪦"}</span>`).join("");
 $("players").innerHTML=s.players.map(p=>`<div class="player"><div class="player-head"><strong>${escapeHtml(p.name)} ${p.id===myId?"(YOU)":""}</strong><span>LV ${p.level}</span></div><div class="player-bars">HP ${p.hp}/${p.maxHp} · MP ${p.mp}/${p.maxMp}<br>ATK ${p.atk} · DEF ${p.def} · 🧪 ${p.potions} · 🪙 ${p.gold}</div></div>`).join("");
 $("myStats").textContent=me?`LV ${me.level} · HP ${me.hp}/${me.maxHp} · MP ${me.mp}/${me.maxMp} · EXP ${me.xp} · GOLD ${me.gold}`:"Waiting for your player data";
 const myTurn=!!me&&active?.id===myId&&s.status==="battle"&&me.hp>0;
 document.querySelectorAll("[data-action]").forEach(b=>{b.disabled=!myTurn||(b.dataset.action==="skill"&&me.mp<12)||(b.dataset.action==="heal"&&(me.potions<1||me.hp===me.maxHp))});
 $("start").hidden=s.status!=="waiting";$("start").disabled=s.players[0]?.id!==myId;
 $("next").hidden=s.status!=="victory";$("next").disabled=s.players[0]?.id!==myId;
 $("restart").hidden=!["complete","defeat"].includes(s.status);$("restart").disabled=s.players[0]?.id!==myId;
 $("log").innerHTML=s.log.slice().reverse().map(x=>`<div>› ${escapeHtml(x)}</div>`).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

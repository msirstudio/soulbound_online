const socket = io();
const $ = id => document.getElementById(id);
let roomCode = null, gameState = null, myId = null, currentUser = null;
let supabaseClient = null, savedCharacter = null, restoreComplete = false, saveTimer = null;
const config = window.SOULBOUND_SUPABASE || {};
const configured = !!(config.url && config.anonKey && !config.anonKey.includes("PASTE_YOUR"));
if (configured && window.supabase) supabaseClient = window.supabase.createClient(config.url, config.anonKey);

function notice(message, error=false){$("notice").textContent=message;$("notice").className=error?"notice error":"notice"}
function authNotice(message, error=false){$("authNotice").textContent=message;$("authNotice").className=error?"notice error":"notice"}
function call(event,data={}){return new Promise(resolve=>socket.emit(event,data,result=>resolve(result||{ok:false,error:"No response"})))}
function enter(code){roomCode=code;$("lobby").hidden=true;$("game").hidden=false;$("code").textContent=code}
function showAccount(user){
 currentUser=user;
 $("account").hidden=false;
 $("lobby").hidden=!user;
 $("accountInfo").hidden=!user;
 $("accountEmail").textContent=user?.email||"";
 $("signup").hidden=!!user;$("signin").hidden=!!user;
 $("email").disabled=!!user;$("password").disabled=!!user;
 if(user) authNotice("Signed in. Your hero data is linked to this account.");
}
function profileFromState(me){
 return {id:currentUser.id,username:me.name,level:me.level,xp:me.xp,gold:me.gold,hp:me.hp,max_hp:me.maxHp,mp:me.mp,max_mp:me.maxMp,attack:me.atk,defense:me.def,potions:me.potions,updated_at:new Date().toISOString()};
}
async function loadProfile(){
 if(!supabaseClient||!currentUser)return null;
 const {data,error}=await supabaseClient.from("profiles").select("*").eq("id",currentUser.id).maybeSingle();
 if(error)throw error;
 if(data)return data;
 const fresh={id:currentUser.id,username:(currentUser.email||"Adventurer").split("@")[0].slice(0,16)||"Adventurer"};
 const {data:created,error:createError}=await supabaseClient.from("profiles").insert(fresh).select().single();
 if(createError)throw createError;
 return created;
}
async function saveProfile(me){
 if(!supabaseClient||!currentUser||!restoreComplete||!me)return;
 const {error}=await supabaseClient.from("profiles").upsert(profileFromState(me),{onConflict:"id"});
 if(error)authNotice("Save failed: "+error.message,true);
 else authNotice("Hero saved · "+new Date().toLocaleTimeString());
}
async function prepareCharacter(){
 try{
  savedCharacter=await loadProfile();
  $("name").value=savedCharacter.username||$("name").value;
  authNotice("Hero save loaded. Create or join a party to continue.");
 }catch(e){authNotice("Could not load profile: "+e.message,true);}
}
async function afterJoin(){
 restoreComplete=false;
 if(savedCharacter){
  const r=await call("restoreCharacter",savedCharacter);
  if(!r.ok)notice(r.error,true);
 }
 restoreComplete=true;
 const me=gameState?.players.find(p=>p.id===myId);
 if(me)saveProfile(me);
}
if(!supabaseClient){
 $("signup").disabled=true;$("signin").disabled=true;
 authNotice("Supabase is not configured yet. Follow SETUP-V0.2.md and add your public key to config.js.",true);
}
$("signup").onclick=async()=>{
 if(!supabaseClient)return;
 const email=$("email").value.trim(),password=$("password").value;
 if(!email||password.length<6)return authNotice("Enter an email and a password with at least 6 characters.",true);
 const {data,error}=await supabaseClient.auth.signUp({email,password});
 if(error)return authNotice(error.message,true);
 if(data.session){showAccount(data.user);await prepareCharacter();}
 else authNotice("Account created. Check your email to confirm, then sign in.");
};
$("signin").onclick=async()=>{
 if(!supabaseClient)return;
 const {data,error}=await supabaseClient.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
 if(error)return authNotice(error.message,true);
 showAccount(data.user);await prepareCharacter();
};
$("signout").onclick=async()=>{
 if(supabaseClient)await supabaseClient.auth.signOut();
 currentUser=null;savedCharacter=null;restoreComplete=false;
 $("game").hidden=true;$("lobby").hidden=true;showAccount(null);
 authNotice("Signed out.");
};
$("create").onclick=async()=>{
 const r=await call("createRoom",{name:$("name").value});
 if(r.ok){enter(r.code);await afterJoin();notice("Party created.")}else notice(r.error,true);
};
$("join").onclick=async()=>{
 const r=await call("joinRoom",{name:$("name").value,code:$("roomCode").value});
 if(r.ok){enter(r.code);await afterJoin()}else notice(r.error,true);
};
$("copy").onclick=async()=>{
 const text=`Join my SOULBOUND party! Room code: ${roomCode}`;
 try{await navigator.clipboard.writeText(text);$("copy").textContent="COPIED!"}catch{$("copy").textContent=roomCode}
};
$("start").onclick=async()=>{const r=await call("startBattle");if(!r.ok)alert(r.error)};
$("next").onclick=async()=>{const r=await call("nextStage");if(!r.ok)alert(r.error)};
$("restart").onclick=async()=>{const r=await call("restart");if(!r.ok)alert(r.error)};
$("leave").onclick=()=>{location.reload()};
document.querySelectorAll("[data-action]").forEach(btn=>btn.onclick=async()=>{const r=await call("action",{type:btn.dataset.action});if(!r.ok)alert(r.error)});
socket.on("connect",()=>{myId=socket.id});
socket.on("disconnect",()=>{$("status").textContent="Connection lost. Refresh to reconnect."});
socket.on("state",state=>{
 gameState=state;render();
 if(restoreComplete){
  const me=state.players.find(p=>p.id===myId);
  if(me){clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveProfile(me),500);}
 }
});
async function restoreSession(){
 if(!supabaseClient)return;
 const {data:{session}}=await supabaseClient.auth.getSession();
 if(session?.user){showAccount(session.user);await prepareCharacter();}
 else showAccount(null);
 supabaseClient.auth.onAuthStateChange((event,session)=>{
  if(event==="SIGNED_OUT"){currentUser=null;savedCharacter=null;showAccount(null);}
 });
}
restoreSession();
function render(){
 const s=gameState;if(!s)return;
 $("code").textContent=s.code;
 const me=s.players.find(p=>p.id===myId);
 const active=s.players[s.turnIndex];
 $("status").textContent=s.status==="waiting"?"Waiting for the party leader to start.":s.status==="battle"?(active?.id===myId?"YOUR TURN — choose an action!":`${active?.name||"Another hero"} is taking their turn...`):s.status==="victory"?"VICTORY! The party defeated the monster.":s.status==="complete"?"THE KINGDOM IS FREE!":"The party has fallen.";
 $("monsterSprite").textContent=s.monster?.icon||"🌲";$("monsterName").textContent=s.monster?.name?.toUpperCase()||"WAITING";
 const mh=s.monster?.hp||0,mm=s.monster?.maxHp||1;$("monsterHp").style.width=(mh/mm*100)+"%";$("monsterHpText").textContent=`${mh} / ${mm} HP`;
 $("partySprites").innerHTML=s.players.map(p=>`<span class="sprite" title="${escapeHtml(p.name)}">${p.alive?"🧙":"🪦"}</span>`).join("");
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

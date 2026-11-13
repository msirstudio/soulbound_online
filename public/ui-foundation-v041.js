/* SOULBOUND v0.41 UI Foundation
   Pure presentation layer: no save, combat, shop, socket, or progression rules.
   Existing #account, #lobby and #game keep their original IDs and event handlers.
*/
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const views=new Set(["menu","account","lobby","game"]);
let view="menu",authenticated=false,gameActive=false,drawerTab=null,settingsOpen=false,settingsFocus=null,initialized=false;
function visible(id,show){const el=$(id);if(el)el.hidden=!show}
function selectView(next){
 if(!views.has(next))return;
 view=next;
 gameActive=next==="game";
 document.body.dataset.v041View=next;
 visible("v041Front",next==="menu");
 visible("account",next==="account");
 visible("lobby",next==="lobby");
 // Do not unhide #game: it is controlled by successful server create/join responses.
 if(next!=="game")closeDrawer();
}
function showMenu(){
 if(!$("game").hidden){return} // The existing Main Menu button handles active-room departure.
 selectView("menu");
}
function openAccount(){if(!$("game").hidden)return;selectView("account");$("email")?.focus()}
function openHero(){if(!$("game").hidden)return;if(authenticated)selectView("lobby");else openAccount()}
function onAuth(user){
 authenticated=!!user;
 if(!$("game").hidden)return;
 // Auto-session recovery must not skip the title menu.
 if(view==="menu"){selectView("menu");return}
 if(authenticated){selectView("lobby");return}
 if(view==="lobby")selectView("menu");else selectView("account");
}
function onPrepared(){
 if(view==="account"&&authenticated)selectView("lobby");
}
function enterGame(){
 if($("game").hidden)return;
 selectView("game");
 closeSettings();
}
function settings(show){
 if(show===settingsOpen)return;
 settingsOpen=show;
 const layer=$("v041Settings");if(!layer)return;
 layer.hidden=!show;
 if(show){settingsFocus=document.activeElement;$("v041SettingsClose")?.focus()}
 else settingsFocus?.focus?.();
}
function closeSettings(){settings(false)}
function openSettings(){settings(true)}
function closeDrawer(){
 drawerTab=null;
 const game=$("game");game?.classList.remove("v041-drawer-open");
 const side=game?.querySelector(".game-side-column");
 if(side){side.dataset.v041Tab="party";side.setAttribute("aria-hidden","true")}
 for(const id of ["v041PartyOpen","v041ChatOpen","v041LogOpen"])$(id)?.setAttribute("aria-expanded","false");
}
function placeDrawer(){
 const side=$("v041GameDrawer"),game=$("game");if(!side||!game)return;
 const rect=game.getBoundingClientRect(),width=310,gap=10;
 const roomRight=window.innerWidth-rect.right,roomLeft=rect.left;
 side.style.setProperty("--v042-panel-left",roomRight>=width+gap?Math.round(rect.right+gap)+"px":roomLeft>=width+gap?Math.round(rect.left-width-gap)+"px":"auto");
 side.style.setProperty("--v042-panel-right",roomRight>=width+gap||roomLeft>=width+gap?"auto":"12px");
 const top=Math.max(12,Math.min(window.innerHeight-260,rect.top+24));
 side.style.setProperty("--v042-panel-top",Math.round(top)+"px");
 side.style.setProperty("--v042-panel-height",Math.round(Math.max(240,window.innerHeight-top-12))+"px");
}
function openDrawer(tab){
 if(!["party","chat","log"].includes(tab)||$("game")?.hidden)return;
 if(drawerTab===tab){closeDrawer();return}
 drawerTab=tab;
 const game=$("game"),side=game?.querySelector(".game-side-column");if(!side)return;
 game.classList.add("v041-drawer-open");placeDrawer();
 side.dataset.v041Tab=tab;side.setAttribute("aria-hidden","false");
 const title=$("v041DrawerTitle");if(title)title.textContent=({party:"PARTY MEMBERS",chat:"PARTY CHAT",log:"BATTLE LOG"})[tab];
 const ids={party:"v041PartyOpen",chat:"v041ChatOpen",log:"v041LogOpen"};
 for(const key of Object.keys(ids))$(ids[key])?.setAttribute("aria-expanded",String(tab===key));
 if(tab==="chat")$("chatInput")?.focus();
 else if(tab==="log")$("v041DrawerClose")?.focus();
 else side.querySelector(".v041-drawer-head button")?.focus();
}
function updateGame(s,me){
 if(!s||!$("game")||$("game").hidden)return;
 if(view!=="game")enterGame();
 const state=$("v041ViewStatus");
 if(state)state.textContent=s.status==="city"?"🏰 CENTRAL CITY":s.status==="regionClear"?"✦ REGION CLEARED":s.status==="battle"?"⚔ BATTLE · STAGE "+s.stage:s.status==="victory"?"✓ VICTORY":s.status==="defeat"?"✕ DEFEAT":s.status==="shop"?"🏪 MERCHANT":"SOULBOUND";
 const size=$("v041PartyOpen");
 if(size)size.textContent="♟ PARTY · "+s.players.length;
 const meta=$("v041PlayerMeta");
 if(meta)meta.textContent=me?"LV "+me.level+" · "+me.name:"ONLINE PARTY";
}
function setupDrawer(){
 const game=$("game"),side=game?.querySelector(".game-side-column");
 if(!game||!side||side.querySelector(".v041-drawer-head"))return;
 const top=document.createElement("div");top.className="v041-drawer-head";
 top.innerHTML='<strong id="v041DrawerTitle">PARTY MEMBERS</strong><button type="button" id="v041DrawerClose" aria-label="Close panel">✕ CLOSE</button>';
 side.prepend(top);side.dataset.v041Tab="party";side.setAttribute("aria-hidden","true");
 $("v041DrawerClose").addEventListener("click",closeDrawer);
 for(const [id,tab] of [["v041PartyOpen","party"],["v041ChatOpen","chat"],["v041LogOpen","log"]]){
  const b=$(id);if(b){b.setAttribute("aria-controls","v041GameDrawer");b.setAttribute("aria-expanded","false");b.onclick=()=>openDrawer(tab)}
 }
 side.id="v041GameDrawer";
 // Side panel remains part of the layout, not a backdrop or a modal.
 // Side data updates still run while closed. Only presentation is hidden.
}
function setup(){
 if(initialized||!$("v041Front")||!$("account")||!$("lobby"))return;
 initialized=true;
 setupDrawer();
 window.addEventListener("resize",()=>{if(drawerTab)placeDrawer()});
 selectView("menu");
 $("v041Play").addEventListener("click",openHero);
 $("v041NewHero").addEventListener("click",openHero);
 $("v041Account").addEventListener("click",openAccount);
 $("v041SettingsOpen").addEventListener("click",openSettings);
 $("v041SettingsClose").addEventListener("click",closeSettings);
 $("v041AccountBack").addEventListener("click",showMenu);
 $("v041LobbyBack").addEventListener("click",showMenu);
 $("v041Settings").addEventListener("click",e=>{if(e.target===$("v041Settings"))closeSettings()});
 $("v041MusicSetting").addEventListener("click",()=>{$("musicToggle")?.click();reflectSettings()});
 $("v041SoundSetting").addEventListener("click",()=>{$("sfxQuick")?.click();reflectSettings()});
 $("v041LanguageSetting").addEventListener("click",()=>{$("v038Lang")?.click()});
 document.addEventListener("keydown",e=>{
  if(e.key!=="Escape")return;
  if(settingsOpen){closeSettings();return}
  if(drawerTab){closeDrawer();return}
  if(view==="account"||view==="lobby")showMenu();
 });
 reflectSettings();
}
function reflectSettings(){
 const audio=window.SoulboundAudio;
 if(!audio)return;
 const music=$("v041MusicSetting"),sfx=$("v041SoundSetting");
 if(music)music.textContent="♫ MUSIC · "+(audio.musicOn?"ON":"OFF");
 if(sfx)sfx.textContent="🔊 SFX · "+(audio.sfxVolume>0.01?"ON":"OFF");
}
window.SoulboundUIV41={selectView,showMenu,onAuth,onPrepared,enterGame,updateGame,openDrawer,closeDrawer,openSettings,closeSettings,getView:()=>view};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();
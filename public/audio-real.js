/* SOULBOUND v0.28 — externally hosted CC0 recordings.
   No synthesizer, no oscillator music, no generated samples.
   Remote assets are streamed and depend on their hosts remaining available.
   Music licences/sources: CREDITS-V0.28.md. */
(()=>{
 "use strict";
 const SRC="https://raw.githubusercontent.com/GeorgeQLe/assets-sfx-combat/main/assets/kenney/";
 const RPG=SRC+"rpg-audio/Audio/";
 const IMP=SRC+"impact-sounds/Audio/";
 const OST="https://opengameart.org/sites/default/files/";
 const BOSS="https://raw.githubusercontent.com/jarlah/dungeon-haskell/master/assets/music/boss.ogg";
 const tracks={
  wilds:[OST+"The_Bards_Tale.mp3",OST+"TownTheme.mp3",BOSS],
  ruins:[OST+"The_Old_Tower_Inn.mp3",OST+"Exploration.mp3",BOSS],
  cavern:[OST+"Battle.mp3",BOSS],
  frost:[OST+"greyarms-medievil.ogg",OST+"TownTheme.mp3",BOSS],
  abyss:[BOSS],
  castle:[OST+"Battle.mp3",BOSS]
 };
 const sounds={
  sword:[RPG+"knifeSlice.ogg",RPG+"knifeSlice2.ogg"],
  heavy:[RPG+"chop.ogg"],
  staff:[IMP+"impactGlass_medium_000.ogg"],
  skill:[RPG+"knifeSlice2.ogg"],
  hit:[IMP+"impactPlate_medium_000.ogg",IMP+"impactGeneric_light_001.ogg"],
  guard:[IMP+"impactMetal_medium_000.ogg"],
  heal:[RPG+"handleSmallLeather.ogg"],
  mana:[RPG+"bookFlip1.ogg"],
  victory:[RPG+"handleCoins.ogg"],
  defeat:[IMP+"impactMetal_heavy_002.ogg"],
  boss:[IMP+"impactBell_heavy_000.ogg"],
  levelup:[RPG+"handleCoins2.ogg"],
  buy:[RPG+"handleCoins.ogg"],
  menu:[RPG+"metalClick.ogg"],
  equip:[RPG+"drawKnife1.ogg"]
 };
 let musicOn=false,musicVolume=.72,sfxVolume=1,scene="wilds",combat=false;
 let bgm=null,activeKey="",trackIndex=0,failedTracks=new Set(),musicStatus="Music OFF";
 let lastPlay=new Map(),concurrency=0;
 const clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
 const audioPath=(type,details)=>{
  if(type==="attack"){
   const weapon=String(details.weapon||"").toLowerCase();
   if(/staff|wand|spell/.test(weapon))return "staff";
   if(/mace|hammer|maul|axe/.test(weapon))return "heavy";
   return "sword";
  }
  return sounds[type]?type:(type==="skill2"||type==="skill3"?"skill":"menu");
 };
 const musicKey=()=>combat&&scene==="castle"?"castle":scene;
 function applyMusicVolume(){if(bgm)bgm.volume=clamp(musicVolume*.8)}
 function releaseMusic(){if(bgm){bgm.pause();bgm.removeAttribute("src");bgm.load();bgm=null}}
 function report(status){musicStatus=status;const label=document.getElementById("audioStatus");if(label)label.textContent=status;window.dispatchEvent(new CustomEvent("soulbound:audio-status",{detail:{status}}))}
 function tryTrack(key,index=0){
  if(!musicOn)return;
  const list=tracks[key]||tracks.wilds;
  if(index>=list.length){report("Recorded music unavailable — check connection");return}
  const url=list[index];
  if(failedTracks.has(url))return tryTrack(key,index+1);
  releaseMusic();trackIndex=index;
  const a=new Audio();bgm=a;a.loop=true;a.preload="auto";a.src=url;applyMusicVolume();
  a.addEventListener("error",()=>{
   if(bgm!==a||!musicOn)return;
   failedTracks.add(url);report("Trying another CC0 music track...");tryTrack(key,index+1);
  },{once:true});
  a.addEventListener("playing",()=>{if(bgm===a)report("Recorded soundtrack playing")});
  a.play().catch(e=>{if(bgm!==a)return;report("Click MUSIC again to enable recorded audio")});
 }
 function setMusic(on){
  musicOn=!!on;
  if(!musicOn){releaseMusic();activeKey="";report("Music OFF")}
  else{activeKey=musicKey();tryTrack(activeKey)}
  return musicOn;
 }
 function setScene(next){
  const key=Object.prototype.hasOwnProperty.call(tracks,next)?next:"wilds";
  if(key===scene)return scene;
  scene=key;
  if(musicOn){activeKey=musicKey();tryTrack(activeKey)}
  return scene;
 }
 function setCombatMood(value){
  combat=!!value;
  // Preserve the environment soundtrack in regular encounters, avoiding
  // an abrupt restart every player turn. Citadel encounters retain boss music.
  const key=musicKey();
  if(musicOn&&key!==activeKey){activeKey=key;tryTrack(key)}
 }
 function setVolume(v){musicVolume=clamp(v);applyMusicVolume();return musicVolume}
 function setSfxVolume(v){sfxVolume=clamp(v);return sfxVolume}
 /* Preloaded recordings reduce the delay between clicking an action and hearing it. */
 const cache=new Map();
 function preload(url){
  if(cache.has(url))return cache.get(url);
  const a=new Audio();
  a.preload="auto";a.src=url;
  if(cache.size<100)cache.set(url,a);
  return a;
 }
 function playSample(uri,volume=1,delay=0){
  const play=()=>{
   if(concurrency>=10)return;
   const template=preload(uri),a=template.cloneNode(true);
   a.volume=clamp(sfxVolume*.85*volume);
   a.playbackRate=1;
   concurrency++;
   let done=false;
   const release=()=>{if(done)return;done=true;concurrency=Math.max(0,concurrency-1);a.pause();a.removeAttribute("src")};
   a.addEventListener("ended",release,{once:true});
   a.addEventListener("error",release,{once:true});
   a.play().catch(release);
   setTimeout(release,2600);
  };
  if(delay>0)setTimeout(play,delay);else play();
 }
 function sfx(type,details={}){
  if(sfxVolume<=.005)return;
  const name=audioPath(type,details);
  const now=performance.now(),prev=lastPlay.get(name)||0;
  if(now-prev<95)return;lastPlay.set(name,now);
  if(name==="sword"){
   playSample(RPG+"knifeSlice.ogg",.92);
   // The swish is distinct from the *optional* impact; don't randomly play a clang for every swing.
  }else if(name==="heavy"){
   playSample(RPG+"chop.ogg",.95);
  }else if(name==="staff"){
   playSample(IMP+"impactGlass_medium_000.ogg",.77);
  }else if(name==="hit"){
   playSample(IMP+"impactGeneric_light_001.ogg",.8);
  }else{
   const sources=sounds[name]||sounds.menu;
   playSample(sources[Math.floor(Math.random()*sources.length)],name==="menu"?.68:.86);
  }
 }
 // Warm the most common effects after a real input gesture, without starting playback.
 function warmAudio(){
  [RPG+"knifeSlice.ogg",RPG+"chop.ogg",IMP+"impactGlass_medium_000.ogg",IMP+"impactGeneric_light_001.ogg"].forEach(preload);
 }
 window.addEventListener("pointerdown",warmAudio,{once:true,passive:true});
 window.SoulboundAudio={
  sfx,setMusic,setVolume,setSfxVolume,setScene,setCombatMood,
  get musicOn(){return musicOn},
  get volume(){return musicVolume},
  get sfxVolume(){return sfxVolume},
  get scene(){return scene},
  get status(){return musicStatus}
 };
})();

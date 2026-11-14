/* SOULBOUND v0.56.1 · Original, locally generated fantasy score.
 * Nine distinct procedural themes: city + each of eight regions.
 * No third-party music/recording licenses; tones are original WebAudio synthesis.
 * One AudioContext and look-ahead scheduler; user gesture required to start.
 */
(()=>{
"use strict";
const old=window.SoulboundAudio;
if(!old)return;
const original={setScene:old.setScene.bind(old),setMusic:old.setMusic.bind(old),setVolume:old.setVolume.bind(old),setCombatMood:old.setCombatMood.bind(old)};
const themes={
 city:{name:"Central City · Market Day",bpm:102,root:60,scale:[0,2,4,5,7,9,11],lead:[0,2,4,5,4,2,0,4,7,5,4,2,4,2,0,-1],bass:[0,4,5,4],voice:"triangle",bright:.42},
 cursed_wilds:{name:"Cursed Wilds · Forest Whispers",bpm:92,root:57,scale:[0,2,3,5,7,8,10],lead:[0,2,4,2,0,2,5,4,2,0,-1,2,4,3,2,0],bass:[0,5,3,4],voice:"sine",bright:.3},
 dreadforge_bastion:{name:"Dreadforge Bastion · Iron March",bpm:112,root:50,scale:[0,2,3,5,7,8,10],lead:[0,-1,0,2,4,2,0,-1,3,4,2,0,5,4,2,0],bass:[0,0,4,5],voice:"sawtooth",bright:.3},
 ember_caverns:{name:"Ember Caverns · Molten Heart",bpm:128,root:52,scale:[0,1,3,5,7,8,10],lead:[0,4,3,2,4,6,5,4,2,0,3,4,6,5,4,2],bass:[0,5,4,3],voice:"square",bright:.24},
 hollow_sanctum:{name:"Hollow Sanctum · Oracle's Reverie",bpm:78,root:62,scale:[0,2,3,5,7,9,10],lead:[0,4,6,5,3,4,2,0,1,3,5,4,6,4,2,1],bass:[0,3,5,4],voice:"sine",bright:.3},
 frostbound_peaks:{name:"Frostbound Peaks · Snowfall",bpm:84,root:65,scale:[0,2,3,5,7,8,10],lead:[0,2,4,6,5,4,2,0,4,3,2,0,-1,0,2,4],bass:[0,4,5,3],voice:"triangle",bright:.25},
 titanfall_ruins:{name:"Titanfall Ruins · Giants' Lament",bpm:96,root:45,scale:[0,2,3,5,7,8,10],lead:[0,0,4,3,2,0,-1,0,5,4,2,3,4,2,0,-1],bass:[0,5,3,4],voice:"sawtooth",bright:.25},
 abyssal_rift:{name:"Abyssal Rift · Beyond the Veil",bpm:110,root:47,scale:[0,1,3,5,6,8,10],lead:[0,4,1,3,6,4,2,1,0,-1,4,6,5,3,1,0],bass:[0,3,6,1],voice:"sine",bright:.28},
 eclipse_throne:{name:"Eclipse Throne · Last Sovereign",bpm:148,root:45,scale:[0,2,3,5,7,8,11],lead:[0,4,6,5,4,2,0,4,7,6,5,4,6,4,2,0],bass:[0,4,5,6],voice:"sawtooth",bright:.36}
};
const regionIds=Object.keys(themes).filter(k=>k!=="city");
const cssRegion={wilds:"cursed_wilds",ruins:"dreadforge_bastion",cavern:"ember_caverns",frost:"frostbound_peaks",abyss:"abyssal_rift",castle:"eclipse_throne"};
let key="city",enabled=false,ctx=null,master=null,interval=null,step=0,nextAt=0,volume=.72;
let combat=false;
const clamp=x=>Math.min(1,Math.max(0,Number(x)||0));
const pitch=m=>440*Math.pow(2,(m-69)/12);
function tone(midi,time,dur,level,wave="triangle",attack=.012){
 if(!ctx||!master)return;
 const oscillator=ctx.createOscillator(),gain=ctx.createGain();
 oscillator.type=wave;oscillator.frequency.setValueAtTime(pitch(midi),time);
 gain.gain.setValueAtTime(.0001,time);
 gain.gain.exponentialRampToValueAtTime(Math.max(.00011,level),time+attack);
 gain.gain.exponentialRampToValueAtTime(.0001,time+Math.max(attack+.015,dur));
 oscillator.connect(gain);gain.connect(master);
 oscillator.start(time);oscillator.stop(time+Math.max(.04,dur)+.02);
 oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};
}
function note(scale,idx,root){
 let octave=Math.floor(idx/7),stepIndex=((idx%7)+7)%7;
 return root+scale[stepIndex]+octave*12;
}
function playStep(at,index){
 const t=themes[key]||themes.city,quarter=60/t.bpm,beat=quarter/2;
 const beatIndex=index%16,bar=Math.floor(index/4)%4,lead=t.lead[beatIndex];
 const rootNote=note(t.scale,t.bass[bar],t.root);
 if(beatIndex%4===0){
  tone(rootNote-12,at,beat*3.5,key==="eclipse_throne"?.14:.09,"sine",.02);
  tone(rootNote+7,at,beat*2.9,.027,"triangle",.04);
 }
 if(lead>=0){
  const high=note(t.scale,lead,t.root+12);
  tone(high,at,beat*(index%4===0?1.75:.89),t.bright*(key==="eclipse_throne"?.25:.2),t.voice,.025);
  if(key==="hollow_sanctum"||key==="frostbound_peaks")tone(high+12,at+.025,beat*.8,.024,"sine",.03);
 }
 if(key==="city"&&(index%4===0||index%4===2)){
  tone(rootNote+12,at,beat*.62,.038,"triangle");
 }
 if(["dreadforge_bastion","ember_caverns","titanfall_ruins","eclipse_throne"].includes(key)){
  if(index%4===0)tone(t.root-24,at,beat*.55,key==="eclipse_throne"?.15:.085,"triangle");
  if(index%4===2)tone(t.root-8,at,beat*.15,.022,"square",.003);
 }
 if(key==="abyssal_rift"&&(index%2===1))tone(rootNote+19,at,beat*.75,.012,"sine");
}
function scheduler(){
 if(!ctx||!enabled)return;
 const t=themes[key]||themes.city;
 while(nextAt<ctx.currentTime+.24){
  playStep(nextAt,step);
  nextAt+=30/t.bpm;step++;
 }
}
async function ensureContext(){
 if(!ctx){
  const AudioContext=window.AudioContext||window.webkitAudioContext;
  if(!AudioContext)throw new Error("Web Audio unsupported");
  ctx=new AudioContext();master=ctx.createGain();master.gain.value=volume*.26;
  master.connect(ctx.destination);
 }
 if(ctx.state==="suspended")await ctx.resume();
}
function resetSequence(){
 step=0;nextAt=ctx?ctx.currentTime+.07:0;
}
function select(next){
 if(!themes[next])next="city";
 if(key===next)return key;
 key=next;resetSequence();return key;
}
function setScene(next){
 original.setScene(next);
 if(next==="city")return select("city");
 return select(cssRegion[next]||next);
}
function setRegion(id,city=false){
 return select(city?"city":themes[id]?id:"cursed_wilds");
}
function setMusic(on){
 enabled=!!on;
 // Pause the previous streamed soundtrack, preserving its SFX handling.
 original.setMusic(false);
 if(!enabled){if(interval){clearInterval(interval);interval=null}return false}
 ensureContext().then(()=>{
  if(!enabled)return;
  resetSequence();
  if(!interval)interval=setInterval(scheduler,100);
  scheduler();
 }).catch(()=>{enabled=false});
 return enabled;
}
function setVolume(v){
 volume=clamp(v);original.setVolume(v);
 if(master)master.gain.setTargetAtTime(volume*.26,ctx.currentTime,.07);
 return volume;
}
function setCombatMood(v){
 combat=!!v;original.setCombatMood(false);
}
old.setScene=setScene;
old.setRegion=setRegion;
old.setMusic=setMusic;
old.setVolume=setVolume;
old.setCombatMood=setCombatMood;
Object.defineProperty(old,"musicOn",{configurable:true,get:()=>enabled});
Object.defineProperty(old,"scene",{configurable:true,get:()=>key});
Object.defineProperty(old,"status",{configurable:true,get:()=>enabled?"Original score · "+themes[key].name:"Music OFF"});
window.SoulboundMusicV561={themes,setRegion,select,get current(){return key},get enabled(){return enabled},get combat(){return combat}};
})();
"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"..","public/music-v0561.js"),"utf8");
test("Real music-controller wiring selects all nine themes and does not recurse",async()=>{
 const calls=[],status={textContent:""};
 const audio={
  setScene:v=>{calls.push(["old-scene",v]);return v},
  setMusic:on=>{calls.push(["old-music",on]);return !!on},
  setVolume:v=>{calls.push(["old-volume",v]);return v},
  setCombatMood:v=>{calls.push(["old-combat",v]);return v}
 };
 const value={value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}};
 let voices=0;
 class FakeAudioContext{
  constructor(){this.currentTime=0;this.state="running";this.destination={}}
  createGain(){return{gain:{...value},connect(){},disconnect(){}}}
  createOscillator(){voices++;return{frequency:{setValueAtTime(){}},connect(){},start(){},stop(){},disconnect(){},set onended(v){this._ended=v},type:"triangle"}}
  resume(){return Promise.resolve()}
 }
 const window={SoulboundAudio:audio,AudioContext:FakeAudioContext};
 let activeInterval=false;
 const sandbox={window,document:{getElementById:id=>id==="audioStatus"?status:null},setInterval:()=>{activeInterval=true;return 1},clearInterval:()=>{activeInterval=false}};
 vm.runInNewContext(source,sandbox);
 const ctl=window.SoulboundMusicV561;
 assert.equal(Object.keys(ctl.themes).length,9);
 assert.equal(audio.musicOn,false);
 audio.setScene("wilds");
 audio.setRegion("hollow_sanctum",false);
 assert.equal(ctl.current,"hollow_sanctum");
 audio.setRegion("eclipse_throne",false);
 assert.equal(ctl.current,"eclipse_throne");
 audio.setRegion("eclipse_throne",true);
 assert.equal(ctl.current,"city");
 assert.equal(audio.setMusic(true),true);
 await new Promise(resolve=>setImmediate(resolve));
 assert.ok(activeInterval);
 assert.ok(voices>0,"scheduled score generates real oscillators");
 assert.ok(status.textContent.includes("Central City"));
 audio.setRegion("abyssal_rift",false);
 assert.ok(status.textContent.includes("Abyssal Rift"));
 assert.equal(audio.setMusic(false),false);
 assert.equal(activeInterval,false);
 assert.equal(audio.musicOn,false);
 assert.ok(calls.some(c=>c[0]==="old-music"&&c[1]===false));
 assert.ok(calls.length<25,"no recursive calls into replaced functions");
});

/* SOULBOUND v0.26: original synthesized adaptive BGM & layered fantasy SFX.
 * No external audio files, downloads, autoplay, or copyrighted melodies.
 * WebAudio starts only after a user gesture. */
(()=>{
"use strict";
const A=window.AudioContext||window.webkitAudioContext;
let ctx=null,master=null,compressor=null,musicBus=null,fxBus=null,reverb=null,reverbGain=null,noiseBuf=null;
let musicOn=false,volume=.38,sfxVolume=.8,scene="wilds",mood="waiting",ticker=null,nextAt=0,step=0;
const themes={
 wilds:{bpm:84,root:57,mode:[0,2,3,5,7,9,10],chords:[0,5,3,4],wave:"triangle",pad:"sine"},
 ruins:{bpm:92,root:53,mode:[0,2,3,5,7,8,10],chords:[0,5,3,4],wave:"triangle",pad:"sine"},
 cavern:{bpm:105,root:50,mode:[0,1,3,5,7,8,10],chords:[0,6,5,4],wave:"sawtooth",pad:"triangle"},
 frost:{bpm:76,root:62,mode:[0,2,3,5,7,9,10],chords:[0,3,5,4],wave:"sine",pad:"sine"},
 abyss:{bpm:98,root:48,mode:[0,1,3,6,7,8,10],chords:[0,6,2,5],wave:"triangle",pad:"sine"},
 castle:{bpm:112,root:52,mode:[0,2,3,5,7,8,11],chords:[0,5,3,6],wave:"sawtooth",pad:"triangle"}
};
function audio(){
 if(!A)return null;
 if(!ctx){
  ctx=new A();master=ctx.createGain();master.gain.value=volume;
  compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-18;compressor.knee.value=18;
  compressor.ratio.value=3;compressor.attack.value=.006;compressor.release.value=.25;
  master.connect(compressor);compressor.connect(ctx.destination);
  musicBus=ctx.createGain();musicBus.gain.value=.56;musicBus.connect(master);
  fxBus=ctx.createGain();fxBus.gain.value=sfxVolume;fxBus.connect(master);
  reverb=ctx.createDelay(.75);reverb.delayTime.value=.23;reverbGain=ctx.createGain();reverbGain.gain.value=.13;
  musicBus.connect(reverb);reverb.connect(reverbGain);reverbGain.connect(master);
  const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.8),ctx.sampleRate),d=buffer.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  noiseBuf=buffer;
 }
 if(ctx.state==="suspended")ctx.resume().catch(()=>{});
 return ctx;
}
function hz(midi){return 440*Math.pow(2,(midi-69)/12)}
function voice(freq,at,dur,opt={}){
 if(!ctx)return;
 const o=ctx.createOscillator(),gain=ctx.createGain();
 const start=Math.max(ctx.currentTime+.002,at),type=opt.wave||"triangle",amp=opt.amp??.025;
 o.type=type;o.frequency.setValueAtTime(Math.max(25,freq),start);
 if(opt.pitch)o.frequency.exponentialRampToValueAtTime(Math.max(25,freq*opt.pitch),start+Math.max(.02,dur));
 gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.00011,amp),start+Math.min(dur*.28,.04));
 gain.gain.setValueAtTime(Math.max(.00011,amp*.75),start+Math.max(.041,dur*.48));
 gain.gain.exponentialRampToValueAtTime(.0001,start+dur+.11);
 let output=gain;
 if(opt.filter){const f=ctx.createBiquadFilter();f.type=opt.filter;f.frequency.value=opt.cutoff||1700;o.connect(f);f.connect(gain)}
 else{o.connect(gain)}
 if(opt.pan&&ctx.createStereoPanner){const pan=ctx.createStereoPanner();pan.pan.value=opt.pan;gain.connect(pan);output=pan}
 output.connect(opt.music?musicBus:fxBus);o.start(start);o.stop(start+dur+.14);
}
function noise(at,dur,amp=.1,hi=7000,lo=100,opt={}){
 if(!ctx||!noiseBuf)return;
 const start=Math.max(ctx.currentTime+.002,at),src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
 src.buffer=noiseBuf;src.playbackRate.value=opt.rate||1;filter.type=opt.type||"bandpass";
 filter.frequency.setValueAtTime(hi,start);filter.frequency.exponentialRampToValueAtTime(Math.max(50,lo),start+dur);
 filter.Q.value=opt.q||.75;gain.gain.setValueAtTime(.0001,start);gain.gain.linearRampToValueAtTime(amp,start+.008);
 gain.gain.exponentialRampToValueAtTime(.0001,start+dur);
 src.connect(filter);filter.connect(gain);gain.connect(opt.music?musicBus:fxBus);
 src.start(start);src.stop(start+dur+.02);
}
function chord(t,notes,amp,wave,dur){
 for(let i=0;i<notes.length;i++)voice(hz(notes[i]),t+.04*i,dur,{music:true,amp:amp/(1+i*.6),wave,filter:"lowpass",cutoff:1200+i*380,pan:((i-1)*.25)});
}
const sequences={
 wilds:[0,2,4,2,5,4,2,1,0,2,5,4,3,2,1,0],
 ruins:[0,2,3,1,4,3,2,0,5,4,2,1,3,2,1,0],
 cavern:[0,3,4,2,6,4,3,1,0,1,3,6,5,3,1,0],
 frost:[0,2,4,5,4,2,1,2,0,3,4,2,1,0,2,1],
 abyss:[0,5,2,6,4,1,5,3,0,6,5,2,4,3,1,0],
 castle:[0,2,4,6,5,4,2,0,3,5,6,4,2,1,0,4]
};
function tick(t){
 const cfg=themes[scene]||themes.wilds,beat=60/(cfg.bpm*(mood==="boss"?1.18:1))/2;
 const i=step%16,bar=Math.floor(step/16)%4,root=cfg.root+cfg.mode[cfg.chords[bar]];
 if(i===0){
  chord(t,[root-12,root+7,root+12],mood==="boss"?.022:.015,cfg.pad,beat*7.3);
  voice(hz(root-24),t,beat*7,{music:true,amp:.045,wave:"sine",filter:"lowpass",cutoff:320});
 }
 if(i%2===0){
  const slot=sequences[scene][(i+bar*3)%16];
  voice(hz(cfg.root+12+cfg.mode[slot]),t,beat*.85,{music:true,amp:mood==="shop"?.009:.019,wave:cfg.wave,filter:"lowpass",cutoff:scene==="cavern"?880:2100,pan:Math.sin(step*.3)*.25});
 }
 if(i%4===2){voice(hz(root-12),t,beat*.7,{music:true,amp:.02,wave:"triangle",filter:"lowpass",cutoff:650})}
 if(mood==="boss"){
  if(i%2===0)noise(t,.075,.025,400,90,{music:true});
  if(i%4===0)voice(hz(root-24),t,beat*.5,{music:true,amp:.04,wave:"sawtooth",filter:"lowpass",cutoff:230});
 }else if(scene==="cavern"&&i%4===0){noise(t,.12,.012,500,130,{music:true})}
 step++;
 return beat;
}
function schedule(){
 if(!ctx||!musicOn)return;
 const t=ctx.currentTime;
 if(nextAt<t-.3)nextAt=t+.035;
 let limit=0;
 while(nextAt<t+.2&&limit++<12)nextAt+=tick(nextAt);
}
function setMusic(value){
 musicOn=!!value;
 if(ticker){clearInterval(ticker);ticker=null}
 if(musicOn){
  const c=audio();if(!c){musicOn=false;return false}
  musicBus.gain.setTargetAtTime(.65,c.currentTime,.12);
  nextAt=c.currentTime+.06;step=0;schedule();ticker=setInterval(schedule,70);
 }else if(ctx){musicBus.gain.setTargetAtTime(.0001,ctx.currentTime,.05)}
 return musicOn;
}
function setScene(nextScene,nextMood="battle",boss=false){
 const ns=themes[nextScene]?nextScene:"wilds";
 const nm=boss?"boss":nextMood==="shop"?"shop":nextMood==="battle"?"battle":"waiting";
 if(ns===scene&&nm===mood)return;
 scene=ns;mood=nm;step=0;
 if(ctx&&musicOn){musicBus.gain.setTargetAtTime(.0001,ctx.currentTime,.06);nextAt=ctx.currentTime+.22;
  musicBus.gain.setTargetAtTime(.65,ctx.currentTime+.24,.18)}
}
function sfx(name,opt={}){
 try{
  if(!audio())return;
  const t=ctx.currentTime+.005,kind=String(name||"ui"),pan=opt.pan||0,lv=opt.volume||1;
  const V=(n)=>n*lv;
  if(kind==="attack"||kind==="sword"||kind==="attack_sword"){
   noise(t,.16,V(.18),7200,380,{rate:1.25});voice(680,t,.12,{amp:V(.04),wave:"sawtooth",pitch:.28,pan});
   voice(135,t+.09,.17,{amp:V(.07),wave:"triangle",pitch:.5,pan});noise(t+.12,.10,V(.11),1900,90);
  }else if(kind==="hammer"||kind==="attack_hammer"){
   noise(t,.22,V(.13),1000,65);voice(100,t+.06,.28,{amp:V(.13),wave:"triangle",pitch:.35,pan});
   voice(56,t+.065,.27,{amp:V(.07),wave:"sine",pitch:.54});noise(t+.08,.19,V(.12),260,45,{type:"lowpass"});
  }else if(kind==="staff"||kind==="attack_staff"||kind==="magic"){
   [440,660,880,1108].forEach((f,i)=>voice(f,t+i*.045,.19,{amp:V(.038),wave:"sine",pitch:1.5,pan}));
   noise(t,.31,V(.06),300,4800,{type:"highpass"});voice(160,t+.16,.18,{amp:V(.025),wave:"triangle",pitch:2.4});
  }else if(kind==="skill"||kind==="critical"){
   noise(t,.25,V(.2),3800,450);voice(180,t,.23,{amp:V(.1),wave:"sawtooth",pitch:2.2});
   voice(680,t+.12,.28,{amp:V(.075),wave:"triangle",pitch:.34});noise(t+.13,.18,V(.11),1200,100);
  }else if(kind==="hit"){
   noise(t,.15,V(.18),2300,130);voice(116,t,.22,{amp:V(.09),wave:"sawtooth",pitch:.43});
  }else if(kind==="guard"||kind==="shield"){
   noise(t,.18,V(.11),3400,1200);
   chord(t,[53,60,65],V(.048),"triangle",.36);
  }else if(kind==="heal"||kind==="mana"){
   [0,4,7,12].forEach((n,i)=>voice(hz(65+n+(kind==="mana"?2:0)),t+.09*i,.34,{amp:V(.045),wave:"sine",pitch:1.08}));
   noise(t+.1,.28,V(.026),1600,5400,{type:"highpass"});
  }else if(kind==="boss"){
   voice(70,t,.65,{amp:V(.12),wave:"sawtooth",pitch:.5,filter:"lowpass",cutoff:450});
   voice(103,t+.15,.58,{amp:V(.085),wave:"triangle",pitch:.65});noise(t+.14,.55,V(.09),900,70);
  }else if(kind==="victory"||kind==="level"){
   [0,4,7,12,16].forEach((n,i)=>voice(hz(60+n),t+i*.12,.39,{amp:V(.048),wave:"triangle"}));
  }else if(kind==="defeat"){
   [0,-3,-5,-12].forEach((n,i)=>voice(hz(52+n),t+i*.19,.45,{amp:V(.045),wave:"sawtooth",filter:"lowpass",cutoff:600}));
  }else if(kind==="buy"||kind==="coin"){
   voice(1050,t,.07,{amp:V(.035),wave:"sine"});voice(1430,t+.07,.17,{amp:V(.033),wave:"sine"});noise(t,.07,V(.03),3600,1400);
  }else if(kind==="gacha"){
   for(let i=0;i<7;i++)voice(hz(58+i*2),t+i*.07,.33,{amp:V(.045),wave:"sine",pitch:1.28});
  }else if(kind==="ui"){
   voice(540,t,.075,{amp:V(.025),wave:"triangle",pitch:1.25});
  }else if(kind==="step"){
   noise(t,.07,V(.045),400,180,{type:"lowpass"});
  }
 }catch(_){/* browser audio blocked or unsupported: silently retain game functionality */}
}
function setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));if(master&&ctx)master.gain.setTargetAtTime(volume,ctx.currentTime,.05);return volume}
function setSfxVolume(value){sfxVolume=Math.max(0,Math.min(1,Number(value)||0));if(fxBus&&ctx)fxBus.gain.setTargetAtTime(sfxVolume,ctx.currentTime,.05);return sfxVolume}
function stop(){if(ticker)clearInterval(ticker);ticker=null;musicOn=false;if(ctx)musicBus.gain.setTargetAtTime(.0001,ctx.currentTime,.06)}
window.SoulboundAudio={sfx,setMusic,setScene,setVolume,setSfxVolume,stop,get musicOn(){return musicOn},get volume(){return volume},get scene(){return scene},get sfxVolume(){return sfxVolume}};
})();

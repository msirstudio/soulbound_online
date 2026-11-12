/* SOULBOUND v0.26.1 - original procedural soundtrack and game audio.
   Pure Web Audio, no external downloads or third-party assets. */
(()=>{
 "use strict";
 let ctx,master,musicBus,fxBus,loop=null,step=0,musicOn=false;
 let volume=.72,sfxVolume=1,scene="wilds",combat=false, lastSfx=Object.create(null);
 const scales={
  wilds:{root:220,notes:[0,2,3,7,9,10,12,14],bpm:86,wave:"sine"},
  ruins:{root:196,notes:[0,2,5,7,10,12,14,17],bpm:78,wave:"triangle"},
  cavern:{root:164.81,notes:[0,1,3,6,7,9,10,12],bpm:96,wave:"sawtooth"},
  frost:{root:246.94,notes:[0,2,5,7,9,12,14,17],bpm:72,wave:"sine"},
  abyss:{root:146.83,notes:[0,1,5,6,8,12,13,17],bpm:73,wave:"triangle"},
  castle:{root:174.61,notes:[0,2,3,7,8,10,12,15],bpm:94,wave:"triangle"}
 };
 const clamp=(v)=>Math.max(0,Math.min(1,Number(v)||0));
 const hz=(base,semitones)=>base*Math.pow(2,semitones/12);
 function engine(){
  const AudioCtor=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtor)return null;
  if(!ctx){
   ctx=new AudioCtor();
   master=ctx.createGain();master.gain.value=volume;const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=9;limiter.ratio.value=10;limiter.attack.value=.003;limiter.release.value=.16;master.connect(limiter);limiter.connect(ctx.destination);
   musicBus=ctx.createGain();musicBus.gain.value=.25;musicBus.connect(master);
   fxBus=ctx.createGain();fxBus.gain.value=sfxVolume;fxBus.connect(master);
  }
  if(ctx.state==="suspended")ctx.resume().catch(()=>{});
  return ctx;
 }
 function tone(freq,duration=.2,type="sine",gain=.035,delay=0,target="fx",endFreq=null){
  const c=engine();if(!c)return;
  const t=c.currentTime+Math.max(0,delay),o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(Math.max(25,freq),t);
  if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(25,endFreq),t+duration);
  g.gain.setValueAtTime(.0001,t);
  g.gain.exponentialRampToValueAtTime(Math.max(.00011,gain),t+Math.min(.04,Math.max(.005,duration*.15)));
  g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  o.connect(g);g.connect(target==="music"?musicBus:fxBus);
  o.start(t);o.stop(t+duration+.02);
 }
 function noise(duration=.2,gain=.04,highpass=350,delay=0){
  const c=engine();if(!c)return;
  const len=Math.max(100,Math.floor(c.sampleRate*duration)),buffer=c.createBuffer(1,len,c.sampleRate),d=buffer.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
  const source=c.createBufferSource(),filter=c.createBiquadFilter(),env=c.createGain();
  source.buffer=buffer;filter.type="highpass";filter.frequency.value=highpass;
  const t=c.currentTime+Math.max(0,delay);env.gain.setValueAtTime(Math.max(.0001,gain),t);
  env.gain.exponentialRampToValueAtTime(.0001,t+duration);
  source.connect(filter);filter.connect(env);env.connect(fxBus);source.start(t);source.stop(t+duration+.01);
 }
 /* v0.26.1b: separate metal edge, air swing and blade impact layers.
    Oscillators only carry a small tonal shimmer; noise supplies real attack texture. */
 function sword(){
  noise(.075,.26,1450);
  tone(1560,.075,"sawtooth",.055,0,"fx",520);
  noise(.19,.20,2400,.034);
  tone(230,.105,"triangle",.12,.075,"fx",90);
  noise(.10,.12,500,.11);
 }
 function blunt(){
  noise(.055,.11,600);
  tone(138,.26,"triangle",.20,0,"fx",46);
  noise(.20,.23,90,.03);
  tone(88,.27,"sine",.16,.045,"fx",39);
 }
 function magic(){
  noise(.24,.14,1400);
  [0,5,7,12].forEach((n,i)=>tone(hz(295,n),.36,"sine",.075,i*.034,"fx",hz(480,n)));
  tone(95,.32,"triangle",.09,.06,"fx",45);
 }
 function guard(){noise(.16,.16,1750);tone(940,.28,"triangle",.09,0,"fx",410);tone(385,.35,"sine",.075,.02,"fx",220)}
 function heal(){[523.25,659.25,783.99,1046.5].forEach((n,i)=>tone(n,.37,"sine",.035,i*.10))}
 function hit(){noise(.12,.19,180);tone(170,.20,"triangle",.15,0,"fx",58);noise(.055,.11,800,.026)}
 function ui(){tone(780,.065,"sine",.018);tone(1040,.085,"sine",.01,.055)}
 function win(){[392,523.25,659.25,784,1046.5].forEach((n,i)=>tone(n,.4,"triangle",.04,i*.12))}
 function lose(){[392,330,261.63,196,130.81].forEach((n,i)=>tone(n,.41,"triangle",.037,i*.17))}
 function boss(){tone(66,.85,"sawtooth",.055);tone(98,.75,"triangle",.035,.18);noise(.35,.025,120,.1)}
 function sfx(name,details={}){
  try{
   const now=Date.now();if(now-(lastSfx[name]||0)<55)return;lastSfx[name]=now;
   if(name==="attack"){if(/staff|wand|spell/i.test(details.weapon||""))magic();else if(/mace|hammer|axe|maul/i.test(details.weapon||""))blunt();else sword()}
   else if(name==="skill"){if(details.classId==="mage")magic();else{tone(330,.28,"sawtooth",.05,0,"fx",900);sword()}}
   else if(name==="hit")hit();else if(name==="heal")heal();else if(name==="mana")magic();else if(name==="guard")guard();
   else if(name==="victory")win();else if(name==="defeat")lose();else if(name==="boss")boss();
   else if(name==="levelup"){[294,440,587,880].forEach((f,i)=>tone(f,.42,"sine",.06,i*.08));noise(.30,.08,1400)}else if(name==="buy"||name==="menu"||name==="equip")ui();
  }catch(err){/* audio errors must never interrupt the game */ }
 }
 const patterns={
  wilds:[0,2,4,5,4,2,1,2, 3,4,6,5,4,2,1,0],
  ruins:[0,2,3,4,5,4,2,1, 0,3,5,6,5,3,2,0],
  cavern:[0,0,2,1,4,2,1,0, 3,4,3,2,6,4,2,1],
  frost:[0,2,4,6,5,4,2,0, 1,3,5,7,5,3,1,0],
  abyss:[0,5,3,1,4,3,6,2, 0,2,5,6,4,2,1,0],
  castle:[0,2,4,7,6,4,3,1, 0,3,5,7,6,4,2,0]
 };
 function tick(){
  if(!musicOn)return;
  try{
   const c=engine();if(!c)return;
   const cfg=scales[scene]||scales.wilds;
   const n=step%16,bar=Math.floor(step/16)%4,motif=patterns[scene]||patterns.wilds;
   const chord=[0,3,5].map(i=>hz(cfg.root,cfg.notes[(i+bar)%cfg.notes.length]-12));
   if(n%4===0){
    chord.forEach((f,i)=>tone(f,1.45,i===0?"triangle":"sine",i===0?.026:.013,0,"music"));
    tone(chord[0]/2,.85,"sine",.021,0,"music");
   }
   const note=hz(cfg.root,cfg.notes[motif[n]%cfg.notes.length]);
   tone(note,n%4===0?.37:.23,cfg.wave,combat?.019:.014,0,"music");
   if(n%2===0)tone(note/2,.15,"triangle",.006,0,"music");
   if(combat&&n%4===0)tone(74,.11,"triangle",.012,0,"music",54);
   step++;
   loop=setTimeout(tick,60000/cfg.bpm/2);
  }catch(e){loop=setTimeout(tick,500)}
 }
 function setMusic(on){
  musicOn=!!on;
  if(loop){clearTimeout(loop);loop=null}
  if(musicOn){const c=engine();if(c&&musicBus)musicBus.gain.setTargetAtTime(.32,c.currentTime,.13);step=0;tick()}
  else if(ctx&&musicBus)musicBus.gain.setTargetAtTime(.00001,ctx.currentTime,.08);
  return musicOn;
 }
 function setVolume(v){volume=clamp(v);if(ctx&&master)master.gain.setTargetAtTime(volume,ctx.currentTime,.05);return volume}
 function setSfxVolume(v){sfxVolume=clamp(v);if(ctx&&fxBus)fxBus.gain.setTargetAtTime(sfxVolume,ctx.currentTime,.05);return sfxVolume}
 function setScene(name){const next=scales[name]?name:"wilds";if(scene!==next){scene=next;step=0}return scene}
 function setCombatMood(active){combat=!!active}
 window.SoulboundAudio={sfx,setMusic,setVolume,setSfxVolume,setScene,setCombatMood,get musicOn(){return musicOn},get volume(){return volume},get sfxVolume(){return sfxVolume},get scene(){return scene}};
})();

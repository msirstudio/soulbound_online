"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("public/index.html"),game=read("public/game.js");
const css=read("public/v041.css"),ui=read("public/ui-foundation-v041.js");
function harness(){
 const registry={},listeners={},sound={musicOn:false,sfxVolume:1};
 class Element{
  constructor(id=""){this.id=id;this.hidden=false;this.dataset={};this.attrs={};
   this.listeners={};this.childNodes=[];this.classList={
    values:new Set(),add:k=>this.classList.values.add(k),
    remove:k=>this.classList.values.delete(k),
    contains:k=>this.classList.values.has(k),toggle:(k,yes)=>{if(yes===false)this.classList.values.delete(k);else this.classList.values.add(k)}
   }}
  addEventListener(kind,fn){this.listeners[kind]=fn}
  setAttribute(key,value){this.attrs[key]=String(value)}
  getAttribute(key){return this.attrs[key]??null}
  click(){this.listeners.click?.({target:this});this.onclick?.()}
  focus(){doc.activeElement=this}
  appendChild(el){this.childNodes.push(el);if(el.id)registry[el.id]=el}
  prepend(el){this.childNodes.unshift(el);this.prepended=el}
  querySelector(key){if(key===".game-side-column")return registry.side;
   if(key===".v041-drawer-head")return this.prepended||null;
   if(key===".v041-drawer-head button")return registry.v041DrawerClose;
   return null}
 }
 const ids=["v041Front","account","lobby","game","v041Settings","v041Play",
  "v041NewHero","v041Account","v041SettingsOpen","v041SettingsClose",
  "v041AccountBack","v041LobbyBack","v041MusicSetting","v041SoundSetting",
  "v041LanguageSetting","v041PartyOpen","v041ChatOpen","v041LogOpen",
  "v041DrawerTitle","v041DrawerClose","v041ViewStatus","v041PlayerMeta",
  "musicToggle","sfxQuick","v038Lang","email","chatInput"];
 for(const id of ids)registry[id]=new Element(id);
 registry.side=new Element("side");
 registry.game.hidden=true;registry.lobby.hidden=true;registry.v041Settings.hidden=true;
 registry.musicToggle.addEventListener("click",()=>{sound.musicOn=!sound.musicOn});
 registry.sfxQuick.addEventListener("click",()=>{sound.sfxVolume=sound.sfxVolume?0:1});
 registry.v038Lang.addEventListener("click",()=>{sound.languageToggled=true});
 const doc={readyState:"complete",activeElement:null,body:{dataset:{}},
  createElement:()=>new Element(),getElementById:id=>registry[id]||null,
  addEventListener:(event,fn)=>{listeners[event]=fn}};
 const win={SoulboundAudio:sound};vm.runInNewContext(ui,{document:doc,window:win});
 return{api:win.SoulboundUIV41,elements:registry,document:doc,sound,listeners};
}
test("main menu is the landing view, login and lobby are separate",()=>{
 const {api,elements,document}=harness();
 assert.equal(api.getView(),"menu");assert.equal(elements.account.hidden,true);
 assert.equal(elements.lobby.hidden,true);assert.equal(document.body.dataset.v041View,"menu");
 elements.v041Play.click();assert.equal(api.getView(),"account");
 api.onAuth({id:"user-1",email:"hero@example.com"});assert.equal(api.getView(),"lobby");
 elements.v041LobbyBack.click();assert.equal(api.getView(),"menu");
 api.onAuth(null);assert.equal(api.getView(),"menu");
});
test("existing game state is not changed by navigation and drawer opens/closes correctly",()=>{
 const {api,elements}=harness();
 const state={status:"battle",stage:9,players:[{id:"p",name:"Knight",level:10},{id:"q",name:"Mage",level:10}]};
 elements.game.hidden=false;api.enterGame();api.updateGame(state,state.players[0]);
 assert.equal(api.getView(),"game");assert.equal(elements.v041PlayerMeta.textContent,"LV 10 · Knight");
 assert.match(elements.v041PartyOpen.textContent,/2/);
 elements.v041ChatOpen.click();
 assert.equal(elements.game.classList.contains("v041-drawer-open"),true);
 assert.equal(elements.side.dataset.v041Tab,"chat");assert.equal(elements.v041ChatOpen.getAttribute("aria-expanded"),"true");
 elements.v041ChatOpen.click();assert.equal(elements.game.classList.contains("v041-drawer-open"),false);
 elements.v041LogOpen.click();assert.equal(elements.side.dataset.v041Tab,"log");
 elements.v041DrawerClose.click();assert.equal(elements.game.classList.contains("v041-drawer-open"),false);
 assert.equal(state.stage,9);
});
test("settings controls operate the original audio buttons without changing game state",()=>{
 const {api,elements,sound,listeners}=harness();
 elements.v041SettingsOpen.click();assert.equal(elements.v041Settings.hidden,false);
 elements.v041MusicSetting.click();assert.equal(sound.musicOn,true);
 elements.v041SoundSetting.click();assert.equal(sound.sfxVolume,0);
 elements.v041LanguageSetting.click();assert.equal(sound.languageToggled,true);
 listeners.keydown({key:"Escape"});assert.equal(elements.v041Settings.hidden,true);
 assert.equal(api.getView(),"menu");
});
test("UI code keeps existing game hooks, saves and party calls intact",()=>{
 assert.match(game,/SoulboundUIV41\?\.onAuth\(u\)/);
 assert.match(game,/SoulboundUIV41\?\.onPrepared\(\)/);
 assert.equal((game.match(/SoulboundUIV41\?\.enterGame\(\)/g)||[]).length,3,"Create, Join, and Reconnect must all restore gameplay UI");
 assert.match(game,/SoulboundUIV41\?\.updateGame\(s,v040Me\)/);
 for(const marker of ['id="v041Front"','id="v041Settings"','id="v041PartyOpen"','id="v041ChatOpen"','id="v041LogOpen"','class="v041-lobby-grid"','src="ui-foundation-v041.js"','href="v041.css"'])
  assert.ok(html.includes(marker),"Missing HTML anchor: "+marker);
 const gameScript=html.match(/src="game[.]js(?:[?]v=[^"]+)?"/);
 assert.ok(gameScript && html.indexOf('src="ui-foundation-v041.js"')<html.indexOf(gameScript[0]));
 for(const marker of ["@media","prefers-reduced-motion","#game .game-side-column","#v041Front","#lobby .v041-lobby-grid"])
  assert.ok(css.includes(marker),"Missing CSS foundation: "+marker);
});
test("v0.41 changes presentation only; world Save / boss rules still refer to v0.40 model",()=>{
 assert.match(game,/SoulboundWorldV40\?\.render/);
 assert.match(game,/v40MergeWorld/);
 const world=require("../world-v040");
 assert.equal(world.totalStages,40);assert.equal(world.regions.length,8);
 assert.equal(world.canEnter(10,1),true);assert.equal(world.canEnter(10,2),false);
});

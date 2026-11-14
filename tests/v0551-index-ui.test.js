"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const combat=require("../combat-v055");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function catalog(){
 const boss={id:"stage-5",name:"The Briarfang Alpha",stage:5,boss:true,miniBoss:false,
  regionId:"cursed_wilds",zone:"THE CURSED WILDS",icon:"🐺",sprite:"boss-briarfang",
  hp:260,atk:22,def:7,xp:130,gold:90,loot:"Independent drops",drops:[],partySize:1};
 return {version:"0.55.2",monsters:[{...boss,...combat.enemyCodex(boss)}],
  items:[],races:[],zones:[],codex:combat.codexData()};
}
function browserHarness(){
 const registry=new Map(),listeners={};
 class Element {
  constructor(tag="div"){this.tag=tag;this.hidden=false;this.children=[];this.value="";this.id="";
    this.classList={add(){},remove(){},toggle(){}};
  }
  setAttribute(){}
  addEventListener(name,callback){this.events??={};this.events[name]=callback}
  appendChild(child){
   this.children.push(child);
   if(child.id)registry.set(child.id,child);
   if(child.id==="v035Index"){
    for(const id of ["v035Exit","v035Search","v035Rarity","v035Tabs","v035Results",
      "v035Details","v035Status","v035CategoryTitle","v035Count","v035Close"]){
      const node=new Element();node.id=id;registry.set(id,node);
    }
   }
   return child;
  }
  querySelector(){return null}
  querySelectorAll(){return []}
  getClientRects(){return [1]}
  focus(){}
 }
 const body=new Element("body"),game=new Element("main");
 game.id="game";registry.set("game",game);
 const document={readyState:"loading",body,activeElement:new Element("button"),
  getElementById:id=>registry.get(id)||null,querySelector(){return null},
  createElement:tag=>new Element(tag),
  addEventListener:(name,callback)=>{listeners[name]=callback}};
 const requests=[];
 const context={document,window:{},fetch:async(url,options)=>{
  requests.push({url,options});return {ok:true,json:async()=>catalog()};
 },console};
 vm.runInNewContext(read("public/adventure-index-v0552.js"),context);
 assert.equal(typeof listeners.DOMContentLoaded,"function");
 listeners.DOMContentLoaded();
 return {context,requests,element:id=>registry.get(id)};
}
test("browser loads a uniquely versioned INDEX script and not the old cached v035 script",()=>{
 const html=read("public/index.html");
 assert.match(html,/src="adventure-index-v0552[.]js[?]v=[^"]+"/);
 assert.ok(!html.includes('src="adventure-index-v035.js"'));
 assert.ok(html.includes('href="v0551-index-status-boss.css"'));
 assert.ok(html.includes("v0.56.3"));
});
test("interactive INDEX renders all 3 new guides and immediate boss affinity/attack summary",async()=>{
 const h=browserHarness();
 await h.context.window.SoulboundIndex.open();
 const tabs=h.element("v035Tabs").innerHTML;
 for(const label of ["ELEMENTS","STATUS","COMBAT RULES"])
  assert.ok(tabs.includes(label),label+" is missing from actual rendered tabs");
 const detail=h.element("v035Details").innerHTML;
 assert.ok(detail.includes("v0551-boss-quick"),"quick guide displayed before image");
 assert.ok(detail.indexOf("v0551-boss-quick")<detail.indexOf("v035-enemy-art"));
 assert.ok(detail.includes("WEAK"));
 assert.ok(detail.includes('element_fire.png'),"Boss weakness should display a Fire icon");
 assert.ok(detail.includes("Briarstorm"));
 assert.ok(detail.includes("55%"));
 assert.ok(detail.includes("ATTACK MOVES / STATUS CHANCES"));
 assert.ok(h.requests[0].url.includes("codex=0.55.2"));
 assert.equal(h.requests[0].options.cache,"no-store");
 assert.ok(h.element("v035Status").textContent.includes("INDEX UI v0.55.2"));
 await h.context.window.SoulboundIndex.open("statuses");
 assert.equal(h.element("v035CategoryTitle").textContent,"STATUS");
 assert.ok(h.element("v035Results").innerHTML.includes("Chill"));
 await h.context.window.SoulboundIndex.open("elements");
 assert.equal(h.element("v035CategoryTitle").textContent,"ELEMENTS");
 assert.ok(h.element("v035Results").innerHTML.includes("Fire"));
 await h.context.window.SoulboundIndex.open("combat");
 assert.equal(h.element("v035CategoryTitle").textContent,"COMBAT RULES");
 assert.ok(h.element("v035Results").innerHTML.includes("STAGGER"));
});
test("combat renders small status icons with remaining turns and links to INDEX Status guide",()=>{
 const game=read("public/game.js"),html=read("public/index.html"),css=read("public/v0551-index-status-boss.css");
 for(const id of ["burn","poison","bleed","weaken","freeze","stun","chill"])
  assert.ok(game.includes(id+":"),"missing visible icon for "+id);
 assert.ok(game.includes("window.SoulboundIndex?.open(\"statuses\")"));
 assert.ok(game.includes("v0551MonsterStatuses"));
 assert.ok(game.includes("v0551-status-icon"));
 assert.ok(html.includes('id="v0551MonsterStatuses"'));
 assert.ok(css.includes(".v0551-status-icon"));
 assert.ok(css.includes(".v0551-ward-icon"));
 assert.equal(combat.codexData().statusEffects.length,7);
});
test("boss badge is plain text without panel, while keeping mini and phase-2 identification",()=>{
 const css=read("public/v0551-index-status-boss.css"),game=read("public/game.js");
 assert.ok(css.includes("background:none!important"));
 assert.ok(css.includes("border:0!important"));
 assert.ok(css.includes("box-shadow:none!important"));
 assert.ok(css.includes("min-width:0!important"));
 assert.ok(game.includes('"MINI BOSS"'));
 assert.ok(game.includes('"MAIN BOSS"'));
 assert.ok(game.includes("PHASE 2"));
});

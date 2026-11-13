"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function harness(){
 const arena={children:[],appendChild(child){this.children.push(child);child.parentNode=this;}};
 const city={children:[],appendChild(child){this.children.push(child);child.parentNode=this;}};
 const document={
  getElementById(id){return id==="arena"?arena:id==="v040City"?city:null},
  createElement(tag){return {tagName:tag,style:{setProperty(){}},setAttribute(){},remove(){this.parentNode?.children.splice(this.parentNode.children.indexOf(this),1);this.parentNode=null},appendChild(child){(this.children??=[]).push(child)},textContent:""}}
 };
 const context={window:{},document,setTimeout:()=>1,clearTimeout(){}};
 vm.runInNewContext(read("public/reward-float-v0411.js"),context);
 return {...context,arena,city,api:context.window.SoulboundRewardV411};
}
function state(status,inventory,level=25,xp=90,gold=100){
 return {code:"ABCD",stage:5,status,monster:{hp:0,maxHp:200,boss:true,miniBoss:false,name:"Boss"},players:[{id:"me",level,xp,gold,inventory}]};
}
test("main-boss regionClear rewards are rendered on visible arena, never hidden city",()=>{
 const h=harness();
 const before=state("battle",[],25,80,500);
 const after=state("regionClear",[{uid:"loot-1",name:"Briarfang Blade",rarity:"rare"},{uid:"loot-2",name:"Briarfang Ring",rarity:"epic"}],26,20,620);
 const result=h.api.show(before,after,"me");
 assert.ok(result,"reward calculation should succeed");
 assert.equal(result.gold,120);
 assert.equal(result.xp,2440,"level up EXP gain includes spent threshold for level 25");
 assert.equal(result.items.length,2);
 assert.equal(h.arena.children.length,1);
 assert.equal(h.city.children.length,0,"nothing should render inside hidden city after boss clear");
 assert.equal(h.arena.children[0].children.length,4,"Gold, EXP and both items");
});
test("zero-drop boss victory still reports EXP/Gold and no equipment",()=>{
 const h=harness();
 const a=state("battle",[],15,20,100),b=state("regionClear",[],15,70,130);
 const reward=h.api.show(a,b,"me");
 assert.equal(reward.items.length,0);
 const labels=h.arena.children[0].children.map(x=>x.textContent);
 assert.ok(labels.some(x=>x.includes("No equipment drop")));
 assert.ok(labels.some(x=>x.includes("GOLD")));
 assert.ok(labels.some(x=>x.includes("EXP")));
});
test("normal/mini victories and independent per-player inventory stay valid",()=>{
 const h=harness(),before=state("battle",[{uid:"existing",name:"Old",rarity:"common"}]),after=state("victory",[{uid:"existing",name:"Old",rarity:"common"},{uid:"new",name:"New",rarity:"rare"}]);
 after.monster.boss=false;after.monster.miniBoss=true;
 assert.equal(h.api.show(before,after,"me").items.length,1);
 assert.equal(h.arena.children.length,1);
 assert.equal(h.city.children.length,0);
 assert.equal(h.api.rewardFrom(before,after,"other"),null);
});
test("inventory overview reads real player progression and preserves item actions",()=>{
 const js=read("public/equipment-inventory-v032.js"),css=read("public/v0485-character-overview.css");
 for(const id of ["v0485HeroOverview","v032Slots","v032Bag","v044Actions","v034Discard"]){assert.ok(js.includes(id),id)}
 for(const field of ["me.raceName","me.raceRarity","me.racePassive","me.raceBuffs","me.classPath","me.strength","me.vitality","me.intelligence","me.agility","me.statPoints","me.racePoints","me.gold","me.hp","me.mp","me.xp","me.level"]){assert.ok(js.includes(field),field)}
 for(const mark of ['v0485-meter-track','v0485-meter','role="progressbar"'])assert.ok(js.includes(mark),mark);
 for(const kind of ['hp','mp','xp'])assert.ok(css.includes('.v0485-'+kind+' i'),kind+' color');
 assert.ok(js.includes("xpNeed=level*100"));
 assert.ok(js.includes("9 equipment slots"));
 assert.ok(js.includes('data-v044-action="equip"'));
 assert.ok(js.includes('data-v044-action="unequip"'));
 assert.ok(css.includes('@media(max-width:650px)'));
});
test("v0.55 release links and version are aligned",()=>{
 const html=read("public/index.html"),log=read("public/update-log-v045.js");
 const pkg=require("../package.json");
 assert.equal(pkg.version,"0.55.2");
 assert.ok(html.includes("VERSION 0.55.2 · ELEMENTAL RULES"));
 assert.ok(html.includes('href="v0485-character-overview.css"'));
 assert.ok(log.includes('version:"0.55"'));
});

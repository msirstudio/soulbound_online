"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const loot=require("../loot-v034"),world=require("../world-v040");
const read=name=>fs.readFileSync(path.join(__dirname,"..",name),"utf8");
function hero(classId="swordsman"){return {name:"Tester",classId,level:75,atk:150,def:95,maxHp:900,maxMp:350,hp:900,mp:350,inventory:[],worldProgress:world.normalizeProgress(null)}}
test("eight boss pools expose 1-4 items and mini-boss pools 1-2, with rare total odds",()=>{
 let bossDistinct=0,miniDistinct=0;
 for(let i=1;i<=8;i++){
  const boss=loot.bossDrops(i),mini=loot.miniDrops(i);
  assert.ok(boss.length>=1&&boss.length<=4);
  assert.ok(mini.length>=1&&mini.length<=2);
  for(const arr of [boss,mini]){
   const total=arr.reduce((n,x)=>n+x.chance,0);
   assert.ok(total>0&&total<=25,"Unusually high drop chance at "+i+": "+total);
   assert.equal(new Set(arr.map(x=>x.id)).size,arr.length);
   for(const item of arr){assert.ok(item.name);assert.ok(loot.factory(item.id,item.rarity));}
  }
  bossDistinct+=boss.length;miniDistinct+=mini.length;
 }
 assert.equal(bossDistinct,25);assert.equal(miniDistinct,12);
});
test("stage 4 mini boss drops correctly, stage 5 main boss drops, ordinary stage cannot",()=>{
 const original=Math.random;
 try{
  Math.random=()=>0;
  const h=hero(),min=loot.dropEncounterLoot(h,4,()=>{},1,true);
  assert.ok(min&&min.id.startsWith("mini1_"));
  assert.ok(h.worldProgress.lootSeen.includes(min.id+":"+min.rarity));
  const boss=loot.dropEncounterLoot(h,5,()=>{},1,false);
  assert.ok(boss&&boss.id.startsWith("boss1_"));
  assert.equal(loot.dropEncounterLoot(h,2),null);
  assert.equal(h.inventory.length,2);
  const restored=world.normalizeProgress(h.worldProgress);
  assert.equal(restored.lootSeen.length,2);
 }finally{Math.random=original}
});
test("late-game rare equipment is not guaranteed even after a win",()=>{
 const old=Math.random;try{
  Math.random=()=>0.9;
  for(const stage of [4,5,14,15,34,35,39,40]){
   const h=hero();assert.equal(loot.dropEncounterLoot(h,stage),null);
   assert.equal(h.inventory.length,0);
  }
 }finally{Math.random=old}
});
test("old inventory, new mini gear and class-gated equipment restore safely",()=>{
 const mage=hero("mage"),sword=hero("swordsman");
 const item=loot.factory("mini7_main","epic");
 assert.equal(item.class,"mage");
 mage.inventory=[{...item,uid:"unitTestABCD01"}];
 sword.inventory=[{...item,uid:"unitTestABCD02"}];
 assert.equal(loot.equip(sword,sword.inventory[0].uid,"main").ok,false);
 assert.equal(loot.equip(mage,mage.inventory[0].uid,"main").ok,true);
 const restored=loot.normalizeInventory(JSON.parse(JSON.stringify(mage.inventory)),[]);
 assert.equal(restored.length,1);assert.equal(restored[0].equippedSlot,"main");
});
test("UI wiring includes independent collection, full inventory, stats and confined side dock",()=>{
 const game=read("public/game.js"),ui=read("public/ui-foundation-v041.js"),inv=read("public/equipment-inventory-v032.js"),index=read("public/adventure-index-v035.js"),css=read("public/v044-ui.css");
 assert.match(game,/SoulboundIndex\?\.updateHero/);
 assert.match(ui,/v044-drawer-in-scene/);
 assert.match(inv,/data-v044-action="equip"/);
 assert.match(inv,/data-v044-action="unequip"/);
 assert.match(inv,/v044-stats-bar/);
 assert.match(index,/raceDetail/);assert.match(index,/v044-discovered/);
 assert.match(css,/v044-incompatible/);
});

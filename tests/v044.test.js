"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const loot=require("../loot-v034"),world=require("../world-v040");
const read=name=>fs.readFileSync(path.join(__dirname,"..",name),"utf8");
function hero(classId="swordsman"){return {name:"Tester",classId,level:75,atk:150,def:95,maxHp:900,maxMp:350,hp:900,mp:350,inventory:[],worldProgress:world.normalizeProgress(null)}}
test("all loot chances fall inside their rarity-defined bands",()=>{
 let bossTotal=0,miniTotal=0;
 for(let i=1;i<=8;i++){
  const boss=loot.bossDrops(i),mini=loot.miniDrops(i);
  assert.ok(boss.length>=1&&mini.length>=1);
  bossTotal+=boss.length;miniTotal+=mini.length;
  for(const rows of [boss,mini]){
   assert.equal(new Set(rows.map(it=>it.id)).size,rows.length);
   for(const it of rows){
    const band=loot.CHANCE_BANDS[it.rarity];
    assert.ok(it.chance>=band[0]&&it.chance<=band[1],
      it.name+" "+it.chance+"% is outside "+band.join("-")+"%");
    assert.ok(loot.factory(it.id,it.rarity));
   }
  }
 }
 assert.equal(bossTotal,41);assert.equal(miniTotal,27);
});
test("all listed drops succeed on independent favorable rolls",()=>{
 const old=Math.random;
 try{
  Math.random=()=>0;
  const h=hero(),mini=loot.dropEncounterLoot(h,4,()=>{},1,true);
  assert.equal(mini.length,loot.miniDrops(1).length);
  const boss=loot.dropEncounterLoot(h,5,()=>{},1,false);
  assert.equal(boss.length,loot.bossDrops(1).length);
  assert.equal(h.inventory.length,mini.length+boss.length);
  for(const it of [...mini,...boss])assert.ok(h.worldProgress.lootSeen.includes(it.id+":"+it.rarity));
  assert.deepEqual(loot.dropEncounterLoot(h,2),[]);
  assert.equal(world.normalizeProgress(h.worldProgress).lootSeen.length,h.inventory.length);
 }finally{Math.random=old}
});
test("unfavorable rolls award nothing, including each legendary",()=>{
 const old=Math.random;
 try{
  Math.random=()=>0.99;
  for(const stage of [4,5,14,15,34,35,39,40]){
   const h=hero();assert.deepEqual(loot.dropEncounterLoot(h,stage),[]);assert.equal(h.inventory.length,0);
  }
 }finally{Math.random=old}
});
test("bag collects as many independent successes as remaining free slots",()=>{
 const old=Math.random;
 try{
  Math.random=()=>0;
  const h=hero();h.inventory=Array.from({length:38},(_,i)=>({...loot.factory("boss1_boots","uncommon"),uid:"test"+String(i).padStart(8,"0")}));
  const won=loot.dropEncounterLoot(h,5);
  assert.equal(won.length,2);assert.equal(loot.bagUsed(h),40);
  assert.equal(new Set(h.inventory.map(it=>it.uid)).size,40);
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

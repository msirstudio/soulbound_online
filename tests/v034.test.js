"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const loot=require("../loot-v034");const world=require("../world-v040");const combat=require("../combat-v054");const advanced=require("../combat-v055");
const shop=[{id:"iron_sword",name:"Iron Sword",slot:"weapon",value:8,level:1,class:"swordsman"},{id:"iron_armor",name:"Iron Armor",slot:"armor",defense:5,maxHp:20,level:1}];
function hero(){return{name:"Tester",classId:"swordsman",level:20,atk:25,def:10,maxHp:100,maxMp:40,hp:100,mp:40,weapon:"Training Sword",armor:"Traveler Armor",weaponItem:null,armorItem:null,inventory:[]}}
function gear(slot,rarity="rare",boss=3){return loot.canonical({id:"boss"+boss+"_"+slot,rarity},shop)}
test("boss rewards are curated and include a no-drop chance",()=>{
 const p=hero();assert.deepEqual(loot.dropBossLoot(p,1),[]);assert.equal(p.inventory.length,0);
 const original=Math.random;try{Math.random=()=>0;const items=loot.dropBossLoot(p,5);assert.ok(items.length>=2&&items.every(it=>it.uid));assert.equal(p.inventory.length,items.length);const other=hero();Math.random=()=>.99;assert.deepEqual(loot.dropBossLoot(other,5),[]);assert.equal(other.inventory.length,0);}finally{Math.random=original}
});
test("all five rarity tiers and all nine slots are canonical and deterministic",()=>{
 for(const slot of loot.SLOTS)for(const rarity of loot.RARITIES){
  const i=gear(slot,rarity);const j=gear(slot,rarity);
  assert.ok(i&&j);assert.deepEqual([i.value,i.defense,i.maxHp,i.maxMp],[j.value,j.defense,j.maxHp,j.maxMp]);
  assert.equal(i.rarity,rarity);assert.equal(i.slot,slot);
 }
 assert.equal(loot.SLOTS.length,9);
});
test("equip and remove all nine slots; after removing gear, stats revert",()=>{
 const p=hero();const initial={atk:p.atk,def:p.def,maxHp:p.maxHp,maxMp:p.maxMp};
 p.inventory=loot.SLOTS.map(slot=>gear(slot));
 for(const it of p.inventory){assert.equal(loot.equip(p,it.uid,it.slot).ok,true,it.slot)}
 assert.equal(p.inventory.filter(i=>i.equippedSlot).length,9);assert.equal(loot.bagUsed(p),0);
 for(const slot of loot.SLOTS)assert.equal(loot.unequip(p,slot).ok,true,slot);
 assert.deepEqual({atk:p.atk,def:p.def,maxHp:p.maxHp,maxMp:p.maxMp},initial);
 assert.equal(loot.bagUsed(p),9);
});
test("wrong slot and class mismatch are rejected by server rules",()=>{
 const p=hero();const item=gear("boots");p.inventory.push(item);
 assert.equal(loot.equip(p,item.uid,"main").ok,false);
 item.class="mage";assert.equal(loot.equip(p,item.uid,"boots").ok,false);
});
test("two rings can be worn independently",()=>{
 const p=hero();p.inventory=[gear("ring_left"),gear("ring_left")];
 assert.equal(loot.equip(p,p.inventory[0].uid,"ring_left").ok,true);
 assert.equal(loot.equip(p,p.inventory[1].uid,"ring_right").ok,true);
 assert.notEqual(p.inventory[0].uid,p.inventory[1].uid);
 assert.equal(p.inventory[1].equippedSlot,"ring_right");
});
test("40 free bag slots block rewards and unequip, not worn gear",()=>{
 const p=hero();p.inventory=Array.from({length:40},()=>gear("boots"));
 assert.equal(loot.bagUsed(p),40);assert.deepEqual(loot.dropBossLoot(p,6),[]);
 assert.equal(loot.equip(p,p.inventory[0].uid,"boots").ok,true);
 assert.equal(loot.bagUsed(p),39);
 p.inventory.push(gear("pants"));assert.equal(loot.bagUsed(p),40);
 assert.equal(loot.unequip(p,"boots").ok,false);
});
test("restore legacy shop items without losing them, and preserve 40+ old items",()=>{
 const arr=Array.from({length:41},()=>({id:"iron_sword"}));
 arr.push({...gear("neck","legendary",8),equippedSlot:"neck"});
 const items=loot.normalizeInventory(JSON.parse(JSON.stringify(arr)),shop);
 assert.equal(items.length,42);
 assert.equal(new Set(items.map(x=>x.uid)).size,42);
 assert.equal(items[0].name,"Iron Sword");
 assert.equal(items.at(-1).equippedSlot,"neck");
});
test("fallen turn is skipped, and fallen allies revive when party wins",()=>{
 const server=fs.readFileSync(path.join(__dirname,"..","server.js"),"utf8");
 const first=server.slice(server.indexOf("function current(r)"),server.indexOf("function player("));
 const other=server.slice(server.indexOf("function applyDefeat(r)"),server.indexOf("function valid(s,r)"));
 assert.ok(first.includes("function alive")&&other.includes("function finish"));
 const math=Object.create(Math);math.random=()=>0;
 const sim=new Function("raceById","encounter","say","loot","Math","world","combat","advanced",first+other+";return {monsterStrike,skipFallenTurn,finish,current,nextTurn}")(
   ()=>({reduce:0}),()=>({boss:true,hp:1,maxHp:1,atk:1000,speed:1}),()=>{},loot,math,world,combat,advanced);
 const a={...hero(),id:"a",name:"A",level:1,xp:0,gold:0,statPoints:0,hp:50,speed:10,cooldowns:{},raceId:"human",racePoints:0,foodBuffs:{def:0}};
 const b={...hero(),id:"b",name:"B",level:1,xp:0,gold:0,statPoints:0,hp:90,speed:10,cooldowns:{},raceId:"human",racePoints:0,foodBuffs:{def:0}};
 const r={players:new Map([["a",a],["b",b]]),turnIndex:0,status:"battle",stage:3,monster:{boss:true,hp:1,maxHp:1,atk:1000,def:0,name:"Boss",xp:20,gold:10,vulnerableTurns:0},log:[]};
 sim.monsterStrike(r);assert.equal(a.hp,0);assert.equal(r.status,"battle");sim.skipFallenTurn(r);assert.equal(sim.current(r).id,"b");
 sim.finish(r);assert.equal(a.hp,30);assert.equal(a.mp,8);assert.equal(r.status,"victory");
 assert.ok(a.inventory.length<=6);assert.ok(b.inventory.length<=6);
});

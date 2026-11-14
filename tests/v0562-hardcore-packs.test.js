"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const pack=require("../encounter-pack-v0562"),world=require("../world-v040");
const normal=[{name:"Wolf",sprite:"mossfang-wolf",icon:"🐺"},{name:"Knight",sprite:"cursed-knight",icon:"⚔"},{name:"Beetle",sprite:"grave-beetle",icon:"🪲"}];
const room=(stage,players)=>({stage,regionIndex:Math.floor((stage-1)/5),players:new Map(Array.from({length:players},(_,i)=>[String(i),{}]))});
const foe=stage=>({name:"Stage Foe",sprite:"mossfang-wolf",hp:100,maxHp:100,atk:20,def:4,xp:40,gold:20,regionId:world.regionForStage(stage).id});
test("All 8 regions: stages 1–3 yield base 1–2 foes, plus exactly one per friend",()=>{
 for(let region=0;region<8;region++)for(let offset=1;offset<=3;offset++)for(let players=1;players<=4;players++){
  const stage=region*5+offset,r=room(stage,players);
  pack.makeGroup(r,foe(stage),normal,()=>.01);
  assert.equal(r.enemies.length,(offset===1?1:2)+players-1,"stage "+stage+" players "+players);
  assert.ok(r.enemies.every(e=>e.enemyId&&e.hp>0&&e.hp===e.maxHp));
 }
});
test("Stages 2/3 randomly choose one or two solo, repeatable across attempts",()=>{
 for(const stage of [2,3,7,8,37,38]){
  assert.equal(pack.baseCount(stage,()=>.01),2);
  assert.equal(pack.baseCount(stage,()=>.99),1);
 }
});
test("Each enemy has independent HP and targeting; victory only when all enemies die",()=>{
 const r=room(3,1);pack.makeGroup(r,foe(3),normal,()=>0);
 const [first,second]=r.enemies;assert.equal(r.enemies.length,2);
 first.hp=0;assert.equal(pack.deadTarget(r),false);assert.equal(r.monster,second);
 assert.equal(second.hp,second.maxHp);
 assert.equal(pack.select(r,first.enemyId),null);
 assert.equal(pack.select(r,second.enemyId),second);
 second.hp=0;assert.equal(pack.deadTarget(r),true);
});
test("Boss and miniboss remain alone but are dangerous without arbitrary loot changes",()=>{
 const boss={...foe(5),boss:true,atk:22};
 const r=room(5,1);pack.makeGroup(r,boss,normal);
 assert.equal(r.enemies.length,1);
 assert.ok(r.enemies[0].atk>=47);
 assert.ok(pack.difficulty(40,1,"boss").atk>pack.difficulty(5,1,"boss").atk);
 const mini={...foe(4),miniBoss:true},r2=room(4,4);pack.makeGroup(r2,mini,normal);
 assert.equal(r2.enemies.length,1);
});

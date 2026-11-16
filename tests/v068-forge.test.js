"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const forge=require("../forge/forge-v068"),loot=require("../loot-v034"),catalog=require("../data/game-catalog-v062"),guardians=require("../forge/guardians-v068"),world=require("../world-v040");
const UUID="123e4567-e89b-42d3-a456-426614174000",UUID2="123e4567-e89b-42d3-a456-426614174001";
const known=()=>catalog.shopItems.find(x=>x.id==="iron_sword");
function player(){
 return{classId:"swordsman",name:"Test Hero",inventory:[{...known(),uid:"item-00000001"}],gold:50000,
  materials:{basic:30,refined:30,ancient:30},forgeHistory:[],
  atk:32,def:10,maxHp:130,maxMp:40,hp:130,mp:40,
  worldProgress:world.normalizeProgress(null)};
}
const source=i=>loot.canonical({...i,enhanceLevel:0},catalog.shopItems);
test("enhancement rate and stone cost table matches agreed 0.68 plan",()=>{
 assert.deepEqual([...forge.SUCCESS],[100,90,80,70,60,45,35,25,15,10]);
 assert.deepEqual([...forge.COUNT],[1,1,2,1,1,2,2,1,2,3]);
 assert.equal(forge.requirement(0).stone,"basic");
 assert.equal(forge.requirement(3).stone,"refined");
 assert.equal(forge.requirement(7).stone,"ancient");
 assert.equal(forge.requirement(9).rate,10);
 assert.equal(forge.requirement(10),null);
});
test("forge stone purchase charges server-validated Gold with strict quantities",()=>{
 const p=player();p.gold=500;
 assert.equal(forge.buyBasic(p,3).ok,true);assert.equal(p.gold,50);assert.equal(p.materials.basic,33);
 const gold=p.gold;
 for(const n of [0,-1,11,1.3,"3",NaN,Infinity]){
  assert.equal(forge.buyBasic(p,n).ok,false);
 }
 assert.equal(p.gold,gold);
});
test("100% +1 succeeds, costs one stone, persists canonical boosted item stats",()=>{
 const p=player(),base=p.inventory[0];
 const result=forge.attempt(p,{uid:base.uid,requestId:UUID},source,{random:()=>.99});
 assert.equal(result.ok,true);assert.equal(result.result.success,true);
 assert.equal(p.inventory[0].enhanceLevel,1);
 assert.equal(p.gold,50000-forge.GOLD[0]);assert.equal(p.materials.basic,29);
 assert.equal(p.inventory[0].value,Math.round(base.value*1.03));
 const restored=loot.normalizeInventory(JSON.parse(JSON.stringify(p.inventory)),catalog.shopItems)[0];
 assert.equal(restored.enhanceLevel,1);assert.equal(restored.value,p.inventory[0].value);
 assert.equal(restored.uid,p.inventory[0].uid);
});
test("failure spends materials without reducing level or breaking unique item",()=>{
 const p=player(),it=p.inventory[0];Object.assign(it,forge.upgradeStats(it,5));
 const value=it.value,oldGold=p.gold;
 const out=forge.attempt(p,{uid:it.uid,requestId:UUID},source,{random:()=>.96});
 assert.equal(out.ok,true);assert.equal(out.result.success,false);
 assert.equal(it.enhanceLevel,5);assert.equal(it.value,value);
 assert.equal(p.inventory.length,1);
 assert.equal(p.gold,oldGold-forge.GOLD[5]);assert.equal(p.materials.refined,28);
});
test("replayed request does not repeat a purchase or forge chance",()=>{
 const p=player(),request={uid:"item-00000001",requestId:UUID};
 const first=forge.attempt(p,request,source,{random:()=>0});
 const oldGold=p.gold,oldStones=p.materials.basic;
 const second=forge.attempt(p,request,source,{random:()=>.99});
 assert.equal(first.result.success,true);
 assert.equal(second.duplicate,true);assert.equal(p.gold,oldGold);assert.equal(p.materials.basic,oldStones);
});
test("forged client payload does not change server item strength, stone count or success odds",()=>{
 const p=player();
 const a=forge.attempt(p,{uid:"item-00000001",requestId:UUID,success:true,bonus:999999,rate:100,amount:1000},source,{random:()=>.5});
 assert.equal(a.ok,true);assert.equal(a.result.rate,100);
 const expected=Math.round(known().value*1.03);assert.equal(p.inventory[0].value,expected);
 assert.equal(p.materials.basic,29);
 assert.equal(forge.attempt(p,{uid:"fake",requestId:UUID2},source).ok,false);
});
test("worn enhanced gear keeps real stats and undo reverts a failed cloud save",()=>{
 const p=player(),it=p.inventory[0];it.equippedSlot="main";p.weaponItem=it;
 const startAtk=p.atk,oldValue=it.value;
 const a=forge.attempt(p,{uid:it.uid,requestId:UUID},source,{random:()=>0});
 assert.equal(a.ok,true);assert.equal(p.atk,startAtk+p.inventory[0].value-oldValue);
 a.undo();assert.equal(p.atk,startAtk);assert.equal(p.inventory[0].value,oldValue);
 assert.equal(p.inventory[0].enhanceLevel,undefined);
 assert.equal(p.weaponItem.uid,p.inventory[0].uid);
});
test("materials normalize and boss drops are capped; guardian rare drops bounded",()=>{
 assert.deepEqual(forge.normalizeMaterials({basic:-9,ancient:Infinity}),{basic:0,refined:0,ancient:0});
 const p=player();p.materials={basic:0,refined:0,ancient:0};
 assert.deepEqual(forge.rollLoot(p,{type:"normal"},()=>.99),[]);
 assert.equal(forge.rollLoot(p,{type:"boss",region:1},()=>.99).length,1);
 assert.ok(forge.rollLoot(p,{guardianId:"gorthan"},()=>.99).some(x=>x.id==="refined"));
 assert.ok(forge.rollLoot(p,{guardianId:"selunara"},()=>0).some(x=>x.id==="ancient"));
});
test("Ancient Portal requires every party member to clear the story boss before entry",()=>{
 const boss=guardians.byId("gorthan"),sel=guardians.byId("selunara");
 const hero=player();hero.worldProgress.bossDefeats[boss.unlock]=1;
 assert.equal(guardians.unlocked(hero,boss),true);
 const room={status:"city",players:new Map([["you",hero]])};
 assert.equal(guardians.eligible(room,boss.id).ok,true);
 room.players.set("friend",player());
 assert.equal(guardians.eligible(room,boss.id).ok,false);
 room.players.delete("friend");
 assert.equal(guardians.eligible({...room,status:"battle"},boss.id).ok,false);
 assert.equal(guardians.eligible(room,sel.id).ok,false);
 const before=guardians.clearCount(hero,boss.id);
 guardians.markClear(hero,boss.id);
 const stored=world.normalizeProgress(hero.worldProgress);
 assert.equal(stored.guardianClears.gorthan,before+1);
});
test("Guardian boss dynamically scales for 1–4 and remains distinct from the normal campaign",()=>{
 const g=guardians.byId("gorthan");
 const first=guardians.createEnemy(g,1),full=guardians.createEnemy(g,4);
 assert.equal(first.guardianId,g.id);assert.equal(first.boss,true);assert.equal(first.miniBoss,false);
 assert.ok(full.hp>first.hp);assert.ok(full.atk>first.atk);
 assert.equal(first.enemyId,"ancient-gorthan");
 assert.equal(world.totalStages,40);
});

test("Gorthan phase 2 breaks stone shell exactly once and boosts attack",()=>{
 const g=guardians.createEnemy(guardians.byId("gorthan"),1),room={monster:g,players:new Map(),status:"battle"};
 g.hp=Math.floor(g.maxHp/2);g.phase=2;
 const def=g.def,atk=g.atk,log=[];
 assert.equal(guardians.onPhase(room,(_room,line)=>log.push(line)),true);
 assert.ok(g.def<def);assert.ok(g.atk>atk);
 assert.equal(guardians.onPhase(room),false);assert.equal(log.length,1);
});
test("Selunara phase 2 applies a Moonlit Curse and recurring MP drain",()=>{
 const m=guardians.createEnemy(guardians.byId("selunara"),1),p={name:"Mage",hp:100,maxHp:100,mp:100,maxMp:100};
 const room={monster:m,players:new Map([["mage",p]]),status:"battle"};
 m.phase=2;const before=p.mp;
 assert.equal(guardians.onPhase(room),true);
 assert.equal(p.mp,before-12);
 assert.equal(guardians.onAttack(room),false);
 assert.equal(guardians.onAttack(room),false);
 assert.equal(guardians.onAttack(room),true);
 assert.equal(p.mp,before-20);
});

test("Actual combat Phase 2 triggers for both Ancient Guardians at half HP only",()=>{
 const combat=require("../combat-v055");
 for(const id of ["gorthan","selunara"]){
  const enemy=guardians.createEnemy(guardians.byId(id),2);
  combat.beginEncounter(enemy,{players:new Map()});
  assert.equal(enemy.phase,1,id+" should start with Phase 1");
  const sayLog=[];
  const room={monster:enemy,players:new Map(),status:"battle"};
  enemy.hp=Math.ceil(enemy.maxHp*.51);
  assert.equal(combat.checkPhase(room,(_room,msg)=>sayLog.push(msg)),false,id+" should not phase above 50%");
  enemy.hp=Math.floor(enemy.maxHp*.5);
  assert.equal(combat.checkPhase(room,(_room,msg)=>sayLog.push(msg)),true,id+" should enter Phase 2");
  assert.equal(enemy.phase,2);
  assert.ok(enemy.intent?.name,id+" Phase 2 move should be defined");
  assert.equal(enemy.intent.charge,true);
  assert.equal(guardians.onPhase(room,(_room,msg)=>sayLog.push(msg)),true);
  assert.equal(combat.checkPhase(room,()=>{}),false,"Phase 2 is one-time");
  assert.ok(sayLog.length>=2,id+" should announce both phase and unique mechanic");
 }
 const unrelated={boss:true,stage:10,regionId:"dreadforge_bastion",maxHp:100,hp:50,atk:20};
 combat.beginEncounter(unrelated,{players:new Map()});
 assert.equal(unrelated.phase,null,"Original stage 10 story boss must not gain Phase 2");
});

"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const world=require("../world-v040");

test("v0.40 defines eight 10-level regions and forty encounters",()=>{
 assert.equal(world.regions.length,8);assert.equal(world.totalStages,40);
 for(let i=0;i<8;i++){
  const r=world.regions[i];assert.equal(r.firstStage,i*5+1);
  assert.equal(r.miniStage,i*5+4);assert.equal(r.bossStage,i*5+5);
  assert.equal(r.recommendedMin,i*10+1);assert.equal(r.recommendedMax,i*10+10);
  assert.equal(r.requiredLevel,i===0?1:i*10);
  assert.equal(world.meta(r.firstStage).type,"normal");
  assert.equal(world.meta(r.miniStage).type,"mini");
  assert.equal(world.meta(r.bossStage).type,"boss");
 }
});
test("LV 10 enters region 2 even if recommended LV 11, but not region 3",()=>{
 assert.equal(world.canEnter(10,0),true);assert.equal(world.canEnter(10,1),true);
 assert.equal(world.canEnter(10,2),false);assert.equal(world.canEnter(19,2),false);
 assert.equal(world.canEnter(20,2),true);assert.equal(world.canEnter(69,7),false);
 assert.equal(world.canEnter(70,7),true);
 assert.equal(world.canEnter(999,8),false);assert.equal(world.canEnter(-1,0),false);
});
test("each region has three standard encounters, one mini and one main boss",()=>{
 const normals=Array.from({length:5},(_,i)=>({name:"Normal"+i,sprite:"mossfang-wolf",hp:90,atk:12,def:4,xp:35,gold:18}));
 const bosses=Array.from({length:8},(_,i)=>({name:"Boss"+i,sprite:"boss-briarfang",hp:260+i*100,atk:22,def:7,xp:130,gold:90}));
 const encounters=Array.from({length:40},(_,i)=>world.encounter(i+1,normals,bosses));
 assert.equal(encounters.filter(e=>e.boss).length,8);
 assert.equal(encounters.filter(e=>e.miniBoss).length,8);
 assert.equal(encounters.filter(e=>!e.boss&&!e.miniBoss).length,24);
 for(let i=0;i<8;i++){
  const boss=encounters[i*5+4],mini=encounters[i*5+3];
  assert.equal(boss.bossIndex,i+1);assert.equal(boss.bossId,world.regions[i].id);
  assert.equal(mini.name,world.regions[i].miniName);
  assert.ok(boss.maxHp>mini.maxHp);
 }
});
test("boss records count repeat victories without removing earlier region clears",()=>{
 let p=world.normalizeProgress(null);
 p=world.markBossClear(p,"cursed_wilds");p=world.markBossClear(p,"cursed_wilds");
 p=world.markBossClear(p,"ember_caverns");
 assert.equal(p.bossDefeats.cursed_wilds,2);assert.equal(p.bossDefeats.ember_caverns,1);
 assert.equal(p.defeatedBossIds.length,2);
 assert.equal(world.normalizeProgress(p).bossDefeats.cursed_wilds,2);
 assert.deepEqual(world.markBossClear(p,"bogus"),p);
});
test("authoritative server rejects a leader trying to bypass party level gates",()=>{
 const source=fs.readFileSync(path.join(__dirname,"../server.js"),"utf8");
 assert.match(source,/s\.on\("travelRegion"/);
 assert.match(source,/r\.players\.values\(\)\]\.filter\(p=>!world\.canEnter\(p\.level,index\)\)/);
 assert.match(source,/s\.on\("returnCity"/);
 assert.match(source,/r\.stage%5===0/);
});
test("city world UI, world map assets and additive cloud migration exist",()=>{
 const html=fs.readFileSync(path.join(__dirname,"../public/index.html"),"utf8");
 const ui=fs.readFileSync(path.join(__dirname,"../public/world-ui-v040.js"),"utf8");
 const sql=fs.readFileSync(path.join(__dirname,"../supabase-migration-v0.40.sql"),"utf8");
 assert.match(html,/src="world-ui-v040\.js"/);
 assert.match(html,/href="v040\.css"/);
 assert.match(ui,/v040MapPins/);assert.match(ui,/v040Travel/);assert.match(ui,/v040MapDetail/);
 assert.match(sql,/ADD COLUMN IF NOT EXISTS world_progress jsonb/);
 assert.doesNotMatch(sql,/\bDROP TABLE\b|\bTRUNCATE\b|\bDELETE FROM\b/);
});

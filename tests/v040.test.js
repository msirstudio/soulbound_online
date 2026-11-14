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


function mockLiveServer(){
 const code=fs.readFileSync(path.join(__dirname,"../server.js"),"utf8"),routes=new Map();
 const app={use(){},get(p,fn){routes.set(p,fn)}},express=()=>app;express.static=()=>()=>{};
 let onConnect=null;const emitted=[];
 class Server{on(type,fn){if(type==="connection")onConnect=fn}to(code){return{emit:(event,state)=>emitted.push({code,event,state})}}}
 const loot=require("../loot-v034");
 const deps=name=>name==="express"?express:name==="http"?{createServer:()=>({listen(){}})}:
  name==="path"?path:name==="socket.io"?{Server}:
  name==="./loot-v034"?loot:name==="./world-v040"?world:name==="./combat-v055"?require("../combat-v055"):(String(name).startsWith("./")?require(path.join(__dirname,"..",name)):require(name));
 new Function("require","process","console","__dirname","setTimeout",code)(deps,{env:{}},{log(){}},path.join(__dirname,".."),fn=>{fn();return 0});
 const connect=id=>{const events={};onConnect({id,join(){},on:(ev,fn)=>events[ev]=fn});
  return{call(ev,payload={}){let response=null;events[ev](payload,answer=>{response=answer});return response}}};
 return{connect,emitted,last:()=>emitted.at(-1)?.state};
}
test("real socket handlers block party travel when even one member is underleveled",()=>{
 const game=mockLiveServer(),leader=game.connect("host"),guest=game.connect("guest");
 const {code}=leader.call("createRoom",{name:"Leader",classId:"swordsman"});
 assert.equal(guest.call("joinRoom",{code,name:"Guest",classId:"tank"}).ok,true);
 assert.equal(leader.call("restoreCharacter",{level:10}).ok,true);
 assert.equal(guest.call("restoreCharacter",{level:1}).ok,true);
 assert.equal(leader.call("travelRegion",{regionIndex:1}).ok,false);
 assert.equal(guest.call("restoreCharacter",{level:10}).ok,true);
 assert.equal(leader.call("travelRegion",{regionIndex:2}).ok,false);
 assert.equal(leader.call("travelRegion",{regionIndex:1}).ok,true);
 assert.equal(game.last().stage,6);assert.equal(game.last().status,"battle");
 assert.equal(leader.call("returnCity").ok,false);
});
test("socket-driven farm run clears, returns to city and increments boss kills on replay",()=>{
 const game=mockLiveServer(),hero=game.connect("hero");
 assert.equal(hero.call("createRoom",{name:"Hero",classId:"swordsman"}).ok,true);
 assert.equal(hero.call("restoreCharacter",{level:30,attack:999999}).ok,true);
 for(let run=1;run<=2;run++){
  assert.equal(hero.call("travelRegion",{regionIndex:0}).ok,true);
  for(let stage=1;stage<=5;stage++){
   for(let tries=0;tries<6&&game.last().status==="battle";tries++)assert.equal(hero.call("action",{type:"attack"}).ok,true);
   assert.equal(game.last().stage,stage);
   assert.equal(game.last().status,stage===5?"regionClear":"victory");
   if(stage<5)assert.equal(hero.call("nextStage").ok,true);
  }
  assert.equal(game.last().players[0].worldProgress.bossDefeats.cursed_wilds,run);
  assert.equal(hero.call("returnCity").ok,true);
  assert.equal(game.last().status,"city");
 }
});

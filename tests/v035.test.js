"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const loot=require("../loot-v034");
function catalog(){
 const src=fs.readFileSync(path.join(__dirname,"..","server.js"),"utf8");
 const routes=new Map();
 const app={use(){},get(url,handler){routes.set(url,handler)}};
 const express=()=>app;express.static=()=>()=>{};
 class Server{on(){}to(){return{emit(){}}}}
 const deps=name=>name==="express"?express:name==="http"?{createServer:()=>({listen(){}})}:
  name==="path"?path:name==="socket.io"?{Server}:
  name==="node:crypto"?require("node:crypto"):name==="./combat-v055"?require("../combat-v055"):name==="./loot-v034"?loot:name==="./world-v040"?require("../world-v040"):require(name);
 new Function("require","process","console","__dirname",src+";")(
  deps,{env:{}},{log(){}},path.join(__dirname,".."));
 const handler=routes.get("/api/index");
 assert.equal(typeof handler,"function");
 let output=null;
 handler({}, {set(){return this},json(payload){output=payload}});
 return output;
}
test("index serves exact scaled values for 40 stages and all eight bosses",()=>{
 const data=catalog();
 assert.equal(data.version,"0.57");
 assert.equal(data.monsters.length,40);
 assert.equal(data.monsters.filter(x=>x.boss).length,8);
 assert.equal(data.monsters.filter(x=>!x.boss).length,32);
 const stage3=data.monsters.find(x=>x.stage===5);
 assert.deepEqual([stage3.hp,stage3.atk,stage3.def],[260,22,7]);
 const stage24=data.monsters.find(x=>x.stage===40);
 const scale=1+7*.23;
 assert.deepEqual([stage24.hp,stage24.atk,stage24.def],[Math.round(1500*scale),Math.round(72*scale),Math.round(29*scale)]);
});
test("wiki lists boss and mini-boss loot, shop gear and food",()=>{
 const data=catalog();
 assert.equal(data.items.filter(x=>x.source).length,34);
 assert.ok(data.items.some(x=>x.category==="weapons"&&x.price!=null));
 assert.ok(data.items.some(x=>x.category==="armor"&&x.price!=null));
 assert.equal(data.items.filter(x=>x.category==="food").length,3);
 assert.equal(data.items.filter(x=>x.category==="consumables").length,6);
 assert.equal(data.zones.length,8);
});
test("every boss rarity/item record matches the canonical loot factory",()=>{
 const data=catalog();
 for(const it of data.items.filter(x=>x.source)){
  const item=loot.factory(it.id,it.rarity);
  assert.ok(item);
  assert.equal(it.name,item.name);
  assert.deepEqual([it.value,it.defense,it.maxHp,it.maxMp],[item.value,item.defense,item.maxHp,item.maxMp]);
 }
 assert.equal(data.bossDropTables[5].length,2);assert.deepEqual(data.bossDropTables[5].map(x=>x.chance),[26,15]);assert.equal(data.miniDropTables[4].length,1);
});
test("each normal monster reports no equipment drop, bosses show loot",()=>{
 const data=catalog();
 for(const monster of data.monsters){
  if(monster.boss||monster.miniBoss){assert.match(monster.loot,/independent/);assert.ok(monster.drops.length<=(monster.boss?4:2))}
  else assert.match(monster.loot,/No random equipment/);
 }
});

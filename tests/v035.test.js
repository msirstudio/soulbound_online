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
  name==="path"?{join:()=>""}:name==="socket.io"?{Server}:
  name==="node:crypto"?require("node:crypto"):name==="./loot-v034"?loot:require(name);
 new Function("require","process","console","__dirname",src+";")(
  deps,{env:{}},{log(){}},path.join(__dirname,".."));
 const handler=routes.get("/api/index");
 assert.equal(typeof handler,"function");
 let output=null;
 handler({}, {set(){return this},json(payload){output=payload}});
 return output;
}
test("index serves exact scaled values for 24 stages and all eight bosses",()=>{
 const data=catalog();
 assert.equal(data.version,"0.36.0");
 assert.equal(data.monsters.length,24);
 assert.equal(data.monsters.filter(x=>x.boss).length,8);
 assert.equal(data.monsters.filter(x=>!x.boss).length,16);
 const stage3=data.monsters.find(x=>x.stage===3);
 assert.deepEqual([stage3.hp,stage3.atk,stage3.def],[260,22,7]);
 const stage24=data.monsters.find(x=>x.stage===24);
 const scale=1+Math.floor((24-1)/3)*.23;
 assert.deepEqual([stage24.hp,stage24.atk,stage24.def],[Math.round(1500*scale),Math.round(72*scale),Math.round(29*scale)]);
});
test("wiki has shop supplies and only 16 curated boss drops",()=>{
 const data=catalog();
 assert.equal(data.items.filter(x=>x.source).length,16);
 assert.ok(data.items.some(x=>x.category==="weapons"&&x.price!=null));
 assert.ok(data.items.some(x=>x.category==="armor"&&x.price!=null));
 assert.equal(data.items.filter(x=>x.category==="food").length,3);
 assert.equal(data.items.filter(x=>x.category==="consumables").length,6);
 assert.equal(data.zones.length,6);
});
test("every boss rarity/item record matches the canonical loot factory",()=>{
 const data=catalog();
 for(const it of data.items.filter(x=>x.source)){
  const item=loot.factory(it.id,it.rarity);
  assert.ok(item);
  assert.equal(it.name,item.name);
  assert.deepEqual([it.value,it.defense,it.maxHp,it.maxMp],[item.value,item.defense,item.maxHp,item.maxMp]);
 }
 assert.equal(Object.keys(data.bossDrops).length,8);
 for(const stage of [3,6,9,12,15,18,21,24]){
  const entries=data.bossDrops[stage];assert.ok(entries.length>=1&&entries.length<=2);
  assert.ok(entries.reduce((n,x)=>n+x.chance,0)<=100);
  assert.ok(entries.every(x=>x.bossStage===stage&&x.chance>0));
 }
 const first=data.bossDrops[3];
 assert.equal(first[0].rarity,"rare");assert.equal(first[0].slot,"main");assert.equal(first[0].chance,20);
 assert.equal(first[1].rarity,"uncommon");assert.equal(first[1].slot,"ring_left");assert.equal(first[1].chance,35);
});
test("each normal monster reports no equipment drop, bosses show loot",()=>{
 const data=catalog();
 for(const monster of data.monsters){
  if(monster.boss)assert.match(monster.loot,/Boss-exclusive equipment/);
  else assert.match(monster.loot,/No random equipment/);
 }
});

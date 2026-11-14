"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const combat=require("../combat-v055"),world=require("../world-v040");
function harness(){
 const serverText=fs.readFileSync(path.join(__dirname,"../server.js"),"utf8");
 let onConnect=null;const routes=new Map(),emits=[];
 const app={get(url,fn){routes.set(url,fn)},use(){}};const express=()=>app;express.static=()=>()=>{};
 class Server{on(n,fn){if(n==="connection")onConnect=fn}to(code){return{emit:(name,s)=>emits.push({code,name,s})}}}
 const dep=n=>n==="express"?express:n==="http"?{createServer:()=>({listen(){}})}:
  n==="socket.io"?{Server}:n==="path"?path:n==="./loot-v034"?require("../loot-v034"):
  n==="./world-v040"?world:n==="./combat-v055"?combat:require(n);
 const runtime=new Function("require","process","console","__dirname","setTimeout",serverText+";return {rooms,start};")(
  dep,{env:{}},{log(){}},path.join(__dirname,".."),fn=>{fn();return 0;});
 const connect=id=>{
  const handles={};onConnect({id,join(){},on:(ev,fn)=>handles[ev]=fn});
  return{call(event,data={}){let result;assert.ok(handles[event]);handles[event](data,x=>result=x);return result}};
 };
 function catalog(){let d;routes.get("/api/index")({}, {set(){return this},json(x){d=x}});return d;}
 return{runtime,connect,catalog,last:()=>emits.at(-1)?.s};
}
function cast(stage,spell){
 const h=harness(),mage=h.connect("mage"),room=mage.call("createRoom",{name:"Mage",classId:"mage"});
 const restored=mage.call("restoreCharacter",{class_id:"mage",level:80,attack:450,speed:99,max_hp:4000});
 assert.equal(restored.ok,true);
 const r=h.runtime.rooms.get(room.code);r.stage=stage;r.regionIndex=Math.floor((stage-1)/5);
 h.runtime.start(r);
 const p=r.players.get("mage");
 assert.equal(p.classId,"mage");
 const m=r.monster;m.hp=10000;m.maxHp=10000;m.def=25;m.atk=10;
 p.mp=100;
 const before=m.hp,beforeMana=p.mp;
 const response=mage.call("action",{type:spell});
 assert.equal(response.ok,true);
 assert.ok(m.hp<before);
 const spent=beforeMana-p.mp;
 return {damage:before-m.hp,spent,element:combat.enemyCodex(m).element,cooldown:p.cooldowns[spell]};
}
test("live Socket: LV7 Tidal Surge deals 20% bonus to Fire, resisted by Ice",()=>{
 const fire=cast(15,"skill6"),ice=cast(25,"skill6");
 assert.equal(fire.element,"fire");assert.equal(ice.element,"ice");
 assert.ok(fire.damage>ice.damage*1.35,"Water against Fire must exceed Water against Ice");
 assert.equal(fire.spent,22);assert.equal(fire.cooldown,2,"cooldown is decremented after the action as the next turn begins");
});
test("live Socket: LV9 Thunderbolt hits Water mini boss harder than Lightning mini boss",()=>{
 const water=cast(4,"skill7"),lightning=cast(9,"skill7");
 assert.equal(water.element,"water");assert.equal(lightning.element,"lightning");
 assert.ok(water.damage>lightning.damage*1.35,"Lightning must be strong against Water and resisted by itself");
 assert.equal(water.spent,26);assert.equal(water.cooldown,2,"cooldown is decremented after the action as the next turn begins");
});
test("API INDEX reports all ten types, both mini-boss elements and boss-only exceptions",()=>{
 const d=harness().catalog();
 assert.equal(d.version,"0.56.0");
 assert.equal(d.codex.elements.length,10);
 const guardian=d.monsters.find(m=>m.stage===4),executioner=d.monsters.find(m=>m.stage===9);
 assert.equal(guardian.element,"water");
 assert.equal(executioner.element,"lightning");
 assert.ok(guardian.moves.some(m=>m.element==="water"&&m.name==="Lesser Monsoon Surge"));
 assert.ok(executioner.moves.some(m=>m.element==="lightning"&&m.name==="Lesser Stormhammer"));
 const dreadforge=d.monsters.find(m=>m.stage===10),rootboss=d.monsters.find(m=>m.stage===5);
 assert.ok(dreadforge.bossExceptions.extraWeak.includes("ice"));
 assert.ok(rootboss.bossExceptions.extraResist.includes("void"));
 assert.equal(d.codex.elements.find(e=>e.id==="ice").strongAgainst.includes("water"),true);
});
test("new spells cannot be cast by non-Mages through Socket even with sufficient MP",()=>{
 const h=harness(),warrior=h.connect("warrior"),{code}=warrior.call("createRoom",{name:"Warrior",classId:"swordsman"});
 warrior.call("restoreCharacter",{class_id:"swordsman",level:80,attack:200});
 const r=h.runtime.rooms.get(code);r.stage=5;r.regionIndex=0;h.runtime.start(r);
 for(const type of ["skill6","skill7"]){
  const before=r.monster.hp,serial=r.turnSerial;
  const result=warrior.call("action",{type});
  assert.equal(result.ok,false);assert.match(result.error,/Only mages/);
  assert.equal(r.monster.hp,before);assert.equal(r.turnSerial,serial);
 }
});

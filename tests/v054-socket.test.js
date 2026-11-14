"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const world=require("../world-v040"),combat=require("../combat-v055");
function harness(){
 const source=fs.readFileSync(path.join(__dirname,"../server.js"),"utf8");
 const app={use(){},get(){}},express=()=>app;express.static=()=>()=>{};
 const outbound=[];let connectHook;
 class Server{
  on(name,fn){if(name==="connection")connectHook=fn}
  to(code){return {emit:(event,snapshot)=>outbound.push({code,event,snapshot})}}
 }
 const deps=name=>name==="express"?express:name==="http"?{createServer:()=>({listen(){}})}:
  name==="socket.io"?{Server}:name==="path"?path:
  name==="./loot-v034"?require("../loot-v034"):name==="./world-v040"?world:
  name==="./combat-v055"?combat:require(name);
 const runtime=new Function("require","process","console","__dirname","setTimeout",source+
  ";return {rooms,start,combat};")(deps,{env:{}},{log(){}},path.join(__dirname,".."),fn=>{fn();return 0;});
 const connect=id=>{
  const handlers={};const socket={id,join(){},on:(ev,fn)=>handlers[ev]=fn};
  connectHook(socket);
  return {id,call(type,payload={}){let result;const cb=r=>result=r;
   assert.ok(handlers[type],"Socket handler missing: "+type);
   handlers[type](payload,cb);return result;}};
 };
 return {connect,runtime,last:()=>outbound.at(-1)?.snapshot};
}
test("two-player party sees authoritative team guard and stage-35 Phase 2 in shared snapshots",()=>{
 const g=harness(),leader=g.connect("host"),tank=g.connect("tank");
 const {code}=leader.call("createRoom",{name:"Leader",classId:"mage"});
 assert.equal(tank.call("joinRoom",{code,name:"Tank",classId:"tank"}).ok,true);
 for(const p of [leader,tank])assert.equal(p.call("restoreCharacter",{level:80,speed:50,attack:160,max_hp:3000}).ok,true);
 const r=g.runtime.rooms.get(code);
 r.regionIndex=6;r.stage=35;g.runtime.start(r);
 assert.equal(r.monster.phase,1);
 assert.equal(r.status,"battle");
 assert.equal(leader.call("action",{type:"guard"}).ok,true);
 assert.equal(g.last().partyWardTurns,1);
 assert.equal(g.last().players.length,2);
 assert.equal(tank.call("action",{type:"guard"}).ok,true);
 assert.equal(r.turnIndex,0);
 assert.ok(r.log.some(x=>x.includes("protecting the party")));
 const m=r.monster;
 m.hp=Math.floor(m.maxHp*.5)+15;
 r.players.get("host").atk=m.def+45;
 const reply=leader.call("action",{type:"attack"});
 assert.equal(reply.ok,true);
 assert.ok(m.hp>0,"test damage must not one-shot the boss");
 assert.equal(m.phase,2);
 assert.equal(g.last().monster.phase,2);
 assert.equal(g.last().monster.intent.name,"Oblivion's Grasp");
 assert.equal(g.last().status,"battle");
 assert.equal(leader.call("returnCity").ok,false,"party cannot reset a live battle");
});
test("stage-40 Phase 2 is visible online, temporary status damage is server-owned",()=>{
 const g=harness(),leader=g.connect("solo"),{code}=leader.call("createRoom",{name:"Hero",classId:"swordsman"});
 assert.equal(leader.call("restoreCharacter",{level:80,speed:99,attack:300,max_hp:3500}).ok,true);
 const r=g.runtime.rooms.get(code);r.regionIndex=7;r.stage=40;g.runtime.start(r);
 assert.equal(r.monster.phase,1);
 r.monster.hp=Math.floor(r.monster.maxHp*.5)+8;
 r.players.get("solo").atk=r.monster.def+50;
 assert.equal(leader.call("action",{type:"attack"}).ok,true);
 assert.equal(g.last().monster.phase,2);
 assert.equal(g.last().monster.intent.name,"Sovereign Judgment");
 // Burn is a server-side state, never a client-supplied action or saved field.
 combat.effectFor(r.players.get("solo"),"burn",1);
 const hp=r.players.get("solo").hp;
 r.players.get("solo").tauntTurns=0;
 assert.equal(leader.call("action",{type:"guard"}).ok,true);
 assert.ok(r.players.get("solo").hp<hp);
 assert.ok(!(g.last().players[0].statusEffects||[]).some(x=>x.id==="burn"),"the original Burn has expired; fresh boss ailments may be applied");
});
test("non-final boss never enters Phase 2 via Socket action even when below half HP",()=>{
 const g=harness(),leader=g.connect("solo"),{code}=leader.call("createRoom",{name:"Hero",classId:"swordsman"});
 assert.equal(leader.call("restoreCharacter",{level:40,speed:50,attack:200}).ok,true);
 const r=g.runtime.rooms.get(code);r.regionIndex=5;r.stage=30;g.runtime.start(r);
 const m=r.monster;m.hp=Math.floor(m.maxHp*.5)+8;r.players.get("solo").atk=m.def+40;
 assert.equal(leader.call("action",{type:"attack"}).ok,true);
 assert.equal(m.phase,null);
 assert.equal(g.last().monster.phase,null);
});

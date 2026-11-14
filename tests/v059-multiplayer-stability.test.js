"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),serverText=fs.readFileSync(path.join(root,"server.js"),"utf8");
const session=require("../multiplayer/session-v059");
const world=require("../world-v040"),combat=require("../combat-v055"),loot=require("../loot-v034");
function harness(){
 let connection;
 const messages=[],timers=[];
 const app={use(){},get(){}},express=()=>app;express.static=()=>()=>{};
 class Server{on(event,cb){if(event==="connection")connection=cb}to(room){return{emit:(name,state)=>messages.push({room,name,state})}}}
 const deps=name=>name==="express"?express:name==="http"?{createServer:()=>({listen(){}})}:name==="socket.io"?{Server}:name==="path"?path:name==="./loot-v034"?loot:name==="./world-v040"?world:name==="./combat-v055"?combat:require(name);
 const runtime=new Function("require","process","console","__dirname","setTimeout",serverText+";return {rooms,finish};")(
  deps,{env:{}},{log(){},error(){}},root,(fn,ms)=>{timers.push({fn,ms});return timers.length});
 function connect(id){
  const events={};connection({id,join(){},on:(name,fn)=>events[name]=fn});
  return{
   id,
   call:(name,data={})=>new Promise((resolve,reject)=>{
    if(!events[name])return reject(new Error("Missing Socket handler "+name));
    try{events[name](data,resolve)}catch(e){reject(e)}
   }),
   disconnect:()=>events.disconnect()
  };
 }
 return{connect,rooms:runtime.rooms,finish:runtime.finish,timers,last:()=>messages.at(-1)?.state,all:messages};
}
test("Reconnect after dropout keeps exact player, turn order, HP, gold and secure ticket rotation",async()=>{
 const h=harness(),a=h.connect("alpha"),b=h.connect("beta");
 const first=await a.call("createRoom",{name:"Alpha",classId:"swordsman",guest:true});
 assert.equal(first.ok,true);assert.match(first.ticket,/^[0-9a-f]{64}$/);
 const second=await b.call("joinRoom",{code:first.code,name:"Beta",classId:"mage",guest:true});
 assert.equal(second.ok,true);assert.notEqual(second.ticket,first.ticket);
 await a.call("restoreCharacter",{level:30,attack:5000,max_hp:2000,guest:true});
 await b.call("restoreCharacter",{level:30,attack:120,max_hp:1500,guest:true});
 assert.equal((await a.call("startBattle")).ok,true);
 const room=h.rooms.get(first.code),turn=room.turnIndex;
 const original=room.players.get("beta"),gold=original.gold,hp=original.hp;
 b.disconnect();
 assert.equal(room.players.size,2,"disconnected hero is reserved for 120 seconds");
 assert.equal(original.disconnected,true);
 assert.equal((await a.call("action",{type:"attack",actionId:"pause-action-001"})).ok,false,"battle must pause");
 const stranger=h.connect("stranger");
 assert.equal((await stranger.call("resumeRoom",{code:first.code,ticket:"f".repeat(64)})).ok,false,"room code alone cannot hijack character");
 const recovered=h.connect("beta-new");
 const accepted=await recovered.call("resumeRoom",{code:first.code,ticket:second.ticket});
 assert.equal(accepted.ok,true);
 assert.equal(accepted.resumed,true);
 assert.notEqual(accepted.ticket,second.ticket,"reconnect secret must rotate");
 assert.equal(room.turnIndex,turn);
 assert.strictEqual(room.players.get("beta-new"),original,"same live character, not clone");
 assert.equal(original.id,"beta-new");
 assert.equal(original.disconnected,false);
 assert.equal(original.gold,gold);assert.equal(original.hp,hp);
 assert.equal(room.players.has("beta"),false);
 assert.equal(session.hasMissing(room),false);
 assert.equal((await a.call("action",{type:"attack",actionId:"resume-action-001"})).ok,true);
});
test("Action ID replay is acknowledged only once even after turn changes; different payload is rejected",async()=>{
 const h=harness(),a=h.connect("hero"),b=h.connect("friend");
 const roomId=(await a.call("createRoom",{name:"Hero",classId:"swordsman",guest:true})).code;
 await b.call("joinRoom",{code:roomId,name:"Friend",classId:"swordsman",guest:true});
 await a.call("restoreCharacter",{level:30,attack:999999,guest:true,speed:50});
 await b.call("restoreCharacter",{level:30,attack:30,guest:true,speed:20});
 await a.call("startBattle");
 const room=h.rooms.get(roomId),id=room.enemies[0].enemyId;
 const action={type:"attack",targetId:id,actionId:"dedupe-attack-001"};
 const first=await a.call("action",action);
 assert.equal(first.ok,true);
 const hp=room.enemies.map(m=>m.hp),serial=room.turnSerial,logs=room.log.length;
 const duplicate=await a.call("action",action);
 assert.equal(duplicate.ok,true);assert.equal(duplicate.duplicate,true);
 assert.deepEqual(room.enemies.map(m=>m.hp),hp);
 assert.equal(room.turnSerial,serial);assert.equal(room.log.length,logs);
 const malicious=await a.call("action",{...action,type:"guard"});
 assert.equal(malicious.ok,false);assert.match(malicious.error,/reused/);
});
test("A stale reconnect ticket expires, releasing party spot without resetting remaining player's turn",async()=>{
 const h=harness(),a=h.connect("leader"),b=h.connect("gone");
 const code=(await a.call("createRoom",{name:"Leader",guest:true})).code;
 const entry=await b.call("joinRoom",{code,name:"Gone",guest:true});
 b.disconnect();
 assert.equal(h.rooms.get(code).players.size,2);
 const expire=h.timers.find(t=>t.ms===120000);
 assert.ok(expire,"disconnect grace timeout should exist");
 expire.fn();
 assert.equal(h.rooms.get(code).players.size,1);
 assert.equal(h.rooms.get(code).players.has("leader"),true);
 assert.equal((await h.connect("attacker").call("resumeRoom",{code,ticket:entry.ticket})).ok,false);
});
test("Victory and Gold/EXP rewards only apply once per encounter even if finish is called again",async()=>{
 const h=harness(),a=h.connect("victor");
 const code=(await a.call("createRoom",{name:"Victor",guest:true})).code;
 await a.call("restoreCharacter",{level:20,attack:5000,guest:true});
 await a.call("startBattle");
 const r=h.rooms.get(code),p=r.players.get("victor");
 r.monster.hp=0;h.finish(r);
 const gold=p.gold,xp=p.xp;
 h.finish(r);assert.equal(p.gold,gold);assert.equal(p.xp,xp);
 assert.ok(r.rewardedEncounter&&r.rewardedEncounter===r.encounterId);
});
test("Secret reconnect token is never included in public party state; receipts have bounded size",async()=>{
 const h=harness(),a=h.connect("owner"),joined=await a.call("createRoom",{name:"Owner",guest:true});
 assert.ok(!JSON.stringify(h.last()).includes(joined.ticket));
 const room=h.rooms.get(joined.code);
 assert.equal(session.isValidActionId("duplicate-123"),true);
 assert.equal(session.isValidActionId("bad !"),false);
 for(let i=0;i<550;i++)session.remember(room,"stable","action-"+String(i).padStart(5,"0"),'["attack",null]',{ok:true});
 assert.equal(room.actionReceipts.size,512);
 assert.equal(session.lookup(room,"stable","action-00549",'["attack",null]').duplicate,true);
 assert.equal(session.lookup(room,"stable","action-00000",'["attack",null]'),null);
});

"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),{createRequire}=require("node:module");
const requireGame=createRequire(path.join(root,"server.js"));
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done});return{promise,resolve}};

function binding(){
 const events=new Map();
 const socket={on:(event,handler)=>events.set(event,handler)};
 const {bindSocket}=requireGame("./multiplayer/socket-boundary");
 return {events,on:bindSocket(socket)};
}

test("socket boundary rejects malformed payloads before a command can mutate state",()=>{
 const {events,on}=binding();let mutations=0;
 on("createRoom",({name}={},cb)=>{mutations++;cb({ok:true,name})});
 for(const payload of [null,[],[{}],"guest",3,true]){
  let reply;assert.doesNotThrow(()=>events.get("createRoom")(payload,result=>{reply=result}));
  assert.equal(reply?.ok,false,"malformed payload must receive a failure acknowledgement");
 }
 assert.equal(mutations,0);
 let reply;events.get("createRoom")({name:"Hero"},result=>{reply=result});
 assert.deepEqual(reply,{ok:true,name:"Hero"});assert.equal(mutations,1);
 events.get("createRoom")(undefined,result=>{reply=result});
 assert.equal(reply.ok,true,"omitted payload keeps the existing default-object protocol");
 assert.equal(mutations,2);
});

test("socket boundary supplies safe acknowledgements and contains handler failures",async()=>{
 const {events,on}=binding();let mutations=0;
 on("action",(_data,cb)=>{mutations++;cb({ok:true})});
 for(const callback of [undefined,null,1,"callback",{},[]]){
  assert.doesNotThrow(()=>events.get("action")({},callback));
 }
 assert.equal(mutations,6);
 on("syncFailure",()=>{throw new Error("private server details")});
 on("asyncFailure",async()=>{await Promise.resolve();throw new Error("private database details")});
 for(const event of ["syncFailure","asyncFailure"]){
  let reply;assert.doesNotThrow(()=>events.get(event)({},result=>{reply=result}));
  await settle();
  assert.deepEqual(reply,{ok:false,error:"Unable to process command."});
 }
 assert.doesNotThrow(()=>events.get("syncFailure")({},null));
 assert.doesNotThrow(()=>events.get("asyncFailure")({},null));
 await settle();
});

test("socket boundary leaves disconnect lifecycle registration unchanged",()=>{
 const {events,on}=binding();const disconnect=()=>{};
 on("disconnect",disconnect);assert.strictEqual(events.get("disconnect"),disconnect);
});

function harness({secureEnabled=false,authenticate,load,randomInt}={}){
 let connection;const timers=[],messages=[],claims=new Map(),registrations=[];
 const app={use(){},get(){},post(){},delete(){}};
 const express=()=>app;express.static=()=>()=>{};express.json=()=>()=>{};
 class Server{
  on(event,callback){if(event==="connection")connection=callback}
  to(room){return{emit:(event,state)=>messages.push({room,event,state})}}
 }
 const queue={
  register(claim){const key=claim.userId+":"+claim.slot;if(claims.has(key))throw new Error("Slot active");const active={...claim};claims.set(key,active);registrations.push(active);return active},
  persist(){return Promise.resolve()},
  release(claim){claims.delete(claim.userId+":"+claim.slot)},
  isActive(userId,slot){return claims.has(userId+":"+slot)}
 };
 const secure={enabled:secureEnabled,createQueue:()=>queue,
  authenticate:authenticate||(async()=>"account-owner"),
  load:load||(async(_token,slot)=>({userId:"account-owner",slot,revision:0,data:{class_id:"swordsman",level:1,gold:80}}))};
 const deps=name=>name==="express"?express:name==="http"?{createServer:()=>({listen(){}})}:
  name==="socket.io"?{Server}:name==="node:crypto"&&randomInt?{...requireGame(name),randomInt}:name.endsWith("persistence/secure-saves-v057.js")?secure:requireGame(name);
 const text=fs.readFileSync(path.join(root,"server.js"),"utf8");
 const runtime=new Function("require","process","console","__dirname","setTimeout",text+";return {rooms,verifiedCharacters};")(
  deps,{env:{}},{log(){},error(){}},root,(fn,ms)=>{timers.push({fn,ms});return timers.length});
 function connect(id){
  const events={},joined=new Set();connection({id,join:code=>joined.add(code),on:(event,fn)=>{events[event]=fn}});
  return{id,events,joined,
   call:(event,data={})=>new Promise((resolve,reject)=>{try{const result=events[event](data,resolve);if(result?.catch)result.catch(reject)}catch(error){reject(error)}}),
   disconnect:()=>events.disconnect()};
 }
 return{...runtime,connect,timers,messages,claims,registrations};
}

test("every registered command rejects null and array payloads without creating rooms",async()=>{
 const h=harness(),socket=h.connect("malformed");
 for(const event of Object.keys(socket.events).filter(name=>name!=="disconnect")){
  for(const payload of [null,[]]){
   const reply=await socket.call(event,payload);
   assert.equal(reply?.ok,false,event+" must reject malformed data");
  }
 }
 assert.equal(h.rooms.size,0);assert.equal(socket.joined.size,0);
});

test("a socket cannot create or join additional rooms or replace its existing hero",async()=>{
 const h=harness(),owner=h.connect("owner"),other=h.connect("other");
 const original=await owner.call("createRoom",{name:"Original",guest:true});
 const destination=await other.call("createRoom",{name:"Destination",guest:true});
 const room=h.rooms.get(original.code),hero=room.players.get(owner.id);
 assert.equal((await owner.call("createRoom",{name:"Replacement",guest:true})).ok,false);
 assert.equal((await owner.call("joinRoom",{code:destination.code,name:"Intruder",guest:true})).ok,false);
 assert.equal((await owner.call("joinRoom",{code:original.code,name:"Replacement",guest:true})).ok,false);
 assert.equal(h.rooms.size,2);assert.strictEqual(room.players.get(owner.id),hero);
 assert.equal(hero.name,"Original");assert.equal(h.rooms.get(destination.code).players.has(owner.id),false);
 assert.deepEqual([...owner.joined],[original.code]);
});

test("registered account hero cannot switch its authoritative save claim in the same session",async()=>{
 let loads=0;const h=harness({secureEnabled:true,load:async(_token,slot)=>{loads++;return{userId:"account-owner",slot,revision:3,data:{class_id:"swordsman",gold:100+slot}}}});
 const owner=h.connect("account-hero"),created=await owner.call("createRoom",{name:"Hero"});
 assert.equal((await owner.call("restoreCharacter",{accessToken:"test-token",slot:1})).ok,true);
 const hero=h.rooms.get(created.code).players.get(owner.id),claim=h.verifiedCharacters.get(owner.id),gold=hero.gold;
 assert.equal((await owner.call("restoreCharacter",{accessToken:"test-token",slot:2})).ok,false);
 assert.equal(loads,1);assert.equal(h.registrations.length,1);assert.equal(h.claims.size,1);
 assert.strictEqual(h.verifiedCharacters.get(owner.id),claim);assert.equal(claim.slot,1);assert.equal(hero.gold,gold);
});

test("account resume blocks overlapping room commands while authentication is pending",async()=>{
 const auth=deferred(),h=harness({secureEnabled:true,authenticate:()=>auth.promise});
 const owner=h.connect("old-id"),first=await owner.call("createRoom",{name:"Hero"});
 await owner.call("restoreCharacter",{accessToken:"test-token",slot:1});
 owner.disconnect();
 const other=h.connect("other"),destination=await other.call("createRoom",{name:"Other"});
 const resumed=h.connect("new-id"),pending=resumed.call("resumeRoom",{code:first.code,ticket:first.ticket,accessToken:"test-token"});
 assert.equal((await resumed.call("createRoom",{name:"Extra"})).ok,false);
 assert.equal((await resumed.call("joinRoom",{code:destination.code,name:"Extra"})).ok,false);
 assert.equal((await resumed.call("resumeRoom",{code:first.code,ticket:first.ticket,accessToken:"test-token"})).ok,false);
 auth.resolve("account-owner");const response=await pending;
 assert.equal(response.ok,true);assert.equal(h.rooms.size,2);
 assert.deepEqual([...resumed.joined],[first.code]);
 assert.equal(h.rooms.get(first.code).players.has("new-id"),true);
 assert.equal(h.rooms.get(first.code).players.has("old-id"),false);
 assert.equal(h.rooms.get(destination.code).players.has("new-id"),false);
 assert.equal(h.verifiedCharacters.get("new-id").slot,1);
});

test("disconnect during secure restore cannot acquire a save claim after the socket has gone",async()=>{
 const loaded=deferred(),h=harness({secureEnabled:true,load:()=>loaded.promise});
 const owner=h.connect("restore-disconnected"),created=await owner.call("createRoom",{name:"Hero"});
 const pending=owner.call("restoreCharacter",{accessToken:"test-token",slot:1});
 owner.disconnect();
 loaded.resolve({userId:"account-owner",slot:1,revision:7,data:{class_id:"mage",gold:2000}});
 assert.equal((await pending).ok,false);
 assert.equal(h.registrations.length,0);assert.equal(h.claims.size,0);
 assert.equal(h.verifiedCharacters.has(owner.id),false);
 const hero=h.rooms.get(created.code).players.get(owner.id);
 assert.equal(hero.disconnected,true);assert.equal(hero.classId,"swordsman");assert.equal(hero.gold,80);
});

test("disconnect during account resume preserves the original paused hero and its save claim",async()=>{
 const auth=deferred(),h=harness({secureEnabled:true,authenticate:()=>auth.promise});
 const owner=h.connect("paused-owner"),created=await owner.call("createRoom",{name:"Hero"});
 await owner.call("restoreCharacter",{accessToken:"test-token",slot:1});owner.disconnect();
 const room=h.rooms.get(created.code),hero=room.players.get(owner.id),claim=h.verifiedCharacters.get(owner.id);
 const reconnect=h.connect("gone-again"),pending=reconnect.call("resumeRoom",{code:created.code,ticket:created.ticket,accessToken:"test-token"});
 reconnect.disconnect();auth.resolve("account-owner");
 assert.equal((await pending).ok,false);
 assert.strictEqual(room.players.get(owner.id),hero);assert.equal(hero.disconnected,true);
 assert.equal(room.players.has(reconnect.id),false);assert.equal(reconnect.joined.size,0);
 assert.strictEqual(h.verifiedCharacters.get(owner.id),claim);assert.equal(h.verifiedCharacters.has(reconnect.id),false);
});

test("failed account authentication releases the resume guard so the same socket can retry",async()=>{
 let authentications=0;
 const h=harness({secureEnabled:true,authenticate:async()=>{if(++authentications===1)throw new Error("Temporary failure");return "account-owner"}});
 const owner=h.connect("retry-owner"),created=await owner.call("createRoom",{name:"Hero"});
 await owner.call("restoreCharacter",{accessToken:"test-token",slot:1});owner.disconnect();
 const reconnect=h.connect("retry-new"),request={code:created.code,ticket:created.ticket,accessToken:"test-token"};
 assert.equal((await reconnect.call("resumeRoom",request)).ok,false);
 assert.equal((await reconnect.call("resumeRoom",request)).ok,true);
 assert.equal(authentications,2);assert.equal(h.rooms.get(created.code).players.has(reconnect.id),true);
 assert.equal(h.claims.size,1);
});


test("room-code collisions retry without replacing the original party",async()=>{
 const rolls=[1,1,2],h=harness({randomInt:max=>{assert.equal(max,36**5);return rolls.shift()}});
 const first=await h.connect("first").call("createRoom",{name:"First",guest:true});
 const original=h.rooms.get(first.code);
 const second=await h.connect("second").call("createRoom",{name:"Second",guest:true});
 assert.equal(first.code,"00001");assert.equal(second.code,"00002");
 assert.strictEqual(h.rooms.get(first.code),original);assert.equal(original.players.has("first"),true);
 assert.equal(h.rooms.size,2);assert.equal(rolls.length,0);
});

"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),source=fs.readFileSync(path.join(root,"server.js"),"utf8");
const secureReal=require("../persistence/secure-saves-v057");
const OWNER="123e4567-e89b-12d3-a456-426614174000";
const FRIEND="123e4567-e89b-12d3-a456-426614174001";
const UUID="11111111-2222-4333-8444-555555555555";
function harness({ownerConfigured=true}={}){
 let connect;const events=[],stored=new Map(),calls=new Map(),failAt=new Map(),audit=[];
 const app={use(){},get(){},post(){},delete(){}},express=()=>app;express.static=()=>()=>{};express.json=()=>()=>{};
 class Server{on(event,fn){if(event==="connection")connect=fn}to(room){return{emit:(event,state)=>events.push({room,event,state})}}}
 const keys=new Map(),claims=new Map();
 const fakeSecure={
  enabled:true,
  authenticate:async token=>token==="ownerToken"?OWNER:token==="friendToken"?FRIEND:(()=>{throw new Error("Invalid login")})(),
  load:async(token,slot)=>{
   const userId=await fakeSecure.authenticate(token),cls=userId===OWNER?"swordsman":"mage";
   return{userId,slot,revision:0,data:secureReal.starter(cls,userId===OWNER?"Owner":"Friend",userId===OWNER?"aren":"seris")};
  },
  createQueue:()=>({
   register:claim=>{const k=claim.userId+":"+claim.slot;if(claims.has(k))throw Error("Duplicate");
    const x={...claim};claims.set(k,x);return x},
   persist:async(claim,player)=>{
    const count=(calls.get(claim.userId)||0)+1;calls.set(claim.userId,count);
    if(failAt.get(claim.userId)===count)return false;
    stored.set(claim.userId,JSON.parse(JSON.stringify(secureReal.profileFromPlayer(player))));return true},
   release:()=>{},isActive:()=>false
  })
 };
 const requireMock=name=>name==="express"?express:
  name==="http"?{createServer:()=>({listen(){}})}:
  name==="socket.io"?{Server}:
  name==="path"?path:
  String(name).endsWith("/persistence/secure-saves-v057.js")?fakeSecure:require(name);
 const runtime=new Function("require","process","console","__dirname","setTimeout",source+";return {rooms,verifiedCharacters,gmConfig};")(
  requireMock,{env:{SOULBOUND_GM_OWNER_ID:ownerConfigured?OWNER:""}},{log(){},error(){},info:(...args)=>audit.push(args)},root,()=>0);
 const user=id=>{
  const handlers={};connect({id,join(){},on:(event,callback)=>handlers[event]=callback});
  return{call:(event,payload={})=>new Promise((resolve,reject)=>{try{handlers[event](payload,resolve)}catch(e){reject(e)}})};
 };
 return{...runtime,user,events,stored,calls,failAt,audit};
}
async function joined(h){
 const owner=h.user("socket-owner"),friend=h.user("socket-friend"),stranger=h.user("socket-stranger");
 const room=await owner.call("createRoom",{name:"Owner",classId:"swordsman",guest:false});
 assert.equal(room.ok,true);
 assert.equal((await friend.call("joinRoom",{code:room.code,name:"Friend",classId:"mage",guest:false})).ok,true);
 assert.equal((await owner.call("restoreCharacter",{accessToken:"ownerToken",slot:1,guest:false})).ok,true);
 assert.equal((await friend.call("restoreCharacter",{accessToken:"friendToken",slot:1,guest:false})).ok,true);
 return{owner,friend,stranger,room:h.rooms.get(room.code)};
}
test("actual Socket GM status and gift: owner can grant Gold/Race Points/items to verified friend",async()=>{
 const h=harness(),{owner,friend,room}=await joined(h);
 assert.equal((await owner.call("gmStatus",{accessToken:"ownerToken"})).isGM,true);
 assert.equal((await friend.call("gmStatus",{accessToken:"friendToken"})).isGM,false);
 const denied=await friend.call("gmGrant",{targetId:"socket-owner",accessToken:"friendToken",kind:"gold",amount:100000,requestId:UUID});
 assert.equal(denied.ok,false);
 assert.equal(room.players.get("socket-owner").gold,80);
 const gift=await owner.call("gmGrant",{targetId:"socket-friend",accessToken:"ownerToken",kind:"gold",amount:1250,requestId:UUID});
 assert.equal(gift.ok,true);
 assert.equal(room.players.get("socket-friend").gold,1330);
 assert.equal(h.stored.get(FRIEND).gold,1330);
 assert.equal(h.stored.get(FRIEND).gm_grants[0].requestId,UUID);
 assert.equal(h.audit.filter(x=>x[0]==="[GM-GRANT]").length,1);
 const again=await owner.call("gmGrant",{targetId:"socket-friend",accessToken:"ownerToken",kind:"gold",amount:1250,requestId:UUID});
 assert.equal(again.duplicate,true);assert.equal(room.players.get("socket-friend").gold,1330);
 const second="aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
 assert.equal((await owner.call("gmGrant",{targetId:"socket-friend",accessToken:"ownerToken",kind:"race_points",amount:3,requestId:second})).ok,true);
 assert.equal(h.stored.get(FRIEND).race_points,3);
 const third="ffffffff-1111-4222-8333-444444444444";
 assert.equal((await owner.call("gmGrant",{targetId:"socket-friend",accessToken:"ownerToken",kind:"equipment",itemId:"adept_mantle",requestId:third})).ok,true);
 assert.equal(h.stored.get(FRIEND).inventory.find(i=>i.id==="adept_mantle")?.uid?.length,36);
});
test("actual Socket GM: no forged owner, no wrong-class weapon, no outside target or active battle",async()=>{
 const h=harness(),{owner,friend,room}=await joined(h);
 assert.equal((await owner.call("gmGrant",{accessToken:"friendToken",targetId:"socket-friend",kind:"gold",amount:50,requestId:UUID})).ok,false);
 assert.equal((await owner.call("gmGrant",{accessToken:"ownerToken",targetId:"socket-nobody",kind:"gold",amount:50,requestId:UUID})).ok,false);
 assert.equal((await owner.call("gmGrant",{accessToken:"ownerToken",targetId:"socket-friend",kind:"equipment",itemId:"flamebrand",requestId:UUID})).ok,false);
 room.status="battle";
 assert.equal((await owner.call("gmGrant",{accessToken:"ownerToken",targetId:"socket-friend",kind:"gold",amount:50,requestId:UUID})).ok,false);
 assert.equal(room.players.get("socket-friend").gold,80);
});
test("actual Socket GM: failed secure write rolls back grant and owner-only env is mandatory",async()=>{
 const h=harness(),{owner,room}=await joined(h);
 h.failAt.set(FRIEND,(h.calls.get(FRIEND)||0)+2);
 const result=await owner.call("gmGrant",{accessToken:"ownerToken",targetId:"socket-friend",kind:"gold",amount:100,requestId:UUID});
 assert.equal(result.ok,false);assert.match(result.error,/save failed/i);
 assert.equal(room.players.get("socket-friend").gold,80);
 assert.equal(room.players.get("socket-friend").gmGrants.length,0);
 const disabled=harness({ownerConfigured:false}),party=await joined(disabled);
 assert.equal(disabled.gmConfig.enabled,false);
 assert.equal((await party.owner.call("gmStatus",{accessToken:"ownerToken"})).isGM,false);
 assert.equal((await party.owner.call("gmGrant",{accessToken:"ownerToken",targetId:"socket-friend",kind:"gold",amount:1,requestId:UUID})).ok,false);
});

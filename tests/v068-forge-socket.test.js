"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"server.js"),"utf8");
const secureReal=require("../persistence/secure-saves-v057"),catalog=require("../data/game-catalog-v062"),world=require("../world-v040");
const OWNER="123e4567-e89b-12d3-a456-426614174000",FRIEND="123e4567-e89b-12d3-a456-426614174001";
const UUID="123e4567-e89b-42d3-a456-426614174000",OTHER="123e4567-e89b-42d3-a456-426614174001";
function harness(){
 let connect;const stored=new Map(),calls=new Map(),failAt=new Map(),claims=new Map(),events=[];
 const app={use(){},get(){},post(){},delete(){}},express=()=>app;express.static=()=>()=>{};express.json=()=>()=>{};
 class Server{on(name,fn){if(name==="connection")connect=fn}to(code){return{emit:(name,value)=>events.push({code,name,value})}}}
 const auth=async token=>token==="token-owner"?OWNER:token==="token-friend"?FRIEND:(()=>{throw Error("Invalid Auth")})();
 const secure={
  enabled:true,authenticate:auth,load:async(token,slot)=>{
   const userId=await auth(token),cls=userId===OWNER?"swordsman":"mage";
   return{userId,slot,revision:0,data:secureReal.starter(cls,userId===OWNER?"Owner":"Friend",userId===OWNER?"aren":"seris")};
  },
  createQueue:()=>({
   register:claim=>{const key=claim.userId+":"+claim.slot;if(claims.has(key))throw Error("active");const c={...claim};claims.set(key,c);return c},
   persist:async(claim,p)=>{
    const n=(calls.get(claim.userId)||0)+1;calls.set(claim.userId,n);
    if(failAt.get(claim.userId)===n)return false;
    stored.set(claim.userId,JSON.parse(JSON.stringify(secureReal.profileFromPlayer(p))));return true;
   },
   release:()=>{},isActive:()=>false
  })
 };
 const requireMock=name=>name==="express"?express:name==="http"?{createServer:()=>({listen(){}})}:
  name==="socket.io"?{Server}:name==="path"?path:
  String(name).endsWith("/persistence/secure-saves-v057.js")?secure:
  String(name).startsWith("./")?require(path.join(root,name)):require(name);
 const rt=new Function("require","process","console","__dirname","setTimeout",source+";return {rooms,verifiedCharacters,finish};")(
  requireMock,{env:{SOULBOUND_GM_OWNER_ID:OWNER}},{log(){},info(){},error(){}},root,()=>0);
 const client=id=>{const handlers={};connect({id,join(){},on:(name,fn)=>handlers[name]=fn});return{send:(name,input={})=>new Promise((resolve,reject)=>{try{handlers[name](input,resolve)}catch(e){reject(e)}})}};
 return{...rt,client,stored,calls,failAt,events};
}
async function lobby(h){
 const leader=h.client("leader"),friend=h.client("friend");
 const res=await leader.send("createRoom",{name:"Owner",classId:"swordsman",guest:false});
 assert.ok(res.ok);
 assert.ok((await friend.send("joinRoom",{code:res.code,name:"Friend",classId:"mage",guest:false})).ok);
 assert.ok((await leader.send("restoreCharacter",{accessToken:"token-owner",slot:1,guest:false})).ok);
 assert.ok((await friend.send("restoreCharacter",{accessToken:"token-friend",slot:1,guest:false})).ok);
 return{leader,friend,room:h.rooms.get(res.code)};
}
test("Socket blacksmith: authenticated player buys stones and successfully enhances owned gear",async()=>{
 const h=harness(),{leader,room}=await lobby(h),p=room.players.get("leader");
 p.gold=5000;p.inventory.push({...catalog.shopItems.find(i=>i.id==="iron_sword"),uid:"owned-12345678"});
 const purchased=await leader.send("forgeBuyStone",{quantity:5});
 assert.equal(purchased.ok,true);assert.equal(p.materials.basic,5);
 assert.equal(h.stored.get(OWNER).materials.basic,5);
 const result=await leader.send("forgeAttempt",{uid:"owned-12345678",requestId:UUID,rate:100000,success:true});
 assert.equal(result.ok,true);assert.equal(result.result.success,true);
 assert.equal(p.inventory[0].enhanceLevel,1);
 assert.equal(h.stored.get(OWNER).inventory[0].enhanceLevel,1);
 assert.equal(h.stored.get(OWNER).forge_history[0].requestId,UUID);
 const gold=p.gold,stoneCount=p.materials.basic;
 const duplicate=await leader.send("forgeAttempt",{uid:"owned-12345678",requestId:UUID});
 assert.equal(duplicate.duplicate,true);assert.equal(p.gold,gold);assert.equal(p.materials.basic,stoneCount);
});
test("Socket blacksmith rejects forged currency, fake UIDs, battle use and cloud write failures",async()=>{
 const h=harness(),{leader,room}=await lobby(h),p=room.players.get("leader");
 assert.equal((await leader.send("forgeBuyStone",{quantity:10000,gold:0})).ok,false);
 assert.equal((await leader.send("forgeAttempt",{uid:"fake",requestId:UUID})).ok,false);
 p.gold=10000;h.failAt.set(OWNER,(h.calls.get(OWNER)||0)+2);
 const failed=await leader.send("forgeBuyStone",{quantity:1});
 assert.equal(failed.ok,false);assert.equal(p.gold,10000);
 assert.equal(p.materials.basic,0);
 room.status="battle";
 assert.equal((await leader.send("forgeBuyStone",{quantity:1})).ok,false);
 assert.equal((await leader.send("forgeAttempt",{uid:"fake",requestId:UUID})).ok,false);
});
test("Socket GM can give refined and Ancient Stones, but non-owner cannot",async()=>{
 const h=harness(),{leader,friend,room}=await lobby(h);
 const denied=await friend.send("gmGrant",{accessToken:"token-friend",targetId:"leader",kind:"material",stoneType:"ancient",amount:20,requestId:UUID});
 assert.equal(denied.ok,false);
 const allowed=await leader.send("gmGrant",{accessToken:"token-owner",targetId:"friend",kind:"material",stoneType:"ancient",amount:3,requestId:UUID});
 assert.equal(allowed.ok,true);
 assert.equal(room.players.get("friend").materials.ancient,3);
 assert.equal(h.stored.get(FRIEND).materials.ancient,3);
});
test("Ancient Portal requires boss clears, then starts unique solo-team-scaled Guardian",async()=>{
 const h=harness(),{leader,room}=await lobby(h);
 const blocked=await leader.send("ancientGuardian",{id:"gorthan"});
 assert.equal(blocked.ok,false);
 for(const p of room.players.values())p.worldProgress=world.markBossClear(p.worldProgress,"dreadforge_bastion");
 const entered=await leader.send("ancientGuardian",{id:"gorthan"});
 assert.equal(entered.ok,true);assert.equal(room.status,"battle");
 assert.equal(room.guardianId,"gorthan");assert.equal(room.enemies.length,1);
 assert.equal(room.monster.name,"Gorthan — The Stone Tyrant");
 assert.equal(room.monster.guardianId,"gorthan");
 assert.equal(room.monster.partySize,2);
 room.monster.hp=0;h.finish(room);
 assert.equal(room.status,"city");
 assert.equal(room.guardianId,null);
 for(const p of room.players.values()){
  assert.equal(p.worldProgress.guardianClears.gorthan,1);
  assert.ok(p.materials.refined>=1);
 }
 assert.ok(h.events.some(x=>x.name==="state"),"The encounter broadcasts authoritative room state.");
});

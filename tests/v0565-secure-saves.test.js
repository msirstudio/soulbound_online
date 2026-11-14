"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {createSecureStore}=require("../persistence/secure-save-v0565");
const {createSecureRuntime}=require("../server/secure-runtime-v0565");
const {serializeHero}=require("../server/hero-state-v0565");
const userId="6fd4fe57-3a20-485c-9f8d-176f0c454430",otherId="d4f739e0-0465-48b6-b496-9c355fae56a5";
const url="https://example.supabase.co",secret="example-test-service-key",pub="example-test-public-key";
function backend(){
 const state=new Map(),logs=[];
 const profiles=new Map([[userId,{class_id:"swordsman",username:"Legacy Hero",level:27,attack:214,defense:77,gold:1200,world_progress:{bossDefeats:{ember:1}}}]]);
 const extras=new Map([[userId+":2",{class_id:"mage",username:"Mage",level:3,gold:99}]]);
 const failure=(status,message,code)=>({ok:false,status,json:async()=>({message,code})});
 const success=data=>({ok:true,status:200,json:async()=>data});
 const request=async(u,opts)=>{
  const target=new URL(u),path=target.pathname,h=opts.headers;
  logs.push({path,method:opts.method,apikey:h.apikey,authorization:h.Authorization});
  if(path==="/auth/v1/user"){
   if(h.apikey!==pub)return failure(403,"Invalid API key");
   const owner=h.Authorization==="Bearer legitimate-user-token"?userId:h.Authorization==="Bearer other-account-token"?otherId:null;
   return owner?success({id:owner}):failure(401,"Invalid token");
  }
  if(h.apikey!==secret||h.Authorization!=="Bearer "+secret)return failure(403,"Server-only API");
  if(path==="/rest/v1/hero_state_v0565"){
   const owner=target.searchParams.get("user_id").replace(/^eq\./,"");
   return success([...state.values()].filter(r=>r.user_id===owner).map(r=>({slot:r.slot,character:r.character,revision:r.revision})));
  }
  if(path==="/rest/v1/profiles"){
   const owner=target.searchParams.get("id").replace(/^eq\./,"");
   return success(profiles.has(owner)?[profiles.get(owner)]:[]);
  }
  if(path==="/rest/v1/hero_save_slots"){
   const owner=target.searchParams.get("user_id").replace(/^eq\./,""),slot=target.searchParams.get("slot").replace(/^eq\./,"");
   const v=extras.get(owner+":"+slot);return success(v?[{data:v}]:[]);
  }
  if(path==="/rest/v1/rpc/secure_hero_commit_v0565"){
   const p=JSON.parse(opts.body),key=p.p_user_id+":"+p.p_slot,old=state.get(key);
   if((old?.revision||0)!==p.p_expected_revision)return failure(409,"revision_conflict","40001");
   const revision=(old?.revision||0)+1;
   state.set(key,{user_id:p.p_user_id,slot:p.p_slot,revision,character:p.p_character});
   return success([{new_revision:revision}]);
  }
  return failure(404,"Unrecognized operation "+path);
 };
 return{state,profiles,extras,request,logs};
}
function storeFor(db){return createSecureStore({env:{SOULBOUND_SECURE_SAVES_ENABLED:"1",SUPABASE_URL:url,
 SUPABASE_SERVICE_ROLE_KEY:secret,SUPABASE_ANON_KEY:pub},request:db.request,logger:{log(){}}})}
test("Strict secure mode fails closed when service key or HTTPS project config is absent",()=>{
 assert.throws(()=>createSecureStore({env:{SOULBOUND_SECURE_SAVES_ENABLED:"1"},request:()=>{}}),/fail closed/);
 assert.equal(createSecureStore({env:{}}).enabled,false);
});
test("Token must resolve to a verified account, not a userId sent by browser",async()=>{
 const db=backend(),store=storeFor(db);
 assert.equal(await store.auth("legitimate-user-token"),userId);
 assert.equal(await store.auth("other-account-token"),otherId);
 await assert.rejects(()=>store.auth("malicious-user-token"),/Invalid token/);
 await assert.rejects(()=>store.auth("bad"),/Invalid access token/);
});
test("One-time legacy import preserves all three slots and never changes the original row",async()=>{
 const db=backend(),store=storeFor(db),before=JSON.stringify(db.profiles.get(userId));
 const rows=await store.getAll(userId);
 assert.equal(rows.length,3);
 assert.equal(rows[0].character.username,"Legacy Hero");
 assert.equal(rows[0].character.level,27);
 assert.equal(rows[0].character.world_progress.bossDefeats.ember,1);
 assert.equal(rows[1].character.class_id,"mage");
 assert.equal(rows[2].character,null);
 assert.equal(rows[0].revision,1);
 assert.equal(rows[1].revision,1);
 assert.equal(JSON.stringify(db.profiles.get(userId)),before,"legacy profile was read-only");
 assert.equal((await store.getAll(userId))[0].revision,1,"migration is idempotent");
});
test("Compare-and-swap revisions prevent stale-tab overwrite",async()=>{
 const db=backend(),store=storeFor(db);
 const first=(await store.getAll(userId))[0];
 const fresh=store.newHero("Knight","tank");
 const a=await store.save(userId,1,first.revision,fresh);
 assert.equal(a.revision,2);
 await assert.rejects(()=>store.save(userId,1,first.revision,{...fresh,gold:999999}),/revision_conflict/);
 assert.equal((await store.getAll(userId))[0].character.gold,80);
 assert.equal((await store.getAll(userId))[0].character.class_id,"tank");
});
test("Deleted slots are tombstoned; old legacy profile cannot reappear",async()=>{
 const db=backend(),store=storeFor(db);
 const rows=await store.getAll(userId);
 await store.erase(userId,2,rows[1].revision);
 const after=await store.getAll(userId);
 assert.equal(after[1].character,null);
 assert.equal(after[1].revision,2);
 assert.ok(db.extras.has(userId+":2"),"historical backup is not deleted");
});
test("Secure socket restore uses the database hero, never client-provided attack values",async()=>{
 const db=backend(),store=storeFor(db),logs=[],emitted=[];
 const room={code:"ABCDE",status:"city",players:new Map([["socket-1",{id:"socket-1",name:"New",level:1}]]),stage:1};
 const handlers={},sock={id:"socket-1",on:(k,fn)=>handlers[k]=fn};
 const mockio={to:()=>({emit:(event,data)=>emitted.push({event,data})})};
 let savedHero=null;
 const runtime=createSecureRuntime({store,io:mockio,audit:(event,data)=>logs.push({event,data}),
  serializeHero:hero=>({username:hero.name,class_id:hero.classId,level:hero.level,attack:hero.attack,world_progress:{}}),
  applyRestoredHero:(p,v)=>{p.name=v.username;p.classId=v.class_id;p.level=v.level;p.attack=v.attack},
  findRoom:()=>room,
  emit:()=>{savedHero=room.players.get("socket-1")}});
 runtime.register(sock);
 const ack=async(ev,data)=>new Promise(resolve=>handlers[ev](data,resolve));
 const restored=await ack("secureRestoreCharacter",{accessToken:"legitimate-user-token",slot:1,
  attack:999999,level:999});
 assert.equal(restored.ok,true);
 assert.equal(savedHero.attack,214,"uses actual stored value");
 assert.equal(savedHero.level,27);
 assert.equal(JSON.stringify(savedHero).includes("_secure"),false,"auth metadata not exposed in room spreads");
 assert.equal(savedHero._secure.userId,userId);
 const deleted=await ack("secureDeleteSlot",{accessToken:"legitimate-user-token",slot:3,expectedRevision:0});
 assert.equal(deleted.ok,true);
 assert.equal((await store.getAll(userId))[2].character,null);
 assert.ok(logs.some(x=>x.event==="hero_verified"));
});

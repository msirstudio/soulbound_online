"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");

test("v0.69 startup preserves old Guest, account and reconnect saves without deleting storage keys",()=>{
 const game=read("public/game.js");
 const begin=game.indexOf("function v065PurgeOldLocalSaves(){");
 const end=game.indexOf("\nv065PurgeOldLocalSaves();",begin);
 assert.ok(begin>0&&end>begin,"expected compatibility startup hook");
 const data=new Map([
  ["soulbound_guest_save_v1",'{"class_id":"mage","level":23}'],
  ["soulbound_hero_slot_v561_guest_2",'{"class_id":"tank","level":12}'],
  ["soulbound_hero_slot_v561_account-123_3",'{"class_id":"archer","level":7}'],
  ["soulbound_world_progress_v040_guest",'{"bossDefeats":{"a":1}}'],
  ["soulbound_character_v064_account-123_1","lyra"],
  ["supabase.auth.token","signed-in-session"]
 ]);
 const sessions=new Map([["soulbound_reconnect_v059_guest",'{"ticket":"keep"}']]);
 const before=[...data],priorSessions=[...sessions];
 const storage=map=>({
  get length(){return map.size;},key:i=>[...map.keys()][i],
  getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,String(value)),
  removeItem:key=>map.delete(key)
 });
 const context={localStorage:storage(data),sessionStorage:storage(sessions),V065_SEASON:"rebirth-2026-11"};
 vm.runInNewContext(game.slice(begin,end)+"\nv065PurgeOldLocalSaves();",context);
 assert.deepEqual([...data],before,"starting the game must not mutate any legacy saved characters");
 assert.deepEqual([...sessions],priorSessions,"starting the game must not remove reconnect credentials");
});

test("old-season slots remain separate from current season, never silently overwritten",()=>{
 const game=read("public/game.js");
 const start=game.indexOf("function v065AcceptSave(slot,data){");
 const end=game.indexOf("\nfunction v064Key(",start);
 assert.ok(start>0&&end>start);
 const backingStore=new Map();
 const context={
  V065_SEASON:"rebirth-2026-11",guestMode:true,v57Mode:false,
  v069PriorSeasonSlots:[null,null,null],
  localStorage:{getItem:key=>backingStore.get(key)||null},
  v065LegacyMarker:()=> "legacy-marker"
 };
 vm.runInNewContext(game.slice(start,end),context);
 const old={class_id:"mage",level:27,inventory:[{id:"legendary_staff"}]};
 assert.equal(context.v065AcceptSave(1,old),null,"old save is not auto-loaded into a new season");
 assert.strictEqual(context.v069PriorSeasonSlots[0],old,"archive candidate is kept in memory for an explicit safe replacement");
 assert.equal(old.level,27);
 assert.equal(old.inventory[0].id,"legendary_staff");
 const current={...old,season_id:"rebirth-2026-11"};
 assert.strictEqual(context.v065AcceptSave(1,current),current);
});

test("three slots are still available, and Guest/account storage keys are namespaced",()=>{
 const game=read("public/game.js");
 assert.match(game,/let v561Slot=1,v561Slots=\[null,null,null\]/);
 assert.match(game,/function v561Key\(slot\).*guestMode\?"guest":currentUser\?\.id/);
 assert.match(game,/function v064Key\(slot=v561Slot\).*guestMode\?'guest':currentUser\?\.id/);
 assert.match(game,/slot===1&&guestMode\?"soulbound_guest_save_v1":v561Key\(slot\)/);
 assert.match(game,/if\(savedCharacter\?\.class_id&&!confirm\("Replace SLOT "/);
 assert.match(game,/before-new-game/,"replacement must create a backup before writing");
});

test("replacing an old-season slot creates a distinct durable archive, never overwriting it",()=>{
 const game=read("public/game.js");
 const start=game.indexOf("function v069ArchivePriorSeason(slot,data){");
 const end=game.indexOf("\nfunction v564SnapshotData(",start);
 assert.ok(start>0&&end>start);
 const data=new Map();
 const store={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
 const ctx={localStorage:store,v564Owner:()=>"guest"};
 vm.runInNewContext(game.slice(start,end),ctx);
 const first={class_id:"mage",level:42,season_id:"old-season",materials:{ancient:7}};
 assert.equal(ctx.v069ArchivePriorSeason(1,first),true);
 const archiveName=[...data.keys()][0];
 assert.match(archiveName,/guest_slot_1_old-season$/);
 assert.equal(JSON.parse(data.get(archiveName)).level,42);
 assert.equal(ctx.v069ArchivePriorSeason(1,{class_id:"mage",level:1,season_id:"old-season"}),true);
 assert.equal(JSON.parse(data.get(archiveName)).level,42,"first archive must be immutable");
 ctx.v564Owner=()=>"account-123";
 assert.equal(ctx.v069ArchivePriorSeason(1,first),true);
 assert.equal(data.size,2,"different owners must never share archive keys");
});

test("recovery backups preserve character, season, materials, Forge history and GM grants",()=>{
 const data=new Map(),ctx={window:{},localStorage:{setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)||null}};
 vm.runInNewContext(read("public/save-guard-v0564.js"),ctx);
 const hero={username:"Lyra",class_id:"mage",character_id:"lyra",gender:"female",
  season_id:"rebirth-2026-11",level:22,materials:{ancient:3},forge_history:[{requestId:"id-01"}],
  gm_grants:[{requestId:"gm-01"}]};
 assert.equal(ctx.window.SoulboundSaveGuardV564.snapshot("guest",2,hero,"before-replace"),true);
 const backup=JSON.parse([...data.values()][0]).character;
 for(const k of ["character_id","gender","season_id","materials","forge_history","gm_grants"])
  assert.deepEqual(backup[k],hero[k],k+" must survive backup serialization");
});

test("all seven character identities have real portraits and full-body art on disk",()=>{
 const heroes=require("../public/characters-v064");
 assert.equal(heroes.HEROES.length,7);
 assert.equal(heroes.CLASS_META.length,6);
 for(const hero of heroes.HEROES){
  for(const asset of [hero.portrait,hero.full]){
   const file=path.join(root,"public","assets","character-select",asset);
   assert.ok(fs.existsSync(file),hero.id+" missing "+asset);
   assert.ok(fs.statSync(file).size>1000,asset+" is empty or only a placeholder");
  }
 }
 const hall=path.join(root,"public/assets/character-select/guild-hall.webp");
 assert.ok(fs.existsSync(hall)&&fs.statSync(hall).size>1000);
});

test("Secure Saves capture forge materials/history and the guest save path serializes them",()=>{
 const secure=read("persistence/secure-saves-v057.js");
 const client=read("public/game.js");
 const forge=read("forge/forge-v068.js");
 assert.match(secure,/materials:require\("\.\.\/forge\/forge-v068"\)\.normalizeMaterials\(p\.materials\)/);
 assert.match(secure,/forge_history:require\("\.\.\/forge\/forge-v068"\)\.record\(p\.forgeHistory\)/);
 assert.match(client,/materials:p\.materials\|\|\{basic:0,refined:0,ancient:0\}/);
 assert.match(client,/forge_history:p\.forgeHistory\|\|\[\]/);
 assert.match(client,/if\(guestMode\)\{v561WriteLocal\(1,full\)/);
 assert.match(forge,/function attempt\(/);
});

test("version endpoint and staging deployment remain explicit and production-safe",()=>{
 const server=read("server.js"),pkg=JSON.parse(read("package.json"));
 assert.equal(pkg.version,"0.68.0","audit branch is deliberately NOT marked released v0.69");
 assert.match(server,/app\.get\("\/health".*version:APP_VERSION/);
 assert.doesNotMatch(server,/SUPABASE-V065-ONE-TIME-RESET/);
 const sql=read("SUPABASE-V065-ONE-TIME-RESET-ALL-PROGRESS.sql");
 assert.match(sql,/DELETE FROM public\.hero_secure_saves/,"destructive SQL remains a manual file only");
});

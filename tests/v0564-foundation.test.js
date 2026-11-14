"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {audit}=require("../scripts/audit-foundation-v0564.js");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("foundation audit detects version and save safety invariants without claiming security fixes",()=>{
 const result=audit();
 assert.equal(result.pass,true,result.failed.join("; "));
 assert.ok(result.passed.length>=10);
 assert.ok(result.risks.some(r=>r.includes("P0 OPEN: legacy restoreCharacter")));
 assert.equal(result.version,"0.57.0");
});
test("slot-specific local recovery snapshots never include account secrets",()=>{
 const saved=new Map();
 const storage={
  setItem:(key,val)=>saved.set(key,val),
  getItem:key=>saved.get(key)||null
 };
 const downloads=[];
 const anchor={click:()=>downloads.push("clicked"),remove(){},set href(v){this._href=v},set download(v){downloads.push(v)}};
 const sandbox={
  window:{},localStorage:storage,
  document:{createElement:()=>anchor,body:{appendChild(){}}},
  Blob:class{constructor(parts,opts){this.parts=parts;this.type=opts.type}},
  URL:{createObjectURL:()=> "blob:local",revokeObjectURL(){}},
  Date,JSON,Number,String,Object
 };
 vm.runInNewContext(read("public/save-guard-v0564.js"),sandbox);
 const guard=sandbox.window.SoulboundSaveGuardV564;
 const hero={username:"Mage",class_id:"mage",level:27,gold:1200,inventory:[{id:"staff"}],
  world_progress:{bossDefeats:{"ember":1}},id:"auth-user-id",access_token:"SECRET"};
 assert.equal(guard.snapshot("account-one",2,hero,"before-delete"),true);
 assert.equal(guard.snapshot("account-one",3,{...hero,username:"Knight",class_id:"tank"},"before-new-game"),true);
 const slot2=guard.lastBackup("account-one",2);
 assert.equal(slot2.character.username,"Mage");
 assert.equal(slot2.character.level,27);
 assert.equal(slot2.character.access_token,undefined);
 assert.equal(slot2.character.id,undefined);
 assert.equal(guard.lastBackup("account-one",1),null);
 assert.equal(guard.lastBackup("account-one",3).character.username,"Knight");
 assert.equal(guard.exportBackup("account-one",2),true);
 assert.ok(downloads.some(v=>typeof v==="string"&&v.includes("SOULBOUND_slot_2_backup")));
 assert.equal(guard.exportCurrent(1,hero),true);
 assert.equal(guard.exportBackup("account-one",1),false);
 assert.throws(()=>guard.key("account-one",4),/Invalid save slot/);
});
test("destructive operations keep existing data when browser backup is unavailable",()=>{
 const sandbox={window:{},localStorage:{setItem(){throw new Error("Quota exceeded")},getItem:()=>null},Date,JSON,Number,String,Object};
 vm.runInNewContext(read("public/save-guard-v0564.js"),sandbox);
 const guard=sandbox.window.SoulboundSaveGuardV564;
 assert.equal(guard.snapshot("guest",1,{class_id:"swordsman"},"before-delete"),false);
 const game=read("public/game.js");
 assert.ok(game.includes('if(!window.SoulboundSaveGuardV564?.snapshot(v564Owner(),n,v564SnapshotData(n,v561Slots[n-1]),"before-delete"))return notice('));
 assert.ok(game.includes('if(savedCharacter?.class_id&&!window.SoulboundSaveGuardV564?.snapshot('));
});
test("server releases canonical package version and UI fallback agrees",()=>{
 const server=read("server.js"),html=read("public/index.html");
 assert.ok(server.includes('version:APP_VERSION'));
 assert.ok(server.includes('readFileSync(path.join(__dirname,"package.json"),"utf8")'));
 assert.ok(html.includes("v0.57"));
 assert.ok(html.includes('version-v0564.js?v=0.57'));
});

test("pre-change backup merges the correct world-progress slot and never uses freshWorld early",()=>{
 const game=read("public/game.js");
 const begin=game.indexOf("function v564SnapshotData("),end=game.indexOf("async function v561Delete(",begin);
 assert.ok(begin>=0&&end>begin);
 const cache=new Map([
  ["world_1",JSON.stringify({bossDefeats:{region1:1}})],
  ["world_2",JSON.stringify({bossDefeats:{region2:3}})],
  ["world_3",JSON.stringify({bossDefeats:{region3:2}})]
 ]);
 const extract=new Function("localStorage","v40WorldKeyFor","v40MergeWorld","v57Mode",
   game.slice(begin,end)+";return v564SnapshotData");
 const backup=extract(
  {getItem:key=>cache.get(key)||null},
  slot=>"world_"+slot,
  (cloud,local)=>({bossDefeats:{...(cloud?.bossDefeats||{}),...(local?.bossDefeats||{})}}),false
 );
 const saved=backup(2,{class_id:"mage",world_progress:{bossDefeats:{earlier:1}}});
 assert.equal(saved.world_progress.bossDefeats.region2,3);
 assert.equal(saved.world_progress.bossDefeats.earlier,1);
 assert.equal(saved.world_progress.bossDefeats.region1,undefined);
 const start=game.indexOf('$("newGame").onclick=async()=>{');
 const fresh=game.indexOf("const freshWorld=",start);
 assert.ok(start>=0&&fresh>start);
 assert.ok(!game.slice(start,fresh).includes("world_progress:freshWorld"));
 assert.ok(game.slice(start,fresh).includes("v564SnapshotData(v561Slot,savedCharacter)"));
});

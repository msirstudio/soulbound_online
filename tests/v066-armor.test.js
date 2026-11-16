"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const armor=require("../items/armor-shop-v066");
const catalog=require("../data/game-catalog-v062");
const loot=require("../loot-v034");
const world=require("../world-v040");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const classes=["swordsman","tank","archer","assassin","mage","priest"];
function hero(classId="swordsman",level=50){
 return {name:"Tester",classId,level,inventory:[],weaponItem:null,armorItem:null,
  atk:40,def:14,maxHp:200,maxMp:70,hp:200,mp:70,
  weapon:"Training Sword",armor:"Traveler Armor",worldProgress:world.normalizeProgress(null)};
}
test("v0.66: three armor categories cover all six classes, 18 unique chest pieces",()=>{
 assert.deepEqual(armor.GROUPS.heavy,["swordsman","tank"]);
 assert.deepEqual(armor.GROUPS.medium,["archer","assassin"]);
 assert.deepEqual(armor.GROUPS.light,["mage","priest"]);
 const all=catalog.shopItems.filter(i=>i.slot==="armor");
 assert.equal(all.length,18);
 assert.equal(armor.NEW_ARMOR.length,12);
 assert.equal(new Set(all.map(i=>i.id)).size,18);
 for(const type of ["heavy","medium","light"]){
  const group=all.filter(i=>i.armorType===type);
  assert.equal(group.length,6,type);
  for(const item of group){
   assert.deepEqual(item.allowedClasses,[...armor.GROUPS[type]]);
   assert.equal(item.category,"armor");
   assert.ok(item.price>0&&item.defense>0&&item.level>=1);
  }
  assert.deepEqual(group.map(i=>i.level).sort((a,b)=>a-b),[1,3,5,12,20,45]);
 }
 for(const cls of classes)assert.equal(armor.classArmorType(cls),["swordsman","tank"].includes(cls)?"heavy":["archer","assassin"].includes(cls)?"medium":"light");
});
test("v0.66: all shop armor classes are enforced at purchase and equip",()=>{
 const all=catalog.shopItems.filter(i=>i.slot==="armor");
 for(const cls of classes){
  const p=hero(cls);
  for(const item of all){
   const expected=item.armorType===armor.classArmorType(cls);
   assert.equal(armor.canUse(p,item),expected,cls+" "+item.id);
   assert.equal(armor.checkPurchase(p,item).ok,expected,cls+" "+item.id);
  }
  const other=all.find(i=>i.armorType!==armor.classArmorType(cls));
  p.inventory=[loot.canonical({id:other.id,uid:"owned_item_1234"},catalog.shopItems)];
  const starting={def:p.def,maxHp:p.maxHp,maxMp:p.maxMp};
  const result=loot.equip(p,"owned_item_1234","chest",catalog.shopItems);
  assert.equal(result.ok,false);
  assert.deepEqual({def:p.def,maxHp:p.maxHp,maxMp:p.maxMp},starting,"failed equip must never alter stats");
 }
});
test("v0.66: each class can buy and wear proper armor, swap it and revert stats",()=>{
 const all=catalog.shopItems.filter(i=>i.slot==="armor");
 for(const cls of classes){
  const p=hero(cls);
  const compatible=all.filter(i=>i.armorType===armor.classArmorType(cls));
  p.inventory=loot.normalizeInventory(compatible.slice(0,2).map((i,n)=>({id:i.id,uid:"test_armor_"+cls+"_"+n})),catalog.shopItems);
  const base={def:p.def,hp:p.maxHp,mp:p.maxMp};
  assert.equal(loot.equip(p,p.inventory[0].uid,"chest",catalog.shopItems).ok,true);
  assert.equal(p.armorItem.id,p.inventory[0].id);
  assert.equal(loot.equip(p,p.inventory[1].uid,"chest",catalog.shopItems).ok,true);
  assert.equal(p.armorItem.id,p.inventory[1].id);
  assert.equal(p.inventory.filter(i=>i.equippedSlot==="chest").length,1);
  assert.equal(loot.unequip(p,"chest").ok,true);
  assert.deepEqual({def:p.def,hp:p.maxHp,mp:p.maxMp},base,cls);
 }
});
test("v0.66: typed boss armor stats survive canonical save restore and cannot be worn by other classes",()=>{
 const orig=Math.random;
 try{
  Math.random=()=>0;
  for(const cls of classes){
   const p=hero(cls);
   const earned=loot.dropBossLoot(p,10,()=>{});
   const chest=earned.find(i=>i.slot==="chest");
   assert.ok(chest,cls);
   assert.equal(chest.armorType,armor.classArmorType(cls));
   assert.deepEqual(chest.allowedClasses,[...armor.GROUPS[chest.armorType]]);
   const save={...chest,defense:999999,maxHp:999999,maxMp:999999,allowedClasses:["swordsman","mage","tank"]};
   const restored=loot.canonical(save,catalog.shopItems);
   assert.equal(restored.defense,chest.defense);
   assert.equal(restored.maxHp,chest.maxHp);
   assert.equal(restored.maxMp,chest.maxMp);
   assert.deepEqual(restored.allowedClasses,[...armor.GROUPS[chest.armorType]]);
   const wrong=classes.find(c=>armor.classArmorType(c)!==chest.armorType);
   const mismatch=hero(wrong);
   mismatch.inventory=[restored];
   assert.equal(loot.equip(mismatch,restored.uid,"chest",catalog.shopItems).ok,false);
  }
 }finally{Math.random=orig}
});
test("v0.66: historical untyped boss gear retains original stats and remains equippable",()=>{
 const saved={id:"boss2_chest",rarity:"rare",uid:"legacy_chest_0001"};
 const old=loot.canonical(saved,catalog.shopItems);
 assert.equal(old.armorType,undefined);
 assert.equal(old.allowedClasses,undefined);
 const p=hero("mage");p.inventory=[old];
 assert.equal(loot.equip(p,old.uid,"chest",catalog.shopItems).ok,true);
 assert.equal(loot.unequip(p,"chest").ok,true);
});
function socketHarness(){
 let connect;const events=[];
 const app={use(){},get(){}},express=()=>app;express.static=()=>()=>{};
 class Server{on(event,cb){if(event==="connection")connect=cb}to(room){return{emit:(name,state)=>events.push({room,name,state})}}}
 const source=read("server.js");
 const deps=name=>name==="express"?express:name==="http"?{createServer:()=>({listen(){}})}:
   name==="socket.io"?{Server}:name==="path"?path:name==="./loot-v034"?loot:name==="./world-v040"?world:
   name==="./combat-v055"?require("../combat-v055"):require(name);
 const runtime=new Function("require","process","console","__dirname","setTimeout",source+";return {rooms};")(
   deps,{env:{}},{log(){},error(){}},root,fn=>{fn();return 0});
 const user=id=>{
  const handlers={};connect({id,join(){},on:(event,cb)=>handlers[event]=cb});
  return{call:(event,data={})=>new Promise((resolve,reject)=>{try{handlers[event](data,resolve)}catch(e){reject(e)}})};
 };
 return {user,rooms:runtime.rooms,events};
}
test("v0.66: real socket merchant rejects wrong weight before charging and equips correct gear",async()=>{
 const h=socketHarness(),u=h.user("archer-hero");
 const room=await u.call("createRoom",{name:"Archer",classId:"archer",guest:true});
 assert.equal(room.ok,true);
 await u.call("restoreCharacter",{class_id:"archer",level:20,gold:10000,guest:true});
 assert.equal((await u.call("openShop",{category:"armor"})).ok,true);
 const player=h.rooms.get(room.code).players.get("archer-hero");
 const goldBefore=player.gold;
 const wrong=await u.call("buyItem",{itemId:"guardian_plate"});
 assert.equal(wrong.ok,false);assert.match(wrong.error,/Heavy|Swordsman|Tank/i);
 assert.equal(player.gold,goldBefore);
 const purchased=await u.call("buyItem",{itemId:"stormrunner_coat"});
 assert.equal(purchased.ok,true);
 assert.equal(player.gold,goldBefore-2900);
 const owned=player.inventory.find(i=>i.id==="stormrunner_coat");
 assert.ok(owned&&owned.uid);
 assert.equal((await u.call("equipItem",{itemId:owned.uid,targetSlot:"chest"})).ok,true);
 assert.equal(player.armorItem.id,"stormrunner_coat");
 assert.equal(player.armor,"Stormrunner Coat");
 assert.equal((await u.call("unequipItem",{slot:"chest"})).ok,true);
});
test("v0.66: merchant UI filters armor by class and shows weight labels without new save schema",()=>{
 const ui=read("public/game.js"),equip=read("public/equipment-inventory-v032.js"),html=read("public/index.html"),server=read("server.js");
 assert.ok(ui.includes('it.category!=="armor"||!it.allowedClasses||it.allowedClasses.includes(me?.classId)'));
 assert.ok(ui.includes("v066-armor-chip"));
 assert.ok(equip.includes('!item.allowedClasses||item.allowedClasses.includes(me?.classId)'));
 assert.ok(html.includes('v066-armor.css?v=0.66'));
 assert.ok(server.includes("armorCatalog.checkPurchase(p,it)"));
 assert.ok(server.includes("loot.equip(p,itemId,targetSlot,shopItems)"));
 assert.equal(JSON.parse(read("package.json")).version,"0.66.0");
});

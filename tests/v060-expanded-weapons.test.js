"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const catalog=require("../items/weapon-shop-v060"),loot=require("../loot-v034"),world=require("../world-v040");
test("15 genuinely distinct new weapons, 5 per class, one every progression tier",()=>{
 const items=catalog.WEAPONS;
 assert.equal(items.length,15);
 assert.equal(new Set(items.map(i=>i.id)).size,15);
 for(const cls of ["swordsman","mage","tank"]){
  const group=items.filter(i=>i.class===cls);
  assert.equal(group.length,5);
  assert.deepEqual(group.map(i=>i.level),[15,25,40,55,70]);
  assert.ok(group.every(i=>i.slot==="weapon"&&i.category==="weapon"&&i.price>0&&i.value>28&&i.requiredBoss));
  assert.ok(group.every((i,n)=>!n||(i.price>group[n-1].price&&i.value>group[n-1].value)));
  assert.ok(group.every(i=>!i.element&&!i.onHit&&!i.statusEffect),"Elemental procs are intentionally reserved for 0.61");
 }
});
test("Boss clear and character level are both required; wrong class is never allowed",()=>{
 const sword=catalog.WEAPONS.find(i=>i.id==="flamebrand");
 const player={classId:"swordsman",level:25,worldProgress:world.normalizeProgress(null)};
 assert.match(catalog.checkPurchase(player,sword).error,/Defeat/);
 player.worldProgress=world.markBossClear(player.worldProgress,"dreadforge_bastion");
 assert.equal(catalog.checkPurchase(player,sword).ok,true);
 player.level=24;assert.match(catalog.checkPurchase(player,sword).error,/level 25/);
 player.level=25;player.classId="mage";assert.match(catalog.checkPurchase(player,sword).error,/another class/);
 const end=catalog.WEAPONS.find(i=>i.id==="dawnbringer");
 player.classId="swordsman";player.level=70;
 assert.equal(catalog.checkPurchase(player,end).ok,false);
 player.worldProgress=world.markBossClear(player.worldProgress,"abyssal_rift");
 assert.equal(catalog.checkPurchase(player,end).ok,true);
});
test("New weapons survive canonical inventory load, correct equip UIDs, swap and stat removal",()=>{
 const older=catalog.WEAPONS.find(i=>i.id==="silver_fang"),newer=catalog.WEAPONS.find(i=>i.id==="flamebrand");
 const templates=[older,newer];
 const inventory=loot.normalizeInventory([
  {id:older.id,uid:"silverfanguid001"},
  {id:newer.id,uid:"flamebranduid002"},
  {id:newer.id,uid:"flamebranduid003"}
 ],templates);
 assert.equal(inventory.length,3);
 assert.equal(new Set(inventory.map(i=>i.uid)).size,3);
 assert.equal(inventory[2].value,newer.value);
 const p={classId:"swordsman",level:25,inventory,atk:100,def:20,maxHp:300,maxMp:40,hp:300,mp:40,weapon:"Training Sword",weaponItem:null};
 let r=loot.equip(p,"silverfanguid001","main",templates);
 assert.equal(r.ok,true);assert.equal(p.atk,142);
 r=loot.equip(p,"flamebranduid003","main",templates);
 assert.equal(r.ok,true);assert.equal(p.atk,159);
 assert.equal(p.weaponItem.uid,"flamebranduid003");
 assert.equal(loot.unequip(p,"main").ok,true);
 assert.equal(p.atk,100);
 assert.equal(p.weapon,"Training Sword");
});
function harness(){
 let connect;const events=[];
 const app={use(){},get(){}},express=()=>app;express.static=()=>()=>{};
 class Server{on(event,fn){if(event==="connection")connect=fn}to(room){return{emit:(name,s)=>events.push({room,name,s})}}}
 const source=read("server.js");
 const deps=name=>name==="express"?express:name==="http"?{createServer:()=>({listen(){}})}:name==="socket.io"?{Server}:name==="path"?path:name==="./loot-v034"?loot:name==="./world-v040"?world:name==="./combat-v055"?require("../combat-v055"):require(name);
 const runtime=new Function("require","process","console","__dirname","setTimeout",source+";return {rooms};")(
  deps,{env:{}},{log(){},error(){}},root,fn=>{fn();return 0});
 const user=id=>{
  const handlers={};connect({id,join(){},on:(event,cb)=>handlers[event]=cb});
  return{call:(event,payload={})=>new Promise((resolve,reject)=>{try{handlers[event](payload,resolve)}catch(e){reject(e)}})};
 };
 return{user,rooms:runtime.rooms,last:()=>events.at(-1)?.s};
}
test("Real Socket shop sells valid progression weapons, blocks premature unlocks and never charges for failures",async()=>{
 const h=harness(),u=h.user("hero");
 const room=await u.call("createRoom",{name:"Hero",classId:"swordsman",guest:true});
 assert.equal(room.ok,true);
 await u.call("restoreCharacter",{class_id:"swordsman",level:25,gold:9000,attack:100,guest:true});
 assert.equal((await u.call("openShop",{category:"weapon"})).ok,true);
 const r=h.rooms.get(room.code),p=r.players.get("hero"),gold=p.gold;
 assert.equal(r.status,"shop");
 assert.equal(r.shopCategory,"weapon");
 assert.equal(h.last().shopItems.filter(i=>i.slot==="weapon").length,24);
 assert.equal(h.last().shopItems.find(i=>i.id==="flamebrand").category,"weapon");
 assert.equal((await u.call("buyItem",{itemId:"iron_sword"})).ok,true,"fix legacy weapon category buy bug");
 assert.equal(p.gold,gold-120);
 const before=p.gold;
 const blocked=await u.call("buyItem",{itemId:"flamebrand"});
 assert.equal(blocked.ok,false);assert.match(blocked.error,/Defeat/);
 assert.equal(p.gold,before);
 assert.equal(p.inventory.filter(x=>x.id==="flamebrand").length,0);
 p.worldProgress=world.markBossClear(p.worldProgress,"dreadforge_bastion");
 const purchase=await u.call("buyItem",{itemId:"flamebrand"});
 assert.equal(purchase.ok,true);
 assert.equal(p.gold,before-3600);
 const item=p.inventory.find(x=>x.id==="flamebrand");
 assert.ok(item?.uid);
 assert.equal((await u.call("equipItem",{itemId:item.uid,targetSlot:"main"})).ok,true);
 assert.equal(p.weapon,"Flamebrand");
 assert.equal(p.weaponItem.uid,item.uid);
 assert.equal(p.atk,159);
});
test("Shop rejects cross-class purchases, insufficient gold, high-level gates and nonshop item IDs",async()=>{
 const h=harness(),u=h.user("mage");
 const {code}=await u.call("createRoom",{name:"Mage",classId:"mage",guest:true});
 await u.call("restoreCharacter",{class_id:"mage",level:27,gold:200,guest:true});
 await u.call("openShop",{category:"weapon"});
 const p=h.rooms.get(code).players.get("mage"),before=p.gold;
 for(const id of ["flamebrand","frost_scepter","dawnbringer","not_a_weapon"]){
  const res=await u.call("buyItem",{itemId:id});
  assert.equal(res.ok,false,id);
  assert.equal(p.gold,before,id);
 }
});
test("Shop UI shows class filtering, locks and precise per-copy equip and release 0.60",()=>{
 const client=read("public/game.js"),server=read("server.js"),html=read("public/index.html");
 assert.ok(client.includes('it.category!=="weapon"||it.class===me?.classId'));
 assert.ok(client.includes("const v060BossClear="));
 assert.ok(client.includes('data-equip="\'+esc(it.uid||it.id)+\'"'));
 assert.ok(server.includes("weaponCatalog.checkPurchase(p,it)"));
 assert.ok(server.includes('it.slot==="weapon"?"weapon":it.slot==="armor"?"armor":"potion"'));
 assert.equal(JSON.parse(read("package.json")).version,"0.60.0");
 assert.ok(html.includes("<small>v0.60</small>"));
 assert.ok(html.includes('game.js?v=0.60'));
});

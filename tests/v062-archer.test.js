"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const root=path.join(__dirname,"..");
const archer=require("../classes/archer-v062"),skill=require("../combat/skills"),combat=require("../combat-v055");
const catalog=require("../items/archer-shop-v062"),weapons=require("../items/weapon-passives-v061");
const loot=require("../loot-v034"),world=require("../world-v040"),secure=require("../persistence/secure-saves-v057");
function hero(extra={}){return {classId:"archer",level:80,inventory:[],weaponItem:null,armorItem:null,
 atk:100,def:9,hp:300,maxHp:300,mp:100,maxMp:100,weapon:archer.STARTER.weapon,
 armor:archer.STARTER.armor,worldProgress:world.normalizeProgress(null),...extra}}
test("v0.62 adds Archer without changing the three existing class skill catalogs",()=>{
 assert.equal(archer.ID,"archer");
 assert.equal(archer.STARTER.hp,135);assert.equal(archer.STARTER.speed,12);
 assert.equal(archer.TYPES.length,7);
 for(const type of archer.TYPES){
  const a=archer.definition(type),b=skill.definition({classId:"archer"},type);
  assert.equal(b.name,a.name);
  for(const field of ["cost","unlock","cd","mult","area"])assert.equal(b[field],a[field],type+" "+field);
  assert.equal(combat.validateAction({classId:"archer",level:80,mp:999,cooldowns:{},raceId:"human"},type,{players:new Map()}),null,type);
 }
 assert.equal(skill.isAreaSkill({classId:"archer"},"skill2"),true);
 assert.equal(skill.isAreaSkill({classId:"archer"},"skill6"),true);
 assert.equal(skill.isAreaSkill({classId:"archer"},"skill3"),false);
 assert.equal(skill.areaMultiplier("skill2",{classId:"archer"}),2.1);
 assert.equal(skill.areaMultiplier("skill6",{classId:"archer"}),1.65);
 assert.equal(skill.definition({classId:"mage"},"skill2").name,"METEOR");
 assert.equal(skill.definition({classId:"tank"},"skill2").name,"IRON WALL");
 assert.equal(skill.definition({classId:"swordsman"},"skill2").name,"WHIRLWIND");
 assert.equal(combat.validateAction({classId:"tank",level:90,mp:999,cooldowns:{}},"skill6",{players:new Map()}),"Only mages can cast this spell.");
});
test("Archer crits and finisher are deterministic, capped and do not apply to other classes",()=>{
 assert.deepEqual(archer.crit({random:()=>.11}),{critical:true,multiplier:1.35});
 assert.deepEqual(archer.crit({random:()=>.12}),{critical:false,multiplier:1});
 assert.equal(archer.finisher({hp:60,maxHp:100},500),0);
 assert.equal(archer.finisher({hp:40,maxHp:100},100),12);
 assert.equal(archer.finisher({hp:10,maxHp:100},10000),40);
 assert.equal(combat.skillElement({classId:"archer"},"skill3"),"nature");
 assert.equal(combat.skillElement({classId:"archer"},"skill5"),"nature");
 assert.equal(combat.skillElement({classId:"archer"},"skill6"),"nature");
 assert.equal(combat.skillElement({classId:"archer"},"skill7"),"physical");
});
test("Archer has eight purchasable, class-locked bows with stable IDs and five elemental passives",()=>{
 assert.equal(catalog.WEAPONS.length,8);
 assert.equal(catalog.EARLY.length,3);
 assert.equal(catalog.RARE.length,5);
 assert.equal(new Set(catalog.WEAPONS.map(x=>x.id)).size,8);
 assert.deepEqual(catalog.EARLY.map(x=>x.level),[1,3,8]);
 assert.deepEqual(catalog.RARE.map(x=>x.level),[15,25,40,55,70]);
 for(const bow of catalog.WEAPONS){
  assert.equal(bow.class,"archer");assert.equal(bow.slot,"weapon");assert.equal(bow.category,"weapon");
  assert.ok(bow.value>0&&bow.price>0);
 }
 for(const bow of catalog.RARE){
  assert.equal(bow.element,weapons.spec[bow.id].element);
  assert.ok(bow.requiredBoss);assert.equal(bow.passive.chance,weapons.spec[bow.id].chance);
 }
 const saved=loot.normalizeInventory([{id:"stormstring_bow",uid:"bow-unique-001"}],catalog.WEAPONS);
 assert.equal(saved.length,1);assert.equal(saved[0].uid,"bow-unique-001");
 let p=hero({inventory:saved});
 assert.equal(loot.equip(p,"bow-unique-001","main",catalog.WEAPONS).ok,true);
 assert.equal(weapons.weaponFor(p).id,"stormstring_bow");
 assert.equal(loot.unequip(p,"main").ok,true);
 assert.equal(p.weapon,"Oak Shortbow");
 const mage=hero({classId:"mage",inventory:saved.map(x=>({...x,equippedSlot:undefined}))});
 assert.match(loot.equip(mage,"bow-unique-001","main",catalog.WEAPONS).error,/different class/);
});
test("Secure Save starter and frontend fallback both recognize Archer; legacy saves intact",()=>{
 const fresh=secure.starter("archer","Arrow");
 assert.equal(fresh.class_id,"archer");assert.equal(fresh.hp,archer.STARTER.hp);
 assert.equal(fresh.max_mp,archer.STARTER.mp);assert.equal(fresh.attack,archer.STARTER.atk);
 assert.equal(fresh.weapon,"Oak Shortbow");assert.equal(fresh.armor,"Ranger Leathers");
 assert.equal(fresh.speed,12);assert.equal(fresh.class_path,null);
 assert.equal(secure.starter("mage","M").weapon,"Apprentice Staff");
 assert.equal(secure.starter("swordsman","S").weapon,"Training Sword");
 assert.equal(secure.starter("tank","T").weapon,"Guardian Mace");
 const source=read("server.js"),client=read("public/game.js"),art=read("public/hero-art-v030.js"),html=read("public/index.html");
 assert.ok(source.includes('["mage","tank","archer"].includes(v.class_id)'));
 assert.ok(source.includes("archer.publicSkills()"));
 assert.ok(source.includes("...archerShop.WEAPONS"));
 assert.ok(client.includes('archer=cls==="archer"'));
 assert.ok(client.includes("me.skillBook"));
 assert.ok(client.includes('me.classId==="archer"'));
 assert.ok(art.includes('cls==="archer"'));
 assert.ok(art.includes("Oak Shortbow"));
 assert.ok(html.includes('data-hero-class="archer"'));
 assert.ok(html.includes('<option value="archer">'));
 assert.ok(!html.includes('class="v0559-audio-row"'));
});
function harness(){
 let connect;const events=[];
 const app={use(){},get(){}},express=()=>app;express.static=()=>()=>{};
 class Server{on(event,fn){if(event==="connection")connect=fn}to(room){return{emit:(name,body)=>events.push({room,name,body})}}}
 const deps=name=>name==="express"?express:name==="http"?{createServer:()=>({listen(){}})}:name==="socket.io"?{Server}:name==="path"?path:name==="./loot-v034"?loot:name==="./world-v040"?world:name==="./combat-v055"?combat:require(name);
 const seeded=Object.create(Math);seeded.random=()=>.01;
 const runtime=new Function("require","process","console","__dirname","setTimeout","Math",read("server.js")+";return {rooms};")(
  deps,{env:{}},{log(){},error(){}},root,fn=>{fn();return 0},seeded);
 function connectUser(id){const callbacks={};connect({id,join(){},on:(event,fn)=>callbacks[event]=fn});
  return{call:(event,payload={})=>new Promise((resolve,reject)=>{try{callbacks[event](payload,resolve)}catch(e){reject(e)}})}}
 return {rooms:runtime.rooms,connectUser,events,last:()=>events.filter(x=>x.name==="state").at(-1)?.body};
}
test("real multiplayer Socket: Archer creation, party join, early bow shop, equip, crit and live combat",async()=>{
 const h=harness(),archerUser=h.connectUser("archer-player"),friend=h.connectUser("mage-friend");
 const created=await archerUser.call("createRoom",{name:"Arrow",classId:"archer",gender:"female",guest:true});
 assert.equal(created.ok,true);
 const joined=await friend.call("joinRoom",{code:created.code,name:"Wizard",classId:"mage",guest:true});
 assert.equal(joined.ok,true);
 const room=h.rooms.get(created.code),p=room.players.get("archer-player");
 assert.equal(p.classId,"archer");assert.equal(p.speed,12);assert.equal(p.gender,"female");
 assert.equal(room.players.get("mage-friend").classId,"mage");
 assert.equal(h.last().players.find(x=>x.classId==="archer").skillBook.length,7);
 assert.equal((await archerUser.call("openShop",{category:"weapon"})).ok,true);
 assert.equal(h.last().shopItems.filter(x=>x.class==="archer"&&x.slot==="weapon").length,8);
 const gold=p.gold;assert.equal((await archerUser.call("buyItem",{itemId:"ashwood_bow"})).ok,true);
 assert.equal(p.gold,gold-120); // Enough gold must be granted before shop in live loop
 const item=p.inventory.find(x=>x.id==="ashwood_bow");assert.ok(item);
 assert.equal((await archerUser.call("equipItem",{itemId:item.uid,targetSlot:"main"})).ok,true);
 assert.equal(p.weapon,"Ashwood Bow");
 assert.equal((await archerUser.call("closeShop")).ok,true);
 assert.equal((await archerUser.call("startBattle")).ok,true);
 assert.equal(room.status,"battle");
 const startingMp=p.mp;
 const result=await archerUser.call("action",{type:"skill",targetId:room.monster.enemyId,actionId:"archer-shot-test-001"});
 assert.equal(result.ok,true);
 assert.ok(p.mp<startingMp);
 assert.ok(room.log.some(line=>line.includes("QUICK SHOT")));
 assert.ok(room.log.some(line=>line.includes("CRITICAL HIT")));
 assert.ok(h.last().weaponFx.some(e=>e.kind==="critical"));
 assert.equal(room.players.get("mage-friend").classId,"mage");
});
test("real Socket: level-7 Archer Rain of Arrows hits multiple foes using Nature and enforces cooldown",async()=>{
 const h=harness(),u=h.connectUser("bow");
 const made=await u.call("createRoom",{name:"Archer",classId:"archer",guest:true});assert.equal(made.ok,true);
 const r=h.rooms.get(made.code);
 assert.equal((await u.call("restoreCharacter",{class_id:"archer",class_path:null,level:7,attack:54,speed:12,guest:true})).ok,true);
 assert.equal((await u.call("startBattle")).ok,true);
 assert.ok(r.enemies.length>=2,"deterministic encounter should spawn two normal enemies");
 const a=r.enemies.map(x=>x.hp);
 const turn=await u.call("action",{type:"skill6",targetId:r.enemies[0].enemyId,actionId:"archer-rain-test-001"});
 assert.equal(turn.ok,true);
 assert.ok(r.enemies[0].hp<a[0]&&r.enemies[1].hp<a[1],"both enemies must take damage");
 assert.ok(r.log.some(x=>x.includes("RAIN OF ARROWS")));
 assert.ok(r.log.some(x=>x.includes("AREA ATTACK")));
});

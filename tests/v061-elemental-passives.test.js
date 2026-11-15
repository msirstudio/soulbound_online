"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const catalog=require("../items/weapon-shop-v060"),engine=require("../items/weapon-passives-v061");
const combat=require("../combat-v055"),elemental=require("../elemental-v0552");
const {audit}=require("../scripts/audit-elemental-v061");
function fixture(id,cls,extra={}){
 const item=catalog.WEAPONS.find(w=>w.id===id);
 const hero={name:"Tester",id:"p1",classId:cls||item.class,level:80,weaponItem:{id,uid:"saved-weapon-001"},inventory:[{id,uid:"saved-weapon-001",equippedSlot:"main",element:"fake-client-element",chance:1}],
  hp:800,maxHp:800,mp:60,maxMp:100,...extra};
 const enemy={name:"Boss",enemyId:"enemy-5-0",hp:1200,maxHp:1200,atk:80,def:20,boss:true,miniBoss:false,regionId:"cursed_wilds",stage:5,statusEffects:[]};
 const room={players:new Map([["p1",hero]]),monster:enemy,enemies:[enemy],weaponFx:[],status:"battle"};
 return {hero,enemy,room,roll:(n=0)=>engine.applyPassive({room,player:hero,target:enemy,baseDamage:100,action:"attack",random:()=>n,say(){},combat})};
}
test("all 15 saved weapon IDs have unique real abilities and authorized elements",()=>{
 assert.equal(catalog.WEAPONS.length,15);
 const kinds=new Set();
 for(const item of catalog.WEAPONS){
  const info=engine.spec[item.id];assert.ok(info,item.id);
  assert.ok(elemental.ELEMENTS[info.element],item.id);
  assert.ok(info.chance>=.15&&info.chance<=.25,item.id);
  assert.equal(item.passive.name,info.name);
  assert.equal(item.passive.chance,info.chance);
  kinds.add(info.kind);
 }
 assert.ok(kinds.size>=10);
});
test("passives only work for a legitimately equipped inventory instance and correct class",()=>{
 const f=fixture("flamebrand");
 assert.equal(engine.weaponFor(f.hero).id,"flamebrand");
 assert.equal(engine.attackElement(f.hero,"attack","physical"),"fire");
 assert.equal(engine.attackElement(f.hero,"skill","arcane"),"arcane");
 assert.equal(engine.attackElement(f.hero,"break","physical"),"physical");
 f.hero.weaponItem={id:"flamebrand",uid:"not-the-equipped-item"};
 assert.equal(engine.weaponFor(f.hero),null);
 assert.equal(f.roll().triggered,false);
 f.hero.weaponItem={uid:"saved-weapon-001"};
 f.hero.classId="mage";
 assert.equal(engine.weaponFor(f.hero),null);
 f.hero.classId="swordsman";
 f.hero.inventory[0].equippedSlot=null;assert.equal(engine.weaponFor(f.hero),null);
});
test("legacy weapons and no gear retain original Physical damage",()=>{
 const old={classId:"swordsman",weaponItem:{id:"iron_sword",uid:"old-uid-001"},inventory:[{id:"iron_sword",uid:"old-uid-001",equippedSlot:"main"}],level:80};
 assert.equal(engine.attackElement(old,"attack","physical"),"physical");
 assert.equal(engine.weaponFor(old),null);
 assert.equal(engine.attackElement({}, "attack","physical"),"physical");
 assert.equal(engine.attackElement(old,"skill4","light"),"light");
});
test("proc chance, no persistence keys, non-damaging actions and maximum visual event bound",()=>{
 const f=fixture("flamebrand");
 assert.equal(f.roll(1).triggered,false);
 assert.equal(f.enemy.weaponBurn,undefined);
 assert.equal(f.roll(0).triggered,true);
 assert.deepEqual(Object.keys(f.enemy.weaponBurn).sort(),["damage","turns"]);
 assert.equal(f.enemy.weaponBurn.turns,2);
 assert.equal(engine.applyPassive({room:f.room,player:f.hero,target:f.enemy,baseDamage:100,action:"guard",random:()=>0,combat}).triggered,false);
 for(let i=0;i<30;i++)f.roll(0);
 assert.ok(f.room.weaponFx.length<=16);
 assert.ok(f.room.weaponFx.every(ev=>typeof ev.id==="number"&&ev.element==="fire"));
});
test("Burn lasts exactly two enemy turns and may defeat an enemy",()=>{
 const f=fixture("flamebrand");
 f.roll(0);const damage=f.enemy.weaponBurn.damage;
 assert.ok(damage>=1&&damage<=40);
 const a=engine.tickBurn(f.enemy),b=engine.tickBurn(f.enemy),c=engine.tickBurn(f.enemy);
 assert.equal(a.damage,damage);assert.equal(a.remaining,1);
 assert.equal(b.damage,damage);assert.equal(b.remaining,0);
 assert.equal(c.damage,0);
 f.enemy.hp=1;f.enemy.weaponBurn={turns:1,damage:40};
 assert.equal(engine.tickBurn(f.enemy).defeated,true);assert.equal(f.enemy.hp,0);
});
test("all 15 passives activate deterministically and remain bounded, without crashing multiplayer",()=>{
 for(const item of catalog.WEAPONS){
  const f=fixture(item.id);
  const extra={name:"Partner",id:"p2",hp:200,maxHp:400,mp:10,maxMp:50};
  f.room.players.set("p2",extra);
  const secondary={...f.enemy,name:"Other",enemyId:"enemy-5-1",hp:900};
  f.room.enemies.push(secondary);
  const result=f.roll(0);
  assert.equal(result.triggered,true,item.id);
  assert.ok(result.bonus>=0&&result.bonus<=90,item.id);
  assert.ok(f.enemy.hp<=1200&&f.enemy.hp>=0,item.id);
  assert.ok(secondary.hp<=900&&secondary.hp>=0,item.id);
  assert.ok(f.hero.hp<=f.hero.maxHp&&f.hero.mp<=f.hero.maxMp);
  assert.ok(f.room.weaponFx.some(x=>x.kind==="passive"),item.id);
 }
});
test("ELEMENTAL damage is the existing chart (20% stronger, 20% resisted) only on actual equipped elemental weapons",()=>{
 const f=fixture("flamebrand");f.enemy.regionId="cursed_wilds";
 assert.equal(elemental.multiplier(f.enemy,engine.attackElement(f.hero,"attack","physical")),1.2);
 const mage=fixture("frost_scepter");mage.enemy.regionId="ember_caverns";
 assert.equal(elemental.multiplier(mage.enemy,engine.attackElement(mage.hero,"attack","physical")),.8);
 assert.equal(engine.attackElement(mage.hero,"skill3",combat.skillElement(mage.hero,"skill3")),"ice");
});
test("passive proc and bottom dock are server/read-only UI additions, existing save is not reset",()=>{
 const result=audit();
 assert.deepEqual(Object.entries(result.checks).filter(([,good])=>!good),[]);
 assert.equal(result.passed,true);
 const server=read("server.js"),html=read("public/index.html");
 assert.ok(server.includes("weaponPassives.applyPassive({room:r,player:p,target:m,baseDamage:d"));
 assert.ok(server.includes("weaponPassives.tickBurn(m)"));
 assert.ok(!html.includes('class="v0559-audio-row"'));
 assert.ok(html.indexOf('class="v061-audio-dock"')>html.indexOf('class="game-layout"'));
});

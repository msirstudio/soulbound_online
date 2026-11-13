"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const world=require("../world-v040"),combat=require("../combat-v054"),advanced=require("../combat-v055");
function harness(){
 const source=fs.readFileSync(path.join(__dirname,"../server.js"),"utf8");
 const app={use(){},get(){}},express=()=>app;express.static=()=>()=>{};
 const emitted=[];let hook=null;
 class Server{
  on(name,cb){if(name==="connection")hook=cb}
  to(code){return{emit:(event,snapshot)=>emitted.push({code,event,snapshot})}}
 }
 const deps=name=>name==="express"?express:name==="http"?{createServer:()=>({listen(){}})}:
  name==="socket.io"?{Server}:name==="path"?path:
  name==="./loot-v034"?require("../loot-v034"):
  name==="./world-v040"?world:name==="./combat-v054"?combat:
  name==="./combat-v055"?advanced:require(name);
 const live=new Function("require","process","console","__dirname",source+
  ";return {rooms,start,applyDefeat};")(deps,{env:{}},{log(){}},path.join(__dirname,".."));
 const connect=id=>{
  const events={};hook({id,join(){},on:(type,cb)=>events[type]=cb});
  return {call(type,data={}){let answer;assert.ok(events[type]);events[type](data,x=>{answer=x});return answer;}};
 };
 return{live,connect,last:()=>emitted.at(-1)?.snapshot};
}
test("Socket: Hardcore defeat deducts Gold once and retains XP/equipment, used potion stays spent",()=>{
 const g=harness(),hero=g.connect("one");
 const {code}=hero.call("createRoom",{name:"Solo",classId:"swordsman"});
 assert.equal(hero.call("restoreCharacter",{level:30,gold:1000,speed:99,potions:2,small_health:2}).ok,true);
 const r=g.live.rooms.get(code);
 g.live.start(r);const p=r.players.get("one"),m=r.monster;
 const xp=p.xp,inventory=JSON.stringify(p.inventory);
 p.hp=p.maxHp-100;m.atk=1;m.intent={name:"Strike",scope:"single",element:"physical",power:1,charge:false};
 const consumable=p.smallHealth;
 assert.equal(hero.call("action",{type:"healSmall"}).ok,true);
 assert.equal(p.smallHealth,consumable-1);
 m.atk=999999;m.intent={name:"Strike",scope:"single",element:"physical",power:1,charge:false};
 p.hp=1;
 assert.equal(hero.call("action",{type:"guard"}).ok,true);
 assert.equal(r.status,"defeat");
 assert.equal(p.gold,920);
 assert.equal(g.last().players[0].gold,920,"Gold penalty broadcasts to client");
 assert.equal(g.live.applyDefeat(r),undefined);
 assert.equal(p.gold,920,"Gold is never deducted twice");
 assert.equal(p.xp,xp);
 assert.equal(JSON.stringify(p.inventory),inventory);
 assert.equal(p.smallHealth,consumable-1,"consumables are not refunded");
 assert.ok(r.log.some(x=>x.includes("loses 80 Gold")));
});
test("Socket: invalid skill never consumes DOT nor turn; Purify counters a stun and burn",()=>{
 const g=harness(),hero=g.connect("solo"),{code}=hero.call("createRoom",{name:"Hero",classId:"mage"});
 const r=g.live.rooms.get(code);g.live.start(r);
 const p=r.players.get("solo"),m=r.monster;
 v54Apply(p);
 function v54Apply(hero){combat.effectFor(hero,"burn",2);combat.effectFor(hero,"stun",1)}
 const hp=p.hp,mp=p.mp,effects=p.statusEffects.length;
 assert.equal(hero.call("action",{type:"skill4"}).ok,false,"LV 1 cannot use skill4");
 assert.equal(p.hp,hp);
 assert.equal(p.mp,mp);
 assert.equal(p.statusEffects.length,effects);
 m.atk=1;m.intent={name:"Strike",scope:"single",element:"physical",power:1,charge:false};
 assert.equal(hero.call("action",{type:"cleanse"}).ok,true);
 assert.equal(p.statusEffects.length,0);
 assert.ok(p.hp>=hp-1,"no burn DOT when Purify is chosen");
 assert.equal(p.mp,mp-18);
 assert.ok((p.cooldowns.cleanse||0)>0);
 assert.equal(hero.call("action",{type:"cleanse"}).ok,false,"cannot waste second Purify");
});
test("Socket: fully charged stagger permits an Interrupt, skips enemy attack and charges MP",()=>{
 const g=harness(),hero=g.connect("solo"),{code}=hero.call("createRoom",{name:"Hero",classId:"tank"});
 assert.equal(hero.call("restoreCharacter",{level:35,speed:99}).ok,true);
 const r=g.live.rooms.get(code);r.stage=5;g.live.start(r);
 const p=r.players.get("solo"),m=r.monster;
 m.queuedMove={name:"Briarstorm",scope:"all",element:"nature",power:.8,charge:false};
 m.stagger=m.staggerThreshold-1;
 const mp=p.mp,hp=p.hp;
 assert.equal(hero.call("action",{type:"interrupt"}).ok,false);
 assert.equal(p.mp,mp,"invalid Interrupt cannot spend mana");
 m.stagger=m.staggerThreshold;
 assert.equal(hero.call("action",{type:"interrupt"}).ok,true);
 assert.equal(p.mp,mp-8);
 assert.equal(p.hp,hp);
 assert.equal(m.skipNextAttack,false,"enemy skip consumed at its next action");
 assert.equal(r.status,"battle");
 assert.equal(g.last().monster.interruptImmunity,2);
});
test("Socket: all players receive server AI and status snapshots, phase 2 only on final two bosses",()=>{
 const g=harness(),host=g.connect("host"),guest=g.connect("guest");
 const {code}=host.call("createRoom",{name:"Host",classId:"tank"});
 assert.equal(guest.call("joinRoom",{code,name:"Guest",classId:"mage"}).ok,true);
 for(const c of [host,guest])assert.equal(c.call("restoreCharacter",{level:80,speed:60,max_hp:3000}).ok,true);
 const r=g.live.rooms.get(code);r.regionIndex=6;r.stage=35;g.live.start(r);
 assert.equal(r.players.size,2);
 assert.equal(r.monster.phase,1);
 assert.equal(r.monster.staggerThreshold,130);
 assert.equal(host.call("action",{type:"guard"}).ok,true);
 assert.equal(g.last().monster.phase,1);
 assert.equal(g.last().partyWardTurns,1);
 assert.equal(g.last().players.length,2);
 assert.ok(g.last().monster.intent.name);
 assert.equal(guest.call("action",{type:"attack"}).ok,true);
 assert.equal(g.last().status,"battle");
});


test("Socket: four-person AOE wipe applies one capped Gold loss independently to every hero",()=>{
 const g=harness(),members=["a","b","c","d"].map(id=>g.connect(id));
 const {code}=members[0].call("createRoom",{name:"A",classId:"tank"});
 for(let i=1;i<4;i++)assert.equal(members[i].call("joinRoom",{code,name:"P"+i,classId:i===1?"mage":"swordsman"}).ok,true);
 for(const m of members)assert.equal(m.call("restoreCharacter",{level:70,gold:800,speed:100}).ok,true);
 const r=g.live.rooms.get(code);
 g.live.start(r);
 r.monster.atk=100000;
 r.monster.intent={name:"War Cry",scope:"all",element:"physical",power:1,charge:false};
 for(const m of members)assert.equal(m.call("action",{type:"guard"}).ok,true);
 assert.equal(r.status,"defeat");
 assert.equal(r.players.size,4);
 for(const p of r.players.values())assert.equal(p.gold,736);
 assert.deepEqual(g.last().players.map(p=>p.gold),[736,736,736,736]);
 g.live.applyDefeat(r);
 for(const p of r.players.values())assert.equal(p.gold,736);
});

"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const world=require("../world-v040"),combat=require("../combat-v055");
function harness(){
 const serverText=fs.readFileSync(path.join(__dirname,"../server.js"),"utf8");
 let onConnect=null;const routes=new Map(),emits=[];
 const app={get(url,handler){routes.set(url,handler)},use(){}};
 const express=()=>app;express.static=()=>()=>{};
 class Server{on(ev,fn){if(ev==="connection")onConnect=fn}to(code){return{emit:(ev,state)=>emits.push({code,ev,state})}}}
 const deps=name=>name==="express"?express:name==="http"?{createServer:()=>({listen(){}})}:
  name==="socket.io"?{Server}:name==="path"?path:
  name==="./loot-v034"?require("../loot-v034"):name==="./world-v040"?world:
  name==="./combat-v055"?combat:require(name);
 const runtime=new Function("require","process","console","__dirname","setTimeout",serverText+";return {rooms,start,combat};")(
  deps,{env:{}},{log(){}},path.join(__dirname,".."),fn=>{fn();return 0;});
 const connect=id=>{
  const handlers={};
  onConnect({id,join(){},on:(event,fn)=>handlers[event]=fn});
  return{call(event,data={}){let out;assert.ok(handlers[event],event);handlers[event](data,r=>out=r);return out}};
 };
 const catalog=()=>{let result;const res={set(){return this},json(v){result=v}};routes.get("/api/index")({},res);return result};
 return{connect,runtime,catalog,last:()=>emits.at(-1)?.state};
}
test("live INDEX API returns 8 boss records, exact move chances, element matrix and all new guide tabs",()=>{
 const g=harness(),d=g.catalog();
 assert.equal(d.version,"0.56.1");
 for(const category of ["elements","statuses","combat"])assert.ok(d.categories.includes(category));
 assert.equal(d.codex.elements.length,10);assert.equal(d.codex.statusEffects.length,7);
 assert.equal(d.monsters.length,40);
 assert.equal(d.monsters.filter(x=>x.boss).length,8);
 for(const stage of [5,10,15,20,25,30,35,40]){
  const e=d.monsters.find(x=>x.stage===stage);
  const actual=combat.enemyCodex({...world.encounter(stage,
   [{hp:1,atk:1,def:1,xp:1,gold:1,sprite:"normal"}],
   Array.from({length:8},()=>({hp:100,atk:20,def:5,xp:20,gold:15,sprite:"boss"}))),stage});
  assert.equal(e.element,actual.element);
  assert.deepEqual(e.weak,actual.weak);
  assert.deepEqual(e.resist,actual.resist);
  assert.deepEqual(e.moves.map(x=>[x.name,x.effect,x.chance]),actual.moves.map(x=>[x.name,x.effect,x.chance]));
  assert.equal(e.phase2,[35,40].includes(stage));
 }
 assert.match(d.codex.combatRules.defeat,/8%/);
});
test("actual two-player Socket defeat deducts Gold once per hero and retains XP/equipment",()=>{
 const g=harness(),a=g.connect("a"),b=g.connect("b");
 const {code}=a.call("createRoom",{name:"Leader",classId:"mage"});
 assert.equal(b.call("joinRoom",{code,name:"Ally",classId:"tank"}).ok,true);
 a.call("restoreCharacter",{level:50,gold:1000,speed:50});
 b.call("restoreCharacter",{level:50,gold:500,speed:40});
 const r=g.runtime.rooms.get(code);r.stage=5;r.regionIndex=0;g.runtime.start(r);
 const pa=r.players.get("a"),pb=r.players.get("b");
 pa.inventory=[{uid:"keeper",id:"steel_blade",name:"Steel Blade"}];
 const xp=pa.xp,level=pa.level;
 r.monster.atk=999999;r.monster.intent={name:"Fatal Meteor",scope:"all",element:"fire",power:1,effect:null,charge:false};
 assert.equal(a.call("action",{type:"guard"}).ok,true);
 assert.equal(b.call("action",{type:"guard"}).ok,true);
 assert.equal(g.last().status,"defeat");
 assert.deepEqual([pa.gold,pb.gold],[920,460]);
 assert.equal(pa.xp,xp);assert.equal(pa.level,level);assert.equal(pa.inventory[0].uid,"keeper");
 assert.equal(combat.applyDefeatPenalty(r,()=>{}),false,"one-time penalty only");
 assert.equal(a.call("returnCity").ok,true);
 assert.deepEqual([pa.gold,pb.gold],[920,460],"gold penalty persists in room after returning");
});
test("Socket rejects insufficient MP before DOT ticks; Break interrupts and Cleanse rescues party",()=>{
 const g=harness(),a=g.connect("a"),b=g.connect("b");
 const {code}=a.call("createRoom",{name:"Leader",classId:"swordsman"});
 b.call("joinRoom",{code,name:"Ally",classId:"tank"});
 a.call("restoreCharacter",{level:80,speed:60,attack:150});
 b.call("restoreCharacter",{level:80,speed:40,attack:120});
 const r=g.runtime.rooms.get(code);r.stage=35;r.regionIndex=6;g.runtime.start(r);
 const p=r.players.get("a"),ally=r.players.get("b");
 combat.effectFor(p,"burn",1);p.mp=0;
 const hp=p.hp,turnSerial=r.turnSerial;
 assert.equal(a.call("action",{type:"skill4"}).ok,false);
 assert.equal(p.hp,hp);assert.equal(r.turnSerial,turnSerial);
 p.mp=90;r.monster.maxHp=8000;r.monster.hp=8000;
 r.monster.queuedMove={name:"Rift Collapse",scope:"all",element:"void",power:.8,effect:"poison",chance:.65,charge:false};
 r.monster.stagger=r.monster.staggerThreshold-35;
 assert.equal(a.call("action",{type:"break"}).ok,true);
 assert.equal(p.mp,75);
 assert.equal(r.monster.staggeredTurns,1);
 assert.equal(r.monster.queuedMove,null);
 assert.equal(b.call("action",{type:"guard"}).ok,true);
 assert.equal(r.monster.staggeredTurns,0);
 assert.ok(r.log.some(x=>x.includes("BREAKS")));
 combat.effectFor(ally,"stun",1);
 assert.equal(a.call("action",{type:"cleanse"}).ok,true);
 assert.equal(ally.statusEffects.length,0);
 assert.ok(r.log.some(x=>x.includes("CLEANSE on Ally")));
 assert.equal(g.last().status,"battle");
});


test("actual Socket Mage Meteor exploits boss Fire weakness and Codex reports the same multiplier",()=>{
 function run(regionId){
  const g=harness(),a=g.connect("mage"),{code}=a.call("createRoom",{name:"Mage",classId:"mage"});
  a.call("restoreCharacter",{class_id:"mage",level:80,attack:220,speed:80,max_hp:3000});
  const r=g.runtime.rooms.get(code);r.stage=25;r.regionIndex=4;g.runtime.start(r);
  r.monster.regionId=regionId;
  r.monster.hp=10000;r.monster.maxHp=10000;
  const before=r.monster.hp;
  assert.equal(a.call("action",{type:"skill2"}).ok,true);
  return before-r.monster.hp;
 }
 const weak=run("frostbound_peaks");
 const neutral=run("dreadforge_bastion");
 assert.ok(weak>neutral*1.12,"fire Meteor gains a real elemental weakness bonus, not just a Codex label");
 const data=harness().catalog();
 assert.equal(data.monsters.find(x=>x.stage===25).weak[0],"fire");
 assert.equal(data.codex.combatRules.weaknessMultiplier,1.2);
});
test("Eclipse Phase 2 uses Void damage in the real move and exposes a matching Light weakness",()=>{
 const m=combat.beginEncounter({...world.encounter(40,
  [{hp:1,atk:1,def:1,xp:1,gold:1,sprite:"n"}],
  Array.from({length:8},()=>({hp:100,atk:20,def:5,xp:20,gold:15,sprite:"b"}))),stage:40});
 const r={monster:m,log:[]};
 m.hp=49;m.maxHp=100;
 assert.equal(combat.checkPhase(r,(room,msg)=>room.log.push(msg)),true);
 assert.equal(m.intent.element,"void");
 assert.equal(combat.enemyCodex(m).phase2Affinity.weak[0],"light");
 assert.equal(combat.elementMultiplier(m,"light"),1.2);
});

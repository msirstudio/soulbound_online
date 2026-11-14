"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const combat=require("../combat-v054"),world=require("../world-v040");
const src=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
function room(stage=5,types=["swordsman","tank"]){
 const region=world.regionForStage(stage);
 const monster={name:region.bossName,boss:true,miniBoss:false,stage,regionId:region.id,stageInRegion:5,atk:80,def:20,hp:500,maxHp:500};
 const players=new Map(types.map((classId,i)=>["p"+i,{id:"p"+i,name:"Hero"+i,classId,classPath:null,
  hp:550,maxHp:550,mp:100,maxMp:100,atk:100,def:30,raceId:"human",damageReductionTurns:0,
  tauntTurns:0,guardTurns:0,foodBuffs:{def:0},statusEffects:[]}]));
 const r={status:"battle",stage,monster,players,partyWardTurns:0,partyWardReduction:0,turnSerial:1,log:[]};
 combat.beginEncounter(monster);
 const say=(x,s)=>x.log.push(s);
 return {r,say};
}
const enemy=(r,say,random=()=>0)=>combat.monsterStrike(r,{say,random,raceById:()=>({reduce:0})});
test("only stage 35 and 40 main bosses have Phase 2; earlier bosses and minis never phase",()=>{
 assert.deepEqual(combat.PHASE_TWO_STAGES,[35,40]);
 for(let i=1;i<=8;i++){
  const stage=i*5,{r,say}=room(stage);
  assert.equal(combat.canPhaseTwo(r.monster),stage===35||stage===40,"stage "+stage);
  assert.equal(r.monster.phase,stage>=35?1:null);
  r.monster.hp=249;
  assert.equal(combat.checkPhase(r,say),stage===35||stage===40);
  assert.equal(r.monster.phase,stage>=35?2:null);
  if(stage>=35){
   assert.equal(combat.checkPhase(r,say),false,"once only");
   assert.equal(r.monster.hp,249,"no secret boss heal or fake damage");
   assert.ok(r.monster.intent.charge,"phase change must telegraph its first attack");
  }
  r.monster.miniBoss=true;r.monster.boss=false;r.monster.phase=null;
  assert.equal(combat.canPhaseTwo(r.monster),false);
  assert.equal(combat.checkPhase(r,say),false);
 }
});
test("all eight bosses have distinct elemental signature attacks",()=>{
 assert.equal(Object.keys(combat.BOSS_SPECIALS).length,8);
 assert.equal(new Set(Object.values(combat.BOSS_SPECIALS).map(m=>m.name)).size,8);
 assert.ok(["burn","poison","bleed","freeze","weaken","stun"].every(x=>combat.STATUS_NAMES[x]));
 for(let stage=5;stage<=40;stage+=5){
  const {r}=room(stage);
  r.monster.combatTurn=1;
  const move=combat.moveFor(r.monster);
  assert.ok(move.charge,"boss signature attack must charge before release");
  assert.ok(move.effect,"elemental status is defined");
  assert.ok(["single","all"].includes(move.scope));
 }
});
test("telegraphed AOE takes two enemy turns, can hit all heroes, and applies statuses",()=>{
 const {r,say}=room(15);
 r.monster.combatTurn=1;r.monster.intent=combat.moveFor(r.monster);
 const start=[...r.players.values()].map(p=>p.hp);
 enemy(r,say,()=>0);
 assert.deepEqual([...r.players.values()].map(p=>p.hp),start,"charge must not hit immediately");
 assert.match(r.log.join(" " ),/CHARGING/);
 assert.equal(r.monster.intent.charge,false);
 enemy(r,say,()=>0);
 for(const p of r.players.values()){
  assert.ok(p.hp<start[0],"AOE damages everyone");
  assert.ok(p.statusEffects.some(e=>e.id==="burn"));
 }
 assert.ok(r.log.some(x=>x.includes("Forged")||x.includes("Magma")));
});
test("guard protects entire team; Tank guards more effectively and Aegis lasts two enemy attacks",()=>{
 const a=room(5),b=room(5);
 enemy(a.r,a.say,()=>0);
 const baseline=[...a.r.players.values()][0].maxHp-[...a.r.players.values()][0].hp;
 const guardian=[...b.r.players.values()][1];
 combat.guard(b.r,guardian,b.say);
 enemy(b.r,b.say,()=>0);
 const guarded=[...b.r.players.values()][0].maxHp-[...b.r.players.values()][0].hp;
 assert.ok(guarded<baseline,"teammates take less damage after Guard");
 assert.equal(b.r.partyWardTurns,0);
 combat.aegis(b.r,guardian,b.say);
 assert.equal(b.r.partyWardTurns,2);
 enemy(b.r,b.say,()=>0); // boss wind-up: no attack, Ward remains active
 assert.equal(b.r.partyWardTurns,2);
 enemy(b.r,b.say,()=>0); // charged attack resolves
 assert.equal(b.r.partyWardTurns,1);
 enemy(b.r,b.say,()=>0); // next regular strike
 assert.equal(b.r.partyWardTurns,0);
});
test("temporary dots and debuffs apply on player turns and expire; no saved-hero stat permanently changes",()=>{
 const {r,say}=room(),p=[...r.players.values()][0],atk=p.atk,def=p.def;
 for(const id of ["burn","poison","bleed","weaken"])combat.effectFor(p,id,2);
 const one=combat.beforeAction(r,p,say);
 assert.equal(one.skip,false);
 assert.ok(p.hp<p.maxHp);
 assert.equal(p._combatAttackMultiplier,.78);
 assert.equal(p.atk,atk);assert.equal(p.def,def);
 const afterFirst=p.hp;
 combat.beforeAction(r,p,say);
 assert.equal(p.hp,afterFirst,"must never tick twice on a turn if action rejected");
 r.turnSerial++;
 combat.beforeAction(r,p,say);
 assert.ok(p.hp<afterFirst);
 assert.equal(p.statusEffects.length,0,"durations expire");
 r.turnSerial++;
 combat.beforeAction(r,p,say);
 assert.equal(p._combatAttackMultiplier,1);
 combat.effectFor(p,"freeze",1);
 r.turnSerial++;
 assert.equal(combat.beforeAction(r,p,say).skip,true,"one-turn freeze skips action");
 assert.equal(p.statusEffects.length,0);
});
test("phase-two signature differs for Void Reaper and Eclipse Sovereign",()=>{
 const rift=room(35),eclipse=room(40);
 for(const x of [rift,eclipse]){x.r.monster.hp=240;combat.checkPhase(x.r,x.say)}
 assert.equal(rift.r.monster.intent.name,"Oblivion's Grasp");
 assert.equal(eclipse.r.monster.intent.name,"Sovereign Judgment");
 assert.notEqual(rift.r.monster.intent.scope,eclipse.r.monster.intent.scope);
});
test("server socket workflow delegates to combat and resets encounter-only state without save changes",()=>{
 const s=src("server.js"),game=src("public/game.js"),html=src("public/index.html");
 assert.ok(s.includes('require("./combat-v055")'));
 assert.ok(s.includes("combat.beginEncounter(foe,r)"),"Every enemy in a pack initializes its own combat state");
 assert.ok(s.includes("combat.checkPhase(r,say)"));
 assert.ok(s.includes("combat.beforeAction(r,p,say)"));
 assert.ok(s.includes("combat.guard(r,p,say)"));
 assert.ok(s.includes("combat.aegis(r,p,say)"));
 assert.ok(s.includes("combat.monsterStrike(r,{say,raceById,random:Math.random})"));
 assert.ok(s.includes("p.statusEffects=[]"));
 assert.ok(s.includes("partyWardTurns:r.partyWardTurns||0"));
 assert.ok(html.includes('id="v054CombatIntent"'));
 assert.ok(game.includes("v054PartyStatuses"));
 for(const f of ["statusEffects","partyWardTurns","phase","intent"])
  assert.ok(!s.includes('"'+f+'_saved"'),"no new save schema field");
 assert.ok(!src("public/game.js").includes('call("monsterStrike"'),"client cannot decide monster attacks");
});


test("party ward and personal Guard last through a boss warning, then absorb the actual strike",()=>{
 const {r,say}=room(5),tank=[...r.players.values()][1];
 r.monster.combatTurn=1;r.monster.intent=combat.moveFor(r.monster);
 combat.guard(r,tank,say);
 enemy(r,say,()=>0);
 assert.equal(r.partyWardTurns,1,"wind-up is not a damaging action and cannot consume the ward");
 assert.equal(tank.guardTurns,1);
 const hp=[...r.players.values()].map(p=>p.hp);
 enemy(r,say,()=>0);
 assert.equal(r.partyWardTurns,0);
 assert.equal(tank.guardTurns,0);
 assert.ok([...r.players.values()].some((p,i)=>p.hp<hp[i]));
});
test("Mage Chill and Swordsman Weaken reduce enemy attack damage temporarily",()=>{
 const a=room(5),b=room(5),c=room(5);
 combat.debuffMonster(b.r.monster,"chill",1);
 combat.debuffMonster(c.r.monster,"weaken",2);
 const first=x=>[...x.r.players.values()][0];
 enemy(a.r,a.say,()=>0);enemy(b.r,b.say,()=>0);enemy(c.r,c.say,()=>0);
 const baseline=550-first(a).hp;
 assert.ok(550-first(b).hp<baseline,"chill protects team");
 assert.ok(550-first(c).hp<baseline,"weaken protects team");
 assert.equal(b.r.monster.statusEffects.length,0,"chill expires after attack");
 assert.equal(c.r.monster.statusEffects[0].turns,1,"weakness lasts another hit");
 assert.ok(src("server.js").includes('combat.debuffMonster(m,"chill",1)'));
 assert.ok(src("server.js").includes('combat.debuffMonster(m,"weaken",2)'));
});

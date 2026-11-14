"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const combat=require("../combat-v055"),base=require("../combat-v054"),world=require("../world-v040");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const say=(r,message)=>(r.log??=[]).push(message);
const hero=(id="p0",classId="swordsman")=>({id,name:id,classId,classPath:null,raceId:"human",
 level:80,hp:1200,maxHp:1200,mp:300,maxMp:300,atk:300,def:30,gold:500,
 statusEffects:[],controlImmunityTurns:0,foodBuffs:{def:0},cooldowns:{},strength:4});
function room(stage=5,party=1){
 const region=world.regionForStage(stage),m={stage,name:region.bossName,regionId:region.id,
 boss:true,miniBoss:false,atk:80,def:20,hp:2000,maxHp:2000,partySize:party};
 const players=new Map(Array.from({length:party},(_,i)=>["p"+i,hero("p"+i,i===party-1?"tank":"swordsman")]));
 const r={status:"battle",stage,monster:m,players,log:[],turnSerial:1,partyWardTurns:0,partyWardReduction:0};
 combat.beginEncounter(m,r);m.staggerThreshold=combat.staggerThreshold(m);return r;
}
const strike=r=>combat.monsterStrike(r,{say,raceById:()=>({reduce:0}),random:()=>0});
test("all eight affinity profiles and codex weakness/resistance match actual battle multipliers",()=>{
 const codex=combat.codexData();
 assert.equal(codex.elements.length,10);assert.equal(codex.affinities.length,8);
 assert.equal(codex.statusEffects.length,7);
 for(let i=0;i<8;i++){
  const m=room((i+1)*5).monster,entry=combat.enemyCodex(m);
  assert.equal(entry.element,combat.profileFor(m).element);
  assert.equal(combat.elementMultiplier(m,entry.weak[0]),1.2);
  assert.equal(combat.elementMultiplier(m,entry.resist[0]),.8);
  assert.equal(combat.elementMultiplier(m,"physical"),1);
  assert.deepEqual(entry.dropsStatus,[...new Set(entry.moves.map(x=>x.effect).filter(Boolean))]);
  assert.ok(entry.moves.some(x=>x.charge),"each main boss warns before a signature");
  assert.equal(entry.phase2,[35,40].includes(m.stage));
 }
 const eclipse=room(40);assert.equal(combat.elementMultiplier(eclipse.monster,"void"),1.2);
 eclipse.monster.hp=999;assert.equal(combat.checkPhase(eclipse,say),true);
 assert.equal(combat.elementMultiplier(eclipse.monster,"light"),1.2);
 assert.equal(combat.elementMultiplier(eclipse.monster,"void"),.8);
});
test("boss codex move names, effect types and probabilities equal live 0.54 combat signatures",()=>{
 for(let stage=5;stage<=40;stage+=5){
  const m=room(stage).monster,entry=combat.enemyCodex(m),baseMove=base.BOSS_SPECIALS[m.regionId];
  const sig=entry.moves.find(x=>x.name===baseMove.name);
  assert.ok(sig);
  for(const key of ["scope","element","power","effect","chance"])assert.equal(sig[key],baseMove[key]);
  assert.equal(sig.charge,true);
  if(stage===35||stage===40)assert.ok(entry.moves.some(x=>x.phase===2&&x.name===base.PHASE_TWO_SPECIALS[m.regionId].name));
 }
 const normal=world.encounter(2,[{hp:100,atk:12,def:2,xp:5,gold:2,sprite:"wolf"}],[{hp:200,atk:22,def:8,xp:25,gold:8,sprite:"b"}]);
 assert.equal(combat.enemyCodex(normal).moves.length,1,"normal enemies cannot have boss-only specials");
});
test("status resistance and two-turn anti-control immunity prevent stun/freeze lock",()=>{
 const r=room(),p=r.players.get("p0");
 assert.equal(combat.applyStatus(p,"stun",1,{chance:1,random:()=>0}),true);
 assert.equal(combat.applyStatus(p,"freeze",1,{chance:1,random:()=>0}),false);
 assert.equal(combat.beforeAction(r,p,say).skip,true);
 assert.equal(p.statusEffects.length,0);
 assert.ok(p.controlImmunityTurns>0);
 assert.equal(combat.applyStatus(p,"freeze",1,{chance:1,random:()=>0}),false);
 r.turnSerial++;combat.beforeAction(r,p,say);
 assert.equal(combat.applyStatus(p,"stun",1,{chance:1,random:()=>0}),false);
 r.turnSerial++;combat.beforeAction(r,p,say);
 assert.equal(combat.applyStatus(p,"stun",1,{chance:1,random:()=>0}),false);
 r.turnSerial++;combat.beforeAction(r,p,say);
 assert.equal(combat.applyStatus(p,"freeze",1,{chance:1,random:()=>0}),true);
});
test("combined Burn, Poison and Bleed is capped at 10% Max HP and ticks once per actual turn",()=>{
 const r=room(),p=r.players.get("p0");
 for(const id of ["burn","poison","bleed"])base.effectFor(p,id,2);
 const hp=p.hp;
 combat.beforeAction(r,p,say);
 assert.equal(hp-p.hp,120,"Max HP 1200 → 10% cap 120");
 combat.beforeAction(r,p,say);assert.equal(hp-p.hp,120,"no repeated tick in same turn");
 r.turnSerial++;combat.beforeAction(r,p,say);
 assert.equal(hp-p.hp,240);
 assert.equal(p.statusEffects.length,0);
});
test("resistance changes application odds without allowing client to bypass RNG or statuses",()=>{
 const basic=hero(),guardian={...hero("tank","tank"),classPath:"guardian"};
 const weak=.70;
 assert.equal(combat.applyStatus(basic,"burn",1,{chance:1,element:"physical",random:()=>weak}),true);
 assert.equal(combat.applyStatus(guardian,"burn",1,{chance:1,element:"physical",random:()=>weak}),false);
 assert.ok(combat.statusResistance(guardian,"stun","physical")>combat.statusResistance(basic,"stun","physical"));
 assert.ok(combat.heroElementResistance({...basic,raceId:"dragonkin"},"fire")>0);
});
test("Stagger carries across turns and cancels charged attack exactly once, with interrupt immunity",()=>{
 const r=room(5),p=r.players.get("p0"),m=r.monster;
 m.combatTurn=1;m.intent=combat.moveFor(m,r);
 assert.equal(m.intent.charge,true);
 strike(r);assert.equal(m.queuedMove.charge,false);
 let hit;
 for(let i=0;i<4;i++){hit=combat.addStagger(r,p,"break","physical",say);if(hit.interrupted)break}
 assert.equal(hit.interrupted,true);assert.equal(m.staggeredTurns,1);
 assert.equal(m.queuedMove,null);
 const hp=p.hp;strike(r);assert.equal(p.hp,hp,"next enemy action is staggered");
 assert.equal(m.staggeredTurns,0);
 assert.ok(m.interruptImmunityTurns>0);
 const noChain=combat.addStagger(r,p,"break","physical",say);
 assert.equal(noChain.interrupted,false);
});
test("Perfect Guard works during charge, survives wind-up, and offers party protection",()=>{
 const r=room(10,2),tank=r.players.get("p1"),m=r.monster;
 m.combatTurn=1;m.intent=combat.moveFor(m,r);
 strike(r);
 assert.ok(m.queuedMove);
 combat.guard(r,tank,say);
 assert.equal(tank.perfectGuard,true);
 assert.ok(r.partyWardReduction>=.38);
 assert.ok(m.stagger>=14);
});
test("adaptive boss AI targets group when HP low and avoids invisible random phase changes",()=>{
 const r=room(25,3),m=r.monster;
 m.combatTurn=8;m.hp=m.maxHp*.35;
 const move=combat.moveFor(m,r);
 assert.equal(move.name,"Frenzied Sweep");
 assert.equal(move.scope,"all");
 assert.equal(move.charge,false);
 assert.equal(m.phase,null);
});
test("Punishing Hardcore deducts 8% Gold once, capped at 2000, and never touches gear/XP",()=>{
 const r=room(5,3),a=[...r.players.values()];
 a[0].gold=500;a[1].gold=50000;a[2].gold=0;
 a[0].level=28;a[0].xp=100;a[0].inventory=[{uid:"sword",name:"Steel Blade"}];
 r.status="defeat";assert.equal(combat.applyDefeatPenalty(r,say),true);
 assert.deepEqual(a.map(p=>p.gold),[460,48000,0]);
 assert.equal(combat.applyDefeatPenalty(r,say),false);
 assert.deepEqual(a.map(p=>p.gold),[460,48000,0]);
 assert.equal(a[0].level,28);assert.equal(a[0].xp,100);
 assert.equal(a[0].inventory[0].uid,"sword");
 assert.ok(r.log.some(x=>x.includes("Used consumables are not restored")));
});
test("invalid action requests reject before DOT tick, and Cleanse has a usable party rule",()=>{
 const r=room(),p=r.players.get("p0");p.mp=0;
 base.effectFor(p,"poison",2);
 assert.ok(combat.validateAction(p,"skill3",r));
 assert.equal(combat.validateAction(p,"cleanse",r),"Not enough MP.");
 assert.equal(p.hp,1200,"validation itself must never tick DOT");
 p.mp=200;
 assert.equal(combat.validateAction(p,"cleanse",r),null);
 assert.equal(combat.cleanse(r,p,say),true);
 assert.equal(p.statusEffects.length,0);
 assert.equal(combat.validateAction(p,"cleanse",r),"No ally needs cleansing.");
});
test("Codex and gameplay integration keep Phase 2 exclusive and preserve existing save schema",()=>{
 const js=read("server.js"),html=read("public/index.html"),index=read("public/adventure-index-v035.js");
 assert.ok(js.includes('require("./combat-v055")'));
 assert.ok(js.includes("combat.validateAction(p,type,r)"));
 assert.ok(js.includes("combat.applyDefeatPenalty(r,say)"));
 assert.ok(js.includes("combat.addStagger(r,p,type"));
 assert.ok(js.includes("combat.enemyCodex({...foe,stage})"));
 assert.ok(js.includes("codex:combat.codexData()"));
 assert.ok(html.includes('data-action="break"')&&html.includes('data-action="cleanse"'));
 for(const t of ['ELEMENTS','STATUS','COMBAT RULES','ATTACK MOVES / STATUS CHANCES','ELEMENT / RESISTANCES','PHASE 2'])
  assert.ok(index.includes(t),t);
 assert.deepEqual(base.PHASE_TWO_STAGES,[35,40]);
 assert.ok(!js.includes("ADD COLUMN")&&!js.includes("DROP TABLE"));
 const pkg=require("../package.json");assert.equal(pkg.version,"0.56.5");
 assert.ok(html.includes("VERSION 0.56.5 · SECURE FOUNDATION"));
});

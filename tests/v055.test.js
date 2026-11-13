"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const v54=require("../combat-v054"),v55=require("../combat-v055"),world=require("../world-v040");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const player=(id="p",classId="swordsman",raceId="human")=>({id,name:id,classId,raceId,
 hp:500,maxHp:500,mp:80,maxMp:80,def:25,atk:80,level:30,gold:1000,
 cooldowns:{},foodBuffs:{def:0},statusEffects:[],statusResistTurns:0,tauntTurns:0,damageReductionTurns:0});
function match(stage=5,heroTypes=["swordsman","tank"]){
 const region=world.regionForStage(stage);
 const monster={stage,regionId:region.id,name:region.bossName,boss:true,miniBoss:false,
 hp:1000,maxHp:1000,atk:100,def:12};
 const players=new Map(heroTypes.map((cl,i)=>["p"+i,player("p"+i,cl)]));
 const r={stage,status:"battle",monster,players,partyWardTurns:0,partyWardReduction:0,turnSerial:1,log:[]};
 v54.beginEncounter(monster);v55.resetEncounter(r);
 const say=(room,message)=>room.log.push(message);
 const strike=(random=()=>0)=>v54.monsterStrike(r,{say,raceById:()=>({reduce:0}),random,advanced:v55});
 return {r,say,strike};
}
test("all eight boss elemental profiles and both Eclipse phases have supported counter-elements",()=>{
 assert.equal(Object.keys(v55.REGIONS).length,8);
 for(let stage=5;stage<=40;stage+=5){
  const {r}=match(stage),profile=v55.enemyProfile(r.monster);
  assert.equal(profile.element,v55.REGIONS[r.monster.regionId].element);
  assert.equal(v55.damageMultiplier(r.monster,profile.weak),1.2);
  assert.equal(v55.damageMultiplier(r.monster,profile.resist),.8);
  assert.equal(v55.damageMultiplier(r.monster,"physical"),1);
 }
 const {r:e}=match(40);e.monster.phase=2;
 assert.equal(v55.enemyProfile(e.monster).element,"void");
 assert.equal(v55.damageMultiplier(e.monster,"light"),1.2);
 assert.equal(v55.damageMultiplier(e.monster,"void"),.8);
 const normal={...e.monster,boss:false,miniBoss:false};
 assert.equal(v55.damageMultiplier(normal,"light"),1);
});
test("hero elements create options for all three classes and resistance never exceeds cap",()=>{
 assert.equal(v55.playerSkillElement(player("mage","mage"),"skill2"),"fire");
 assert.equal(v55.playerSkillElement(player("mage","mage"),"skill3"),"ice");
 assert.equal(v55.playerSkillElement(player("tank","tank"),"skill"),"earth");
 assert.equal(v55.playerSkillElement(player("warrior","swordsman"),"skill3"),"physical");
 assert.ok(v55.enemyDamageFactor(player("d","tank","dwarf"),"earth")<v55.enemyDamageFactor(player("h","swordsman","human"),"earth"));
 for(const element of v55.ELEMENTS){
  const x=v55.enemyDamageFactor(player("t","tank","voidborn"),element);
  assert.ok(x>=.7&&x<=1);
 }
});
test("status probability respects resistance and crowd-control immunity, with bounded turns",()=>{
 const mage=player("mage","mage","human"),dwarf=player("dwarf","tank","dwarf");
 assert.ok(v55.statusResistance(dwarf,"freeze")>v55.statusResistance(mage,"freeze"));
 assert.equal(v55.tryApplyStatus(dwarf,"stun",.8,()=>.9,v54.effectFor),false);
 assert.equal(v55.tryApplyStatus(mage,"burn",.8,()=>0,v54.effectFor),true);
 assert.equal(mage.statusEffects[0].turns,2);
 dwarf.ccImmuneTurns=2;
 assert.equal(v55.tryApplyStatus(dwarf,"freeze",1,()=>0,v54.effectFor),false);
 assert.equal(dwarf.statusEffects.length,0);
});
test("combined Burn/Poison/Bleed never exceed ten percent Max HP per player turn",()=>{
 const {r,say}=match(),p=r.players.get("p0");
 for(const type of ["burn","poison","bleed"])v54.effectFor(p,type,2);
 const hp=p.hp;
 v54.beforeAction(r,p,say);
 assert.ok(hp-p.hp<=50);
 assert.ok(hp-p.hp>0);
 const first=p.hp;
 v54.beforeAction(r,p,say);
 assert.equal(first,p.hp,"no second DOT tick within the same turn");
 r.turnSerial++;
 v54.beforeAction(r,p,say);
 assert.equal(p.statusEffects.length,0,"effects eventually expire");
});
test("crowd control grants full follow-up immunity window without permanent protection",()=>{
 const {r,say}=match(),p=r.players.get("p0");
 v54.effectFor(p,"freeze",1);
 assert.equal(v54.beforeAction(r,p,say).skip,true);
 assert.ok(p.ccImmuneTurns>=2);
 for(let i=0;i<2;i++){
  assert.equal(v54.effectFor(p,"stun",1),false,"immunity prevents another stun");
  r.turnSerial++;v54.beforeAction(r,p,say);
 }
 assert.equal(p.ccImmuneTurns,1);
 r.turnSerial++;v54.beforeAction(r,p,say);
 assert.equal(p.ccImmuneTurns,0);
 assert.equal(v54.effectFor(p,"stun",1),true,"eventually susceptible again");
});
test("preflight denies invalid skills, unavailable consumables and unsupported actions",()=>{
 const p=player(),m={hp:500,maxHp:500},before=JSON.stringify(p);
 assert.equal(v55.validateAction({...p,mp:1},m,"skill4").ok,false);
 assert.equal(v55.validateAction({...p,level:1},m,"skill4").ok,false);
 assert.equal(v55.validateAction({...p,cooldowns:{skill:2}},m,"skill").ok,false);
 assert.equal(v55.validateAction(p,m,"healLarge").ok,false);
 assert.equal(v55.validateAction(p,m,"food_roast").ok,false);
 assert.equal(v55.validateAction(p,m,"interrupt").ok,false);
 assert.equal(v55.validateAction(p,m,"missing").ok,false);
 assert.equal(v55.validateAction(p,m,"cleanse").ok,false,"cannot waste Purify without status");
 assert.equal(JSON.stringify(p),before,"preflight must not mutate the player");
});
test("Stagger is available to solo players, and Interrupt cancels a queued attack",()=>{
 const {r,say,strike}=match(5,["swordsman"]);
 const p=r.players.get("p0"),m=r.monster;
 assert.equal(m.staggerThreshold,90);
 for(let i=0;i<4;i++)v55.addStagger(r,p,"skill3",say);
 assert.equal(m.stagger,m.staggerThreshold);
 m.queuedMove={name:"Briarstorm",scope:"all",element:"nature",power:.76,charge:false};
 assert.equal(v55.validateAction(p,m,"interrupt").ok,true);
 assert.equal(v55.interrupt(r,p,say),true);
 assert.equal(m.stagger,0);
 assert.equal(m.interruptImmunity,2);
 const hp=p.hp;strike();
 assert.equal(p.hp,hp,"broken attack cannot deal damage");
 assert.equal(m.skipNextAttack,false);
 assert.ok(r.log.some(x=>x.includes("BREAKS")));
});
test("Interrupt lockout prevents consecutive breaks, with Stagger decay on real attacks",()=>{
 const {r,say,strike}=match(35,["tank"]),m=r.monster;
 m.stagger=m.staggerThreshold;
 m.queuedMove={name:"Rift Collapse",charge:false,scope:"all",power:.7,element:"void"};
 assert.equal(v55.interrupt(r,r.players.get("p0"),say),true);
 strike();
 assert.equal(m.interruptImmunity,2);
 m.intent={name:"Strike",scope:"single",power:1,element:"physical"};
 strike();
 assert.equal(m.interruptImmunity,1);
 strike();
 assert.equal(m.interruptImmunity,0);
});
test("Perfect Guard only activates against an announced imminent attack",()=>{
 const a=match(5,["tank"]),b=match(5,["tank"]);
 const pa=a.r.players.get("p0"),pb=b.r.players.get("p0");
 v54.guard(a.r,pa,a.say);
 assert.equal(v55.perfectGuard(a.r,pa,a.say),false);
 b.r.monster.queuedMove={name:"Briarstorm",scope:"single",element:"nature",power:1,charge:false};
 v54.guard(b.r,pb,b.say);
 assert.equal(v55.perfectGuard(b.r,pb,b.say),true);
 a.strike();b.strike();
 assert.ok(pb.hp>pa.hp,"correctly timed guard mitigates additional damage");
 assert.ok(b.r.monster.stagger>0,"perfect block pressures the boss");
});
test("defeat Gold penalty B is applied once per room, capped, and never touches equipment or EXP",()=>{
 const {r,say}=match();
 const a=r.players.get("p0"),b=r.players.get("p1");
 a.gold=1000;b.gold=90000;
 a.xp=444;a.inventory=[{uid:"sword",name:"Rare Sword",equippedSlot:"main"}];
 a.smallHealth=1;
 r.status="defeat";
 assert.equal(v55.applyDefeatPenalty(r,say),true);
 assert.equal(a.gold,920);
 assert.equal(b.gold,88000);
 assert.equal(v55.applyDefeatPenalty(r,say),false,"no repeated Gold loss on re-emits");
 assert.equal(a.gold,920);
 assert.equal(a.xp,444);
 assert.equal(a.inventory[0].uid,"sword");
 assert.equal(a.smallHealth,1);
 assert.ok(r.log.some(x=>x.includes("Used consumables are not refunded")));
});
test("telegraphed target selection honors living Taunt priority",()=>{
 const {r}=match(5,["mage","tank"]);
 const mage=r.players.get("p0"),tank=r.players.get("p1");
 mage.hp=80;
 const planned=v55.planMove(r,{name:"Strike",scope:"single",charge:false,element:"physical",power:1},()=>0);
 assert.equal(planned.targetId,mage.id);
 tank.tauntTurns=2;
 assert.equal(v55.selectTarget(r,planned,()=>0).id,tank.id);
 tank.hp=0;
 assert.equal(v55.selectTarget(r,planned,()=>0).id,mage.id);
});
test("phase 2 remains restricted to stages 35 and 40, without touching saved user fields",()=>{
 const s=read("server.js"),ui=read("public/game.js"),html=read("public/index.html");
 assert.deepEqual(v54.PHASE_TWO_STAGES,[35,40]);
 assert.ok(s.includes('advanced.applyDefeatPenalty(r,say)'));
 assert.ok(s.includes('advanced.validateAction(p,m,type)'));
 assert.ok(s.includes('advanced.resetEncounter(r)'));
 assert.ok(s.includes('advanced.damageMultiplier(m,advanced.playerSkillElement(p,type))'));
 assert.ok(s.includes('p.battleDefenseBonus=Math.max'));
 assert.ok(!s.includes('p.def+=3'));
 assert.ok(html.includes('id="v055Stagger"'));
 assert.ok(html.includes('data-action="cleanse"'));
 assert.ok(html.includes('data-action="interrupt"'));
 assert.ok(ui.includes('s.status==="defeat"'));
 assert.ok(!read("public/game.js").includes("ccImmuneTurns:p.ccImmuneTurns"));
});

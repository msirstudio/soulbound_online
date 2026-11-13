"use strict";
/* SOULBOUND v0.55 — authoritative Hardcore RPG combat rules.
 * All fields are transient on live rooms/players/monsters. No Supabase schema
 * changes; never persist cooldowns, stagger, elemental statuses or AI intent.
 */
const REGIONS=Object.freeze({
 cursed_wilds:{element:"nature",weak:"fire",resist:"nature"},
 dreadforge_bastion:{element:"fire",weak:"ice",resist:"fire"},
 ember_caverns:{element:"fire",weak:"ice",resist:"fire"},
 hollow_sanctum:{element:"arcane",weak:"void",resist:"arcane"},
 frostbound_peaks:{element:"ice",weak:"fire",resist:"ice"},
 titanfall_ruins:{element:"earth",weak:"arcane",resist:"earth"},
 abyssal_rift:{element:"void",weak:"light",resist:"void"},
 eclipse_throne:{element:"light",weak:"void",resist:"light"}
});
const SKILL_COST=Object.freeze({skill:12,skill2:25,skill3:20,skill4:30,skill5:24,cleanse:18,interrupt:8});
const SKILL_UNLOCK=Object.freeze({skill:1,skill2:3,skill3:5,skill4:8,skill5:5,cleanse:1,interrupt:1});
const CONTROL=new Set(["stun","freeze"]);
const ELEMENTS=new Set(["physical","nature","fire","ice","arcane","earth","void","light"]);
const DOT=new Set(["burn","poison","bleed"]);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const playerSkillElement=(p,type)=>{
 if(p?.classId==="mage")return {skill:"arcane",skill2:"fire",skill3:"ice",skill4:"arcane",skill5:"arcane"}[type]||"physical";
 if(p?.classId==="tank")return {skill:"earth",skill4:"earth"}[type]||"physical";
 return "physical";
};
function enemyProfile(m){
 let config=REGIONS[m?.regionId]||REGIONS.cursed_wilds;
 if(m?.regionId==="eclipse_throne"&&m?.phase===2)
  config={element:"void",weak:"light",resist:"void"};
 return {...config};
}
function damageMultiplier(m,element){
 if(!m||(m.boss!==true&&m.miniBoss!==true)||!ELEMENTS.has(element)||element==="physical")return 1;
 const profile=enemyProfile(m);
 if(profile.weak===element)return 1.2;
 if(profile.resist===element)return .8;
 return 1;
}
function enemyDamageFactor(p,element){
 if(!p||!ELEMENTS.has(element)||element==="physical")return 1;
 const race={elf:{arcane:.13,ice:.1},dwarf:{earth:.18,fire:.06},
 sylvan:{nature:.17},demon:{fire:.2},dragonkin:{fire:.13},
 celestial:{light:.17},voidborn:{void:.2}}[p.raceId]||{};
 let resistance=race[element]||0;
 if(p.classId==="tank")resistance+=.06;
 if(p.classId==="mage"&&["arcane","ice","fire"].includes(element))resistance+=.03;
 return 1-clamp(resistance,0,.3);
}
function statusResistance(p,id){
 let r=p?.classId==="tank"?.15:p?.classId==="mage"?.08:.05;
 if(CONTROL.has(id))r+=p?.raceId==="dwarf"?.18:p?.raceId==="celestial"?.14:.03;
 if(id==="burn"&&["demon","dragonkin"].includes(p?.raceId))r+=.24;
 if(id==="poison"&&p?.raceId==="sylvan")r+=.18;
 if(id==="weaken"&&p?.raceId==="voidborn")r+=.16;
 if((p?.guardTurns||0)>0)r+=.07;
 return clamp(r,0,.6);
}
function tryApplyStatus(p,id,chance,random,effectFor){
 if(!p||typeof effectFor!=="function"||typeof random!=="function")return false;
 if(CONTROL.has(id)&&(p.ccImmuneTurns||0)>0)return false;
 const finalChance=clamp(Number(chance)||0,0,1)*(1-statusResistance(p,id));
 if(random()>=finalChance)return false;
 return !!effectFor(p,id,CONTROL.has(id)?1:2);
}
function validateAction(p,m,type){
 if(!p||!m||typeof type!=="string")return {ok:false,error:"Missing hero or enemy."};
 if(type==="attack"||type==="guard")return {ok:true};
 if(Object.hasOwn(SKILL_COST,type)){
  if(type==="cleanse"&&!(p.statusEffects||[]).length)return {ok:false,error:"No status ailments to purify."};
  const cost=p.raceId==="elf"&&type.startsWith("skill")?Math.floor(SKILL_COST[type]*.95):SKILL_COST[type];
  if((p.cooldowns?.[type]||0)>0)return {ok:false,error:type+" has "+p.cooldowns[type]+" cooldown turn(s) left."};
  if(p.level<(SKILL_UNLOCK[type]||1))return {ok:false,error:"Unlocks at level "+SKILL_UNLOCK[type]+"."};
  if(p.mp<cost)return {ok:false,error:"Not enough MP."};
  if(type==="interrupt"){
   if(!m.queuedMove||m.queuedMove.charge!==false)return {ok:false,error:"Interrupt is only available during a charged attack."};
   if((m.interruptImmunity||0)>0)return {ok:false,error:"Boss is temporarily immune to interrupts."};
   if((m.stagger||0)<(m.staggerThreshold||90))return {ok:false,error:"Stagger gauge is not full."};
  }
  return {ok:true};
 }
 if(["heal","healSmall","healMedium","healLarge"].includes(type)){
  const tier=type==="healLarge"?"large":type==="healMedium"?"medium":"small";
  if((p[tier+"Health"]||0)<1||p.hp>=p.maxHp)return {ok:false,error:"No potion of this size or HP is full."};
  return {ok:true};
 }
 if(["mana","manaSmall","manaMedium","manaLarge"].includes(type)){
  const tier=type==="manaLarge"?"large":type==="manaMedium"?"medium":"small";
  if((p[tier+"Mana"]||0)<1||p.mp>=p.maxMp)return {ok:false,error:"No mana potion of this size or MP is full."};
  return {ok:true};
 }
 if(["food_roast","food_stew","food_tart"].includes(type)){
  const key={food_roast:"roast_meat",food_stew:"herb_stew",food_tart:"mana_tart"}[type];
  return (p.foodItems?.[key]||0)>0?{ok:true}:{ok:false,error:"You do not have this food."};
 }
 return {ok:false,error:"Unknown action."};
}
function resetEncounter(r){
 if(!r||!r.monster)return;
 const m=r.monster;
 m.staggerThreshold=m.miniBoss?65:m.stage>=35?130:90;
 m.stagger=0;m.interruptImmunity=0;m.skipNextAttack=false;
 m.aiLastSpecial=-99;
 r.defeatPenaltyApplied=false;
 for(const p of r.players.values()){
  p.battleDefenseBonus=0;p.ccImmuneTurns=0;p.perfectGuardTurns=0;
 }
}
function addStagger(r,p,type,say){
 const m=r?.monster;
 if(!m||(m.boss!==true&&m.miniBoss!==true)||m.hp<=0)return 0;
 const source={attack:14,skill:19,skill2:27,skill3:30,skill4:35,skill5:23,perfect:14}[type]||0;
 const modifier=p?.classId==="swordsman"?1.3:p?.classId==="tank"?1.14:1;
 const gained=Math.max(0,Math.round(source*modifier));
 m.stagger=clamp((m.stagger||0)+gained,0,m.staggerThreshold||90);
 if(m.stagger>=m.staggerThreshold&&(m._staggerAnnounced!==true)){
  m._staggerAnnounced=true;
  say(r,"⚡ "+m.name+" is vulnerable to INTERRUPT during a charged attack!");
 }else if(m.stagger<m.staggerThreshold)m._staggerAnnounced=false;
 return gained;
}
function canInterrupt(m){
 return !!m?.queuedMove&&m.queuedMove.charge===false&&
 (m.stagger||0)>=(m.staggerThreshold||90)&&(m.interruptImmunity||0)===0;
}
function interrupt(r,p,say){
 if(!canInterrupt(r?.monster))return false;
 const m=r.monster;
 m.queuedMove=null;m.skipNextAttack=true;
 m.stagger=0;m._staggerAnnounced=false;
 m.interruptImmunity=2;
 m.intent={name:"INTERRUPTED",scope:"single",element:"physical",power:0,charge:false};
 say(r,"⚡ "+p.name+" BREAKS "+m.name+"'s charged attack! The next enemy action is canceled.");
 return true;
}
function perfectGuard(r,p,say){
 const m=r?.monster;
 if(!m?.queuedMove||m.queuedMove.charge!==false)return false;
 p.perfectGuardTurns=1;
 r.partyWardTurns=Math.max(1,r.partyWardTurns||0);
 r.partyWardReduction=Math.max(r.partyWardReduction||0,p.classId==="tank"?.4:.28);
 say(r,"✨ PERFECT GUARD! "+p.name+" times the defense against "+m.queuedMove.name+".");
 return true;
}
function onPerfectBlock(r,p,say){
 if(!(p?.perfectGuardTurns>0))return;
 addStagger(r,p,"perfect",say);
 say(r,p.name+" gains Stagger pressure from the perfect block.");
}
function selectTarget(r,move,random){
 const living=[...r.players.values()].filter(p=>p.hp>0);
 if(!living.length)return null;
 const tanks=living.filter(p=>p.classId==="tank"&&(p.tauntTurns||0)>0);
 if(tanks.length)return tanks[Math.floor(random()*tanks.length)];
 if(move?.targetId){const marked=living.find(p=>p.id===move.targetId);if(marked)return marked}
 return living[Math.floor(random()*living.length)];
}
function planMove(r,base,random= Math.random){
 const m=r?.monster;if(!m||!(m.boss||m.miniBoss)||m.queuedMove)return base;
 // All choices happen BEFORE the boss action, so the visible intent remains authoritative.
 if(m.hp<=m.maxHp*.3&&m.combatTurn>0&&m.combatTurn%4===0&&m.aiLastSpecial!==m.combatTurn){
  m.aiLastSpecial=m.combatTurn;
  return {name:"Last Stand",scope:"all",element:enemyProfile(m).element,power:.72,
    effect:null,charge:!!m.boss};
 }
 if(base.scope==="single"){
  const weak=[...r.players.values()].filter(p=>p.hp>0&&p.hp/p.maxHp<=.35);
  if(weak.length){
   const target=weak[Math.floor(random()*weak.length)];
   return {...base,targetId:target.id,targetName:target.name};
  }
 }
 return base;
}
function onEnemyAttack(r){
 const m=r?.monster;if(!m)return;
 m.stagger=Math.max(0,(m.stagger||0)-5);
 if(m.stagger<m.staggerThreshold)m._staggerAnnounced=false;
 if(m.interruptImmunity>0)m.interruptImmunity--;
}
function applyDefeatPenalty(r,say){
 if(!r||r.status!=="defeat"||r.defeatPenaltyApplied)return false;
 r.defeatPenaltyApplied=true;
 for(const p of r.players.values()){
  const gold=Math.max(0,Math.floor(Number(p.gold)||0));
  const loss=Math.min(gold,2000,Math.ceil(gold*.08));
  p.gold=gold-loss;
  say(r,p.name+" loses "+loss+" Gold after defeat (8%, maximum 2,000). EXP and equipped items are preserved. Used consumables are not refunded.");
 }
 return true;
}
module.exports={
 REGIONS,SKILL_COST,SKILL_UNLOCK,ELEMENTS,
 playerSkillElement,enemyProfile,damageMultiplier,enemyDamageFactor,statusResistance,tryApplyStatus,
 validateAction,resetEncounter,addStagger,canInterrupt,interrupt,perfectGuard,onPerfectBlock,
 selectTarget,planMove,onEnemyAttack,applyDefeatPenalty
};

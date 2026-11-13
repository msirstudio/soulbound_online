"use strict";
/* SOULBOUND v0.54 — authoritative, transient combat expansion.
 * Combat state is attached to live room/character objects. No schema changes.
 * Only the Void Reaper (stage 35) and Eclipse Sovereign (stage 40) use Phase 2.
 */
const PHASE_TWO_STAGES=Object.freeze([35,40]);
const BOSS_SPECIALS=Object.freeze({
 cursed_wilds:{name:"Briarstorm",scope:"all",element:"nature",power:.76,effect:"bleed",chance:.55},
 dreadforge_bastion:{name:"Forged Inferno",scope:"all",element:"fire",power:.74,effect:"burn",chance:.55},
 ember_caverns:{name:"Magma Rupture",scope:"all",element:"fire",power:.85,effect:"burn",chance:.7},
 hollow_sanctum:{name:"Oracle's Curse",scope:"all",element:"arcane",power:.7,effect:"weaken",chance:.7},
 frostbound_peaks:{name:"Glacial Prison",scope:"single",element:"ice",power:1.22,effect:"freeze",chance:.48},
 titanfall_ruins:{name:"Titan's Quake",scope:"all",element:"earth",power:.88,effect:"stun",chance:.14},
 abyssal_rift:{name:"Rift Collapse",scope:"all",element:"void",power:.82,effect:"poison",chance:.65},
 eclipse_throne:{name:"Eclipse Nova",scope:"all",element:"light",power:.85,effect:"burn",chance:.65}
});
const PHASE_TWO_SPECIALS=Object.freeze({
 abyssal_rift:{name:"Oblivion's Grasp",scope:"single",element:"void",power:1.28,effect:"stun",chance:.37},
 eclipse_throne:{name:"Sovereign Judgment",scope:"all",element:"light",power:.92,effect:"weaken",chance:.65}
});
const STATUS_NAMES=Object.freeze({
 burn:"Burn",poison:"Poison",bleed:"Bleed",weaken:"Weaken",freeze:"Freeze",stun:"Stun"
});
const max=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const canPhaseTwo=m=>!!m?.boss&&PHASE_TWO_STAGES.includes(m?.stage);
const moveFor=m=>{
 const phase2=canPhaseTwo(m)&&m.phase===2;
 const specials=phase2?PHASE_TWO_SPECIALS:BOSS_SPECIALS;
 const special=specials[m.regionId]||BOSS_SPECIALS.cursed_wilds;
 const signature=!!(m.boss||m.miniBoss)&&m.combatTurn%(phase2?2:3)===(phase2?0:1);
 if(!signature)return {name:"Strike",scope:"single",element:"physical",power:1,charge:false};
 const base=m.miniBoss?{...special,name:"Lesser "+special.name,power:Math.min(.8,special.power),chance:special.chance*.65}:special;
 return {...base,charge:!!m.boss}; // special main-boss attacks are clearly telegraphed.
};
function beginEncounter(m){
 if(!m)return m;
 m.combatTurn=0;m.stage=Number(m.stage)||0;
 m.phase=canPhaseTwo(m)?1:null;
 m.queuedMove=null;m.intent=moveFor(m);
 return m;
}
function checkPhase(r,say){
 const m=r?.monster;
 if(!canPhaseTwo(m)||m.phase!==1||m.hp<=0||m.hp>m.maxHp*.5)return false;
 m.phase=2;m.atk=Math.max(1,Math.round(m.atk*1.12));
 m.queuedMove=null;m.intent={...PHASE_TWO_SPECIALS[m.regionId],charge:true};
 say(r,"⚠ "+m.name+" enters PHASE 2! Its power surges. Prepare for "+m.intent.name+"!");
 return true;
}
function effectFor(p,id,turns=2){
 if(!STATUS_NAMES[id])return false;
 p.statusEffects=Array.isArray(p.statusEffects)?p.statusEffects:[];
 const prior=p.statusEffects.find(e=>e.id===id);
 if(prior){prior.turns=max(Math.max(prior.turns,turns),1,3)}
 else p.statusEffects.push({id,turns:max(turns,1,3)});
 return true;
}
function debuffMonster(m,id,turns=1){
 if(!m||!["chill","weaken"].includes(id))return false;
 m.statusEffects=Array.isArray(m.statusEffects)?m.statusEffects:[];
 const prior=m.statusEffects.find(e=>e.id===id);
 if(prior)prior.turns=max(Math.max(prior.turns,turns),1,3);
 else m.statusEffects.push({id,turns:max(turns,1,3)});
 return true;
}
function beforeAction(r,p,say){
 if(p._effectTurn===r.turnSerial)return {skip:false};
 p._effectTurn=r.turnSerial;p._combatAttackMultiplier=1;
 const active=Array.isArray(p.statusEffects)?p.statusEffects:[];
 let skip=false;
 for(const e of active){
  const id=e.id;
  if(["burn","poison","bleed"].includes(id)){
   const pct=id==="burn"?.045:id==="poison"?.032:.037;
   const damage=Math.max(1,Math.ceil(p.maxHp*pct));
   p.hp=Math.max(0,p.hp-damage);
   say(r,"⚠ "+p.name+" suffers "+damage+" "+STATUS_NAMES[id]+" damage.");
  }else if(id==="weaken")p._combatAttackMultiplier=Math.min(p._combatAttackMultiplier,.78);
  else if(id==="freeze"||id==="stun"){skip=true;say(r,p.name+" loses a turn to "+STATUS_NAMES[id]+".")}
  e.turns--;
 }
 p.statusEffects=active.filter(e=>e.turns>0);
 if(p.hp<=0){say(r,p.name+" falls from a status effect.");skip=true}
 return {skip};
}
function guard(r,p,say){
 p.guardTurns=1;
 const partyReduce=p.classId==="tank"?.28:.18;
 if((r.partyWardTurns||0)<1||partyReduce>(r.partyWardReduction||0)){
  r.partyWardReduction=partyReduce;
 }
 r.partyWardTurns=Math.max(r.partyWardTurns||0,1);
 say(r,p.name+" guards, protecting the party against the next enemy attack ("+Math.round(r.partyWardReduction*100)+"% reduction).");
}
function aegis(r,p,say){
 r.partyWardTurns=Math.max(r.partyWardTurns||0,2);
 r.partyWardReduction=Math.max(r.partyWardReduction||0,.25);
 say(r,p.name+" grants an Aegis Ward: the team takes 25% less damage for the next two enemy turns.");
}
function rollTarget(r,random){
 const alive=[...r.players.values()].filter(p=>p.hp>0);
 if(!alive.length)return null;
 const taunters=alive.filter(p=>p.classId==="tank"&&(p.tauntTurns||0)>0);
 const pool=taunters.length?taunters:alive;
 return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
}
function hitTarget(r,p,move,ctx){
 const m=r.monster,random=ctx.random||Math.random;
 const debuffs=m.statusEffects||[];
 const enemyWeak=debuffs.some(e=>e.id==="chill")?.8:debuffs.some(e=>e.id==="weaken")?.88:1;
 const elemental=ctx.elementDamageMultiplier?ctx.elementDamageMultiplier(move.element,p,m):1;
 const raw=Math.max(1,Math.round(m.atk*(move.power||1)*enemyWeak*elemental)-p.def);
 const foodGuard=p.foodBuffs?.def>0?.8:1;
 const classReduction=p.classPath==="knight"?.9:p.classPath==="guardian"?.88:1;
 const reduction=(p.damageReductionTurns>0?.8:1)*classReduction;
 const race=ctx.raceById?.(p.raceId)||{};
 const ward=r.partyWardTurns>0?1-max(r.partyWardReduction||0,0,.6):1;
 const guardReduction=p.guardTurns>0?.55:1;
 const hit=Math.max(1,Math.floor(raw*reduction*foodGuard*(1-(race.reduce||0))*ward*guardReduction));
 p.hp=Math.max(0,p.hp-hit);
 ctx.say(r,m.name+" uses "+move.name+" against "+p.name+" for "+hit+" damage.");
 if(p.foodBuffs?.def>0)p.foodBuffs.def--;
 if(move.effect&&p.hp>0){
  const turns=["stun","freeze"].includes(move.effect)?1:2;
  const applied=ctx.applyStatus
   ?ctx.applyStatus(p,move.effect,turns,{r,move,random,chance:move.chance||0})
   :(random()<(move.chance||0)&&effectFor(p,move.effect,turns));
  if(applied)ctx.say(r,p.name+" is afflicted with "+STATUS_NAMES[move.effect]+" ("+turns+" turn"+(turns===1?"":"s")+").");
 }
 return hit;
}
function monsterStrike(r,ctx){
 const m=r.monster;
 if(r.status!=="battle"||!m||m.hp<=0)return;
 if(![...r.players.values()].some(p=>p.hp>0)){r.status="defeat";ctx.say(r,"The party has fallen.");return}
 let move=m.queuedMove||m.intent||moveFor(m);
 if(move.charge){
  m.queuedMove={...move,charge:false};
  ctx.say(r,"⚠ "+m.name+" is CHARGING "+move.name+"! Guard to protect the party!");
 }else{
  const targets=move.scope==="all"?[...r.players.values()].filter(p=>p.hp>0):[rollTarget(r,ctx.random||Math.random)].filter(Boolean);
  for(const p of targets)hitTarget(r,p,move,ctx);
  m.queuedMove=null;
 }
 m.combatTurn++;
 if(!m.queuedMove)m.intent=ctx.selectMove?.(m,r)||moveFor(m);
 else m.intent=m.queuedMove;
 for(const p of r.players.values()){
  if(!move.charge&&p.tauntTurns>0)p.tauntTurns--;
  if(!move.charge&&p.damageReductionTurns>0)p.damageReductionTurns--;
  if(!move.charge&&p.guardTurns>0)p.guardTurns=0;
 }
 if(!move.charge&&r.partyWardTurns>0)r.partyWardTurns--;
 if(r.partyWardTurns===0)r.partyWardReduction=0;
 if(!move.charge&&m.vulnerableTurns>0)m.vulnerableTurns--;
 if(!move.charge&&Array.isArray(m.statusEffects)){
  for(const e of m.statusEffects)e.turns--;
  m.statusEffects=m.statusEffects.filter(e=>e.turns>0);
 }
 if(![...r.players.values()].some(p=>p.hp>0)){
  r.status="defeat";ctx.say(r,"The party has fallen.");
 }
}
module.exports={
 PHASE_TWO_STAGES,BOSS_SPECIALS,PHASE_TWO_SPECIALS,STATUS_NAMES,
 canPhaseTwo,beginEncounter,checkPhase,effectFor,debuffMonster,beforeAction,guard,aegis,monsterStrike,moveFor
};

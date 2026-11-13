"use strict";
/* SOULBOUND v0.55 — Hardcore combat rules and read-only Codex, same source of truth.
   All statuses, stagger and encounter AI live in memory only. No SQL/save migration.
 */
const base=require("./combat-v054");
const elemental=require("./elemental-v0552");
const {ELEMENTS,AFFINITIES}=elemental;
const STATUS_CODEX=Object.freeze([
 {id:"burn",name:"Burn",icon:"🔥",effect:"Lose 4.5% Max HP on the affected hero's turn.",counter:"Cleanse, Fire resistance, or reduce status chance.",turns:2},
 {id:"poison",name:"Poison",icon:"☠️",effect:"Lose 3.2% Max HP on the affected hero's turn.",counter:"Cleanse or status resistance.",turns:2},
 {id:"bleed",name:"Bleed",icon:"🩸",effect:"Lose 3.7% Max HP on the affected hero's turn.",counter:"Cleanse or status resistance.",turns:2},
 {id:"weaken",name:"Weaken",icon:"⬇️",effect:"Hero Weaken reduces outgoing damage by 22%; enemy Weaken reduces the monster's next attacks by 12%.",counter:"Cleanse the affected hero, or wait for the debuff to expire.",turns:2},
 {id:"chill",name:"Chill",icon:"❄️",effect:"Enemy-only debuff from Frost Nova: reduces the monster's next attack damage by 20%.",counter:"Chill is applied to enemies and expires after their next attack.",turns:1},
 {id:"freeze",name:"Freeze",icon:"🧊",effect:"Skip the next command; gain two turns of control immunity afterward.",counter:"Cleanse an ally before their turn, or resist Ice.",turns:1},
 {id:"stun",name:"Stun",icon:"💫",effect:"Skip the next command; gain two turns of control immunity afterward.",counter:"Cleanse an ally before their turn, or resist the status.",turns:1}
]);
const CONTROL=new Set(["freeze","stun"]);
const raceElementResist=Object.freeze({elf:{arcane:.12,ice:.08},dwarf:{earth:.15},sylvan:{nature:.15},dragonkin:{fire:.15},celestial:{light:.15},voidborn:{void:.15}});
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const profileFor=m=>{
 return elemental.profileFor(m);
};
const heroElementResistance=(p,element)=>{
 const fromRace=(raceElementResist[p?.raceId]||{})[element]||0;
 const fromPath=p?.classPath==="guardian"&&element==="physical"?.1:p?.classPath==="archmage"&&element==="arcane"?.1:0;
 return clamp(fromRace+fromPath,0,.5);
};
function elementMultiplier(target,element){
 return elemental.multiplier(target,element);
}
function statusResistance(p,id,element){
 let amount=.05;
 if(p.classId==="tank")amount+=.1;
 if(p.classPath==="guardian")amount+=.12;
 if(p.classPath==="paladin")amount+=.06;
 amount+=heroElementResistance(p,element);
 if(CONTROL.has(id))amount+=p.classId==="tank"?.1:0;
 return clamp(amount,0,.75);
}
function applyStatus(p,id,turns,{chance=1,element="physical",random=Math.random}={}){
 if(!base.STATUS_NAMES[id]||p.hp<=0)return false;
 if(CONTROL.has(id)&&(p.controlImmunityTurns>0||p.statusEffects?.some(e=>CONTROL.has(e.id))))return false;
 const success=clamp(chance,0,1)*(1-statusResistance(p,id,element));
 if(random()>=success)return false;
 base.effectFor(p,id,turns);
 return true;
}
function beforeAction(r,p,say){
 if(p._effectTurn===r.turnSerial)return {skip:false};
 p._effectTurn=r.turnSerial;
 p._combatAttackMultiplier=1;
 if(p.controlImmunityTurns>0)p.controlImmunityTurns--;
 const active=Array.isArray(p.statusEffects)?p.statusEffects:[];
 let dot=0,skip=false;
 const remaining=[];
 for(const effect of active){
  if(!base.STATUS_NAMES[effect.id])continue;
  if(["burn","poison","bleed"].includes(effect.id)){
   const pct=effect.id==="burn"?.045:effect.id==="poison"?.032:.037;
   dot+=Math.ceil(p.maxHp*pct);
  }else if(effect.id==="weaken"){
   p._combatAttackMultiplier=.78;
  }else if(CONTROL.has(effect.id)){
   skip=true;p.controlImmunityTurns=3;
   say(r,p.name+" is unable to act due to "+base.STATUS_NAMES[effect.id]+".");
  }
  effect.turns--;
  if(effect.turns>0&&!CONTROL.has(effect.id))remaining.push(effect);
 }
 p.statusEffects=remaining;
 if(dot>0){
  const damage=Math.min(Math.ceil(p.maxHp*.10),dot);
  p.hp=Math.max(0,p.hp-damage);
  say(r,"⚠ "+p.name+" suffers "+damage+" combined status damage (10% Max HP cap).");
 }
 if(p.hp<=0){skip=true;say(r,p.name+" falls to a status effect.");}
 return {skip};
}
// Two regional bonus attacks make the new elements visible in enemy combat too.
const SECONDARY_MOVES=Object.freeze({
 cursed_wilds:{name:"Monsoon Surge",scope:"all",element:"water",power:.62,effect:"weaken",chance:.35,charge:true},
 dreadforge_bastion:{name:"Stormhammer",scope:"single",element:"lightning",power:1.06,effect:"stun",chance:.20,charge:true}
});
function moveFor(m,r){
 const original=base.moveFor(m);
 if(m?.miniBoss&&elemental.MINI_ELEMENTS[Number(m.stage)]&&original.name!=="Strike"){
  const special=SECONDARY_MOVES[m.regionId];
  if(special)return {...special,name:"Lesser "+special.name,power:Math.min(.8,special.power),chance:special.chance*.65,charge:false};
 }
 if(!m?.boss||original.name!=="Strike"||m.queuedMove)return original;
 if(SECONDARY_MOVES[m.regionId]&&m.combatTurn>0&&m.combatTurn%7===2)
  return SECONDARY_MOVES[m.regionId];
 const pct=m.hp/Math.max(1,m.maxHp);
 const elem=profileFor(m).element;
 if(pct<.4&&m.combatTurn>0&&m.combatTurn%4===0)
  return {name:"Frenzied Sweep",scope:"all",element:elem,power:.64,charge:false,adaptive:true};
 if((r?.players?.size||m.partySize||1)>=3&&m.combatTurn>0&&m.combatTurn%5===0)
  return {name:"Crowd Breaker",scope:"all",element:elem,power:.56,charge:false,adaptive:true};
 return original;
}
function beginEncounter(m,r){
 base.beginEncounter(m);m.stagger=0;m.staggeredTurns=0;m.interruptImmunityTurns=0;
 m.statusEffects=[];
 m.intent=moveFor(m,r);
 return m;
}
function phaseChange(r,say){
 const changed=base.checkPhase(r,say);
 if(changed){
  r.monster.stagger=0;r.monster.staggeredTurns=0;r.monster.interruptImmunityTurns=1;
 }
 return changed;
}
function staggerThreshold(m){
 const party=clamp(Number(m.partySize)||1,1,4);
 const baseValue=m.miniBoss?80:(m.stage===35||m.stage===40)?130:100;
 return Math.round(baseValue*(party===1?.64:party===2?.88:party===3?1:1.13));
}
function addStagger(r,p,type="attack",element="physical",say=()=>{}){
 const m=r.monster;
 if(!m||!(m.boss||m.miniBoss)||m.hp<=0)return {gain:0,interrupted:false};
 const gains={attack:12,skill:24,skill2:27,skill3:30,skill4:37,skill5:27,break:42,perfectGuard:14};
 const gain=Math.round((gains[type]||10)*(elementMultiplier(m,element)>1?1.2:1));
 if(m.interruptImmunityTurns>0)return {gain:0,interrupted:false};
 m.stagger=clamp((m.stagger||0)+gain,0,staggerThreshold(m));
 const charged=!!m.queuedMove;
 if(m.stagger>=staggerThreshold(m)&&charged){
  m.queuedMove=null;m.stagger=0;m.staggeredTurns=1;m.interruptImmunityTurns=2;
  m.intent={name:"Staggered — attack interrupted",scope:"single",element:"physical",power:0,charge:false};
  say(r,"💥 "+p.name+" BREAKS "+m.name+"'s charged attack! The boss staggers.");
  return {gain,interrupted:true};
 }
 return {gain,interrupted:false};
}
function guard(r,p,say){
 const telegraph=!!r.monster?.queuedMove;
 base.guard(r,p,say);
 if(telegraph){
  r.partyWardReduction=Math.max(r.partyWardReduction||0,p.classId==="tank"?.38:.3);
  p.perfectGuard=true;
  say(r,"✨ PERFECT GUARD! "+p.name+" braces at the exact telegraph.");
  addStagger(r,p,"perfectGuard","physical",say);
 }
}
function cleanse(r,p,say){
 const others=[...r.players.values()].filter(x=>x.hp>0&&x.statusEffects?.length);
 const priority=x=>(x.statusEffects||[]).reduce((sum,e)=>sum+(CONTROL.has(e.id)?10:1),0);
 const target=others.sort((a,b)=>priority(b)-priority(a))[0];
 if(!target)return false;
 const ids=target.statusEffects.map(e=>e.id);
 target.statusEffects=[];
 target.controlImmunityTurns=Math.max(target.controlImmunityTurns||0,2);
 say(r,p.name+" uses CLEANSE on "+target.name+" and removes "+ids.join(", ")+".");
 return true;
}
function monsterStrike(r,{say,raceById,random=Math.random}={}){
 const m=r.monster;
 if(!m||r.status!=="battle"||m.hp<=0)return;
 if(m.staggeredTurns>0){
  m.staggeredTurns--;m.combatTurn++;
  say(r,"💫 "+m.name+" is staggered and cannot attack this turn.");
  m.intent=moveFor(m,r);
  return;
 }
 const wasCharge=!!(m.queuedMove||m.intent)?.charge;
 const intended=m.queuedMove||m.intent||moveFor(m,r);
 base.monsterStrike(r,{
  say,raceById,random,
  applyStatus:(p,id,turns,opts)=>applyStatus(p,id,turns,{chance:opts.chance,element:opts.move.element,random}),
  elementDamageMultiplier:(element,p)=>1-heroElementResistance(p,element),
  selectMove:(enemy,room)=>moveFor(enemy,room)
 });
 if(!wasCharge&&intended?.name!=="Strike"){
  m.stagger=Math.max(0,(m.stagger||0)-8);
 }
 if(!wasCharge&&m.interruptImmunityTurns>0)m.interruptImmunityTurns--;
 if(r.status==="defeat")applyDefeatPenalty(r,say);
}
function applyDefeatPenalty(r,say){
 if(r.status!=="defeat"||r.defeatPenaltyApplied)return false;
 r.defeatPenaltyApplied=true;
 for(const p of r.players.values()){
  const gold=Math.max(0,Math.floor(Number(p.gold)||0));
  const charge=gold?Math.min(2000,Math.max(1,Math.floor(gold*.08))):0;
  p.gold=gold-charge;
  say(r,p.name+" loses "+charge+" Gold (8% of carried Gold, max 2000) after the defeat. Used consumables are not restored.");
 }
 return true;
}
const SKILL_COSTS=Object.freeze({skill:[12,1],skill2:[25,3],skill3:[20,5],skill4:[30,8],skill5:[24,5],
 skill6:[22,7],skill7:[26,9],break:[15,1],cleanse:[12,1]});
function validateAction(p,type,r){
 if(!p||typeof type!=="string")return "Invalid action.";
 if(type==="attack"||type==="guard")return null;
 if(SKILL_COSTS[type]){
  if(["skill6","skill7"].includes(type)&&p.classId!=="mage")return "Only mages can cast this spell.";
  const [baseCost,level]=SKILL_COSTS[type];
  const cost=p.raceId==="elf"?Math.floor(baseCost*.95):baseCost;
  if(p.level<level)return "Unlocks at level "+level+".";
  if((p.cooldowns?.[type]||0)>0)return "Skill is on cooldown for "+p.cooldowns[type]+" more round(s).";
  if(p.mp<cost)return "Not enough MP.";
  if(type==="cleanse"&&![...r.players.values()].some(x=>x.hp>0&&x.statusEffects?.length))return "No ally needs cleansing.";
  return null;
 }
 if(["heal","healSmall","healMedium","healLarge"].includes(type)){
  const tier=type==="healLarge"?"large":type==="healMedium"?"medium":"small";
  return (p[tier+"Health"]||0)<1||p.hp===p.maxHp?"No potion of this size or HP is full.":null;
 }
 if(["mana","manaSmall","manaMedium","manaLarge"].includes(type)){
  const tier=type==="manaLarge"?"large":type==="manaMedium"?"medium":"small";
  return (p[tier+"Mana"]||0)<1||p.mp===p.maxMp?"No mana potion of this size or MP is full.":null;
 }
 if(["food_roast","food_stew","food_tart"].includes(type)){
  const key={food_roast:"roast_meat",food_stew:"herb_stew",food_tart:"mana_tart"}[type];
  return (p.foodItems?.[key]||0)<1?"You do not have this food.":null;
 }
 return "Unknown action.";
}
function skillElement(p,type){
 if(p.classId==="mage")return ({skill:"arcane",skill2:"fire",skill3:"ice",skill4:"arcane",skill5:"arcane",skill6:"water",skill7:"lightning"})[type]||"physical";
 if(p.classPath==="paladin"&&type==="skill4")return "light";
 return "physical";
}
function enemyCodex(m){
 const affinity=profileFor({...m,phase:1});
 const signature=base.BOSS_SPECIALS[m.regionId]||base.BOSS_SPECIALS.cursed_wilds;
 const mini=!!m.miniBoss;
 const miniSpecial=mini&&elemental.MINI_ELEMENTS[Number(m.stage)]?SECONDARY_MOVES[m.regionId]:null;
 const original=mini?{...(miniSpecial||signature),name:"Lesser "+(miniSpecial||signature).name,
  power:Math.min(.8,(miniSpecial||signature).power),chance:(miniSpecial||signature).chance*.65}:signature;
 const moves=[
  {name:"Strike",scope:"single",element:"physical",power:1,effect:null,chance:0,charge:false,description:"Basic physical strike."},
  ...(m.boss||m.miniBoss?[{...original,charge:!mini,description:mini?"Reduced-strength signature move.":"Signature attack with one warning/charge turn."}]:[])
 ];
 if(m.boss){
  if(SECONDARY_MOVES[m.regionId])
   moves.push({...SECONDARY_MOVES[m.regionId],description:"Regional elemental attack used during the boss's attack rotation."});
  moves.push({name:"Frenzied Sweep",scope:"all",element:affinity.element,power:.64,effect:null,chance:0,charge:false,description:"Adaptive group attack when HP drops below 40%."});
  moves.push({name:"Crowd Breaker",scope:"all",element:affinity.element,power:.56,effect:null,chance:0,charge:false,description:"Adaptive attack against parties of at least 3 players."});
 }
 if(base.canPhaseTwo(m)){
  moves.push({...base.PHASE_TWO_SPECIALS[m.regionId],charge:true,phase:2,description:"Phase 2 signature after crossing 50% HP."});
 }
 return {
  element:affinity.element,weak:affinity.weak,resist:affinity.resist,
  phase2:!!base.canPhaseTwo(m),
  phase2Affinity:base.canPhaseTwo(m)?profileFor({...m,phase:2}):null,
  bossExceptions:(m.boss&&m.phase!==2)?{extraWeak:affinity.extraWeak,extraResist:affinity.extraResist,reason:affinity.exceptionReason}:null,
  miniElementNote:affinity.miniNote||null,
  moves,staggerThreshold:staggerThreshold(m),
  dropsStatus:[...new Set(moves.map(x=>x.effect).filter(Boolean))]
 };
}
function codexData(){
 return {
  elements:elemental.codexElements(),
  affinities:elemental.codexAffinities(),
  chart:{strongVs:elemental.STRONG_VS,damage:elemental.OUTCOMES,
   priority:"Boss-only documented exceptions (neutral relations only) > core elemental chart > neutral. Same-element attacks are resisted; Physical stays neutral. Light and Void are mutually super effective."},
  statusEffects:STATUS_CODEX,
  combatRules:{
   weaknessMultiplier:1.2,resistanceMultiplier:.8,dotCapPercent:10,
   controlImmunityTurns:2,
   stagger:"Stagger persists across turns. When its threshold is reached during a charged attack, the move is interrupted. Bosses then resist further interrupts for two real enemy actions.",
   interrupt:"BREAK STRIKE costs 15 MP and has a 3-turn cooldown. Regular attacks and all damage skills also build Stagger.",
   guard:"GUARD recovers 8 MP and protects the team. Guard during a charged attack for Perfect Guard and 14 Stagger.",
   cleanse:"CLEANSE costs 12 MP, cooldown 3, removes all ailments from the most affected living ally. A stunned ally can be cleansed by a teammate.",
   defeat:"On party defeat every hero loses 8% carried Gold (maximum 2000 Gold). Used consumables are not restored. No EXP or equipment loss.",
   solo:"Boss Stagger threshold scales with party size so solo players can interrupt with planning.",
   elementalSources:"Mage Arcane Bolt=Arcane, Meteor=Fire, Frost Nova=Ice, Arcane Surge/Mark=Arcane, Tidal Surge=Water (LV 7), Thunderbolt=Lightning (LV 9). Other attacks are Physical, except Paladin Rallying Slash=Light.",
   damage:"A strong attack against the defender's element: ×1.20; a resisted attack: ×0.80; neutral or Physical: ×1.00. Same element resists. Light and Void beat each other. Boss extras only add weaknesses or resistances to neutral pairs."
  }
 };
}
module.exports={
 ...base,ELEMENTS,AFFINITIES,SECONDARY_MOVES,elementalChart:elemental.STRONG_VS,STATUS_CODEX,SKILL_COSTS,profileFor,
 heroElementResistance,elementMultiplier,statusResistance,applyStatus,beforeAction,
 moveFor,beginEncounter,checkPhase:phaseChange,staggerThreshold,addStagger,
 guard,cleanse,monsterStrike,applyDefeatPenalty,validateAction,skillElement,
 enemyCodex,codexData
};
"use strict";
/* SOULBOUND v0.55.2: ONE clear chart for elemental interactions.
 * Attack element -> defender element. Boss-only exceptions may ADD weaknesses/
 * resistances where the normal interaction is neutral, never contradict a win.
 * Void and Light deliberately harm each other (+20% in BOTH directions).
 * Physical is neutral and remains usable for every class.
 */
const ELEMENTS=Object.freeze({
 physical:{name:"Physical",icon:"⚔️",description:"Weapon damage; neutral against all types."},
 nature:{name:"Nature",icon:"🌿",description:"Roots and wild magic."},
 fire:{name:"Fire",icon:"🔥",description:"Flames and burning attacks."},
 ice:{name:"Ice",icon:"❄️",description:"Frost and freezing attacks."},
 arcane:{name:"Arcane",icon:"🔮",description:"Raw magic and mystical force."},
 earth:{name:"Earth",icon:"🪨",description:"Stone and metal."},
 void:{name:"Void",icon:"🌌",description:"Rift and shadow magic."},
 light:{name:"Light",icon:"✨",description:"Radiant and sacred magic."},
 water:{name:"Water",icon:"💧",description:"Tides and flowing magic."},
 lightning:{name:"Lightning",icon:"⚡",description:"Storm and electrical magic."}
});
const STRONG_VS=Object.freeze({
 physical:[],nature:["water","earth"],fire:["nature","ice"],
 water:["fire","earth"],ice:["nature","water"],earth:["fire","lightning"],
 lightning:["water","ice"],arcane:["earth"],void:["arcane","light"],light:["void"]
});
const REGIONS=Object.freeze({
 cursed_wilds:"nature",dreadforge_bastion:"earth",ember_caverns:"fire",
 hollow_sanctum:"arcane",frostbound_peaks:"ice",titanfall_ruins:"earth",
 abyssal_rift:"void",eclipse_throne:"light"
});
// Two existing mini-bosses provide real Water/Lightning enemy types
// without changing stages, art, save data, or boss phase rules.
const MINI_ELEMENTS=Object.freeze({
 4:{element:"water",reason:"Rootbound Guardian commands the flooded roots."},
 9:{element:"lightning",reason:"Ironbound Executioner channels storm energy through its armor."}
});
const BOSS_EXCEPTIONS=Object.freeze({
 dreadforge_bastion:{
  weak:["ice"],resist:[],
  reason:"Frost fractures the champion's forged armor. Ice is an additional boss-only weakness."
 },
 cursed_wilds:{
  weak:[],resist:["void"],
  reason:"Ancient roots ward off Void magic. Void is an additional boss-only resistance."
 }
});
const OUTCOMES=Object.freeze({strong:1.2,resisted:.8,neutral:1});
const all=Object.keys(ELEMENTS);
function relation(attack,defend){
 if(!ELEMENTS[attack]||!ELEMENTS[defend])return "neutral";
 if(attack==="physical"||defend==="physical")return "neutral";
 if(attack===defend)return "resisted";
 if((STRONG_VS[attack]||[]).includes(defend))return "strong";
 if((STRONG_VS[defend]||[]).includes(attack))return "resisted";
 return "neutral";
}
function baseAffinity(element){
 const type=ELEMENTS[element]?element:"nature";
 return {element:type,weak:all.filter(a=>relation(a,type)==="strong"),
  resist:all.filter(a=>relation(a,type)==="resisted")};
}
const AFFINITIES=Object.freeze(Object.fromEntries(Object.entries(REGIONS).map(([id,element])=>{
 const base=baseAffinity(element);
 return [id, id==="eclipse_throne"
  ?Object.freeze({...base,phase2:Object.freeze(baseAffinity("void"))})
  :Object.freeze(base)];
})));
function profileFor(monster={}){
 const region=AFFINITIES[monster.regionId]||AFFINITIES.cursed_wilds;
 const mini=monster.miniBoss?MINI_ELEMENTS[Number(monster.stage)]:null;
 const original=mini?baseAffinity(mini.element):monster.phase===2&&region.phase2?region.phase2:region;
 const special=monster.boss&&monster.phase!==2?BOSS_EXCEPTIONS[monster.regionId]:null;
 const weak=[...original.weak],resist=[...original.resist];
 for(const el of special?.weak||[])if(relation(el,original.element)==="neutral"&&!weak.includes(el))weak.push(el);
 for(const el of special?.resist||[])if(relation(el,original.element)==="neutral"&&!resist.includes(el))resist.push(el);
 return {element:original.element,weak,resist,miniNote:mini?.reason||null,
  extraWeak:special?.weak||[],extraResist:special?.resist||[],
  exceptionReason:special?.reason||null,
  phase2:region.phase2||null};
}
function multiplier(monster,attack){
 if(!ELEMENTS[attack]||attack==="physical")return 1;
 const profile=profileFor(monster);
 if(profile.weak.includes(attack))return OUTCOMES.strong;
 if(profile.resist.includes(attack))return OUTCOMES.resisted;
 return OUTCOMES.neutral;
}
function codexElements(){
 return all.map(id=>({
  id,...ELEMENTS[id],
  strongAgainst:STRONG_VS[id]||[],
  weakTo:all.filter(attack=>relation(attack,id)==="strong"),
  resistsAgainst:all.filter(attack=>relation(attack,id)==="resisted"),
  notes:id==="physical"?"Always neutral.":id==="light"||id==="void"
   ?"Light and Void are mutually super effective.":"Element-specific enemies may have documented extra boss weaknesses."
 }));
}
function codexAffinities(){
 return Object.entries(REGIONS).map(([regionId,element])=>({
  regionId,...baseAffinity(element),
  bossExtraWeak:BOSS_EXCEPTIONS[regionId]?.weak||[],
  miniElement:Object.entries(MINI_ELEMENTS).find(([stage])=>Math.ceil(Number(stage)/5)===Object.keys(REGIONS).indexOf(regionId)+1)?.[1]?.element||null,
  bossExtraResist:BOSS_EXCEPTIONS[regionId]?.resist||[],
  exceptionReason:BOSS_EXCEPTIONS[regionId]?.reason||null,
  phase2:AFFINITIES[regionId].phase2||null
 }));
}
module.exports={ELEMENTS,STRONG_VS,REGIONS,BOSS_EXCEPTIONS,MINI_ELEMENTS,OUTCOMES,AFFINITIES,
 relation,baseAffinity,profileFor,multiplier,codexElements,codexAffinities};
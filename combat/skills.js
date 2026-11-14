"use strict";
/**
 * SOULBOUND 0.58 — authoritative player skill catalog.
 * Cost/level/cooldown are shared with validation, while multipliers and names
 * are resolved from class and never supplied by a client.
 */
const COSTS=Object.freeze({
 skill:[12,1],skill2:[25,3],skill3:[20,5],skill4:[30,8],
 skill5:[24,5],skill6:[22,7],skill7:[26,9],break:[15,1],cleanse:[12,1]
});
const cooldown=Object.freeze({skill:2,skill2:3,skill3:3,skill4:4,skill5:4,skill6:3,skill7:3});
const SKILL_COSTS=Object.freeze(Object.fromEntries(Object.entries(COSTS).map(([name,values])=>[name,Object.freeze([...values])])));
const SKILL_TYPES=Object.freeze(["skill","skill2","skill3","skill4","skill5","skill6","skill7"]);
const AREA_SKILLS=Object.freeze({mage:Object.freeze(["skill2","skill3","skill6"]),swordsman:Object.freeze(["skill2"]),tank:Object.freeze([])});
function isAreaSkill(player,type){
 return AREA_SKILLS[player?.classId]?.includes(type)===true;
}
function definition(player,type){
 if(!SKILL_TYPES.includes(type))return null;
 const cls=player?.classId||"swordsman";
 const isMage=cls==="mage",isTank=cls==="tank";
 const multipliers={skill:isMage?1.9:isTank?.9:1.8,
  skill2:isTank?1.3:2.5,
  skill3:isMage?1.6:isTank?1.4:2,
  skill4:3,skill5:isTank?.8:1.25,skill6:1.8,skill7:1.95};
 const names={skill:isMage?"ARCANE BOLT":isTank?"SHIELD BASH":"POWER STRIKE",
  skill2:isMage?"METEOR":isTank?"IRON WALL":"WHIRLWIND",
  skill3:isMage?"FROST NOVA":isTank?"PROVOKE":"SHIELD BREAKER",
  skill4:isMage?"ARCANE SURGE":isTank?"FORTRESS STRIKE":"RALLYING SLASH",
  skill5:isMage?"ARCANE MARK":isTank?"AEGIS PACT":"ARMOR REND",
  skill6:"TIDAL SURGE",skill7:"THUNDERBOLT"};
 return{cost:SKILL_COSTS[type][0],unlock:SKILL_COSTS[type][1],
  mult:multipliers[type],name:names[type],cd:cooldown[type],
  area:isAreaSkill(player,type)};
}
function areaMultiplier(type){return({skill2:2.5,skill3:1.6,skill6:1.8})[type]||1.5}
module.exports={SKILL_COSTS,SKILL_TYPES,AREA_SKILLS,isAreaSkill,definition,areaMultiplier};

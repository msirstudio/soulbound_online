"use strict";
/* Fourth class weapon catalog. Items live in the existing shop and inventory
 * pipeline; canonical IDs remain stable across saves and copies use unique UIDs.
 */
const {TIERS}=require("./weapon-shop-v060");
const {spec}=require("./weapon-passives-v061");
const EARLY=Object.freeze([
 ["ashwood_bow","Ashwood Bow","🏹",8,120,1],
 ["hunter_recurve","Hunter Recurve","🏹",16,330,3],
 ["falcon_longbow","Falcon Longbow","🪶",29,800,8]
].map(([id,name,icon,value,price,level])=>Object.freeze({
 id,name,icon,description:"+"+value+" ATK · Archer · Lv "+level,
 price,class:"archer",slot:"weapon",category:"weapon",value,level
})));
const TEMPLATES=Object.freeze([
 ["verdant_bow","Verdant Bow","🌿",42,1850],
 ["stormstring_bow","Stormstring Bow","⚡",59,3700],
 ["glacier_recurve","Glacier Recurve","❄️",82,8300],
 ["shadowpiercer","Shadowpiercer","🌌",115,18000],
 ["sunseeker_bow","Sunseeker Bow","🌅",152,37000]
]);
const RARE=Object.freeze(TEMPLATES.map(([id,name,icon,value,price],idx)=>{
 const tier=TIERS[idx],passive=spec[id];
 return Object.freeze({
  id,name,icon,description:"+"+value+" ATK · Archer · Lv "+tier.level+" · Clear "+tier.bossName+" · "+passive.name+" ("+Math.round(passive.chance*100)+"%)",
  class:"archer",slot:"weapon",category:"weapon",value,price,level:tier.level,
  requiredBoss:tier.boss,unlockBossName:tier.bossName,shopTier:tier.label,
  element:passive.element,passive:{name:passive.name,chance:passive.chance,description:passive.description}
 });
}));
const WEAPONS=Object.freeze([...EARLY,...RARE]);
module.exports={WEAPONS,EARLY,RARE};

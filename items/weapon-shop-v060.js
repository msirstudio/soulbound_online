"use strict";
/**
 * SOULBOUND 0.60 — 15 new non-elemental progression weapons.
 * Level + completed-region-boss gating is checked by the server.
 * Item IDs and stats are stable save identifiers. No damage/element code here.
 * Elemental effects are a separate planned 0.61 release.
 */
const TIERS=Object.freeze([
 {level:15,boss:"cursed_wilds",bossName:"Briarfang Alpha",label:"Refined"},
 {level:25,boss:"dreadforge_bastion",bossName:"Dreadforge Champion",label:"Masterwork"},
 {level:40,boss:"hollow_sanctum",bossName:"Hollow Oracle",label:"Runic"},
 {level:55,boss:"frostbound_peaks",bossName:"Glacier Warden",label:"Elder"},
 {level:70,boss:"abyssal_rift",bossName:"Void Reaper",label:"Royal"}
]);
const TEMPLATES=Object.freeze({
 swordsman:[
  ["silver_fang","Silver Fang","🗡️",42,1800],
  ["flamebrand","Flamebrand","🔥",59,3600],
  ["thunder_edge","Thunder Edge","⚡",82,8000],
  ["abyss_blade","Abyss Blade","🌌",115,17500],
  ["dawnbringer","Dawnbringer","🌅",152,36000]
 ],
 mage:[
  ["moon_staff","Moon Staff","🌙",44,1850],
  ["frost_scepter","Frost Scepter","❄️",62,3800],
  ["stormcaller","Stormcaller","⛈️",86,8300],
  ["void_staff","Void Staff","🔮",119,18000],
  ["celestial_staff","Celestial Staff","✨",157,37000]
 ],
 tank:[
  ["ironbreaker","Ironbreaker","🔨",43,1800],
  ["earthshaker","Earthshaker","🪨",60,3700],
  ["runic_hammer","Runic Hammer","⚒️",84,8100],
  ["titan_crusher","Titan Crusher","🛡️",117,17800],
  ["divine_aegis","Divine Aegis","☀️",155,36500]
 ]
});
const WEAPONS=Object.freeze(Object.entries(TEMPLATES).flatMap(([cls,entries])=>
 entries.map(([id,name,icon,value,price],tier)=>{
  const gate=TIERS[tier];
  return Object.freeze({
   id,name,icon,description:"+"+value+" ATK · "+cls[0].toUpperCase()+cls.slice(1)+" · Lv "+gate.level+
    " · Clear "+gate.bossName+" first",
   price,class:cls,slot:"weapon",category:"weapon",
   value,level:gate.level,requiredBoss:gate.boss,unlockBossName:gate.bossName,
   shopTier:gate.label
  });
 })
));
function bossCleared(progress,id){
 return Number(progress?.bossDefeats?.[id]||0)>0||
  (Array.isArray(progress?.defeatedBossIds)&&progress.defeatedBossIds.includes(id));
}
function checkPurchase(player,item){
 if(!player||!item)return{ok:false,error:"Invalid weapon purchase."};
 if(item.class&&item.class!==player.classId)return{ok:false,error:"This weapon is for another class."};
 if((player.level||0)<(item.level||1))return{ok:false,error:"Requires level "+item.level+"."};
 if(item.requiredBoss&&!bossCleared(player.worldProgress,item.requiredBoss))
  return{ok:false,error:"Defeat "+item.unlockBossName+" before buying this weapon."};
 return{ok:true};
}
module.exports={WEAPONS,TIERS,checkPurchase,bossCleared};

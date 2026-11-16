"use strict";
/**
 * SOULBOUND v0.66 - armor groups, merchant progression and boss armor identity.
 * Server is authoritative for every class rule and bonus; the client only
 * displays allowedClasses supplied in the item catalog.
 *
 * Existing untyped boss drops remain universally usable so historical saves
 * keep their equipment. New boss/mini-boss drops receive a fixed armor type
 * when generated for the recipient's class.
 */
const GROUPS=Object.freeze({
 heavy:Object.freeze(["swordsman","tank"]),
 medium:Object.freeze(["archer","assassin"]),
 light:Object.freeze(["mage","priest"])
});
const LEGACY=Object.freeze({
 iron_armor:"heavy",guardian_plate:"heavy",dragon_scale:"heavy",
 sage_robe:"light",archmage_raiment:"light",void_mantle:"light"
});
const ARMOR_SLOTS=new Set(["armor","head","chest","pants","boots"]);
const LABELS=Object.freeze({heavy:"HEAVY",medium:"MEDIUM",light:"LIGHT"});
const TEMPLATES=Object.freeze({
 heavy:[
  ["steel_brigandine","Steel Brigandine","🛡️",3,8,32,0,340],
  ["wyrmguard_plate","Wyrmguard Plate","🐲",20,30,150,0,3100],
  ["royal_bastion_armor","Royal Bastion Armor","🏰",45,58,280,0,15400]
 ],
 medium:[
  ["scout_leathers","Scout Leathers","🥋",1,4,12,8,140],
  ["hunter_jerkin","Hunter Jerkin","🏹",3,7,23,12,325],
  ["rogue_jacket","Rogue Jacket","🗡️",5,10,38,18,515],
  ["shadowweave_vest","Shadowweave Vest","🌑",12,17,74,32,1320],
  ["stormrunner_coat","Stormrunner Coat","🌪️",20,25,115,46,2900],
  ["phantom_hunter_mantle","Phantom Hunter Mantle","👤",45,49,210,86,15200]
 ],
 light:[
  ["adept_mantle","Adept Mantle","✨",3,5,0,34,340],
  ["starlit_vestments","Starlit Vestments","🌠",20,20,0,175,3050],
  ["oracle_raiment","Oracle Raiment","🔮",45,39,0,310,15100]
 ]
});
const NEW_ARMOR=Object.freeze(Object.entries(TEMPLATES).flatMap(([type,entries])=>
 entries.map(([id,name,icon,level,defense,maxHp,maxMp,price])=>Object.freeze({
  id,name,icon,level,defense,maxHp,maxMp,price,armorType:type,
  allowedClasses:[...GROUPS[type]],slot:"armor",category:"armor",
  description:LABELS[type]+" ARMOR · +"+defense+" DEF"+
   (maxHp?" · +"+maxHp+" HP":"")+
   (maxMp?" · +"+maxMp+" MP":"")+" · Lv "+level
 }))
));
function isArmor(item){return !!item&&ARMOR_SLOTS.has(item.slot);}
function classArmorType(classId){
 for(const [type,classes] of Object.entries(GROUPS))if(classes.includes(classId))return type;
 return null;
}
function armorType(item){
 const value=item?.armorType;
 return Object.hasOwn(GROUPS,value)?value:(LEGACY[item?.id]||null);
}
function decorateShopItem(item){
 if(!item||item.slot!=="armor")return item;
 const type=armorType(item);
 if(!type)return item;
 return {
  ...item,armorType:type,allowedClasses:[...GROUPS[type]],
  description:(item.description?.includes(LABELS[type]+" ARMOR")?item.description:LABELS[type]+" ARMOR · "+(item.description||""))
 };
}
function canUse(player,item){
 if(!isArmor(item))return true;
 const type=armorType(item);
 // Legacy boss loot without an armorType predates v0.66 and stays compatible.
 return !type||GROUPS[type].includes(player?.classId);
}
function checkPurchase(player,item){
 return canUse(player,item)?{ok:true}:{ok:false,error:"Only "+GROUPS[armorType(item)].join(" / ")+" may wear "+LABELS[armorType(item)]+" armor."};
}
function brandLootForType(item,type){
 if(!item||!["head","chest","pants","boots"].includes(item.slot)||!Object.hasOwn(GROUPS,type))return item;
 const result={...item};
 const baseDef=Number(item.defense)||0,baseHp=Number(item.maxHp)||0;
 if(type==="heavy"){result.defense=Math.round(baseDef*1.13);result.maxHp=Math.round(baseHp*1.18);result.maxMp=0;}
 if(type==="medium"){result.defense=baseDef;result.maxHp=Math.round(baseHp*.92);result.maxMp=Math.max(4,Math.round(baseHp*.43));}
 if(type==="light"){result.defense=Math.max(1,Math.round(baseDef*.83));result.maxHp=Math.round(baseHp*.30);result.maxMp=Math.max(8,Math.round(baseHp*1.25));}
 result.armorType=type;
 result.allowedClasses=[...GROUPS[type]];
 result.name=LABELS[type]+" "+item.name;
 result.description=LABELS[type]+" ARMOR · "+
  [["defense","DEF"],["maxHp","HP"],["maxMp","MP"]].filter(([k])=>Number(result[k])>0).map(([k,n])=>"+"+result[k]+" "+n).join(" · ");
 return result;
}
function brandLoot(item,classId){return brandLootForType(item,classArmorType(classId));}
function restoreLoot(item,saved){
 const type=saved?.armorType;
 return Object.hasOwn(GROUPS,type)?brandLootForType(item,type):item;
}
module.exports={GROUPS,LEGACY,NEW_ARMOR,LABELS,classArmorType,armorType,canUse,checkPurchase,decorateShopItem,brandLoot,restoreLoot,isArmor};

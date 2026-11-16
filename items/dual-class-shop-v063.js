"use strict";
/* Six starter progression weapons; use the existing canonical shop and level gates. */
const templates=[
 ["practice_dirks","Practice Dirks","🗡️","assassin",8,120,1],
 ["shadow_steel_knives","Shadow Steel Knives","🗡️","assassin",17,345,3],
 ["nightstalker_daggers","Nightstalker Daggers","🌑","assassin",29,830,8],
 ["pilgrim_crook","Pilgrim Crook","✨","priest",8,120,1],
 ["blessed_rod","Blessed Rod","🌟","priest",16,340,3],
 ["radiant_scepter","Radiant Scepter","☀️","priest",28,820,8]
];
const WEAPONS=Object.freeze(templates.map(([id,name,icon,cls,value,price,level])=>Object.freeze({
 id,name,icon,class:cls,slot:"weapon",category:"weapon",value,price,level,
 description:"+"+value+" ATK · "+(cls==="priest"?"Priest":"Assassin")+" · Lv "+level
})));
module.exports={WEAPONS};

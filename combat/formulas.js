"use strict";
/**
 * SOULBOUND 0.58 — single source of combat damage mathematics.
 * Pure functions: no DB/network, status mutations, random calls or timers.
 * IMPORTANT: these equations intentionally preserve 0.57 damage, rounding,
 * elemental modifiers and guard; no accidental difficulty or loot rebalance.
 */
const minimum=n=>Math.max(1,n);
function basicAttack({attack,defense,randomRoll=0,attackMultiplier=1,elementMultiplier=1,vulnerable=false}){
 return minimum(Math.floor((attack+randomRoll-defense)*attackMultiplier*elementMultiplier*(vulnerable?1.2:1)));
}
function skillAttack({attack,defense,skillMultiplier,randomRoll=0,attackMultiplier=1,elementMultiplier=1,vulnerable=false,archmage=false}){
 return minimum(Math.floor((Math.floor(attack*skillMultiplier*(archmage?1.1:1))+randomRoll-defense)*attackMultiplier*elementMultiplier*(vulnerable?1.2:1)));
}
function breakAttack({attack,defense,randomRoll=0,attackMultiplier=1,vulnerable=false}){
 return minimum(Math.floor((attack*.85+randomRoll-defense)*attackMultiplier*(vulnerable?1.2:1)));
}
function areaSplash({primaryDamage,attack,primaryDefense,secondaryDefense,primaryElement=1,secondaryElement=1,skillMultiplier=1,scale=.65}){
 const base=Math.max(1,attack*skillMultiplier);
 const correction=Math.max(.4,Math.min(1.6,(base-secondaryDefense)/Math.max(1,base-primaryDefense)));
 const ratio=secondaryElement/Math.max(.01,primaryElement);
 return minimum(Math.floor(primaryDamage*scale*correction*ratio));
}
function armorMultiplier(defense){
 return 100/(100+Math.max(0,Number(defense)||0)*.85);
}
function enemyRaw({attack,power=1,debuffMultiplier=1,elementMultiplier=1,defense=0}){
 return minimum(Math.round(attack*power*debuffMultiplier*elementMultiplier*armorMultiplier(defense)));
}
function enemyFinal({raw,reduction=1,foodGuard=1,raceReduction=0,partyWard=1,guardReduction=1}){
 return minimum(Math.floor(raw*reduction*foodGuard*(1-raceReduction)*partyWard*guardReduction));
}
module.exports={basicAttack,skillAttack,breakAttack,areaSplash,armorMultiplier,enemyRaw,enemyFinal};

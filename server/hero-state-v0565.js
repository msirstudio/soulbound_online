"use strict";
function serializeHero(p){
 return{username:p.name,class_id:p.classId,class_path:p.classPath||null,
 level:p.level,xp:p.xp,gold:p.gold,hp:p.hp,max_hp:p.maxHp,mp:p.mp,max_mp:p.maxMp,
 attack:p.atk,defense:p.def,potions:p.potions,mana_potions:p.manaPotions,
 small_health:p.smallHealth,medium_health:p.mediumHealth,large_health:p.largeHealth,
 small_mana:p.smallMana,medium_mana:p.mediumMana,large_mana:p.largeMana,
 weapon:p.weapon,armor:p.armor,inventory:p.inventory||[],
 weapon_item:p.weaponItem||null,armor_item:p.armorItem||null,
 food_items:p.foodItems||{},food_buffs:p.foodBuffs||{},race_id:p.raceId,
 race_points:p.racePoints,strength:p.strength,vitality:p.vitality,
 intelligence:p.intelligence,agility:p.agility,stat_points:p.statPoints,
 speed:p.speed,world_progress:p.worldProgress};
}
module.exports={serializeHero};

"use strict";
/* Authoritative, read-only Adventure INDEX. Reuses the same world encounter,
 * real multi-enemy spawn projection, shop catalog, combat codex and loot tables
 * as the live server. No second HP, ATK or DEF formulas here. */
const world=require("../world-v040");
const combat=require("../combat-v055");
const loot=require("../loot-v034");
const pack=world.encounterPack;
const {normal,bosses,shopItems,races}=require("../data/game-catalog-v062");
function buildIndex(APP_VERSION){
 const enemies=Array.from({length:world.totalStages},(_,index)=>{
  const stage=index+1,foe=world.encounter(stage,normal,bosses),zone=world.regionForStage(stage);
   const partyPreview=pack.encounterPreview(stage,foe,normal),solo=partyPreview[0].variants[0];
  return {id:"stage-"+stage,stage,name:foe.name,icon:foe.icon||"⚔",
   sprite:foe.sprite,boss:!!foe.boss,miniBoss:!!foe.miniBoss,regionId:foe.regionId,zone:zone.name,hp:solo.hp,atk:solo.atk,def:solo.def,
   xp:solo.xp,gold:solo.gold,partyPreview,...combat.enemyCodex({...foe,stage}),loot:foe.boss||foe.miniBoss?"Each possible item rolls separately by rarity; multiple drops can be won together.":"No random equipment drops"};
 });
 const goods=shopItems.map(it=>({...it,category:it.category==="food"?"food":it.slot==="weapon"?"weapons":it.slot==="armor"?"armor":"consumables"}));
 const drops=[],bossDropTables={},miniDropTables={};
 for(let i=1;i<=8;i++){
  for(const type of ["boss","mini"]){
   const isMini=type==="mini",stage=(i-1)*5+(isMini?4:5);
   const name=isMini?world.regions[i-1].miniName:bosses[i-1].name;
   const rows=(isMini?loot.miniDrops(i):loot.bossDrops(i)).map(it=>({
    ...it,category:it.slot==="main"||it.slot==="offhand"?"weapons":["head","chest","pants","boots"].includes(it.slot)?"armor":"accessories",
    source:name,sourceStage:stage,price:null
   }));
   drops.push(...rows);
   (isMini?miniDropTables:bossDropTables)[stage]=rows.map(({id,name,rarity,chance,slot,icon,category})=>({id,name,rarity,chance,slot,icon,category}));
  }
 }
 enemies.forEach(enemy=>{
  if(enemy.boss||enemy.miniBoss){enemy.drops=(enemy.boss?bossDropTables:miniDropTables)[enemy.stage]||[];
   enemy.loot="Each listed item is rolled independently for each player. Several items may drop on the same victory; bag capacity still applies.";}
 });
 
 return {version:APP_VERSION,title:"SOULBOUND ADVENTURE INDEX",stageCount:world.totalStages,
  categories:["bosses","monsters","races","weapons","armor","accessories","food","consumables","elements","statuses","combat"],
  codex:combat.codexData(),
  bossDropTables,miniDropTables,lootRule:"Each possible item has its own independent drop roll based on rarity. Multiple items may drop; inventory remains limited to 40 unequipped pieces.",
  races:races.map(({id,name,rarity,icon,weight,passive,buffs})=>({id,name,rarity:rarity==="legend"?"legendary":rarity,icon,chance:weight,passive,buffs})),
  monsters:enemies,items:[...goods,...drops],zones:world.regions.map(r=>({name:r.name,css:r.css,hint:r.hint,stages:r.firstStage+"–"+r.bossStage}))};
}
module.exports={buildIndex};

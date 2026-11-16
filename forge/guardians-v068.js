"use strict";
/* Two optional, repeatable Ancient Portal encounters. Main 40-stage campaign
 * is not changed. Progress is based on authenticated boss clear records.
 */
const LIST=Object.freeze([
 Object.freeze({id:"gorthan",name:"Gorthan — The Stone Tyrant",unlock:"dreadforge_bastion",unlockStage:10,regionStage:10,
  hint:"Stone armor shatters at half health. A colossal earthquake threatens the party.",
  css:"ruins",sprite:"gorthan-v068",icon:"🗿",hp:1200,atk:49,def:37,xp:370,gold:340,phases:2,element:"earth"}),
 Object.freeze({id:"selunara",name:"Selunara — The Fallen Oracle",unlock:"hollow_sanctum",unlockStage:20,regionStage:20,
  hint:"Moonlit curses and illusory echoes challenge every adventurer.",
  css:"ruins",sprite:"selunara-v068",icon:"🌙",hp:2400,atk:95,def:24,xp:800,gold:720,phases:2,element:"arcane"})
]);
const byId=id=>LIST.find(x=>x.id===id)||null;
function clearCount(p,id){return Math.max(0,Math.min(99999,Number(p?.worldProgress?.guardianClears?.[id])||0))}
function unlocked(p,boss){return !!boss&&(Number(p?.worldProgress?.bossDefeats?.[boss.unlock])||0)>0}
function eligible(room,id){
 const boss=byId(id);
 if(!boss)return{ok:false,error:"Unknown Ancient Guardian."};
 if(!room||room.status!=="city")return{ok:false,error:"Ancient Portal opens only in the Central City."};
 if(!room.players?.size)return{ok:false,error:"Join a party first."};
 for(const p of room.players.values()){
  if(!unlocked(p,boss))return{ok:false,error:p.name+" must clear story stage "+boss.unlockStage+" to enter."};
  if(p.hp<=0)return{ok:false,error:"Revive all heroes before entering."};
 }
 return{ok:true,boss};
}
function createEnemy(boss,partySize){
 const size=Math.max(1,Math.min(4,Number(partySize)||1));
 const hp=Math.round(boss.hp*(1+(size-1)*.60));
 const atk=Math.round(boss.atk*(1+(size-1)*.06));
 const regionId=boss.id==="gorthan"?"dreadforge_bastion":"hollow_sanctum";
 return {
  enemyId:"ancient-"+boss.id,boss:true,miniBoss:false,guardianId:boss.id,name:boss.name,
  sprite:boss.sprite,icon:boss.icon,regionId,stage:boss.regionStage,
  bossIndex:boss.id==="gorthan"?2:4,
  hp,maxHp:hp,atk,def:boss.def,xp:boss.xp,gold:boss.gold,
  speed:boss.id==="gorthan"?11:19,phase:1,
  difficulty:{hpScale:hp/boss.hp,atkScale:atk/boss.atk,count:1},partySize:size
 };
}
function markClear(p,id){
 if(!byId(id))return;
 if(!p.worldProgress)p.worldProgress={};
 const original=p.worldProgress.guardianClears||{};
 p.worldProgress.guardianClears={...original,[id]:Math.min(99999,clearCount(p,id)+1)};
}
const publicList=()=>LIST.map(b=>({id:b.id,name:b.name,unlockStage:b.unlockStage,hint:b.hint,icon:b.icon,sprite:b.sprite}));
module.exports={LIST,byId,clearCount,unlocked,eligible,createEnemy,markClear,publicList};

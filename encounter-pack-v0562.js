"use strict";
/* v0.56.2 · Real multi-enemy packs; one shared encounter reward.
 * Non-boss stages 1–3 of each region: base 1–2 enemies, +1 per extra human.
 * The group is a server-only battle state, not fake decorative duplicates.
 */
const difficulty=(stage,partySize,kind)=>{
 const region=Math.max(0,Math.min(7,Math.floor((stage-1)/5)));
 const extra=Math.max(0,partySize-1);
 if(kind==="boss")return {hp:1.6*(1+extra*.8),atk:(2.15+region*.05)*(1+extra*.06)};
 if(kind==="mini")return {hp:1.35*(1+extra*.7),atk:(1.75+region*.04)*(1+extra*.05)};
 return {hp:1+extra*.075,atk:(1.55+region*.015)*(1+extra*.025)};
};
const baseCount=(stage,random=Math.random)=>{
 const slot=(stage-1)%5+1;
 if(slot===1)return 1;
 if(slot===2)return random()<.7?2:1;
 if(slot===3)return random()<.85?2:1;
 return 1;
};
function makeGroup(room,first,normal,random=Math.random){
 const members=Math.max(1,room.players.size);
 const isNormal=!first.boss&&!first.miniBoss;
 const count=isNormal?baseCount(room.stage,random)+(members-1):1;
 const levelGroup=[];
 const scale=difficulty(room.stage,members,first.boss?"boss":first.miniBoss?"mini":"normal");
 const rewardScale=isNormal?1+.28*(count-1):1;
 // Each enemy has own HP, ATK, status, cooldowns and ID; encounter reward is
 // awarded once when the last enemy dies, regardless of who is targeted last.
 for(let index=0;index<count;index++){
  const extra=isNormal&&index>0;
  const template=extra?normal[Math.floor(random()*normal.length)]||normal[0]:first;
  const foe={...first};
  if(extra){
   // Use world-matched encounter identity, with a seeded selection from the
   // existing normal sprite pool. Name repetition is allowed.
   const idx=Math.floor((room.regionIndex*3+random()*3))%normal.length;
   foe.name=room.region?.normalNames?.[idx%3]||first.name;
   foe.sprite=(normal[idx]||template).sprite||first.sprite;
   foe.icon=(normal[idx]||template).icon||first.icon;
  }
  foe.enemyId="enemy-"+room.stage+"-"+index;
  foe.hp=Math.max(1,Math.round(first.maxHp*(isNormal?(count===1?1:.83):1)*scale.hp));
  foe.maxHp=foe.hp;
  foe.atk=Math.max(1,Math.round(first.atk*(isNormal?(count===1?1:.82):1)*scale.atk));
  foe.def=Math.max(0,first.def);
  foe.xp=Math.max(1,Math.round(first.xp*rewardScale));
  foe.gold=Math.max(1,Math.round(first.gold*rewardScale));
  foe.partySize=members;
  foe.difficulty={hpScale:+scale.hp.toFixed(2),atkScale:+scale.atk.toFixed(2),count};
  levelGroup.push(foe);
 }
 room.enemies=levelGroup;
 room.monster=levelGroup[0];
 return levelGroup;
}
function alive(room){return (room.enemies||[room.monster]).filter(x=>x&&x.hp>0)}
function select(room,id){
 if(!id)return room.monster;
 const candidate=alive(room).find(x=>x.enemyId===id);
 if(candidate)room.monster=candidate;
 return candidate||null;
}
function deadTarget(room){
 const remaining=alive(room);
 if(!remaining.length)return true;
 if(!room.monster||room.monster.hp<=0)room.monster=remaining[0];
 return false;
}
function publicEnemies(room){
 return (room.enemies||[]).map(x=>({
  enemyId:x.enemyId,name:x.name,sprite:x.sprite,icon:x.icon,hp:x.hp,maxHp:x.maxHp,
  atk:x.atk,def:x.def,boss:!!x.boss,miniBoss:!!x.miniBoss
 }));
}
module.exports={difficulty,baseCount,makeGroup,alive,select,deadTarget,publicEnemies};

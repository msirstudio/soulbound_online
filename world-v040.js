"use strict";
/* SOULBOUND v0.40 — shared authoritative world model.
  Eight regions / five encounters per region. A hero one level below the
  recommended region minimum may enter; higher regions remain locked. */
const names=[
 ["cursed_wilds","THE CURSED WILDS","ป่าต้องสาป","wilds","🌲","Ancient trees guard the forgotten paths.","The Briarfang Alpha",["Mossfang Wolf","Thornback Boar","Hexwood Stalker"],"Rootbound Guardian"],
 ["dreadforge_bastion","DREADFORGE BASTION","ป้อมเหล็กโบราณ","ruins","🏰","The fallen kingdom's forge still burns.","Dreadforge Champion",["Scrapiron Sentry","Fallen Legionnaire","Ashen Armor"],"Ironbound Executioner"],
 ["ember_caverns","EMBER CAVERNS","ถ้ำเพลิง","cavern","🌋","Molten rivers illuminate the crimson vaults.","Ember Tyrant",["Cinder Imp","Magma Beetle","Lavafang Drake"],"Molten Behemoth"],
 ["hollow_sanctum","HOLLOW SANCTUM","วิหารแห่งคำพยากรณ์","ruins","🔮","Ritual chambers whisper impossible prophecies.","The Hollow Oracle",["Veil Acolyte","Haunted Reliquary","Hexbound Sentinel"],"Sanctum Keeper"],
 ["frostbound_peaks","FROSTBOUND PEAKS","เทือกเขาน้ำแข็ง","frost","❄️","The frozen pass silences all who enter.","Glacier Warden",["Frostfang Wolf","Icecarapace Beetle","Blizzard Wraith"],"Frosthorn Colossus"],
 ["titanfall_ruins","TITANFALL RUINS","ซากอารยธรรมยักษ์","ruins","🗿","The shadows of long-dead titans fill the valley.","Ancient World-Eater",["Stonebound Scout","Ruined Golem","Abyssal Devourling"],"Titan's Sentinel"],
 ["abyssal_rift","ABYSSAL RIFT","รอยแยกแห่งความว่างเปล่า","abyss","🌌","The boundary between worlds grows thin.","The Void Reaper",["Shade Wisp","Nullblade Phantom","Riftstalker"],"Abyss Watcher"],
 ["eclipse_throne","ECLIPSE THRONE","บัลลังก์สุริยคราส","castle","🌘","Beyond the black sun waits the last sovereign.","Eclipse Sovereign",["Eclipsed Knight","Dusk Herald","Royal Revenant"],"Twilight Regent"]
];
const regions=Object.freeze(names.map((r,index)=>Object.freeze({
 index,id:r[0],name:r[1],thaiName:r[2],css:r[3],icon:r[4],hint:r[5],
 bossName:r[6],normalNames:Object.freeze(r[7]),miniName:r[8],
 recommendedMin:index*10+1,recommendedMax:(index+1)*10,
 requiredLevel:index===0?1:index*10,
 firstStage:index*5+1,miniStage:index*5+4,bossStage:index*5+5
})));
const totalStages=regions.length*5;
const byId=id=>regions.find(r=>r.id===id);
const regionForStage=stage=>regions[Math.max(0,Math.min(7,Math.floor((Number(stage)-1)/5)))]||regions[0];
function meta(stage){
 const n=Math.floor(Number(stage));if(!Number.isInteger(n)||n<1||n>totalStages)return null;
 const region=regionForStage(n),slot=(n-1)%5+1;
 return {region,slot,type:slot===5?"boss":slot===4?"mini":"normal"};
}
function canEnter(level,regionIndex){
 const region=regions[Number(regionIndex)];return !!region&&Number.isFinite(Number(level))&&Number(level)>=region.requiredLevel;
}
function normalizeProgress(v){
 const original=v&&typeof v==="object"&&!Array.isArray(v)?v:{};
 const defeated=Array.isArray(original.defeatedBossIds)?
  [...new Set(original.defeatedBossIds.filter(x=>typeof x==="string"&&regions.some(r=>r.id===x)))]:[];
 const bossDefeats={};
 for(const r of regions)bossDefeats[r.id]=Math.max(0,Math.min(999999,Math.floor(Number(original.bossDefeats?.[r.id])||0)));
 for(const id of defeated)bossDefeats[id]=Math.max(1,bossDefeats[id]);
 const cleanHistory=(list)=>Array.isArray(list)?[...new Set(list.filter(x=>typeof x==="string"&&/^[a-z0-9_:-]{3,90}$/i.test(x)))].slice(-300):[];
 return {version:44,defeatedBossIds:regions.filter(r=>bossDefeats[r.id]>0).map(r=>r.id),bossDefeats,
  lootSeen:cleanHistory(original.lootSeen),raceSeen:cleanHistory(original.raceSeen)};
}
function markBossClear(v,id){
 const p=normalizeProgress(v);if(!byId(id))return p;
 p.bossDefeats[id]++;if(!p.defeatedBossIds.includes(id))p.defeatedBossIds.push(id);return p;
}
function encounter(stage,normal,bosses){
 const m=meta(stage);if(!m)return null;
 const i=m.region.index,scale=1+i*.23,slot=m.slot;
 let b;
 if(m.type==="boss")b={...bosses[i],bossIndex:i+1,bossId:m.region.id};
 else if(m.type==="mini"){
  const base=bosses[i];
  b={name:m.region.miniName,sprite:normal[(i+3)%normal.length].sprite,icon:"💀",
   hp:Math.round(base.hp*.84),atk:Math.round(base.atk*.97),def:Math.max(1,base.def-1),
   xp:Math.round(base.xp*.65),gold:Math.round(base.gold*.65),miniBoss:true};
 }else{
  const old=normal[(i*3+slot-1)%normal.length];
  b={...old,name:m.region.normalNames[slot-1],
   hp:Math.round(old.hp*(1+slot*.12)),atk:old.atk+slot,def:old.def+slot,
   xp:Math.round(old.xp*(1+slot*.14)),gold:Math.round(old.gold*(1+slot*.12))};
 }
 const hp=Math.round(b.hp*scale);
 return {...b,hp,maxHp:hp,atk:Math.round(b.atk*scale),def:Math.round(b.def*scale),
  xp:Math.round(b.xp*(1+i*.32)*4),gold:Math.round(b.gold*(1+i*.24)),
  boss:m.type==="boss",miniBoss:m.type==="mini",regionId:m.region.id,stageInRegion:slot};
}
module.exports={regions,totalStages,byId,regionForStage,meta,canEnter,normalizeProgress,markBossClear,encounter};
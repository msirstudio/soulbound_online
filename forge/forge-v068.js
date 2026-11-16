"use strict";
/* SOULBOUND v0.68 · Single source of truth for the Ancient Forge.
 * All currency, material, rates and instance stats are calculated on the server.
 */
const STONES=Object.freeze({
 basic:Object.freeze({id:"basic",name:"Enhancement Stone",icon:"🔹",price:150}),
 refined:Object.freeze({id:"refined",name:"Refined Stone",icon:"💠",price:null}),
 ancient:Object.freeze({id:"ancient",name:"Ancient Stone",icon:"💎",price:null})
});
const SUCCESS=Object.freeze([100,90,80,70,60,45,35,25,15,10]);
const GOLD=Object.freeze([70,140,250,450,700,1100,1700,2600,4000,6500]);
const COUNT=Object.freeze([1,1,2,1,1,2,2,1,2,3]);
const BONUS=Object.freeze([0,3,6,9,12,16,20,25,30,36,45]);
const MAX_MATERIAL=999999,MAX_GOLD=99999999;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clamp=(value,min,max)=>Number.isSafeInteger(Number(value))?Math.max(min,Math.min(max,Number(value))):min;
const normalizeMaterials=x=>Object.fromEntries(Object.keys(STONES).map(k=>[k,clamp(x?.[k],0,MAX_MATERIAL)]));
const levelOf=x=>clamp(x?.enhanceLevel,0,10);
function requirement(current){
 if(!Number.isInteger(current)||current<0||current>9)return null;
 const target=current+1;
 return {from:current,to:target,rate:SUCCESS[current],gold:GOLD[current],
  stone:target<=3?"basic":target<=7?"refined":"ancient",count:COUNT[current],
  bonus:BONUS[target]};
}
function upgradeStats(base,level){
 const lvl=clamp(level,0,10),mult=1+BONUS[lvl]/100;
 const keys=["value","defense","maxHp","maxMp"],next={...base,enhanceLevel:lvl};
 for(const k of keys){
  const val=Math.max(0,Number(base[k])||0);
  next[k]=Math.max(0,Math.round(val*mult));
 }
 if(lvl)next.description=String(base.description||"").slice(0,140)+" · FORGE +"+lvl;
 return next;
}
function statDelta(before,after){
 return Object.fromEntries(["value","defense","maxHp","maxMp"].map(k=>[k,(Number(after[k])||0)-(Number(before[k])||0)]));
}
function syncWorn(p,oldItem,newItem){
 const delta=statDelta(oldItem,newItem);
 p.atk=Math.max(1,p.atk+delta.value);
 p.def=Math.max(1,p.def+delta.defense);
 p.maxHp=Math.max(1,p.maxHp+delta.maxHp);
 p.maxMp=Math.max(0,p.maxMp+delta.maxMp);
 p.hp=Math.max(0,Math.min(p.hp,p.maxHp));
 p.mp=Math.max(0,Math.min(p.mp,p.maxMp));
}
function record(x){
 return Array.isArray(x)?x.filter(a=>a&&typeof a.requestId==="string"&&UUID.test(a.requestId)).slice(-50):[];
}
function attempt(p,input,resolveBase,{random=Math.random,now=()=>new Date().toISOString()}={}){
 const id=String(input?.requestId||"");
 if(!UUID.test(id))return{ok:false,error:"Invalid forge request id."};
 const previous=record(p.forgeHistory).find(x=>x.requestId===id);
 if(previous)return{ok:true,duplicate:true,result:previous};
 if(!p||typeof input?.uid!=="string")return{ok:false,error:"Select a valid owned item."};
 const gear=(p.inventory||[]).find(x=>x.uid===input.uid);
 if(!gear)return{ok:false,error:"Item is not owned by your character."};
 const source=resolveBase(gear);
 if(!source||!["weapon","armor","head","chest","pants","boots","main","offhand","neck","ring_left","ring_right"].includes(String(source.slot||"")))
  return{ok:false,error:"Only real equippable items can be enhanced."};
 const req=requirement(levelOf(gear));
 if(!req)return{ok:false,error:"Item is already at +10."};
 const available=normalizeMaterials(p.materials);
 const money=Number(p.gold)||0;
 if(available[req.stone]<req.count)return{ok:false,error:"Not enough "+STONES[req.stone].name+"."};
 if(money<req.gold)return{ok:false,error:"Not enough Gold."};
 const roll=Number(random());
 if(!Number.isFinite(roll)||roll<0||roll>=1)return{ok:false,error:"Invalid server random result."};
 const won=roll*100<req.rate;
 const snapshot={inventory:p.inventory.map(x=>({...x})),gold:p.gold,materials:{...available},
  atk:p.atk,def:p.def,maxHp:p.maxHp,maxMp:p.maxMp,hp:p.hp,mp:p.mp,
  weaponItem:p.weaponItem,armorItem:p.armorItem,history:p.forgeHistory};
 p.gold=money-req.gold;
 p.materials={...available,[req.stone]:available[req.stone]-req.count};
 if(won){
  const upgraded=upgradeStats(source,req.to);
  upgraded.uid=gear.uid;
  if(gear.equippedSlot)upgraded.equippedSlot=gear.equippedSlot;
  if(gear.equippedSlot)syncWorn(p,gear,upgraded);
  Object.assign(gear,upgraded);
  if(p.weaponItem?.uid===gear.uid)p.weaponItem=gear;
  if(p.armorItem?.uid===gear.uid)p.armorItem=gear;
 }
 const result={requestId:id,uid:gear.uid,itemName:gear.name,from:req.from,to:won?req.to:req.from,attempt:req.to,
  success:won,rate:req.rate,stone:req.stone,count:req.count,gold:req.gold,at:now()};
 p.forgeHistory=[...record(p.forgeHistory).slice(-49),result];
 return{ok:true,result,undo:()=>{
  p.inventory=snapshot.inventory;p.gold=snapshot.gold;p.materials=snapshot.materials;
  for(const k of ["atk","def","maxHp","maxMp","hp","mp"])p[k]=snapshot[k];
  p.forgeHistory=snapshot.history;
  p.weaponItem=snapshot.weaponItem?.uid?p.inventory.find(x=>x.uid===snapshot.weaponItem.uid)||snapshot.weaponItem:snapshot.weaponItem;
  p.armorItem=snapshot.armorItem?.uid?p.inventory.find(x=>x.uid===snapshot.armorItem.uid)||snapshot.armorItem:snapshot.armorItem;
 }};
}
function buyBasic(p,quantity){
 if(!Number.isSafeInteger(quantity)||quantity<1||quantity>10)return{ok:false,error:"Buy between 1 and 10 stones."};
 const materials=normalizeMaterials(p.materials),cost=quantity*STONES.basic.price;
 if(p.gold<cost)return{ok:false,error:"Not enough Gold."};
 if(materials.basic>MAX_MATERIAL-quantity)return{ok:false,error:"Stone storage is full."};
 p.gold-=cost;p.materials={...materials,basic:materials.basic+quantity};
 return{ok:true,quantity,cost};
}
function addStone(p,type,count){
 const m=normalizeMaterials(p.materials);
 if(!STONES[type]||!Number.isSafeInteger(count)||count<1||count>20)return false;
 if(m[type]>MAX_MATERIAL-count)return false;
 m[type]+=count;p.materials=m;return true;
}
function rollLoot(p,{type="normal",region=1,guardianId=null}={},random=Math.random){
 const granted=[];
 const tryAdd=(id,chance,count=1)=>{
  if(random()<chance&&addStone(p,id,count))granted.push({id,count,name:STONES[id].name});
 };
 if(guardianId==="gorthan"){addStone(p,"refined",1)&&granted.push({id:"refined",count:1,name:STONES.refined.name});tryAdd("basic",.8)}
 else if(guardianId==="selunara"){addStone(p,"refined",1)&&granted.push({id:"refined",count:1,name:STONES.refined.name});tryAdd("ancient",.10)}
 else if(type==="boss"){addStone(p,"basic",1)&&granted.push({id:"basic",count:1,name:STONES.basic.name});tryAdd("refined",region>=3?1:.4);if(region>=3)tryAdd("ancient",region<=4?.05:region<=6?.15:.30)}
 else if(type==="mini"){tryAdd("basic",.5);tryAdd("refined",.3)}
 else{tryAdd("basic",.15)}
 return granted;
}
const publicConfig=()=>({stones:STONES,success:SUCCESS,bonus:BONUS,gold:GOLD,count:COUNT});
module.exports={STONES,SUCCESS,GOLD,COUNT,BONUS,MAX_MATERIAL,normalizeMaterials,levelOf,requirement,upgradeStats,
 statDelta,syncWorn,record,attempt,buyBasic,addStone,rollLoot,publicConfig};

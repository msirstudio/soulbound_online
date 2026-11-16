"use strict";
/* SOULBOUND v0.67 GM Foundation
 * Never trust a client role/name/email, target stats, item payload, or user id.
 * Only SUPABASE Auth-verified owner UUID + active Secure Save claim can grant.
 * Grants are limited to online, verified players in the same party.
 */
const {randomUUID}=require("node:crypto");
const OWNER=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE_ID=/^[0-9a-f-]{36}$/i;
const SAFE_STATES=new Set(["city","shop","victory","regionClear"]);
const LOG_LIMIT=50;
const ALLOWED_KINDS=new Set(["gold","race_points","equipment"]);
function setup(ownerId,secureEnabled){
 const owner=String(ownerId||"").trim().toLowerCase();
 return{owner,enabled:!!secureEnabled&&OWNER.test(owner)};
}
async function authorize({config,claim,token,authenticate}){
 if(!config?.enabled||!claim||claim.userId!==config.owner)return false;
 try{return(await authenticate(token))===config.owner}catch{return false}
}
function goodTarget(room,targetId,claims){
 const target=room?.players?.get(targetId),claim=claims?.get(targetId);
 if(!target||!claim||target.guest||!target.verified||!claim.userId)return null;
 return{target,claim};
}
function eligible(room){return !!room&&SAFE_STATES.has(room.status)}
function inventoryFree(p){return(p.inventory||[]).filter(i=>!i.equippedSlot).length<40}
function resolveReward(input,target,shopItems){
 if(!input||typeof input!=="object"||!ALLOWED_KINDS.has(input.kind))return{ok:false,error:"Invalid GM reward type."};
 if(input.kind==="gold"||input.kind==="race_points"){
  if(!Number.isSafeInteger(input.amount)||input.amount<1||input.amount>(input.kind==="gold"?100000:20)){
   return{ok:false,error:input.kind==="gold"?"Gold grants must be 1–100,000.":"Race Point grants must be 1–20."};
  }
  const field=input.kind==="gold"?"gold":"racePoints";
  const limit=input.kind==="gold"?99999999:999999;
  if(!Number.isSafeInteger(target[field])||target[field]+input.amount>limit)return{ok:false,error:"Recipient has reached the maximum allowed amount."};
  return{ok:true,kind:input.kind,amount:input.amount,name:input.kind==="gold"?"Gold":"Race Points"};
 }
 if(input.kind==="equipment"){
  if(typeof input.itemId!=="string"||input.itemId.length>80)return{ok:false,error:"Invalid equipment ID."};
  const source=shopItems.find(it=>it.id===input.itemId&&["weapon","armor"].includes(it.slot));
  if(!source)return{ok:false,error:"Only registered weapons and chest armor can be spawned."};
  if(source.class&&source.class!==target.classId)return{ok:false,error:"Recipient is the wrong class for that weapon."};
  if(source.allowedClasses&&!source.allowedClasses.includes(target.classId))return{ok:false,error:"Recipient cannot equip that armor type."};
  if(!inventoryFree(target))return{ok:false,error:"Recipient inventory is full (40/40)."};
  return{ok:true,kind:"equipment",item:source,amount:1,name:source.name};
 }
 return{ok:false,error:"Invalid GM reward."};
}
function grant(target,input,shopItems,{now=()=>new Date().toISOString(),uid=randomUUID}={}){
 if(!target||!SAFE_ID.test(input?.requestId||""))return{ok:false,error:"Invalid or missing unique reward request."};
 if(Array.isArray(target.gmGrants)&&target.gmGrants.some(x=>x.requestId===input.requestId))return{ok:true,duplicate:true,name:"Already received"};
 const reward=resolveReward(input,target,shopItems);
 if(!reward.ok)return reward;
 const before={
  gold:target.gold,racePoints:target.racePoints,
  inventory:target.inventory,worldProgress:target.worldProgress,
  gmGrants:target.gmGrants
 };
 if(reward.kind==="gold")target.gold+=reward.amount;
 if(reward.kind==="race_points")target.racePoints+=reward.amount;
 if(reward.kind==="equipment"){
  target.inventory=[...(target.inventory||[]),{...reward.item,uid:uid()}];
  if(target.worldProgress&&typeof target.worldProgress==="object"){
   target.worldProgress={...target.worldProgress,lootSeen:[...new Set([...(target.worldProgress.lootSeen||[]),reward.item.id+":gm"])].slice(-300)};
  }
 }
 const receipt={requestId:input.requestId,kind:reward.kind,itemId:reward.item?.id||null,
  amount:reward.amount,name:reward.name,at:now()};
 target.gmGrants=[...(Array.isArray(target.gmGrants)?target.gmGrants:[]).slice(-(LOG_LIMIT-1)),receipt];
 return{ok:true,receipt,
  undo:()=>{target.gold=before.gold;target.racePoints=before.racePoints;target.inventory=before.inventory;
   target.worldProgress=before.worldProgress;target.gmGrants=before.gmGrants;}};
}
module.exports={setup,authorize,goodTarget,eligible,resolveReward,grant,LOG_LIMIT};

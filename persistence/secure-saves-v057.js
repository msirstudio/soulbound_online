"use strict";
/* SOULBOUND 0.57 · authenticated, server-owned character saves.
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the browser or logs.
 * Requires: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY),
 *           and the SQL migration SUPABASE-SECURE-SAVES-V057.sql.
 * Legacy mode is explicitly reported as insecure until these are configured.
 */
const {randomUUID}=require("node:crypto");
const url=String(process.env.SUPABASE_URL||"").replace(/\/+$/,"");
const publicKey=String(process.env.SUPABASE_PUBLISHABLE_KEY||"");
const secret=String(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||"");
const enabled=!!(url&&publicKey&&secret);
const USER_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const slotId=x=>Number.isInteger(Number(x))&&Number(x)>=1&&Number(x)<=3?Number(x):null;
function fail(message,code=400){const error=new Error(message);error.status=code;throw error}
async function request(path,{method="GET",body=null,auth=null,prefer=""}={}){
 if(!enabled)fail("Secure Save backend not configured",503);
 const headers={apikey:auth?publicKey:secret,Accept:"application/json"};
 if(auth)headers.Authorization="Bearer "+auth;
 // New sb_secret keys are application API keys, NOT JWTs. Use apikey only.
 // Legacy service_role JWT is kept as a backwards-compatible fallback.
 else if(!secret.startsWith("sb_secret_"))headers.Authorization="Bearer "+secret;
 if(body!==null)headers["Content-Type"]="application/json";
 if(prefer)headers.Prefer=prefer;
 let res;
 try{res=await fetch(url+path,{method,headers,body:body===null?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)})}
 catch{fail("Database temporarily unavailable",503)}
 if(!res.ok){if(res.status===401||res.status===403)fail("Authentication failed",401);if(res.status===409)fail("Save conflict; reload the slot",409);fail("Save backend rejected the request ("+res.status+")",503)}
 if(res.status===204)return null;
 const text=await res.text();if(!text)return null;
 try{return JSON.parse(text)}catch{fail("Invalid database response",503)}
}
async function authenticate(token){
 if(typeof token!=="string"||token.length<30||token.length>6000)fail("Login required",401);
 const user=await request("/auth/v1/user",{auth:token});
 if(!user?.id||!USER_ID.test(user.id))fail("Invalid authenticated account",401);
 return user.id;
}
const rows=async userId=>request("/rest/v1/hero_secure_saves?user_id=eq."+encodeURIComponent(userId)+"&select=slot,revision,data&order=slot.asc");
async function list(token){const id=await authenticate(token);return{userId:id,slots:await rows(id)}}
async function load(token,slot){slot=slotId(slot);if(!slot)fail("Invalid slot",400);const {userId,slots}=await list(token);const row=slots.find(x=>x.slot===slot);if(!row?.data?.class_id)fail("Slot is empty; create a hero first",404);return{userId,slot,revision:Number(row.revision),data:row.data}}
function starter(cls,name){
 const mage=cls==="mage",tank=cls==="tank";
 if(!["swordsman","mage","tank"].includes(cls))fail("Invalid class",400);
 const username=String(name||"Adventurer").trim().replace(/[<>]/g,"").slice(0,16)||"Adventurer";
 return{username,class_id:cls,class_path:null,level:1,xp:0,gold:80,
  hp:tank?180:mage?120:130,max_hp:tank?180:mage?120:130,
  mp:tank?55:mage?65:40,max_mp:tank?55:mage?65:40,
  attack:tank?16:mage?25:22,defense:tank?16:mage?8:10,
  potions:3,mana_potions:2,small_health:3,medium_health:0,large_health:0,
  small_mana:2,medium_mana:0,large_mana:0,
  weapon:tank?"Guardian Mace":mage?"Apprentice Staff":"Training Sword",
  armor:tank?"Guardian Armor":mage?"Novice Robe":"Traveler Armor",
  inventory:[],weapon_item:null,armor_item:null,
  food_items:{roast_meat:0,herb_stew:0,mana_tart:0},food_buffs:{atk:0,def:0,skill:0},
  race_id:"human",race_points:0,strength:0,vitality:0,intelligence:0,agility:0,stat_points:0,speed:10,
  world_progress:{version:44,bossDefeats:{},defeatedBossIds:[],lootSeen:[],raceSeen:[]},
  updated_at:new Date().toISOString()};
}
function where(userId,slot,revision=null){
 const params="?user_id=eq."+encodeURIComponent(userId)+"&slot=eq."+slot+(revision===null?"":"&revision=eq."+revision)+"&select=slot,revision,data";
 return "/rest/v1/hero_secure_saves"+params;
}
async function compareAndSwap(userId,slot,revision,data){
 if(!USER_ID.test(userId)||!slotId(slot)||!Number.isSafeInteger(revision)||revision<0)fail("Invalid save claim",400);
 const result=await request(where(userId,slot,revision),{method:"PATCH",body:{data,revision:revision+1,updated_at:new Date().toISOString()},prefer:"return=representation"});
 if(!Array.isArray(result)||result.length!==1)fail("Save changed in another session; reload before continuing",409);
 return Number(result[0].revision);
}
async function newGame(token,slot,cls,name,expectedRevision=null){
 slot=slotId(slot);if(!slot)fail("Invalid slot");
 const userId=await authenticate(token),data=starter(cls,name);
 const old=(await rows(userId)).find(x=>x.slot===slot);
 if(old){
  if(expectedRevision===null||Number(expectedRevision)!==Number(old.revision))fail("Slot was changed elsewhere; reload",409);
  const revision=await compareAndSwap(userId,slot,Number(old.revision),data);
  return{slot,data,revision};
 }
 if(expectedRevision!==null)fail("Slot was removed elsewhere; reload",409);
 const result=await request("/rest/v1/hero_secure_saves",{method:"POST",body:{user_id:userId,slot,revision:0,data,updated_at:new Date().toISOString()},prefer:"return=representation"});
 if(!Array.isArray(result)||result.length!==1)fail("Could not initialize hero slot",503);
 return{slot,data,revision:0};
}
async function remove(token,slot,expectedRevision){
 slot=slotId(slot);if(!slot)fail("Invalid slot");
 const userId=await authenticate(token);
 if(!Number.isSafeInteger(Number(expectedRevision))||Number(expectedRevision)<0)fail("Missing save revision",409);
 const result=await request(where(userId,slot,Number(expectedRevision)),{method:"DELETE",prefer:"return=representation"});
 if(!Array.isArray(result)||result.length!==1)fail("Slot was changed elsewhere; reload",409);
 return{deleted:true,slot};
}
const profileFromPlayer=p=>({
 username:p.name,class_id:p.classId,class_path:p.classPath||null,
 level:p.level,xp:p.xp,gold:p.gold,hp:p.hp,max_hp:p.maxHp,mp:p.mp,max_mp:p.maxMp,
 attack:p.atk,defense:p.def,potions:p.potions,mana_potions:p.manaPotions,
 small_health:p.smallHealth,medium_health:p.mediumHealth,large_health:p.largeHealth,
 small_mana:p.smallMana,medium_mana:p.mediumMana,large_mana:p.largeMana,
 weapon:p.weapon,armor:p.armor,weapon_item:p.weaponItem,armor_item:p.armorItem,
 inventory:p.inventory,food_items:p.foodItems,food_buffs:p.foodBuffs,
 race_id:p.raceId,race_points:p.racePoints,strength:p.strength,vitality:p.vitality,
 intelligence:p.intelligence,agility:p.agility,stat_points:p.statPoints,speed:p.speed,
 world_progress:p.worldProgress,updated_at:new Date().toISOString()
});
function createQueue(onError=()=>{}){
 const claims=new Map();
 const key=claim=>claim.userId+":"+claim.slot;
 const register=claim=>{const k=key(claim);if(claims.has(k))fail("This character slot is already active in another game session.",409);claims.set(k,{...claim,queue:Promise.resolve(),last:""});return claims.get(k)};
 const persist=(claim,player)=>{
  if(!claim||!player)return Promise.resolve();
  const active=claims.get(key(claim));if(!active||active!==claim)return Promise.resolve();
  const profile=profileFromPlayer(player),signature=JSON.stringify({...profile,updated_at:undefined});
  if(active.last===signature)return active.queue;
  active.last=signature;
  active.queue=active.queue.catch(()=>{}).then(async()=>{
   try{active.revision=await compareAndSwap(active.userId,active.slot,active.revision,profile)}
   catch(e){active.last="";onError(e,active)}
  });
  return active.queue;
 };
 const release=claim=>{if(claim&&claims.get(key(claim))===claim)claims.delete(key(claim))};
 return{register,persist,release,isActive:(userId,slot)=>claims.has(userId+":"+slot)};
}
module.exports={enabled,authenticate,list,load,starter,newGame,remove,compareAndSwap,profileFromPlayer,createQueue,slotId};

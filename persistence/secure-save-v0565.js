"use strict";
/* SOULBOUND v0.56.5 — secure, server-only Supabase persistence.
 * Never expose service credentials to the browser or the Socket payload.
 * A deployment MUST apply the SQL migration before enabling this service.
 */
const VALID_SLOT=slot=>Number.isInteger(slot)&&slot>=1&&slot<=3;
const SAFE_UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHARACTER_FIELDS=Object.freeze([
 "username","class_id","class_path","level","xp","gold","hp","max_hp","mp","max_mp",
 "attack","defense","potions","mana_potions","small_health","medium_health","large_health",
 "small_mana","medium_mana","large_mana","weapon","armor","inventory","weapon_item",
 "armor_item","food_items","food_buffs","race_id","race_points","strength","vitality",
 "intelligence","agility","stat_points","speed","world_progress","deleted"
]);
const sanitize=raw=>{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const clean={};
 for(const key of CHARACTER_FIELDS)if(Object.prototype.hasOwnProperty.call(raw,key))clean[key]=raw[key];
 return clean;
};
function createSecureStore({env=process.env,request=globalThis.fetch,logger=console}={}){
 const enabled=env.SOULBOUND_SECURE_SAVES_ENABLED==="1";
 const url=String(env.SUPABASE_URL||"").replace(/\/+$/,"");
 const key=String(env.SUPABASE_SERVICE_ROLE_KEY||"");
 const pub=String(env.SUPABASE_ANON_KEY||key);
 if(enabled&&(!/^https:\/\//.test(url)||!key||!pub||typeof request!=="function"))
  throw new Error("Secure Saves enabled but Supabase URL/credentials are missing (fail closed)");
 const requestJson=async (pathname,{method="GET",body,authToken,secret=true}={})=>{
  const headers={apikey:secret?key:pub,Authorization:"Bearer "+(authToken||(secret?key:""))};
  if(body!==undefined)headers["Content-Type"]="application/json";
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  let res;
  try{res=await request(url+pathname,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal})}
  finally{clearTimeout(timeout)}
  let data=null;
  try{data=await res.json()}catch{}
  if(!res.ok){
   const e=new Error((data?.message||data?.error_description||data?.error||("Supabase HTTP "+res.status)).slice(0,220));
   e.status=res.status;e.code=data?.code||"REMOTE_ERROR";throw e;
  }
  return data;
 };
 const auth=async token=>{
  if(!enabled)throw new Error("Secure Saves not enabled");
  if(typeof token!=="string"||token.length<16||token.length>8192)throw new Error("Invalid access token");
  const user=await requestJson("/auth/v1/user",{authToken:token,secret:false});
  if(!SAFE_UUID.test(String(user?.id||"")))throw new Error("Unverified account");
  return user.id;
 };
 const rawRows=async userId=>{
  const q="?user_id=eq."+encodeURIComponent(userId)+"&select=slot,character,revision&order=slot.asc";
  return await requestJson("/rest/v1/hero_state_v0565"+q)||[];
 };
 const rpc=async(name,data)=>requestJson("/rest/v1/rpc/"+name,{method:"POST",body:data});
 const commit=async(userId,slot,expected,character)=>{
  if(!SAFE_UUID.test(String(userId||""))||!VALID_SLOT(slot)||!Number.isSafeInteger(expected)||expected<0)throw new Error("Invalid slot/revision");
  const clean=sanitize(character);
  if(!clean)throw new Error("Invalid character payload");
  const row=await rpc("secure_hero_commit_v0565",{p_user_id:userId,p_slot:slot,p_expected_revision:expected,p_character:clean});
  const version=Array.isArray(row)?row[0]?.new_revision:row?.new_revision;
  if(!Number.isSafeInteger(Number(version))||Number(version)<=expected)throw new Error("Supabase did not confirm save revision");
  return Number(version);
 };
 const legacy=async(userId,slot)=>{
  if(slot===1){
   const res=await requestJson("/rest/v1/profiles?id=eq."+encodeURIComponent(userId)+"&select=*");
   return sanitize(res?.[0]||null);
  }
  const res=await requestJson("/rest/v1/hero_save_slots?user_id=eq."+encodeURIComponent(userId)+"&slot=eq."+slot+"&select=data");
  return sanitize(res?.[0]?.data||null);
 };
 const getAll=async userId=>{
  if(!SAFE_UUID.test(String(userId||"")))throw new Error("Invalid user id");
  let rows=await rawRows(userId);
  const has=new Set(rows.map(row=>Number(row.slot)));
  // One-time legacy migration for missing slots, preserving their last saved data.
  for(let slot=1;slot<=3;slot++){
   if(has.has(slot))continue;
   const previous=await legacy(userId,slot);
   if(!previous?.class_id)continue;
   try{await commit(userId,slot,0,previous)}
   catch(error){
    if(!/revision_conflict/i.test(error.message)&&error.status!==409)throw error;
   }
  }
  rows=await rawRows(userId);
  return [1,2,3].map(slot=>{
   const row=rows.find(r=>Number(r.slot)===slot);
   return {slot,revision:Number(row?.revision||0),character:row?.character?.deleted?null:sanitize(row?.character)};
  });
 };
 const newHero=(name,classId)=>{
  const cls=["swordsman","mage","tank"].includes(classId)?classId:"swordsman";
  const mage=cls==="mage",tank=cls==="tank";
  return{username:String(name||"Adventurer").trim().slice(0,24)||"Adventurer",class_id:cls,class_path:null,
   level:1,xp:0,gold:80,hp:tank?180:mage?120:130,max_hp:tank?180:mage?120:130,
   mp:tank?55:mage?65:40,max_mp:tank?55:mage?65:40,
   attack:tank?16:mage?25:22,defense:tank?16:mage?8:10,
   potions:3,mana_potions:2,small_health:3,medium_health:0,large_health:0,
   small_mana:2,medium_mana:0,large_mana:0,
   weapon:tank?"Guardian Mace":mage?"Apprentice Staff":"Training Sword",
   armor:tank?"Guardian Armor":mage?"Novice Robe":"Traveler Armor",
   inventory:[],weapon_item:null,armor_item:null,
   food_items:{roast_meat:0,herb_stew:0,mana_tart:0},food_buffs:{atk:0,def:0,skill:0},
   race_id:"human",race_points:0,strength:0,vitality:0,intelligence:0,agility:0,
   stat_points:0,speed:10,world_progress:{version:44,bossDefeats:{},defeatedBossIds:[]}};
 };
 const save=async(userId,slot,expected,character)=>{
  const revision=await commit(userId,slot,expected,character);
  return{slot,revision,character:sanitize(character)};
 };
 const erase=async(userId,slot,expected)=>save(userId,slot,expected,{deleted:true});
 return{enabled,auth,getAll,save,erase,newHero,sanitize,validSlot:VALID_SLOT};
}
module.exports={createSecureStore};

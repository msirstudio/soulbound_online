/* SOULBOUND v0.56.4 · Character save backup/export safety net.
 * No imports, database writes or slot restoration: user-controlled JSON only.
 * A backup is kept on this browser immediately before destructive save actions.
 */
(()=>{
 "use strict";
 const fields=[
  "username","class_id","class_path","level","xp","gold","hp","max_hp",
  "mp","max_mp","attack","defense","potions","mana_potions",
  "small_health","medium_health","large_health","small_mana",
  "medium_mana","large_mana","weapon","armor","inventory",
  "weapon_item","armor_item","food_items","food_buffs",
  "race_id","race_points","strength","vitality","intelligence",
  "agility","stat_points","speed","world_progress","updated_at"
 ];
 const cleanOwner=owner=>String(owner||"guest").replace(/[^a-zA-Z0-9_-]/g,"_").slice(0,100);
 const validSlot=slot=>Number.isInteger(slot)&&slot>=1&&slot<=3;
 function key(owner,slot){
  if(!validSlot(slot))throw new Error("Invalid save slot");
  return "soulbound_backup_v0564_"+cleanOwner(owner)+"_slot_"+slot;
 }
 function payload(slot,data,reason){
  if(!validSlot(slot)||!data||typeof data!=="object"||!data.class_id)return null;
  const character={};
  for(const field of fields){
   if(Object.prototype.hasOwnProperty.call(data,field))character[field]=data[field];
  }
  return{format:"SOULBOUND_CHAR_BACKUP",schemaVersion:1,slot,reason,
   savedAt:new Date().toISOString(),character};
 }
 function snapshot(owner,slot,data,reason="manual"){
  const record=payload(slot,data,reason);
  if(!record)return false;
  try{localStorage.setItem(key(owner,slot),JSON.stringify(record));return true}
  catch{return false}
 }
 function lastBackup(owner,slot){
  try{
   const obj=JSON.parse(localStorage.getItem(key(owner,slot))||"null");
   return obj?.format==="SOULBOUND_CHAR_BACKUP"&&obj.slot===slot&&obj.character?.class_id?obj:null;
  }catch{return null}
 }
 function download(record){
  if(!record||record.format!=="SOULBOUND_CHAR_BACKUP")return false;
  try{
   const blob=new Blob([JSON.stringify(record,null,2)],{type:"application/json"});
   const href=URL.createObjectURL(blob);
   const link=document.createElement("a");
   link.href=href;link.download="SOULBOUND_slot_"+record.slot+"_backup_"+record.savedAt.slice(0,10)+".json";
   document.body.appendChild(link);link.click();link.remove();
   URL.revokeObjectURL(href);
   return true;
  }catch{return false}
 }
 function exportCurrent(slot,data){
  const record=payload(slot,data,"manual-export");
  return download(record);
 }
 function exportBackup(owner,slot){return download(lastBackup(owner,slot))}
 window.SoulboundSaveGuardV564={snapshot,lastBackup,exportCurrent,exportBackup,key};
})();
"use strict";
/**
 * SOULBOUND 0.59 — in-memory room reconnection and action idempotency.
 *
 * Reconnect credentials are cryptographically random, sent only to their owner,
 * never placed in publicRoom(), chat, or logs. A dropped player is reserved
 * for 120 seconds and may resume the same player object / active combat turn.
 * No process restart resilience: use durable storage for multi-instance hosting.
 */
const {randomBytes,timingSafeEqual}=require("node:crypto");
const RECONNECT_MS=120000,MAX_RECEIPTS=512;
function ensure(room){
 if(!(room.reconnectSessions instanceof Map))room.reconnectSessions=new Map();
 if(!(room.actionReceipts instanceof Map))room.actionReceipts=new Map();
 return room;
}
function token(){
 return randomBytes(32).toString("hex");
}
function issue(room,id){
 ensure(room);
 const entry={ticket:token(),identity:randomBytes(16).toString("hex"),until:0,timer:null};
 room.reconnectSessions.set(id,entry);
 return entry.ticket;
}
function validTicket(input,stored){
 if(typeof input!=="string"||typeof stored!=="string"||!/^[0-9a-f]{64}$/.test(input)||!/^[0-9a-f]{64}$/.test(stored))return false;
 return timingSafeEqual(Buffer.from(input,"hex"),Buffer.from(stored,"hex"));
}
function find(rooms,code,ticket,now=Date.now()){
 if(typeof code!=="string"||!code)return null;
 const room=rooms.get(code.toUpperCase());if(!room)return null;
 ensure(room);
 for(const [id,entry] of room.reconnectSessions){
  const player=room.players.get(id);
  if(player?.disconnected&&entry.until>=now&&validTicket(ticket,entry.ticket))return{room,id,entry,player};
 }
 return null;
}
function markDisconnected(room,id,{schedule=setTimeout,onExpire=()=>{},now=Date.now()}={}){
 ensure(room);
 const player=room.players.get(id),entry=room.reconnectSessions.get(id);
 if(!player||!entry||player.disconnected)return false;
 player.disconnected=true;
 entry.until=now+RECONNECT_MS;
 entry.timer=schedule(()=>{
  if(room.reconnectSessions.get(id)!==entry||!player.disconnected)return;
  room.reconnectSessions.delete(id);onExpire(room,id,player);
 },RECONNECT_MS);
 return true;
}
function resume(match,newId,{cancel=clearTimeout,now=Date.now()}={}){
 const {room,id,entry,player}=match||{};
 if(!room||!player||!entry||room.players.get(id)!==player||!player.disconnected||entry.until<now)return null;
 if(room.players.has(newId))return null;
 if(entry.timer!==null)cancel(entry.timer);
 const nextTicket=token();
 const updated=new Map();
 for(const [key,item] of room.players)updated.set(key===id?newId:key,item);
 room.players=updated;
 room.reconnectSessions.delete(id);
 room.reconnectSessions.set(newId,{ticket:nextTicket,identity:entry.identity,until:0,timer:null});
 player.id=newId;player.disconnected=false;
 return{oldId:id,newId,ticket:nextTicket,player,room};
}
function receiptKey(playerId,actionId){
 return playerId+":"+actionId;
}
function lookup(room,playerId,actionId,fingerprint){
 if(!actionId)return null;
 ensure(room);
 const rec=room.actionReceipts.get(receiptKey(playerId,actionId));
 if(!rec)return null;
 return rec.fingerprint===fingerprint?{...rec.reply,duplicate:true}:{ok:false,error:"Action ID reused for a different command."};
}
function remember(room,playerId,actionId,fingerprint,reply){
 if(!actionId||!reply?.ok)return;
 ensure(room);
 room.actionReceipts.set(receiptKey(playerId,actionId),{fingerprint,reply:{...reply}});
 while(room.actionReceipts.size>MAX_RECEIPTS)room.actionReceipts.delete(room.actionReceipts.keys().next().value);
}
function isValidActionId(id){
 return id===undefined||id===null||(typeof id==="string"&&/^[A-Za-z0-9_-]{8,80}$/.test(id));
}
const hasMissing=room=>[...room.players.values()].some(p=>p.disconnected);
module.exports={RECONNECT_MS,MAX_RECEIPTS,issue,find,markDisconnected,resume,lookup,remember,isValidActionId,hasMissing};

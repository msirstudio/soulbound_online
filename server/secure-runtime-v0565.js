"use strict";
/* v0.56.5 — server-only authenticated save controllers.
 * Character stats must be restored from Supabase via authenticated server.
 * No access tokens, service keys or internal queues appear in public room state.
 */
function createSecureRuntime({store,io,audit,serializeHero,applyRestoredHero,findRoom,emit}){
 function persist(p,room){
  const state=p._secure;
  if(!store.enabled||!state||state.blocked)return;
  const json=JSON.stringify(serializeHero(p));
  if(json===state.lastQueued)return;
  state.lastQueued=json;
  state.queue=state.queue.then(async()=>{
   if(state.blocked||state.saved===json)return;
   try{
    const result=await store.save(state.userId,state.slot,state.revision,JSON.parse(json));
    state.revision=result.revision;state.saved=json;
    audit("hero_saved",{slot:state.slot,revision:result.revision,room:room.code});
   }catch(error){
    state.blocked=true;
    audit("hero_save_conflict",{slot:state.slot,room:room.code,error:error.code||"SAVE_FAILURE"});
    io.to(p.id).emit("saveError",{error:"Save conflict or network failure. Refresh this slot before playing further."});
   }
  }).catch(()=>{state.blocked=true});
 }
 function register(s){
  const reject=(cb,message)=>cb({ok:false,error:message});
  const identify=async token=>store.auth(token);
  s.on("secureListSlots",async({accessToken}={},cb=()=>{})=>{
   if(!store.enabled)return reject(cb,"Secure Saves not configured");
   try{
    const userId=await identify(accessToken);
    cb({ok:true,slots:await store.getAll(userId)});
   }catch(e){audit("list_failed",{error:e.code||"AUTH_OR_DB"});reject(cb,"Cannot load verified slots: "+e.message)}
  });
  s.on("secureNewGame",async({accessToken,slot,expectedRevision,classId,name}={},cb=()=>{})=>{
   if(!store.enabled||!store.validSlot(slot))return reject(cb,"Secure slot unavailable");
   try{
    const userId=await identify(accessToken);
    const row=(await store.getAll(userId))[slot-1];
    if(row.revision!==expectedRevision)return reject(cb,"Slot changed in another tab. Reload before New Game.");
    const fresh=store.newHero(name,classId);
    const saved=await store.save(userId,slot,row.revision,fresh);
    audit("hero_reset",{slot,revision:saved.revision});
    cb({ok:true,character:saved.character,revision:saved.revision});
   }catch(e){reject(cb,"New Game cancelled: "+e.message)}
  });
  s.on("secureDeleteSlot",async({accessToken,slot,expectedRevision}={},cb=()=>{})=>{
   if(!store.enabled||!store.validSlot(slot))return reject(cb,"Secure slot unavailable");
   const room=findRoom(s);
   if(room?.status==="battle")return reject(cb,"Cannot delete during a battle");
   try{
    const userId=await identify(accessToken);
    const row=(await store.getAll(userId))[slot-1];
    if(row.revision!==expectedRevision)return reject(cb,"Slot changed in another tab. Reload before deleting.");
    const saved=await store.erase(userId,slot,row.revision);
    const active=room?.players.get(s.id)?._secure;
    if(active&&active.userId===userId&&active.slot===slot)active.blocked=true;
    audit("hero_deleted",{slot,revision:saved.revision});
    cb({ok:true,revision:saved.revision});
   }catch(e){reject(cb,"Delete cancelled: "+e.message)}
  });
  s.on("secureRestoreCharacter",async({accessToken,slot,gender}={},cb=()=>{})=>{
   if(!store.enabled||!store.validSlot(slot))return reject(cb,"Secure slot unavailable");
   const r=findRoom(s);
   if(!r||r.status!=="city")return reject(cb,"Join a waiting party first");
   try{
    const userId=await identify(accessToken);
    const row=(await store.getAll(userId))[slot-1];
    if(!row?.character?.class_id)return reject(cb,"Save slot is empty. Create a hero first.");
    if([...r.players.values()].some(p=>p.id!==s.id&&p._guest))
     return reject(cb,"Guests cannot share progression with verified characters.");
    const p=r.players.get(s.id);
    applyRestoredHero(p,{...row.character,gender});
    const state={userId,slot,revision:row.revision,saved:JSON.stringify(serializeHero(p)),
      lastQueued:null,queue:Promise.resolve(),blocked:false};
    Object.defineProperty(p,"_secure",{value:state,writable:true,configurable:true,enumerable:false});
    audit("hero_verified",{slot,revision:row.revision,room:r.code});
    emit(r);cb({ok:true});
   }catch(e){audit("restore_failed",{error:e.code||"AUTH_OR_DB"});reject(cb,"Hero verification failed: "+e.message)}
  });
 }
 return{register,persist};
}
module.exports={createSecureRuntime};

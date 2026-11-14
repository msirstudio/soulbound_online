const socket=io(),$=id=>document.getElementById(id);
for(const id of ["v054PartyStatuses","v0551MonsterStatuses"]){
 $(id)?.addEventListener("click",event=>{
  if(event.target.closest("[data-v0551-status]"))window.SoulboundIndex?.open("statuses");
 });
}let v562TargetId=null;let gameState=null,myId=null,currentUser=null,supabaseClient=null,savedCharacter=null,restoreComplete=false,saveTimer=null,previousStatus=null,selectedGameMode=null,guestMode=false,activeShopCategory="weapon",v23ShopCollapsed=false,v23ShopWasActive=false,specDismissedFor="",specLastEligible="",specModalOpen=false;
// City storefronts all reuse the existing authoritative merchant and purchase logic.
let cityShopScope=null;
window.SoulboundCityShopV47={
 selectCategory(category){
  cityShopScope=category==="potion"?["potion","food"]:["weapon","armor","food"].includes(category)?[category]:["potion","food"];
  activeShopCategory=cityShopScope[0];
  if(gameState?.status==="shop")render();
 },
 show(){
  if(gameState?.status!=="shop")return;
  v23ShopCollapsed=false;const panel=document.getElementById("shopPanel");
  if(panel){panel.hidden=false;document.getElementById("v23ShopToggle")?.setAttribute("aria-expanded","true");panel.focus();}
  render();
 }
};
let v565SecureMode=false,v565Revisions=[0,0,0];
const v565SecurityReady=fetch("/health",{cache:"no-store"}).then(async response=>{
 if(!response.ok)throw new Error("Server health unavailable");
 const info=await response.json();v565SecureMode=info.secureSaves===true;
 return v565SecureMode;
});
async function v565Token(){
 if(!supabaseClient)throw new Error("Supabase connection is required");
 const {data:{session},error}=await supabaseClient.auth.getSession();
 if(error||!session?.access_token)throw new Error("Sign in again before editing your hero");
 return session.access_token;
}
const cfg=window.SOULBOUND_SUPABASE||{};if(cfg.url&&cfg.anonKey&&!cfg.anonKey.includes("PASTE_YOUR")&&window.supabase)supabaseClient=window.supabase.createClient(cfg.url,cfg.anonKey);
let v40SchemaAvailable=null;
function v40MergeWorld(cloud,local){
 const a=cloud&&typeof cloud==="object"?cloud:{},b=local&&typeof local==="object"?local:{};
 const bossDefeats={};const ids=new Set([...Object.keys(a.bossDefeats||{}),...Object.keys(b.bossDefeats||{})]);
 for(const id of ids)bossDefeats[id]=Math.max(0,Number(a.bossDefeats?.[id])||0,Number(b.bossDefeats?.[id])||0);
 const union=(x,y)=>[...new Set([...(Array.isArray(x)?x:[]),...(Array.isArray(y)?y:[])])].slice(-300);
 return{version:44,bossDefeats,defeatedBossIds:[...new Set([...(a.defeatedBossIds||[]),...(b.defeatedBossIds||[]),...Object.keys(bossDefeats).filter(id=>bossDefeats[id]>0)])],
  lootSeen:union(a.lootSeen,b.lootSeen),raceSeen:union(a.raceSeen,b.raceSeen)};
}
function v40WorldKeyFor(slot){return "soulbound_world_progress_v040_"+(guestMode?"guest":currentUser?.id||"unknown")+(slot===1?"":"_slot_"+slot)}
function v40WorldKey(){return v40WorldKeyFor(v561Slot)}
function v40SavedWorld(){try{return JSON.parse(localStorage.getItem(v40WorldKey())||"null")}catch(e){return null}}
function v40CacheWorld(p){if(!p)return;try{localStorage.setItem(v40WorldKey(),JSON.stringify(p))}catch(e){}}

/* v0.56.1 · Three independent character slots.
 * Legacy profile is unchanged in Slot 1. Slots 2/3 use hero_save_slots
 * when SQL migration is installed, and a browser-local backup otherwise. */
let v561Slot=1,v561Slots=[null,null,null],v561CloudSlots=false,v561SlotBusy=false;
function v561Key(slot){return "soulbound_hero_slot_v561_"+(guestMode?"guest":currentUser?.id||"unknown")+"_"+slot}
function v561ReadLocal(slot){try{return JSON.parse(localStorage.getItem(slot===1&&guestMode?"soulbound_guest_save_v1":v561Key(slot))||"null")}catch{return null}}
function v561WriteLocal(slot,data){try{localStorage.setItem(slot===1&&guestMode?"soulbound_guest_save_v1":v561Key(slot),JSON.stringify(data))}catch(e){authNotice("Browser storage is full. Export your hero before leaving.",true)}}
async function v561PersistExtra(slot,data){
 if(slot===1)return;
 v561WriteLocal(slot,data);
 if(guestMode||!currentUser||!supabaseClient)return;
 if(!v561CloudSlots){$("v561SlotNotice").textContent="Slot "+slot+": saved on this browser. Install the Save Slots SQL to enable cloud sync.";return}
 const {error}=await supabaseClient.from("hero_save_slots").upsert({user_id:currentUser.id,slot,data,updated_at:new Date().toISOString()},{onConflict:"user_id,slot"});
 if(error){v561CloudSlots=false;$("v561SlotNotice").textContent="Cloud slot unavailable; Slot "+slot+" is backed up in this browser. "+error.message}
}
async function v561Load(){
 v561Slots=[null,null,null];v561CloudSlots=false;
 if(v565SecureMode&&!guestMode){
  const accessToken=await v565Token();
  const response=await call("secureListSlots",{accessToken});
  if(!response.ok)throw new Error(response.error||"Cannot load secure slots");
  v565Revisions=response.slots.map(r=>r.revision);
  v561Slots=response.slots.map(r=>r.character||null);
  v561CloudSlots=true;v561Slot=1;v561Select(1);return;
 }
 if(guestMode)v561Slots[0]=v561ReadLocal(1);
 else v561Slots[0]=await loadProfile();
 for(let n=2;n<=3;n++)v561Slots[n-1]=v561ReadLocal(n);
 if(!guestMode&&supabaseClient&&currentUser){
  const {data,error}=await supabaseClient.from("hero_save_slots").select("slot,data").eq("user_id",currentUser.id);
  if(!error){v561CloudSlots=true;for(const row of data||[]){
   if(row.slot===2||row.slot===3){v561Slots[row.slot-1]=row.data||null;if(row.data)v561WriteLocal(row.slot,row.data)}
  }}
 }
 v561Slot=1;
 v561Select(1);
}
function v561Render(){
 const box=$("v561Slots");if(!box)return;
 box.innerHTML=v561Slots.map((data,i)=>{
  const n=i+1,exists=!!data?.class_id,cls=String(data?.class_id||"").toUpperCase();
  const label=exists?esc(data.username||"Adventurer")+" · "+cls+" · LV "+Number(data.level||1):"EMPTY SLOT";
  return '<div class="v561-slot'+(n===v561Slot?" selected":"")+'" data-v561-slot="'+n+'">'+
   '<button class="v561-select" type="button" data-v561-pick="'+n+'" aria-pressed="'+(n===v561Slot)+'"><b>SLOT '+n+'</b><span>'+label+'</span></button>'+
   '<button class="v561-delete" type="button" data-v561-delete="'+n+'" '+(!exists?"disabled":"")+' title="Delete only Slot '+n+'">✕</button></div>';
 }).join("");
 box.querySelectorAll("[data-v561-pick]").forEach(btn=>btn.onclick=()=>v561Select(Number(btn.dataset.v561Pick)));
 box.querySelectorAll("[data-v561-delete]").forEach(btn=>btn.onclick=()=>v561Delete(Number(btn.dataset.v561Delete)));
 $("continueGame").disabled=!v561Slots[v561Slot-1]?.class_id;
}
function v561Select(n){
 if(v561SlotBusy||n<1||n>3)return;
 v561Slot=n;savedCharacter=v561Slots[n-1]||{};
 if(savedCharacter.class_id&&!(v565SecureMode&&!guestMode))savedCharacter.world_progress=v40MergeWorld(savedCharacter.world_progress,v40SavedWorld());
 selectedGameMode=null;restoreComplete=false;
 $("continueGame").classList.remove("selected");$("newGame").classList.remove("selected");
 $("classId").disabled=false;$("create").disabled=true;$("join").disabled=true;
 const has=!!savedCharacter.class_id;
 if(has){$("name").value=savedCharacter.username||"Adventurer";$("classId").value=savedCharacter.class_id}
 else {$("name").value="Adventurer";$("classId").value="swordsman"}
 const g=localStorage.getItem(v30GenderKey())||"male",radio=document.querySelector('input[name="heroGender"][value="'+(g==="female"?"female":"male")+'"]');
 if(radio)radio.checked=true;
 classInfo();v30UpdatePreview();v561Render();
 $("saveMode").textContent=has?"Slot "+n+" loaded · Choose CONTINUE to keep progress, or NEW GAME to replace only this slot.":"Slot "+n+" empty · Choose NEW GAME to create a character here.";
 $("v561SlotNotice").textContent=n===1?"Slot 1 uses your existing save.":guestMode?"Slots are stored on this browser.":v561CloudSlots?"Slots 2–3 use encrypted-connection account storage.":"Slots 2–3 are local to this browser until the Save Slots SQL is installed.";
}
function v564Owner(){return guestMode?"guest":currentUser?.id||"unknown"}
function v564SnapshotData(slot,data){
 let localWorld=null;
 try{localWorld=JSON.parse(localStorage.getItem(v40WorldKeyFor(slot))||"null")}catch(e){}
 return {...data,world_progress:v40MergeWorld(data?.world_progress,localWorld)};
}
async function v561Delete(n){
 if(v561SlotBusy||n<1||n>3||!v561Slots[n-1]?.class_id)return;
 if(!confirm("Delete SLOT "+n+" permanently? Its character, gear, gold and boss progress will be lost. Other slots are not affected."))return;
 if(!window.SoulboundSaveGuardV564?.snapshot(v564Owner(),n,v564SnapshotData(n,v561Slots[n-1]),"before-delete"))return notice("Backup failed. Slot NOT deleted. Free browser storage, then try again.",true);
 v561SlotBusy=true;
 try{
  if(v565SecureMode&&!guestMode){
   const result=await call("secureDeleteSlot",{accessToken:await v565Token(),slot:n,expectedRevision:v565Revisions[n-1]});
   if(!result.ok)throw new Error(result.error||"Delete failed");
   v565Revisions[n-1]=result.revision;
  }else if(!guestMode&&supabaseClient&&currentUser){
   const table=n===1?"profiles":"hero_save_slots";
   let q=supabaseClient.from(table).delete().eq(n===1?"id":"user_id",currentUser.id);
   if(n!==1&&v561CloudSlots)q=q.eq("slot",n);
   if(n===1||v561CloudSlots){const {error}=await q;if(error)throw error}
  }
  if(n===1){localStorage.removeItem(v40WorldKeyFor(1));if(guestMode)localStorage.removeItem("soulbound_guest_save_v1")}
  else{localStorage.removeItem(v561Key(n));localStorage.removeItem(v40WorldKeyFor(n))}
  v561Slots[n-1]=null;
 }catch(e){notice("Cannot delete Slot "+n+": "+e.message,true)}
 finally{v561SlotBusy=false;v561Select(n)}
}
function authNotice(m,e=false){$("authNotice").textContent=m;$("authNotice").className=e?"notice error":"notice"}function notice(m,e=false){$("notice").textContent=m;$("notice").className=e?"notice error":"notice"}let v565ActionSequence=0;
function v565ActionId(){return Date.now().toString(36)+"-"+(++v565ActionSequence).toString(36)+"-"+Math.random().toString(36).slice(2,12)}
function call(ev,data={}){return new Promise(resolve=>socket.emit(ev,data,r=>resolve(r||{ok:false,error:"No response"})))}
function showAccount(u){currentUser=u;$("account").hidden=false;$("lobby").hidden=!u;$("accountInfo").hidden=!u;$("accountEmail").textContent=u?.email||"";$("signup").hidden=!!u;$("signin").hidden=!!u;$("guestPlay").hidden=!!u;$("email").disabled=!!u;$("password").disabled=!!u;if(u)authNotice("Signed in. Your hero data is linked to this account.");window.SoulboundUIV41?.onAuth(u)}
function profile(p){return{id:currentUser.id,username:p.name,class_id:p.classId,class_path:p.classPath||null,level:p.level,xp:p.xp,gold:p.gold,hp:p.hp,max_hp:p.maxHp,mp:p.mp,max_mp:p.maxMp,attack:p.atk,defense:p.def,potions:p.potions,mana_potions:p.manaPotions,small_health:p.smallHealth||p.potions||0,medium_health:p.mediumHealth||0,large_health:p.largeHealth||0,small_mana:p.smallMana||p.manaPotions||0,medium_mana:p.mediumMana||0,large_mana:p.largeMana||0,weapon:p.weapon,armor:p.armor,inventory:p.inventory||[],weapon_item:p.weaponItem||null,armor_item:p.armorItem||null,food_items:p.foodItems||{},food_buffs:p.foodBuffs||{},race_id:p.raceId||"human",race_points:p.racePoints||0,strength:p.strength||0,vitality:p.vitality||0,intelligence:p.intelligence||0,agility:p.agility||0,stat_points:p.statPoints||0,speed:p.speed||10,updated_at:new Date().toISOString()}}
async function loadProfile(){const {data,error}=await supabaseClient.from("profiles").select("*").eq("id",currentUser.id).maybeSingle();if(error)throw error;if(data)return data;const fresh={id:currentUser.id,username:(currentUser.email||"Adventurer").split("@")[0].slice(0,16)||"Adventurer"};const {data:created,error:e}=await supabaseClient.from("profiles").insert(fresh).select().single();if(e)throw e;return created}
async function saveProfile(p){if(!restoreComplete||!p)return;const data={username:p.name,class_id:p.classId,class_path:p.classPath||null,level:p.level,xp:p.xp,gold:p.gold,hp:p.hp,max_hp:p.maxHp,mp:p.mp,max_mp:p.maxMp,attack:p.atk,defense:p.def,potions:p.potions,mana_potions:p.manaPotions,small_health:p.smallHealth||p.potions||0,medium_health:p.mediumHealth||0,large_health:p.largeHealth||0,small_mana:p.smallMana||p.manaPotions||0,medium_mana:p.mediumMana||0,large_mana:p.largeMana||0,weapon:p.weapon,armor:p.armor,inventory:p.inventory||[],weapon_item:p.weaponItem||null,armor_item:p.armorItem||null,food_items:p.foodItems||{},food_buffs:p.foodBuffs||{},race_id:p.raceId||"human",race_points:p.racePoints||0,strength:p.strength||0,vitality:p.vitality||0,intelligence:p.intelligence||0,agility:p.agility||0,stat_points:p.statPoints||0,speed:p.speed||10};const worldProgress=p.worldProgress||v40SavedWorld()||{version:40,bossDefeats:{},defeatedBossIds:[]};v40CacheWorld(worldProgress);const full={...data,world_progress:worldProgress};v561Slots[v561Slot-1]=full;
 if(v565SecureMode&&!guestMode)return;
 if(v561Slot!==1){await v561PersistExtra(v561Slot,full);return}
 if(guestMode){v561WriteLocal(1,full);authNotice("Guest Slot 1 saved in this browser.");return}if(!supabaseClient||!currentUser)return;let {error}=await supabaseClient.from("profiles").upsert({...data,...(v40SchemaAvailable===false?{}:{world_progress:worldProgress}),id:currentUser.id,updated_at:new Date().toISOString()},{onConflict:"id"});
 if(error&&/world_progress|schema cache|column/i.test(error.message||"")){
  v40SchemaAvailable=false;({error}=await supabaseClient.from("profiles").upsert({...data,id:currentUser.id,updated_at:new Date().toISOString()},{onConflict:"id"}));
  if(!error){authNotice("Hero saved. World progress backed up in this browser; install v0.40 SQL for cloud sync.",true);return}
 }
 if(error)authNotice("Save failed: "+error.message,true);else if(v40SchemaAvailable===false)authNotice("Hero saved locally + cloud character. Run v0.40 SQL for cloud map progression.",true);else {v40SchemaAvailable=true;authNotice("Hero + world saved · "+new Date().toLocaleTimeString())}}
async function prepare(){
 try{
  await v565SecurityReady;
  await v561Load();
  window.SoulboundAudio?.setRegion("city",true);
  authNotice("Save Slots loaded. Select your hero, then Continue or New Game.");
  window.SoulboundUIV41?.onPrepared();
 }catch(e){authNotice("Could not load Save Slots: "+e.message,true)}
}
async function afterJoin(){
 restoreComplete=false;
 if(savedCharacter?.class_id){
  let result;
  if(v565SecureMode&&!guestMode){
   result=await call("secureRestoreCharacter",{
    accessToken:await v565Token(),slot:v561Slot,gender:v30SelectedGender()
   });
  }else{
   result=await call("restoreCharacter",{
    ...savedCharacter,world_progress:savedCharacter.world_progress||v40SavedWorld(),
    gender:v30SelectedGender(),guest:guestMode
   });
  }
  if(!result?.ok){notice(result?.error||"Character restore failed",true);return}
 }
 restoreComplete=true;
 const hero=gameState?.players.find(x=>x.id===myId);
 if(hero)saveProfile(hero);
}
function classInfo(){const mage=$("classId").value==="mage",tank=$("classId").value==="tank";$("classInfo").textContent=tank?"Highest HP and defense. Shield Bash, Iron Wall, and Provoke to taunt enemies for 3 turns.":mage?"Lower HP and defense, high MP and magic attack. Arcane Bolt, then Meteor at level 3.":"High HP and defense. Power Strike, then Whirlwind at level 3."}
if(!supabaseClient){$("signup").disabled=true;$("signin").disabled=true;authNotice("Supabase unavailable. You can still play as guest.",true)}
$("signup").onclick=async()=>{if(!window.SoulboundAudio.musicOn)syncMusicUI(window.SoulboundAudio.setMusic(true));const email=$("email").value.trim(),password=$("password").value;if(!email||password.length<6)return authNotice("Enter email and password (at least 6 characters).",true);const {data,error}=await supabaseClient.auth.signUp({email,password});if(error)return authNotice(error.message,true);if(data.session){showAccount(data.user);await prepare()}else authNotice("Account created. Check your email to confirm, then sign in.")};
$("signin").onclick=async()=>{if(!window.SoulboundAudio.musicOn)syncMusicUI(window.SoulboundAudio.setMusic(true));const {data,error}=await supabaseClient.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error)return authNotice(error.message,true);showAccount(data.user);await prepare()};
$("signout").onclick=async()=>{if(guestMode){guestMode=false;savedCharacter=null;restoreComplete=false;location.reload();return}await supabaseClient.auth.signOut();currentUser=null;savedCharacter=null;restoreComplete=false;$("game").hidden=true;$("lobby").hidden=true;showAccount(null);authNotice("Signed out.")};
$("v564ExportSlot").onclick=()=>{
 const data=v561Slots[v561Slot-1];
 if(!data?.class_id)return notice("This slot has no character to export.",true);
 if(window.SoulboundSaveGuardV564?.exportCurrent(v561Slot,v564SnapshotData(v561Slot,data)))notice("Downloaded a JSON backup of SLOT "+v561Slot+". Keep this file somewhere safe.");
 else notice("Export failed. Check browser download permissions.",true);
};
$("v564ExportBackup").onclick=()=>{
 if(window.SoulboundSaveGuardV564?.exportBackup(v564Owner(),v561Slot))notice("Downloaded the most recent pre-change backup of SLOT "+v561Slot+".");
 else notice("No local recovery backup exists yet for this slot.",true);
};
$("continueGame").onclick=()=>{if(!savedCharacter?.class_id)return notice("This slot is empty. Choose New Game first.",true);selectedGameMode="continue";if(savedCharacter?.class_id)$("classId").value=savedCharacter.class_id;$("classId").disabled=true;$("continueGame").classList.add("selected");$("newGame").classList.remove("selected");$("create").disabled=false;$("join").disabled=false;$("saveMode").textContent="CONTINUE selected · Your saved level, XP, gold, and equipment will be kept.";notice("Continue selected. Create a new party or join a friend.");};
$("newGame").onclick=async()=>{$("classId").disabled=false;if(!guestMode&&(!currentUser||!supabaseClient))return notice("Sign in first.",true);if(!confirm("Start a New Game in SLOT "+v561Slot+"? The current character in this slot will be replaced."))return;if(savedCharacter?.class_id&&!window.SoulboundSaveGuardV564?.snapshot(v564Owner(),v561Slot,v564SnapshotData(v561Slot,savedCharacter),"before-new-game"))return notice("Backup failed. New Game cancelled. Free browser storage before retrying.",true);const cls=$("classId").value,mage=cls==="mage",tank=cls==="tank";const fresh={id:currentUser?.id||null,username:$("name").value.trim()||savedCharacter?.username||"Adventurer",class_id:cls,class_path:null,level:1,xp:0,gold:80,hp:tank?180:mage?120:130,max_hp:tank?180:mage?120:130,mp:tank?55:mage?65:40,max_mp:tank?55:mage?65:40,attack:tank?16:mage?25:22,defense:tank?16:mage?8:10,potions:3,mana_potions:2,small_health:3,medium_health:0,large_health:0,small_mana:2,medium_mana:0,large_mana:0,weapon:tank?"Guardian Mace":mage?"Apprentice Staff":"Training Sword",armor:tank?"Guardian Armor":mage?"Novice Robe":"Traveler Armor",inventory:[],weapon_item:null,armor_item:null,food_items:{roast_meat:0,herb_stew:0,mana_tart:0},food_buffs:{atk:0,def:0,skill:0},race_id:"human",race_points:0,strength:0,vitality:0,intelligence:0,agility:0,stat_points:0,speed:10,updated_at:new Date().toISOString()};const freshWorld={version:40,bossDefeats:{},defeatedBossIds:[]};
let v565NewHero=null;
if(v565SecureMode&&!guestMode){
 const result=await call("secureNewGame",{
  accessToken:await v565Token(),slot:v561Slot,expectedRevision:v565Revisions[v561Slot-1],
  classId:cls,name:fresh.username
 });
 if(!result.ok)return notice(result.error||"Cannot start New Game",true);
 v565Revisions[v561Slot-1]=result.revision;
 v565NewHero=result.character;
}else if(v561Slot!==1){await v561PersistExtra(v561Slot,{...fresh,world_progress:freshWorld})}else if(guestMode){v561WriteLocal(1,{...fresh,world_progress:freshWorld})}else{let {error}=await supabaseClient.from("profiles").upsert({...fresh,world_progress:freshWorld},{onConflict:"id"});
 if(error&&/world_progress|schema cache|column/i.test(error.message||""))({error}=await supabaseClient.from("profiles").upsert(fresh,{onConflict:"id"}));
 if(error)return notice("Could not reset save: "+error.message,true)}v40CacheWorld(freshWorld);savedCharacter=v565NewHero||{...fresh,world_progress:freshWorld};v561Slots[v561Slot-1]=savedCharacter;v561Render();selectedGameMode="new";$("continueGame").classList.remove("selected");$("newGame").classList.add("selected");$("create").disabled=false;$("join").disabled=false;$("saveMode").textContent="NEW GAME selected · Level 1, fresh stats, starting gear and supplies.";notice("New Game save created. Your old hero progress has been reset.");};
/* Character appearance is stored locally, outside the existing Supabase schema;
   the server validates gender and broadcasts the actual selection for multiplayer. */
function v30GenderKey(){return "soulbound_hero_gender_v030_"+(guestMode?"guest":currentUser?.id||"guest")+(v561Slot===1?"":"_slot_"+v561Slot)}
function v30SelectedGender(){return document.querySelector('input[name="heroGender"]:checked')?.value==="female"?"female":"male"}
function v30SaveGender(){try{localStorage.setItem(v30GenderKey(),v30SelectedGender())}catch(e){}}
function v30UpdatePreview(){
 const cls=$("classId").value,gender=v30SelectedGender();
 $("v30HeroPreview").src=window.SoulboundHeroArt?.preview(cls,gender)||"";window.SoulboundSprite?.preview(cls,gender);
 $("v30PreviewLabel").textContent=cls.toUpperCase()+" · "+gender.toUpperCase();
 document.querySelectorAll("[data-hero-class]").forEach(b=>{const selected=b.dataset.heroClass===cls;b.classList.toggle("selected",selected);b.setAttribute("aria-pressed",String(selected))});
}
document.querySelectorAll("[data-hero-class]").forEach(b=>b.onclick=()=>{$("classId").value=b.dataset.heroClass;classInfo();v30UpdatePreview()});
document.querySelectorAll('input[name="heroGender"]').forEach(b=>b.onchange=()=>{v30UpdatePreview();v30SaveGender()});
$("classId").onchange=()=>{classInfo();v30UpdatePreview()};
v30UpdatePreview();$("guestPlay").onclick=async()=>{if(!window.SoulboundAudio.musicOn)syncMusicUI(window.SoulboundAudio.setMusic(true));guestMode=true;currentUser=null;showAccount({email:"Guest Player"});$("accountEmail").textContent="GUEST · LOCAL SAVE";$("signup").hidden=true;$("signin").hidden=true;$("email").hidden=true;$("password").hidden=true;$("guestPlay").hidden=true;await prepare();authNotice("Guest mode ready. Friends can join your room with its code.")};
$("create").onclick=async()=>{if(!selectedGameMode)return notice("Choose Continue or New Game first.",true);const r=await call("createRoom",{name:$("name").value,classId:$("classId").value,gender:v30SelectedGender()});if(r.ok){v30SaveGender();$("account").hidden=true;$("lobby").hidden=true;$("game").hidden=false;$("code").textContent=r.code;window.SoulboundUIV41?.enterGame();await afterJoin()}else notice(r.error,true)};
$("join").onclick=async()=>{if(!selectedGameMode)return notice("Choose Continue or New Game first.",true);const r=await call("joinRoom",{name:$("name").value,code:$("roomCode").value,classId:$("classId").value,gender:v30SelectedGender()});if(r.ok){v30SaveGender();$("account").hidden=true;$("lobby").hidden=true;$("game").hidden=false;$("code").textContent=r.code;window.SoulboundUIV41?.enterGame();await afterJoin()}else notice(r.error,true)};
function syncMusicUI(on){["musicToggle","musicQuick"].forEach(id=>{const b=$(id);if(!b)return;b.textContent="♫ MUSIC · "+(on?"ON":"OFF");b.classList.toggle("music-on",on);b.setAttribute("aria-pressed",String(on))})}function toggleMusic(){const on=window.SoulboundAudio.setMusic(!window.SoulboundAudio.musicOn);syncMusicUI(on)}$("musicToggle").onclick=toggleMusic;$("musicQuick").onclick=toggleMusic;$("musicVolume").oninput=e=>{window.SoulboundAudio.setVolume(Number(e.target.value)/100);if($("gameMusicVolume"))$("gameMusicVolume").value=e.target.value};
const sfxSlider=$("sfxVolume");
if(sfxSlider)sfxSlider.oninput=e=>{window.SoulboundAudio.setSfxVolume(Number(e.target.value)/100);if($("gameSfxVolume"))$("gameSfxVolume").value=e.target.value};
const sfxQuick=$("sfxQuick");
if(sfxQuick)sfxQuick.onclick=()=>{
 const audio=window.SoulboundAudio,muted=audio.sfxVolume>0.01;
 audio.setSfxVolume(muted?0:1);if(sfxSlider)sfxSlider.value=muted?0:100;if($("gameSfxVolume"))$("gameSfxVolume").value=muted?0:100;
 sfxQuick.textContent=muted?"🔇 SFX OFF":"🔊 SFX ON";sfxQuick.setAttribute("aria-pressed",String(!muted));
 if(!muted)audio.sfx("menu");
};
$("copy").onclick=async()=>{try{await navigator.clipboard.writeText("Join my SOULBOUND party! Room code: "+gameState.code);$("copy").textContent="COPIED!"}catch{$("copy").textContent=gameState.code}};
$("start").onclick=async()=>{const r=await call("startBattle");if(!r.ok)alert(r.error);else window.SoulboundAudio?.sfx("buy")};$("next").onclick=async()=>{const r=await call("nextStage");if(!r.ok)alert(r.error);else window.SoulboundAudio?.sfx("buy")};$("openShop").onclick=async()=>{const r=await call("openShop",{category:"potion"});if(!r.ok)alert(r.error);else window.SoulboundAudio?.sfx("buy")};$("continueShop").onclick=async()=>{const r=await call("closeShop");if(!r.ok)alert(r.error)};$("restart").onclick=async()=>{const r=await call("returnCity");if(!r.ok)alert(r.error)};$("leave").onclick=()=>location.reload();
const raceNames={human:"Human",beastkin:"Beastkin",elf:"High Elf",orc:"Orc",dwarf:"Stoneborn",sylvan:"Sylvan",demon:"Demon",dragonkin:"Dragonkin",celestial:"Celestial",voidborn:"Voidborn"};let gachaTimer=null,gachaTimeout=null,gachaOutcome=null,gachaRevealed=false;
function rarityClass(v){return String(v||"common").toLowerCase()}
function heroArt(p){if(window.SoulboundHeroArt?.render)return window.SoulboundHeroArt.render(p);const mage=p.classId==="mage",armor=String(p.armor||"").toLowerCase(),weapon=String(p.weapon||"").toLowerCase();let c="#315a86",trim="#d7dce5";if(armor.includes("dragon")){c="#9a3d34";trim="#e8a85d"}else if(armor.includes("void")){c="#34264e";trim="#a87cf0"}else if(armor.includes("guardian")){c="#78889b";trim="#d6e0ed"}else if(armor.includes("iron")){c="#657587";trim="#d0d7df"}else if(armor.includes("robe")||armor.includes("raiment")||armor.includes("sage")){c="#5b438e";trim="#c2a2ee"}let weaponArt=weapon.includes("staff")?'<path d="M105 55L112 183" stroke="#805b3d" stroke-width="8"/><path d="M101 54Q108 27 119 49Q126 66 107 70Z" fill="#82eaff" stroke="#e1fbff" stroke-width="4"/>':weapon.includes("great")?'<path d="M108 77L115 183" stroke="#805b3d" stroke-width="9"/><path d="M82 24L133 40L115 98L92 85Z" fill="#dbe7f2" stroke="#65748a" stroke-width="5"/>':'<path d="M106 72L113 183" stroke="#805b3d" stroke-width="8"/><path d="M91 24L109 17L122 91L107 100Z" fill="#dbe7f2" stroke="#65748a" stroke-width="4"/><path d="M89 78L126 72" stroke="#d6b56d" stroke-width="7"/>';let head=mage?'<path d="M35 54L68 2L101 54Z" fill="#46306f" stroke="#171a2a" stroke-width="6"/><ellipse cx="68" cy="59" rx="23" ry="26" fill="#c98f68" stroke="#171a2a" stroke-width="5"/>':'<path d="M42 48L40 23L57 9L84 9L99 31L94 58Z" fill="#7c8797" stroke="#171a2a" stroke-width="6"/><ellipse cx="70" cy="57" rx="24" ry="26" fill="#c98f68" stroke="#171a2a" stroke-width="5"/>';let body=mage?'<path d="M47 80L88 80L105 165L32 165Z" fill="'+c+'" stroke="#171a2a" stroke-width="6"/><path d="M62 82L79 82L92 153L53 153Z" fill="'+trim+'"/><path d="M49 87L23 145L39 154L64 102M86 87L108 139L91 150L75 103" fill="'+c+'" stroke="#171a2a" stroke-width="7"/>':'<path d="M42 80L91 80L99 148L34 148Z" fill="'+c+'" stroke="#171a2a" stroke-width="6"/><path d="M62 82L78 82L83 143L55 143Z" fill="'+trim+'"/><path d="M43 87L21 135L38 145L58 105M90 87L108 132L91 142L76 103" fill="'+c+'" stroke="#171a2a" stroke-width="7"/>';let svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 210"><ellipse cx="70" cy="201" rx="48" ry="8" fill="#080b16" opacity=".75"/><path d="M45 146L71 146L65 191L41 191ZM73 146L94 146L99 191L74 191Z" fill="#34384c" stroke="#171a2a" stroke-width="6"/><path d="M34 185L68 185L66 201L27 201ZM75 185L105 185L111 201L73 201Z" fill="#5b4030" stroke="#171a2a" stroke-width="5"/>'+body+head+'<path d="M54 52L63 52M78 52L87 52" stroke="#fff0c5" stroke-width="5"/>'+weaponArt+'<path d="M57 110L81 110L69 130Z" fill="#e7c36f" stroke="#493c36" stroke-width="3"/></svg>';return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg)}

function v25SetGachaPhase(phase,rarity=""){
 const modal=$("gachaModal"),stage=$("v25SummonStage");
 if(modal){modal.dataset.phase=phase;modal.dataset.rarity=rarityClass(rarity||"common")}
 if(stage){stage.dataset.phase=phase;stage.dataset.rarity=rarityClass(rarity||"common")}
}
function openGacha(){
 const me=gameState?.players.find(p=>p.id===myId);
 if(!me||me.racePoints<1)return notice("You need 1 Race Point. Defeat a boss to earn one.",true);
 clearInterval(gachaTimer);clearTimeout(gachaTimeout);
 gachaOutcome=null;gachaRevealed=false;v25SetGachaPhase("charging");
 $("gachaModal").hidden=false;
 $("gachaTitle").textContent="AWAKEN YOUR BLOODLINE";
 $("gachaSubtitle").textContent="Calling the ancient bloodlines...";
 $("gachaResult").hidden=true;
 $("skipGacha").hidden=false;$("skipGacha").disabled=true;
 $("skipGacha").textContent="CHANNELING...";
 $("closeGacha").hidden=true;
 $("summonReel").innerHTML='<div class="summon-card"><span>✦</span><b>SUMMONING</b><small>ANCIENT BLOODLINE</small></div>';
 call("rollRace").then(r=>{
  if(!r.ok){$("gachaModal").hidden=true;v25SetGachaPhase("idle");return notice(r.error,true)}
  gachaOutcome=r;
  $("skipGacha").disabled=false;$("skipGacha").textContent="SKIP ANIMATION";
  startGachaAnimation()
 }).catch(()=>{v25SetGachaPhase("idle");$("gachaModal").hidden=true;notice("Summon failed. Check your connection and Race Points.",true)});
}
function revealGacha(){
 if(gachaRevealed||!gachaOutcome)return;
 gachaRevealed=true;clearInterval(gachaTimer);clearTimeout(gachaTimeout);
 const r=gachaOutcome.race;
 v25SetGachaPhase("revealed",r.rarity);
 $("summonReel").innerHTML='<div class="summon-card"><span>'+esc(r.icon)+'</span><b>'+esc(r.name.toUpperCase())+'</b><small>'+esc(r.rarity.toUpperCase())+'</small></div>';
 $("gachaTitle").textContent="BLOODLINE AWAKENED";
 $("gachaSubtitle").textContent="The ancestral seal has chosen you.";
 const badge=$("resultRarity");badge.textContent=r.rarity.toUpperCase();badge.className="rarity "+rarityClass(r.rarity);
 $("resultRace").textContent=r.name.toUpperCase();
 $("resultPassive").textContent=r.passive;
 $("resultBuffs").textContent=r.buffs.join(" · ");
 $("gachaResult").hidden=false;
 $("skipGacha").hidden=true;$("closeGacha").hidden=false;
 window.SoulboundAudio?.sfx("victory");
}
function startGachaAnimation(){
 const cards=["HUMAN","BEASTKIN","HIGH ELF","ORC","STONEBORN","SYLVAN","DEMON","DRAGONKIN","CELESTIAL","VOIDBORN"];
 let n=0;v25SetGachaPhase("spinning");
 $("gachaSubtitle").textContent="The runes are deciding your fate...";
 gachaTimer=setInterval(()=>{
  const name=cards[n++%cards.length];
  $("summonReel").innerHTML='<div class="summon-card"><span>✧</span><b>'+name+'</b><small>??? RARITY</small></div>';
  if(n%4===0)window.SoulboundAudio?.sfx("buy");
 },115);
 gachaTimeout=setTimeout(()=>{v25SetGachaPhase("converging");gachaTimeout=setTimeout(revealGacha,550)},2700);
}
$("openGacha").onclick=openGacha;$("skipGacha").onclick=revealGacha;$("closeGacha").onclick=()=>{$("gachaModal").hidden=true;v25SetGachaPhase("idle");gachaOutcome=null;gachaRevealed=false};
document.querySelectorAll("[data-action]").forEach(b=>b.onclick=async()=>{const r=await call("action",{type:b.dataset.action,targetId:v562TargetId,requestId:v565ActionId()});if(!r.ok)alert(r.error);else{const a=b.dataset.action;const hero=gameState?.players?.find(p=>p.id===myId);const sound=({attack:"attack",skill:"skill",skill2:"skill",skill3:"skill",skill4:"skill",skill5:"skill",skill6:"skill",skill7:"skill",heal:"heal",healSmall:"heal",healMedium:"heal",healLarge:"heal",mana:"mana",manaSmall:"mana",manaMedium:"mana",manaLarge:"mana",guard:"guard",break:"attack",cleanse:"skill"})[a]||"attack";window.SoulboundAudio?.sfx(sound,{weapon:hero?.weapon||"",classId:hero?.classId||""});if(["attack","skill","skill2","skill3","skill4","skill5","skill6","skill7"].includes(a)){if(window.SoulboundSprite?.canDraw(hero)){window.SoulboundSprite.attack(myId)}else requestAnimationFrame(()=>{const figure=Array.from(document.querySelectorAll("#partySprites .hero-figure")).find(el=>el.querySelector(".v17-nameplate")?.textContent.includes(" · YOU"))?.querySelector(".sprite-img");if(figure){figure.classList.remove("v30-attacking");void figure.offsetWidth;figure.classList.add("v30-attacking");setTimeout(()=>figure.classList.remove("v30-attacking"),500)}})}}});
document.querySelectorAll("[data-stat]").forEach(b=>b.onclick=async()=>{const r=await call("allocateStat",{stat:b.dataset.stat});if(!r.ok)notice(r.error,true)});
$("shopCategories")?.querySelectorAll("[data-shop-category]").forEach(b=>b.onclick=()=>{if(cityShopScope&&!cityShopScope.includes(b.dataset.shopCategory))return;activeShopCategory=b.dataset.shopCategory;if(gameState)render()});$("chatSend").onclick=sendChat;$("chatInput").addEventListener("keydown",e=>{if(e.key==="Enter")sendChat()});function sendChat(){const input=$("chatInput"),message=input.value.trim();if(!message)return;call("partyChat",{message}).then(r=>{if(!r.ok)notice(r.error,true);else input.value=""})};
socket.on("connect",()=>{myId=socket.id});socket.on("disconnect",()=>{$("status").textContent="Connection lost. Refresh to reconnect."});

// v0.56.0 presentation-only combat beat choreography.
// The server remains authoritative and sends one complete state update.
// Show its events in sequence so the player can see the enemy counterattack.
const v0560Timers=new Set();
let v0560BattleKey="";
let v0560BeatEnd=0;
const v0560After=(ms,fn)=>{
 const timer=setTimeout(()=>{v0560Timers.delete(timer);fn()},ms);
 v0560Timers.add(timer);return timer;
};
function v0560Clear(){
 for(const timer of v0560Timers)clearTimeout(timer);
 v0560Timers.clear();document.getElementById("monsterSprite")?.classList.remove("v0560-enemy-attacking");
 v0560BeatEnd=0;
}
function v0560AddedLog(previous,current){
 const a=Array.isArray(previous)?previous:[],b=Array.isArray(current)?current:[];
 for(let n=Math.min(a.length,b.length);n>0;n--){
  if(a.slice(-n).every((line,i)=>line===b[i]))return b.slice(n);
 }
 return b.slice(Math.max(0,b.length-8));
}
function v0560OnState(last,s){
 const key=(s.status==="battle"||s.status==="defeat")&&s.monster?(s.code+"|"+s.stage):"";
 if(!key||key!==v0560BattleKey){
  v0560Clear();v0560BattleKey=key;
  if(!key||!last||last.status!=="battle"||last.stage!==s.stage)return;
 }
 if(!last||last.status!=="battle"||!Array.isArray(last.players)||!Array.isArray(s.players))return;
 const newLog=v0560AddedLog(last.log,s.log),name=String(s.monster?.name||"");
 const lost=s.players.filter(p=>{
  const old=last.players.find(x=>x.id===p.id);
  return old&&Number(p.hp)<Number(old.hp);
 });
 const enemyUsedMove=newLog.some(line=>(s.enemies||[s.monster]).some(e=>String(line).startsWith(String(e.name)+" uses ")&&String(line).includes(" damage")));
 const enemyAttacked=lost.length>0||enemyUsedMove;
 if(!enemyAttacked)return;
 // Delay the enemy lunge until the player's attack pose has been readable.
 // If a second network state arrives, the next beat starts after the active one.
 const now=performance.now(),start=Math.max(now+100,v0560BeatEnd);
 v0560BeatEnd=start+1000;
 v0560After(Math.max(0,start-now),()=>{
  if(v0560BattleKey!==key)return;
  const activePack=Array.from(document.querySelectorAll("#v563EnemyField .v563-foe"));
  const attackerLog=[...newLog].reverse().find(line=>String(line).includes(" uses ")&&String(line).includes(" damage"));
  const attackerName=attackerLog?String(attackerLog).split(" uses ")[0]:"";
  const el=activePack.length?(activePack.find(x=>x.querySelector(".v563-foe-name")?.textContent===attackerName)||activePack[0]):document.getElementById("monsterSprite");
  if(!el)return;
  el.classList.remove("v0560-enemy-attacking");void el.offsetWidth;
  el.classList.add("v0560-enemy-attacking");
  v0560After(660,()=>el.classList.remove("v0560-enemy-attacking"));
 });
 for(const p of lost){
  v0560After(Math.max(0,start-now)+420,()=>{
   if(v0560BattleKey!==key)return;
   window.SoulboundSprite?.hit?.(p.id);
   const figure=Array.from(document.querySelectorAll("#partySprites .hero-figure")).find(x=>x.querySelector(".v311-hero")?.dataset.v311Player===String(p.id));
   if(!figure)return;
   figure.classList.remove("v0560-hero-hurt");void figure.offsetWidth;
   figure.classList.add("v0560-hero-hurt");
   v0560After(780,()=>figure.classList.remove("v0560-hero-hurt"));
  });
 }
}
socket.on("saveError",d=>{restoreComplete=false;notice(d?.error||"Save conflict. Reload your character.",true)});
socket.on("state",s=>{const last=gameState;gameState=s;render();v0560OnState(last,s);window.SoulboundRewardV411?.show(last,s,myId);if(restoreComplete){
 const p=s.players.find(x=>x.id===myId);if(p){clearTimeout(saveTimer);
 const justCleared=s.status==="regionClear"&&last?.status!=="regionClear";
 if(justCleared)saveProfile(p);else saveTimer=setTimeout(()=>saveProfile(p),500)
 }}});
async function restoreSession(){if(!supabaseClient)return;const {data:{session}}=await supabaseClient.auth.getSession();if(session?.user){showAccount(session.user);await prepare()}else showAccount(null);supabaseClient.auth.onAuthStateChange((ev,session)=>{if(ev==="SIGNED_OUT"){currentUser=null;savedCharacter=null;showAccount(null)}})}restoreSession();
function render(){const s=gameState;if(!s)return;
 // Server chooses the shared shop for the whole party; individual purchases remain personal.
 if(s.status==="shop"){
  cityShopScope=s.shopOrigin==="camp"?["potion","food"]:s.shopCategory==="potion"?["potion","food"]:["weapon","armor"].includes(s.shopCategory)?[s.shopCategory]:["potion","food"];
  if(!cityShopScope.includes(activeShopCategory))activeShopCategory=cityShopScope[0];
 }else if(s.status==="city")cityShopScope=null;
const v040Me=s.players.find(p=>p.id===myId);
window.SoulboundIndex?.updateHero(v040Me);
window.SoulboundUIV41?.updateGame(s,v040Me);
window.SoulboundWorldV40?.render(s,v040Me,s.players[0]?.id===myId,{
 travel:async regionIndex=>call("travelRegion",{regionIndex}),
 returnCity:async()=>{const r=await call("returnCity");if(!r.ok)alert(r.error);return r},
 openShop:async(category)=>{const r=await call("openShop",{category:category||"potion"});if(!r.ok)alert(r.error);return r}
});
window.SoulboundAudio?.setScene(s.scene?.css||"wilds");window.SoulboundAudio?.setRegion(s.region?.id||"cursed_wilds",s.status==="city");
window.SoulboundAudio?.setCombatMood(s.status==="battle");

if(s.status==="shop"&&!v23ShopWasActive)v23ShopCollapsed=false;
v23ShopWasActive=s.status==="shop";if(previousStatus!==s.status){if(s.status==="victory"||s.status==="complete")window.SoulboundAudio?.sfx("victory");else if(s.status==="defeat")window.SoulboundAudio?.sfx("defeat");else if(s.status==="battle"&&s.monster?.boss)window.SoulboundAudio?.sfx("boss");previousStatus=s.status;}const me=s.players.find(p=>p.id===myId),active=s.players[s.turnIndex];$("code").textContent=s.code;$("stageBadge").textContent=s.status==="city"?"✦ CENTRAL CITY ✦":"STAGE "+s.stage+" / "+(s.totalStages||40);
$("campaignTrack").innerHTML=Array.from({length:5},(_,i)=>{const n=Math.floor((s.stage-1)/5)*5+i+1;return '<span class="'+(n<s.stage?"done ":n===s.stage?"current ":"")+(n%5===0?"boss-node ":"")+(n%5===4?"shop-node":"")+'">'+n+"</span>"}).join("");
$("arena").className="arena panel "+(s.scene?.css||"wilds");$("arena").dataset.v040Region=s.region?.id||s.scene?.regionId||"";$("sceneName").textContent="✦ "+(s.scene?.name||"THE CURSED WILDS")+" ✦";$("sceneHint").textContent=s.scene?.hint||"";if(!window.SoulboundBossSpritesV39||!s.monster?.boss){$("monsterSprite").src=s.monster?.boss?"assets/bosses/"+(s.monster.sprite||"boss-eclipse-sovereign")+".svg":"assets/monsters/"+(s.monster?.sprite||"mossfang-wolf")+".svg";}$("monsterSprite").alt=s.monster?.name||"Monster";window.SoulboundBossSpritesV39?.render(s.monster,s.stage);$("monsterName").textContent=(s.monster?.name||"WAITING").toUpperCase();$("bossTag").hidden=!(s.monster?.boss||s.monster?.miniBoss);
$("bossTag").textContent=s.monster?.miniBoss?"MINI BOSS":"MAIN BOSS"+(s.monster?.phase===2?" · PHASE 2":"");
$("bossTag").classList.toggle("v0484-mini",!!s.monster?.miniBoss);
$("bossTag").classList.toggle("v0484-boss",!!s.monster?.boss);const mh=s.monster?.hp||0,mm=s.monster?.maxHp||1;$("monsterHp").style.width=(mh/mm*100)+"%";$("monsterHpText").textContent=mh+" / "+mm+" HP";
const v562Alive=(s.enemies||[]).filter(e=>e.hp>0);
if(!v562Alive.some(e=>e.enemyId===v562TargetId))v562TargetId=s.monster?.enemyId||v562Alive[0]?.enemyId||null;
const v562Holder=$("v562EnemyChoices");
v562Holder.hidden=true; // Large clickable enemy sprites replace thumbnail selectors.
v562Holder.innerHTML=v562Holder.hidden?"":v562Alive.map(e=>{
 const isTarget=e.enemyId===v562TargetId,ratio=Math.max(0,Math.min(100,100*e.hp/Math.max(1,e.maxHp)));
 return '<button type="button" class="v562-target'+(isTarget?' selected':'')+'" data-v562-id="'+esc(e.enemyId)+'" aria-pressed="'+isTarget+'" title="Attack '+esc(e.name)+'">'+
 '<img src="assets/monsters/'+esc(e.sprite||"mossfang-wolf")+'.svg" alt="" loading="lazy">'+
 '<span><b>'+esc(e.name)+'</b><small>'+e.hp+' / '+e.maxHp+' HP</small><i class="v562-health"><i style="width:'+ratio+'%"></i></i></span></button>';
}).join("");
v562Holder.querySelectorAll("[data-v562-id]").forEach(b=>b.onclick=()=>{
 v562TargetId=b.dataset.v562Id;
 v562Holder.querySelectorAll(".v562-target").forEach(x=>{
  const selected=x.dataset.v562Id===v562TargetId;
  x.classList.toggle("selected",selected);x.setAttribute("aria-pressed",String(selected));
 });
});
const v563Field=$("v563EnemyField"),v563Multiple=v562Alive.length>1&&s.status==="battle";
$("v563MonsterSide").classList.toggle("v563-multi",v563Multiple);
v563Field.hidden=!v563Multiple;
v563Field.innerHTML=v563Multiple?v562Alive.map((e,i)=>{
 const selected=e.enemyId===v562TargetId,ratio=Math.max(0,Math.min(100,100*e.hp/Math.max(1,e.maxHp)));
 return '<button class="v563-foe'+(selected?' selected':'')+'" type="button" data-v563-target="'+esc(e.enemyId)+'" aria-pressed="'+selected+'" aria-label="Attack '+esc(e.name)+'" title="Target '+esc(e.name)+'">'+
 '<span class="v563-foe-name">'+esc(e.name)+'</span>'+
 '<img class="v563-foe-sprite" src="assets/monsters/'+esc(e.sprite||"mossfang-wolf")+'.svg" alt="'+esc(e.name)+'" draggable="false">'+
 '<span class="v563-foe-hp"><span class="v563-foe-meter"><i style="width:'+ratio+'%"></i></span>'+e.hp+' / '+e.maxHp+'</span></button>';
}).join(""):"";
v563Field.querySelectorAll("[data-v563-target]").forEach(btn=>btn.onclick=()=>{
 v562TargetId=btn.dataset.v563Target;
 v563Field.querySelectorAll("[data-v563-target]").forEach(other=>{
  const selected=other.dataset.v563Target===v562TargetId;
  other.classList.toggle("selected",selected);other.setAttribute("aria-pressed",String(selected));
 });
});
const rawCombatIntent=s.status==="battle"&&(s.monster?.boss||s.monster?.miniBoss)&&s.monster?.intent;
const combatIntent=rawCombatIntent&&String(rawCombatIntent.name||"").trim().toLowerCase()!=="strike"?rawCombatIntent:null;
const activeStagger=s.status==="battle"&&!!(s.monster?.boss||s.monster?.miniBoss);
$("v055Stagger").hidden=!activeStagger;
if(activeStagger){
 const threshold=Math.max(1,s.monster?.staggerThreshold||100),current=Math.max(0,s.monster?.stagger||0);
 $("v055StaggerFill").style.width=Math.min(100,current/threshold*100)+"%";
 $("v055StaggerText").textContent=current+" / "+threshold+(s.monster?.interruptImmunityTurns>0?" · IMMUNE":"");
}
$("v054CombatIntent").hidden=!combatIntent;
$("v054CombatIntent").textContent=combatIntent?((combatIntent.charge||s.monster?.queuedMove?"⚠ CHARGING · ":"⚔ NEXT · ")+combatIntent.name.toUpperCase()+(combatIntent.scope==="all"?" · ALL HEROES":"")+(s.monster?.statusEffects?.length?" · DEBUFFED":"")):"";
// Only small status icons stay on the battlefield. Click any to read the live Codex.
const statusIcons={burn:"🔥",poison:"☠️",bleed:"🩸",weaken:"⬇️",freeze:"🧊",stun:"💫",chill:"❄️"};
const iconFor=(owner,e)=>{
 const id=String(e.id||"").toLowerCase(),turns=Math.max(0,Number(e.turns)||0);
 const label=owner+" · "+id.toUpperCase()+" · "+turns+" turn"+(turns===1?"":"s")+" · Click to see INDEX → STATUS";
 return '<button type="button" class="v0551-status-icon" data-v0551-status="'+esc(id)+'" title="'+esc(label)+'" aria-label="'+esc(label)+'">'+(statusIcons[id]||"⚠️")+'<small>'+turns+'</small></button>';
};
const teamConditions=s.players.flatMap(p=>(p.statusEffects||[]).map(effect=>iconFor(p.name,effect)));
$("v054PartyStatuses").hidden=!teamConditions.length&&!(s.partyWardTurns>0);
$("v054PartyStatuses").innerHTML=(s.partyWardTurns>0?'<span class="v0551-ward-icon" title="Party Guard active · '+Math.max(0,s.partyWardTurns)+' turns · See INDEX → COMBAT RULES" aria-label="Party Guard">🛡️<small>'+Math.max(0,s.partyWardTurns)+'</small></span>':"")+teamConditions.join("");
const monsterConditions=(s.monster?.statusEffects||[]).map(effect=>iconFor(s.monster.name||"Enemy",effect));
$("v0551MonsterStatuses").hidden=!monsterConditions.length;
$("v0551MonsterStatuses").innerHTML=monsterConditions.join("");
$("partySprites").innerHTML=s.players.map(p=>'<div class="hero-figure"><div class="v17-nameplate">'+esc(p.name)+(p.id===myId?" · YOU":"")+'</div>'+(window.SoulboundSprite?.canDraw(p)?window.SoulboundSprite.spriteMarkup(p):'<img class="sprite-img" title="'+esc(p.name)+'" alt="'+(p.classId==="mage"?"Mage":p.classId==="tank"?"Tank":"Swordsman")+'" src="'+heroArt(p)+'">')+'<div class="figure-vitals"><strong>'+esc(p.name)+(p.id===myId?" · YOU":"")+'</strong><div class="figure-meter hp-meter"><i style="width:'+Math.max(0,Math.min(100,100*p.hp/Math.max(1,p.maxHp)))+'%"></i></div><small>'+p.hp+' / '+p.maxHp+' HP</small><div class="figure-meter mp-meter"><i style="width:'+Math.max(0,Math.min(100,100*p.mp/Math.max(1,p.maxMp)))+'%"></i></div><small>'+p.mp+' / '+p.maxMp+' MP</small></div></div>').join("");window.SoulboundSprite?.refresh();$("players").innerHTML=s.players.map(p=>'<div class="player"><div class="player-head"><strong>'+esc(p.name)+" · "+p.className+(p.id===myId?" (YOU)":"")+(p.hp<=0?" · DOWN":"")+'</strong><span>LV '+p.level+'</span></div><div class="player-bars">HP '+p.hp+"/"+p.maxHp+" · MP "+p.mp+"/"+p.maxMp+"<br>ATK "+p.atk+" · DEF "+p.def+" · 🧪 "+(p.smallHealth||p.potions||0)+"/"+(p.mediumHealth||0)+"/"+(p.largeHealth||0)+" · 🔷 "+(p.smallMana||p.manaPotions||0)+"/"+(p.mediumMana||0)+"/"+(p.largeMana||0)+" · 🪙 "+p.gold+"<br>⚔ "+esc(p.weapon)+" · 🛡 "+esc(p.armor)+"</div></div>").join("");
if(me){const pathPanel=$("classPathPanel"),details={berserker:{name:"Berserker",bonus:"+6 ATK · -2 DEF",passive:"Blood Rush: deal 10% more damage while your HP is at or below 50%."},knight:{name:"Knight",bonus:"+5 DEF · +20 Max HP",passive:"Iron Guard: take 10% less damage from enemy attacks."},archmage:{name:"Archmage",bonus:"+4 ATK · +30 Max MP",passive:"Arcane Mastery: damaging skills deal 10% more damage."},warlock:{name:"Warlock",bonus:"+6 ATK · +10 Max HP",passive:"Soul Leech: each damaging skill restores 5% of your Max MP."},guardian:{name:"Guardian",bonus:"+6 DEF · +50 Max HP",passive:"Bulwark: take 12% less damage from enemy attacks."},paladin:{name:"Paladin",bonus:"+6 ATK · +3 DEF · +25 Max HP · +10 Max MP",passive:"Holy Vigor: each damaging skill restores 5% of your Max HP."}};const choices={swordsman:["berserker","knight"],mage:["archmage","warlock"],tank:["guardian","paladin"]},opts=choices[me.classId]||[];const eligible=me.level>=15&&!me.classPath&&opts.length>0;
const specKey=s.code+":"+me.id+":"+me.classId;
if(eligible&&specLastEligible!==specKey){specDismissedFor="";specModalOpen=true;specLastEligible=specKey;window.SoulboundAudio?.sfx("levelup")}
if(!eligible){specModalOpen=false;specLastEligible=""}
const showSpec=eligible&&specModalOpen&&specDismissedFor!==specKey;
pathPanel.hidden=!showSpec;
$("specBackdrop").hidden=!showSpec;
$("specOpen").hidden=!eligible;
$("specOpen").textContent=showSpec?"✦ SPECIALIZATION OPEN":"✦ CHOOSE SPECIALIZATION";$("classPathChoices").innerHTML=opts.map(id=>{const d=details[id],tip=d.bonus+"\nPassive: "+d.passive;return '<button data-path="'+id+'" data-tooltip="'+esc(tip)+'" title="'+esc(tip)+'">'+d.name+'<small>'+d.bonus+'</small></button>'}).join("");if(me.classPath){const d=details[me.classPath];$("classPathStatus").hidden=false;$("classPathStatus").innerHTML='<strong>'+d.name.toUpperCase()+' · SPECIALIZATION</strong><br>'+d.bonus+'<br><span>Passive: '+d.passive+'</span>';$("classPathStatus").title=d.bonus+" · "+d.passive}else {const status=$("classPathStatus");status.hidden=false;status.textContent="✦ Secondary class unlocks at Level 15 · Current Level "+me.level;}document.querySelectorAll("[data-path]").forEach(b=>b.onclick=async()=>{const r=await call("chooseClassPath",{path:b.dataset.path});if(!r.ok)notice(r.error,true)});}$("myStats").textContent=me?"XP "+me.xp+"/"+(me.level*100)+" · GOLD "+me.gold:"Waiting for player data";
const xpValue=Math.max(0,Math.floor(Number(me?.xp)||0));
const xpGoal=Math.max(100,Math.floor(Number(me?.level||1)*100));
const xpPercent=Math.min(100,Math.max(0,xpValue/xpGoal*100));
$("v28XpText").textContent=xpValue+" / "+xpGoal+" XP";
$("v28XpFill").style.width=xpPercent.toFixed(2)+"%";
$("v28XpMeter").setAttribute("aria-valuenow",String(xpValue));
$("v28XpMeter").setAttribute("aria-valuemax",String(xpGoal));
if(me){$("statPoints").textContent="AVAILABLE POINTS: "+(me.statPoints||0);$("statValues").textContent="STR "+(me.strength||0)+" · VIT "+(me.vitality||0)+" · INT "+(me.intelligence||0)+" · AGI "+(me.agility||0)+" · SPEED "+(me.speed||10);document.querySelectorAll("[data-stat]").forEach(b=>b.disabled=(me.statPoints||0)<1)}const gearInfo={"Training Sword":"+0 ATK · Starter weapon","Apprentice Staff":"+0 ATK · Starter weapon","Guardian Mace":"+0 ATK · Starter weapon","Iron Mace":"+8 ATK","Iron Sword":"+8 ATK","Arcane Staff":"+8 ATK","Steel Blade":"+16 ATK","Crystal Staff":"+17 ATK","Warhammer":"+16 ATK","Knight Greatsword":"+28 ATK","Starweave Staff":"+30 ATK","Titan Maul":"+29 ATK","Iron Armor":"+5 DEF · +20 Max HP","Sage Robe":"+3 DEF · +20 Max MP","Guardian Plate":"+12 DEF · +55 Max HP","Archmage Raiment":"+8 DEF · +65 Max MP","Dragon Scale Armor":"+20 DEF · +100 Max HP","Void Mantle":"+16 DEF · +110 Max MP"};$("myGear").innerHTML=me?'<div class="gear-slot" data-tooltip="'+esc(gearInfo[me.weapon]||"Equipped weapon")+'" title="'+esc(gearInfo[me.weapon]||"Equipped weapon")+'"><span>⚔ WEAPON</span><strong>'+esc(me.weapon)+'</strong><small>'+esc(gearInfo[me.weapon]||"Weapon equipped")+"</small></div><div class=\"gear-slot\" data-tooltip=\""+esc(gearInfo[me.armor]||"Equipped armor")+"\" title=\""+esc(gearInfo[me.armor]||"Equipped armor")+"\"><span>🛡 ARMOR</span><strong>"+esc(me.armor)+"</strong><small>"+esc(gearInfo[me.armor]||"Armor equipped")+"</small></div>":"";if(me){const pct=(v,m)=>Math.max(0,Math.min(100,v/Math.max(1,m)*100));$("heroIdentity").textContent=me.name.toUpperCase()+" · "+me.className.toUpperCase();$("heroLevel").textContent="LV "+me.level;$("heroHpText").textContent=me.hp+" / "+me.maxHp;$("heroMpText").textContent=me.mp+" / "+me.maxMp;$("myHpBar").style.width=pct(me.hp,me.maxHp)+"%";$("myMpBar").style.width=pct(me.mp,me.maxMp)+"%";$("heroMeta").textContent="ATK "+me.atk+" · DEF "+me.def+" · 🧪 "+(me.smallHealth||me.potions||0)+"/"+(me.mediumHealth||0)+"/"+(me.largeHealth||0)+" · 🔷 "+(me.smallMana||me.manaPotions||0)+"/"+(me.mediumMana||0)+"/"+(me.largeMana||0)+" · 🪙 "+me.gold;const rn=raceNames[me.raceId]||"Human";$("raceName").textContent=rn;$("raceRarity").textContent=(me.raceRarity||"common").toUpperCase();$("raceRarity").className="rarity "+rarityClass(me.raceRarity);$("racePassive").textContent=me.racePassive||"Balanced and adaptable.";$("raceBuffs").textContent=(me.raceBuffs||[]).join(" · ");$("racePoints").textContent=me.racePoints||0;$("openGacha").disabled=(me.racePoints||0)<1;$("openGacha").textContent=(me.racePoints||0)>0?"SUMMON RACE · 1 PT":"NEED 1 POINT";}$("healthCount").textContent="OWNED: "+(me?.potions||0);$("manaCount").textContent="OWNED: "+(me?.manaPotions||0);
const mage=me?.classId==="mage";const elf=me?.raceId==="elf";const skillCost=elf?11:12,skill2Cost=elf?23:25,skill3Cost=elf?19:20,skill4Cost=elf?28:30,skill5Cost=elf?22:24;
const tank=me?.classId==="tank";const skillTips=tank?["SHIELD BASH\nDamage: 0.9× ATK\nMana: 12 MP\nCooldown: 2 rounds\nA sturdy frontline strike.","IRON WALL\nDamage: 1.3× ATK\nMana: 25 MP\nUnlocks at Level 3 · Cooldown: 3 rounds\nA defensive blow.","PROVOKE\nDamage: 1.4× ATK\nMana: 20 MP\nUnlocks at Level 5 · Cooldown: 3 rounds\nForces enemies to target you for 3 enemy turns.","FORTRESS STRIKE\nDamage: 3× ATK\nMana: 30 MP\nUnlocks at Level 8 · Cooldown: 4 rounds\nA heavy crushing blow.","AEGIS PACT\nDamage: 0.8× ATK\nMana: 24 MP\nUnlocks at Level 5 · Cooldown: 4 rounds\nReduce damage taken by 20% for 3 enemy turns."]:mage?[
"ARCANE BOLT\nDamage: 1.9× ATK\nMana: "+skillCost+" MP\nCooldown: 1 round\nA focused bolt of arcane energy.",
"METEOR\nDamage: 2.5× ATK\nMana: "+skill2Cost+" MP\nUnlocks at Level 3 · Cooldown: 2 rounds\nCalls down a crushing meteor.",
"FROST NOVA\nDamage: 1.6× ATK\nMana: "+skill3Cost+" MP\nUnlocks at Level 5 · Cooldown: 2 rounds\nAlso restores 10% of your Max HP.",
"ARCANE SURGE\nDamage: 3× ATK\nMana: "+skill4Cost+" MP\nUnlocks at Level 8 · Cooldown: 3 rounds\nUnleashes overwhelming arcane force.",
"ARCANE MARK\nDamage: 1.25× ATK\nMana: "+skill5Cost+" MP\nUnlocks at Level 5 · Cooldown: 4 rounds\nMarks the monster, making it take 20% more damage for 3 rounds."
]:[
"POWER STRIKE\nDamage: 1.8× ATK\nMana: "+skillCost+" MP\nCooldown: 1 round\nA powerful single-target strike.",
"WHIRLWIND\nDamage: 2.5× ATK\nMana: "+skill2Cost+" MP\nUnlocks at Level 3 · Cooldown: 2 rounds\nA sweeping spinning attack.",
"SHIELD BREAKER\nDamage: 2× ATK\nMana: "+skill3Cost+" MP\nUnlocks at Level 5 · Cooldown: 2 rounds\nAlso grants +3 DEF for this battle.",
"RALLYING SLASH\nDamage: 3× ATK\nMana: "+skill4Cost+" MP\nUnlocks at Level 8 · Cooldown: 3 rounds\nA devastating finishing slash."
,
"ARMOR REND\nDamage: 1.25× ATK\nMana: "+skill5Cost+" MP\nUnlocks at Level 5 · Cooldown: 4 rounds\nMakes the monster take 20% more damage for 3 rounds."
];
if(mage){
 skillTips.push("TIDAL SURGE\nWater spell · Damage: 1.8× ATK\nMana: "+(elf?20:22)+" MP\nUnlocks at Level 7 · Cooldown: 3 rounds\nStrong against Fire and Earth.");
 skillTips.push("THUNDERBOLT\nLightning spell · Damage: 1.95× ATK\nMana: "+(elf?24:26)+" MP\nUnlocks at Level 9 · Cooldown: 3 rounds\nStrong against Water and Ice.");
}
const skillButtons=[$("skillButton"),$("skill2Button"),$("skill3Button"),$("skill4Button"),$("skill5Button"),...(mage?[$("skill6Button"),$("skill7Button")]:[])];
skillButtons.forEach((b,i)=>{b.dataset.tooltip=skillTips[i];b.removeAttribute("title");b.setAttribute("aria-label",b.title)});
$("skillButton").textContent=mage?"🔮 ARCANE BOLT":tank?"🛡 SHIELD BASH":"🔥 POWER STRIKE";
$("skill2Button").textContent=mage?"☄ METEOR":tank?"🧱 IRON WALL":"✴ WHIRLWIND";
$("skill3Button").textContent=mage?"❄ FROST NOVA":tank?"📣 PROVOKE":"🛡 SHIELD BREAKER";
$("skill4Button").textContent=mage?"🌠 ARCANE SURGE":tank?"🏰 FORTRESS STRIKE":"⚡ RALLYING SLASH";$("skill5Button").textContent=mage?"✦ ARCANE MARK":tank?"🛡 AEGIS PACT":"⚔ ARMOR REND";
$("skill6Button").textContent="💧 TIDAL SURGE";$("skill7Button").textContent="⚡ THUNDERBOLT";
$("skillGuide").textContent="Hover over a skill to view its damage, mana cost and effects.";
$("partyChatMessages").innerHTML=(s.chat||[]).map(m=>"<div class=\"chat-line\"><b>"+esc(m.name)+"</b> <span>"+esc(m.message)+"</span></div>").join("");$("partyChatMessages").scrollTop=$("partyChatMessages").scrollHeight;const turn=!!me&&active?.id===myId&&s.status==="battle"&&!s.enemyWindup&&me.hp>0;$("healthMediumCount").textContent="OWNED: "+(me?.mediumHealth||0);$("healthLargeCount").textContent="OWNED: "+(me?.largeHealth||0);$("manaMediumCount").textContent="OWNED: "+(me?.mediumMana||0);$("manaLargeCount").textContent="OWNED: "+(me?.largeMana||0);
document.querySelectorAll("[data-action]").forEach(b=>{const c=b.dataset.action==="skill"?(me.raceId==="elf"?11:12):b.dataset.action==="skill2"?(me.raceId==="elf"?23:25):b.dataset.action==="skill3"?(me.raceId==="elf"?19:20):b.dataset.action==="skill4"?(me.raceId==="elf"?28:30):b.dataset.action==="skill5"?(me.raceId==="elf"?22:24):b.dataset.action==="skill6"?(me.raceId==="elf"?20:22):b.dataset.action==="skill7"?(me.raceId==="elf"?24:26):b.dataset.action==="break"?(me.raceId==="elf"?14:15):b.dataset.action==="cleanse"?(me.raceId==="elf"?11:12):0;b.disabled=!turn||(c>0&&me.mp<c)||((me.cooldowns?.[b.dataset.action]||0)>0)||(b.dataset.action==="skill2"&&me.level<3)||(b.dataset.action==="skill3"&&me.level<5)||(b.dataset.action==="skill4"&&me.level<8)||((b.dataset.action.startsWith("heal"))&&(!(me[{healSmall:"smallHealth",healMedium:"mediumHealth",healLarge:"largeHealth"}[b.dataset.action]]||0)||me.hp===me.maxHp))||((b.dataset.action.startsWith("mana"))&&(!(me[{manaSmall:"smallMana",manaMedium:"mediumMana",manaLarge:"largeMana"}[b.dataset.action]]||0)||me.mp===me.maxMp))||(b.dataset.action==="skill5"&&me.level<5)||(b.dataset.action==="skill6"&&(me.level<7||me.classId!=="mage"))||(b.dataset.action==="skill7"&&(me.level<9||me.classId!=="mage"))||
 (b.dataset.action==="cleanse"&&!s.players.some(x=>x.hp>0&&x.statusEffects?.length))});
for(const id of ["v055Break","v055Cleanse"]){const button=$(id);if(button){const cd=me?.cooldowns?.[button.dataset.action]||0;
 button.title=(button.dataset.action==="break"?"Heavy Stagger · ":"Remove party ailment · ")+(cd>0?"Cooldown "+cd+" turns":"Available");
 button.textContent=(button.dataset.action==="break"?"💥 BREAK STRIKE":"✨ CLEANSE")+(cd>0?" · CD "+cd:"");
}}$("skill2Button").hidden=!me||me.level<3;$("skill3Button").hidden=!me||me.level<5;$("skill4Button").hidden=!me||me.level<8;$("skill5Button").hidden=!me||me.level<5;$("skill6Button").hidden=!mage||!me||me.level<7;$("skill7Button").hidden=!mage||!me||me.level<9;skillButtons.forEach(b=>{const cd=me?.cooldowns?.[b.dataset.action]||0;if(cd>0)b.textContent+=" · CD "+cd});
$("start").hidden=s.status!=="city";$("start").disabled=s.players[0]?.id!==myId;$("next").hidden=!(s.status==="victory"&&s.stage%5!==0);$("next").disabled=s.players[0]?.id!==myId;$("openShop").hidden=!(s.status==="victory"&&s.stage%5===4&&!!s.monster?.miniBoss);$("openShop").textContent="🏕 TRAVELING MERCHANT";$("openShop").disabled=s.players[0]?.id!==myId;$("continueShop").textContent="✕ CLOSE SHOP";$("continueShop").hidden=true;$("continueShop").disabled=s.players[0]?.id!==myId;$("restart").textContent="🏰 RETURN TO CITY";$("restart").hidden=!["regionClear","defeat"].includes(s.status);$("restart").disabled=s.players[0]?.id!==myId;$("shopPanel").hidden=s.status!=="shop"||v23ShopCollapsed;
$("v23ShopToggle").hidden=s.status!=="shop";
$("v23ShopToggle").setAttribute("aria-expanded",String(s.status==="shop"&&!v23ShopCollapsed));

// A storefront is not an all-purpose merchant: only show its inventory.

if(cityShopScope&&!cityShopScope.includes(activeShopCategory))activeShopCategory=cityShopScope[0];
const categories=$("shopCategories");
if(categories)categories.querySelectorAll("[data-shop-category]").forEach(b=>{
 b.hidden=!!cityShopScope&&!cityShopScope.includes(b.dataset.shopCategory);
 b.disabled=!!cityShopScope&&!cityShopScope.includes(b.dataset.shopCategory);
 b.classList.toggle("active",b.dataset.shopCategory===activeShopCategory);
});
const shopTitle=s.shopOrigin==="camp"?"TRAVELING MERCHANT · ROADSIDE CAMP":cityShopScope?.length===2?"POTIONS & FOOD":cityShopScope?.[0]==="weapon"?"WEAPON SHOP":cityShopScope?.[0]==="armor"?"ARMOR SHOP":"TRAVELING MERCHANT";
const titleBar=$("shopPanel")?.querySelector(".v23-shop-titlebar span");
const titleBody=$("shopPanel")?.querySelector(".pixel-title.log-title");
if(titleBar)titleBar.textContent="🏪 "+shopTitle;
if(titleBody)titleBody.textContent=shopTitle;
const visibleItems=s.shopItems.filter(it=>(!cityShopScope||cityShopScope.includes(it.category))&&it.category===activeShopCategory);
$("shopItems").innerHTML=visibleItems.map(it=>'<div class="shop-item" data-category="'+it.category+'"><div><strong>'+it.icon+" "+it.name+'</strong><small>'+it.description+" · "+it.price+' G</small></div><button data-buy="'+it.id+'" '+((it.class&&it.class!==me?.classId)||!me||me.gold<it.price||me.level<(it.level||1)?"disabled":"")+">BUY</button></div>").join("")||'<p class="small">No items in this category.</p>';
document.querySelectorAll("[data-buy]").forEach(b=>b.onclick=async()=>{const r=await call("buyItem",{itemId:b.dataset.buy});if(!r.ok)alert(r.error)});
window.SoulboundV32?.render(me,s,(itemId,slot)=>call("equipItem",{itemId,targetSlot:slot}),slot=>call("unequipItem",{slot}),uid=>call("discardItem",{uid}));
$("inventorySummary").textContent="GEAR ITEMS · "+(me?.inventory?.length||0)+"   |   GOLD · "+(me?.gold||0);
$("inventoryItems").innerHTML=(me?.inventory||[]).map(it=>'<div class="inventory-row"><div><strong>'+esc(it.name)+'</strong><small>'+(it.slot==="weapon"?"Weapon · +"+(it.value||0)+" ATK":"Armor · +"+(it.defense||0)+" DEF")+'</small></div><button data-equip="'+esc(it.id)+'">EQUIP</button></div>').join("")||'<small class="small">Buy weapons or armor from the merchant to collect them here.</small>';
$("foodInventory").innerHTML='<div class="food-title">CAMP FOOD · ACTIVE BUFFS</div><div class="food-actions"><button data-eat-food="food_roast" '+(!(me?.foodItems?.roast_meat)||!turn?"disabled":"")+'>🍖 ROAST × '+(me?.foodItems?.roast_meat||0)+'</button><button data-eat-food="food_stew" '+(!(me?.foodItems?.herb_stew)||!turn?"disabled":"")+'>🍲 STEW × '+(me?.foodItems?.herb_stew||0)+'</button><button data-eat-food="food_tart" '+(!(me?.foodItems?.mana_tart)||!turn?"disabled":"")+'>🥧 TART × '+(me?.foodItems?.mana_tart||0)+'</button></div><small>ATK buff: '+(me?.foodBuffs?.atk||0)+' attacks · DEF buff: '+(me?.foodBuffs?.def||0)+' hits · Skill buff: '+(me?.foodBuffs?.skill||0)+' skills</small>';document.querySelectorAll("[data-eat-food]").forEach(b=>b.onclick=async()=>{const r=await call("action",{type:b.dataset.eatFood,requestId:v565ActionId()});if(!r.ok)alert(r.error);else window.SoulboundAudio?.sfx("heal")});
document.querySelectorAll("[data-equip]").forEach(b=>b.onclick=async()=>{const r=await call("equipItem",{itemId:b.dataset.equip});if(!r.ok)alert(r.error)});
$("game").classList.toggle("v0483-camp-shop",s.status==="shop"&&s.shopOrigin==="camp");
$("status").textContent=s.status==="city"?"CENTRAL CITY · Choose a region." : s.status==="regionClear"?"REGION CLEARED! Return to the city or replay the map.":s.status==="waiting"?"Waiting for party leader to start.":s.status==="battle"?(active?.id===myId?"YOUR TURN — choose an action!":(active?.name||"Another hero")+" is taking their turn..."):s.status==="victory"?"VICTORY! Continue to the next encounter or return to the city.":s.status==="shop"?(s.shopOrigin==="camp"?"ROADSIDE CAMP · Replenish supplies before continuing.":"CITY MERCHANT · Buy supplies before traveling."):s.status==="complete"?"THE KINGDOM IS FREE!":"The party has fallen.";$("log").innerHTML=s.log.slice().reverse().map(x=>"<div>› "+esc(x)+"</div>").join("")}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

/* v0.33: old inline equipment/inventory spotlight removed; the unified Equipment & Bag dialog handles the single button. */
/* v0.15 contextual tooltips: fixed to viewport, no clipped popups */
(function setupV15Tooltips(){
 const tip=document.createElement("div");tip.id="v15Tooltip";tip.setAttribute("role","tooltip");tip.hidden=true;document.body.appendChild(tip);
 let target=null;
 function message(el){
  if(!el)return "";
  const act=el.dataset.action;
  const potion={healSmall:"Restores 20% of maximum HP",healMedium:"Restores 35% of maximum HP",healLarge:"Restores 50% of maximum HP",manaSmall:"Restores 20% of maximum MP",manaMedium:"Restores 35% of maximum MP",manaLarge:"Restores 50% of maximum MP"};
  return potion[act]||el.dataset.tooltip||"";
 }
 function place(el){
  const rect=el.getBoundingClientRect(),maxWidth=Math.min(330,window.innerWidth-20);
  tip.style.maxWidth=maxWidth+"px";
  const left=Math.max(10,Math.min(window.innerWidth-maxWidth-10,rect.left+rect.width/2-maxWidth/2));
  tip.style.left=left+"px";
  tip.style.top="10px";
  const height=tip.getBoundingClientRect().height;
  const above=rect.top-height-10;
  tip.style.top=(above>=8?above:Math.min(window.innerHeight-height-8,rect.bottom+10))+"px";
 }
 function show(el){const msg=message(el);if(!msg)return;target=el;tip.textContent=msg;tip.hidden=false;place(el)}
 function hide(){tip.hidden=true;target=null}
 document.addEventListener("pointerover",e=>{const el=e.target.closest?.("#game [data-action],#game [data-tooltip]");if(el&&el!==target)show(el);else if(!el)hide()});
 document.addEventListener("pointerout",e=>{if(target&&!target.contains(e.relatedTarget))hide()});
 document.addEventListener("focusin",e=>{const el=e.target.closest?.("#game [data-action],#game [data-tooltip]");if(el)show(el)});
 document.addEventListener("focusout",hide);
 window.addEventListener("resize",()=>{if(target)place(target)});
})();

/* v0.23: modal merchant access, independent of the sidebar and room height */
(function initV23Merchant(){
 const panel=$("shopPanel"),toggle=$("v23ShopToggle"),close=$("v23ShopClose");
 if(!panel||!toggle||!close)return;
 const show=()=>{if(!gameState||gameState.status!=="shop")return;v23ShopCollapsed=false;panel.hidden=false;toggle.setAttribute("aria-expanded","true");close.focus()};
 const hide=()=>{v23ShopCollapsed=true;panel.hidden=true;toggle.setAttribute("aria-expanded","false");toggle.focus()};
 toggle.addEventListener("click",()=>panel.hidden?show():hide());
 const closeMerchant=()=>{
  hide();
  // The party never left the city. Closing the shared shop must not call
  // returnCity (which resets the selected region/stage and heals the party).
  if(gameState?.status==="shop"&&gameState.players[0]?.id===myId)
   call("closeShop").then(result=>{if(!result.ok)notice(result.error,true)});
 };
 close.addEventListener("click",closeMerchant);
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden){e.stopPropagation();closeMerchant()}});

})();

/* v0.26.1b: dedicated specialization popup and in-game sound mixer. */
(function initHotfix261b(){
 const dismiss=()=>{const me=gameState?.players?.find(p=>p.id===myId);if(me){specDismissedFor=gameState.code+":"+me.id+":"+me.classId}specModalOpen=false;const panel=$("classPathPanel"),bg=$("specBackdrop");if(panel)panel.hidden=true;if(bg)bg.hidden=true;const trigger=$("specOpen");if(trigger)trigger.textContent="✦ CHOOSE SPECIALIZATION";};
 $("specClose")?.addEventListener("click",dismiss);
 $("specBackdrop")?.addEventListener("click",dismiss);
 $("specOpen")?.addEventListener("click",()=>{specDismissedFor="";specModalOpen=true;render();$("classPathPanel")?.focus();window.SoulboundAudio?.sfx("menu")});
 document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!$("classPathPanel").hidden)dismiss()});
 const panel=$("audioSettings"),toggle=$("audioSettingsToggle"),music=$("gameMusicVolume"),fx=$("gameSfxVolume");
 function syncValues(){
  if(music)music.value=Math.round(window.SoulboundAudio?.volume*100||0);
  if(fx)fx.value=Math.round(window.SoulboundAudio?.sfxVolume*100||0);
 }
 if(toggle&&panel)toggle.addEventListener("click",()=>{panel.hidden=!panel.hidden;toggle.setAttribute("aria-expanded",String(!panel.hidden));if(!panel.hidden)syncValues()});
 if(music)music.addEventListener("input",()=>{const v=Number(music.value)/100;window.SoulboundAudio?.setVolume(v);if($("musicVolume"))$("musicVolume").value=music.value});
 if(fx)fx.addEventListener("input",()=>{const v=Number(fx.value)/100;window.SoulboundAudio?.setSfxVolume(v);if($("sfxVolume"))$("sfxVolume").value=fx.value;const quick=$("sfxQuick");if(quick){quick.textContent=v>0?"🔊 SFX ON":"🔇 SFX OFF";quick.setAttribute("aria-pressed",String(v>0))}});
 $("audioTest")?.addEventListener("click",()=>window.SoulboundAudio?.sfx("attack",{weapon:"Steel Blade"}));
 document.addEventListener("pointerdown",e=>{if(panel&&!panel.hidden&&!panel.contains(e.target)&&!toggle?.contains(e.target)){panel.hidden=true;toggle?.setAttribute("aria-expanded","false")}});
 syncValues();
})();

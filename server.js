const express=require("express"),http=require("http"),path=require("path");
const {Server}=require("socket.io");const archer=require(path.join(__dirname,"classes","archer-v062.js"));const assassinClass=require(path.join(__dirname,"classes","assassin-v063.js"));const priestClass=require(path.join(__dirname,"classes","priest-v063.js"));const weaponPassives=require(path.join(__dirname,"items","weapon-passives-v061.js"));const multi=require(path.join(__dirname,"multiplayer","session-v059.js"));const {randomUUID}=require("node:crypto");const formulas=require(path.join(__dirname,"combat","formulas.js"));const skillCore=require(path.join(__dirname,"combat","skills.js"));const loot=require("./loot-v034");const secure=require(path.join(__dirname,"persistence","secure-saves-v057.js"));const APP_VERSION=JSON.parse(require("fs").readFileSync(path.join(__dirname,"package.json"),"utf8")).version.replace(/\.0$/,"");const app=express(),server=http.createServer(app),io=new Server(server),PORT=process.env.PORT||3000;
app.use(express.static(path.join(__dirname,"public")));if(secure.enabled)app.use(express.json({limit:"8kb"}));
app.get("/health",(_,res)=>res.json({ok:true,game:"SOULBOUND Online",version:APP_VERSION,secureSavesEnabled:secure.enabled}));
const credential=req=>String(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
const endpoint=fn=>async(req,res)=>{try{const result=await fn(req);res.json(result)}catch(e){res.status(e.status||500).json({error:e.message&&e.status?e.message:"Save request failed"})}};
if(secure.enabled)app.get("/api/secure-saves",endpoint(req=>secure.list(credential(req))));
if(secure.enabled)app.post("/api/secure-saves/:slot/new",endpoint(async req=>{
 const token=credential(req),userId=await secure.authenticate(token);
 if(secureQueue.isActive(userId,Number(req.params.slot))){const e=new Error("Leave the active game before replacing this slot.");e.status=409;throw e}
 return secure.newGame(token,req.params.slot,req.body?.classId,req.body?.name,req.body?.revision??null,req.body?.characterId);
}));
if(secure.enabled)app.delete("/api/secure-saves/:slot",endpoint(async req=>{
 const token=credential(req),userId=await secure.authenticate(token);
 if(secureQueue.isActive(userId,Number(req.params.slot))){const e=new Error("Leave the active game before deleting this slot.");e.status=409;throw e}
 return secure.remove(token,req.params.slot,req.body?.revision);
}));
const verifiedCharacters=new Map();
const gm=require("./gm/gm-v067");
const gmConfig=gm.setup(process.env.SOULBOUND_GM_OWNER_ID,secure.enabled);
const gmPending=new Set();
if(gmConfig.enabled)console.info("[GM] Secure owner-only rewards enabled.");
const secureQueue=secure.createQueue((error,claim)=>{console.error("[SAVE-ERROR]",{slot:claim.slot,code:error.status||500,message:error.message});if(claim.socketId)io.to(claim.socketId).emit("saveError",{message:"Cloud save failed for SLOT "+claim.slot+". "+error.message+". Stop playing and reload after verifying your save."})});
function saveVerifiedRoom(r){
 if(!secure.enabled)return;
 for(const p of r.players.values()){const claim=verifiedCharacters.get(p.id);if(claim)secureQueue.persist(claim,p)}
}
const world=require("./world-v040");const combat=require("./combat-v055");const pack=world.encounterPack;const rooms=new Map();
const adventureIndex=require(path.join(__dirname,"api","adventure-index-v062.js"));const publicSkills=require(path.join(__dirname,"combat","public-skill-catalog-v062.js"));const weaponCatalog=require(path.join(__dirname,"items","weapon-shop-v060.js"));const armorCatalog=require(path.join(__dirname,"items","armor-shop-v066.js"));const catalog=require(path.join(__dirname,"data","game-catalog-v062.js"));const {normal,bosses,shopItems,races}=catalog;
const characterCatalog=require(path.join(__dirname,"public","characters-v064.js"));
const scenes=[{name:"THE CURSED WILDS",hint:"Ancient trees whisper in the dark.",css:"wilds"},{name:"FALLEN KINGDOM",hint:"Broken towers watch your every move.",css:"ruins"},{name:"EMBER CAVERNS",hint:"Heat shimmers above the black stone.",css:"cavern"},{name:"FROSTBOUND PASS",hint:"A cold wind sweeps across the ice.",css:"frost"},{name:"THE VOID",hint:"Something stirs beyond the veil.",css:"abyss"},{name:"ECLIPSE CITADEL",hint:"The final kingdom lies ahead.",css:"castle"}];
function raceById(id){return races.find(x=>x.id===id)||races[0]}
function applyRace(p,newId){const old=raceById(p.raceId),next=raceById(newId),ratio=(v,a,b)=>Math.max(1,Math.round(v/a*b)),hpPct=p.hp/Math.max(1,p.maxHp),mpPct=p.mp/Math.max(1,p.maxMp);p.maxHp=ratio(p.maxHp,old.hp,next.hp);p.maxMp=ratio(p.maxMp,old.mp,next.mp);p.atk=ratio(p.atk,old.atk,next.atk);p.def=ratio(p.def,old.def,next.def);p.hp=Math.max(1,Math.round(p.maxHp*hpPct));p.mp=Math.min(p.maxMp,Math.round(p.maxMp*mpPct));p.raceId=next.id;p.raceName=next.name;p.raceRarity=next.rarity;p.racePassive=next.passive;p.raceBuffs=next.buffs}
function cleanName(v){return String(v||"Adventurer").trim().replace(/[<>]/g,"").slice(0,16)||"Adventurer"}function bounded(v,min,max,fb){const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fb}
function sceneFor(n){const r=world.regionForStage(n);return {name:r.name,hint:r.hint,css:r.css,regionId:r.id}}
function encounter(n){return world.encounter(n,normal,bosses)}
/* v0.35 in-game index: generated from the actual encounter, shop and boss loot rules.
   Read-only route: no player data, saves, combat state or database changes. */
app.get("/api/index",(_,res)=>{res.set("Cache-Control","no-store, max-age=0");res.json(adventureIndex.buildIndex(APP_VERSION));});
function publicRoom(r){return{code:r.code,stage:r.stage,totalStages:world.totalStages,scene:sceneFor(r.stage),regionIndex:r.regionIndex,region:world.regions[r.regionIndex],regions:world.regions.map(({normalNames,miniName,...data})=>({...data,miniName})),monster:r.monster,enemies:pack.publicEnemies(r),partyWardReduction:r.partyWardReduction||0,enemyWindup:!!r.pendingEnemy,players:[...r.players.values()].map(p=>({...p,alive:p.hp>0,skillBook:publicSkills.skillsFor(p.classId)})),turnIndex:r.turnIndex,status:r.status,partyWardTurns:r.partyWardTurns||0,shopCategory:r.shopCategory||null,shopOrigin:r.shopOrigin||null,shopItems:shopItems.map(it=>({...it,category:it.category||(it.slot==="weapon"?"weapon":it.slot==="armor"?"armor":"potion")})),weaponFx:(r.weaponFx||[]).slice(-16),log:r.log.slice(-40),chat:(r.chat||[]).slice(-40)}}
function emit(r){io.to(r.code).emit("state",publicRoom(r));saveVerifiedRoom(r)}function say(r,m){r.log.push(m);if(r.log.length>40)r.log.shift()}
function createRoom(code){const r={code,stage:1,regionIndex:0,monster:null,enemies:[],players:new Map(),turnIndex:0,status:"city",log:[],chat:[],reconnectPaused:false};rooms.set(code,r);return r}
function findRoom(s){return [...rooms.values()].find(r=>r.players.has(s.id))}function current(r){const a=[...r.players.values()];return a.length?a[r.turnIndex%a.length]:null}function alive(r){return [...r.players.values()].filter(p=>p.hp>0)}
function player(id,name,c="swordsman",gender="male",characterId=null){const identity=characterCatalog.byId(characterId);const mage=c==="mage",tank=c==="tank",bow=c==="archer",starter=archer.STARTER,extra=c==="assassin"?assassinClass.STARTER:c==="priest"?priestClass.STARTER:null;return{id,name:cleanName(name),characterId:identity?.id||null,gender:identity?.gender||(gender==="female"?"female":"male"),inventory:[],weaponItem:null,armorItem:null,foodItems:{roast_meat:0,herb_stew:0,mana_tart:0},foodBuffs:{atk:0,def:0,skill:0},classId:extra?c:bow?"archer":tank?"tank":mage?"mage":"swordsman",className:extra?extra.name:bow?"Archer":tank?"Tank":mage?"Mage":"Swordsman",hp:extra?extra.hp:bow?starter.hp:tank?180:mage?120:130,maxHp:extra?extra.hp:bow?starter.hp:tank?180:mage?120:130,mp:extra?extra.mp:bow?starter.mp:tank?55:mage?65:40,maxMp:extra?extra.mp:bow?starter.mp:tank?55:mage?65:40,level:1,xp:0,gold:80,potions:3,manaPotions:2,smallHealth:3,mediumHealth:0,largeHealth:0,smallMana:2,mediumMana:0,largeMana:0,classPath:null,tauntTurns:0,damageAmpTurns:0,damageReductionTurns:0,atk:extra?extra.atk:bow?starter.atk:tank?16:mage?25:22,def:extra?extra.def:bow?starter.def:tank?16:mage?8:10,weapon:extra?extra.weapon:bow?starter.weapon:tank?"Guardian Mace":mage?"Apprentice Staff":"Training Sword",armor:extra?extra.armor:bow?starter.armor:tank?"Guardian Armor":mage?"Novice Robe":"Traveler Armor",raceId:"human",racePoints:0,raceName:"Human",raceRarity:"common",racePassive:races[0].passive,raceBuffs:races[0].buffs,strength:0,vitality:0,intelligence:0,agility:0,statPoints:0,speed:extra?extra.speed:bow?starter.speed:10,cooldowns:{},worldProgress:world.normalizeProgress(null)}}
function monsterStrike(r){
 const m=r.monster,fire=weaponPassives.tickBurn(m);
 if(fire.damage){
  say(r,"🔥 "+m.name+" takes "+fire.damage+" Burn damage ("+fire.remaining+" turns remaining).");
  weaponPassives.recordBurn(r,m,fire.damage);
  if(fire.defeated){
   m.defeatAnnounced=true;say(r,"☠ "+m.name+" is defeated by Burn.");
   if(pack.deadTarget(r))finish(r);
   return false;
  }
 }
 combat.monsterStrike(r,{say,raceById,random:Math.random});return true;
}
function enemyCounterAfterBeat(r){
 const token={stage:r.stage,enemies:pack.alive(r),selected:r.monster};
 r.pendingEnemy=token;
 function attackAt(index){
  if(r.pendingEnemy!==token)return;
  if(multi.hasMissing(r)){setTimeout(()=>attackAt(index),600);return}
  if(r.status!=="battle"||r.stage!==token.stage){r.pendingEnemy=null;return}
  if(index>=token.enemies.length||!alive(r).length){
   r.pendingEnemy=null;r.monster=pack.select(r,token.selected?.enemyId)||pack.alive(r)[0]||r.monster;
   skipFallenTurn(r);combat.applyDefeatPenalty(r,say);emit(r);return;
  }
  const attacker=token.enemies[index];
  if(attacker?.hp>0){
   r.monster=attacker;const struck=monsterStrike(r);
   r.monster=pack.select(r,token.selected?.enemyId)||pack.alive(r)[0]||r.monster;
   if(struck)say(r,"⚔ "+attacker.name+" finishes its attack.");
   emit(r);
  }
  if(r.status!=="battle"){r.pendingEnemy=null;combat.applyDefeatPenalty(r,say);emit(r);return}
  setTimeout(()=>attackAt(index+1),600);
 }
 setTimeout(()=>attackAt(0),760);
}
function skipFallenTurn(r){if(r.status!=="battle")return;const players=[...r.players.values()];if(!players.length||!alive(r).length)return;let i=0;while(current(r)?.hp<=0&&i<players.length){r.turnIndex=(r.turnIndex+1)%players.length;i++}if(i>0)say(r,"Fallen party members are skipped until victory or defeat.")}
function start(r){
 const first=encounter(r.stage);r.status="battle";r.shopOrigin=null;r.shopCategory=null;r.encounterId=randomUUID();r.rewardedEncounter=null;
 r.enemies=[];r.monster=first;r.weaponFx=[];
 pack.makeGroup(r,first,normal,Math.random);
 r.defeatPenaltyApplied=false;r.turnSerial=1;r.partyWardTurns=0;r.partyWardReduction=0;
 for(const foe of r.enemies){foe.stage=r.stage;combat.beginEncounter(foe,r);foe.staggerThreshold=combat.staggerThreshold(foe)}
 const members=Math.max(1,r.players.size);
 say(r,"⚔ HARDCORE · "+r.enemies.length+" enemies vs "+members+" heroes · boss ATK boosted.");
 r.players=new Map([...r.players.entries()].sort((a,b)=>(b[1].speed||10)-(a[1].speed||10)));
 r.turnIndex=0;for(const p of r.players.values()){
  p.hp=p.maxHp;p.mp=p.maxMp;p.cooldowns={};p.statusEffects=[];
  p.guardTurns=0;p._effectTurn=0;p._combatAttackMultiplier=1;p.controlImmunityTurns=0;p.perfectGuard=false;
 }
 say(r,r.monster.boss?"BOSS ENCOUNTER: "+r.monster.name+"!":"Stage "+r.stage+": "+r.enemies.length+" enemies approach!");
 for(const foe of r.enemies)foe.speed=8+Math.floor((r.stage-1)/4)*2;
 const fastest=Math.max(...[...r.players.values()].map(p=>p.speed||10));
 if(r.monster.speed>fastest){
  say(r,"⚡ "+r.monster.name+" is faster and strikes first!");
  monsterStrike(r);skipFallenTurn(r);
 }
}
function nextTurn(r){const a=[...r.players.values()],living=alive(r);if(!living.length){r.status="defeat";say(r,"The party has fallen.");return}let tries=0;do{r.turnIndex=(r.turnIndex+1)%a.length;tries++}while(a[r.turnIndex].hp<=0&&tries<=a.length);r.turnSerial=(r.turnSerial||0)+1;const next=a[r.turnIndex];if(next?.cooldowns)for(const k of Object.keys(next.cooldowns))next.cooldowns[k]=Math.max(0,next.cooldowns[k]-1)}
function finish(r){if(r.encounterId&&r.rewardedEncounter===r.encounterId)return; if(r.encounterId)r.rewardedEncounter=r.encounterId;const m=r.monster;r.status=r.stage%5===0?"regionClear":"victory";for(const p of r.players.values()){if(p.hp<=0){p.hp=Math.max(1,Math.ceil(p.maxHp*.3));p.mp=Math.ceil(p.maxMp*.2);say(r,p.name+" is revived after the victory with 30% HP and 20% MP.")}p.xp+=m.xp;p.gold+=m.gold;if(m.boss){p.worldProgress=world.markBossClear(p.worldProgress,m.regionId);p.racePoints=(p.racePoints||0)+1;say(r,p.name+" earned 1 Race Point for defeating a boss!");}if(m.boss||m.miniBoss)loot.dropEncounterLoot(p,r.stage,msg=>say(r,msg),world.regionForStage(r.stage).index+1,!!m.miniBoss);if(p.raceId==="human")p.xp+=Math.ceil(m.xp*.05);if(p.raceId==="sylvan")p.hp=Math.min(p.maxHp,p.hp+Math.ceil(p.maxHp*.03));while(p.xp>=p.level*100){p.xp-=p.level*100;p.level++;p.statPoints=(p.statPoints||0)+3;p.maxHp+=p.classId==="tank"?22:p.classId==="swordsman"?16:p.classId==="archer"?14:p.classId==="priest"?15:p.classId==="assassin"?13:10;p.maxMp+=p.classId==="mage"?12:p.classId==="priest"?11:p.classId==="tank"?8:p.classId==="archer"?8:p.classId==="assassin"?8:6;p.atk+=p.classId==="mage"?3:p.classId==="tank"?2:p.classId==="archer"?3:p.classId==="priest"?2:p.classId==="assassin"?3:4;p.def+=p.classId==="tank"?4:p.classId==="swordsman"?2:p.classId==="archer"?2:p.classId==="priest"?2:p.classId==="assassin"?1:1;p.hp=p.maxHp;p.mp=p.maxMp;say(r,p.name+" reached level "+p.level+"! +3 STAT POINTS. Allocate them in the character panel.")}}say(r,"Victory! "+m.name+" defeated. +"+m.xp+" EXP · +"+m.gold+" GOLD.");if(r.stage===40)say(r,"THE ECLIPSE SOVEREIGN HAS FALLEN. THE KINGDOM IS FREE! All regions can be replayed.")}
function valid(s,r){const p=r.players.get(s.id);return r.status==="battle"&&!r.pendingEnemy&&!multi.hasMissing(r)&&p&&(!secure.enabled||p.verified||p.guest)&&p.hp>0&&current(r)?.id===s.id}
io.on("connection",s=>{
 let restoring=false;
 s.on("createRoom",({name,classId,gender,characterId,guest}={},cb=()=>{})=>{const code=Math.random().toString(36).slice(2,7).toUpperCase(),r=createRoom(code);r.players.set(s.id,player(s.id,name,classId,gender,characterId));r.players.get(s.id).guest=!!guest;r.accountMode=secure.enabled?(guest?"guest":"account"):"legacy";s.join(code);const ticket=multi.issue(r,s.id);say(r,cleanName(name)+" founded the party.");emit(r);cb({ok:true,code,ticket})});
 s.on("joinRoom",({code,name,classId,gender,characterId,guest}={},cb=()=>{})=>{code=String(code||"").trim().toUpperCase();const r=rooms.get(code);if(!r)return cb({ok:false,error:"Room not found. Check the code."});if(r.players.size>=4)return cb({ok:false,error:"Party full (maximum 4)."});if(secure.enabled&&r.accountMode!==(guest?"guest":"account"))return cb({ok:false,error:"Secure account heroes and Guest heroes must use separate party rooms."});if(r.status!=="city")return cb({ok:false,error:"Adventure already started."});const p=player(s.id,name,classId,gender,characterId);p.guest=!!guest;r.players.set(s.id,p);s.join(code);const ticket=multi.issue(r,s.id);say(r,p.name+" joined the party.");emit(r);cb({ok:true,code,ticket})});
 s.on("resumeRoom",async({code,ticket,accessToken}={},cb=()=>{})=>{
  if(findRoom(s))return cb({ok:false,error:"Already connected to a party."});
  const match=multi.find(rooms,String(code||"").trim().toUpperCase(),ticket);
  if(!match)return cb({ok:false,error:"Reconnect expired or invalid. Return to the lobby."});
  const claim=verifiedCharacters.get(match.id);
  if(secure.enabled&&!match.player.guest){
   if(!claim)return cb({ok:false,error:"Verified character session is missing."});
   try{const id=await secure.authenticate(accessToken);if(id!==claim.userId)return cb({ok:false,error:"This account does not own the reconnecting hero."})}
   catch(e){return cb({ok:false,error:e.status?e.message:"Unable to authenticate reconnect."})}
  }
  const result=multi.resume(match,s.id);
  if(!result)return cb({ok:false,error:"Reconnect expired. Join a new party."});
  if(claim){verifiedCharacters.delete(result.oldId);claim.socketId=s.id;verifiedCharacters.set(s.id,claim)}
  s.join(result.room.code);
  say(result.room,result.player.name+" returned to the party.");
  cb({ok:true,code:result.room.code,ticket:result.ticket,resumed:true});
  emit(result.room);
 });
 s.on("restoreCharacter",async(v={},cb=()=>{})=>{
  let r=findRoom(s);
  if(!r||r.status!=="city")return cb({ok:false,error:"Restore only works in the waiting room."});
  if(restoring)return cb({ok:false,error:"Character restore already in progress."});if(secure.enabled&&!!v.guest!==!!r.players.get(s.id)?.guest)return cb({ok:false,error:"Character auth mode does not match party."});
  restoring=true;
  let claim=null;
  try{
   if(secure.enabled&&!v.guest){
    const record=await secure.load(v.accessToken,v.slot);
    r=findRoom(s);
    if(!r||r.status!=="city")return cb({ok:false,error:"Party changed during restore."});
    v={...record.data,gender:v.gender};
    claim=secureQueue.register({userId:record.userId,slot:record.slot,revision:record.revision,socketId:s.id});
   }else if(secure.enabled&&!r.players.get(s.id)?.guest){return cb({ok:false,error:"Authenticated restore requires a verified account."})}
   const p=r.players.get(s.id);p.characterId=characterCatalog.normalize(v.character_id)||p.characterId;const identity=characterCatalog.byId(p.characterId);p.gender=identity?.gender||(v.gender==="female"?"female":"male");p.classId=["mage","tank","archer","assassin","priest"].includes(v.class_id)?v.class_id:"swordsman";const restoreStarter=p.classId==="assassin"?assassinClass.STARTER:p.classId==="priest"?priestClass.STARTER:null;p.classPath=["berserker","knight","archmage","warlock","guardian","paladin"].includes(v.class_path)?v.class_path:null;p.racePoints=bounded(v.race_points,0,999999,0);p.raceId=raceById(v.race_id).id;p.strength=bounded(v.strength,0,9999,0);p.vitality=bounded(v.vitality,0,9999,0);p.intelligence=bounded(v.intelligence,0,9999,0);p.agility=bounded(v.agility,0,9999,0);p.statPoints=bounded(v.stat_points,0,999999,0);p.speed=bounded(v.speed,1,9999,(restoreStarter?.speed||(p.classId==="archer"?archer.STARTER.speed:10))+p.agility*2);p.cooldowns={};const race=raceById(p.raceId);p.raceName=race.name;p.raceRarity=race.rarity;p.racePassive=race.passive;p.raceBuffs=race.buffs;p.className=p.classPath?({berserker:"Berserker",knight:"Knight",archmage:"Archmage",warlock:"Warlock",guardian:"Guardian",paladin:"Paladin"})[p.classPath]:restoreStarter?.name||(p.classId==="archer"?"Archer":p.classId==="tank"?"Tank":p.classId==="mage"?"Mage":"Swordsman");p.level=bounded(v.level,1,999,1);p.xp=bounded(v.xp,0,999999,0);p.gold=bounded(v.gold,0,99999999,80);p.maxHp=bounded(v.max_hp,restoreStarter?.hp|| (p.classId==="archer"?archer.STARTER.hp:p.classId==="mage"?120:130),999999,restoreStarter?.hp|| (p.classId==="archer"?archer.STARTER.hp:p.classId==="mage"?120:130));p.hp=bounded(v.hp,1,p.maxHp,p.maxHp);p.maxMp=bounded(v.max_mp,restoreStarter?.mp|| (p.classId==="archer"?archer.STARTER.mp:p.classId==="mage"?65:40),999999,restoreStarter?.mp|| (p.classId==="archer"?archer.STARTER.mp:p.classId==="mage"?65:40));p.mp=bounded(v.mp,0,p.maxMp,p.maxMp);p.atk=bounded(v.attack,restoreStarter?.atk|| (p.classId==="archer"?archer.STARTER.atk:p.classId==="mage"?25:p.classId==="tank"?16:22),999999,restoreStarter?.atk|| (p.classId==="archer"?archer.STARTER.atk:p.classId==="mage"?25:p.classId==="tank"?16:22));p.def=bounded(v.defense,restoreStarter?.def|| (p.classId==="archer"?archer.STARTER.def:p.classId==="mage"?8:10),999999,restoreStarter?.def|| (p.classId==="archer"?archer.STARTER.def:p.classId==="mage"?8:10));p.potions=bounded(v.potions,0,999999,3);p.manaPotions=bounded(v.mana_potions,0,999999,2);p.smallHealth=bounded(v.small_health,0,999999,p.potions);p.mediumHealth=bounded(v.medium_health,0,999999,0);p.largeHealth=bounded(v.large_health,0,999999,0);p.smallMana=bounded(v.small_mana,0,999999,p.manaPotions);p.mediumMana=bounded(v.medium_mana,0,999999,0);p.largeMana=bounded(v.large_mana,0,999999,0);p.tauntTurns=0;p.damageAmpTurns=0;p.damageReductionTurns=0;p.weapon=String(v.weapon||p.weapon).slice(0,40);p.armor=String(v.armor||p.armor).slice(0,40);p.inventory=loot.normalizeInventory(v.inventory,shopItems);p.weaponItem=loot.canonical(v.weapon_item,shopItems)||shopItems.find(x=>x.name===p.weapon&&x.slot==="weapon")||null;p.armorItem=loot.canonical(v.armor_item,shopItems)||shopItems.find(x=>x.name===p.armor&&x.slot==="armor")||null;for(const it of p.inventory){if(it.equippedSlot==="main"){p.weaponItem=it;p.weapon=it.name}else if(it.equippedSlot==="chest"){p.armorItem=it;p.armor=it.name}}
// Link legacy equipped shop gear to its inventory instance, preserving unique identity.
 for(const [slot,key] of [["main","weaponItem"],["chest","armorItem"]]){
  if(p[key]&&!p.inventory.some(it=>it.equippedSlot===slot)){
   let owned=p.inventory.find(it=>it.id===p[key].id&&!it.equippedSlot);
   if(!owned){owned={...p[key],uid:require("node:crypto").randomUUID()};p.inventory.push(owned)}
   owned.equippedSlot=slot;p[key]=owned;
  }
 }p.foodItems={roast_meat:bounded(v.food_items?.roast_meat,0,9999,0),herb_stew:bounded(v.food_items?.herb_stew,0,9999,0),mana_tart:bounded(v.food_items?.mana_tart,0,9999,0)};p.foodBuffs={atk:bounded(v.food_buffs?.atk,0,99,0),def:bounded(v.food_buffs?.def,0,99,0),skill:bounded(v.food_buffs?.skill,0,99,0)};p.worldProgress=world.normalizeProgress(v.world_progress);p.gmGrants=Array.isArray(v.gm_grants)?v.gm_grants.filter(x=>x&&typeof x.requestId==="string").slice(-50):[];
 // Existing owned items count as discovered even if the prior save predates v0.44.
 const seen=new Set(p.worldProgress.lootSeen);
 for(const it of p.inventory){if(it.id)seen.add(it.id+":"+(it.rarity||"shop"))}
 p.worldProgress.lootSeen=[...seen].slice(-300);
 if(p.raceId)p.worldProgress.raceSeen=[...new Set([...(p.worldProgress.raceSeen||[]),p.raceId])];
 if(claim){verifiedCharacters.set(s.id,claim);p.verified=true}
 emit(r);cb({ok:true});
  }catch(e){if(claim)secureQueue.release(claim);cb({ok:false,error:e.status?e.message:"Unable to verify character save."})}
  finally{restoring=false}
 });
 // GM Foundation: both Secure Saves and server-owned identity must be enabled.
 s.on("gmStatus",async({accessToken}={},cb=()=>{})=>{
  const r=findRoom(s),claim=verifiedCharacters.get(s.id);
  const allowed=!!r&&!!r.players.get(s.id)?.verified&&await gm.authorize({config:gmConfig,claim,token:accessToken,authenticate:secure.authenticate});
  cb({ok:true,isGM:allowed});
 });
 s.on("gmGrant",async(input={},cb=()=>{})=>{
  const r=findRoom(s),owner=r?.players.get(s.id),claim=verifiedCharacters.get(s.id);
  if(!gmConfig.enabled||!owner?.verified||!await gm.authorize({config:gmConfig,claim,token:input.accessToken,authenticate:secure.authenticate}))
   return cb({ok:false,error:"GM authorization denied."});
  if(!gm.eligible(r))return cb({ok:false,error:"GM gifts can only be sent outside battles."});
  const targetId=typeof input.targetId==="string"?input.targetId:"";
  const recipient=gm.goodTarget(r,targetId,verifiedCharacters);
  if(!recipient)return cb({ok:false,error:"Recipient must be a verified online account in your party."});
  if(gmPending.has(targetId))return cb({ok:false,error:"A reward for that player is already processing."});
  const target=recipient.target,recipientClaim=recipient.claim;
  gmPending.add(targetId);
  try{
   // Flush existing changes; never award on a failing cloud save.
   if(!await secureQueue.persist(recipientClaim,target))return cb({ok:false,error:"Recipient cloud save is unavailable. No reward given."});
   if(findRoom(s)!==r||r.players.get(targetId)!==target||verifiedCharacters.get(targetId)!==recipientClaim||!gm.eligible(r))
    return cb({ok:false,error:"Party or recipient changed; gift cancelled."});
   const result=gm.grant(target,input,shopItems);
   if(!result.ok)return cb({ok:false,error:result.error});
   if(result.duplicate)return cb({ok:true,duplicate:true});
   const saved=await secureQueue.persist(recipientClaim,target);
   if(!saved){result.undo();return cb({ok:false,error:"Reward save failed. Changes were rolled back; check cloud saves."})}
   say(r,"👑 GM gifted "+result.receipt.name+" ×"+result.receipt.amount+" to "+target.name+".");
   // Receipt persists with recipient save; this audit event contains no secret or token.
   console.info("[GM-GRANT]",JSON.stringify({recipientUserId:recipientClaim.userId,slot:recipientClaim.slot,receipt:result.receipt}));
   emit(r);
   cb({ok:true,receipt:result.receipt});
  }catch(e){cb({ok:false,error:"GM gift failed. Check cloud save status."})}
  finally{gmPending.delete(targetId)}
 });
 s.on("rollRace",(_,cb=()=>{})=>{const r=findRoom(s),p=r?.players.get(s.id);if(!r||!p)return cb({ok:false,error:"Join a party first."});if((p.racePoints||0)<1)return cb({ok:false,error:"You need 1 Race Point."});p.racePoints--;const total=races.reduce((n,x)=>n+x.weight,0);let roll=Math.random()*total,chosen=races[0];for(const x of races){roll-=x.weight;if(roll<=0){chosen=x;break}}applyRace(p,chosen.id);p.worldProgress=world.normalizeProgress(p.worldProgress);
 p.worldProgress.raceSeen=[...new Set([...(p.worldProgress.raceSeen||[]),chosen.id])].slice(-300);
 say(r,p.name+" awakened the "+chosen.name+" bloodline ("+chosen.rarity.toUpperCase()+")!");emit(r);cb({ok:true,race:{id:chosen.id,name:chosen.name,rarity:chosen.rarity,icon:chosen.icon,passive:chosen.passive,buffs:chosen.buffs},racePoints:p.racePoints})});
 s.on("travelRegion",({regionIndex}={},cb=()=>{})=>{
  const r=findRoom(s);if(!r)return cb({ok:false,error:"Join a party first."});
  if([...r.players.keys()][0]!==s.id)return cb({ok:false,error:"Only the party leader can choose a region."});
  if(!["city","regionClear","defeat"].includes(r.status))return cb({ok:false,error:"Finish the current encounter or return to the city."});
  const index=Number(regionIndex),region=Number.isInteger(index)?world.regions[index]:null;
  if(!region)return cb({ok:false,error:"Unknown region."});
  const blocked=[...r.players.values()].filter(p=>!world.canEnter(p.level,index));
  if(blocked.length)return cb({ok:false,error:"Region locked: "+blocked.map(p=>p.name).join(", ")+" must reach LV "+region.requiredLevel+"."});
  r.regionIndex=index;r.stage=region.firstStage;r.monster=null;r.enemies=[];
  say(r,"Party traveled from the Central City to "+region.name+".");start(r);emit(r);
  cb({ok:true,regionId:region.id,stage:r.stage});
 });
 s.on("returnCity",(_,cb=()=>{})=>{
  const r=findRoom(s);if(!r)return cb({ok:false,error:"Join a party first."});
  if([...r.players.keys()][0]!==s.id)return cb({ok:false,error:"Only the party leader can return to the city."});
  if(r.status==="battle")return cb({ok:false,error:"Finish the battle first."});
  r.status="city";r.shopOrigin=null;r.shopCategory=null;r.monster=null;r.enemies=[];r.stage=world.regions[r.regionIndex].firstStage;
  for(const p of r.players.values()){p.hp=p.maxHp;p.mp=p.maxMp;p.cooldowns={}}
  say(r,"The party returned to the Central City and rested.");emit(r);cb({ok:true});
 });
 s.on("startBattle",(_,cb=()=>{})=>{const r=findRoom(s);if(!r)return cb({ok:false,error:"Join a room first."});if([...r.players.keys()][0]!==s.id)return cb({ok:false,error:"Only party leader can start."});if(r.status!=="city")return cb({ok:false,error:"Return to the city to start a region."});if(secure.enabled&&[...r.players.values()].some(p=>!p.verified&&!p.guest))return cb({ok:false,error:"All signed-in heroes must finish secure restore first."});if(multi.hasMissing(r))return cb({ok:false,error:"Wait for disconnected party members to return."});if([...r.players.values()].some(p=>!world.canEnter(p.level,r.regionIndex)))return cb({ok:false,error:"A party member does not meet this region\u0027s level requirement."});r.stage=world.regions[r.regionIndex].firstStage;start(r);say(r,"The party sets out into "+world.regions[r.regionIndex].name+".");emit(r);cb({ok:true})});
 s.on("action",({type,targetId,actionId}={},cb=()=>{})=>{
 const r=findRoom(s);if(!r)return cb({ok:false,error:"Join a room first."});
 if(!multi.isValidActionId(actionId))return cb({ok:false,error:"Invalid action ID."});
 const actor=r.reconnectSessions?.get(s.id)?.identity||s.id;
 const fingerprint=JSON.stringify([type,targetId||null]);
 const prior=multi.lookup(r,actor,actionId,fingerprint);
 if(prior)return cb(prior);
 const respond=cb;
 cb=reply=>{multi.remember(r,actor,actionId,fingerprint,reply);respond(reply)};
 if(!valid(s,r))return cb({ok:false,error:multi.hasMissing(r)?"Party paused while a player reconnects.":"Wait for your turn."});
 const acting=r.players.get(s.id);
 const aoe=skillCore.isAreaSkill(acting,type);
 if(aoe)r.monster=pack.alive(r)[0]||r.monster;
 else if(targetId&&!(pack.select(r,String(targetId))))return cb({ok:false,error:"Enemy is already defeated."});
 const p=r.players.get(s.id),m=r.monster;
 // Reject invalid commands before DOT/status ticks; clients cannot spam rejected
 // skill requests to drain HP or advance status effects.
 const invalid=combat.validateAction(p,type,r);
 if(invalid)return cb({ok:false,error:invalid});
 const tick=combat.beforeAction(r,p,say);
 if(tick.skip){
  const previousIndex=r.turnIndex;
  if(alive(r).length)nextTurn(r);else{r.status="defeat";say(r,"The party has fallen.")}
  if(r.status==="battle"&&r.turnIndex<=previousIndex){enemyCounterAfterBeat(r);emit(r);return cb({ok:true,skipped:true});}
  skipFallenTurn(r);combat.applyDefeatPenalty(r,say);emit(r);return cb({ok:true,skipped:true});
 }
 let d=0;const rangedAction=p.classId==="archer"&&["attack","skill","skill2","skill3","skill4","skill5","skill6","skill7"].includes(type);const assassinAction=p.classId==="assassin"&&["attack","skill","skill2","skill3","skill4","skill5","skill6","skill7"].includes(type);
 const archerCrit=rangedAction?archer.crit({random:Math.random}):assassinAction?assassinClass.crit({random:Math.random}):{critical:false,multiplier:1};
 const race=raceById(p.raceId),lowHp=p.hp/p.maxHp<=.5,pathDamage=p.classPath==="berserker"&&lowHp?1.1:1,foodAttack=p.foodBuffs?.atk>0?1.15:1,damageBonus=((p.raceId==="orc"&&lowHp)?1.08:1)*pathDamage*foodAttack*(p._combatAttackMultiplier||1)*archerCrit.multiplier;
 if(type==="attack"){d=formulas.basicAttack({attack:p.atk,defense:m.def,randomRoll:Math.floor(Math.random()*8),attackMultiplier:damageBonus,elementMultiplier:combat.elementMultiplier(m,weaponPassives.attackElement(p,type,"physical")),vulnerable:m.vulnerableTurns>0});m.hp=Math.max(0,m.hp-d);if(p.foodBuffs?.atk>0)p.foodBuffs.atk--;say(r,p.name+" attacks for "+d+" damage.");if(p.raceId==="beastkin"&&Math.random()<.1){p.mp=Math.min(p.maxMp,p.mp+3);say(r,p.name+" triggers Predator Instinct and recovers 3 MP!")}}
 else if(skillCore.SKILL_TYPES.includes(type)){const sk=skillCore.definition(p,type),cost=p.raceId==="elf"?Math.floor(sk.cost*.95):sk.cost;if((p.cooldowns?.[type]||0)>0)return cb({ok:false,error:"Skill is on cooldown for "+p.cooldowns[type]+" more round(s)."});if(p.level<sk.unlock)return cb({ok:false,error:"Unlocks at level "+sk.unlock+"."});if(p.mp<cost)return cb({ok:false,error:"Not enough MP."});p.mp-=cost;if(p.foodBuffs?.skill>0)sk.mult*=1.1;p.cooldowns=p.cooldowns||{};p.cooldowns[type]=sk.cd;if(p.foodBuffs?.skill>0)p.foodBuffs.skill--;if(p.classPath==="warlock"){const leech=Math.max(1,Math.ceil(p.maxMp*.05));p.mp=Math.min(p.maxMp,p.mp+leech);say(r,p.name+" leeches "+leech+" MP through Soul Leech.")}if(p.classPath==="paladin"){const holy=Math.max(1,Math.ceil(p.maxHp*.05));p.hp=Math.min(p.maxHp,p.hp+holy);say(r,p.name+" restores "+holy+" HP through Holy Vigor.")}if(p.classId==="priest"&&sk.utility){priestClass.castUtility(type,r,p,say);}else{d=formulas.skillAttack({attack:p.atk,defense:m.def,skillMultiplier:sk.mult,randomRoll:Math.floor(Math.random()*12),attackMultiplier:damageBonus,elementMultiplier:combat.elementMultiplier(m,weaponPassives.attackElement(p,type,combat.skillElement(p,type))),vulnerable:m.vulnerableTurns>0,archmage:p.classPath==="archmage"});if(type==="skill7"&&p.classId==="archer")d+=archer.finisher(m,d);
if(type==="skill4"&&p.classId==="assassin")d+=assassinClass.finisher(m,d);m.hp=Math.max(0,m.hp-d);if(p.foodBuffs?.atk>0)p.foodBuffs.atk--;if(type==="skill3"&&p.classId==="tank"){p.tauntTurns=3;say(r,p.name+" uses PROVOKE! Monsters will target the Tank for 3 enemy turns.")}else if(type==="skill5"){if(p.classId==="assassin"){m.vulnerableTurns=Math.max(m.vulnerableTurns||0,2);say(r,p.name+" exposes "+m.name+" for two turns.");}else if(p.classId==="tank"){p.damageReductionTurns=3;say(r,p.name+" activates AEGIS PACT: damage taken reduced by 20% for 3 enemy turns.");combat.aegis(r,p,say)}else{m.vulnerableTurns=3;say(r,p.name+" uses "+sk.name+"! The monster takes 20% more damage for 3 rounds.")}}if(type==="skill3"&&p.classId==="assassin"){combat.debuffMonster(m,"weaken",1);say(r,p.name+" weakens "+m.name+"'s next attack.");}
if(type==="skill6"&&p.classId==="assassin"){p.damageReductionTurns=Math.max(p.damageReductionTurns||0,2);say(r,p.name+" uses SMOKE STEP and braces against incoming damage.");}
if(type==="skill3"&&p.classId==="archer"){combat.debuffMonster(m,"weaken",1);say(r,p.name+" pins "+m.name+" with a weakening arrow!")}if(type==="skill3"&&p.classId==="mage"){combat.debuffMonster(m,"chill",1);say(r,p.name+" chills the enemy, reducing its next attack.");const heal=Math.ceil(p.maxHp*.1);p.hp=Math.min(p.maxHp,p.hp+heal);say(r,p.name+" uses FROST NOVA for "+d+" damage and restores "+heal+" HP!")}else{if(type==="skill3"&&p.classId==="swordsman"){p.damageReductionTurns=Math.max(p.damageReductionTurns||0,2);combat.debuffMonster(m,"weaken",2);say(r,p.name+" breaks the enemy rhythm: weaker damage for two attacks.")}say(r,p.name+" uses "+sk.name+" for "+d+" damage!"+(type==="skill3"&&p.classId==="swordsman"?" DEFENSE UP for two enemy attacks.":""))}}}
 else if(["heal","healSmall","healMedium","healLarge"].includes(type)){const tier=type==="healLarge"?"large":type==="healMedium"?"medium":"small",key=tier+"Health",pct=tier==="large"?.5:tier==="medium"?.35:.2;if((p[key]||0)<1||p.hp===p.maxHp)return cb({ok:false,error:"No potion of this size or HP is full."});p[key]--;p.potions=Math.max(0,(p.potions||0)-(tier==="small"?1:0));const n=Math.min(Math.ceil(p.maxHp*pct),p.maxHp-p.hp);p.hp+=n;say(r,p.name+" uses "+tier.toUpperCase()+" Health Potion and restores "+n+" HP.")}
 else if(["mana","manaSmall","manaMedium","manaLarge"].includes(type)){const tier=type==="manaLarge"?"large":type==="manaMedium"?"medium":"small",key=tier+"Mana",pct=tier==="large"?.5:tier==="medium"?.35:.2;if((p[key]||0)<1||p.mp===p.maxMp)return cb({ok:false,error:"No mana potion of this size or MP is full."});p[key]--;p.manaPotions=Math.max(0,(p.manaPotions||0)-(tier==="small"?1:0));const n=Math.min(Math.ceil(p.maxMp*pct),p.maxMp-p.mp);p.mp+=n;say(r,p.name+" uses "+tier.toUpperCase()+" Mana Potion and restores "+n+" MP.")}
 else if(type==="food_roast"||type==="food_stew"||type==="food_tart"){const key=type==="food_roast"?"roast_meat":type==="food_stew"?"herb_stew":"mana_tart";if((p.foodItems?.[key]||0)<1)return cb({ok:false,error:"You do not have this food."});p.foodItems[key]--;p.foodBuffs=p.foodBuffs||{atk:0,def:0,skill:0};if(key==="roast_meat"){p.foodBuffs.atk=3;say(r,p.name+" eats Dragonpepper Roast: +15% damage for 3 attacks.")}else if(key==="herb_stew"){p.foodBuffs.def=3;say(r,p.name+" eats Guardian Herb Stew: -20% damage for the next 3 hits.")}else{const restored=Math.min(Math.ceil(p.maxMp*.3),p.maxMp-p.mp);p.mp+=restored;p.foodBuffs.skill=3;say(r,p.name+" eats Moonberry Tart: restores "+restored+" MP and boosts the next 3 skills by 10%.")}}else if(type==="guard"){p.mp=Math.min(p.maxMp,p.mp+8);combat.guard(r,p,say);say(r,p.name+" recovers 8 MP.")}
 else if(type==="break"){
  const cost=p.raceId==="elf"?14:15;p.mp-=cost;p.cooldowns=p.cooldowns||{};p.cooldowns.break=3;
  d=formulas.breakAttack({attack:p.atk,defense:m.def,randomRoll:Math.floor(Math.random()*5),attackMultiplier:damageBonus,vulnerable:m.vulnerableTurns>0});
  m.hp=Math.max(0,m.hp-d);say(r,p.name+" uses BREAK STRIKE for "+d+" damage and a heavy Stagger impact.");
 }else if(type==="cleanse"){
  const cost=p.raceId==="elf"?11:12;p.mp-=cost;p.cooldowns=p.cooldowns||{};p.cooldowns.cleanse=3;
  combat.cleanse(r,p,say);
 }else return cb({ok:false,error:"Unknown action."});
 if(archerCrit.critical&&d>0){
  say(r,"🎯 CRITICAL HIT! "+p.name+(p.classId==="assassin"?" lands a dagger strike.":" lands a precision shot."));
  r.weaponFxSeq=(r.weaponFxSeq||0)+1;
  r.weaponFx=(r.weaponFx||[]).concat([{id:r.weaponFxSeq,enemyId:m.enemyId||null,
   element:"physical",kind:"critical",label:p.classId==="assassin"?"CRITICAL DAGGER":"CRITICAL SHOT",amount:d}]).slice(-16);
 }
 if(d>0&&["attack","skill","skill2","skill3","skill4","skill5","skill6","skill7"].includes(type))
  weaponPassives.applyPassive({room:r,player:p,target:m,baseDamage:d,action:type,random:Math.random,say,combat});
 // Server-authoritative AoE: primary full damage, other living enemies
 // receive 65% with their individual armour and elemental resistance.
 if(aoe&&d>0){
  let struck=1;
  for(const other of pack.alive(r)){
   if(other===m)continue;
   const element=weaponPassives.attackElement(p,type,combat.skillElement(p,type));
   const hit=formulas.areaSplash({primaryDamage:d,attack:p.atk,primaryDefense:m.def,secondaryDefense:other.def,
    primaryElement:combat.elementMultiplier(m,element),secondaryElement:combat.elementMultiplier(other,element),
    skillMultiplier:skillCore.areaMultiplier(type,p)});
   other.hp=Math.max(0,other.hp-hit);
   if(type==="skill3"&&p.classId==="mage"&&other.hp>0)combat.debuffMonster(other,"chill",1);
   struck++;say(r,p.name+" hits "+other.name+" with AoE for "+hit+" damage.");
  }
  say(r,"✦ AREA ATTACK · "+struck+" enemies struck.");
 }
 // All damaging actions build a persistent Stagger bar. Only a charged attack
 // can be interrupted. The boss resists subsequent interrupts briefly.
 if(["attack","skill","skill2","skill3","skill4","skill5","break"].includes(type)&&m.hp>0)
  combat.addStagger(r,p,type,weaponPassives.attackElement(p,type,combat.skillElement(p,type)),say);
 if(m.hp<=0||pack.alive(r).length===0){
 for(const fallen of r.enemies.filter(x=>x.hp<=0&&!x.defeatAnnounced)){fallen.defeatAnnounced=true;say(r,"☠ "+fallen.name+" defeated!");}
 if(pack.deadTarget(r)){finish(r);emit(r);return cb({ok:true})}
}
combat.checkPhase(r,say);const previousIndex=r.turnIndex;nextTurn(r);if(r.status==="battle"&&r.turnIndex<=previousIndex){enemyCounterAfterBeat(r);emit(r);return cb({ok:true});}skipFallenTurn(r);emit(r);cb({ok:true});});
 s.on("openShop",({category}={},cb=()=>{})=>{
  const r=findRoom(s);
  if(!r)return cb({ok:false,error:"Room not found."});
  if([...r.players.keys()][0]!==s.id)return cb({ok:false,error:"Only party leader can open shop."});
  const status=r.status;
  const fromCity=status==="city"||(status==="shop"&&r.shopOrigin==="city");
  // Exactly one roadside merchant per region, after defeating its mini-boss:
  // local stages 4, 9, 14, 19, 24, 29, 34, 39 only.
  const miniCleared=r.stage%5===4&&!!r.monster?.miniBoss;
  const fromCamp=(status==="victory"&&miniCleared)||(status==="shop"&&r.shopOrigin==="camp"&&miniCleared);
  if(!fromCity&&!fromCamp)return cb({ok:false,error:"Traveling merchant appears only after defeating the mini-boss in stage 4 of a region."});
  const cat=fromCamp?"potion":String(category||"potion");
  if(!["weapon","armor","potion"].includes(cat))return cb({ok:false,error:"Unknown shop category."});
  r.shopOrigin=fromCamp?"camp":"city";
  if(fromCamp&&status!=="shop")r.shopReturnStatus=status;
  r.shopCategory=cat;
  r.status="shop";
  say(r,fromCamp?"The traveling merchant has set up camp after stage "+r.stage+".":"The party visits the "+(cat==="weapon"?"weaponsmith":cat==="armor"?"armorer":"supplies merchant")+".");
  emit(r);cb({ok:true});
 });
 // Closing a merchant never calls returnCity or resets the dungeon.
 s.on("closeShop",(_,cb=()=>{})=>{
  const r=findRoom(s);
  if(!r)return cb({ok:false,error:"Join a party first."});
  if([...r.players.keys()][0]!==s.id)return cb({ok:false,error:"Only the party leader may close the shared merchant."});
  if(r.status!=="shop")return cb({ok:false,error:"The party is not visiting a shop."});
  const roadside=r.shopOrigin==="camp";
  r.status=roadside&&["victory","regionClear"].includes(r.shopReturnStatus)?r.shopReturnStatus:"city";
  r.shopOrigin=null;r.shopCategory=null;r.shopReturnStatus=null;
  say(r,roadside?"The party leaves the roadside merchant and continues its adventure.":"The merchant closes. The party remains in the Central City.");
  emit(r);cb({ok:true});
 });
 s.on("buyItem",({itemId}={},cb=()=>{})=>{const r=findRoom(s),p=r?.players.get(s.id);if(!r||!p)return cb({ok:false,error:"Join a party first."});if(r.status!=="shop")return cb({ok:false,error:"Merchant is not here."});const it=shopItems.find(x=>x.id===itemId);if(!it)return cb({ok:false,error:"Item not found."});const allowed=r.shopCategory==="potion"?["potion","food"]:[r.shopCategory||"potion"];if(!allowed.includes(it.category))return cb({ok:false,error:"This shop does not sell that item."});if(it.slot==="weapon"){const gate=weaponCatalog.checkPurchase(p,it);if(!gate.ok)return cb(gate)}if(it.class&&it.class!==p.classId)return cb({ok:false,error:"This equipment is for another class."});if(it.slot==="armor"){const armorGate=armorCatalog.checkPurchase(p,it);if(!armorGate.ok)return cb(armorGate)}if(p.level<(it.level||1))return cb({ok:false,error:"Requires level "+it.level+"."});if(p.gold<it.price)return cb({ok:false,error:"Not enough gold."});if((it.slot==="weapon"||it.slot==="armor")&&loot.bagUsed(p)>=40)return cb({ok:false,error:"Inventory full (40/40). Free a slot before buying equipment."});p.gold-=it.price;if(itemId==="health_potion"){p.potions++;p.smallHealth=(p.smallHealth||0)+1}else if(itemId==="health_medium")p.mediumHealth=(p.mediumHealth||0)+1;else if(itemId==="health_large")p.largeHealth=(p.largeHealth||0)+1;else if(itemId==="mana_potion"){p.manaPotions++;p.smallMana=(p.smallMana||0)+1}else if(itemId==="mana_medium")p.mediumMana=(p.mediumMana||0)+1;else if(itemId==="mana_large")p.largeMana=(p.largeMana||0)+1;else if(it.category==="food"){p.foodItems=p.foodItems||{};p.foodItems[itemId]=(p.foodItems[itemId]||0)+1}else if(it.slot==="weapon"||it.slot==="armor"){p.inventory=p.inventory||[];p.inventory.push({...it,uid:require("node:crypto").randomUUID()});p.worldProgress=world.normalizeProgress(p.worldProgress);p.worldProgress.lootSeen=[...new Set([...(p.worldProgress.lootSeen||[]),it.id+":shop"])].slice(-300)}say(r,p.name+" bought "+it.name+".");emit(r);cb({ok:true})});
 s.on("equipItem",({itemId,targetSlot}={},cb=()=>{})=>{const r=findRoom(s),p=r?.players.get(s.id);if(!r||!p)return cb({ok:false,error:"Join a party first."});if(!["city","shop","victory","regionClear"].includes(r.status))return cb({ok:false,error:"Equipment can only be changed between battles."});const result=loot.equip(p,itemId,targetSlot,shopItems);if(result.ok){say(r,p.name+" equipped "+(p.inventory.find(i=>i.uid===result.itemUid)?.name||"equipment")+".");emit(r)}cb(result)});
 s.on("unequipItem",({slot}={},cb=()=>{})=>{const r=findRoom(s),p=r?.players.get(s.id);if(!r||!p)return cb({ok:false,error:"Join a party first."});if(!["city","shop","victory","regionClear"].includes(r.status))return cb({ok:false,error:"Equipment can only be changed between battles."});const result=loot.unequip(p,String(slot||""));if(result.ok){say(r,p.name+" unequipped "+slot+".");emit(r)}cb(result)});

 s.on("discardItem",({uid}={},cb=()=>{})=>{const r=findRoom(s),p=r?.players.get(s.id);if(!r||!p)return cb({ok:false,error:"Join a party first."});if(!["city","shop","victory","regionClear"].includes(r.status))return cb({ok:false,error:"Items can only be discarded between battles."});const index=(p.inventory||[]).findIndex(it=>it.uid===String(uid||""));if(index<0)return cb({ok:false,error:"Item not found in bag."});const item=p.inventory[index];if(item.equippedSlot||(p.weaponItem&&p.weaponItem.uid===item.uid)||(p.armorItem&&p.armorItem.uid===item.uid))return cb({ok:false,error:"Unequip this item first."});p.inventory.splice(index,1);say(r,p.name+" discarded "+item.name+".");emit(r);cb({ok:true})});
 s.on("nextStage",(_,cb=()=>{})=>{const r=findRoom(s);if(!r)return cb({ok:false,error:"Room not found."});if([...r.players.keys()][0]!==s.id)return cb({ok:false,error:"Only party leader can continue."});if(r.status!=="victory"||r.stage%5===0)return cb({ok:false,error:"Finish a non-boss stage before advancing."});r.stage++;start(r);say(r,"The party advances to stage "+r.stage+" of "+world.totalStages+".");emit(r);cb({ok:true})});
 s.on("restart",(_,cb=()=>{})=>{const r=findRoom(s);if(!r)return cb({ok:false,error:"Room not found."});if([...r.players.keys()][0]!==s.id)return cb({ok:false,error:"Only party leader can restart."});if(r.status==="battle")return cb({ok:false,error:"Cannot reset a dungeon during an active battle."});r.stage=world.regions[r.regionIndex].firstStage;r.status="city";r.monster=null;r.enemies=[];for(const p of r.players.values()){p.hp=p.maxHp;p.mp=p.maxMp}r.log=["Returned to the Central City. Your hero progress and equipment are kept."];emit(r);cb({ok:true})});
 s.on("chooseClassPath",({path:chosen}={},cb=()=>{})=>{const r=findRoom(s),p=r?.players.get(s.id);if(!r||!p)return cb({ok:false,error:"Join a party first."});if(p.level<15)return cb({ok:false,error:"Class specialization unlocks at level 15."});const choices={swordsman:["berserker","knight"],mage:["archmage","warlock"],tank:["guardian","paladin"]};if(!choices[p.classId]?.includes(chosen))return cb({ok:false,error:"Invalid specialization for this class."});if(p.classPath)return cb({ok:false,error:"You have already chosen your path."});p.classPath=chosen;p.className=({berserker:"Berserker",knight:"Knight",archmage:"Archmage",warlock:"Warlock",guardian:"Guardian",paladin:"Paladin"})[chosen];if(chosen==="guardian"){p.maxHp+=50;p.hp+=50;p.def+=6}else if(chosen==="paladin"){p.maxHp+=25;p.hp+=25;p.def+=3;p.atk+=6;p.maxMp+=10;p.mp+=10}else if(chosen==="berserker"){p.atk+=6;p.def=Math.max(1,p.def-2)}else if(chosen==="knight"){p.def+=5;p.maxHp+=20;p.hp+=20}else if(chosen==="archmage"){p.maxMp+=30;p.mp+=30;p.atk+=4}else if(chosen==="warlock"){p.atk+=6;p.maxHp+=10;p.hp+=10}say(r,p.name+" chose the "+p.className+" path!");emit(r);cb({ok:true})});
 s.on("allocateStat",({stat}={},cb=()=>{})=>{const r=findRoom(s),p=r?.players.get(s.id);if(!r||!p)return cb({ok:false,error:"Join a party first."});if((p.statPoints||0)<1)return cb({ok:false,error:"No stat points available."});const key=String(stat||"");if(!["strength","vitality","intelligence","agility"].includes(key))return cb({ok:false,error:"Unknown stat."});p.statPoints--;p[key]=(p[key]||0)+1;if(key==="strength")p.atk+=2;if(key==="vitality"){p.maxHp+=12;p.hp+=12}if(key==="intelligence"){p.maxMp+=10;p.mp+=10}if(key==="agility")p.speed=(p.speed||10)+2;say(r,p.name+" increased "+key.toUpperCase()+".");emit(r);cb({ok:true})});
 s.on("partyChat",({message}={},cb=()=>{})=>{const r=findRoom(s),p=r?.players.get(s.id);if(!r||!p)return cb({ok:false,error:"Join a party first."});const body=String(message||"").replace(/[<>]/g,"").trim().slice(0,180);if(!body)return cb({ok:false,error:"Message is empty."});r.chat=r.chat||[];r.chat.push({name:p.name,id:p.id,message:body,time:Date.now()});if(r.chat.length>60)r.chat.shift();emit(r);cb({ok:true})});
 s.on("disconnect",()=>{
  const r=findRoom(s);
  if(r&&multi.markDisconnected(r,s.id,{schedule:setTimeout,onExpire:(room,id,p)=>{
   const claim=verifiedCharacters.get(id);
   verifiedCharacters.delete(id);
   if(claim){secureQueue.persist(claim,p).finally(()=>secureQueue.release(claim))}
   const keys=[...room.players.keys()],index=keys.indexOf(id);
   if(index<0)return;
   room.players.delete(id);
   if(!room.players.size){rooms.delete(room.code);return}
   if(index<room.turnIndex)room.turnIndex--;
   else if(index===room.turnIndex)room.turnIndex%=room.players.size;
   if(room.status==="battle"){
    if(!alive(room).length){room.status="defeat";combat.applyDefeatPenalty(room,say)}
    else skipFallenTurn(room);
   }
   say(room,p.name+" did not reconnect; the party continues.");
   emit(room);
  }})){
   say(r,r.players.get(s.id).name+" disconnected. Battle paused for up to 2 minutes.");
   emit(r);return;
  }
  const claim=verifiedCharacters.get(s.id);
  verifiedCharacters.delete(s.id);
  if(claim)secureQueue.release(claim);
 });

});
server.listen(PORT,()=>console.log("SOULBOUND Online v0.40.0 running on "+PORT));

const express=require("express"),http=require("http"),path=require("path");
const {Server}=require("socket.io");const loot=require("./loot-v034");const app=express(),server=http.createServer(app),io=new Server(server),PORT=process.env.PORT||3000;
app.use(express.static(path.join(__dirname,"public")));app.get("/health",(_,res)=>res.json({ok:true,game:"SOULBOUND Online",version:"0.56.3"}));
const world=require("./world-v040");const combat=require("./combat-v055");const pack=world.encounterPack;const rooms=new Map();
const normal=[{name:"Mossfang Wolf",sprite:"mossfang-wolf",icon:"🐺",hp:90,atk:12,def:2,xp:35,gold:18},{name:"Goblin Raider",sprite:"goblin-raider",icon:"👺",hp:115,atk:15,def:4,xp:45,gold:24},{name:"Grave Beetle",sprite:"grave-beetle",icon:"🪲",hp:140,atk:17,def:5,xp:55,gold:30},{name:"Cursed Knight",sprite:"cursed-knight",icon:"💀",hp:165,atk:19,def:7,xp:65,gold:36},{name:"Wisp Stalker",sprite:"wisp-stalker",icon:"👻",hp:185,atk:21,def:8,xp:75,gold:42}];
const bosses=[{name:"The Briarfang Alpha",sprite:"boss-briarfang",icon:"🐺",hp:260,atk:22,def:7,xp:130,gold:90},{name:"Dreadforge Champion",sprite:"boss-dreadforge",icon:"🛡️",hp:390,atk:29,def:10,xp:180,gold:125},{name:"Ember Tyrant",sprite:"boss-ember-tyrant",icon:"🐉",hp:540,atk:36,def:13,xp:240,gold:165},{name:"The Hollow Oracle",sprite:"boss-hollow-oracle",icon:"🔮",hp:690,atk:42,def:16,xp:300,gold:210},{name:"Glacier Warden",sprite:"boss-glacier-warden",icon:"🧊",hp:850,atk:48,def:19,xp:370,gold:260},{name:"Ancient World-Eater",sprite:"boss-world-eater",icon:"🗿",hp:1030,atk:55,def:22,xp:450,gold:320},{name:"The Void Reaper",sprite:"boss-void-reaper",icon:"☠️",hp:1240,atk:62,def:25,xp:540,gold:390},{name:"Eclipse Sovereign",sprite:"boss-eclipse-sovereign",icon:"👑",hp:1500,atk:72,def:29,xp:700,gold:500}];
const shopItems=[{id:"health_potion",name:"Small Health Potion",icon:"🧪",description:"Restore 20% Max HP",price:35},{id:"health_medium",name:"Medium Health Potion",icon:"🧪",description:"Restore 35% Max HP",price:65},{id:"health_large",name:"Large Health Potion",icon:"🧪",description:"Restore 50% Max HP",price:100},{id:"mana_potion",name:"Small Mana Potion",icon:"🔷",description:"Restore 20% Max MP",price:30},{id:"mana_medium",name:"Medium Mana Potion",icon:"🔷",description:"Restore 35% Max MP",price:60},{id:"mana_large",name:"Large Mana Potion",icon:"🔷",description:"Restore 50% Max MP",price:90},{id:"iron_sword",name:"Iron Sword",icon:"⚔️",description:"+8 ATK · Swordsman · Lv 1",price:120,class:"swordsman",slot:"weapon",value:8,level:1},{id:"arcane_staff",name:"Arcane Staff",icon:"🪄",description:"+8 ATK · Mage · Lv 1",price:120,class:"mage",slot:"weapon",value:8,level:1},{id:"iron_mace",name:"Iron Mace",icon:"🔨",description:"+8 ATK · Tank · Lv 1",price:120,class:"tank",slot:"weapon",value:8,level:1},{id:"steel_blade",name:"Steel Blade",icon:"🗡️",description:"+16 ATK · Swordsman · Lv 3",price:320,class:"swordsman",slot:"weapon",value:16,level:3},{id:"crystal_staff",name:"Crystal Staff",icon:"🔮",description:"+17 ATK · Mage · Lv 3",price:340,class:"mage",slot:"weapon",value:17,level:3},{id:"warhammer",name:"Warhammer",icon:"⚒️",description:"+16 ATK · Tank · Lv 3",price:330,class:"tank",slot:"weapon",value:16,level:3},{id:"knight_greatsword",name:"Knight Greatsword",icon:"⚔️",description:"+28 ATK · Swordsman · Lv 8",price:780,class:"swordsman",slot:"weapon",value:28,level:8},{id:"starweave_staff",name:"Starweave Staff",icon:"🌟",description:"+30 ATK · Mage · Lv 8",price:820,class:"mage",slot:"weapon",value:30,level:8},{id:"titan_maul",name:"Titan Maul",icon:"🔨",description:"+29 ATK · Tank · Lv 8",price:800,class:"tank",slot:"weapon",value:29,level:8},{id:"iron_armor",name:"Iron Armor",icon:"🛡️",description:"+5 DEF · +20 HP · Lv 1",price:140,slot:"armor",defense:5,maxHp:20,level:1},{id:"sage_robe",name:"Sage Robe",icon:"🥋",description:"+3 DEF · +20 MP · Lv 1",price:140,slot:"armor",defense:3,maxMp:20,level:1},{id:"guardian_plate",name:"Guardian Plate",icon:"🛡️",description:"+12 DEF · +55 HP · Lv 5",price:520,slot:"armor",defense:12,maxHp:55,level:5},{id:"archmage_raiment",name:"Archmage Raiment",icon:"✨",description:"+8 DEF · +65 MP · Lv 5",price:540,slot:"armor",defense:8,maxMp:65,level:5},{id:"dragon_scale",name:"Dragon Scale Armor",icon:"🐉",description:"+20 DEF · +100 HP · Lv 12",price:1300,slot:"armor",defense:20,maxHp:100,level:12},{id:"void_mantle",name:"Void Mantle",icon:"🌌",description:"+16 DEF · +110 MP · Lv 12",price:1350,slot:"armor",defense:16,maxMp:110,level:12},{id:"roast_meat",name:"Dragonpepper Roast",icon:"🍖",description:"+15% ATK for next 3 attacks",price:75,category:"food"},{id:"herb_stew",name:"Guardian Herb Stew",icon:"🍲",description:"Reduce next 3 hits by 20%",price:75,category:"food"},{id:"mana_tart",name:"Moonberry Tart",icon:"🥧",description:"Restore 30% Max MP + boost next 3 skills by 10%",price:85,category:"food"}];
const scenes=[{name:"THE CURSED WILDS",hint:"Ancient trees whisper in the dark.",css:"wilds"},{name:"FALLEN KINGDOM",hint:"Broken towers watch your every move.",css:"ruins"},{name:"EMBER CAVERNS",hint:"Heat shimmers above the black stone.",css:"cavern"},{name:"FROSTBOUND PASS",hint:"A cold wind sweeps across the ice.",css:"frost"},{name:"THE VOID",hint:"Something stirs beyond the veil.",css:"abyss"},{name:"ECLIPSE CITADEL",hint:"The final kingdom lies ahead.",css:"castle"}];
const races=[
{id:"human",name:"Human",rarity:"common",icon:"🧑",weight:30,hp:1,mp:1,atk:1,def:1,reduce:0,passive:"Adaptable Spirit · Gain 5% bonus EXP.",buffs:["+5% EXP"]},
{id:"beastkin",name:"Beastkin",rarity:"common",icon:"🐺",weight:30,hp:1.08,mp:1,atk:1.04,def:1,reduce:0,passive:"Predator Instinct · 10% chance to recover 3 MP on hit.",buffs:["+8% Max HP","+4% ATK"]},
{id:"elf",name:"High Elf",rarity:"rare",icon:"🧝",weight:12.5,hp:1,mp:1.18,atk:1.04,def:1,reduce:0,passive:"Arcane Flow · Skills cost 5% less MP.",buffs:["+18% Max MP","+4% ATK","-5% skill cost"]},
{id:"orc",name:"Orc",rarity:"rare",icon:"👹",weight:12.5,hp:1.12,mp:.92,atk:1.13,def:1.02,reduce:0,passive:"Blood Fury · Deal 8% more damage below 50% HP.",buffs:["+12% Max HP","+13% ATK","-8% Max MP"]},
{id:"dwarf",name:"Stoneborn",rarity:"epic",icon:"⛏️",weight:5,hp:1.2,mp:.94,atk:1,def:1.18,reduce:.03,passive:"Mountain Guard · Take 3% less damage.",buffs:["+20% Max HP","+18% DEF","-3% damage taken"]},
{id:"sylvan",name:"Sylvan",rarity:"epic",icon:"🌿",weight:5,hp:1.1,mp:1.14,atk:1.04,def:1.04,reduce:0,passive:"Verdant Blessing · Restore 3% Max HP after each victory.",buffs:["+10% Max HP","+14% Max MP","+4% ATK"]},
{id:"demon",name:"Demon",rarity:"legend",icon:"😈",weight:2,hp:.96,mp:1.08,atk:1.22,def:1,reduce:0,passive:"Hellfire · Deal 22% more damage, but have less HP.",buffs:["+22% ATK","+8% Max MP","-4% Max HP"]},
{id:"dragonkin",name:"Dragonkin",rarity:"legend",icon:"🐉",weight:2,hp:1.16,mp:1.05,atk:1.16,def:1.1,reduce:.02,passive:"Scaled Hide · Take 2% less damage.",buffs:["+16% Max HP","+16% ATK","+10% DEF"]},
{id:"celestial",name:"Celestial",rarity:"mythic",icon:"✨",weight:.5,hp:1.15,mp:1.2,atk:1.12,def:1.1,reduce:.08,passive:"Divine Aegis · Take 8% less damage.",buffs:["+15% Max HP","+20% Max MP","+12% ATK","-8% damage taken"]},
{id:"voidborn",name:"Voidborn",rarity:"mythic",icon:"🌌",weight:.5,hp:1.08,mp:1.15,atk:1.25,def:1.04,reduce:.05,passive:"Void Hunger · Deal 25% more damage and take 5% less damage.",buffs:["+8% Max HP","+15% Max MP","+25% ATK","-5% damage taken"]}
];
function raceById(id){return races.find(x=>x.id===id)||races[0]}
function applyRace(p,newId){const old=raceById(p.raceId),next=raceById(newId),ratio=(v,a,b)=>Math.max(1,Math.round(v/a*b)),hpPct=p.hp/Math.max(1,p.maxHp),mpPct=p.mp/Math.max(1,p.maxMp);p.maxHp=ratio(p.maxHp,old.hp,next.hp);p.maxMp=ratio(p.maxMp,old.mp,next.mp);p.atk=ratio(p.atk,old.atk,next.atk);p.def=ratio(p.def,old.def,next.def);p.hp=Math.max(1,Math.round(p.maxHp*hpPct));p.mp=Math.min(p.maxMp,Math.round(p.maxMp*mpPct));p.raceId=next.id;p.raceName=next.name;p.raceRarity=next.rarity;p.racePassive=next.passive;p.raceBuffs=next.buffs}
function cleanName(v){return String(v||"Adventurer").trim().replace(/[<>]/g,"").slice(0,16)||"Adventurer"}function bounded(v,min,max,fb){const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fb}
function sceneFor(n){const r=world.regionForStage(n);return {name:r.name,hint:r.hint,css:r.css,regionId:r.id}}
function encounter(n){return world.encounter(n,normal,bosses)}
/* v0.35 in-game index: generated from the actual encounter, shop and boss loot rules.
   Read-only route: no player data, saves, combat state or database changes. */
app.get("/api/index",(_,res)=>{
 const enemies=Array.from({length:world.totalStages},(_,index)=>{
  const stage=index+1,foe=encounter(stage),zone=sceneFor(stage);
  return {id:"stage-"+stage,stage,name:foe.name,icon:foe.icon||"⚔",
   sprite:foe.sprite,boss:!!foe.boss,miniBoss:!!foe.miniBoss,regionId:foe.regionId,zone:zone.name,hp:foe.maxHp,atk:foe.atk,def:foe.def,
   xp:foe.xp,gold:foe.gold,...combat.enemyCodex({...foe,stage}),loot:foe.boss||foe.miniBoss?"Each possible item rolls separately by rarity; multiple drops can be won together.":"No random equipment drops"};
 });
 const goods=shopItems.map(it=>({...it,category:it.category==="food"?"food":it.slot==="weapon"?"weapons":it.slot==="armor"?"armor":"consumables"}));
 const drops=[],bossDropTables={},miniDropTables={};
 for(let i=1;i<=8;i++){
  for(const type of ["boss","mini"]){
   const isMini=type==="mini",stage=(i-1)*5+(isMini?4:5);
   const name=isMini?world.regions[i-1].miniName:bosses[i-1].name;
   const rows=(isMini?loot.miniDrops(i):loot.bossDrops(i)).map(it=>({
    ...it,category:it.slot==="main"||it.slot==="offhand"?"weapons":["head","chest","pants","boots"].includes(it.slot)?"armor":"accessories",
    source:name,sourceStage:stage,price:null
   }));
   drops.push(...rows);
   (isMini?miniDropTables:bossDropTables)[stage]=rows.map(({id,name,rarity,chance,slot,icon,category})=>({id,name,rarity,chance,slot,icon,category}));
  }
 }
 enemies.forEach(enemy=>{
  if(enemy.boss||enemy.miniBoss){enemy.drops=(enemy.boss?bossDropTables:miniDropTables)[enemy.stage]||[];
   enemy.loot="Each listed item is rolled independently for each player. Several items may drop on the same victory; bag capacity still applies.";}
 });
 res.set("Cache-Control","no-store, max-age=0");
 res.json({version:"0.56.3",title:"SOULBOUND ADVENTURE INDEX",stageCount:world.totalStages,
  categories:["bosses","monsters","races","weapons","armor","accessories","food","consumables","elements","statuses","combat"],
  codex:combat.codexData(),
  bossDropTables,miniDropTables,lootRule:"Each possible item has its own independent drop roll based on rarity. Multiple items may drop; inventory remains limited to 40 unequipped pieces.",
  races:races.map(({id,name,rarity,icon,weight,passive,buffs})=>({id,name,rarity:rarity==="legend"?"legendary":rarity,icon,chance:weight,passive,buffs})),
  monsters:enemies,items:[...goods,...drops],zones:world.regions.map(r=>({name:r.name,css:r.css,hint:r.hint,stages:r.firstStage+"–"+r.bossStage}))});
});
function publicRoom(r){return{code:r.code,stage:r.stage,totalStages:world.totalStages,scene:sceneFor(r.stage),regionIndex:r.regionIndex,region:world.regions[r.regionIndex],regions:world.regions.map(({normalNames,miniName,...data})=>({...data,miniName})),monster:r.monster,enemies:pack.publicEnemies(r),partyWardReduction:r.partyWardReduction||0,enemyWindup:!!r.pendingEnemy,players:[...r.players.values()].map(p=>({...p,alive:p.hp>0})),turnIndex:r.turnIndex,status:r.status,partyWardTurns:r.partyWardTurns||0,shopCategory:r.shopCategory||null,shopOrigin:r.shopOrigin||null,shopItems:shopItems.map(it=>({...it,category:it.category||(it.slot==="weapon"?"weapon":it.slot==="armor"?"armor":"potion")})),log:r.log.slice(-40),chat:(r.chat||[]).slice(-40)}}
function emit(r){io.to(r.code).emit("state",publicRoom(r))}function say(r,m){r.log.push(m);if(r.log.length>40)r.log.shift()}
function createRoom(code){const r={code,stage:1,regionIndex:0,monster:null,enemies:[],players:new Map(),turnIndex:0,status:"city",log:[],chat:[]};rooms.set(code,r);return r}
function findRoom(s){return [...rooms.values()].find(r=>r.players.has(s.id))}function current(r){const a=[...r.players.values()];return a.length?a[r.turnIndex%a.length]:null}function alive(r){return [...r.players.values()].filter(p=>p.hp>0)}
function player(id,name,c="swordsman",gender="male"){const mage=c==="mage",tank=c==="tank";return{id,name:cleanName(name),gender:gender==="female"?"female":"male",inventory:[],weaponItem:null,armorItem:null,foodItems:{roast_meat:0,herb_stew:0,mana_tart:0},foodBuffs:{atk:0,def:0,skill:0},classId:tank?"tank":mage?"mage":"swordsman",className:tank?"Tank":mage?"Mage":"Swordsman",hp:tank?180:mage?120:130,maxHp:tank?180:mage?120:130,mp:tank?55:mage?65:40,maxMp:tank?55:mage?65:40,level:1,xp:0,gold:80,potions:3,manaPotions:2,smallHealth:3,mediumHealth:0,largeHealth:0,smallMana:2,mediumMana:0,largeMana:0,classPath:null,tauntTurns:0,damageAmpTurns:0,damageReductionTurns:0,atk:tank?16:mage?25:22,def:tank?16:mage?8:10,weapon:tank?"Guardian Mace":mage?"Apprentice Staff":"Training Sword",armor:tank?"Guardian Armor":mage?"Novice Robe":"Traveler Armor",raceId:"human",racePoints:0,raceName:"Human",raceRarity:"common",racePassive:races[0].passive,raceBuffs:races[0].buffs,strength:0,vitality:0,intelligence:0,agility:0,statPoints:0,speed:10,cooldowns:{},worldProgress:world.normalizeProgress(null)}}
function monsterStrike(r){combat.monsterStrike(r,{say,raceById,random:Math.random})}
function enemyCounterAfterBeat(r){
 const token={stage:r.stage,enemies:pack.alive(r),selected:r.monster};
 r.pendingEnemy=token;
 function attackAt(index){
  if(r.pendingEnemy!==token)return;
  if(r.status!=="battle"||r.stage!==token.stage){r.pendingEnemy=null;return}
  if(index>=token.enemies.length||!alive(r).length){
   r.pendingEnemy=null;r.monster=pack.select(r,token.selected?.enemyId)||pack.alive(r)[0]||r.monster;
   skipFallenTurn(r);combat.applyDefeatPenalty(r,say);emit(r);return;
  }
  const attacker=token.enemies[index];
  if(attacker?.hp>0){
   r.monster=attacker;monsterStrike(r);
   r.monster=pack.select(r,token.selected?.enemyId)||pack.alive(r)[0]||r.monster;
   say(r,"⚔ "+attacker.name+" finishes its attack.");
   emit(r);
  }
  if(r.status!=="battle"){r.pendingEnemy=null;combat.applyDefeatPenalty(r,say);emit(r);return}
  setTimeout(()=>attackAt(index+1),600);
 }
 setTimeout(()=>attackAt(0),760);
}
function skipFallenTurn(r){if(r.status!=="battle")return;const players=[...r.players.values()];if(!players.length||!alive(r).length)return;let i=0;while(current(r)?.hp<=0&&i<players.length){r.turnIndex=(r.turnIndex+1)%players.length;i++}if(i>0)say(r,"Fallen party members are skipped until victory or defeat.")}
function start(r){
 const first=encounter(r.stage);r.status="battle";r.shopOrigin=null;r.shopCategory=null;
 r.enemies=[];r.monster=first;
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
function finish(r){const m=r.monster;r.status=r.stage%5===0?"regionClear":"victory";for(const p of r.players.values()){if(p.hp<=0){p.hp=Math.max(1,Math.ceil(p.maxHp*.3));p.mp=Math.ceil(p.maxMp*.2);say(r,p.name+" is revived after the victory with 30% HP and 20% MP.")}p.xp+=m.xp;p.gold+=m.gold;if(m.boss){p.worldProgress=world.markBossClear(p.worldProgress,m.regionId);p.racePoints=(p.racePoints||0)+1;say(r,p.name+" earned 1 Race Point for defeating a boss!");}if(m.boss||m.miniBoss)loot.dropEncounterLoot(p,r.stage,msg=>say(r,msg),world.regionForStage(r.stage).index+1,!!m.miniBoss);if(p.raceId==="human")p.xp+=Math.ceil(m.xp*.05);if(p.raceId==="sylvan")p.hp=Math.min(p.maxHp,p.hp+Math.ceil(p.maxHp*.03));while(p.xp>=p.level*100){p.xp-=p.level*100;p.level++;p.statPoints=(p.statPoints||0)+3;p.maxHp+=p.classId==="tank"?22:p.classId==="swordsman"?16:10;p.maxMp+=p.classId==="mage"?12:p.classId==="tank"?8:6;p.atk+=p.classId==="mage"?3:p.classId==="tank"?2:4;p.def+=p.classId==="tank"?4:p.classId==="swordsman"?2:1;p.hp=p.maxHp;p.mp=p.maxMp;say(r,p.name+" reached level "+p.level+"! +3 STAT POINTS. Allocate them in the character panel.")}}say(r,"Victory! "+m.name+" defeated. +"+m.xp+" EXP · +"+m.gold+" GOLD.");if(r.stage===40)say(r,"THE ECLIPSE SOVEREIGN HAS FALLEN. THE KINGDOM IS FREE! All regions can be replayed.")}
function valid(s,r){const p=r.players.get(s.id);return r.status==="battle"&&!r.pendingEnemy&&p&&p.hp>0&&current(r)?.id===s.id}
io.on("connection",s=>{
 s.on("createRoom",({name,classId,gender}={},cb=()=>{})=>{const code=Math.random().toString(36).slice(2,7).toUpperCase(),r=createRoom(code);r.players.set(s.id,player(s.id,name,classId,gender));s.join(code);say(r,cleanName(name)+" founded the party.");emit(r);cb({ok:true,code})});
 s.on("joinRoom",({code,name,classId,gender}={},cb=()=>{})=>{code=String(code||"").trim().toUpperCase();const r=rooms.get(code);if(!r)return cb({ok:false,error:"Room not found. Check the code."});if(r.players.size>=4)return cb({ok:false,error:"Party full (maximum 4)."});if(r.status!=="city")return cb({ok:false,error:"Adventure already started."});const p=player(s.id,name,classId,gender);r.players.set(s.id,p);s.join(code);say(r,p.name+" joined the party.");emit(r);cb({ok:true,code})});
 s.on("restoreCharacter",(v={},cb=()=>{})=>{const r=findRoom(s);if(!r||r.status!=="city")return cb({ok:false,error:"Restore only works in the waiting room."});const p=r.players.get(s.id);p.gender=v.gender==="female"?"female":"male";p.classId=["mage","tank"].includes(v.class_id)?v.class_id:"swordsman";p.classPath=["berserker","knight","archmage","warlock","guardian","paladin"].includes(v.class_path)?v.class_path:null;p.racePoints=bounded(v.race_points,0,999999,0);p.raceId=raceById(v.race_id).id;p.strength=bounded(v.strength,0,9999,0);p.vitality=bounded(v.vitality,0,9999,0);p.intelligence=bounded(v.intelligence,0,9999,0);p.agility=bounded(v.agility,0,9999,0);p.statPoints=bounded(v.stat_points,0,999999,0);p.speed=bounded(v.speed,1,9999,10+p.agility*2);p.cooldowns={};const race=raceById(p.raceId);p.raceName=race.name;p.raceRarity=race.rarity;p.racePassive=race.passive;p.raceBuffs=race.buffs;p.className=p.classPath?({berserker:"Berserker",knight:"Knight",archmage:"Archmage",warlock:"Warlock",guardian:"Guardian",paladin:"Paladin"})[p.classPath]:p.classId==="tank"?"Tank":p.classId==="mage"?"Mage":"Swordsman";p.level=bounded(v.level,1,999,1);p.xp=bounded(v.xp,0,999999,0);p.gold=bounded(v.gold,0,99999999,80);p.maxHp=bounded(v.max_hp,p.classId==="mage"?120:130,999999,p.classId==="mage"?120:130);p.hp=bounded(v.hp,1,p.maxHp,p.maxHp);p.maxMp=bounded(v.max_mp,p.classId==="mage"?65:40,999999,p.classId==="mage"?65:40);p.mp=bounded(v.mp,0,p.maxMp,p.maxMp);p.atk=bounded(v.attack,p.classId==="mage"?25:p.classId==="tank"?16:22,999999,p.classId==="mage"?25:p.classId==="tank"?16:22);p.def=bounded(v.defense,p.classId==="mage"?8:10,999999,p.classId==="mage"?8:10);p.potions=bounded(v.potions,0,999999,3);p.manaPotions=bounded(v.mana_potions,0,999999,2);p.smallHealth=bounded(v.small_health,0,999999,p.potions);p.mediumHealth=bounded(v.medium_health,0,999999,0);p.largeHealth=bounded(v.large_health,0,999999,0);p.smallMana=bounded(v.small_mana,0,999999,p.manaPotions);p.mediumMana=bounded(v.medium_mana,0,999999,0);p.largeMana=bounded(v.large_mana,0,999999,0);p.tauntTurns=0;p.damageAmpTurns=0;p.damageReductionTurns=0;p.weapon=String(v.weapon||p.weapon).slice(0,40);p.armor=String(v.armor||p.armor).slice(0,40);p.inventory=loot.normalizeInventory(v.inventory,shopItems);p.weaponItem=loot.canonical(v.weapon_item,shopItems)||shopItems.find(x=>x.name===p.weapon&&x.slot==="weapon")||null;p.armorItem=loot.canonical(v.armor_item,shopItems)||shopItems.find(x=>x.name===p.armor&&x.slot==="armor")||null;for(const it of p.inventory){if(it.equippedSlot==="main"){p.weaponItem=it;p.weapon=it.name}else if(it.equippedSlot==="chest"){p.armorItem=it;p.armor=it.name}}
// Link legacy equipped shop gear to its inventory instance, preserving unique identity.
 for(const [slot,key] of [["main","weaponItem"],["chest","armorItem"]]){
  if(p[key]&&!p.inventory.some(it=>it.equippedSlot===slot)){
   let owned=p.inventory.find(it=>it.id===p[key].id&&!it.equippedSlot);
   if(!owned){owned={...p[key],uid:require("node:crypto").randomUUID()};p.inventory.push(owned)}
   owned.equippedSlot=slot;p[key]=owned;
  }
 }p.foodItems={roast_meat:bounded(v.food_items?.roast_meat,0,9999,0),herb_stew:bounded(v.food_items?.herb_stew,0,9999,0),mana_tart:bounded(v.food_items?.mana_tart,0,9999,0)};p.foodBuffs={atk:bounded(v.food_buffs?.atk,0,99,0),def:bounded(v.food_buffs?.def,0,99,0),skill:bounded(v.food_buffs?.skill,0,99,0)};p.worldProgress=world.normalizeProgress(v.world_progress);
 // Existing owned items count as discovered even if the prior save predates v0.44.
 const seen=new Set(p.worldProgress.lootSeen);
 for(const it of p.inventory){if(it.id)seen.add(it.id+":"+(it.rarity||"shop"))}
 p.worldProgress.lootSeen=[...seen].slice(-300);
 if(p.raceId)p.worldProgress.raceSeen=[...new Set([...(p.worldProgress.raceSeen||[]),p.raceId])];
 emit(r);cb({ok:true})});
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
 s.on("startBattle",(_,cb=()=>{})=>{const r=findRoom(s);if(!r)return cb({ok:false,error:"Join a room first."});if([...r.players.keys()][0]!==s.id)return cb({ok:false,error:"Only party leader can start."});if(r.status!=="city")return cb({ok:false,error:"Return to the city to start a region."});if([...r.players.values()].some(p=>!world.canEnter(p.level,r.regionIndex)))return cb({ok:false,error:"A party member does not meet this region\u0027s level requirement."});r.stage=world.regions[r.regionIndex].firstStage;start(r);say(r,"The party sets out into "+world.regions[r.regionIndex].name+".");emit(r);cb({ok:true})});
 s.on("action",({type,targetId}={},cb=()=>{})=>{const r=findRoom(s);if(!r)return cb({ok:false,error:"Join a room first."});if(!valid(s,r))return cb({ok:false,error:"Wait for your turn."});
 const acting=r.players.get(s.id);
 const aoe=(type==="skill2"&&(acting?.classId==="mage"||acting?.classId==="swordsman"))
   ||(type==="skill3"&&acting?.classId==="mage")
   ||(type==="skill6"&&acting?.classId==="mage");
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
 let d=0;const race=raceById(p.raceId),lowHp=p.hp/p.maxHp<=.5,pathDamage=p.classPath==="berserker"&&lowHp?1.1:1,foodAttack=p.foodBuffs?.atk>0?1.15:1,damageBonus=((p.raceId==="orc"&&lowHp)?1.08:1)*pathDamage*foodAttack*(p._combatAttackMultiplier||1);
 if(type==="attack"){d=Math.max(1,Math.floor((p.atk+Math.floor(Math.random()*8)-m.def)*damageBonus*combat.elementMultiplier(m,"physical")*(m.vulnerableTurns>0?1.2:1)));m.hp=Math.max(0,m.hp-d);if(p.foodBuffs?.atk>0)p.foodBuffs.atk--;say(r,p.name+" attacks for "+d+" damage.");if(p.raceId==="beastkin"&&Math.random()<.1){p.mp=Math.min(p.maxMp,p.mp+3);say(r,p.name+" triggers Predator Instinct and recovers 3 MP!")}}
 else if(["skill","skill2","skill3","skill4","skill5","skill6","skill7"].includes(type)){const specs={skill:{cost:12,mult:p.classId==="mage"?1.9:p.classId==="tank"?.9:1.8,unlock:1,name:p.classId==="mage"?"ARCANE BOLT":p.classId==="tank"?"SHIELD BASH":"POWER STRIKE",cd:2},skill2:{cost:25,mult:p.classId==="tank"?1.3:2.5,unlock:3,name:p.classId==="mage"?"METEOR":p.classId==="tank"?"IRON WALL":"WHIRLWIND",cd:3},skill3:{cost:20,mult:p.classId==="mage"?1.6:p.classId==="tank"?1.4:2,unlock:5,name:p.classId==="mage"?"FROST NOVA":p.classId==="tank"?"PROVOKE":"SHIELD BREAKER",cd:3},skill4:{cost:30,mult:3,unlock:8,name:p.classId==="mage"?"ARCANE SURGE":p.classId==="tank"?"FORTRESS STRIKE":"RALLYING SLASH",cd:4},skill5:{cost:24,mult:p.classId==="tank"?.8:1.25,unlock:5,name:p.classId==="mage"?"ARCANE MARK":p.classId==="tank"?"AEGIS PACT":"ARMOR REND",cd:4},skill6:{cost:22,mult:1.8,unlock:7,name:"TIDAL SURGE",cd:3},skill7:{cost:26,mult:1.95,unlock:9,name:"THUNDERBOLT",cd:3}};const sk=specs[type],cost=p.raceId==="elf"?Math.floor(sk.cost*.95):sk.cost;if((p.cooldowns?.[type]||0)>0)return cb({ok:false,error:"Skill is on cooldown for "+p.cooldowns[type]+" more round(s)."});if(p.level<sk.unlock)return cb({ok:false,error:"Unlocks at level "+sk.unlock+"."});if(p.mp<cost)return cb({ok:false,error:"Not enough MP."});p.mp-=cost;if(p.foodBuffs?.skill>0)sk.mult*=1.1;p.cooldowns=p.cooldowns||{};p.cooldowns[type]=sk.cd;if(p.foodBuffs?.skill>0)p.foodBuffs.skill--;if(p.classPath==="warlock"){const leech=Math.max(1,Math.ceil(p.maxMp*.05));p.mp=Math.min(p.maxMp,p.mp+leech);say(r,p.name+" leeches "+leech+" MP through Soul Leech.")}if(p.classPath==="paladin"){const holy=Math.max(1,Math.ceil(p.maxHp*.05));p.hp=Math.min(p.maxHp,p.hp+holy);say(r,p.name+" restores "+holy+" HP through Holy Vigor.")}d=Math.max(1,Math.floor((Math.floor(p.atk*sk.mult*(p.classPath==="archmage"?1.1:1))+Math.floor(Math.random()*12)-m.def)*damageBonus*combat.elementMultiplier(m,combat.skillElement(p,type))*(m.vulnerableTurns>0?1.2:1)));m.hp=Math.max(0,m.hp-d);if(p.foodBuffs?.atk>0)p.foodBuffs.atk--;if(type==="skill3"&&p.classId==="tank"){p.tauntTurns=3;say(r,p.name+" uses PROVOKE! Monsters will target the Tank for 3 enemy turns.")}else if(type==="skill5"){if(p.classId==="tank"){p.damageReductionTurns=3;say(r,p.name+" activates AEGIS PACT: damage taken reduced by 20% for 3 enemy turns.");combat.aegis(r,p,say)}else{m.vulnerableTurns=3;say(r,p.name+" uses "+sk.name+"! The monster takes 20% more damage for 3 rounds.")}}if(type==="skill3"&&p.classId==="mage"){combat.debuffMonster(m,"chill",1);say(r,p.name+" chills the enemy, reducing its next attack.");const heal=Math.ceil(p.maxHp*.1);p.hp=Math.min(p.maxHp,p.hp+heal);say(r,p.name+" uses FROST NOVA for "+d+" damage and restores "+heal+" HP!")}else{if(type==="skill3"&&p.classId==="swordsman"){p.damageReductionTurns=Math.max(p.damageReductionTurns||0,2);combat.debuffMonster(m,"weaken",2);say(r,p.name+" breaks the enemy rhythm: weaker damage for two attacks.")}say(r,p.name+" uses "+sk.name+" for "+d+" damage!"+(type==="skill3"&&p.classId==="swordsman"?" DEFENSE UP for two enemy attacks.":""))}}
 else if(["heal","healSmall","healMedium","healLarge"].includes(type)){const tier=type==="healLarge"?"large":type==="healMedium"?"medium":"small",key=tier+"Health",pct=tier==="large"?.5:tier==="medium"?.35:.2;if((p[key]||0)<1||p.hp===p.maxHp)return cb({ok:false,error:"No potion of this size or HP is full."});p[key]--;p.potions=Math.max(0,(p.potions||0)-(tier==="small"?1:0));const n=Math.min(Math.ceil(p.maxHp*pct),p.maxHp-p.hp);p.hp+=n;say(r,p.name+" uses "+tier.toUpperCase()+" Health Potion and restores "+n+" HP.")}
 else if(["mana","manaSmall","manaMedium","manaLarge"].includes(type)){const tier=type==="manaLarge"?"large":type==="manaMedium"?"medium":"small",key=tier+"Mana",pct=tier==="large"?.5:tier==="medium"?.35:.2;if((p[key]||0)<1||p.mp===p.maxMp)return cb({ok:false,error:"No mana potion of this size or MP is full."});p[key]--;p.manaPotions=Math.max(0,(p.manaPotions||0)-(tier==="small"?1:0));const n=Math.min(Math.ceil(p.maxMp*pct),p.maxMp-p.mp);p.mp+=n;say(r,p.name+" uses "+tier.toUpperCase()+" Mana Potion and restores "+n+" MP.")}
 else if(type==="food_roast"||type==="food_stew"||type==="food_tart"){const key=type==="food_roast"?"roast_meat":type==="food_stew"?"herb_stew":"mana_tart";if((p.foodItems?.[key]||0)<1)return cb({ok:false,error:"You do not have this food."});p.foodItems[key]--;p.foodBuffs=p.foodBuffs||{atk:0,def:0,skill:0};if(key==="roast_meat"){p.foodBuffs.atk=3;say(r,p.name+" eats Dragonpepper Roast: +15% damage for 3 attacks.")}else if(key==="herb_stew"){p.foodBuffs.def=3;say(r,p.name+" eats Guardian Herb Stew: -20% damage for the next 3 hits.")}else{const restored=Math.min(Math.ceil(p.maxMp*.3),p.maxMp-p.mp);p.mp+=restored;p.foodBuffs.skill=3;say(r,p.name+" eats Moonberry Tart: restores "+restored+" MP and boosts the next 3 skills by 10%.")}}else if(type==="guard"){p.mp=Math.min(p.maxMp,p.mp+8);combat.guard(r,p,say);say(r,p.name+" recovers 8 MP.")}
 else if(type==="break"){
  const cost=p.raceId==="elf"?14:15;p.mp-=cost;p.cooldowns=p.cooldowns||{};p.cooldowns.break=3;
  d=Math.max(1,Math.floor((p.atk*.85+Math.floor(Math.random()*5)-m.def)*damageBonus*(m.vulnerableTurns>0?1.2:1)));
  m.hp=Math.max(0,m.hp-d);say(r,p.name+" uses BREAK STRIKE for "+d+" damage and a heavy Stagger impact.");
 }else if(type==="cleanse"){
  const cost=p.raceId==="elf"?11:12;p.mp-=cost;p.cooldowns=p.cooldowns||{};p.cooldowns.cleanse=3;
  combat.cleanse(r,p,say);
 }else return cb({ok:false,error:"Unknown action."});
 // Server-authoritative AoE: primary full damage, other living enemies
 // receive 65% with their individual armour and elemental resistance.
 if(aoe&&d>0){
  let struck=1;
  for(const other of pack.alive(r)){
   if(other===m)continue;
   const base=Math.max(1,p.atk*({skill2:2.5,skill3:1.6,skill6:1.8}[type]||1.5));
   const correction=Math.max(.4,Math.min(1.6,(base-other.def)/Math.max(1,base-m.def)));
   const element=combat.skillElement(p,type);
   const ratio=combat.elementMultiplier(other,element)/Math.max(.01,combat.elementMultiplier(m,element));
   const hit=Math.max(1,Math.floor(d*.65*correction*ratio));
   other.hp=Math.max(0,other.hp-hit);
   if(type==="skill3"&&p.classId==="mage"&&other.hp>0)combat.debuffMonster(other,"chill",1);
   struck++;say(r,p.name+" hits "+other.name+" with AoE for "+hit+" damage.");
  }
  say(r,"✦ AREA ATTACK · "+struck+" enemies struck.");
 }
 // All damaging actions build a persistent Stagger bar. Only a charged attack
 // can be interrupted. The boss resists subsequent interrupts briefly.
 if(["attack","skill","skill2","skill3","skill4","skill5","break"].includes(type)&&m.hp>0)
  combat.addStagger(r,p,type,combat.skillElement(p,type),say);
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
 s.on("buyItem",({itemId}={},cb=()=>{})=>{const r=findRoom(s),p=r?.players.get(s.id);if(!r||!p)return cb({ok:false,error:"Join a party first."});if(r.status!=="shop")return cb({ok:false,error:"Merchant is not here."});const it=shopItems.find(x=>x.id===itemId);if(!it)return cb({ok:false,error:"Item not found."});const allowed=r.shopCategory==="potion"?["potion","food"]:[r.shopCategory||"potion"];if(!allowed.includes(it.category))return cb({ok:false,error:"This shop does not sell that item."});if(it.class&&it.class!==p.classId)return cb({ok:false,error:"This equipment is for another class."});if(p.level<(it.level||1))return cb({ok:false,error:"Requires level "+it.level+"."});if(p.gold<it.price)return cb({ok:false,error:"Not enough gold."});if((it.slot==="weapon"||it.slot==="armor")&&loot.bagUsed(p)>=40)return cb({ok:false,error:"Inventory full (40/40). Free a slot before buying equipment."});p.gold-=it.price;if(itemId==="health_potion"){p.potions++;p.smallHealth=(p.smallHealth||0)+1}else if(itemId==="health_medium")p.mediumHealth=(p.mediumHealth||0)+1;else if(itemId==="health_large")p.largeHealth=(p.largeHealth||0)+1;else if(itemId==="mana_potion"){p.manaPotions++;p.smallMana=(p.smallMana||0)+1}else if(itemId==="mana_medium")p.mediumMana=(p.mediumMana||0)+1;else if(itemId==="mana_large")p.largeMana=(p.largeMana||0)+1;else if(it.category==="food"){p.foodItems=p.foodItems||{};p.foodItems[itemId]=(p.foodItems[itemId]||0)+1}else if(it.slot==="weapon"||it.slot==="armor"){p.inventory=p.inventory||[];p.inventory.push({...it,uid:require("node:crypto").randomUUID()});p.worldProgress=world.normalizeProgress(p.worldProgress);p.worldProgress.lootSeen=[...new Set([...(p.worldProgress.lootSeen||[]),it.id+":shop"])].slice(-300)}say(r,p.name+" bought "+it.name+".");emit(r);cb({ok:true})});
 s.on("equipItem",({itemId,targetSlot}={},cb=()=>{})=>{const r=findRoom(s),p=r?.players.get(s.id);if(!r||!p)return cb({ok:false,error:"Join a party first."});if(!["city","shop","victory","regionClear"].includes(r.status))return cb({ok:false,error:"Equipment can only be changed between battles."});const result=loot.equip(p,itemId,targetSlot,shopItems);if(result.ok){say(r,p.name+" equipped "+(p.inventory.find(i=>i.uid===result.itemUid)?.name||"equipment")+".");emit(r)}cb(result)});
 s.on("unequipItem",({slot}={},cb=()=>{})=>{const r=findRoom(s),p=r?.players.get(s.id);if(!r||!p)return cb({ok:false,error:"Join a party first."});if(!["city","shop","victory","regionClear"].includes(r.status))return cb({ok:false,error:"Equipment can only be changed between battles."});const result=loot.unequip(p,String(slot||""));if(result.ok){say(r,p.name+" unequipped "+slot+".");emit(r)}cb(result)});

 s.on("discardItem",({uid}={},cb=()=>{})=>{const r=findRoom(s),p=r?.players.get(s.id);if(!r||!p)return cb({ok:false,error:"Join a party first."});if(!["city","shop","victory","regionClear"].includes(r.status))return cb({ok:false,error:"Items can only be discarded between battles."});const index=(p.inventory||[]).findIndex(it=>it.uid===String(uid||""));if(index<0)return cb({ok:false,error:"Item not found in bag."});const item=p.inventory[index];if(item.equippedSlot||(p.weaponItem&&p.weaponItem.uid===item.uid)||(p.armorItem&&p.armorItem.uid===item.uid))return cb({ok:false,error:"Unequip this item first."});p.inventory.splice(index,1);say(r,p.name+" discarded "+item.name+".");emit(r);cb({ok:true})});
 s.on("nextStage",(_,cb=()=>{})=>{const r=findRoom(s);if(!r)return cb({ok:false,error:"Room not found."});if([...r.players.keys()][0]!==s.id)return cb({ok:false,error:"Only party leader can continue."});if(r.status!=="victory"||r.stage%5===0)return cb({ok:false,error:"Finish a non-boss stage before advancing."});r.stage++;start(r);say(r,"The party advances to stage "+r.stage+" of "+world.totalStages+".");emit(r);cb({ok:true})});
 s.on("restart",(_,cb=()=>{})=>{const r=findRoom(s);if(!r)return cb({ok:false,error:"Room not found."});if([...r.players.keys()][0]!==s.id)return cb({ok:false,error:"Only party leader can restart."});if(r.status==="battle")return cb({ok:false,error:"Cannot reset a dungeon during an active battle."});r.stage=world.regions[r.regionIndex].firstStage;r.status="city";r.monster=null;r.enemies=[];for(const p of r.players.values()){p.hp=p.maxHp;p.mp=p.maxMp}r.log=["Returned to the Central City. Your hero progress and equipment are kept."];emit(r);cb({ok:true})});
 s.on("chooseClassPath",({path:chosen}={},cb=()=>{})=>{const r=findRoom(s),p=r?.players.get(s.id);if(!r||!p)return cb({ok:false,error:"Join a party first."});if(p.level<15)return cb({ok:false,error:"Class specialization unlocks at level 15."});const choices={swordsman:["berserker","knight"],mage:["archmage","warlock"],tank:["guardian","paladin"]};if(!choices[p.classId]?.includes(chosen))return cb({ok:false,error:"Invalid specialization for this class."});if(p.classPath)return cb({ok:false,error:"You have already chosen your path."});p.classPath=chosen;p.className=({berserker:"Berserker",knight:"Knight",archmage:"Archmage",warlock:"Warlock",guardian:"Guardian",paladin:"Paladin"})[chosen];if(chosen==="guardian"){p.maxHp+=50;p.hp+=50;p.def+=6}else if(chosen==="paladin"){p.maxHp+=25;p.hp+=25;p.def+=3;p.atk+=6;p.maxMp+=10;p.mp+=10}else if(chosen==="berserker"){p.atk+=6;p.def=Math.max(1,p.def-2)}else if(chosen==="knight"){p.def+=5;p.maxHp+=20;p.hp+=20}else if(chosen==="archmage"){p.maxMp+=30;p.mp+=30;p.atk+=4}else if(chosen==="warlock"){p.atk+=6;p.maxHp+=10;p.hp+=10}say(r,p.name+" chose the "+p.className+" path!");emit(r);cb({ok:true})});
 s.on("allocateStat",({stat}={},cb=()=>{})=>{const r=findRoom(s),p=r?.players.get(s.id);if(!r||!p)return cb({ok:false,error:"Join a party first."});if((p.statPoints||0)<1)return cb({ok:false,error:"No stat points available."});const key=String(stat||"");if(!["strength","vitality","intelligence","agility"].includes(key))return cb({ok:false,error:"Unknown stat."});p.statPoints--;p[key]=(p[key]||0)+1;if(key==="strength")p.atk+=2;if(key==="vitality"){p.maxHp+=12;p.hp+=12}if(key==="intelligence"){p.maxMp+=10;p.mp+=10}if(key==="agility")p.speed=(p.speed||10)+2;say(r,p.name+" increased "+key.toUpperCase()+".");emit(r);cb({ok:true})});
 s.on("partyChat",({message}={},cb=()=>{})=>{const r=findRoom(s),p=r?.players.get(s.id);if(!r||!p)return cb({ok:false,error:"Join a party first."});const body=String(message||"").replace(/[<>]/g,"").trim().slice(0,180);if(!body)return cb({ok:false,error:"Message is empty."});r.chat=r.chat||[];r.chat.push({name:p.name,id:p.id,message:body,time:Date.now()});if(r.chat.length>60)r.chat.shift();emit(r);cb({ok:true})});
 s.on("disconnect",()=>{for(const r of rooms.values())if(r.players.has(s.id)){const p=r.players.get(s.id);r.players.delete(s.id);say(r,p.name+" disconnected.");if(!r.players.size)rooms.delete(r.code);else{r.turnIndex=0;skipFallenTurn(r);emit(r)}}});
});
server.listen(PORT,()=>console.log("SOULBOUND Online v0.40.0 running on "+PORT));

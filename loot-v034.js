"use strict";
/* Server-authoritative SOULBOUND v0.34 boss loot, 40-slot inventory and equipment.
 * No Supabase schema migration: all new gear state lives inside the existing JSON
 * inventory column (items have equippedSlot and unique uid).
 */
const {randomUUID}=require("node:crypto");
const SLOTS=["head","chest","pants","boots","main","offhand","neck","ring_left","ring_right"];
const RARITIES=["common","uncommon","rare","epic","legendary"];
const ICONS={head:"🪖",chest:"🛡️",pants:"👖",boots:"🥾",main:"⚔️",offhand:"🗡️",neck:"💎",ring_left:"💍",ring_right:"💍"};
const BASE_NAMES={head:"Helm",chest:"Armor",pants:"Greaves",boots:"Boots",main:"Blade",offhand:"Guard",neck:"Amulet",ring_left:"Ring",ring_right:"Ring"};
const TITLES=["Briarfang","Dreadforge","Ember","Hollow","Glacier","World-Eater","Void","Eclipse"];
const MINI_TITLES=["Rootbound","Ironbound","Molten","Sanctum","Frosthorn","Titan","Abyss","Twilight"];
const FACTORS={common:1,uncommon:1.35,rare:1.8,epic:2.45,legendary:3.4};
const SLOT_ALIASES={weapon:"main",armor:"chest",helmet:"head",necklace:"neck",ring:"ring_left",shield:"offhand"};
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,Math.trunc(Number(v)||0)));
function slotOf(item){return SLOT_ALIASES[item?.slot]||item?.slot||null}
function rarityFromRoll(){const r=Math.random();return r<.50?"common":r<.78?"uncommon":r<.94?"rare":r<.99?"epic":"legendary"}
function validLootId(id){return /^(boss|mini)([1-8])_(head|chest|pants|boots|main|offhand|neck|ring_left|ring_right)$/.exec(String(id||""))}
function factory(id,rarity){
 const m=validLootId(id);if(!m||!RARITIES.includes(rarity))return null;
 const isMini=m[1]==="mini",boss=Number(m[2]),slot=m[3],power=Math.round((3+boss*2.15)*(isMini?.78:1)*FACTORS[rarity]),isWeapon=slot==="main",armor=["chest","pants","head","boots"].includes(slot);
 const stats={
  value:isWeapon?Math.max(2,Math.round(power*1.4)):0,
  defense:armor?Math.max(1,Math.round(power*(slot==="chest"?.72:.42))):slot==="offhand"?Math.max(1,Math.round(power*.66)):Math.max(0,Math.round(power*.2)),
  maxHp:armor?Math.round(power*(slot==="chest"?3.8:1.7)):slot.startsWith("ring")?Math.round(power*1.2):0,
  maxMp:slot==="neck"?Math.round(power*2.5):slot.startsWith("ring")?Math.round(power*.9):0
 };
 if(slot==="offhand")stats.value=Math.round(power*.2);
 if(slot==="neck")stats.value=Math.round(power*.45);
 if(slot.startsWith("ring"))stats.value=Math.round(power*.3);
 return {id,templateId:id,name:(isMini?MINI_TITLES[boss-1]:TITLES[boss-1])+" "+(slot==="main"&&(boss===3||boss===6||isMini&&boss===7)?"Staff":BASE_NAMES[slot])+" ["+rarity.toUpperCase()+"]",icon:ICONS[slot],slot,rarity,level:1,bossStage:boss*5,sourceStage:boss*5-(isMini?1:0),
  ...(isMini&&slot==="main"?{class:boss===7?"mage":"swordsman"}:{}),
  value:stats.value,defense:stats.defense,maxHp:stats.maxHp,maxMp:stats.maxMp,
  description:Object.entries(stats).filter(([,n])=>n>0).map(([k,n])=>"+"+n+" "+({value:"ATK",defense:"DEF",maxHp:"HP",maxMp:"MP"}[k])).join(" · ")};
}
// v0.44 curated per-encounter tables. Entries are POSSIBLE rewards, not a
// guaranteed number of items. Their chances sum to under 25%; one roll per
// player per victory can award at most one item. Each boss has 1-4 possible
// drops, each mini boss has 1-2 possible drops.
const BOSS_DROPS={
 1:[{slot:"main",rarity:"rare",chance:7},{slot:"ring_left",rarity:"uncommon",chance:10}],
 2:[{slot:"chest",rarity:"uncommon",chance:8},{slot:"boots",rarity:"rare",chance:5},{slot:"offhand",rarity:"rare",chance:4}],
 3:[{slot:"main",rarity:"epic",chance:3},{slot:"neck",rarity:"rare",chance:7},{slot:"pants",rarity:"uncommon",chance:8},{slot:"ring_left",rarity:"rare",chance:4}],
 4:[{slot:"head",rarity:"rare",chance:8},{slot:"offhand",rarity:"epic",chance:4}],
 5:[{slot:"pants",rarity:"epic",chance:5},{slot:"ring_left",rarity:"rare",chance:8},{slot:"boots",rarity:"uncommon",chance:8}],
 6:[{slot:"main",rarity:"epic",chance:4},{slot:"neck",rarity:"legendary",chance:1.5},{slot:"offhand",rarity:"rare",chance:7},{slot:"head",rarity:"epic",chance:3}],
 7:[{slot:"chest",rarity:"legendary",chance:2},{slot:"boots",rarity:"epic",chance:5},{slot:"ring_right",rarity:"rare",chance:6}],
 8:[{slot:"main",rarity:"legendary",chance:2},{slot:"ring_left",rarity:"legendary",chance:1.5},{slot:"neck",rarity:"epic",chance:4},{slot:"chest",rarity:"legendary",chance:1}]
};
const MINI_DROPS={
 1:[{slot:"head",rarity:"uncommon",chance:11}],
 2:[{slot:"offhand",rarity:"rare",chance:6},{slot:"boots",rarity:"uncommon",chance:9}],
 3:[{slot:"chest",rarity:"rare",chance:10}],
 4:[{slot:"neck",rarity:"rare",chance:7},{slot:"ring_left",rarity:"uncommon",chance:8}],
 5:[{slot:"boots",rarity:"rare",chance:10}],
 6:[{slot:"pants",rarity:"epic",chance:4},{slot:"head",rarity:"rare",chance:8}],
 7:[{slot:"main",rarity:"epic",chance:4}],
 8:[{slot:"neck",rarity:"epic",chance:5},{slot:"ring_left",rarity:"rare",chance:7}]
};
function lootRows(region,isMini=false){
 const num=Math.round(Number(region)),set=isMini?MINI_DROPS:BOSS_DROPS;
 return(set[num]||[]).map(row=>({...factory((isMini?"mini":"boss")+num+"_"+row.slot,row.rarity),chance:row.chance}));
}
function bossDrops(boss){return lootRows(boss,false)}
function miniDrops(boss){return lootRows(boss,true)}
function encounterDrops(stage){
 const n=Number(stage),idx=Math.ceil(n/5);
 return n%5===0?bossDrops(idx):n%5===4?miniDrops(idx):[];
}
function canonical(saved,shopItems){
 if(!saved||typeof saved!=="object")return null;
 const id=String(saved.id||"");let item;
 if(validLootId(id)){item=factory(id,String(saved.rarity||"common").toLowerCase());}
 else{const itemFromShop=shopItems.find(x=>x.id===id&&["weapon","armor"].includes(x.slot));if(itemFromShop)item={...itemFromShop};}
 if(!item)return null;
 item.uid=typeof saved.uid==="string"&&/^[a-zA-Z0-9_-]{8,80}$/.test(saved.uid)?saved.uid:randomUUID();
 const equippedSlot=String(saved.equippedSlot||"");
 if(SLOTS.includes(equippedSlot)&&((equippedSlot===slotOf(item))||(slotOf(item)==="ring_left"&&equippedSlot==="ring_right")))item.equippedSlot=equippedSlot;
 return item;
}
function normalizeInventory(raw,shopItems){
 if(!Array.isArray(raw))return [];
 const unique=new Set();
 const result=[];
 for(const source of raw.slice(0,500)){
  const item=canonical(source,shopItems);
  if(!item)continue;
  if(unique.has(item.uid))item.uid=randomUUID();
  unique.add(item.uid);
  result.push(item); // Preserve pre-v0.34 saves even if they exceed the new 40-slot limit; block *new* items until space is available.
 }
 // Server only trusts one equipped item per slot; duplicate slots are kept in bag, unequipped.
 const seen=new Set();for(const it of result){if(it.equippedSlot){if(seen.has(it.equippedSlot))delete it.equippedSlot;else seen.add(it.equippedSlot)}}
 return result;
}
function bagUsed(player){return (player.inventory||[]).filter(it=>!it.equippedSlot).length}
function dropEncounterLoot(player,stage,logger=()=>{},explicitRegion,explicitMini){
 const n=Math.round(Number(stage)),region=explicitRegion?Math.round(Number(explicitRegion)):Math.ceil(n/5);
 const isMini=explicitMini===undefined?n%5===4:!!explicitMini;
 const table=isMini?MINI_DROPS[region]:BOSS_DROPS[region];
 if(!table||(!explicitRegion&&!isMini&&n%5!==0))return null;
 player.inventory=Array.isArray(player.inventory)?player.inventory:[];
 if(bagUsed(player)>=40){logger(player.name+"'s bag is full (40/40): loot was not collected.");return null}
 const roll=Math.random()*100;let sum=0,chosen=null;
 for(const entry of table){sum+=entry.chance;if(roll<sum){chosen=entry;break}}
 if(!chosen){logger(player.name+" received no equipment this time.");return null}
 const item=factory((isMini?"mini":"boss")+region+"_"+chosen.slot,chosen.rarity);
 if(!item)return null;
 item.uid=randomUUID();player.inventory.push(item);
 const old=Array.isArray(player.worldProgress?.lootSeen)?player.worldProgress.lootSeen:[];
 const key=item.id+":"+item.rarity;
 player.worldProgress={...(player.worldProgress||{}),lootSeen:[...new Set([...old,key])].slice(-300)};
 logger(player.name+" found "+chosen.rarity.toUpperCase()+" "+(isMini?"mini-boss":"boss")+" loot: "+item.name+"!");
 return item;
}
// Keep old export compatible with v0.34 callers/tests.
function dropBossLoot(player,stage,logger=()=>{},explicitBossIndex){
 return dropEncounterLoot(player,stage,logger,explicitBossIndex,false);
}
function bonuses(it){return{atk:clamp(it?.value,0,10000),def:clamp(it?.defense,0,10000),maxHp:clamp(it?.maxHp,0,100000),maxMp:clamp(it?.maxMp,0,100000)}}
function updateStats(p,oldItem,newItem){
 const a=bonuses(oldItem),b=bonuses(newItem);
 p.atk=Math.max(1,p.atk-a.atk+b.atk);
 p.def=Math.max(1,p.def-a.def+b.def);
 p.maxHp=Math.max(1,p.maxHp-a.maxHp+b.maxHp);
 p.maxMp=Math.max(0,p.maxMp-a.maxMp+b.maxMp);
 p.hp=Math.min(p.hp,p.maxHp);
 p.mp=Math.min(p.mp,p.maxMp);
}
function equipped(p,slot){return(p.inventory||[]).find(x=>x.equippedSlot===slot)||null}
function equip(p,rawId,targetSlot,shopItems){
 const items=p.inventory||[];const id=String(rawId||"");
 const item=items.find(x=>x.uid===id)||items.find(x=>x.id===id);
 if(!item)return{ok:false,error:"Item is not in your inventory."};
 const slot=slotOf(item);
 targetSlot=targetSlot||slot;
 if(slot==="ring_left"&&targetSlot==="ring_right"){}else if(slot!==targetSlot)return{ok:false,error:"This gear does not match that equipment slot."};
 if(!SLOTS.includes(targetSlot))return{ok:false,error:"Invalid equipment slot."};
 if(item.class&&item.class!==p.classId)return{ok:false,error:"This item belongs to a different class."};
 if(p.level<(item.level||1))return{ok:false,error:"You must reach level "+item.level+"."};
 if(item.equippedSlot===targetSlot)return{ok:true};
 const old=equipped(p,targetSlot);
 // Moving a worn item onto an occupied slot releases that item into the bag.
 if(item.equippedSlot&&old&&bagUsed(p)>=40)return{ok:false,error:"Bag full (40/40). Free a slot before swapping equipped items."};
 if(old)delete old.equippedSlot;
 // For legacy saves, original weaponItem/armorItem can be present without a marked inventory item.
 const prev=old|| (targetSlot==="main"?p.weaponItem:targetSlot==="chest"?p.armorItem:null);
 if(item.equippedSlot){
  const originalSlot=item.equippedSlot;
  updateStats(p,item,null);
  if(originalSlot==="main"){p.weaponItem=null;p.weapon=p.classId==="mage"?"Apprentice Staff":p.classId==="tank"?"Guardian Mace":"Training Sword"}
  if(originalSlot==="chest"){p.armorItem=null;p.armor=p.classId==="mage"?"Novice Robe":p.classId==="tank"?"Guardian Armor":"Traveler Armor"}
 }
 updateStats(p,prev,item);
 item.equippedSlot=targetSlot;
 if(targetSlot==="main"){p.weaponItem=item;p.weapon=item.name}
 if(targetSlot==="chest"){p.armorItem=item;p.armor=item.name}
 return{ok:true,slot:targetSlot,itemUid:item.uid};
}
function unequip(p,slot){
 if(!SLOTS.includes(slot))return{ok:false,error:"Invalid equipment slot."};
 const old=equipped(p,slot);
 if(old&&bagUsed(p)>=40)return{ok:false,error:"Bag full (40/40). Free a slot before unequipping."};
 if(!old){
  const legacy=slot==="main"?p.weaponItem:slot==="chest"?p.armorItem:null;
  if(!legacy)return{ok:false,error:"This slot is already empty."};
  updateStats(p,legacy,null);
 }else{updateStats(p,old,null);delete old.equippedSlot}
 if(slot==="main"){p.weaponItem=null;p.weapon=p.classId==="mage"?"Apprentice Staff":p.classId==="tank"?"Guardian Mace":"Training Sword"}
 if(slot==="chest"){p.armorItem=null;p.armor=p.classId==="mage"?"Novice Robe":p.classId==="tank"?"Guardian Armor":"Traveler Armor"}
 return{ok:true,slot};
}
module.exports={SLOTS,RARITIES,canonical,normalizeInventory,dropBossLoot,dropEncounterLoot,encounterDrops,miniDrops,equip,unequip,equipped,slotOf,bagUsed,factory,BOSS_DROPS,MINI_DROPS,bossDrops};
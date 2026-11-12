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
const FACTORS={common:1,uncommon:1.35,rare:1.8,epic:2.45,legendary:3.4};
/* v0.36: curated boss-specific drops. Each roll is exclusive: at most one
 * piece of gear per boss victory per player, with the remainder being no-drop.
 * Existing legacy loot remains valid when restored from saves.
 */
const BOSS_DROPS=[
 [{slot:"main",rarity:"rare",chance:20,name:"Briarfang Saber"},{slot:"ring_left",rarity:"uncommon",chance:35,name:"Alpha Fang Ring"}],
 [{slot:"chest",rarity:"rare",chance:30,name:"Dreadforge Plate"},{slot:"offhand",rarity:"rare",chance:20,name:"Forgeguard Shield"}],
 [{slot:"main",rarity:"epic",chance:20,name:"Emberweave Staff",class:"mage"},{slot:"boots",rarity:"rare",chance:30,name:"Ashwalker Boots"}],
 [{slot:"neck",rarity:"epic",chance:28,name:"Oracle's Eye Pendant"},{slot:"pants",rarity:"rare",chance:25,name:"Diviner's Leggings"}],
 [{slot:"head",rarity:"epic",chance:30,name:"Glacier Crown"},{slot:"ring_left",rarity:"epic",chance:20,name:"Frozen Oath Ring"}],
 [{slot:"chest",rarity:"legendary",chance:12,name:"World-Eater Carapace"},{slot:"offhand",rarity:"epic",chance:32,name:"Ancient Stoneguard"}],
 [{slot:"main",rarity:"legendary",chance:15,name:"Voidreaper Scythe"},{slot:"neck",rarity:"epic",chance:28,name:"Voidbound Amulet"}],
 [{slot:"main",rarity:"legendary",chance:20,name:"Sovereign's Eclipse Blade"},{slot:"ring_left",rarity:"legendary",chance:12,name:"Eclipse Royal Signet"}]
];
function curatedDrops(stage){
 const i=Math.floor(Number(stage)/3)-1;
 if(!Number.isInteger(stage)||stage%3!==0||i<0||i>=8)return [];
 return BOSS_DROPS[i].map(def=>({...def,id:"boss"+(i+1)+"_"+def.slot,bossStage:stage}));
}
const SLOT_ALIASES={weapon:"main",armor:"chest",helmet:"head",necklace:"neck",ring:"ring_left",shield:"offhand"};
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,Math.trunc(Number(v)||0)));
function slotOf(item){return SLOT_ALIASES[item?.slot]||item?.slot||null}
function rarityFromRoll(){const r=Math.random();return r<.50?"common":r<.78?"uncommon":r<.94?"rare":r<.99?"epic":"legendary"}
function validLootId(id){return /^boss([1-8])_(head|chest|pants|boots|main|offhand|neck|ring_left|ring_right)$/.exec(String(id||""))}
function factory(id,rarity){
 const m=validLootId(id);if(!m||!RARITIES.includes(rarity))return null;
 const boss=Number(m[1]),slot=m[2],power=Math.round((3+boss*2.15)*FACTORS[rarity]),isWeapon=slot==="main",armor=["chest","pants","head","boots"].includes(slot);
 const stats={
  value:isWeapon?Math.max(2,Math.round(power*1.4)):0,
  defense:armor?Math.max(1,Math.round(power*(slot==="chest"?.72:.42))):slot==="offhand"?Math.max(1,Math.round(power*.66)):Math.max(0,Math.round(power*.2)),
  maxHp:armor?Math.round(power*(slot==="chest"?3.8:1.7)):slot.startsWith("ring")?Math.round(power*1.2):0,
  maxMp:slot==="neck"?Math.round(power*2.5):slot.startsWith("ring")?Math.round(power*.9):0
 };
 if(slot==="offhand")stats.value=Math.round(power*.2);
 if(slot==="neck")stats.value=Math.round(power*.45);
 if(slot.startsWith("ring"))stats.value=Math.round(power*.3);
 const curated=BOSS_DROPS[boss-1].find(d=>d.slot===slot&&d.rarity===rarity);
 return {id,templateId:id,name:curated?.name||(TITLES[boss-1]+" "+BASE_NAMES[slot]+" ["+rarity.toUpperCase()+"]"),icon:ICONS[slot],slot,rarity,level:1,bossStage:boss*3,...(curated?.class?{class:curated.class}:{}),
  value:stats.value,defense:stats.defense,maxHp:stats.maxHp,maxMp:stats.maxMp,
  description:Object.entries(stats).filter(([,n])=>n>0).map(([k,n])=>"+"+n+" "+({value:"ATK",defense:"DEF",maxHp:"HP",maxMp:"MP"}[k])).join(" · ")};
}
function canonical(saved,shopItems){
 if(!saved||typeof saved!=="object")return null;
 const id=String(saved.id||"");let item;
 if(validLootId(id)){
  item=factory(id,String(saved.rarity||"common").toLowerCase());
  // Never mutate a v0.34 owned item into a new v0.36 exclusive drop (or
  // retroactively impose a Mage-only restriction on an old generic sword).
  const match=validLootId(id);
  const oldName=TITLES[Number(match[1])-1]+" "+BASE_NAMES[match[2]]+" ["+item.rarity.toUpperCase()+"]";
  if(saved.name===oldName){item.name=oldName;delete item.class}
 }
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
function dropBossLoot(player,stage,logger=()=>{}){
 if(stage%3!==0)return null;
 player.inventory=Array.isArray(player.inventory)?player.inventory:[];
 if(bagUsed(player)>=40){logger(player.name+"'s bag is full (40/40): boss loot was not collected.");return null}
 const options=curatedDrops(stage);
 const roll=Math.random()*100;
 let cumulative=0,chosen=null;
 for(const option of options){cumulative+=option.chance;if(roll<cumulative){chosen=option;break}}
 if(!chosen){logger(player.name+" found no equipment from "+TITLES[Math.round(stage/3)-1]+".");return null}
 const it=factory(chosen.id,chosen.rarity);
 it.uid=randomUUID();player.inventory.push(it);
 logger(player.name+" received "+it.rarity.toUpperCase()+" boss loot: "+it.name+"!");
 return it;
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
module.exports={SLOTS,RARITIES,canonical,normalizeInventory,dropBossLoot,equip,unequip,equipped,slotOf,bagUsed,factory,curatedDrops,BOSS_DROPS};
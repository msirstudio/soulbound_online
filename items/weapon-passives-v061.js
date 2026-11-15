"use strict";
/* SOULBOUND 0.61: server-authoritative, bounded weapon passives.
 * Saved items only need their stable v0.60 IDs. No migration or client trust.
 * No change to legacy damage for any hero without one of these 15 equipped. */
const elemental=require("../elemental-v0552");
const spec=Object.freeze({
 silver_fang:{element:"physical",name:"Silver Precision",chance:.18,kind:"precision",description:"18%: +9% weapon-hit damage (max 32)."},
 flamebrand:{element:"fire",name:"Living Ember",chance:.20,kind:"burn",description:"20%: Burn for 2 enemy turns (2% Max HP per tick, max 40)."},
 thunder_edge:{element:"lightning",name:"Chain Spark",chance:.18,kind:"chain",description:"18%: lightning jumps to another foe, or jolts the target (max 55)."},
 abyss_blade:{element:"void",name:"Void Leech",chance:.19,kind:"drain",description:"19%: restore HP equal to 8% of the hit (max 38)."},
 dawnbringer:{element:"light",name:"Dawn's Grace",chance:.16,kind:"radiance",description:"16%: radiant bonus (max 80) and restore 2% Max HP."},
 moon_staff:{element:"arcane",name:"Lunar Focus",chance:.22,kind:"mana",description:"22%: restore 4 MP on a successful hit."},
 frost_scepter:{element:"ice",name:"Frostbite",chance:.22,kind:"chill",description:"22%: Chill reduces the target's next attack damage by 20%."},
 stormcaller:{element:"lightning",name:"Storm Echo",chance:.21,kind:"chain",description:"21%: chain magic to another foe (max 65)."},
 void_staff:{element:"void",name:"Void Mark",chance:.18,kind:"mark",description:"18%: target takes 20% more damage for its next vulnerable turn."},
 celestial_staff:{element:"light",name:"Celestial Mercy",chance:.18,kind:"ally_heal",description:"18%: heal the lowest-HP ally for 3% Max HP (max 45)."},
 ironbreaker:{element:"earth",name:"Iron Fracture",chance:.19,kind:"fracture",description:"19%: expose armor briefly and add 6 Stagger to bosses."},
 earthshaker:{element:"earth",name:"Quake Impact",chance:.25,kind:"quake",description:"25%: gain 18 additional Stagger against bosses and mini-bosses."},
 runic_hammer:{element:"arcane",name:"Runic Suppression",chance:.20,kind:"weaken",description:"20%: Weaken reduces the target's next hit by 12%."},
 titan_crusher:{element:"earth",name:"Titan Finisher",chance:.17,kind:"execute",description:"17%: +9% damage, or +18% below 50% enemy HP (max 90)."},
 divine_aegis:{element:"light",name:"Sacred Bulwark",chance:.18,kind:"ward",description:"18%: protect the party from its next enemy attack (18% reduction)."}
});
const rows=Object.freeze(Object.fromEntries(Object.entries(spec).map(([id,detail])=>[id,Object.freeze({...detail,id})])));
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,Number(n)||0));
function weaponFor(player){
 if(!player||!Array.isArray(player.inventory))return null;
 const equipped=player.inventory.find(it=>it?.equippedSlot==="main"&&it.uid&&it.uid===player.weaponItem?.uid);
 if(!equipped||!rows[equipped.id])return null;
 // The authoritative catalog, not untrusted inventory metadata, determines stats/passive.
 const item=require("./weapon-shop-v060").WEAPONS.find(it=>it.id===equipped.id);
 if(!item||item.class!==player.classId||Number(player.level)<item.level)return null;
 return rows[equipped.id];
}
function attackElement(player,type,intrinsic="physical"){
 if(!["attack","skill","skill2","skill3","skill4","skill5","skill6","skill7"].includes(type))return intrinsic;
 // Preserve unique Mage spell elements and the Paladin's Light skill.
 if(intrinsic!=="physical")return intrinsic;
 return weaponFor(player)?.element||intrinsic;
}
function event(room,data){
 room.weaponFxSeq=(room.weaponFxSeq||0)+1;
 room.weaponFx=(room.weaponFx||[]).concat([{id:room.weaponFxSeq,...data}]).slice(-16);
}
function visual(room,target,weapon,kind,value=0,element=weapon.element){
 if(!room||!target||!weapon)return;
 event(room,{enemyId:target.enemyId||null,element,kind,
  label:weapon.name,amount:Math.floor(value)||0});
}
function applyPassive({room,player,target,baseDamage,action,random=Math.random,say=()=>{},combat}){
 if(!["attack","skill","skill2","skill3","skill4","skill5","skill6","skill7"].includes(action)||
  !room||!target||target.hp<=0||baseDamage<=0)return {triggered:false,bonus:0};
 const weapon=weaponFor(player);
 if(!weapon)return {triggered:false,bonus:0};
 const element=attackElement(player,action,combat.skillElement(player,action));
 if(element!=="physical")visual(room,target,weapon,"hit",0,element);
 const roll=clamp(random(),0,1);
 if(roll>=weapon.chance)return {triggered:false,bonus:0};
 let bonus=0,detail="",kind=weapon.kind;
 const extra=(ratio,cap)=>Math.max(1,Math.min(cap,Math.floor(Math.max(1,baseDamage)*ratio)));
 const restoreHp=(hero,amount)=>{const old=hero.hp;hero.hp=Math.min(hero.maxHp,hero.hp+amount);return hero.hp-old};
 const stagger=(key)=>{if(target.boss||target.miniBoss)combat.addStagger(room,player,key,element,say)};
 switch(kind){
  case "precision":bonus=extra(.09,32);detail="precision";break;
  case "burn":{
   const damage=Math.max(1,Math.min(40,Math.ceil(target.maxHp*.02)));
   const old=target.weaponBurn||{};
   target.weaponBurn={turns:2,damage:Math.max(damage,old.damage||0)};
   detail="Burn 2 enemy turns";break;
  }
  case "chain":{
   const other=(room.enemies||[]).find(x=>x!==target&&x.hp>0);
   const chainDamage=extra(weapon.id==="stormcaller"?.17:.13,weapon.id==="stormcaller"?65:55);
   if(other){other.hp=Math.max(0,other.hp-chainDamage);visual(room,other,weapon,"chain",chainDamage);detail="chain "+chainDamage+" to "+other.name}
   else{bonus=chainDamage;detail="spark "+bonus}
   break;
  }
  case "drain":detail="heal "+restoreHp(player,extra(.08,38))+" HP";break;
  case "radiance":bonus=extra(.13,80);detail="radiant burst and heal "+restoreHp(player,Math.ceil(player.maxHp*.02))+" HP";break;
  case "mana":{const prev=player.mp;player.mp=Math.min(player.maxMp,player.mp+4);detail="restore "+(player.mp-prev)+" MP";break;}
  case "chill":combat.debuffMonster(target,"chill",1);detail="Chill";break;
  case "mark":target.vulnerableTurns=Math.max(target.vulnerableTurns||0,2);detail="Void Mark";break;
  case "ally_heal":{
   const ally=[...room.players.values()].filter(x=>x.hp>0).sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0]||player;
   detail="heal "+ally.name+" "+restoreHp(ally,Math.min(45,Math.ceil(ally.maxHp*.03)))+" HP";break;
  }
  case "fracture":target.vulnerableTurns=Math.max(target.vulnerableTurns||0,2);stagger("weapon_ironbreaker");detail="armor fractured";break;
  case "quake":stagger("weapon_earthshaker");detail="extra Stagger";break;
  case "weaken":combat.debuffMonster(target,"weaken",1);detail="Weaken";break;
  case "execute":bonus=extra(target.hp/Math.max(1,target.maxHp)<.5?.18:.09,90);detail="Titan Finisher";break;
  case "ward":
   room.partyWardTurns=Math.max(room.partyWardTurns||0,1);
   room.partyWardReduction=Math.max(room.partyWardReduction||0,.18);
   detail="party ward 18%";break;
 }
 if(bonus)target.hp=Math.max(0,target.hp-bonus);
 say(room,"✦ "+player.name+"'s "+weapon.name+" activates "+detail+(bonus?" · +"+bonus+" damage":"")+".");
 visual(room,target,weapon,"passive",bonus,element);
 return {triggered:true,bonus,weaponId:weapon.id,kind};
}
function tickBurn(monster){
 if(!monster?.weaponBurn||monster.hp<=0)return {damage:0,defeated:false};
 const fire=monster.weaponBurn;
 const amount=Math.min(monster.hp,Math.max(1,Math.floor(fire.damage)||1));
 monster.hp=Math.max(0,monster.hp-amount);
 fire.turns--;
 if(fire.turns<=0)monster.weaponBurn=null;
 return {damage:amount,defeated:monster.hp<=0,remaining:Math.max(0,fire.turns)};
}
function recordBurn(room,target,amount){visual(room,target,rows.flamebrand,"burn",amount)}
module.exports={spec:rows,weaponFor,attackElement,applyPassive,tickBurn,recordBurn};

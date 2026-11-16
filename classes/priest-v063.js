"use strict";
/* SOULBOUND v0.63 · bounded support and Light spells; server owns healing. */
const ID="priest";
const STARTER=Object.freeze({name:"Priest",hp:145,mp:90,atk:18,def:10,speed:10,weapon:"Novice Scepter",armor:"Pilgrim Robe"});
const SKILLS=Object.freeze({
 skill:Object.freeze({name:"HOLY BOLT",icon:"✨",mult:1.45,cost:12,unlock:1,cd:2,element:"light",area:false,description:"Focused Light damage."}),
 skill2:Object.freeze({name:"MENDING PRAYER",icon:"💚",mult:0,cost:22,unlock:3,cd:3,element:"light",area:false,utility:true,description:"Heal the most injured living ally for 24% Max HP (max 115)."}),
 skill3:Object.freeze({name:"RADIANT WAVE",icon:"☀️",mult:1.5,cost:20,unlock:5,cd:3,element:"light",area:true,description:"Light damage to all living enemies."}),
 skill4:Object.freeze({name:"SANCTUARY",icon:"🛡️",mult:0,cost:30,unlock:8,cd:4,element:"light",area:false,utility:true,description:"Give the whole party a 25% damage-reduction ward for the next 2 enemy turns."}),
 skill5:Object.freeze({name:"PURIFY",icon:"🌟",mult:0,cost:24,unlock:5,cd:4,element:"light",area:false,utility:true,description:"Remove ailments from the most afflicted living ally and heal 8% Max HP (max 50)."}),
 skill6:Object.freeze({name:"BENEDICTION",icon:"🌿",mult:0,cost:28,unlock:7,cd:4,element:"light",area:false,utility:true,description:"Heal every living ally for 12% Max HP each (max 75 each)."}),
 skill7:Object.freeze({name:"JUDGMENT",icon:"⚖️",mult:2.35,cost:32,unlock:9,cd:4,element:"light",area:false,description:"Strong single-target Light attack."})
});
const TYPES=Object.freeze(Object.keys(SKILLS));
function definition(type){return SKILLS[type]?{...SKILLS[type]}:null}
const living=r=>[...r.players.values()].filter(p=>p.hp>0);
function lowest(r){return living(r).sort((a,b)=>(a.hp/Math.max(1,a.maxHp))-(b.hp/Math.max(1,b.maxHp)))[0]||null}
function mostAfflicted(r){return living(r).filter(p=>Array.isArray(p.statusEffects)&&p.statusEffects.length).sort((a,b)=>b.statusEffects.length-a.statusEffects.length)[0]||null}
function heal(target,ratio,cap){if(!target||target.hp<=0)return 0;const gain=Math.min(Math.max(0,target.maxHp-target.hp),Math.min(cap,Math.ceil(target.maxHp*ratio)));target.hp+=gain;return gain;}
function validateUtility(type,r){
 if(type==="skill2"&&living(r).every(p=>p.hp===p.maxHp))return "All living allies already have full HP.";
 if(type==="skill6"&&living(r).every(p=>p.hp===p.maxHp))return "All living allies already have full HP.";
 if(type==="skill5"&&!mostAfflicted(r)&&living(r).every(p=>p.hp===p.maxHp))return "No ally needs healing or cleansing.";
 return null;
}
function castUtility(type,r,p,say){
 if(type==="skill2"){const target=lowest(r),amount=heal(target,.24,115);say(r,"💚 "+p.name+" uses MENDING PRAYER: "+target.name+" restores "+amount+" HP.");return true;}
 if(type==="skill4"){
  r.partyWardTurns=Math.max(Number(r.partyWardTurns)||0,2);
  r.partyWardReduction=Math.max(Number(r.partyWardReduction)||0,.25);
  say(r,"🛡️ "+p.name+" casts SANCTUARY: party receives a 25% ward for the next 2 enemy turns.");
  return true;
 }
 if(type==="skill5"){
  const target=mostAfflicted(r)||lowest(r),removed=(target.statusEffects||[]).map(x=>x.id);
  target.statusEffects=[];target.controlImmunityTurns=Math.max(target.controlImmunityTurns||0,2);
  const amount=heal(target,.08,50);
  say(r,"✨ "+p.name+" casts PURIFY on "+target.name+": cleanses "+(removed.join(", ")||"no ailments")+" and restores "+amount+" HP.");
  return true;
 }
 if(type==="skill6"){
  const recipients=living(r),total=recipients.reduce((sum,target)=>sum+heal(target,.12,75),0);
  say(r,"🌿 "+p.name+" casts BENEDICTION: "+recipients.length+" heroes recover "+total+" HP in total.");
  return true;
 }
 return false;
}
module.exports={ID,STARTER,SKILLS,TYPES,definition,validateUtility,castUtility};

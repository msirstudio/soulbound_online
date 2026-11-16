"use strict";
/* Public projections of the SERVER's real skill definitions.
 * Name, multipliers, cooldowns, mana cost, class and unlock level are NEVER
 * duplicated in the browser or Adventure INDEX. No game balance changes. */
const core=require("./skills");
const combat=require("../combat-v055");
const CLASSES=Object.freeze(["swordsman","mage","tank","archer","assassin","priest"]);
const ICONS=Object.freeze({
 swordsman:["🔥","✴","🛡","⚡","⚔"],
 mage:["🔮","☄","❄","🌠","✦","💧","⚡"],
 tank:["🛡","🧱","📣","🏰","🛡"],
 archer:["🏹","🌧","🪢","🎯","🔍","🌿","🦅"],
 assassin:["🗡️","🌀","🕸️","🎯","🔍","🌫️","🌑"],
 priest:["✨","💚","☀️","🛡️","🌟","🌿","⚖️"]
});
/* Descriptions are qualitative-only. Numbers come from the executable combat
 * definitions so the UI cannot claim an outdated MP cost or multiplier. */
const DESCRIPTIONS=Object.freeze({
 swordsman:["Strong focused strike","Hits multiple enemies","Weakens enemy attacks and grants temporary protection","Powerful finishing slash","Marks an enemy to take extra damage"],
 mage:["Focused arcane bolt","Area fire spell","Area ice spell, chills enemies and restores some HP","Strong arcane burst","Marks an enemy to take extra damage","Area water spell","Lightning spell"],
 tank:["Frontline strike","Defensive blow","Taunts enemies to protect allies","Heavy melee strike","Grants temporary damage reduction"],
 archer:["Fast single-target arrow","Area attack with multiple arrows","Weakens target's next attack","Powerful piercing arrow","Exposes target to increased damage","Nature area attack","Extra damage against a badly wounded target"]
});
function skillsFor(classId="swordsman"){
 const cls=CLASSES.includes(classId)?classId:"swordsman",player={classId:cls};
 const types=["mage","archer","assassin","priest"].includes(cls)?core.SKILL_TYPES:core.SKILL_TYPES.slice(0,5);
 return types.map((type,index)=>{
  const actual=core.definition(player,type);
  if(!actual)throw new Error("Missing authoritative skill definition "+cls+":"+type);
  return Object.freeze({
   type,classId:cls,name:actual.name,mult:actual.mult,cost:actual.cost,unlock:actual.unlock,
   cd:actual.cd,area:!!actual.area,element:combat.skillElement(player,type),
   icon:actual.icon||ICONS[cls][index],description:actual.description||DESCRIPTIONS[cls][index],utility:!!actual.utility
  });
 });
}
module.exports={CLASSES,skillsFor};

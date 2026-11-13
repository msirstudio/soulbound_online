"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const chart=require("../elemental-v0552"),combat=require("../combat-v055");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const ids=Object.keys(chart.ELEMENTS);
test("exactly ten damage types: Physical, seven previous elements, Water and Lightning",()=>{
 assert.equal(ids.length,10);
 for(const id of ["physical","nature","fire","ice","arcane","earth","void","light","water","lightning"])
  assert.ok(chart.ELEMENTS[id],id);
 assert.equal(combat.codexData().elements.length,10);
});
test("one consistent global matchup for every attack x defender pair",()=>{
 assert.deepEqual(chart.STRONG_VS,{
  physical:[],nature:["water","earth"],fire:["nature","ice"],
  water:["fire","earth"],ice:["nature","water"],earth:["fire","lightning"],
  lightning:["water","ice"],arcane:["earth"],void:["arcane","light"],light:["void"]
 });
 for(const attacker of ids){
  for(const defender of ids){
   const relation=chart.relation(attacker,defender),value=chart.OUTCOMES[relation];
   assert.ok(["strong","resisted","neutral"].includes(relation),attacker+"/"+defender);
   assert.ok([.8,1,1.2].includes(value),attacker+"/"+defender);
   const enemy={regionId:"cursed_wilds",boss:false};
   if(attacker==="physical"||defender==="physical")assert.equal(relation,"neutral");
   if(attacker===defender&&attacker!=="physical")assert.equal(relation,"resisted");
   if(attacker!==defender&&attacker!=="physical"&&defender!=="physical"){
    const opposite=chart.relation(defender,attacker);
    if(["light/void","void/light"].includes(attacker+"/"+defender)){
     assert.equal(relation,"strong");assert.equal(opposite,"strong");
    }else if(relation==="strong")assert.equal(opposite,"resisted",attacker+"/"+defender);
   }
   void enemy;
  }
 }
});
test("boss exceptions only add neutral matchups; ordinary enemies follow standard chart",()=>{
 const base={regionId:"dreadforge_bastion",boss:false};
 const boss={...base,boss:true};
 assert.equal(chart.relation("ice","earth"),"neutral");
 assert.equal(chart.multiplier(base,"ice"),1);
 assert.equal(chart.multiplier(boss,"ice"),1.2);
 assert.equal(chart.multiplier({...boss,miniBoss:true,boss:false},"ice"),1);
 assert.equal(chart.multiplier(boss,"water"),1.2);
 assert.equal(chart.multiplier(boss,"lightning"),.8);
 const nature={regionId:"cursed_wilds",boss:true};
 assert.equal(chart.relation("void","nature"),"neutral");
 assert.equal(chart.multiplier(nature,"void"),.8);
 assert.equal(chart.multiplier({...nature,boss:false},"void"),1);
 for(const [regionId,b] of Object.entries(chart.BOSS_EXCEPTIONS)){
  const element=chart.REGIONS[regionId];
  for(const extra of [...b.weak,...b.resist])
   assert.equal(chart.relation(extra,element),"neutral",regionId+":"+extra);
 }
});
test("all 8 zone bosses and Eclipse Phase 2 use documented standard plus special strengths",()=>{
 for(const [regionId,element] of Object.entries(chart.REGIONS)){
  const normal=chart.profileFor({regionId,boss:false});
  const boss=chart.profileFor({regionId,boss:true});
  assert.equal(normal.element,element);assert.equal(boss.element,element);
  for(const name of ids){
   const v=chart.multiplier({regionId,boss:false},name);
   assert.equal(v,chart.OUTCOMES[chart.relation(name,element)]);
  }
  for(const extra of boss.extraWeak)assert.equal(chart.multiplier({regionId,boss:true},extra),1.2);
  for(const extra of boss.extraResist)assert.equal(chart.multiplier({regionId,boss:true},extra),.8);
 }
 assert.equal(chart.multiplier({regionId:"ember_caverns",boss:true},"ice"),.8,
  "Fire-type Ember Tyrant must resist Ice under the clear chart, not retain its old contradictory Ice weakness.");
 assert.equal(chart.multiplier({regionId:"ember_caverns",boss:true},"water"),1.2);
 assert.equal(chart.multiplier({regionId:"eclipse_throne",boss:true,phase:2},"light"),1.2);
 assert.equal(chart.multiplier({regionId:"eclipse_throne",boss:true,phase:2},"void"),.8);
});
test("new Water/Lightning Mage skills are real unlockable authoritative actions",()=>{
 const mage={classId:"mage",raceId:"human",level:80,mp:100,cooldowns:{}};
 const knight={...mage,classId:"swordsman"};
 assert.equal(combat.skillElement(mage,"skill6"),"water");
 assert.equal(combat.skillElement(mage,"skill7"),"lightning");
 assert.equal(combat.validateAction(knight,"skill6",{players:new Map()}),"Only mages can cast this spell.");
 assert.equal(combat.validateAction(knight,"skill7",{players:new Map()}),"Only mages can cast this spell.");
 assert.equal(combat.validateAction({...mage,level:6},"skill6",{players:new Map()}),"Unlocks at level 7.");
 assert.equal(combat.validateAction({...mage,level:8},"skill7",{players:new Map()}),"Unlocks at level 9.");
 assert.equal(combat.validateAction(mage,"skill6",{players:new Map()}),null);
 assert.equal(combat.validateAction(mage,"skill7",{players:new Map()}),null);
 const server=read("server.js"),game=read("public/game.js"),html=read("public/index.html");
 assert.ok(server.includes('skill6:{cost:22,mult:1.8,unlock:7,name:"TIDAL SURGE",cd:3}'));
 assert.ok(server.includes('skill7:{cost:26,mult:1.95,unlock:9,name:"THUNDERBOLT",cd:3}'));
 assert.ok(game.includes('"skill6Button"')&&game.includes('"skill7Button"'));
 assert.ok(html.includes('data-action="skill6"')&&html.includes('data-action="skill7"'));
});
test("actual boss AI uses Water and Lightning regional moves, and INDEX uses same chance data",()=>{
 for(const [regionId,name,element] of [
  ["cursed_wilds","Monsoon Surge","water"],
  ["dreadforge_bastion","Stormhammer","lightning"]
 ]){
  const m={name:"Boss",regionId,stage:regionId==="cursed_wilds"?5:10,boss:true,miniBoss:false,
   hp:500,maxHp:500,atk:50,def:10,combatTurn:2,partySize:2,phase:null};
  const move=combat.moveFor(m,{players:new Map()});
  assert.equal(move.name,name);
  assert.equal(move.element,element);
  assert.equal(move.charge,true);
  const entry=combat.enemyCodex(m),record=entry.moves.find(x=>x.name===name);
  assert.ok(record);assert.equal(record.chance,move.chance);
 }
});
test("INDEX includes clearly explained strong, weak and resisted pairs plus boss exceptions",()=>{
 const catalog=combat.codexData(),index=read("public/adventure-index-v0552.js");
 assert.equal(catalog.elements.length,10);
 assert.ok(catalog.elements.find(x=>x.id==="water").strongAgainst.includes("fire"));
 assert.ok(catalog.elements.find(x=>x.id==="lightning").strongAgainst.includes("water"));
 assert.ok(catalog.chart.priority.includes("Boss-only"));
 assert.ok(catalog.combatRules.damage.includes("Light and Void beat each other"));
 for(const label of ["STRONG AGAINST","WEAK TO","RESISTS ATTACKS FROM","BOSS-ONLY EXCEPTIONS"])
  assert.ok(index.includes(label),label);
 assert.ok(index.includes("INDEX UI v0.55.2"));
 assert.ok(index.includes("/api/index?codex=0.55.2"));
 assert.ok(read("public/index.html").includes('adventure-index-v0552.js'));
});

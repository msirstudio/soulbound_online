"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const f=require("../combat/formulas"),skills=require("../combat/skills");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const same=(actual,expected,what)=>assert.equal(actual,expected,what);
test("0.58 player basic attacks equal 0.57 formula for all 8 region defense bands, elements and damage buffs",()=>{
 let cases=0;
 for(let region=0;region<8;region++)for(const attack of [12,22,70,214,640])
  for(const defense of [0,10,40,77,150+region*24])
   for(const roll of [0,3,7])for(const elem of [.8,1,1.2])
    for(const boost of [1,1.1,1.15,1.38])for(const vulnerable of [false,true]){
     const expected=Math.max(1,Math.floor((attack+roll-defense)*boost*elem*(vulnerable?1.2:1)));
     const actual=f.basicAttack({attack,defense,randomRoll:roll,attackMultiplier:boost,elementMultiplier:elem,vulnerable});
     same(actual,expected,"region "+region+" basic/element/DEF parity");cases++;
    }
 assert.ok(cases>=5000);
});
test("0.58 skill attacks equal 0.57 including archmage bonus, elemental relation and floor ordering",()=>{
 for(const atk of [16,25,214,650])for(const def of [0,25,77,240])
  for(const multiplier of [.8,.9,1.25,1.6,1.8,1.9,1.95,2,2.5,3])
   for(const roll of [0,7,11])for(const element of [.8,1,1.2])
    for(const archmage of [false,true]){
     const expected=Math.max(1,Math.floor((Math.floor(atk*multiplier*(archmage?1.1:1))+roll-def)*1.15*element*1.2));
     same(f.skillAttack({attack:atk,defense:def,skillMultiplier:multiplier,randomRoll:roll,attackMultiplier:1.15,elementMultiplier:element,vulnerable:true,archmage}),expected,"skill parity");
    }
});
test("BREAK and area splash exactly retain previous 0.57 DEF correction and elemental ratios",()=>{
 for(const atk of [18,214,550])for(const defense of [0,19,77,320])for(const roll of [0,2,4]){
  const expected=Math.max(1,Math.floor((atk*.85+roll-defense)*1.08*1.2));
  same(f.breakAttack({attack:atk,defense,randomRoll:roll,attackMultiplier:1.08,vulnerable:true}),expected,"BREAK parity");
 }
 for(const d of [1,29,200,1200])for(const atk of [25,214])
  for(const primaryDef of [0,18,120])for(const secondaryDef of [0,77,220])
   for(const element of [.8,1,1.2]){
    const base=Math.max(1,atk*2.5),correction=Math.max(.4,Math.min(1.6,(base-secondaryDef)/Math.max(1,base-primaryDef)));
    const expected=Math.max(1,Math.floor(d*.65*correction*(element/Math.max(.01,1.2))));
    same(f.areaSplash({primaryDamage:d,attack:atk,primaryDefense:primaryDef,secondaryDefense:secondaryDef,primaryElement:1.2,secondaryElement:element,skillMultiplier:2.5}),expected,"AoE parity");
   }
});
test("Enemy DEF/Guard/ward/race reductions preserve 0.57 exactly, including DEF 77",()=>{
 for(const atk of [28,53,129,450])for(const def of [0,18,77,180,600])
  for(const power of [.56,.85,1,1.28])for(const elemental of [.85,1,1.2])
   for(const weakened of [.8,.88,1]){
    const raw=Math.max(1,Math.round(atk*power*weakened*elemental*(100/(100+Math.max(0,def)*.85))));
    same(f.enemyRaw({attack:atk,power,debuffMultiplier:weakened,elementMultiplier:elemental,defense:def}),raw,"enemy raw parity");
    for(const guard of [.55,1]){
     const expected=Math.max(1,Math.floor(raw*.8*.8*(1-.08)*.75*guard));
     same(f.enemyFinal({raw,reduction:.8,foodGuard:.8,raceReduction:.08,partyWard:.75,guardReduction:guard}),expected,"enemy mitigation parity");
    }
   }
 const result=f.enemyRaw({attack:129,defense:77});
 assert.ok(result>=75&&result<=85,"high-DEF regression");
});
test("Single canonical skills catalog matches all 3 classes, costs, cooldowns, AoE and unlocks",()=>{
 const expectedCosts={skill:[12,1],skill2:[25,3],skill3:[20,5],skill4:[30,8],skill5:[24,5],skill6:[22,7],skill7:[26,9],break:[15,1],cleanse:[12,1]};
 for(const [type,val] of Object.entries(expectedCosts))assert.deepEqual(skills.SKILL_COSTS[type],val);
 for(const cls of ["mage","swordsman","tank"])for(const type of skills.SKILL_TYPES){
  const def=skills.definition({classId:cls},type);
  assert.equal(def.cost,expectedCosts[type][0]);
  assert.equal(def.unlock,expectedCosts[type][1]);
  assert.equal(def.area,skills.isAreaSkill({classId:cls},type));
  assert.ok(def.cd>0&&def.mult>0&&def.name.length>=5);
 }
 assert.equal(skills.definition({classId:"mage"},"skill2").name,"METEOR");
 assert.equal(skills.definition({classId:"tank"},"skill2").name,"IRON WALL");
 assert.equal(skills.definition({classId:"swordsman"},"skill2").name,"WHIRLWIND");
 assert.equal(skills.definition({classId:"mage"},"skill3").mult,1.6);
 assert.equal(skills.isAreaSkill({classId:"tank"},"skill2"),false);
 assert.equal(skills.isAreaSkill({classId:"mage"},"skill6"),true);
 assert.equal(skills.areaMultiplier("skill2"),2.5);
});
test("Actual server and boss pipeline call central formulas rather than using copied arithmetic",()=>{
 const server=read("server.js"),enemy=read("combat-v054.js"),advanced=read("combat-v055.js");
 for(const call of ["formulas.basicAttack","formulas.skillAttack","formulas.breakAttack","formulas.areaSplash","skillCore.definition","skillCore.isAreaSkill"])assert.ok(server.includes(call),call);
 assert.ok(!server.includes("const specs={skill:"));
 assert.ok(enemy.includes("formulas.enemyRaw")&&enemy.includes("formulas.enemyFinal"));
 assert.ok(advanced.includes("const SKILL_COSTS=skillCore.SKILL_COSTS;"));
 const pkg=require("../package.json"),html=read("public/index.html");
 assert.equal(pkg.version,"0.60.0");
 assert.ok(html.includes("<small>v0.60</small>"));
 assert.ok(html.includes('game.js?v=0.60'));
});

"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const assassin=require("../classes/assassin-v063"),priest=require("../classes/priest-v063");
const core=require("../combat/skills"),combat=require("../combat-v055"),publicSkills=require("../combat/public-skill-catalog-v062");
const secure=require("../persistence/secure-saves-v057"),catalog=require("../data/game-catalog-v062");
const index=require("../api/adventure-index-v062").buildIndex("0.63");
function room(...members){return{players:new Map(members.map((p,i)=>[String(i),p])),partyWardTurns:0,partyWardReduction:0};}
function hero(name,hp,maxHp,statusEffects=[]){return{name,hp,maxHp,statusEffects,controlImmunityTurns:0};}
test("all SIX class starters are distinct; backend secure saves honor two new classes",()=>{
 for(const cls of ["assassin","priest"]){
  const stats=cls==="assassin"?assassin.STARTER:priest.STARTER;
  const slot=secure.starter(cls,"Hero");
  for(const [key,value] of Object.entries({hp:stats.hp,max_hp:stats.hp,mp:stats.mp,max_mp:stats.mp,attack:stats.atk,defense:stats.def,speed:stats.speed,weapon:stats.weapon,armor:stats.armor}))assert.equal(slot[key],value,cls+" "+key);
  assert.equal(slot.class_id,cls);
 }
 const cls=publicSkills.CLASSES;
 assert.deepEqual(cls,["swordsman","mage","tank","archer","assassin","priest"]);
 assert.equal(index.skills.filter(x=>x.classId==="assassin").length,7);
 assert.equal(index.skills.filter(x=>x.classId==="priest").length,7);
});
test("all new MP, cooldowns, AoE and elements use server core definitions and INDEX",()=>{
 for(const cls of ["assassin","priest"]){
  const skills=publicSkills.skillsFor(cls);
  assert.equal(skills.length,7);
  for(const s of skills){
   const real=core.definition({classId:cls},s.type);
   for(const k of ["name","cost","mult","unlock","cd","element","area"])
    assert.equal(s[k],real[k],cls+" "+s.type+" "+k);
   assert.equal(combat.skillElement({classId:cls},s.type),s.element);
  }
 }
 assert.equal(core.isAreaSkill({classId:"assassin"},"skill2"),true);
 assert.equal(core.isAreaSkill({classId:"priest"},"skill3"),true);
 assert.equal(core.isAreaSkill({classId:"priest"},"skill6"),false);
});
test("server rejects premature, cooling and unaffordable Priest/Assassin skills",()=>{
 for(const cls of ["assassin","priest"]){
  const p={classId:cls,level:1,mp:90,cd:0,cooldowns:{},raceId:"human"};
  const r=room(p);
  assert.equal(combat.validateAction(p,"skill",r),null);
  assert.equal(combat.validateAction(p,"skill7",r),"Unlocks at level 9.");
  p.level=9;p.mp=0;
  assert.equal(combat.validateAction(p,"skill7",r),"Not enough MP.");
  p.mp=100;p.cooldowns.skill7=2;
  assert.match(combat.validateAction(p,"skill7",r),/cooldown/i);
 }
});
test("Priest Mending Prayer selects injured ally, never overheals and never resurrects the dead",()=>{
 const p=hero("Priest",120,145),a=hero("Tank",30,300),b=hero("Dead",0,200);
 const r=room(p,a,b),messages=[];
 assert.equal(priest.validateUtility("skill2",r),null);
 assert.equal(priest.castUtility("skill2",r,p,(_,m)=>messages.push(m)),true);
 assert.equal(a.hp,102);
 assert.equal(b.hp,0);
 assert.equal(p.hp,120);
 assert.match(messages[0],/MENDING PRAYER/);
 a.hp=300;p.hp=145;
 assert.match(priest.validateUtility("skill2",r),/full HP/i);
});
test("Priest Sanctuary cannot stack beyond 25% and lasts two incoming turns",()=>{
 const p=hero("Priest",120,145),r=room(p);
 let text="";
 priest.castUtility("skill4",r,p,(_,m)=>text=m);
 assert.equal(r.partyWardTurns,2);assert.equal(r.partyWardReduction,.25);
 priest.castUtility("skill4",r,p,()=>{});
 assert.equal(r.partyWardTurns,2);assert.equal(r.partyWardReduction,.25);
 assert.match(text,/SANCTUARY/);
});
test("Priest Purify cleanses most afflicted ally and Bennediction heals only living heroes",()=>{
 const p=hero("Priest",115,145),a=hero("A",20,200,[{id:"burn",turns:2},{id:"stun",turns:1}]),dead=hero("Dead",0,100);
 const r=room(p,a,dead);
 assert.equal(priest.validateUtility("skill5",r),null);
 priest.castUtility("skill5",r,p,()=>{});
 assert.equal(a.statusEffects.length,0);
 assert.equal(a.hp,36);
 assert.equal(a.controlImmunityTurns,2);
 const before=a.hp;
 priest.castUtility("skill6",r,p,()=>{});
 assert.equal(a.hp,before+24);
 assert.equal(dead.hp,0);
});
test("Assassin critical chance deterministic, finisher under 40% and damage bonus bounded",()=>{
 assert.equal(assassin.crit({random:()=>.129}).critical,true);
 assert.equal(assassin.crit({random:()=>.131}).critical,false);
 assert.equal(assassin.crit({random:()=>0}).multiplier,1.3);
 assert.equal(assassin.finisher({hp:40,maxHp:100},100),0);
 assert.equal(assassin.finisher({hp:39,maxHp:100},100),12);
 assert.equal(assassin.finisher({hp:10,maxHp:100},1000),45);
});
test("both class weapons appear once in live shop and INDEX, without changing 40 stages",()=>{
 const names=catalog.shopItems.filter(x=>["assassin","priest"].includes(x.class));
 assert.equal(names.length,6);
 assert.equal(new Set(names.map(x=>x.id)).size,6);
 for(const item of names){
  const found=index.items.find(x=>x.id===item.id);
  assert.equal(found.price,item.price);
  assert.equal(found.value,item.value);
  assert.equal(found.level,item.level);
  assert.equal(found.class,item.class);
 }
 assert.equal(index.monsters.length,40);
});
test("UI and socket implementation expose six classes with SVG fallbacks, never duplicate original avatar PNGs",()=>{
 const game=read("public/game.js"),server=read("server.js"),art=read("public/hero-art-v030.js"),html=read("public/index.html");
 for(const id of ["assassin","priest"]){
  assert.ok(html.includes('data-hero-class="'+id+'"'));
  assert.ok(html.includes('<option value="'+id+'">'));
  assert.ok(server.includes('c==="'+id+'"'));
  assert.ok(game.includes(id+':{hp:'));
  assert.ok(art.includes(id));
 }
 assert.ok(server.includes('priestClass.castUtility(type,r,p,say)'));
 assert.ok(server.includes('assassinClass.finisher(m,d)'));
 assert.ok(read("public/skill-view-v062.js").includes('sk.utility?'));
 assert.ok(html.includes('v063-classes.css?v=0.63'));
 assert.ok(read("public/adventure-index-v0552.js").includes("HEAL / SUPPORT"));
});

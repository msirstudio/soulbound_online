"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const world=require("../world-v040"),combat=require("../combat-v055");
const core=require("../combat/skills"),pack=world.encounterPack;
const catalog=require("../data/game-catalog-v062");
const book=require("../combat/public-skill-catalog-v062");
const api=require("../api/adventure-index-v062");
const index=api.buildIndex("0.63");
test("authoritative catalogs contain all 40 stages, 8 bosses and 8 named minis",()=>{
 assert.equal(catalog.normal.length,5);
 assert.equal(catalog.bosses.length,8);
 assert.equal(world.regions.length,8);
 assert.equal(index.monsters.length,world.totalStages);
 for(let i=0;i<8;i++){
  const mini=index.monsters[i*5+3],boss=index.monsters[i*5+4];
  assert.equal(mini.name,world.regions[i].miniName);
  assert.equal(boss.name,catalog.bosses[i].name);
  assert.equal(mini.regionId,world.regions[i].id);
  assert.equal(boss.regionId,world.regions[i].id);
 }
});
test("INDEX stats are EXACT live pack spawn stats for 40 stages and every 1–4 player scenario",()=>{
 for(let stage=1;stage<=world.totalStages;stage++){
  const actual=index.monsters[stage-1];
  const first=world.encounter(stage,catalog.normal,catalog.bosses);
  assert.equal(actual.name,first.name);
  for(const n of [1,2,3,4]){
   const variants=actual.partyPreview.find(row=>row.partySize===n).variants;
   for(const roll of [0,.999999]){
    const room={stage,players:{size:n},enemies:[],monster:null};
    const live=pack.makeGroup(room,first,catalog.normal,()=>roll);
    const snapshot={count:live.length,hp:live[0].maxHp,atk:live[0].atk,def:live[0].def,
      xp:live[0].xp,gold:live[0].gold,...(live[0].boss?{phase2Atk:Math.max(1,Math.round(live[0].atk*1.12))}:{})};
    assert.ok(variants.some(x=>JSON.stringify(x)===JSON.stringify(snapshot)),
     "Stage "+stage+", party="+n+" roll="+roll+"; preview must equal makeGroup()");
   }
  }
 }
});
test("INDEX shop items use same names, stats, gates, costs and passive data as live shop",()=>{
 const matches=index.items.filter(x=>x.price!=null);
 assert.equal(matches.length,catalog.shopItems.length);
 assert.equal(new Set(catalog.shopItems.map(x=>x.id)).size,catalog.shopItems.length);
 for(const item of catalog.shopItems){
  const shown=matches.find(x=>x.id===item.id);
  assert.ok(shown,"missing "+item.id);
  for(const key of ["name","price","class","level","value","defense","requiredBoss"]){
   assert.equal(shown[key],item[key],item.id+"."+key);
  }
  assert.deepEqual(shown.passive,item.passive);
 }
});
test("every client skill and INDEX skill is projected directly from executable core",()=>{
 assert.equal(index.skills.length,38);
 for(const cls of book.CLASSES){
  const list=book.skillsFor(cls),inIndex=index.skills.filter(s=>s.classId===cls);
  assert.equal(list.length,["mage","archer","assassin","priest"].includes(cls)?7:5);
  assert.deepEqual(inIndex,list);
  for(const shown of list){
   const real=core.definition({classId:cls},shown.type);
   for(const prop of ["name","cost","unlock","mult","cd","area"]){
    assert.equal(shown[prop],real[prop],cls+"."+shown.type+"."+prop);
   }
   assert.equal(shown.element,combat.skillElement({classId:cls},shown.type));
  }
 }
});
test("server and browser no longer contain competing enemy templates or skill numeric tables",()=>{
 const server=read("server.js"),game=read("public/game.js"),indexUi=read("public/adventure-index-v0552.js"),html=read("public/index.html");
 assert.ok(server.includes('data","game-catalog-v062.js'));
 assert.ok(server.includes('api","adventure-index-v062.js'));
 assert.ok(server.includes("adventureIndex.buildIndex(APP_VERSION)"));
 assert.ok(server.includes("skillBook:publicSkills.skillsFor(p.classId)"));
 assert.ok(!server.includes('const normal=[{name:"Mossfang Wolf"'));
 assert.ok(!server.includes('const shopItems=[{id:"health_potion"'));
 assert.ok(!game.includes("const skillTips=tank?"));
 assert.ok(!game.includes("skill3Cost=elf?"));
 assert.ok(game.includes("SoulboundSkillViewV062"));
 assert.ok(html.includes("skill-view-v062.js?v=0.63"));
 assert.ok(indexUi.includes("skillDetail(sk)"));
});

test("skill-view uses the exact server snapshot for each class, including true mage cooldowns",()=>{
 const vm=require("node:vm");
 const buttons=new Map();
 for(const type of core.SKILL_TYPES){
  buttons.set(type,{
   dataset:{action:type},classList:{toggle(){}},hidden:false,disabled:false,
   removeAttribute(){},setAttribute(name,value){this[name]=value}
  });
 }
 const document={querySelector(sel){const hit=sel.match(/data-action="([^"]+)"/);return hit?buttons.get(hit[1]):null}};
 const sandbox={window:{},document};
 vm.runInNewContext(read("public/skill-view-v062.js"),sandbox);
 const view=sandbox.window.SoulboundSkillViewV062;
 assert.ok(view);
 const mage={classId:"mage",level:80,mp:120,raceId:"elf",cooldowns:{skill2:2},skillBook:book.skillsFor("mage")};
 view.render(mage);
 const meteor=buttons.get("skill2");
 assert.ok(meteor.textContent.includes("METEOR"));
 assert.ok(meteor.textContent.includes("CD 2"));
 assert.ok(meteor.dataset.tooltip.includes("Cooldown: 3 rounds"),"use real core cooldown, not obsolete UI constant");
 assert.ok(meteor.dataset.tooltip.includes("Mana: 23 MP"));
 assert.equal(view.cost(mage,view.skill(mage,"skill2")),23);
 const archer={classId:"archer",level:1,raceId:"human",cooldowns:{},skillBook:book.skillsFor("archer")};
 view.render(archer);
 assert.ok(buttons.get("skill").textContent.includes("QUICK SHOT"));
 assert.equal(buttons.get("skill2").hidden,true);
 const tank={classId:"tank",level:80,raceId:"human",cooldowns:{},skillBook:book.skillsFor("tank")};
 view.render(tank);
 assert.equal(buttons.get("skill6").hidden,true);
 assert.equal(buttons.get("skill7").hidden,true);
});
test("equipment HUD no longer carries a second independent shop stat table",()=>{
 const game=read("public/game.js");
 assert.ok(game.includes('["weapon","armor"].includes(it.slot)'));
 assert.ok(game.includes('me?.inventory||[]'));
 assert.ok(!game.includes('"Iron Armor":"+5 DEF'));
 assert.ok(!game.includes('"Steel Blade":"+16 ATK'));
});

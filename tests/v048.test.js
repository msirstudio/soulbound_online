"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const loot=require("../loot-v034");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("every boss has 2–4 drops; every mini has 1–2; counts differ between bosses",()=>{
 const bosses=[],minis=[];
 for(let i=1;i<=8;i++){
  const b=loot.bossDrops(i),m=loot.miniDrops(i);
  assert.ok(b.length>=2&&b.length<=4,"boss "+i);
  assert.ok(m.length>=1&&m.length<=2,"mini "+i);
  bosses.push(b.length);minis.push(m.length);
  assert.equal(new Set(b.map(x=>x.id)).size,b.length);
  assert.equal(new Set(m.map(x=>x.id)).size,m.length);
  for(const row of [...b,...m]){
   const [min,max]=loot.CHANCE_BANDS[row.rarity];
   assert.ok(row.chance>=min&&row.chance<=max,"drop "+row.name);
  }
 }
 assert.ok(new Set(bosses).size>=3,"bosses should not all have the same number of drops");
 assert.ok(new Set(minis).size>=2);
 assert.deepEqual(bosses,[2,3,3,2,3,2,3,4]);
 assert.deepEqual(minis,[1,2,1,2,1,2,1,2]);
});
test("late bosses 6, 7, 8 reward only Epic and Legendary gear",()=>{
 for(let region=6;region<=8;region++){
  for(const item of loot.bossDrops(region))assert.ok(["epic","legendary"].includes(item.rarity));
 }
});
test("independent multi-drop, no-drop, and existing saved gear still work",()=>{
 const saved={id:"boss1_head",rarity:"common",uid:"persisted_old_gear"};
 assert.equal(loot.canonical(saved,[]).id,saved.id,"older items should remain restorable");
 const old=Math.random;
 try{
  const h={name:"Player",inventory:[],worldProgress:{}};
  Math.random=()=>0;assert.equal(loot.dropEncounterLoot(h,10).length,3);
  Math.random=()=>.999;assert.equal(loot.dropEncounterLoot(h,10).length,0);
 }finally{Math.random=old}
});
test("city restores lower hero HUD; retains other city hotspots without duplicate Bag",()=>{
 const css=read("public/v048-city.css");
 const city=read("public/world-ui-v040.js");
 assert.doesNotMatch(css,/#game\.v040-hub \.v22-command-dock\{display:none/);
 assert.doesNotMatch(css,/#game\.v040-hub \.game-layout \.game-main-column\{display:none/);
 assert.doesNotMatch(css,/#game \.v22-command-dock\s*\{display:none/);
 assert.ok(!city.includes('id="v040Bag"'));
 assert.ok(city.includes('id="v040BackCity"'));
 assert.ok(city.includes('id="v047Adventure"'));
});
test("each city storefront restricts the categories visible in the merchant",()=>{
 const g=read("public/game.js"),ui=read("public/world-ui-v040.js");
 assert.match(g,/cityShopScope=category==="potion"\?\["potion","food"\]/);
 assert.match(g,/b\.hidden=!!cityShopScope&&/);
 assert.match(g,/cityShopScope\.includes\(it\.category\)/);
 assert.match(g,/cityShopScope&&!cityShopScope\.includes\(b\.dataset\.shopCategory\)/);
 for(const item of ['data-v047-shop="weapon"','data-v047-shop="armor"','data-v047-shop="potion"']) assert.ok(ui.includes(item));
});

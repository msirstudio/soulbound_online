"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {bundles,buildBundle}=require("../scripts/build-css-bundles.js");
const root=path.resolve(__dirname,"..","public");
test("CSS bundles contain the complete original source styles in unchanged order",()=>{
 for(const [dest,sources] of Object.entries(bundles)){
  const result=fs.readFileSync(path.join(root,dest),"utf8");
  assert.equal(result,buildBundle(sources),"Outdated bundle: "+dest+". Run node scripts/build-css-bundles.js");
  assert.deepEqual([...result.matchAll(/\/\* BEGIN ([^*]+) \*\//g)].map(m=>m[1]),sources);
 }
});
test("Game loads bundled CSS and final UI override without double-loading sources",()=>{
 const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
 const links=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m=>m[1]);
 assert.equal(links.length,16);
 for(const dest of Object.keys(bundles))assert.equal(links.filter(x=>x.split("?")[0]===dest).length,1,dest);
 for(const file of Object.values(bundles).flat())assert.ok(!links.some(x=>x.split("?")[0]===file),"Original CSS still linked: "+file);
 const expected=["css-legacy-v0555.css?v=0.55.5","v040.css","v041.css","css-hud-v0555.css?v=0.55.5","v045.css","v046-atlas.css","v047-city.css","v048-city.css","v0482-title-cover.css","v0483-camp-log.css","v0484-audio-boss-log.css","v0485-character-overview.css","css-combat-v0555.css?v=0.55.5","v0551-index-status-boss.css","v0552-elemental.css?v=0.55.3","v0557-compact-battle.css?v=0.55.7"];
 assert.deepEqual(links,expected,"Cascade order must not change");
});

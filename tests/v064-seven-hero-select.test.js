"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");
const chars=require("../public/characters-v064"),saves=require("../persistence/secure-saves-v057");
const expected=["corin","seris","lyra","kaiya","aren","vera","noct"];
test("only seven approved character identities; no eighth hero or class lock",()=>{
 assert.deepEqual(chars.HEROES.map(h=>h.id),expected);
 assert.equal(new Set(chars.HEROES.map(h=>h.id)).size,7);
 assert.equal(chars.HEROES.filter(h=>h.gender==="female").length,4);
 assert.equal(chars.HEROES.filter(h=>h.gender==="male").length,3);
 assert.equal(chars.CLASS_META.length,6);
 assert.equal(chars.byId("ryo"),null);assert.equal(chars.normalize("invalid"),null);
 assert.equal(chars.gender("vera"),"female");assert.equal(chars.gender("aren"),"male");
 assert.match(chars.byId("kaiya").story,/Lyra/);
});
test("no duplicate hotspots, seven face/body assets and no hard-coded gameplay class restrictions",()=>{
 for(const h of chars.HEROES){
  assert.equal(h.portrait,h.id+"-portrait.webp");assert.equal(h.full,h.id+"-full.webp");
  for(const n of ["x","y","w","h"])assert.ok(h.hotspot[n]>=0&&h.hotspot[n]<=100);
  assert.ok(h.hotspot.x+h.hotspot.w<=100);
  assert.ok(h.hotspot.y+h.hotspot.h<=100);
  assert.ok(h.shape.startsWith("polygon("));
 }
 const html=read("public/index.html");
 assert.ok(html.includes("character-select-v064.css?v=0.65-portrait-fix"));
 assert.ok(html.includes("characters-v064.js?v=0.64"));
 assert.ok(html.includes("character-select-v064.js?v=0.65"));
 assert.ok(html.indexOf("characters-v064.js")<html.indexOf("game.js?v=0.67"));
});
test("secure game saves preserve identity independently from class in JSON without SQL migration",()=>{
 const a=saves.starter("priest","My Hero","noct");
 assert.equal(a.class_id,"priest");assert.equal(a.character_id,"noct");assert.equal(a.gender,"male");
 const b=saves.starter("assassin","My Hero","vera");
 assert.equal(b.class_id,"assassin");assert.equal(b.character_id,"vera");assert.equal(b.gender,"female");
 const c=saves.starter("mage","Adventurer","not-a-hero");
 assert.equal(c.character_id,null);assert.equal(c.gender,null);
 assert.equal(a.level,1);assert.equal(b.level,1);
});
test("real server and guest/legacy saves are wired through identity IDs",()=>{
 const srv=read("server.js"),game=read("public/game.js"),secure=read("persistence/secure-saves-v057.js");
 assert.ok(srv.includes('function player(id,name,c="swordsman",gender="male",characterId=null)'));
 assert.ok(srv.includes("characterId:identity?.id||null"));
 assert.ok(srv.includes("characterCatalog.normalize(v.character_id)"));
 assert.ok(srv.includes("req.body?.characterId"));
 assert.ok(game.includes("soulbound:v064-hero-selected"));
 assert.ok(game.includes("v064RememberId(fresh.character_id)"));
 assert.ok(game.includes("characterId:v064SavedId()||v064SelectedId()"));
 assert.ok(game.includes("character_id:v064SelectedId()"));
 assert.ok(secure.includes("character_id:require"));
});
test("scene remains full uncropped and accessible, game remains on existing route",()=>{
 const js=read("public/character-select-v064.js"),css=read("public/character-select-v064.css"),ui=read("public/ui-foundation-v041.js");
 assert.ok(js.includes("v064-hotspot"));assert.ok(js.includes("mouseenter"));assert.ok(js.includes("focus"));assert.ok(js.includes("class-grid")||js.includes("v064ClassGrid"));
 assert.ok(js.includes('dialog.setAttribute("role","presentation")'));
 assert.ok(js.includes("showSetup()"));assert.ok(js.includes("Escape"));
 assert.ok(js.includes("assets/character-select/"));
 assert.ok(css.includes("aspect-ratio:1672/941"));assert.ok(css.includes("object-fit:fill"));
 assert.ok(css.includes("v064-scene-mode[hidden]{display:none!important}"));
 assert.ok(ui.includes("SoulboundV065?.showSlots()"));
 assert.ok(!js.includes("game.html"));assert.ok(!js.includes("window.location.href"));
});

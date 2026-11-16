"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const season=require("../public/season-v065");
const saves=require("../persistence/secure-saves-v057");
test("v0.65 reset has one shared season and six classes remain playable",()=>{
 assert.equal(season.ID,"rebirth-2026-11");
 assert.equal(season.isCurrent({season_id:season.ID}),true);
 assert.equal(season.isCurrent({class_id:"mage"}),false);
 const roster=require("../public/characters-v064");
 assert.equal(roster.HEROES.length,7);assert.equal(roster.CLASS_META.length,6);
 for(const c of roster.CLASS_META){
  const data=saves.starter(c.id,"Hero","lyra");
  assert.equal(data.season_id,season.ID);assert.equal(data.class_id,c.id);
  assert.equal(data.character_id,"lyra");assert.equal(data.level,1);
 }
 assert.match(read("persistence/secure-saves-v057.js"),/season[.]isCurrent\(row[.]data\)/);
});
test("title -> slot cards -> guild class popup -> direct game, no second old creator screen",()=>{
 const html=read("public/index.html"),ui=read("public/ui-foundation-v041.js");
 const flow=read("public/slot-first-v065.js"),select=read("public/character-select-v064.js");
 const game=read("public/game.js"),css=read("public/slot-first-v065.css");
 assert.ok(ui.includes("SoulboundV065?.showSlots()"));
 assert.ok(html.includes("slot-first-v065.js?v=0.65"));
 assert.ok(html.includes("slot-first-v065.css?v=0.65"));
 assert.ok(html.indexOf("slot-first-v065.js")<html.indexOf("game.js?v=0.66"));
 assert.ok(flow.includes("CHOOSE YOUR SAVE SLOT"));
 assert.ok(flow.includes('data-v065-slot'));
 assert.ok(flow.includes("function showGuild()"));
 assert.ok(select.includes("SoulboundV065?.onConfirmed"));
 assert.ok(!select.includes("closeModal();showSetup();"));
 assert.ok(game.includes("window.SoulboundV065.onSlotSelected=async"));
 assert.ok(game.includes("window.SoulboundV065.onConfirmed=async"));
 assert.ok(game.includes('const created=await $("newGame").onclick()'));
 assert.ok(game.includes("const ok=await v065EnterRoom(!!code)"));
 assert.ok(game.includes("if(exists)"));
 assert.ok(game.includes('$("continueGame").onclick()'));
 assert.ok(game.includes('window.SoulboundV065.showGuild()'));
 assert.ok(css.includes("v041-lobby-grid{display:none!important}"));
});
test("new game bypasses confirmation only for genuinely empty new-season slots",()=>{
 const game=read("public/game.js");
 assert.ok(game.includes('if(savedCharacter?.class_id&&!confirm("Replace SLOT "'));
 assert.ok(game.includes("return true;};"));
 assert.ok(game.includes("v065AcceptSave(row.slot,row.data)"));
 assert.ok(game.includes("v065AcceptSave(1,v561ReadLocal(1))"));
 assert.ok(game.includes("v065AcceptSave(1,await loadProfile())"));
 assert.ok(game.includes('season_id:V065_SEASON'));
 assert.ok(game.includes('localStorage.setItem(v065LegacyMarker(),V065_SEASON)'));
 assert.ok(game.includes("v065PurgeOldLocalSaves"));
 assert.ok(game.includes("soulbound_world_progress_v065_"));
 assert.ok(game.includes("soulbound_reconnect_v065_"));
});
test("one-time global reset SQL backs up data and preserves user accounts",()=>{
 const sql=read("SUPABASE-V065-ONE-TIME-RESET-ALL-PROGRESS.sql");
 assert.match(sql,/BEGIN;/);assert.match(sql,/COMMIT;/);
 assert.match(sql,/soulbound_admin\.reset_runs/);
 assert.match(sql,/secure_saves_backup_20261116/);
 assert.match(sql,/hero_slots_backup_20261116/);
 assert.match(sql,/profiles_backup_20261116/);
 assert.match(sql,/DELETE FROM public\.hero_secure_saves/);
 assert.match(sql,/DELETE FROM public\.hero_save_slots/);
 assert.match(sql,/DELETE FROM public\.profiles/);
 assert.doesNotMatch(sql,/DELETE FROM auth\.users/i);
 assert.doesNotMatch(read("server.js"),/SUPABASE-V065-ONE-TIME-RESET/);
});
test("slot landing builds exactly three buttons without overlaying the guild",()=>{
 class Fake{
  constructor(){this.hidden=false;this.innerHTML="";this.style={};this.classList={add(){},remove(){},toggle(){}}}
  setAttribute(){}
  querySelectorAll(){return []}
  querySelector(){return this.bar||null}
  before(x){this.inserted=x}
 }
 const lobby=new Fake(),classic=new Fake(),bar={textContent:""},stage=new Fake(),strip=new Fake();
 lobby.querySelector=selector=>selector===".v041-lobby-grid"?classic:selector===".v041-view-bar span"?bar:null;
 const elements={lobby,v064CharacterScene:stage,v064ReturnStrip:strip,v065SlotCards:new Fake(),v065RoomCode:{value:""},v065Status:{textContent:"",classList:{toggle(){}}}};
 const document={getElementById:id=>elements[id]||null,createElement:()=>new Fake()};
 const window={SoulboundCharacterSelectV064:{showScene(){stage.hidden=false}}};
 vm.runInNewContext(read("public/slot-first-v065.js"),{document,window});
 const flow=window.SoulboundV065;assert.ok(flow);
 flow.setSlots([{exists:true,name:"Lyra",level:12,className:"mage"},{exists:false},{exists:false}]);
 assert.equal((elements.v065SlotCards.innerHTML.match(/data-v065-slot=/g)||[]).length,3);
 assert.ok(elements.v065SlotCards.innerHTML.includes("CONTINUE"));
 assert.ok(elements.v065SlotCards.innerHTML.includes("CREATE HERO"));
 flow.showSlots();assert.equal(stage.hidden,true);assert.equal(classic.hidden,true);
 flow.showGuild();assert.equal(stage.hidden,false);
});

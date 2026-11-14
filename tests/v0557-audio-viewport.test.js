"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const html=read("public/index.html"),css=read("public/v0557-compact-battle.css");
test("Audio button retains one original ID but lives in the lower command dock",()=>{
 const start=html.indexOf('<div class="v22-command-dock"');
 const end=html.indexOf('<div class="game-layout">',start);
 const room=html.substring(html.indexOf('<div class="roomline panel">'),start);
 const dock=html.substring(start,end);
 assert.ok(start>=0&&end>start);
 assert.ok(dock.includes('id="audioSettingsToggle"'));
 assert.ok(dock.includes('id="audioSettings"'));
 assert.equal((html.match(/id="audioSettingsToggle"/g)||[]).length,1);
 assert.equal((html.match(/id="audioSettings"/g)||[]).length,1);
 assert.ok(!room.includes('id="audioSettingsToggle"'));
 for(const id of ["musicQuick","sfxQuick","gameMusicVolume","gameSfxVolume","audioTest"])
  assert.equal((html.match(new RegExp('id="'+id+'"',"g"))||[]).length,1);
});
test("Bottom Audio popover opens upward with the same hidden state",()=>{
 assert.ok(css.includes('bottom:calc(100% + 8px)!important'));
 assert.ok(css.includes('#audioSettings[hidden]'));
 assert.ok(html.includes('v0557-compact-battle.css?v=0.55.7'));
});
test("Desktop screen-fit is scoped to visible game, protects short viewports",()=>{
 assert.ok(css.includes('body:has(#game:not([hidden]))'));
 assert.ok(css.includes('@media (min-width:1060px) and (min-height:700px)'));
 assert.ok(css.includes('overflow-y:auto!important'));
 assert.ok(css.includes('@media (max-width:1059px),(max-height:699px)'));
 for(const id of ["partySprites","heroHud","skillButton","musicQuick","audioSettingsToggle"])
  assert.ok(html.includes('id="'+id+'"'));
});

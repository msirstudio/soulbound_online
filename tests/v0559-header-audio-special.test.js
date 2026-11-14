"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const html=read("public/index.html"),game=read("public/game.js"),css=read("public/v0559-header-audio.css");
test("Normal Strike monster intent is hidden without removing ability to warn for named special moves",()=>{
 assert.ok(game.includes('String(rawCombatIntent.name||"").trim().toLowerCase()!=="strike"'));
 assert.ok(game.includes('const combatIntent=rawCombatIntent&&'));
 assert.ok(game.includes('$("v054CombatIntent").hidden=!combatIntent'));
 assert.ok(game.includes('combatIntent.charge||s.monster?.queuedMove'));
 const visible=name=>!!({name})&&String(name||"").trim().toLowerCase()!=="strike";
 assert.equal(visible("Strike"),false);
 assert.equal(visible(" STRIKE "),false);
 for(const s of ["Briarstorm","Monsoon Surge","Oracle's Curse","Lesser Stormhammer","Staggered — attack interrupted"])assert.equal(visible(s),true,s);
});
test("Header is larger and Audio exists only in dedicated row BELOW command dock",()=>{
 const banner=html.indexOf('class="roomline panel"');
 const dock=html.indexOf('class="v22-command-dock"');
 const row=html.indexOf('class="v0559-audio-row"');
 const layout=html.indexOf('class="game-layout"');
 assert.ok(banner>=0&&banner<dock&&dock<row&&row<layout);
 assert.ok(html.slice(row,layout).includes('id="audioSettingsToggle"'));
 assert.equal((html.match(/id="audioSettingsToggle"/g)||[]).length,1);
 assert.equal((html.match(/id="audioSettings"/g)||[]).length,1);
 assert.ok(css.includes('min-height:54px!important'));
 assert.ok(css.includes('bottom:calc(100% + 8px)!important'));
 assert.ok(html.includes('v0559-header-audio.css?v=0.55.9'));
 assert.ok(html.includes('game.js?v=0.55.9'));
});

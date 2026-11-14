"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),world=require("../world-v040");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("each region has exactly five stages and mini-boss appears on local stage four",()=>{
 assert.equal(world.regions.length,8);assert.equal(world.totalStages,40);
 for(let region=0;region<8;region++){
  const base=region*5,miniStage=base+4,bossStage=base+5;
  assert.equal(world.regions[region].miniStage,miniStage);
  assert.equal(world.regions[region].bossStage,bossStage);
  assert.equal(world.meta(miniStage).type,"mini");
  assert.equal(world.meta(bossStage).type,"boss");
  for(const stage of [base+1,base+2,base+3])assert.equal(world.meta(stage).type,"normal");
 }
});
test("server strictly restricts traveling merchant to defeated mini-boss at global stages 4,9,...39",()=>{
 const s=read("server.js");
 const open=s.slice(s.indexOf('s.on("openShop"'),s.indexOf('s.on("buyItem"'));
 assert.match(open,/const miniCleared=r\.stage%5===4&&!!r\.monster\?\.miniBoss/);
 assert.match(open,/status==="victory"&&miniCleared/);
 assert.doesNotMatch(open,/\["victory","regionClear"\]\.includes\(status\)/);
 assert.match(open,/r\.shopOrigin=fromCamp\?"camp":"city"/);
 assert.match(open,/r\.shopReturnStatus=status/);
 assert.match(open,/r\.status=roadside&&\["victory","regionClear"\]/);
 for(const banned of ["r.stage=","r.regionIndex=","p.hp=","p.mp="])assert.ok(!open.includes(banned));
});
test("client displays camp button only after mini-boss victory and keeps city merchants separate",()=>{
 const g=read("public/game.js"),ui=read("public/world-ui-v040.js");
 assert.ok(g.includes('s.status==="victory"&&s.stage%5===4&&!!s.monster?.miniBoss'));
 assert.ok(g.includes('call("openShop",{category:"potion"})'));
 assert.ok(ui.includes('s.shopOrigin==="city"'));
 assert.ok(g.includes('s.shopOrigin==="camp"'));
});
test("audio popup is single home for music mute, sfx mute, both volumes and test sound",()=>{
 const html=read("public/index.html"),game=read("public/game.js");
 const start=html.indexOf('id="audioSettingsToggle"');
 const end=html.indexOf('<div class="game-layout">',start);
 const region=html.slice(start,end);
 assert.ok(start>=0&&end>start&&start>html.indexOf('class="v22-command-dock"'));
 for(const id of ['id="audioSettings"','id="musicQuick"','id="sfxQuick"','id="gameMusicVolume"','id="gameSfxVolume"','id="audioTest"'])assert.ok(region.includes(id),id);
 const preceding=html.slice(Math.max(0,start-260),start);
 assert.ok(!preceding.includes('id="musicQuick"'));
 assert.ok(!preceding.includes('id="sfxQuick"'));
 assert.ok(game.includes('$("musicQuick").onclick=toggleMusic'));
 assert.ok(game.includes('sfxQuick.onclick=()=>'));
});
test("mini-boss and boss status badges are above the monster sprite and styled distinctly",()=>{
 const html=read("public/index.html"),g=read("public/game.js"),css=read("public/v0484-audio-boss-log.css");
 const mark=html.indexOf('id="bossTag"'),sprite=html.indexOf('id="monsterSprite"');
 assert.ok(mark>=0&&sprite>=0&&mark<sprite);
 assert.equal(html.split('id="bossTag"').length,2,"one unique tag");
 assert.ok(g.includes('"MINI BOSS"'));
 assert.ok(g.includes('"MAIN BOSS"'));
 assert.ok(g.includes('v0484-mini'));
 assert.ok(g.includes('v0484-boss'));
 assert.ok(css.includes('.v0484-elite-tag.v0484-mini'));
 assert.ok(css.includes('.v0484-elite-tag.v0484-boss'));
});
test("log scroll box is stretched to the bottom edge of its panel",()=>{
 const css=read("public/v0484-audio-boss-log.css");
 assert.match(css,/\.merchant-log-panel #log\{/);
 assert.ok(css.includes('position:absolute!important'));
 assert.ok(css.includes('top:45px!important'));
 assert.ok(css.includes('bottom:8px!important'));
 assert.ok(css.includes('overflow-y:auto!important'));
});
test("v0.55 resources and release log are linked",()=>{
 const html=read("public/index.html"),pkg=require("../package.json"),log=read("public/update-log-v045.js");
 assert.equal(pkg.version,"0.57.0");
 assert.ok(html.includes('href="v0484-audio-boss-log.css"'));
 assert.ok(html.includes('VERSION 0.57 · SECURE SAVES'));
 assert.ok(log.includes('version:"0.48.4"'));
});

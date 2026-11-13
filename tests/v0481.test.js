"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("hero HUD remains visible in city and merchant scenes",()=>{
 const css=read("public/v048-city.css"),ui=read("public/world-ui-v040.js");
 assert.doesNotMatch(css,/#game\.v040-hub \.v22-command-dock\s*\{\s*display:\s*none/);
 assert.doesNotMatch(css,/#game\.v040-hub \.game-layout[^}]*height:\s*0/);
 assert.doesNotMatch(css,/#game\.v040-hub \.game-layout \.game-main-column[^}]*display:\s*none/);
 assert.match(ui,/const cityLike=s\.status==="city"\|\|\(s\.status==="shop"&&s\.shopOrigin==="city"\)/);
 assert.match(ui,/\$\("v040City"\)\.hidden=!cityLike/);
 assert.match(ui,/\$\("arena"\)\.hidden=cityLike/);
});
test("boss clear remains in defeated monster scene; player chooses next map or city",()=>{
 const server=read("server.js"),ui=read("public/world-ui-v040.js");
 assert.match(server,/r\.status=r\.stage%5===0\?"regionClear":"victory"/);
 assert.match(ui,/s\.shopOrigin==="city"/);
 assert.match(ui,/CHOOSE NEXT REGION/);
 assert.match(ui,/\["city","victory","regionClear","defeat"\]\.includes\(latest\?\.status\)\)show/);
 assert.match(server,/\["city","regionClear","defeat"\]\.includes\(r\.status\)/);
});
test("closing merchant does not reset stage, region, monster or player stats",()=>{
 const server=read("server.js"),game=read("public/game.js"),ui=read("public/world-ui-v040.js");
 const start=server.indexOf('s.on("closeShop"'),end=server.indexOf('s.on("buyItem"',start);
 assert.ok(start>=0&&end>start);
 const section=server.slice(start,end);
 assert.match(section,/r\.status=roadside&&\["victory","regionClear"\]/);
 assert.match(section,/r\.shopCategory=null/);
 for(const forbidden of ["r.stage=","r.monster=","p.hp=","p.mp=","p.cooldowns=","r.regionIndex="])
  assert.ok(!section.includes(forbidden),"closeShop must not reset "+forbidden);
 assert.match(game,/call\("closeShop"\)/);
 assert.match(game,/close\.addEventListener\("click",closeMerchant\)/);
 assert.match(game,/\$\("continueShop"\)\.hidden=true/);
 assert.match(ui,/\$\("v040BackCity"\)\.hidden=true/);
});
test("v0.48.4 version is shown and Update Log describes the fix",()=>{
 const html=read("public/index.html"),pkg=require("../package.json"),log=read("public/update-log-v045.js");
 assert.equal(pkg.version,"0.48.4");
 assert.ok(html.includes("VERSION 0.48.4 · AUDIO & MINI BOSS"));
 assert.ok(log.includes('version:"0.48.1"'));
});

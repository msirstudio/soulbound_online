"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("city uses only lower Equipment & Bag; no redundant floating bag",()=>{
 const ui=read("public/world-ui-v040.js"),html=read("public/index.html");
 assert.ok(!ui.includes('id="v040Bag"'));
 assert.ok(!ui.includes('$("v040Bag").onclick'));
 assert.ok(html.includes("toggleEquipment"));
 assert.ok(ui.includes('id="v047Adventure"'));
});
test("roadside camp after victory is separate from capital merchant and does not reset stage",()=>{
 const server=read("server.js");
 const s=server.slice(server.indexOf('s.on("openShop"'),server.indexOf('s.on("buyItem"'));
 assert.match(s,/\["victory","regionClear"\]/);
 assert.match(s,/r\.shopOrigin=fromCamp\?"camp":"city"/);
 assert.match(s,/r\.shopReturnStatus=status/);
 assert.match(s,/r\.status=roadside&&\["victory","regionClear"\]/);
 assert.ok(!s.includes('r.stage='),"merchant must not reset stage");
 assert.ok(!s.includes('r.regionIndex='),"merchant must not change region");
 assert.ok(!s.includes('p.hp='),"merchant must not reset health");
 assert.ok(!s.includes('p.mp='),"merchant must not reset mana");
 assert.ok(server.includes('shopOrigin:r.shopOrigin||null'));
});
test("traveling shop does not render city and keeps the battle scene visible",()=>{
 const ui=read("public/world-ui-v040.js"),g=read("public/game.js");
 assert.ok(ui.includes('s.status==="shop"&&s.shopOrigin==="city"'));
 assert.ok(g.includes('s.shopOrigin==="camp"'));
 assert.ok(g.includes('TRAVELING MERCHANT · ROADSIDE CAMP'));
 assert.ok(g.includes('TRAVELING MERCHANT'));
 assert.ok(g.includes('call("openShop",{category:"potion"})'));
 assert.ok(g.includes('call("closeShop")'));
 assert.ok(g.includes('v0483-camp-shop'));
});
test("Battle Log inner scroll view fills available drawer height",()=>{
 const css=read("public/v0483-camp-log.css"),html=read("public/index.html");
 assert.ok(css.includes('.game-side-column[data-v041-tab="log"] #log'));
 assert.ok(css.includes('flex:1 1 0!important'));
 assert.ok(css.includes('min-height:200px!important'));
 assert.ok(css.includes('overflow-y:auto!important'));
 assert.ok(html.includes('href="v0483-camp-log.css"'));
 assert.ok(read("server.js").includes("log:r.log.slice(-40)"),"Battle Log must send the retained history, not only 14 events");
});
test("title version and release notes reflect v0.55",()=>{
 const html=read("public/index.html"),pkg=require("../package.json"),log=read("public/update-log-v045.js");
 assert.equal(pkg.version,"0.57.0");
 assert.ok(html.includes("VERSION 0.57 · SECURE SAVES"));
 assert.ok(log.includes('version:"0.48.3"'));
});

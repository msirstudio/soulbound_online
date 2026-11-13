"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("Atlas uses one organic continental image, eight numbered pins and central safe city",()=>{
 const art=read("public/assets/world/forgotten-kingdom-v046.svg");
 const ui=read("public/world-ui-v040.js");
 assert.match(art,/<svg/);assert.match(art,/viewBox="0 0 1024 656"/);
 assert.match(art,/id="landclip"/);assert.match(art,/Central safe city/);
 assert.match(ui,/forgotten-kingdom-v046\.svg/);
 assert.match(ui,/v046CityPin/);
 assert.match(ui,/positions=\[\[21,54\]/);
 assert.match(ui,/data-v040-region/);
 assert.ok(!ui.includes('<svg class="v040-land"'),"Old hard-coded map should be replaced");
});
test("Eight region previews use the corresponding existing arena images",()=>{
 const css=read("public/v046-atlas.css");
 const scenes=["ai-wilds.webp","ai-ruins.webp","ai-cavern.webp","ai-hollow_sanctum.webp",
  "ai-frost.webp","ai-titanfall_ruins.webp","ai-abyssal_rift.webp","ai-eclipse_throne.webp"];
 for(const file of scenes){
  assert.ok(css.includes('assets/scenes/'+file),file+" CSS mapping absent");
  assert.ok(fs.existsSync(path.join(root,"public/assets/scenes",file)),file+" missing");
 }
 assert.ok(css.includes(".v046-city-pin"));
});
test("v0.46 resources load after earlier styles, all main interfaces remain wired",()=>{
 const html=read("public/index.html"),p=require("../package.json"),log=read("public/update-log-v045.js");
 assert.equal(p.version,"0.46.0");
 assert.ok(html.includes('href="v046-atlas.css"'));
 assert.ok(html.includes('src="world-ui-v040.js"'));
 assert.ok(html.indexOf('href="v046-atlas.css"')>html.indexOf('href="v045.css"'));
 assert.ok(log.includes('version:"0.46"'));
 assert.ok(read("world-v040.js").includes('totalStages=regions.length*5'));
});

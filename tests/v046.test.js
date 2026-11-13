"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("World Atlas uses the actual generated PNG, and its 8 overlay pins match the scene",()=>{
 const artPath=path.join(root,"public/assets/world/world-map-v046.png");
 assert.ok(fs.existsSync(artPath),"Generated Pixel Art PNG missing. Upload world-map-v046.png before deployment.");
 const art=fs.readFileSync(artPath);
 assert.equal(art.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
 assert.equal(art.readUInt32BE(16),1448);
 assert.equal(art.readUInt32BE(20),1086);
 const ui=read("public/world-ui-v040.js");
 assert.match(ui,/world-map-v046\\.png/);
 assert.match(ui,/v046CityPin/);
 assert.match(ui,/positions=\\[\\[18,67\\]/);
 assert.match(ui,/data-v040-region/);
 assert.doesNotMatch(ui,/forgotten-kingdom-v046\\.svg/);
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

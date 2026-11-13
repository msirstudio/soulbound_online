"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("capital scene has real interactive shop and adventure hotspots",()=>{
 const js=read("public/world-ui-v040.js");
 for(const name of ["v047-supplies","v047-weapons","v047-armor","v047-crystal","v047Adventure"]){assert.ok(js.includes(name),name+" missing")}
 for(const kind of ['data-v047-shop="potion"','data-v047-shop="weapon"','data-v047-shop="armor"'])assert.ok(js.includes(kind));
 assert.ok(js.includes('actions?.openShop()'),"City shop must call server merchant action");
 assert.ok(js.includes('window.SoulboundCityShopV47?.selectCategory(category)'));
 assert.ok(js.includes('$("v047Adventure").onclick=show'),"Crystal must open real atlas");
});
test("merchant catalog still comes from existing server merchant and category tabs",()=>{
 const game=read("public/game.js"),server=read("server.js");
 assert.ok(game.includes("window.SoulboundCityShopV47="));
 assert.ok(game.includes("activeShopCategory="));
 assert.ok(game.includes('data-shop-category'));
 assert.ok(game.includes('call("buyItem"'));
 assert.ok(server.includes('s.on("openShop"'));
 assert.ok(server.includes('s.on("buyItem"'));
});
test("art is linked as WebP and city remains responsive",()=>{
 const css=read("public/v047-city.css"),html=read("public/index.html");
 assert.ok(css.includes('assets/city/forgotten-capital.webp'));
 assert.ok(css.includes('.v047-hotspot'));
 assert.ok(css.includes('@media(max-width:580px)'));
 assert.ok(html.includes('href="v047-city.css"'));
 assert.ok(html.indexOf('href="v047-city.css"')>html.indexOf('href="v046-atlas.css"'));
 assert.ok(read("public/update-log-v045.js").includes('version:"0.47"'));
});

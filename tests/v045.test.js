"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("v0.55 is displayed in header, title screen, server health, and package",()=>{
 const html=read("public/index.html"),server=read("server.js"),pkg=require("../package.json");
 assert.equal(pkg.version,"0.56.3");
 assert.match(html,/VERSION 0\.56\.3 · COMBAT REBALANCE/);
 assert.match(html,/ONLINE RPG · v0\.56\.2 HARDCORE ENCOUNTERS/);
 assert.match(server,/version:"0\.56\.3"/);
});
test("Update Log opens from main menu and is loaded once",()=>{
 const html=read("public/index.html"),js=read("public/update-log-v045.js"),css=read("public/v045.css");
 assert.match(html,/id="v045ChangelogOpen"/);
 assert.match(html,/src="update-log-v045\.js"/);
 assert.match(html,/href="v045\.css"/);
 assert.match(js,/version:"0\.45"/);assert.match(js,/version:"0\.44"/);
 assert.match(js,/document\.addEventListener\("keydown"/);
 assert.match(css,/#v045Changelog\[hidden\]/);
});
test("drop rules use independent roll for every entry and allow 2+ wins",()=>{
 const loot=require("../loot-v034");
 const old=Math.random;try{
  const rolls=[.01,.05,.99,.99,.99],h={name:"A",inventory:[],worldProgress:{}};
  Math.random=()=>rolls.shift()??.99;
  const items=loot.dropEncounterLoot(h,5);
  assert.equal(items.length,2);
  assert.ok(items[0].uid&&items[1].uid);
  assert.notEqual(items[0].uid,items[1].uid);
 }finally{Math.random=old}
});

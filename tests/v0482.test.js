"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
test("new title cover affects main-menu panel only and preserves actions",()=>{
 const css=read("public/v0482-title-cover.css"),html=read("public/index.html");
 assert.match(css,/#v041Front\{/);
 assert.match(css,/url\("assets\/ui\/title-cover\.webp"\)/);
 assert.match(css,/linear-gradient\(90deg/);
 assert.match(css,/#v041Front \.v041-front-vista\{display:none!important\}/);
 assert.ok(!css.includes('#game'),"Title-only CSS must not change gameplay");
 assert.ok(html.includes('href="v0482-title-cover.css"'));
 assert.ok(html.indexOf('href="v0482-title-cover.css"')>html.indexOf('href="v048-city.css"'));
 for(const id of ["v041Play","v041NewHero","v041Account","v041SettingsOpen","v045ChangelogOpen"])assert.ok(html.includes('id="'+id+'"'));
});
test("v0.55 includes the earlier cover and updates the version",()=>{
 const html=read("public/index.html"),log=read("public/update-log-v045.js"),pkg=require("../package.json");
 assert.equal(pkg.version,"0.55.1");
 assert.ok(html.includes("VERSION 0.55.1 · INDEX FIX"));
 assert.ok(html.includes("ONLINE RPG · v0.55.1 INDEX FIX"));
 assert.ok(log.includes('version:"0.48.2"'));
});

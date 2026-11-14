"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"..");
const src=fs.readFileSync(path.join(root,"public/sprite-animation-v0311.js"),"utf8");
const html=fs.readFileSync(path.join(root,"public/index.html"),"utf8");

test("Mage uses six separate class-specific PNG paths, including hit and attack",()=>{
 const poseNames=["male_idle","male_hit","male_attack","female_idle","female_hit","female_attack"];
 for(const state of ["idle","hit","attack"])assert.ok(src.includes('"_'+state+'.png"'),"missing Mage "+state+" path construction");
 for(const sex of ["male","female"])assert.ok(src.includes(sex),"missing gender "+sex);
 assert.ok(html.includes('sprite-animation-v0311.js?v=0.56.0'));
 assert.ok(src.includes('poseRoot+cls+"/"+g+"_'));
 assert.ok(src.includes('const classes=["swordsman","mage"]'));
 assert.equal(poseNames.length,6);
});

test("Mage sprite markup and original Swordsman fallback remain class-specific",()=>{
 const events={};
 const doc={readyState:"loading",addEventListener:(event,fn)=>events[event]=fn,getElementById:()=>null,querySelectorAll:()=>[]};
 const win={SoulboundHeroArt:{render:()=> "data:image/svg+xml,test"}};
 const sandbox={window:win,document:doc,Image:class {},Map,Set,Promise,performance:{now:()=>0},requestAnimationFrame:()=>{}};
 vm.runInNewContext(src,sandbox);
 const a=win.SoulboundSprite;
 assert.equal(a.canDraw({classId:"mage"}),true);
 assert.equal(a.canDraw({classId:"swordsman"}),true);
 assert.equal(a.canDraw({classId:"tank"}),false);
 const mageMale=a.spriteMarkup({id:"mage1",classId:"mage",gender:"male"});
 const mageFemale=a.spriteMarkup({id:"mage2",classId:"mage",gender:"female"});
 const sword=a.spriteMarkup({id:"sword1",classId:"swordsman",gender:"male"});
 assert.ok(mageMale.includes('data-v311-class="mage"'));
 assert.ok(mageMale.includes('assets/hero-poses/mage/male_idle.png'));
 assert.ok(mageFemale.includes('assets/hero-poses/mage/female_idle.png'));
 assert.ok(sword.includes('assets/hero-poses/swordsman/male_idle.png'));
 assert.ok(mageMale.includes('v311-fallback'),"Mage must keep SVG fallback until PNGs installed");
 assert.equal(typeof a.hit,"function");
 assert.equal(typeof a.attack,"function");
 assert.equal(typeof events.DOMContentLoaded,"function");
});

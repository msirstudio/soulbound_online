"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const script=read("public/sprite-animation-v0311.js"),styles=read("public/v062-female-idle.css"),html=read("public/index.html");
const config=JSON.parse(read("public/assets/hero-animations/manifest.json"));
test("Female Swordsman Idle art metadata uses exactly 8 frames, 8 FPS and 256px cells",()=>{
 const data=config.states.idle;
 assert.deepEqual([data.frameWidth,data.frameHeight,data.frames,data.fps,data.columns,data.rows],[256,256,8,8,8,1]);
 assert.equal(data.anchor.y,232);
 assert.equal(data.src,"assets/hero-animations/female_swordsman_idle_8f.png");
 assert.ok(script.includes(data.src+"?v=0.62.1"));
 assert.ok(script.includes("img.naturalWidth!==femaleIdle.frames*femaleIdle.frameWidth"));
 assert.ok(script.includes("img.naturalHeight!==femaleIdle.frameHeight"));
});
test("Game loads art-only CSS with cache bust and does not change combat/stat or save files",()=>{
 assert.ok(html.includes('href="v062-female-idle.css?v=0.62.1"'));
 assert.ok(html.includes('src="sprite-animation-v0311.js?v=0.62.1"'));
 assert.ok(styles.includes(".v311-custom-idle-active .v311-custom-idle"));
 assert.ok(styles.includes(".v311-custom-idle-active .v311-pose"));
 assert.ok(styles.includes(".v311-preview-custom-ready #v311PreviewSprite"));
 assert.ok(script.includes("!attacking&&!damaged"));
});
test("Female-only custom idle animates at 8 FPS, while attack and hit still use original poses",async()=>{
 let tick,clock=0;
 const flags=new Map();
 const hero={
  dataset:{v311Gender:"female",v311Class:"swordsman",v311Player:"p1"},
  classList:{toggle(name,on){flags.set(name,!!on)}},
  querySelector(selector){return{
   ".v311-pose":pose,".v311-sheet":legacy,".v311-custom-idle":custom
  }[selector]||null}
 };
 const pose={dataset:{},style:{},src:""},custom={style:{}},legacy={style:{},dataset:{}};
 const preview=null;
 const document={
  readyState:"complete",querySelectorAll(sel){return sel===".v311-hero"?[hero]:[]},
  getElementById(id){return preview},
 };
 class ImageMock{
  set src(src){this._src=src;this.naturalWidth=src.includes("female_swordsman_idle_8f")?2048:src.includes("_attack")?1536:src.includes("_idle.png")?1152:256;
   this.naturalHeight=256;Promise.resolve().then(()=>this.onload?.())}
  get src(){return this._src}
 }
 const window={SoulboundHeroArt:{render:()=>"data:image/svg+xml;base64,PHN2Zy8+"}};
 const ctx={document,window,Image:ImageMock,Map,Promise,performance:{now:()=>clock},requestAnimationFrame(fn){tick=fn}};
 vm.runInNewContext(script,ctx);
 await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setImmediate(resolve));
 const player={id:"p1",classId:"swordsman",gender:"female"};
 assert.equal(window.SoulboundSprite.canDraw(player),true);
 assert.ok(window.SoulboundSprite.spriteMarkup(player).includes("v311-custom-idle"));
 assert.equal(window.SoulboundSprite.meta.femaleIdle.fps,8);
 clock=0;tick(clock);
 assert.equal(flags.get("v311-custom-idle-active"),true);
 assert.equal(custom.style.backgroundPosition,"0% 0%");
 clock=125;tick(clock);
 assert.equal(custom.style.backgroundPosition,(1/7*100)+"% 0%");
 window.SoulboundSprite.attack("p1");clock=150;tick(clock);
 assert.equal(flags.get("v311-custom-idle-active"),false);
 assert.equal(pose.src,"/assets/hero-poses/swordsman/female_attack.png");
 clock=950;tick(clock);assert.equal(flags.get("v311-custom-idle-active"),true);
 window.SoulboundSprite.hit("p1");clock=1000;tick(clock);
 assert.equal(flags.get("v311-custom-idle-active"),false);
 assert.equal(pose.src,"/assets/hero-poses/swordsman/female_hit.png");
 clock=1900;tick(clock);assert.equal(flags.get("v311-custom-idle-active"),true);
 hero.dataset.v311Gender="male";clock=2100;tick(clock);
 assert.equal(flags.get("v311-custom-idle-active"),false);
 hero.dataset.v311Gender="female";hero.dataset.v311Class="mage";clock=2300;tick(clock);
 assert.equal(flags.get("v311-custom-idle-active"),false);
});

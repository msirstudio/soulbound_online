"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const code=fs.readFileSync(path.join(__dirname,"../public/boss-sprites-v039.js"),"utf8");
function harness({missing=false}={}){
 let now=100,clock=0,events=new Map(),images=[];
 const target={
  attrs:{},classList:{toggle(){},remove(){}},dataset:{},
  getAttribute(key){return this.attrs[key]||null},
  setAttribute(key,value){this.attrs[key]=value}
 };
 const win={};
 class Image{
  set src(src){images.push(src);this.naturalWidth=640;this.naturalHeight=640;queueMicrotask(()=>{if(missing)this.onerror?.();else this.onload?.()})}
 }
 const context={
  window:win,document:{getElementById:()=>target},
  Image,performance:{now:()=>now},
  setTimeout:(fn,ms)=>{const id=++clock;events.set(id,{fn,ms});return id},
  clearTimeout:id=>events.delete(id)
 };
 vm.runInNewContext(code,context,{filename:"boss-sprites-v039.js"});
 return{
  api:win.SoulboundBossSpritesV39,target,images,
  tick(ms){now+=ms;const pending=[...events.values()];events.clear();for(const timer of pending)timer.fn()},
  async settle(){for(let i=0;i<12;i++)await Promise.resolve()}
 };
}
const monster=(hp=260)=>({boss:true,name:"The Briarfang Alpha",sprite:"boss-briarfang",hp});
test("all eight boss stages are registered",()=>{
 const app=harness();for(const stage of [5,10,15,20,25,30,35,40])assert.ok(app.api.imagesFor(stage));
 assert.equal(app.api.status().bosses,8);
});
test("normal -> hit -> normal on HP decrease, but not on healing",async()=>{
 const app=harness();app.api.render(monster(260),5);await app.settle();
 assert.equal(app.target.attrs.src,"/assets/bosses/v039/briarfang_alpha_normal.png");
 app.api.render(monster(230),5);
 assert.equal(app.target.attrs.src,"/assets/bosses/v039/briarfang_alpha_hit.png");
 app.tick(600);
 assert.equal(app.target.attrs.src,"/assets/bosses/v039/briarfang_alpha_normal.png");
 app.api.render(monster(260),3);
 assert.equal(app.target.attrs.src,"/assets/bosses/v039/briarfang_alpha_normal.png");
});
test("non-boss encounter and missing sprite assets fall back safely",async()=>{
 const app=harness({missing:true});app.api.render(monster(260),3);await app.settle();
 assert.equal(app.target.attrs.src,"/assets/bosses/boss-briarfang.svg");
 app.api.render({boss:false,name:"Wolf",sprite:"mossfang-wolf",hp:50},1);
 assert.equal(app.api.status().ready.length,0);
});
test("assets are pair-checked before replacing SVG",async()=>{
 const app=harness();app.api.render(monster(260),3);await app.settle();
 assert.equal(app.images.length,2);
 assert.deepEqual(app.images,[
 "/assets/bosses/v039/briarfang_alpha_normal.png",
 "/assets/bosses/v039/briarfang_alpha_hit.png"
 ]);
});

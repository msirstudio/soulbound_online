"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("v0.62.2 uses the exact 12-frame source at 12fps, looping once per second",()=>{
 const config=JSON.parse(read("public/assets/hero-animations/manifest.json"));
 const anim=config.states.idle;
 assert.deepEqual([anim.frames,anim.fps,anim.columns,anim.rows,anim.frameWidth,anim.frameHeight],[12,12,12,1,256,256]);
 assert.equal(anim.src,"assets/hero-animations/female_swordsman_idle_12f.png");
 assert.equal(config.states.idleFallback.frames,8);
 const script=read("public/sprite-animation-v0311.js");
 assert.ok(script.includes("tryFemaleIdle(femaleIdle)"));
 assert.ok(script.includes("tryFemaleIdle(legacyFemaleIdle)"));
 assert.ok(script.includes("activeFemaleIdle.frames"));
 assert.ok(script.includes("activeFemaleIdle.fps"));
 assert.ok(script.includes("!attacking&&!damaged"));
 const css=read("public/v062-female-idle.css");
 const html=read("public/index.html");
 assert.ok(css.includes("1200% 100%"));
 assert.ok(html.includes("sprite-animation-v0311.js?v=0.62.2"));
 assert.ok(html.includes("v062-female-idle.css?v=0.62.2"));
});
test("Optional uploaded 12-frame PNG must have expected real dimensions and PNG signature",()=>{
 const file=path.join(root,"public/assets/hero-animations/female_swordsman_idle_12f.png");
 if(!fs.existsSync(file)){process.stdout.write("NOTICE: 12-frame asset is ready for upload; legacy sheet remains the fallback.\n");return;}
 const b=fs.readFileSync(file);
 assert.ok(b.subarray(0,8).equals(Buffer.from("89504e470d0a1a0a","hex")));
 assert.equal(b.readUInt32BE(16),3072);
 assert.equal(b.readUInt32BE(20),256);
 assert.ok(b.length>1000,"Expect real image data, not a placeholder");
});

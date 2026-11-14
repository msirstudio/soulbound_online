"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const uid="123e4567-e89b-12d3-a456-426614174000";
const server=read("server.js"),frontend=read("public/game.js"),migration=read("SUPABASE-SECURE-SAVES-V057.sql");
function testBackend(fakeFetch){
 const module={exports:{}};
 vm.runInNewContext(read("persistence/secure-saves-v057.js"),{
  module,require,process:{env:{SUPABASE_URL:"https://example.supabase.co",SUPABASE_PUBLISHABLE_KEY:"sb_publishable_test",SUPABASE_SERVICE_ROLE_KEY:"test-server-only-secret"}},
  fetch:fakeFetch,AbortSignal,Date,JSON,Number,String,Object,Error
 });
 return module.exports;
}
function result(status,payload){return{ok:status>=200&&status<300,status,text:async()=>JSON.stringify(payload)}}
test("Strict mode verifies JWT via Auth, never through a client-supplied user id",async()=>{
 const urls=[],api=testBackend(async(url,opts)=>{
  urls.push({url,auth:opts.headers.Authorization,key:opts.headers.apikey});
  if(url.endsWith("/auth/v1/user"))return result(200,{id:uid});
  return result(200,[{slot:1,revision:4,data:{class_id:"swordsman",attack:214,level:27}}]);
 });
 assert.equal(api.enabled,true);
 const saved=await api.load("valid-jwt-token-".padEnd(45,"x"),1);
 assert.equal(saved.userId,uid);assert.equal(saved.data.attack,214);
 assert.equal(saved.revision,4);
 assert.ok(urls[0].auth.startsWith("Bearer valid-jwt-token-"));
 assert.ok(urls[1].url.includes("user_id=eq."+uid));
 assert.ok(urls[1].key==="test-server-only-secret");
 await assert.rejects(()=>api.authenticate("garbage"),/Login required/);
});
test("Atomic revision updates reject a stale copy rather than overwrite the current save",async()=>{
 let rev=3;const api=testBackend(async(url,opts)=>{
  if(opts.method==="PATCH"){
   if(!url.includes("revision=eq."+rev))return result(200,[]);
   rev=opts.body?JSON.parse(opts.body).revision:rev+1;
   return result(200,[{revision:rev}]);
  }return result(200,{});
 });
 assert.equal(await api.compareAndSwap(uid,2,3,{class_id:"mage",gold:80}),4);
 await assert.rejects(()=>api.compareAndSwap(uid,2,3,{class_id:"mage",gold:999999}),/Save changed/);
});
test("Concurrent character sessions for the same account and slot are rejected",()=>{
 const api=testBackend(async()=>result(200,[])),queue=api.createQueue();
 const claim=queue.register({userId:uid,slot:1,revision:4});
 assert.throws(()=>queue.register({userId:uid,slot:1,revision:4}),/already active/);
 assert.equal(queue.isActive(uid,1),true);
 queue.release(claim);assert.equal(queue.isActive(uid,1),false);
 assert.ok(queue.register({userId:uid,slot:1,revision:4}));
});
test("Secure mode has no client write grants and forbids guest switching into an account party",()=>{
 assert.ok(migration.includes("revoke all on public.hero_secure_saves from anon,authenticated,public"));
 assert.ok(!/grant\s+(?:insert|update|delete)[^;]*to\s+authenticated/i.test(migration));
 assert.ok(server.includes('if(secure.enabled&&r.accountMode!==(guest?"guest":"account"))'));
 assert.ok(server.includes('secure.load(v.accessToken,v.slot)'));
 assert.ok(server.includes('verifiedCharacters.set(s.id,claim)'));
 assert.ok(server.includes('secureQueue.persist(claim,p)'));
 assert.ok(frontend.includes('if(v57Mode&&!guestMode)return;const data='));
 assert.ok(frontend.includes('await v57Api("POST","/api/secure-saves/"+v561Slot+"/new"'));
 assert.ok(frontend.includes('await v57Api("DELETE","/api/secure-saves/"+n'));
});
test("Server-created fresh characters do not accept client-supplied statistics",()=>{
 const api=testBackend(async()=>result(200,[])),mage=api.starter("mage","Aria"),tank=api.starter("tank","Guardian");
 assert.equal(mage.attack,25);assert.equal(tank.defense,16);
 assert.equal(mage.level,1);assert.equal(mage.gold,80);
 assert.throws(()=>api.starter("cheater","GM"),/Invalid class/);
 assert.ok(server.includes('secure.newGame(token,req.params.slot,req.body?.classId,req.body?.name'));
});
test("Display version uses two parts while package remains valid npm semver",()=>{
 const packageJson=JSON.parse(read("package.json"));
 assert.equal(packageJson.version,"0.58.0");
 assert.ok(server.includes('.version.replace(/\\.0$/,"")'));
 assert.ok(read("public/index.html").includes("<small>v0.58</small>"));
 assert.ok(read("public/version-v0564.js").includes('version=version.replace(/\\.0$/,"")'));
});

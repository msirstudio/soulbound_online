"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const loot=require("../loot-v034"),world=require("../world-v040"),combat=require("../combat-v055");
function harness(){
 let connect;const events=[];
 const app={use(){},get(){}},express=()=>app;express.static=()=>()=>{};
 class Server{on(name,callback){if(name==="connection")connect=callback}to(room){return{emit:(name,data)=>events.push({room,name,data})}}}
 const deps=name=>name==="express"?express:name==="http"?{createServer:()=>({listen(){}})}:name==="socket.io"?{Server}:name==="path"?path:name==="./loot-v034"?loot:name==="./world-v040"?world:name==="./combat-v055"?combat:require(name);
 const math=Object.create(Math);math.random=()=>.01;
 const env=new Function("require","process","console","__dirname","setTimeout","Math",read("server.js")+";return {rooms};")(deps,{env:{}},{log(){},error(){}},root,fn=>{fn();return 0},math);
 const user=id=>{const fns={};connect({id,join(){},on:(event,fn)=>fns[event]=fn});return{call:(event,payload={})=>new Promise((resolve,reject)=>{try{fns[event](payload,resolve)}catch(e){reject(e)}})}};
 return{rooms:env.rooms,user,events,last:()=>events.filter(x=>x.name==="state").at(-1)?.data};
}
test("real Socket Assassin creation, starter equipment, 7 skill book, crit and MP cost",async()=>{
 const h=harness(),u=h.user("assassin");
 const created=await u.call("createRoom",{name:"Shade",classId:"assassin",guest:true});assert.equal(created.ok,true);
 const r=h.rooms.get(created.code),p=r.players.get("assassin");
 assert.equal(p.speed,14);assert.equal(p.hp,120);assert.equal(p.weapon,"Training Daggers");
 assert.equal(h.last().players[0].skillBook.length,7);
 assert.equal((await u.call("startBattle")).ok,true);
 const hp=r.monster.hp,mp=p.mp;
 assert.equal((await u.call("action",{type:"skill",actionId:"assassin-cut-001",targetId:r.monster.enemyId})).ok,true);
 assert.ok(r.monster.hp<hp);
 assert.equal(p.mp,mp-12);
 assert.ok(r.log.some(x=>x.includes("SHADOW CUT")));
 assert.ok(r.log.some(x=>x.includes("CRITICAL HIT")));
 assert.ok(h.last().weaponFx.some(x=>x.kind==="critical"));
});
test("real Socket Priest heal spends MP and protects ally without damaging monster",async()=>{
 const h=harness(),priest=h.user("priest");
 const made=await priest.call("createRoom",{name:"Healer",classId:"priest",guest:true});assert.equal(made.ok,true);
 const ally=h.user("tank");assert.equal((await ally.call("joinRoom",{code:made.code,name:"Defender",classId:"tank",guest:true})).ok,true);
 const r=h.rooms.get(made.code),p=r.players.get("priest"),a=r.players.get("tank");
 p.level=3;
 assert.equal((await priest.call("startBattle")).ok,true);
 a.hp=30;
 const before=r.monster.hp;
 const spent=p.mp;
 const res=await priest.call("action",{type:"skill2",actionId:"priest-heal-001",targetId:r.monster.enemyId});
 assert.equal(res.ok,true);assert.equal(p.mp,spent-22);
 assert.ok(a.hp>30,"heal must reach lowest-HP ally");
 assert.equal(r.monster.hp,before,"healing skill cannot damage the enemy");
 assert.ok(r.log.some(x=>x.includes("MENDING PRAYER")));
});
test("real Socket Priest protection and healing are server-bound, not extra client actions",async()=>{
 const h=harness(),priest=h.user("priest-guard");
 const made=await priest.call("createRoom",{name:"Holy",classId:"priest",guest:true});assert.equal(made.ok,true);
 const r=h.rooms.get(made.code),p=r.players.get("priest-guard");
 p.level=8;p.hp=85;
 assert.equal((await priest.call("startBattle")).ok,true);
 const mp=p.mp,enemyHp=r.monster.hp;
 const result=await priest.call("action",{type:"skill4",actionId:"priest-ward-001"});
 assert.equal(result.ok,true);assert.equal(p.mp,mp-30);
 assert.equal(r.monster.hp,enemyHp);
 assert.ok(r.log.some(x=>x.includes("SANCTUARY")));
 // Timed monster counter may spend one ward turn immediately in the solo test.
 assert.ok(r.partyWardTurns>=0&&r.partyWardTurns<=2);
 assert.ok(r.partyWardReduction>=.25);
});
test("real Socket shop class-locked gear for Assassin and Priest",async()=>{
 const h=harness(),u=h.user("buyer");
 const made=await u.call("createRoom",{name:"Buyer",classId:"assassin",guest:true});assert.equal(made.ok,true);
 const r=h.rooms.get(made.code),p=r.players.get("buyer");
 assert.equal((await u.call("openShop",{category:"weapon"})).ok,true);
 p.gold=1000;
 const denied=await u.call("buyItem",{itemId:"pilgrim_crook"});
 assert.equal(denied.ok,false);
 assert.equal((await u.call("buyItem",{itemId:"practice_dirks"})).ok,true);
 assert.ok(p.inventory.some(x=>x.id==="practice_dirks"));
});

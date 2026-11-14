"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const combat=require("../combat-v055"),world=require("../world-v040");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const server=read("server.js"),game=read("public/game.js"),hero=read("public/sprite-animation-v0311.js"),html=read("public/index.html");
function harness(){
 let onConnect;const scheduled=[],emits=[];
 const app={use(){},get(){}};const express=()=>app;express.static=()=>()=>{};
 class Server{on(ev,fn){if(ev==="connection")onConnect=fn}to(code){return{emit:(event,state)=>emits.push({code,event,state})}}}
 const fakeTimer=(fn,ms)=>{scheduled.push({fn,ms});return scheduled.length};
 const dep=n=>n==="express"?express:n==="http"?{createServer:()=>({listen(){}})}:n==="socket.io"?{Server}:
  n==="path"?path:n==="./loot-v034"?require("../loot-v034"):n==="./world-v040"?world:n==="./combat-v055"?combat:require(n);
 const rt=new Function("require","process","console","__dirname","setTimeout",server+";return {rooms,start};")(
  dep,{env:{}},{log(){}},path.join(__dirname,".."),fakeTimer);
 const handlers={};onConnect({id:"solo",join(){},on:(ev,fn)=>handlers[ev]=fn});
 const call=(ev,payload={})=>{let reply;handlers[ev](payload,x=>reply=x);return reply};
 return{rt,call,scheduled,emits,last:()=>emits.at(-1)?.state};
}
test("Enemy counter is server-timed, not simultaneous with the player's input",()=>{
 const h=harness(),{code}=h.call("createRoom",{name:"Hero",classId:"swordsman"});
 h.call("restoreCharacter",{level:80,speed:99,max_hp:4000,attack:100});
 const r=h.rt.rooms.get(code);r.stage=5;r.regionIndex=0;h.rt.start(r);
 const me=r.players.get("solo");me.hp=3000;
 const hp=me.hp;
 r.monster.intent={name:"Strike",scope:"single",element:"physical",power:1,charge:false};
 const response=h.call("action",{type:"guard"});
 assert.equal(response.ok,true);
 assert.equal(me.hp,hp,"enemy must not damage the player in the same tick as the hero action");
 assert.equal(h.last().enemyWindup,true);
 assert.equal(h.call("action",{type:"guard"}).ok,false,"cannot submit another turn during enemy windup");
 assert.equal(h.scheduled.length,1);
 assert.equal(h.scheduled[0].ms,760);
 h.scheduled[0].fn();
 assert.equal(h.last().enemyWindup,true);
 h.scheduled[1].fn();
 assert.equal(h.last().enemyWindup,false);
 assert.ok(r.log.some(line=>line.includes(" uses Strike against ")),"enemy action resolves after the pause");
 assert.equal(h.call("action",{type:"guard"}).ok,true,"player regains control after counter resolves");
});
test("Hit pose takes precedence over attack, with visible length",()=>{
 assert.ok(hero.includes("attacks.delete(key);hits.set(key,performance.now()+hitMs)"));
 assert.ok(hero.includes("hitMs=780"));
 assert.ok(game.includes("window.SoulboundSprite?.hit?.(p.id)"));
 assert.ok(game.includes("v0560-enemy-attacking"));
 assert.ok(game.includes("v0560-hero-hurt"));
 assert.ok(game.includes("!s.enemyWindup"));
});
test("All visible game and API version identifiers advance to v0.56.1",()=>{
 assert.ok(html.includes("<small>v0.56.4</small>"));
 assert.ok(html.includes("VERSION 0.56.4"));
 assert.ok(html.includes('game.js?v=0.56.4'));
 assert.ok(html.includes("v0560-combat-pacing.css?v=0.56.0"));
 assert.ok(server.includes("version:APP_VERSION"));
 assert.equal(require("../package.json").version,"0.56.4");
});

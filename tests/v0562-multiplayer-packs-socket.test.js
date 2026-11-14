"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const serverText=fs.readFileSync(path.join(__dirname,"..","server.js"),"utf8");
const loot=require("../loot-v034"),world=require("../world-v040"),combat=require("../combat-v055");
function harness(){
 let connection;
 const messages=[];
 const app={use(){},get(){}};const express=()=>app;express.static=()=>()=>{};
 class Server{on(event,fn){if(event==="connection")connection=fn}to(room){return{emit:(name,state)=>messages.push({room,name,state})}}}
 const deps=name=>name==="express"?express:name==="http"?{createServer:()=>({listen(){}})}:name==="socket.io"?{Server}:name==="path"?path:name==="./loot-v034"?loot:name==="./world-v040"?world:name==="./combat-v055"?combat:require(name);
 const rt=new Function("require","process","console","__dirname","setTimeout",serverText+";return {rooms};")(deps,{env:{}},{log(){}},path.join(__dirname,".."),fn=>{fn();return 0});
 const connect=id=>{
  const events={};connection({id,join(){},on:(event,fn)=>events[event]=fn});
  return{call:(event,payload={})=>{let answer;events[event](payload,v=>answer=v);return answer}};
 };
 return{connect,rooms:rt.rooms,last:()=>messages.at(-1)?.state};
}
test("Multiplayer: 4 heroes spawn exactly 4 real enemies on stage 1 and clear individually",()=>{
 const h=harness(),players=Array.from({length:4},(_,i)=>h.connect("p"+i));
 const {code}=players[0].call("createRoom",{name:"Hero 1",classId:"swordsman"});
 for(let i=1;i<4;i++)assert.equal(players[i].call("joinRoom",{code,name:"Hero "+(i+1),classId:"mage"}).ok,true);
 for(const player of players)assert.equal(player.call("restoreCharacter",{level:30,speed:10,max_hp:6000,attack:999999}).ok,true);
 assert.equal(players[0].call("startBattle").ok,true);
 let s=h.last();assert.equal(s.enemies.length,4);
 for(let i=0;i<4;i++){
  const live=s.enemies.filter(x=>x.hp>0);
  assert.equal(live.length,4-i);
  assert.equal(players[i].call("action",{type:"attack",targetId:live[0].enemyId}).ok,true);
  s=h.last();
  if(i<3){assert.equal(s.status,"battle");assert.equal(s.enemies.filter(x=>x.hp>0).length,3-i)}
 }
 assert.equal(s.status,"victory");
 assert.equal(s.enemies.filter(x=>x.hp>0).length,0);
 assert.ok(s.players.every(x=>x.xp>0),"party is rewarded once after clearing pack");
});
test("A player cannot target an already defeated enemy",()=>{
 const h=harness(),p=h.connect("hero");p.call("createRoom",{name:"Hero",classId:"swordsman"});
 p.call("restoreCharacter",{level:30,attack:999999,speed:40});
 p.call("startBattle");
 const s=h.last();
 assert.equal(p.call("action",{type:"attack",targetId:"enemy-1-999"}).ok,false);
 assert.equal(h.last().enemies[0].hp,s.enemies[0].hp);
});

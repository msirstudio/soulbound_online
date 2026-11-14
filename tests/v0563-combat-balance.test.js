"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(base,p),"utf8");
const pack=require("../encounter-pack-v0562"),world=require("../world-v040"),combat=require("../combat-v055");
const game=read("public/game.js"),html=read("public/index.html"),server=read("server.js");
function socketHarness(){
 let connect;const events=[];
 const app={use(){},get(){}},express=()=>app;express.static=()=>()=>{};
 class Server{on(event,fn){if(event==="connection")connect=fn}to(room){return{emit:(name,state)=>events.push({room,name,state})}}}
 const deps=name=>name==="express"?express:name==="http"?{createServer:()=>({listen(){}})}:name==="socket.io"?{Server}:name==="path"?path:name==="./loot-v034"?require("../loot-v034"):name==="./world-v040"?world:name==="./combat-v055"?combat:require(name);
 const rt=new Function("require","process","console","__dirname","setTimeout",server+";return {rooms};")(deps,{env:{}},{log(){}},base,fn=>{fn();return 0});
 const session=id=>{
  let handlers={};connect({id,join(){},on:(name,cb)=>handlers[name]=cb});
  return{call:(name,arg={})=>{let ans;handlers[name](arg,result=>ans=result);return ans}};
 };
 return{session,rooms:rt.rooms,last:()=>events.at(-1)?.state};
}
test("At stage 12 AoE hits both living enemies and does not require a selected target",()=>{
 const h=socketHarness(),p=h.session("hero"),{code}=p.call("createRoom",{name:"Mage",classId:"mage"});
 p.call("restoreCharacter",{level:27,max_hp:1000,attack:200,speed:90,max_mp:300});
 const r=h.rooms.get(code);r.stage=12;r.regionIndex=2;const started=p.call("startBattle"); // startBattle resets to first region stage
 // Force stage 12 to test real stage-specific pack mechanics.
 r.stage=12;r.regionIndex=2;
 // Start a fresh stage with two enemies using real Socket travel's exported helper.
 const first=world.encounter(12,[{name:"Wolf",sprite:"mossfang-wolf",hp:90,atk:12,def:2,xp:30,gold:15}],[]);
 pack.makeGroup(r,first,[{name:"Wolf",sprite:"mossfang-wolf",hp:90,atk:12,def:2,xp:30,gold:15}],()=>0);
 for(const e of r.enemies){combat.beginEncounter(e,r);e.stage=12}
 r.status="battle";r.turnIndex=0;r.pendingEnemy=null;
 assert.equal(r.enemies.length,2);
 const before=r.enemies.map(x=>x.hp);
 assert.equal(p.call("action",{type:"skill2",targetId:"not-a-real-enemy"}).ok,true);
 assert.ok(r.enemies[0].hp<before[0],"primary damaged");
 assert.ok(r.enemies[1].hp<before[1],"secondary damaged");
});
test("High DEF cannot negate attacks; Guard still reduces damage",()=>{
 const room=()=>({status:"battle",monster:{name:"Test boss",atk:130,hp:999,maxHp:999,combatTurn:0,intent:{name:"Strike",element:"physical",scope:"single",power:1,charge:false}},players:new Map(),partyWardTurns:0,log:[]});
 const player=guard=>({name:"Knight",hp:670,maxHp:670,def:77,guardTurns:guard?1:0,classPath:"knight",statusEffects:[],raceId:"human"});
 const hit=guard=>{const r=room(),p=player(guard);r.players.set("one",p);combat.monsterStrike(r,{say:(room,line)=>room.log.push(line),raceById:()=>({}),random:()=>0});return 670-p.hp};
 const normal=hit(false),guarded=hit(true);
 assert.ok(normal>=50&&normal<=100,"expected 50–100 HP damage, got "+normal);
 assert.ok(guarded<normal,"guard should reduce damage");
 assert.ok(normal<250,"no surprise one-shot");
});
test("Every region receives harder boss HP/ATK than old pack; scaled encounters stay bounded",()=>{
 for(let region=0;region<8;region++){
  const stage=region*5+5,first=world.encounter(stage,
    [{name:"Wolf",sprite:"mossfang-wolf",hp:90,atk:12,def:2,xp:30,gold:15}],
    Array.from({length:8},(_,i)=>({name:"Boss "+i,sprite:"boss-briarfang",hp:260+i*120,atk:22+i*7,def:7+i*3,xp:150,gold:90})));
  const r={stage,regionIndex:region,players:new Map([["one",{}]])};
  pack.makeGroup(r,first,[],()=>0);
  assert.ok(r.monster.maxHp>=first.maxHp*1.85);
  assert.ok(r.monster.atk>first.atk*2);
  assert.ok(r.monster.atk<first.atk*4);
 }
});
test("Full-sized monsters, individual selection and version 0.56.3 are in the client",()=>{
 assert.ok(html.includes('id="v563EnemyField"'));
 assert.ok(game.includes('v563Field.innerHTML=v563Multiple?v562Alive.map'));
 assert.ok(game.includes('data-v563-target'));
 assert.ok(game.includes('v563-foe-sprite'));
 assert.ok(game.includes('targetId:v562TargetId'));
 assert.ok(server.includes('if(aoe)r.monster=pack.alive(r)[0]'));
 assert.ok(html.includes('game.js?v=0.58'));
 assert.equal(require("../package.json").version,"0.58.0");
});

test("Region 3 boss vs LV27 / DEF77 is no longer a four-hit or negligible-damage encounter",()=>{
 const stage=15,party=new Map([["solo",{id:"solo"}]]);
 const r={stage,regionIndex:2,players:party};
 pack.makeGroup(r,{name:"Ember Tyrant",hp:788,maxHp:788,atk:53,def:19,xp:240,gold:165,boss:true,regionId:"ember_caverns"},[],()=>0);
 assert.ok(r.monster.hp>=1900&&r.monster.hp<=2200,"boss must survive multiple skills, HP="+r.monster.hp);
 const d=Math.floor(214+4-r.monster.def);
 assert.ok(Math.ceil(r.monster.hp/d)>=9,"basic attacks should require many hits without skills");
 assert.ok(r.monster.atk>=125&&r.monster.atk<=140,"regional boss attack should be threatening");
 const mitigated=Math.floor(r.monster.atk*100/(100+77*.85));
 assert.ok(mitigated>=70&&mitigated<=90,"against 77 DEF, each boss hit should matter: "+mitigated);
});

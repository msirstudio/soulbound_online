"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const gm=require("../gm/gm-v067"),catalog=require("../data/game-catalog-v062");
const OWNER="123e4567-e89b-12d3-a456-426614174000";
const FRIEND="123e4567-e89b-12d3-a456-426614174001";
const UUID="11111111-2222-4333-8444-555555555555";
function player(classId="swordsman"){return{classId,gold:80,racePoints:0,level:1,verified:true,guest:false,inventory:[],worldProgress:{lootSeen:[]},gmGrants:[]}}
test("GM disabled without secure saves and a correctly configured owner UUID",()=>{
 assert.equal(gm.setup("",true).enabled,false);
 assert.equal(gm.setup("GM",true).enabled,false);
 assert.equal(gm.setup(OWNER,false).enabled,false);
 assert.equal(gm.setup(OWNER,true).enabled,true);
});
test("only verified owner claim PLUS rechecked Supabase token authorize GM",async()=>{
 const config=gm.setup(OWNER,true);
 const authenticate=async token=>token==="owner"?OWNER:token==="friend"?FRIEND:(()=>{throw Error("Invalid JWT")})();
 assert.equal(await gm.authorize({config,claim:{userId:OWNER},token:"owner",authenticate}),true);
 assert.equal(await gm.authorize({config,claim:{userId:FRIEND},token:"owner",authenticate}),false);
 assert.equal(await gm.authorize({config,claim:{userId:OWNER},token:"friend",authenticate}),false);
 assert.equal(await gm.authorize({config,claim:{userId:OWNER},token:"bad",authenticate}),false);
 assert.equal(await gm.authorize({config:gm.setup(null,true),claim:{userId:OWNER},token:"owner",authenticate}),false);
});
test("online recipients must have an authenticated matching claim; no other party/offline",()=>{
 const members=new Map([["u1",{...player(),id:"u1"}],["u2",{...player(),id:"u2",guest:true}],["u3",{...player(),id:"u3",verified:false}]]);
 const claims=new Map([["u1",{userId:OWNER}],["u2",{userId:FRIEND}],["u3",{userId:FRIEND}]]);
 assert.ok(gm.goodTarget({players:members},"u1",claims));
 assert.equal(gm.goodTarget({players:members},"u2",claims),null);
 assert.equal(gm.goodTarget({players:members},"u3",claims),null);
 assert.equal(gm.goodTarget({players:members},"outside",claims),null);
 assert.equal(gm.eligible({status:"battle"}),false);
 assert.equal(gm.eligible({status:"city"}),true);
});
test("GM rejects invalid numeric inputs, unknown equipment, class mismatch and full bag",()=>{
 const swords=player("swordsman"),mage=player("mage");
 for(const n of [0,-1,1.5,NaN,Infinity,100001]){
  assert.equal(gm.resolveReward({kind:"gold",amount:n},swords,catalog.shopItems).ok,false);
 }
 assert.equal(gm.resolveReward({kind:"race_points",amount:21},swords,catalog.shopItems).ok,false);
 assert.equal(gm.resolveReward({kind:"equipment",itemId:"not_real"},swords,catalog.shopItems).ok,false);
 assert.equal(gm.resolveReward({kind:"equipment",itemId:"flamebrand"},mage,catalog.shopItems).ok,false);
 assert.equal(gm.resolveReward({kind:"equipment",itemId:"guardian_plate"},mage,catalog.shopItems).ok,false);
 swords.inventory=Array.from({length:40},(_,i)=>({id:"test"+i}));
 assert.equal(gm.resolveReward({kind:"equipment",itemId:"iron_sword"},swords,catalog.shopItems).ok,false);
});
test("GM grants Gold, Race Points and registered weapons but not arbitrary client statistics",()=>{
 const p=player();
 const a=gm.grant(p,{kind:"gold",amount:1000,requestId:UUID},catalog.shopItems);
 assert.equal(a.ok,true);assert.equal(p.gold,1080);
 assert.equal(p.gmGrants.length,1);assert.equal(p.gmGrants[0].requestId,UUID);
 assert.equal(gm.grant(p,{kind:"gold",amount:1000,requestId:UUID},catalog.shopItems).duplicate,true);
 assert.equal(p.gold,1080);
 a.undo();assert.equal(p.gold,80);assert.equal(p.gmGrants.length,0);
 const r=gm.grant(p,{kind:"race_points",amount:4,requestId:UUID},catalog.shopItems);
 assert.equal(r.ok,true);assert.equal(p.racePoints,4);
 r.undo();assert.equal(p.racePoints,0);
 const sword=gm.grant(p,{kind:"equipment",itemId:"iron_sword",requestId:UUID,attack:999999},catalog.shopItems,{uid:()=>"gm-uid"});
 assert.equal(sword.ok,true);assert.equal(p.inventory.length,1);
 assert.equal(p.inventory[0].uid,"gm-uid");
 assert.equal(p.inventory[0].value,catalog.shopItems.find(i=>i.id==="iron_sword").value);
 assert.equal(p.worldProgress.lootSeen.includes("iron_sword:gm"),true);
 sword.undo();assert.equal(p.inventory.length,0);
});
test("GM records survive secure-save serialization; server never trusts names or client-supplied roles",()=>{
 const secure=require("../persistence/secure-saves-v057");
 const p={...player(),name:"Hero",characterId:"noct",gender:"male",classId:"archer",classPath:null,
  xp:0,hp:130,maxHp:130,mp:55,maxMp:55,atk:25,def:9,speed:10,
  weapon:"Oak Shortbow",armor:"Ranger Leathers",weaponItem:null,armorItem:null,foodItems:{},foodBuffs:{}};
 const reward=gm.grant(p,{kind:"gold",amount:250,requestId:UUID},catalog.shopItems);
 assert.equal(reward.ok,true);
 const saved=secure.profileFromPlayer(p);
 assert.equal(saved.gm_grants.length,1);
 assert.equal(saved.gm_grants[0].requestId,UUID);
 const server=read("server.js");
 assert.ok(server.includes("const gmConfig=gm.setup(process.env.SOULBOUND_GM_OWNER_ID,secure.enabled)"));
 assert.ok(server.includes("secure.authenticate"));
 assert.ok(server.includes('s.on("gmStatus"'));
 assert.ok(server.includes('s.on("gmGrant"'));
 assert.ok(server.includes('if(!gm.eligible(r))'));
 assert.ok(server.includes("verifiedCharacters.get(targetId)"));
 assert.ok(server.includes("secureQueue.persist(recipientClaim,target)"));
 assert.ok(server.includes("p.gmGrants=Array.isArray(v.gm_grants)"));
 const frontend=read("public/gm-panel-v067.js"),html=read("public/index.html");
 assert.ok(frontend.includes('gmGrant'));
 assert.ok(frontend.includes('gmStatus'));
 assert.ok(html.includes("gm-panel-v067.js?v=0.67"));
 assert.equal(JSON.parse(read("package.json")).version,"0.67.0");
});

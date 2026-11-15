"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const world=require("../world-v040"),pack=require("../encounter-pack-v0562");
const normal=[
 {name:"Mossfang Wolf",sprite:"mossfang-wolf",icon:"🐺",hp:90,atk:12,def:2,xp:35,gold:18},
 {name:"Goblin Raider",sprite:"goblin-raider",icon:"👺",hp:115,atk:15,def:4,xp:45,gold:24},
 {name:"Grave Beetle",sprite:"grave-beetle",icon:"🪲",hp:140,atk:17,def:5,xp:55,gold:30},
 {name:"Cursed Knight",sprite:"cursed-knight",icon:"💀",hp:165,atk:19,def:7,xp:65,gold:36},
 {name:"Wisp Stalker",sprite:"wisp-stalker",icon:"👻",hp:185,atk:21,def:8,xp:75,gold:42}
];
const bosses=[
 [260,22,7,130,90],[390,29,10,180,125],[540,36,13,240,165],[690,42,16,300,210],
 [850,48,19,370,260],[1030,55,22,450,320],[1240,62,25,540,390],[1500,72,29,700,500]
].map(([hp,atk,def,xp,gold])=>({name:"Boss",hp,atk,def,xp,gold}));
test("INDEX preview equals the real server spawn formula: 40 stages x 4 party sizes x both pack rolls",()=>{
 let checks=0;
 for(let stage=1;stage<=world.totalStages;stage++){
  const first=world.encounter(stage,normal,bosses),preview=pack.encounterPreview(stage,first,normal);
  assert.equal(preview.length,4);
  for(let partySize=1;partySize<=4;partySize++){
   for(const roll of [0,.999999]){
    const room={stage,players:{size:partySize},enemies:[],monster:null};
    const spawned=pack.makeGroup(room,first,normal,()=>roll),foe=spawned[0];
    const example=preview[partySize-1].variants.find(x=>x.count===spawned.length);
    assert.ok(example,"missing count variant: stage "+stage+" party "+partySize);
    for(const [k,value] of Object.entries({count:spawned.length,hp:foe.maxHp,atk:foe.atk,def:foe.def,xp:foe.xp,gold:foe.gold}))
     assert.equal(example[k],value,k+" mismatch stage "+stage+" party "+partySize);
    if(first.boss)assert.equal(example.phase2Atk,Math.round(foe.atk*1.12));
    checks++;
   }
  }
 }
 assert.equal(checks,320);
});
test("INDEX API uses exact enemy spawn preview, including party sizing, and never stale base values",()=>{
 const server=read("server.js"),index=read("public/adventure-index-v0552.js"),game=read("public/game.js");
 assert.ok(server.includes("pack.encounterPreview(stage,foe,normal)"));
 assert.ok(server.includes("hp:solo.hp,atk:solo.atk,def:solo.def"));
 assert.ok(server.includes("partyPreview,...combat.enemyCodex"));
 assert.ok(index.includes('id="v060IndexParty"'));
 assert.ok(index.includes("enemyScenarios(e)"));
 assert.ok(index.includes("enemyMetric(item,"));
 assert.ok(index.includes("ACTUAL SPAWN STATS"));
 assert.ok(index.includes("updateHero(p,state)"));
 assert.ok(game.includes("window.SoulboundIndex?.updateHero(v040Me,s)"));
});
test("Audio has one bottom-right dock after game layout with all original control IDs",()=>{
 const html=read("public/index.html");
 const dock=html.indexOf('class="v22-command-dock"'),audio=html.indexOf('class="v061-audio-dock"'),layout=html.indexOf('class="game-layout"');
 assert.ok(dock>=0&&layout>dock&&audio>layout);
 assert.ok(html.slice(dock,audio).includes('id="toggleEquipment"'));
 assert.equal(html.slice(dock,audio).includes('id="audioSettingsToggle"'),false);
 assert.ok(html.slice(audio,html.indexOf('<div id="shopPanel"',audio)).includes('id="audioSettingsToggle"'));
 for(const id of ["audioSettingsToggle","audioSettings","musicQuick","sfxQuick","gameMusicVolume","gameSfxVolume","audioTest","audioStatus"])
  assert.equal(html.split('id="'+id+'"').length-1,1,id);
 assert.ok(html.includes("v061-elemental-ui.css?v=0.61"));
 assert.ok(html.includes("adventure-index-v0552.js?v=0.62"));
});

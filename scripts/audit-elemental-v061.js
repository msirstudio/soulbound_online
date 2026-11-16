"use strict";
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const catalog=require("../items/weapon-shop-v060"),effects=require("../items/weapon-passives-v061");
function audit(){
 const pkg=JSON.parse(read("package.json")),html=read("public/index.html"),server=read("server.js"),game=read("public/game.js");
 const items=catalog.WEAPONS,ids=new Set(items.map(x=>x.id));
 const checks={
  version:pkg.version==="0.63.0"&&html.includes("<small>v0.63</small>")&&html.includes("VERSION 0.63 · ASSASSIN + PRIEST"),
  fifteenRealPassives:items.length===15&&ids.size===15&&items.every(w=>effects.spec[w.id]?.element===w.element&&w.passive?.chance>0),
  originalIdPreservation:items.every(w=>w.slot==="weapon"&&w.requiredBoss&&w.price>0&&w.level>0),
  serverAuthoritative:server.includes("weaponPassives.applyPassive(")&&server.includes("weaponPassives.attackElement("),
  exactOriginalDamageCore:server.includes("formulas.basicAttack(")&&server.includes("formulas.skillAttack(")&&server.includes("formulas.areaSplash("),
  burnLifecycle:server.includes("weaponPassives.tickBurn(m)")&&server.includes("if(pack.deadTarget(r))finish(r)"),
  savePreserved:server.includes("secure.load(v.accessToken,v.slot)")&&server.includes("loot.normalizeInventory(v.inventory,shopItems)"),
  multiplayerGuard:server.includes('s.on("resumeRoom"')&&server.includes("multi.lookup(r,actor,actionId,fingerprint)"),
  itemDescriptions:game.includes("it.passive.description")&&read("public/adventure-index-v0552.js").includes("e.passive.description"),
  bottomAudio:html.includes('class="v061-audio-dock"')&&!html.includes('class="v0559-audio-row"')&&html.indexOf('class="v061-audio-dock"')>html.indexOf('class="game-layout"'),
  noDuplicateAudioIds:["audioSettingsToggle","audioSettings","musicQuick","sfxQuick","gameMusicVolume","gameSfxVolume"].every(id=>html.split('id="'+id+'"').length===2),
  noOldAudioCss:html.includes("v061-elemental-ui.css?v=0.61")&&!html.includes("v060-index-audio-fix.css"),
  visualOnly:html.includes("weapon-effects-v061.js?v=0.61")&&read("public/weapon-effects-v061.js").includes("window.SoulboundWeaponFxV61")
 };
 return {version:pkg.version,passed:Object.values(checks).every(Boolean),checks,weaponCount:items.length,limitations:["Manual browser visual verification after Render deploy is required","No SQL migration required"]};
}
if(require.main===module){const result=audit();process.stdout.write(JSON.stringify(result,null,2)+"\n");if(!result.passed)process.exitCode=1}
module.exports={audit};

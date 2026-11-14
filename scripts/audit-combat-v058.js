"use strict";
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
function audit(){
 const pkg=JSON.parse(read("package.json")),server=read("server.js"),enemy=read("combat-v054.js"),v055=read("combat-v055.js"),html=read("public/index.html");
 const checks={
  npmSemver:pkg.version==="0.59.0",
  twoPartUi:html.includes("v0.59 MULTIPLAYER")&&html.includes("<small>v0.59</small>"),
  pureSharedDamage:server.includes("formulas.basicAttack")&&server.includes("formulas.skillAttack")&&server.includes("formulas.breakAttack")&&server.includes("formulas.areaSplash"),
  enemyDamageShared:enemy.includes("formulas.enemyRaw")&&enemy.includes("formulas.enemyFinal"),
  canonicalSkillData:server.includes("skillCore.definition")&&v055.includes("const SKILL_COSTS=skillCore.SKILL_COSTS"),
  unchangedEncounterPackage:server.includes('const pack=world.encounterPack;'),
  secureSavePreserved:server.includes('secure.load(v.accessToken,v.slot)')&&server.includes('secureQueue.persist(claim,p)'),
  strictAuthModes:server.includes('r.accountMode!==(guest?"guest":"account")')
 };
 const remaining=["Status execution, boss AI and combat event logging still occupy legacy modules","Live Render/Supabase save compatibility and browser combat visual QA must be verified","New damage arithmetic intentionally preserves old 0.57 balance, not a fresh balance adjustment"];
 return{version:"0.59",passed:Object.values(checks).every(Boolean),checks,remaining};
}
if(require.main===module){const result=audit();process.stdout.write(JSON.stringify(result,null,2)+"\n");if(!result.passed)process.exitCode=1}
module.exports={audit};

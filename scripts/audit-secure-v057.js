"use strict";
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
function audit(){
 const pkg=JSON.parse(read("package.json")),html=read("public/index.html"),server=read("server.js"),client=read("public/game.js"),db=read("SUPABASE-SECURE-SAVES-V057.sql");
 const tests={
  npmSemver:pkg.version==="0.59.0",twoDigitUI:html.includes("v0.59 MULTIPLAYER")&&html.includes("<small>v0.59</small>"),
  authoritativeServerRestore:server.includes("secure.load(v.accessToken,v.slot)"),
  noClientWritesInSecureMode:client.includes("if(v57Mode&&!guestMode)return;const data="),
  databaseWriteLock:db.includes("revoke all on public.hero_secure_saves from anon,authenticated,public"),
  backendRevisionCAS:read("persistence/secure-saves-v057.js").includes("revision=eq."),
  separateGuestAccountRooms:server.includes('r.accountMode!==(guest?"guest":"account")'),
  oldSaveTablesPreserved:!db.includes("drop table")&&!db.includes("truncate table"),
  secureModeAdvertised:server.includes("secureSavesEnabled:secure.enabled")
 };
 return{displayVersion:"0.59",secureModeWillRunOnlyWithServerSecrets:true,sourceAuditPassed:Object.values(tests).every(Boolean),
  tests,remainingManualActions:["Supabase backup","Run 0.57 SQL migration","Set three Render env vars","Test real account and Guest in staging","Verify /health secureSavesEnabled=true","Multiplayer / reconnection / conflict stress test"]};
}
if(require.main===module){const result=audit();process.stdout.write(JSON.stringify(result,null,2)+"\n");if(!result.sourceAuditPassed)process.exitCode=1}
module.exports={audit};

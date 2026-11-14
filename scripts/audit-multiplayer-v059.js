"use strict";
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=file=>fs.readFileSync(path.join(root,file),"utf8");
function audit(){
 const pkg=JSON.parse(read("package.json")),server=read("server.js"),client=read("public/game.js"),html=read("public/index.html");
 const reconnect=read("multiplayer/session-v059.js");
 const checks={
  npmSemver:pkg.version==="0.59.0",
  visibleVersion:html.includes("<small>v0.59</small>")&&html.includes("v0.59 MULTIPLAYER"),
  actionReceipts:server.includes("multi.lookup(")&&server.includes("multi.remember(")&&client.includes("actionId:"),
  reconnectToken:server.includes("multi.issue(r,s.id)")&&server.includes('s.on("resumeRoom"')&&client.includes("sessionStorage.setItem(v59StorageKey()"),
  secureIdentityOnResume:server.includes("secure.authenticate(accessToken)")&&server.includes("id!==claim.userId"),
  noRoomTokenLeak:!server.slice(server.indexOf("function publicRoom("),server.indexOf("function emit(")).includes("ticket"),
  pauseDisconnect:server.includes("multi.hasMissing(r)")&&reconnect.includes("RECONNECT_MS=120000"),
  rewardOnce:server.includes("r.rewardedEncounter===r.encounterId")&&server.includes("r.encounterId=randomUUID()"),
  safePersistence:server.includes("secureQueue.persist(claim,p)")&&server.includes("secure.load(v.accessToken,v.slot)"),
  pureDamagePreserved:server.includes("formulas.basicAttack(")&&server.includes("skillCore.definition(")
 };
 return{version:"0.59",passed:Object.values(checks).every(Boolean),checks,knownLimitations:[
  "Tickets and action receipts live in one Node process; a Render instance restart cannot restore active battles",
  "Duplicate action IDs are rejected inside one running room; use durable transaction IDs to guarantee exactly-once rewards across crashes",
  "Browser and live multiplayer staging tests are still necessary before production deployment",
  "Guest players are not authoritative for a competitive economy"
 ]};
}
if(require.main===module){const result=audit();process.stdout.write(JSON.stringify(result,null,2)+"\n");if(!result.passed)process.exitCode=1}
module.exports={audit};

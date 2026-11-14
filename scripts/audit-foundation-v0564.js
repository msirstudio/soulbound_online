"use strict";
/* SOULBOUND v0.56.4: deterministic repo foundation audit.
 * READ ONLY: never connects to production, edits saves or uses secrets.
 */
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");
function audit(){
 const pkg=JSON.parse(read("package.json"));
 const html=read("public/index.html"),server=read("server.js"),game=read("public/game.js");
 const passed=[],failed=[];
 const check=(label,test)=>(test?passed:failed).push(label);
 check("package version is semver",/^\d+\.\d+\.\d+$/.test(pkg.version));
 check("visible game version matches package",html.includes("<small>v"+pkg.version+"</small>"));
 check("menu version matches package",html.includes("v"+pkg.version+" SYSTEM FOUNDATION"));
 check("API version uses canonical package value",server.includes('readFileSync(path.join(__dirname,"package.json")')&&
  (server.match(/version:APP_VERSION/g)||[]).length>=2);
 check("version sync client present",html.includes('version-v0564.js?v=0.56.4'));
 check("save export controller loads before game.js",html.indexOf("save-guard-v0564.js")>=0&&
  html.indexOf("save-guard-v0564.js")<html.indexOf("game.js?v=0.56.4"));
 check("all 3 save slots remain selectable",game.includes("v561Slots=[null,null,null]")&&
  game.includes('data-v561-pick'));
 check("pre-delete backup is required",game.includes('snapshot(v564Owner(),n,v561Slots[n-1],"before-delete")'));
 check("pre-new-game backup is required",game.includes('"before-new-game"'));
 const start=game.indexOf('$("newGame").onclick=async()=>{');
 const end=game.indexOf("/* Character appearance",start);
 const section=game.slice(start,end);
 check("world cache reset happens only after successful new-game cloud write",
  start>=0&&section.includes("const freshWorld=")&&section.includes("if(error)return notice")&&
  section.indexOf("v40CacheWorld(freshWorld)")>section.indexOf("if(error)return notice")&&
  !section.includes("v40CacheWorld({version:40"));
 check("RLS migration is present (not applied here)",read("SUPABASE-SAVE-SLOTS-V0561.sql").includes("enable row level security"));
 check("regression tests remain enabled",pkg.scripts.test.includes("tests/*.test.js"));
 const risks=[
  "P0 OPEN: restoreCharacter still trusts some client-supplied stats; harden in v0.56.5",
  "P0 OPEN: profile/slot writes lack server-side revision conflict control; harden in v0.56.5",
  "P1 OPEN: browser backups are device-local JSON exports, not verified cloud recovery",
  "P1 OPEN: actual Render/Supabase restore and multiplayer stress tests need manual verification"
 ];
 return{version:pkg.version,pass:failed.length===0,passed,failed,risks};
}
if(require.main===module){
 const result=audit();
 process.stdout.write(JSON.stringify(result,null,2)+"\n");
 if(!result.pass)process.exitCode=1;
}
module.exports={audit};
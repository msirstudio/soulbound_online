"use strict";
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const weapons=require("../items/weapon-shop-v060");
function audit(){
 const pkg=JSON.parse(read("package.json")),server=read("server.js"),client=read("public/game.js"),html=read("public/index.html");
 const counts=Object.fromEntries(["swordsman","mage","tank"].map(c=>[c,weapons.WEAPONS.filter(i=>i.class===c).length]));
 const checks={
  npmVersion:pkg.version==="0.60.0",
  visibleVersion:html.includes("<small>v0.60</small>")&&html.includes("v0.60 WEAPON SHOP"),
  fifteenNew:weapons.WEAPONS.length===15&&Object.values(counts).every(n=>n===5),
  realShopCatalog:server.includes("...weaponCatalog.WEAPONS"),
  categoryFix:server.includes('it.slot==="weapon"?"weapon":it.slot==="armor"?"armor":"potion"'),
  serverGates:server.includes("weaponCatalog.checkPurchase(p,it)"),
  clientClassFilter:client.includes('it.category!=="weapon"||it.class===me?.classId'),
  uidEquip:client.includes("it.uid||it.id"),
  responsiveShop:html.includes("v060-weapon-shop.css?v=0.60"),
  savePreserved:server.includes("secure.load(v.accessToken,v.slot)"),
  damagePreserved:server.includes("formulas.basicAttack("),
  reconnectPreserved:server.includes('s.on("resumeRoom"')
 };
 return {version:"0.60",passed:Object.values(checks).every(Boolean),counts,checks,
 limitations:["Elemental damage begins in planned 0.61","Manual browser and real Render staging checks remain required"]};
}
if(require.main===module){
 const result=audit();
 process.stdout.write(JSON.stringify(result,null,2)+String.fromCharCode(10));
 if(!result.passed)process.exitCode=1;
}
module.exports={audit};
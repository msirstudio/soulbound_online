"use strict";
/* SOULBOUND v0.55.5: maintainable, exact-order CSS bundling with Node built-ins. */
const fs=require("node:fs"),path=require("node:path");
const bundles={
  "css-legacy-v0555.css": [
    "style.css",
    "v022.css",
    "v023.css",
    "v024.css",
    "v025.css",
    "v0261.css",
    "v0261b.css",
    "v028.css",
    "v029.css",
    "v030.css",
    "v0311.css",
    "v032.css",
    "v033.css",
    "v034.css",
    "v035.css",
    "v037.css",
    "v038.css",
    "v039.css"
  ],
  "css-hud-v0555.css": [
    "v0411.css",
    "v042.css",
    "v044-backgrounds.css",
    "v044-ui.css"
  ],
  "css-combat-v0555.css": [
    "v054-combat.css",
    "v055-combat-codex.css"
  ]
};
const banner="/* SOULBOUND v0.55.5 · AUTO-GENERATED CSS BUNDLE. Run `node scripts/build-css-bundles.js` after changing any source CSS. Preserve source order. */\n\n";
const root=path.resolve(__dirname,"..","public");
function buildBundle(sources){
 return banner+sources.map(name=>{
  const text=fs.readFileSync(path.join(root,name),"utf8");
  if(/^\s*@(?:import|charset|namespace)\b/m.test(text))throw new Error("Unsafe to concatenate CSS source: "+name);
  return "/* BEGIN "+name+" */\n"+text+"\n/* END "+name+" */\n";
 }).join("\n");
}
function regenerate(){
 for(const [dest,sources] of Object.entries(bundles)){
  fs.writeFileSync(path.join(root,dest),buildBundle(sources),"utf8");
  process.stdout.write(dest+": "+sources.length+" source CSS files\n");
 }
}
if(require.main===module)regenerate();
module.exports={bundles,banner,buildBundle,regenerate};

/* SOULBOUND v0.39 — eight illustrated boss sprites with normal / hit poses.
 * Presentation only. No server, combat calculations, save or inventory changes.
 * Assets: public/assets/bosses/v039/<key>_normal.png and <key>_hit.png
 */
(()=>{
"use strict";
const map=Object.freeze({
 3:"briarfang_alpha",
 6:"dreadforge_champion",
 9:"ember_tyrant",
 12:"hollow_oracle",
 15:"glacier_warden",
 18:"ancient_world_eater",
 21:"void_reaper",
 24:"eclipse_sovereign"
});
const base="/assets/bosses/v039/";
const assets=new Map();
let activeKey="",lastHP=null,hitUntil=0,hitTimer=null,currentMonster=null,renderTarget=null;
const damageMs=540;
function imagesFor(stage){
 if(!map[stage])return null;
 if(assets.has(stage))return assets.get(stage);
 const id=map[stage],normal=base+id+"_normal.png",hit=base+id+"_hit.png";
 const record={normal,hit,ready:false,failed:false,pending:true};
 assets.set(stage,record);
 const check=(url)=>new Promise(resolve=>{
   const img=new Image();
   img.onload=()=>resolve(img.naturalWidth>0&&img.naturalHeight>0);
   img.onerror=()=>resolve(false);
   img.src=url;
 });
 Promise.all([check(normal),check(hit)]).then(([goodNormal,goodHit])=>{
  record.ready=goodNormal&&goodHit;record.failed=!record.ready;record.pending=false;
  if(activeKey&&activeKey.startsWith(stage+":")&&currentMonster){
   // Replay latest sprite selection only; never spuriously trigger a hit.
   display(stage);
  }
 }).catch(()=>{record.failed=true;record.pending=false});
 return record;
}
function fallback(monster){
 return "/assets/bosses/"+(monster?.sprite||"boss-eclipse-sovereign")+".svg";
}
function display(stage){
 const img=renderTarget||document.getElementById("monsterSprite");
 if(!img||!currentMonster)return;
 const record=imagesFor(stage);
 const now=performance.now();
 const hit=now<hitUntil;
 const desired=record?.ready?(hit?record.hit:record.normal):fallback(currentMonster);
 if(img.getAttribute("src")!==desired)img.setAttribute("src",desired);
 img.classList.toggle("v039-boss-art",!!record?.ready);
 img.classList.toggle("v039-hit",!!record?.ready&&hit);
 img.dataset.v039Frame=record?.ready?(hit?"hit":"normal"):"fallback";
}
function render(monster,stage){
 const el=document.getElementById("monsterSprite");
 if(!el)return;
 renderTarget=el;
 if(!monster?.boss||!map[stage]){
   activeKey="";lastHP=null;hitUntil=0;currentMonster=null;
   if(hitTimer){clearTimeout(hitTimer);hitTimer=null}
   el.classList.remove("v039-boss-art","v039-hit");delete el.dataset.v039Frame;
   return;
 }
 const newKey=stage+":"+monster.name;
 const hp=Number(monster.hp);
 if(!Number.isFinite(hp))return;
 if(activeKey!==newKey){
   activeKey=newKey;lastHP=hp;hitUntil=0;
   if(hitTimer){clearTimeout(hitTimer);hitTimer=null}
 }else if(lastHP!==null&&hp<lastHP&&hp>=0){
   hitUntil=performance.now()+damageMs;
   if(hitTimer)clearTimeout(hitTimer);
   hitTimer=setTimeout(()=>{
     hitUntil=0;hitTimer=null;
     if(activeKey===newKey)display(stage);
   },damageMs);
 }
 lastHP=hp;
 currentMonster={name:monster.name,sprite:monster.sprite};
 display(stage);
}
function status(){
 return{bosses:Object.keys(map).length,ready:[...assets.entries()].filter(([,a])=>a.ready).map(([stage])=>stage),assetBase:base};
}
window.SoulboundBossSpritesV39={render,imagesFor,status};
})();
/* SOULBOUND v0.31.1 — real per-frame sprite-sheet playback.
   Sheets are separately packaged; missing files automatically fall back to v0.30 art.
   NO changes to battle results, level, equipment or save data. */
(()=>{
"use strict";
const prefix="assets/sprites/swordsman/";
const assets={
 male:{idle:prefix+"male_idle.png",attack:prefix+"male_attack.png"},
 female:{idle:prefix+"female_idle.png",attack:prefix+"female_attack.png"}
};
const state={male:false,female:false};
const attacks=new Map();
let previewGender="male",previewActive=false,started=false;
const idleCount=6,attackCount=8,idleFps=7,attackFps=12;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const canDraw=p=>p&&p.classId==="swordsman";
function basename(g){return g==="female"?"female":"male"}
function spriteMarkup(p){
 const gender=basename(p.gender),id=esc(p.id);
 const fallback=window.SoulboundHeroArt?.render(p)||"";
 return '<span class="v311-hero" data-v311-gender="'+gender+'" data-v311-player="'+id+'">'+
 '<span class="v311-sheet" role="img" aria-label="'+esc(gender+' swordsman')+'" style="background-image:url(&quot;'+assets[gender].idle+'&quot;)"></span>'+
 '<img class="sprite-img v311-fallback" alt="'+esc(gender+' swordsman')+'" src="'+fallback+'">'+
 '</span>';
}
function markLoaded(g){
 state[g]=true;
 document.querySelectorAll('.v311-hero[data-v311-gender="'+g+'"]').forEach(el=>el.classList.add("v311-ready"));
 if(previewGender===g)syncPreview();
}
function preload(){
 for(const gender of ["male","female"]){
  const urls=[assets[gender].idle,assets[gender].attack];
  Promise.all(urls.map(url=>new Promise((resolve,reject)=>{
   const img=new Image();
   img.onload=()=>img.naturalWidth===192*(url.includes("_idle")?idleCount:attackCount)&&img.naturalHeight===256?resolve(true):reject(new Error("Invalid sheet dimensions"));
   img.onerror=reject;img.src=url;
  }))).then(()=>markLoaded(gender)).catch(()=>{/* fallback stays visible until assets are uploaded */});
 }
}
function refresh(){
 document.querySelectorAll(".v311-hero").forEach(el=>el.classList.toggle("v311-ready",!!state[basename(el.dataset.v311Gender)]));
 syncPreview();
 if(!started){started=true;requestAnimationFrame(tick)}
}
function attack(id){
 if(id==null)return;
 attacks.set(String(id),performance.now()+1000/attackFps*attackCount);
}
function tick(now){
 document.querySelectorAll(".v311-hero.v311-ready").forEach(el=>{
  const gender=basename(el.dataset.v311Gender),playerId=String(el.dataset.v311Player||"");
  const end=attacks.get(playerId)||0,active=now<end;
  const frames=active?attackCount:idleCount;
  const frame=active?Math.min(frames-1,Math.floor((now-(end-1000/attackFps*attackCount))*attackFps/1000)):
    Math.floor(now/1000*idleFps)%idleCount;
  const sheet=el.querySelector(".v311-sheet");if(!sheet)return;
  const wanted=(active?assets[gender].attack:assets[gender].idle);
  if(sheet.dataset.url!==wanted){sheet.dataset.url=wanted;sheet.style.backgroundImage='url("'+wanted+'")';}
  sheet.style.backgroundSize=(frames*100)+"% 100%";
  sheet.style.backgroundPosition=(frame/(frames-1)*100)+"% 0%";
  el.classList.toggle("v311-attacking",active);
 });
 const preview=document.getElementById("v311PreviewSprite");
 if(preview&&previewActive&&state[previewGender]){
  const frame=Math.floor(now/1000*idleFps)%idleCount;
  preview.style.backgroundPosition=(frame/(idleCount-1)*100)+"% 0%";
 }
 for(const [id,deadline] of attacks)if(now>deadline)attacks.delete(id);
 requestAnimationFrame(tick);
}
function syncPreview(){
 const img=document.getElementById("v30HeroPreview");
 if(!img)return;
 let box=document.getElementById("v311PreviewSprite");
 if(!box){box=document.createElement("span");box.id="v311PreviewSprite";box.className="v311-preview-sprite";img.insertAdjacentElement("afterend",box)}
 const ready=previewActive&&state[previewGender];
 const parent=img.closest(".v30-preview");
 if(parent)parent.classList.toggle("v311-preview-ready",!!ready);
 box.style.backgroundImage='url("'+assets[previewGender].idle+'")';
 box.style.backgroundSize="600% 100%";
}
function preview(cls,gender){
 previewActive=cls==="swordsman";previewGender=basename(gender);
 syncPreview();
}
function hasAssets(gender){return !!state[basename(gender)]}
window.SoulboundSprite={canDraw,spriteMarkup,attack,preview,refresh,hasAssets,paths:assets,meta:{width:192,height:256,idle:idleCount,attack:attackCount}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{preload();refresh()},{once:true});
else{preload();refresh()}
})();

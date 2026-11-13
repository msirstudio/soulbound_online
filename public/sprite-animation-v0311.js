/* SOULBOUND v0.55.4 · Swordsman male/female static pixel poses.
 * The generated 3-pose PNG set is optional. If not installed, the original
 * v0.31.1 animation sheets / equipment-aware SVG fallbacks continue to work.
 * No server combat, save or progression data is changed here.
 */
(()=>{
"use strict";
const sheetRoot="assets/sprites/swordsman/";
const poseRoot="/assets/hero-poses/swordsman/";
const assets={
 male:{idle:sheetRoot+"male_idle.png",attack:sheetRoot+"male_attack.png"},
 female:{idle:sheetRoot+"female_idle.png",attack:sheetRoot+"female_attack.png"}
};
const poseAssets={
 male:{idle:poseRoot+"male_idle.png",hit:poseRoot+"male_hit.png",attack:poseRoot+"male_attack.png"},
 female:{idle:poseRoot+"female_idle.png",hit:poseRoot+"female_hit.png",attack:poseRoot+"female_attack.png"}
};
const sheetReady={male:false,female:false};
const poseReady={male:false,female:false};
const attacks=new Map(),hits=new Map();
const idleCount=6,attackCount=8,idleFps=7,attackFps=12;
const attackMs=650,hitMs=450;
let previewGender="male",previewActive=false,started=false;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const basename=g=>g==="female"?"female":"male";
const canDraw=p=>p&&p.classId==="swordsman";
function spriteMarkup(p){
 const g=basename(p.gender),id=esc(p.id);
 const fallback=window.SoulboundHeroArt?.render(p)||"";
 return '<span class="v311-hero" data-v311-gender="'+g+'" data-v311-player="'+id+'">'+
 '<span class="v311-sheet" role="img" aria-label="'+esc(g+' swordsman animated')+'" style="background-image:url(&quot;'+assets[g].idle+'&quot;)"></span>'+
 '<img class="v311-pose" alt="'+esc(g+' swordsman sprite')+'" src="'+poseAssets[g].idle+'">'+
 '<img class="sprite-img v311-fallback" alt="'+esc(g+' swordsman')+'" src="'+fallback+'">'+
 '</span>';
}
function fetchImage(src){
 return new Promise((resolve,reject)=>{
  const img=new Image();
  img.onload=()=>img.naturalWidth>0&&img.naturalHeight>0?resolve(img):reject(new Error("Invalid PNG"));
  img.onerror=reject;img.src=src;
 });
}
function preload(){
 for(const g of ["male","female"]){
  Promise.all(Object.values(poseAssets[g]).map(fetchImage)).then(()=>{
   poseReady[g]=true;refresh();
  }).catch(()=>{/* defer to older sprite sheet or v0.30 artwork */});
  const urls=[assets[g].idle,assets[g].attack];
  Promise.all(urls.map(url=>fetchImage(url).then(img=>{
    const frames=url.includes("_idle")?idleCount:attackCount;
    if(img.naturalWidth!==192*frames||img.naturalHeight!==256)throw new Error("Unexpected legacy sheet size");
  }))).then(()=>{sheetReady[g]=true;refresh()}).catch(()=>{/* SVG fallback remains */});
 }
}
function refresh(){
 document.querySelectorAll(".v311-hero").forEach(el=>{
  const g=basename(el.dataset.v311Gender);
  el.classList.toggle("v311-pose-ready",poseReady[g]);
  el.classList.toggle("v311-ready",!poseReady[g]&&sheetReady[g]);
 });
 syncPreview();
 if(!started){started=true;requestAnimationFrame(tick);}
}
function attack(id){
 if(id!=null){const key=String(id);attacks.set(key,performance.now()+attackMs);hits.delete(key);}
}
function hit(id){
 if(id!=null){const key=String(id);hits.set(key,performance.now()+hitMs);}
}
function tick(now){
 document.querySelectorAll(".v311-hero").forEach(el=>{
  const g=basename(el.dataset.v311Gender),id=String(el.dataset.v311Player||"");
  const attacking=now<(attacks.get(id)||0);
  const damaged=!attacking&&now<(hits.get(id)||0);
  if(poseReady[g]){
   const state=attacking?"attack":damaged?"hit":"idle";
   const pose=el.querySelector(".v311-pose");
   const target=poseAssets[g][state];
   if(pose&&pose.dataset.url!==target){pose.dataset.url=target;pose.src=target;}
   el.classList.toggle("v311-attacking",attacking);
   el.classList.toggle("v311-hit",damaged);
  } else if(sheetReady[g]){
   const frames=attacking?attackCount:idleCount;
   const frame=attacking?Math.min(frames-1,Math.floor((now-(attacks.get(id)-attackMs))*attackFps/1000)):
     Math.floor(now/1000*idleFps)%idleCount;
   const sheet=el.querySelector(".v311-sheet");
   if(sheet){
    const target=attacking?assets[g].attack:assets[g].idle;
    if(sheet.dataset.url!==target){sheet.dataset.url=target;sheet.style.backgroundImage='url("'+target+'")';}
    sheet.style.backgroundSize=frames*100+"% 100%";
    sheet.style.backgroundPosition=(frame/(frames-1)*100)+"% 0%";
   }
   el.classList.toggle("v311-attacking",attacking);
   el.classList.toggle("v311-hit",damaged);
  }
 });
 const preview=document.getElementById("v311PreviewSprite");
 if(preview&&previewActive&&sheetReady[previewGender]&&!poseReady[previewGender]){
  preview.style.backgroundPosition=((Math.floor(now/1000*idleFps)%idleCount)/(idleCount-1)*100)+"% 0%";
 }
 for(const [id,deadline] of attacks)if(now>deadline)attacks.delete(id);
 for(const [id,deadline] of hits)if(now>deadline)hits.delete(id);
 requestAnimationFrame(tick);
}
function syncPreview(){
 const img=document.getElementById("v30HeroPreview");
 if(!img)return;
 let sheet=document.getElementById("v311PreviewSprite");
 if(!sheet){sheet=document.createElement("span");sheet.id="v311PreviewSprite";sheet.className="v311-preview-sprite";img.insertAdjacentElement("afterend",sheet);}
 let pose=document.getElementById("v311PreviewPose");
 if(!pose){pose=document.createElement("img");pose.id="v311PreviewPose";pose.className="v311-preview-pose";pose.alt="Swordsman idle pose";sheet.insertAdjacentElement("afterend",pose);}
 const readyPose=previewActive&&poseReady[previewGender];
 const readySheet=previewActive&&!readyPose&&sheetReady[previewGender];
 const parent=img.closest(".v30-preview");
 if(parent){parent.classList.toggle("v311-preview-pose-ready",readyPose);parent.classList.toggle("v311-preview-ready",readySheet);}
 pose.src=poseAssets[previewGender].idle;
 sheet.style.backgroundImage='url("'+assets[previewGender].idle+'")';
 sheet.style.backgroundSize="600% 100%";
}
function preview(cls,gender){
 previewActive=cls==="swordsman";
 previewGender=basename(gender);
 syncPreview();
}
function hasAssets(gender){const g=basename(gender);return poseReady[g]||sheetReady[g];}
window.SoulboundSprite={
 canDraw,spriteMarkup,attack,hit,preview,refresh,hasAssets,paths:assets,posePaths:poseAssets,
 meta:{width:192,height:256,idle:idleCount,attack:attackCount,staticPoses:3}
};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{preload();refresh()},{once:true});
else{preload();refresh();}
})();
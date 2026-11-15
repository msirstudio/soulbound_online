/* SOULBOUND v0.55.6 · Swordsman & Mage static pixel poses.
 * Art packs are optional: the old 6/8-frame Swordsman sheets and equipment-aware
 * SVG fallback stay available. Mage uses its own distinct characters and never
 * falls back to the Swordsman sprite sheets.
 * No server combat, save, class stats or progression data is changed.
 */
(()=>{
"use strict";
const sheetRoot="assets/sprites/swordsman/";
const poseRoot="/assets/hero-poses/";
/* v0.62.2 — original 12-frame Female Knight sheet, 12 FPS. Art-only.
 * Keep an older file as fallback until the 12-frame PNG is uploaded.
 * Once present, the 12-frame original always takes priority. */
const femaleIdle=Object.freeze({src:"assets/hero-animations/female_swordsman_idle_12f.png?v=0.62.2",frames:12,frameWidth:256,frameHeight:256,fps:12,baselineY:254});
const legacyFemaleIdle=Object.freeze({src:"assets/hero-animations/female_swordsman_idle_8f.png?v=0.62.1",frames:8,frameWidth:256,frameHeight:256,fps:12,baselineY:232});
let femaleIdleReady=false,activeFemaleIdle=null;
function isValidFemaleIdleImage(img,config){
 return img.naturalWidth===config.frames*config.frameWidth && img.naturalHeight===config.frameHeight;
}
const assets={
 male:{idle:sheetRoot+"male_idle.png",attack:sheetRoot+"male_attack.png"},
 female:{idle:sheetRoot+"female_idle.png",attack:sheetRoot+"female_attack.png"}
};
const classes=["swordsman","mage"],genders=["male","female"];
const poseAssets=Object.fromEntries(classes.map(cls=>[
 cls,Object.fromEntries(genders.map(g=>[
  g,{idle:poseRoot+cls+"/"+g+"_idle.png",hit:poseRoot+cls+"/"+g+"_hit.png",attack:poseRoot+cls+"/"+g+"_attack.png"}
 ]))
]));
const sheetReady={male:false,female:false};
const poseReady={swordsman:{male:false,female:false},mage:{male:false,female:false}};
const attacks=new Map(),hits=new Map();
const idleCount=6,attackCount=8,idleFps=7,attackFps=12;
const attackMs=680,hitMs=780;
let previewGender="male",previewClass="swordsman",previewActive=false,started=false;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const basename=g=>g==="female"?"female":"male";
const canDraw=p=>p&&classes.includes(p.classId);
function spriteMarkup(p){
 const g=basename(p.gender),cls=p.classId==="mage"?"mage":"swordsman",id=esc(p.id);
 const fallback=window.SoulboundHeroArt?.render(p)||"";
 return '<span class="v311-hero" data-v311-class="'+cls+'" data-v311-gender="'+g+'" data-v311-player="'+id+'">'+
 '<span class="v311-sheet" role="img" aria-label="'+esc(g+' swordsman animated')+'" style="background-image:url(&quot;'+assets[g].idle+'&quot;)"></span>'+
 '<span class="v311-custom-idle" aria-hidden="true"></span>'+
 '<img class="v311-pose" alt="'+esc(g+' '+cls+' sprite')+'" src="'+poseAssets[cls][g].idle+'">'+
 '<img class="sprite-img v311-fallback" alt="'+esc(g+' '+cls)+'" src="'+fallback+'">'+
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
 function tryFemaleIdle(config){
  return fetchImage(config.src).then(img=>{
   if(!isValidFemaleIdleImage(img,config))throw new Error("Incorrect Female Knight sheet dimensions");
   return config;
  });
 }
 // Both loads are independent: original 12-frame art wins regardless of network timing.
 tryFemaleIdle(legacyFemaleIdle).then(config=>{
  if(!femaleIdleReady){activeFemaleIdle=config;femaleIdleReady=true;refresh();}
 }).catch(()=>{/* High-resolution poses and SVG fallback stay intact. */});
 tryFemaleIdle(femaleIdle).then(config=>{
  activeFemaleIdle=config;femaleIdleReady=true;refresh();
 }).catch(()=>{/* Use previous artwork until the 12-frame file is present. */});
 for(const cls of classes)for(const g of genders){
  Promise.all(Object.values(poseAssets[cls][g]).map(fetchImage)).then(()=>{
   poseReady[cls][g]=true;refresh();
  }).catch(()=>{/* defer to class-specific fallback artwork */});
 }
 for(const g of genders){
  const urls=[assets[g].idle,assets[g].attack];
  Promise.all(urls.map(url=>fetchImage(url).then(img=>{
    const frames=url.includes("_idle")?idleCount:attackCount;
    if(img.naturalWidth!==192*frames||img.naturalHeight!==256)throw new Error("Unexpected legacy sheet size");
  }))).then(()=>{sheetReady[g]=true;refresh()}).catch(()=>{/* SVG fallback remains */});
 }
}
function refresh(){
 document.querySelectorAll(".v311-hero").forEach(el=>{
  const g=basename(el.dataset.v311Gender),cls=el.dataset.v311Class==="mage"?"mage":"swordsman";
  el.classList.toggle("v311-pose-ready",poseReady[cls][g]);
  el.classList.toggle("v311-ready",cls==="swordsman"&&!poseReady[cls][g]&&sheetReady[g]);
  const customReady=cls==="swordsman"&&g==="female"&&femaleIdleReady&&activeFemaleIdle;
  el.classList.toggle("v311-custom-idle-available",!!customReady);
  if(customReady){
   const custom=el.querySelector(".v311-custom-idle");
   if(custom&&custom.dataset.url!==activeFemaleIdle.src){
    custom.dataset.url=activeFemaleIdle.src;
    custom.style.backgroundImage='url("'+activeFemaleIdle.src+'")';
    custom.style.backgroundSize=(activeFemaleIdle.frames*100)+"% 100%";
   }
  }
 });
 syncPreview();
 if(!started){started=true;requestAnimationFrame(tick);}
}
function attack(id){
 if(id!=null){const key=String(id);attacks.set(key,performance.now()+attackMs);hits.delete(key);}
}
function hit(id){
 if(id!=null){const key=String(id);attacks.delete(key);hits.set(key,performance.now()+hitMs);}
}
function tick(now){
 document.querySelectorAll(".v311-hero").forEach(el=>{
  const g=basename(el.dataset.v311Gender),cls=el.dataset.v311Class==="mage"?"mage":"swordsman",id=String(el.dataset.v311Player||"");
  const attacking=now<(attacks.get(id)||0);
  const damaged=!attacking&&now<(hits.get(id)||0);
  if(poseReady[cls][g]){
   const state=attacking?"attack":damaged?"hit":"idle";
   const pose=el.querySelector(".v311-pose");
   const target=poseAssets[cls][g][state];
   if(pose&&pose.dataset.url!==target){pose.dataset.url=target;pose.src=target;}
   el.classList.toggle("v311-attacking",attacking);
   el.classList.toggle("v311-hit",damaged);
  } else if(cls==="swordsman"&&sheetReady[g]){
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
  const customIdle=cls==="swordsman"&&g==="female"&&!!activeFemaleIdle&&!attacking&&!damaged;
  el.classList.toggle("v311-custom-idle-active",customIdle);
  if(customIdle){
   const custom=el.querySelector(".v311-custom-idle");
   if(custom){
    const f=Math.floor(now*activeFemaleIdle.fps/1000)%activeFemaleIdle.frames;
    custom.style.backgroundPosition=(f/(activeFemaleIdle.frames-1)*100)+"% 0%";
   }
  }
 });
 const preview=document.getElementById("v311PreviewSprite");
 if(preview&&previewActive&&previewClass==="swordsman"&&previewGender==="female"&&!!activeFemaleIdle){
  const f=Math.floor(now*activeFemaleIdle.fps/1000)%activeFemaleIdle.frames;
  preview.style.backgroundPosition=(f/(activeFemaleIdle.frames-1)*100)+"% 0%";
 }else if(preview&&previewActive&&previewClass==="swordsman"&&sheetReady[previewGender]&&!poseReady[previewClass][previewGender]){
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
 if(!pose){pose=document.createElement("img");pose.id="v311PreviewPose";pose.className="v311-preview-pose";pose.alt="Hero idle pose";sheet.insertAdjacentElement("afterend",pose);}
 const readyPose=previewActive&&poseReady[previewClass][previewGender];
 const readyCustom=previewActive&&previewClass==="swordsman"&&previewGender==="female"&&!!activeFemaleIdle;
 const readySheet=previewActive&&previewClass==="swordsman"&&!readyPose&&sheetReady[previewGender];
 const parent=img.closest(".v30-preview");
 if(parent){parent.classList.toggle("v311-preview-pose-ready",readyPose);parent.classList.toggle("v311-preview-ready",readySheet);parent.classList.toggle("v311-preview-custom-ready",readyCustom);}
 pose.src=poseAssets[previewClass][previewGender].idle;
 sheet.style.backgroundImage='url("'+(readyCustom?activeFemaleIdle.src:assets[previewGender].idle)+'")';
 sheet.style.backgroundSize=(readyCustom?activeFemaleIdle.frames*100:600)+"% 100%";
}
function preview(cls,gender){
 previewActive=classes.includes(cls);
 previewClass=cls==="mage"?"mage":"swordsman";
 previewGender=basename(gender);
 syncPreview();
}
function hasAssets(gender,cls="swordsman"){const g=basename(gender),c=cls==="mage"?"mage":"swordsman";return poseReady[c][g]||(c==="swordsman"&&(sheetReady[g]||(g==="female"&&femaleIdleReady)));}
window.SoulboundSprite={
 canDraw,spriteMarkup,attack,hit,preview,refresh,hasAssets,paths:assets,posePaths:poseAssets,
 meta:{width:192,height:256,idle:idleCount,attack:attackCount,staticPoses:3,femaleIdle:{...femaleIdle},getActiveFemaleIdle:()=>activeFemaleIdle?{...activeFemaleIdle}:null}
};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{preload();refresh()},{once:true});
else{preload();refresh();}
})();
/* SOULBOUND v0.41.1 — nonmodal reward floats.
 * Reads two consecutive authoritative Socket.IO room snapshots.
 * No random drop rolls, save mutations, or changes to combat outcomes.
 */
(()=>{
"use strict";
const finalStatuses=new Set(["victory","regionClear"]);
function integer(x){return Number.isFinite(Number(x))?Math.max(0,Math.floor(Number(x))):0}
function rewardFrom(previous,next,playerId){
 if(!previous||!next||!playerId||previous.code!==next.code||previous.stage!==next.stage
   ||previous.status!=="battle"||!finalStatuses.has(next.status)||!next.monster
   ||Number(next.monster.hp)>0)return null;
 const before=previous.players?.find(p=>p.id===playerId);
 const after=next.players?.find(p=>p.id===playerId);
 if(!before||!after)return null;
 const gold=Math.max(0,integer(after.gold)-integer(before.gold));
 let xp=integer(after.xp)-integer(before.xp);
 const beforeLevel=integer(before.level),afterLevel=integer(after.level);
 if(afterLevel<beforeLevel)return null;
 for(let level=beforeLevel;level<afterLevel;level++)xp+=level*100;
 xp=Math.max(0,xp);
 const had=new Set((before.inventory||[]).map(item=>String(item.uid||item.id||"")));
 const items=(after.inventory||[]).filter(item=>!had.has(String(item.uid||item.id||"")))
  .map(item=>({name:String(item.name||"Equipment").slice(0,100),rarity:String(item.rarity||"common").toLowerCase()}))
  .slice(0,40);
 const boss=!!(next.monster.boss||next.monster.miniBoss);
 return{stage:next.stage,gold,xp,items,boss};
}
let fadeTimer=null,host=null;
function draw(entry,status){
 if(typeof document==="undefined")return;
 // Since v0.48.1 a region-clear victory remains on the battle arena.
 // The city panel is hidden in that state, so rendering there silently hides rewards.
 const target=document.getElementById("arena");
 if(!target||!entry)return;
 if(host?.parentNode)host.remove();
 if(fadeTimer!==null){clearTimeout(fadeTimer);fadeTimer=null}
 host=document.createElement("div");host.className="v0411-rewards";
 host.id="v0411RewardFloats";host.setAttribute("role","status");host.setAttribute("aria-live","polite");
 const lines=[];
 if(entry.gold>0)lines.push({text:"🪙 +"+entry.gold.toLocaleString()+" GOLD",cls:"gold"});
 if(entry.xp>0)lines.push({text:"✦ +"+entry.xp.toLocaleString()+" EXP",cls:"xp"});
 for(const item of entry.items)lines.push({text:"◆ "+item.name,cls:["uncommon","rare","epic","legendary"].includes(item.rarity)?item.rarity:"item"});
 if(entry.boss&&!entry.items.length)lines.push({text:"No equipment drop this time",cls:"empty"});
 if(!lines.length){host=null;return}
 for(let i=0;i<lines.length;i++){
  const el=document.createElement("span");el.className="v0411-reward v0411-"+lines[i].cls;
  el.textContent=lines[i].text;el.style.setProperty("--v0411-delay",Math.min(i,4)*140+"ms");
  host.appendChild(el);
 }
 target.appendChild(host);
 fadeTimer=setTimeout(()=>{if(host?.parentNode)host.remove();host=null;fadeTimer=null},3300);
}
function show(previous,next,playerId){
 const reward=rewardFrom(previous,next,playerId);
 if(reward)draw(reward,next.status);
 return reward;
}
function reset(){
 if(fadeTimer!==null){clearTimeout(fadeTimer);fadeTimer=null}
 if(host?.parentNode)host.remove();host=null;
}
window.SoulboundRewardV411={rewardFrom,show,reset};
})();
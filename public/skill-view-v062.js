/* SOULBOUND: UI-only skill presentation. Numbers come exclusively from
 * server skillBook (combat/skills.js); never hardcode skill MP, damage or CD. */
(()=>{
 "use strict";
 const TYPES=["skill","skill2","skill3","skill4","skill5","skill6","skill7"];
 const byType=(player,type)=>Array.isArray(player?.skillBook)?player.skillBook.find(s=>s.type===type):null;
 const effectiveCost=(player,skill)=>{
  if(!skill)return Infinity;
  const base=Number(skill.cost);
  return Number.isFinite(base)?(player?.raceId==="elf"?Math.floor(base*.95):base):Infinity;
 };
 const tip=(player,sk)=>{
  const cost=effectiveCost(player,sk);
  const rows=[sk.name,
   "Base skill multiplier: "+sk.mult+"× ATK (before DEF and combat modifiers)",
   "Mana: "+cost+" MP",
   "Unlocks at Level "+sk.unlock+" · Cooldown: "+sk.cd+" rounds",
   "Element: "+String(sk.element||"physical").toUpperCase()+(sk.area?" · AREA":" · SINGLE TARGET")];
  if(sk.description)rows.push(sk.description);
  return rows.join("\n");
 };
 function render(player){
  for(const type of TYPES){
   const btn=document.querySelector('[data-action="'+type+'"]');
   if(!btn)continue;
   const sk=byType(player,type);
   btn.hidden=!sk||!player||Number(player.level)<Number(sk.unlock);
   btn.classList.toggle("v062-archer-skill",player?.classId==="archer");
   if(!sk){btn.textContent="SKILL UNAVAILABLE";btn.disabled=true;btn.dataset.tooltip="No skill data from server";btn.setAttribute("aria-label","Unavailable skill");continue;}
   const cd=Math.max(0,Math.floor(Number(player?.cooldowns?.[type])||0));
   btn.textContent=(sk.icon||"✦")+" "+sk.name+(cd>0?" · CD "+cd:"");
   btn.dataset.tooltip=tip(player,sk);
   btn.setAttribute("aria-label",sk.name+", Level "+sk.unlock+", "+effectiveCost(player,sk)+" MP"+(cd?", cooldown "+cd:""));
   btn.removeAttribute("title");
  }
 }
 window.SoulboundSkillViewV062={render,skill:byType,cost:effectiveCost,tip};
})();

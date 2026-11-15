"use strict";
/* SOULBOUND 0.62 — one canonical definition for the fourth playable class.
 * Class data stays server-authoritative. Client receives only a read-only
 * skill description snapshot. 0.65 introduces Sharpshooter/Beastmaster paths.
 */
const ID="archer";
const STARTER=Object.freeze({name:"Archer",hp:135,mp:55,atk:23,def:9,speed:12,weapon:"Oak Shortbow",armor:"Ranger Leathers"});
const SKILLS=Object.freeze({
 skill:Object.freeze({name:"QUICK SHOT",icon:"🏹",mult:1.7,cost:12,unlock:1,cd:2,element:"physical",area:false,
  description:"A fast single-target arrow."}),
 skill2:Object.freeze({name:"ARROW VOLLEY",icon:"🌧",mult:2.1,cost:25,unlock:3,cd:3,element:"physical",area:true,
  description:"Rain arrows on all living foes (secondary enemies receive AoE splash)."}),
 skill3:Object.freeze({name:"PINNING ARROW",icon:"🪢",mult:1.55,cost:20,unlock:5,cd:3,element:"nature",area:false,
  description:"Weaken the target's next attack."}),
 skill4:Object.freeze({name:"PIERCING SHOT",icon:"🎯",mult:2.9,cost:30,unlock:8,cd:4,element:"physical",area:false,
  description:"A high-power single-target shot."}),
 skill5:Object.freeze({name:"HUNTER'S MARK",icon:"🔍",mult:1.25,cost:24,unlock:5,cd:4,element:"nature",area:false,
  description:"Expose the target, increasing damage received by 20% for 3 enemy turns."}),
 skill6:Object.freeze({name:"RAIN OF ARROWS",icon:"🌿",mult:1.65,cost:22,unlock:7,cd:3,element:"nature",area:true,
  description:"Elemental Nature AoE: hit all living enemies."}),
 skill7:Object.freeze({name:"HEARTSEEKER",icon:"🦅",mult:2.15,cost:26,unlock:9,cd:3,element:"physical",area:false,
  description:"Precision finishing arrow: +12% damage when the target has under half HP, capped at 40."})
});
const TYPES=Object.freeze(Object.keys(SKILLS));
function definition(type){const entry=SKILLS[type];return entry?{...entry}:null}
function publicSkills(){return TYPES.map(type=>({type,...SKILLS[type]}))}
function crit({random=Math.random}={}){
 return random()<.12?{critical:true,multiplier:1.35}:{critical:false,multiplier:1};
}
function finisher(enemy,damage){
 if(!enemy||enemy.hp<=0||enemy.hp/Math.max(1,enemy.maxHp)>=.5)return 0;
 return Math.max(1,Math.min(40,Math.floor(Math.max(0,damage)*.12)));
}
module.exports={ID,STARTER,SKILLS,TYPES,definition,publicSkills,crit,finisher};

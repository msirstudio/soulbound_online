"use strict";
/* SOULBOUND v0.63 · server-authoritative high-speed physical/void striker. */
const ID="assassin";
const STARTER=Object.freeze({name:"Assassin",hp:120,mp:58,atk:26,def:7,speed:14,weapon:"Training Daggers",armor:"Rogue Tunic"});
const SKILLS=Object.freeze({
 skill:Object.freeze({name:"SHADOW CUT",icon:"🗡️",mult:1.8,cost:12,unlock:1,cd:2,element:"physical",area:false,description:"A quick single-target dagger strike."}),
 skill2:Object.freeze({name:"BLADE DANCE",icon:"🌀",mult:2.0,cost:25,unlock:3,cd:3,element:"physical",area:true,description:"Sweep a group of enemies with spinning daggers."}),
 skill3:Object.freeze({name:"CRIPPLING STRIKE",icon:"🕸️",mult:1.55,cost:20,unlock:5,cd:3,element:"physical",area:false,description:"Weaken the enemy's next attack."}),
 skill4:Object.freeze({name:"EXECUTION",icon:"🎯",mult:2.8,cost:30,unlock:8,cd:4,element:"physical",area:false,description:"Finish a wounded foe: small bonus below 40% HP, capped at 45."}),
 skill5:Object.freeze({name:"EXPOSE WEAKNESS",icon:"🔍",mult:1.15,cost:24,unlock:5,cd:4,element:"physical",area:false,description:"Expose target for 2 turns, increasing the damage it takes."}),
 skill6:Object.freeze({name:"SMOKE STEP",icon:"🌫️",mult:1.55,cost:22,unlock:7,cd:4,element:"void",area:false,description:"Deal Void damage and brace against the next enemy blows."}),
 skill7:Object.freeze({name:"NIGHTFALL",icon:"🌑",mult:2.35,cost:26,unlock:9,cd:4,element:"void",area:false,description:"A focused Void finisher. Does not hit the entire group."})
});
const TYPES=Object.freeze(Object.keys(SKILLS));
function definition(type){return SKILLS[type]?{...SKILLS[type]}:null}
function crit({random=Math.random}={}){return random()<.13?{critical:true,multiplier:1.3}:{critical:false,multiplier:1};}
function finisher(target,damage){
 if(!target||target.hp<=0||target.hp/Math.max(1,target.maxHp)>=.4)return 0;
 return Math.max(1,Math.min(45,Math.floor(Math.max(0,damage)*.12)));
}
module.exports={ID,STARTER,SKILLS,TYPES,definition,crit,finisher};

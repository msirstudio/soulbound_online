/* SOULBOUND v0.64 - one shared, class-independent hero identity catalogue.
   Browser: window.SoulboundCharactersV064; Node: require(...).
   This is identity/appearance metadata, NEVER combat stats. */
(function(){
"use strict";
const HEROES=Object.freeze([
 Object.freeze({id:"corin",name:"Corin",gender:"male",role:"The Analyst",trait:"Calm · Witty · Observant",story:"A measured traveler who reads people almost as well as maps. Corin quietly weighs every risk before the group commits.",portrait:"corin-portrait.webp",full:"corin-full.webp",hotspot:{x:0,y:8,w:19,h:70},hue:"#d2a178",shape:"polygon(8% 22%,25% 4%,58% 0,79% 21%,100% 48%,93% 97%,13% 100%,0 58%)"}),
 Object.freeze({id:"seris",name:"Seris",gender:"female",role:"The Researcher",trait:"Thoughtful · Gentle · Curious",story:"Seris is most comfortable with a book in her hands. She reads old histories and notices clues others ignore.",portrait:"seris-portrait.webp",full:"seris-full.webp",hotspot:{x:12,y:36,w:18,h:50},hue:"#8d9bdf",shape:"polygon(23% 8%,49% 0,81% 10%,93% 36%,99% 78%,71% 98%,0 100%,7% 42%)"}),
 Object.freeze({id:"lyra",name:"Lyra",gender:"female",role:"The New Adventurer",trait:"Brave · Determined · Kind",story:"A fearless newcomer who dreams of leaving her own mark on the Forgotten Kingdom. Kaiya is her protective older sister.",portrait:"lyra-portrait.webp",full:"lyra-full.webp",hotspot:{x:28,y:23,w:20,h:62},hue:"#f07f74",shape:"polygon(30% 2%,67% 0,100% 34%,96% 100%,0 100%,0 49%)"}),
 Object.freeze({id:"kaiya",name:"Kaiya",gender:"female",role:"The Big Sister",trait:"Bold · Charming · Protective",story:"Lyra's older sister. Kaiya fills any room with laughter but becomes fiercely protective whenever Lyra is in danger.",portrait:"kaiya-portrait.webp",full:"kaiya-full.webp",hotspot:{x:40,y:9,w:23,h:75},hue:"#ef9ba1",shape:"polygon(28% 1%,72% 0,94% 19%,100% 77%,87% 100%,3% 100%,0 29%)"}),
 Object.freeze({id:"aren",name:"Aren",gender:"male",role:"The Hothead",trait:"Energetic · Loyal · Brave",story:"Aren leaps into adventure before anyone has finished the plan. He is quick to laugh and quicker to defend a friend.",portrait:"aren-portrait.webp",full:"aren-full.webp",hotspot:{x:52,y:32,w:22,h:53},hue:"#f09069",shape:"polygon(34% 0,68% 2%,100% 30%,93% 100%,4% 100%,0 41%)"}),
 Object.freeze({id:"vera",name:"Vera",gender:"female",role:"The Defender",trait:"Strong · Blunt · Dependable",story:"Vera trusts hard work and honest deeds over lofty promises. Her crossed arms hide a fierce loyalty to the team.",portrait:"vera-portrait.webp",full:"vera-full.webp",hotspot:{x:69,y:12,w:19,h:68},hue:"#dfbcb8",shape:"polygon(22% 6%,59% 0,87% 20%,100% 35%,95% 100%,10% 100%,0 45%)"}),
 Object.freeze({id:"noct",name:"Noct",gender:"male",role:"The Watcher",trait:"Reserved · Sharp · Independent",story:"Noct often watches from above the crowd. Although he rarely joins the chatter, he misses nothing.",portrait:"noct-portrait.webp",full:"noct-full.webp",hotspot:{x:82,y:34,w:18,h:51},hue:"#ae78e8",shape:"polygon(16% 26%,43% 0,75% 0,100% 39%,89% 100%,0 100%,0 51%)"})
]);
const CLASS_META=Object.freeze([
 Object.freeze({id:"swordsman",icon:"⚔",name:"Swordsman",desc:"Balanced melee damage",detail:"Close-range fighter with durable, reliable attacks."}),
 Object.freeze({id:"mage",icon:"✧",name:"Mage",desc:"Elemental spellcaster",detail:"Deals magical damage with strong elemental spells."}),
 Object.freeze({id:"tank",icon:"⬟",name:"Tank",desc:"Party protector",detail:"Resists damage and draws enemy attention."}),
 Object.freeze({id:"archer",icon:"🏹",name:"Archer",desc:"Ranged precision",detail:"Ranged critical strikes and multi-target shots."}),
 Object.freeze({id:"assassin",icon:"🗡️",name:"Assassin",desc:"Critical and fast",detail:"Swift attacks, debuffs and focused finishing blows."}),
 Object.freeze({id:"priest",icon:"✦",name:"Priest",desc:"Healing and support",detail:"Restores allies, removes ailments and protects the party."})
]);
const byId=id=>HEROES.find(h=>h.id===id)||null;
const normalize=id=>byId(id)?.id||null;
const gender=id=>byId(id)?.gender||null;
const api=Object.freeze({HEROES,CLASS_META,byId,normalize,gender});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(typeof window!=="undefined")window.SoulboundCharactersV064=api;
})();

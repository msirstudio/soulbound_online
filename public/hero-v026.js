/* SOULBOUND v0.26 — original layered pixel-art heroes.
   160×240 crisp SVG, class/gender/weapon/armor compositing from trusted game state.
   Shapes use 4px-grid steps; visual equipment differences are not cosmetic-only recolors. */
(()=>{
"use strict";
const memo=new Map();
const skin="#e8b68a",shadowSkin="#b47a61",lightSkin="#ffe0b2",edge="#161b2c";
const rect=(x,y,w,h,fill,more="")=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+fill+'" '+more+'/>';
const poly=(pts,fill,stroke=edge,width=4)=>'<polygon points="'+pts+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linejoin="miter"/>';
function colors(armor,kind){
 const s=String(armor||"").toLowerCase();
 if(s.includes("dragon"))return{base:"#842c35",dark:"#492130",lite:"#e48954",trim:"#f4b862",gem:"#fa613b",cape:"#762836"};
 if(s.includes("void"))return{base:"#413267",dark:"#211c49",lite:"#9f8ed6",trim:"#a2d8e4",gem:"#9ae5ed",cape:"#2d2655"};
 if(s.includes("archmage")||s.includes("star"))return{base:"#395595",dark:"#192d63",lite:"#81acd2",trim:"#e9cc82",gem:"#81edff",cape:"#283e71"};
 if(s.includes("guardian"))return{base:"#5c7797",dark:"#2c435a",lite:"#afc8d9",trim:"#e6c782",gem:"#6fd6ec",cape:"#364b74"};
 if(s.includes("iron"))return{base:"#66737a",dark:"#3a4959",lite:"#b7c5c7",trim:"#b2a681",gem:"#86d6d7",cape:"#374155"};
 if(s.includes("sun")||s.includes("dawn"))return{base:"#ab783c",dark:"#5b3f2d",lite:"#f5d48d",trim:"#fff0be",gem:"#ffad5d",cape:"#743923"};
 if(s.includes("rift"))return{base:"#3e7d83",dark:"#1d454e",lite:"#a3ebe0",trim:"#efcc80",gem:"#bc8cff",cape:"#1f4963"};
 if(s.includes("robe")||s.includes("sage")||kind==="mage")return{base:"#534b93",dark:"#2f2a60",lite:"#9a92cb",trim:"#dfbf83",gem:"#91e9fd",cape:"#373064"};
 if(kind==="tank")return{base:"#567d93",dark:"#29445a",lite:"#9ebbc9",trim:"#e7c47c",gem:"#79dbf4",cape:"#335773"};
 return{base:"#385778",dark:"#28374d",lite:"#89a4b9",trim:"#e5bd73",gem:"#8de1ec",cape:"#3e3b61"};
}
function weaponMarkup(weapon,kind,c){
 const s=String(weapon||"").toLowerCase();
 const staff=s.includes("staff")||kind==="mage";
 const hammer=s.includes("maul")||s.includes("hammer")||s.includes("mace")||kind==="tank";
 const great=s.includes("great")||s.includes("knight");
 if(staff){
  const crystal=s.includes("crystal")||s.includes("star")||s.includes("rift")||s.includes("celestial");
  return '<g class="sb-weapon sb-staff">'+
  rect(132,44,8,168,"#342a3a")+rect(132,48,4,160,"#af7751")+rect(136,80,4,126,"#c18e59")+
  rect(128,35,16,8,c.trim)+rect(136,24,8,12,c.trim)+rect(124,44,8,8,c.trim)+
  poly(crystal?"136,8 152,24 144,48 128,36 124,24":"136,14 148,29 140,46 124,39 120,26",c.gem,c.trim,4)+
  rect(136,22,4,12,"#e6ffff")+rect(140,36,4,8,"#ecffff")+
  rect(130,68,12,8,c.trim)+rect(131,162,10,8,c.trim)+
  '</g>';
 }
 if(hammer){
  const heavy=s.includes("titan")||s.includes("warhammer")||s.includes("maul");
  return '<g class="sb-weapon sb-hammer">'+
    rect(130,47,8,165,"#302634")+rect(131,48,4,158,"#aa764e")+
    rect(110,23,48,31,c.dark)+rect(114,18,40,29,c.lite)+
    rect(112,24,8,22,c.trim)+rect(147,24,8,22,c.trim)+rect(122,22,24,6,"#ebecda")+
    rect(126,32,16,10,c.gem)+
    (heavy?rect(114,12,40,10,c.dark)+rect(118,8,32,8,c.trim):"")+
    rect(132,71,8,9,c.trim)+rect(132,160,8,8,c.trim)+'</g>';
 }
 return '<g class="sb-weapon sb-sword">'+
  rect(136,53,8,154,"#392e37")+rect(136,70,4,132,"#ba8957")+
  poly(great?"128,9 141,0 151,15 152,90 142,104 131,91":"133,23 142,9 149,24 148,92 140,102 132,90","#d8e9ee","#657387",4)+
  rect(139,great?12:29,4,68,"#fff5e2")+rect(131,84,22,8,c.trim)+
  rect(124,88,34,8,c.dark)+rect(135,95,12,12,c.trim)+rect(135,116,12,8,c.gem)+
  '</g>';
}
function make(p={}){
 const kind=["mage","tank"].includes(p.classId)?p.classId:"swordsman";
 const gender=p.gender==="female"?"female":"male";
 const armor=String(p.armor||""),weapon=String(p.weapon||"");
 const c=colors(armor,kind),hair=kind==="mage"?"#b4cfe0":gender==="female"?"#8d3f38":"#784b32";
 const armorPremium=/dragon|void|archmage|guardian plate|dawn|rift/i.test(armor);
 const robe=kind==="mage"||/robe|raiment|mantle/i.test(armor);
 const base='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="240" viewBox="0 0 160 240" shape-rendering="crispEdges">'+
  '<g class="sb-shadow"><ellipse cx="80" cy="228" rx="49" ry="9" fill="#0b1121" opacity=".52"/></g>'+
  '<g class="sb-cape">'+poly('45,87 114,86 124,183 135,210 100,219 85,187 53,220 23,207 38,159',c.cape,edge,5)+
  rect(44,109,7,92,c.lite,'opacity=".27"')+rect(114,117,6,81,c.dark)+
  (armorPremium?poly('43,155 54,183 42,202 29,206 32,190',c.trim,edge,3):"")+'</g>'+
  '<g class="sb-legs">'+
  rect(52,157,26,55,c.dark)+rect(82,157,26,55,c.dark)+
  rect(56,166,6,29,c.lite)+rect(89,166,6,27,c.lite)+
  rect(50,196,30,22,"#493a38")+rect(84,196,29,22,"#493a38")+
  rect(46,212,37,12,"#211f2a")+rect(83,212,37,12,"#211f2a")+
  rect(53,202,26,7,c.trim)+rect(86,202,24,7,c.trim)+
  rect(51,220,31,5,"#71655a")+rect(88,220,27,5,"#71655a")+
  '</g>';
 const garment=robe?
   '<g class="sb-robes">'+poly('52,100 106,100 122,204 39,204',c.base,edge,6)+
   poly('57,113 102,113 109,194 49,194',c.dark,c.dark,2)+
   rect(69,116,24,65,c.lite)+rect(73,120,16,57,c.base)+rect(58,186,52,9,c.trim)+
   rect(44,197,77,8,c.dark)+rect(65,144,33,6,c.trim)+
   '</g>':
   '<g class="sb-armor">'+poly('48,102 108,102 115,165 43,165',c.base,edge,6)+
   poly('58,106 97,106 100,155 53,155',c.lite,c.dark,4)+
   rect(57,119,45,7,c.dark)+rect(64,130,32,5,c.trim)+rect(57,145,44,8,c.base)+
   rect(44,154,72,12,c.dark)+rect(48,155,64,5,c.trim)+rect(78,151,9,15,c.gem)+
   (armorPremium?rect(60,109,36,6,"#fff0bc")+rect(60,143,36,5,c.trim):"")+
   '</g>';
 const arms='<g class="sb-arms">'+
  poly('49,107 41,110 28,143 27,160 40,168 52,152 59,123',c.base,edge,5)+
  rect(27,142,18,17,c.dark)+rect(29,147,13,7,c.trim)+
  poly('105,109 114,112 127,146 128,169 117,176 108,157 100,127',c.base,edge,5)+
  rect(113,144,20,16,c.dark)+rect(116,148,15,7,c.trim)+
  (kind==="tank"?poly('32,100 54,96 60,116 49,130 22,125',c.lite,edge,4)+poly('103,99 125,94 139,118 121,132 105,118',c.lite,edge,4):
  poly('32,108 51,103 55,116 43,129 25,120',c.lite,edge,4)+poly('105,106 124,106 135,118 122,127 105,120',c.lite,edge,4))+
  rect(29,161,13,12,"#a77b59")+rect(116,159,16,12,"#a77b59")+
  '</g>';
 const face=poly(gender==="female"?"62,51 98,51 108,64 105,91 92,105 68,103 55,91 57,64":"62,52 101,52 110,69 107,95 95,103 68,102 55,90 58,65",skin,edge,5)+
  rect(66,72,11,5,edge)+rect(92,72,11,5,edge)+rect(71,73,4,5,"#eff9ff")+rect(95,73,4,5,"#eff9ff")+
  rect(80,83,7,4,shadowSkin)+rect(75,94,16,4,shadowSkin)+rect(68,63,5,4,lightSkin)+
  (gender==="female"?rect(54,92,9,27,hair)+rect(103,90,9,35,hair):rect(55,89,8,12,hair));
 const hairMarkup=gender==="female"?
  poly('55,57 57,34 76,22 104,30 118,54 112,97 105,101 100,53 81,48 61,60',hair,edge,5)+
  rect(57,60,8,57,hair)+rect(106,55,8,68,hair)+rect(66,35,28,8,"#dfb28e")+
  rect(62,46,17,6,"#ad7766"):
  poly('56,56 52,39 60,32 69,24 77,28 87,20 97,28 109,32 115,48 102,57 101,45 88,44 79,51 70,43',hair,edge,5)+
  rect(56,44,10,21,hair)+rect(75,30,7,11,"#bd8661");
 const headgear=kind==="tank"?
  '<g class="sb-helm">'+poly('53,61 48,43 61,28 74,26 81,14 89,27 107,33 115,50 109,68 103,58 61,58',c.lite,edge,5)+
  rect(62,38,43,9,c.dark)+rect(77,25,10,26,c.trim)+rect(52,61,9,31,c.dark)+rect(104,61,8,30,c.dark)+
  rect(62,67,43,5,c.trim)+rect(79,17,6,10,c.gem)+'</g>':
  kind==="mage"?
  '<g class="sb-hood">'+poly('48,58 55,20 77,9 99,18 113,57 104,53 96,30 65,31 58,60',c.base,edge,5)+rect(72,20,28,8,c.trim)+rect(74,28,14,8,c.gem)+'</g>':
  '<g class="sb-band">'+rect(54,48,60,12,c.dark)+rect(65,50,34,6,c.trim)+rect(81,47,8,12,c.gem)+'</g>';
 const shield=kind==="tank"?'<g class="sb-shield">'+
  poly('19,127 48,129 54,167 39,193 14,169',c.lite,edge,5)+
  poly('25,135 44,137 47,165 37,183 21,163',c.base,c.dark,3)+
  rect(32,144,9,30,c.trim)+rect(23,153,24,8,c.trim)+
  '</g>':"";
 const details='<g class="sb-details">'+
  rect(74,158,15,9,c.trim)+rect(78,159,7,7,c.gem)+
  rect(50,126,7,21,c.dark)+rect(98,126,7,19,c.dark)+
  (armorPremium?rect(60,132,8,8,c.gem)+rect(93,132,6,8,c.gem):"")+
  '</g>';
 const svg=base+garment+arms+face+hairMarkup+headgear+details+shield+weaponMarkup(weapon,kind,c)+
  '<g opacity=".7" fill="#f1ede0">'+rect(51,118,4,4,"#fff0c9")+rect(109,116,4,4,"#fff0c9")+'</g></svg>';
 return svg;
}
function url(p){
 const key=[p.classId,p.gender,p.armor,p.weapon].join("|");
 if(memo.has(key))return memo.get(key);
 const value="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(make(p));
 if(memo.size>200)memo.clear();
 memo.set(key,value);
 return value;
}

const iconCache=new Map();
function itemIcon(name,slot="weapon"){
 const key=String(name||"")+"|"+slot;if(iconCache.has(key))return iconCache.get(key);
 const n=String(name||"").toLowerCase(),t=colors(name,"swordsman");
 const glow=n.includes("crystal")||n.includes("star")||n.includes("void")||n.includes("tide")?"#83ddf0":
  n.includes("ember")||n.includes("dragon")?"#f3945c":"#ead6a3";
 const base='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" shape-rendering="crispEdges"><rect width="48" height="48" rx="5" fill="#171b2b"/><rect x="2" y="2" width="44" height="44" fill="#252533" stroke="#bd975b" stroke-width="2"/>';
 let art="";
 if(slot==="armor"){
  art='<path d="M12 11l10-5 10 5 9 4-4 12-6-3v16H16V24l-7 3-4-12z" fill="'+t.base+'" stroke="#0e1b2b" stroke-width="3"/>'+
  '<path d="M18 14h13v17H18z" fill="'+t.lite+'"/><path d="M20 17h9v6h-9z" fill="'+t.dark+'"/>'+
  '<path d="M19 31h11v3H19z" fill="'+t.trim+'"/><path d="M8 17l6-3m22 0 6 3" stroke="'+t.trim+'" stroke-width="3"/>';
 }else if(n.includes("staff")||n.includes("tide")){
  art='<path d="M19 40L30 13" stroke="#a57a55" stroke-width="6"/><path d="M16 41l12-29" stroke="#d09f63" stroke-width="2"/>'+
  '<path d="M32 5l9 7-5 10-10-3-2-8z" fill="'+glow+'" stroke="#f4e4c8" stroke-width="2"/>'+
  '<path d="M32 8v9m-4-4h9" stroke="#f8ffff" stroke-width="2"/>';
 }else if(n.includes("hammer")||n.includes("mace")||n.includes("maul")){
  art='<path d="M12 38l20-26" stroke="#916546" stroke-width="6"/><path d="M8 13l12-10 15 12-12 12z" fill="'+t.lite+'" stroke="'+t.dark+'" stroke-width="3"/>'+
  '<path d="M13 15l10-8 6 8-8 8z" fill="'+t.trim+'"/>';
 }else{
  art='<path d="M11 39l21-26" stroke="#ad8055" stroke-width="6"/><path d="M20 23L37 4l7 4-3 9-18 17z" fill="#d6e9e8" stroke="#46576a" stroke-width="2"/>'+
  '<path d="M25 26l14-14" stroke="#fff9e8" stroke-width="3"/><path d="M16 27l12 9" stroke="'+t.trim+'" stroke-width="5"/>'+
  '<path d="M14 38l-5 3" stroke="#c9aa74" stroke-width="3"/>';
 }
 const data="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(base+art+"</svg>");
 if(iconCache.size>150)iconCache.clear();iconCache.set(key,data);return data;
}
window.SoulboundSprite={url,svg:make,itemIcon};
})();

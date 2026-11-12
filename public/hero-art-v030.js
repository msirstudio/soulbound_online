/* SOULBOUND v0.30 · Original layered pixel-fantasy hero illustrations.
   Client-side SVG graphics use crisp pixels and distinct male/female silhouettes.
   This is intentionally NOT the ImageGen mockup; it is functional in-game artwork.
   Every armor and weapon comes from the current server state. */
(()=>{
 "use strict";
 const E=s=>String(s??"").replace(/[<>&"']/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&#39;"}[c]));
 function art(p={}){
  const cls=["mage","tank"].includes(p.classId)?p.classId:"swordsman";
  const gender=p.gender==="female"?"female":"male";
  const armor=String(p.armor||"").toLowerCase(),weapon=String(p.weapon||"").toLowerCase();
  let main=cls==="mage"?"#5145a2":cls==="tank"?"#5a748e":"#a23746";
  let shadow=cls==="mage"?"#302c65":cls==="tank"?"#354354":"#622d38";
  let accent=cls==="mage"?"#71b8f8":cls==="tank"?"#f4cf84":"#ffcb76";
  let cloak=cls==="mage"?"#2d2658":cls==="tank"?"#35445d":"#8f2d3b";
  if(/dragon/.test(armor)){main="#9e3838";shadow="#591f31";accent="#f4b463";cloak="#51213b"}
  else if(/void/.test(armor)){main="#44346e";shadow="#1d173b";accent="#ad75ef";cloak="#1c1643"}
  else if(/guardian|steel|iron|plate/.test(armor)){main="#627e9a";shadow="#394a61";accent="#eac88e";cloak="#263a56"}
  else if(/archmage|sage|raiment/.test(armor)){main="#533ca8";shadow="#30245e";accent="#80d1ef";cloak="#30275a"}
  const square=(x,y,w,h,fill,extra="")=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  const skin=gender==="female"?"#ecc49e":"#d6a079";
  const hair=cls==="mage"?"#d5b7ed":cls==="tank"?"#c7a071":gender==="female"?"#e4c18b":"#413344";
  const hairShade=cls==="mage"?"#795fac":cls==="tank"?"#8d653e":gender==="female"?"#997a5e":"#272435";
  const outline="#1b1e32";
  const stars=`<g opacity=".8">${square(29,18,3,3,accent)}${square(123,37,2,2,accent)}${square(21,91,3,3,accent)}</g>`;
  const legs=`<g stroke="${outline}" stroke-width="3">
   <path d="M51 138H72L70 173H48Z" fill="${shadow}"/><path d="M79 138H101L105 173H82Z" fill="${shadow}"/>
   <path d="M44 170H72L69 192H38V181Z" fill="#30283b"/><path d="M82 170H107L115 192H80Z" fill="#30283b"/>
   </g>`+
   square(50,171,17,6,accent)+square(87,171,15,6,accent)+square(40,186,30,4,"#6e5b65")+square(84,186,28,4,"#6e5b65");
  const cape=`<path d="M53 82Q34 85 28 103L20 177L46 169L59 143Z" fill="${cloak}" stroke="${outline}" stroke-width="5"/>
  <path d="M44 93L32 164L48 154" fill="none" stroke="${accent}" stroke-width="4" opacity=".65"/>`;
  const skirt=cls==="mage"?`<path d="M43 126L35 167L113 168L103 125Z" fill="${main}" stroke="${outline}" stroke-width="4"/>${square(47,145,53,6,accent)}${square(69,135,7,31,shadow)}`:"";
  const torso=`<path d="M51 80L92 80L111 143L41 143Z" fill="${main}" stroke="${outline}" stroke-width="6"/>
   <path d="M63 83H83L87 132L56 132Z" fill="${shadow}" stroke="${accent}" stroke-width="3"/>
   <path d="M56 92L78 114L95 90" fill="none" stroke="${accent}" stroke-width="5"/>
   ${square(39,134,75,10,"#30273a")}${square(61,135,34,7,accent)}
   <path d="M53 86L38 95L29 124L39 131L57 104ZM94 86L111 96L118 127L105 135L85 105Z" fill="${main}" stroke="${outline}" stroke-width="5"/>
   <path d="M39 100L29 126M108 100L116 126" stroke="${accent}" stroke-width="3"/>
   ${square(27,121,17,12,"#b5b6c6")}${square(107,124,14,12,"#b5b6c6")}
   ${square(33,93,22,12,accent)}${square(95,93,18,12,accent)}`;
  const face=`<path d="M50 36L94 36L100 71L92 86L56 86L45 71Z" fill="${skin}" stroke="${outline}" stroke-width="4"/>
   ${square(55,61,8,5,"#252b41")}${square(83,61,8,5,"#252b41")}${square(57,62,2,2,"#fff")}${square(85,62,2,2,"#fff")}
   ${square(70,72,9,3,"#ae665f")}${square(49,59,5,10,"#ad7960")}`;
  const coiffure=gender==="female"
  ?`<path d="M43 33L52 18L92 18L102 35L110 104L95 116L89 84L97 42L76 35L54 43L48 108L31 102L33 51Z" fill="${hair}" stroke="${outline}" stroke-width="5"/>
    <path d="M51 30L91 24L95 43L66 38L53 55L46 45Z" fill="${hairShade}"/>${square(40,96,12,15,hairShade)}${square(99,96,10,14,hairShade)}`
  :`<path d="M39 47L44 26L56 20L69 13L78 21L93 17L106 37L99 55L92 43L77 35L62 44L48 52Z" fill="${hair}" stroke="${outline}" stroke-width="5"/>
    <path d="M51 34L68 26L76 33L92 29" stroke="${hairShade}" stroke-width="5" fill="none"/>`;
  const helmet=cls==="tank"||/guardian|iron|steel|plate/.test(armor)
   ?`<path d="M41 53L43 30L66 20L91 27L104 49L99 65L92 52L59 49L51 65Z" fill="#778b9e" stroke="${outline}" stroke-width="5"/>
     ${square(54,34,42,6,"#b8cada")}${square(69,24,9,31,accent)}`:cls==="mage"
   ?`<path d="M39 45L70 1L108 46Z" fill="${shadow}" stroke="${outline}" stroke-width="5"/><path d="M48 41L73 13L93 39" fill="none" stroke="${accent}" stroke-width="4"/>${square(41,44,68,9,main)}`:"";
  let weaponArt;
  if(/staff|wand/.test(weapon)||cls==="mage"){
   weaponArt=`<g transform="translate(10,-7)"><path d="M112 72L131 187" stroke="${outline}" stroke-width="13"/><path d="M112 72L131 187" stroke="#90643d" stroke-width="7"/>
   <path d="M113 27L134 40L135 66L115 77L98 63L97 44Z" fill="#55badf" stroke="#d7f3ff" stroke-width="5"/>
   <path d="M112 34L126 48L115 63L103 47Z" fill="#c8fbff"/>${square(121,80,13,7,accent)}${square(124,133,13,5,accent)}</g>`;
  }else if(/mace|hammer|maul/.test(weapon)||cls==="tank"){
   weaponArt=`<g transform="rotate(-7 110 90)"><path d="M115 62L129 185" stroke="${outline}" stroke-width="13"/><path d="M115 62L129 185" stroke="#866340" stroke-width="7"/>
   <path d="M96 32H143V73H96Z" fill="#9eafc3" stroke="${outline}" stroke-width="6"/>
   ${square(101,36,38,7,"#ecdaae")}${square(101,63,38,6,accent)}${square(112,44,14,18,shadow)}</g>`;
  }else{
   weaponArt=`<g transform="rotate(-8 110 95)"><path d="M112 76L117 184" stroke="${outline}" stroke-width="12"/>
    <path d="M112 76L117 184" stroke="#85573c" stroke-width="6"/>
    <path d="M101 19L119 9L137 82L111 102L92 80Z" fill="#bfcbdc" stroke="${outline}" stroke-width="5"/>
    <path d="M111 30L120 78L107 85" stroke="#f8fcff" stroke-width="6" fill="none"/>
    <path d="M90 88L138 83" stroke="${accent}" stroke-width="10"/></g>`;
  }
  const shield=cls==="tank"?`<g><path d="M29 99L52 93L57 119L49 151L23 136Z" stroke="${outline}" stroke-width="6" fill="#97afc4"/>
   <path d="M29 110L49 106L46 133L31 130Z" fill="${main}"/><path d="M38 108V139" stroke="${accent}" stroke-width="5"/></g>`:"";
  const gown=gender==="female"?`<path d="M53 76L79 76" stroke="${accent}" stroke-width="4"/>`:"";
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 155 208" shape-rendering="crispEdges" aria-label="${E(gender)} ${E(cls)} fantasy hero">
    <ellipse cx="77" cy="198" rx="48" ry="6" fill="#080d1b" opacity=".48"/>
    ${stars}${cape}${legs}${skirt}${torso}${gown}${face}${coiffure}${helmet}${shield}${weaponArt}
    <path d="M58 92L65 92M85 92L92 92" stroke="#fff4b7" stroke-width="3" opacity=".75"/>
   </svg>`;
  return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
 }
 const initial={swordsman:{weapon:"Training Sword",armor:"Traveler Armor"},mage:{weapon:"Apprentice Staff",armor:"Novice Robe"},tank:{weapon:"Guardian Mace",armor:"Guardian Armor"}};
 function preview(cls="swordsman",gender="male"){return art({classId:cls,gender,...(initial[cls]||initial.swordsman)})}
 window.SoulboundHeroArt={render:art,preview};
})();

/* SOULBOUND v0.38 — Thai + English interface.
   Translation affects presentation only. Socket events, item IDs, stats, save payloads,
   user input and authoritative combat rules remain English and unchanged. */
(()=>{
"use strict";
const KEY="soulbound_ui_language_v038";
const phrases={
 "THE FORGOTTEN KINGDOM":"อาณาจักรที่ถูกลืม",
 "AN ONLINE MEDIEVAL FANTASY RPG":"เกม RPG แฟนตาซีออนไลน์",
 "HERO ACCOUNT":"บัญชีตัวละคร",
 "Sign in to sync across devices, or play instantly as a guest.":"เข้าสู่ระบบเพื่อเล่นต่อได้หลายอุปกรณ์ หรือทดลองเล่นแบบ Guest",
 "PLAY AS GUEST · NO ACCOUNT":"เล่นแบบ Guest · ไม่ต้องสมัคร",
 "Guest save is stored in this browser only.":"เซฟ Guest เก็บไว้ในเบราว์เซอร์นี้เท่านั้น",
 "EMAIL":"อีเมล","PASSWORD":"รหัสผ่าน",
 "CREATE ACCOUNT":"สมัครบัญชี","SIGN IN":"เข้าสู่ระบบ","SIGN OUT":"ออกจากระบบ",
 "CHOOSE YOUR HERO":"เลือกตัวละครของคุณ","HERO NAME":"ชื่อตัวละคร",
 "CREATE HERO":"สร้างตัวละคร","CONTINUE":"เล่นต่อ","NEW GAME":"เริ่มเกมใหม่",
 "CONTINUE GAME":"เล่นต่อ","CREATE PARTY":"สร้าง Party","JOIN PARTY":"เข้าร่วม Party",
 "JOIN ROOM":"เข้าห้อง","CREATE ROOM":"สร้างห้อง","PARTY CODE":"รหัส Party",
 "COPY INVITE":"คัดลอกคำเชิญ","MAIN MENU":"เมนูหลัก",
 "START ADVENTURE":"เริ่มผจญภัย","NEXT STAGE →":"ไปด่านต่อไป →",
 "VISIT MERCHANT 🛒":"เข้าร้านค้า 🛒","LEAVE SHOP · NEXT STAGE →":"ออกจากร้าน · ไปด่านต่อ →",
 "RESTART CAMPAIGN":"เริ่มการผจญภัยใหม่",
 "CHARACTER STATUS":"สถานะตัวละคร","CHARACTER ATTRIBUTES":"ค่าสเตตัสตัวละคร",
 "BATTLE SKILLS":"สกิลต่อสู้","QUICK POTIONS":"ยาใช้งานด่วน",
 "EQUIPMENT · LOADOUT":"อุปกรณ์ที่สวมใส่","HERO INVENTORY":"กระเป๋าตัวละคร",
 "PARTY MEMBERS":"สมาชิก Party","PARTY CHAT":"แชท Party","BATTLE LOG":"บันทึกการต่อสู้",
 "EXPERIENCE":"EXP","RACE POINTS":"แต้มเผ่าพันธุ์","ANCESTRY":"เผ่าพันธุ์",
 "AVAILABLE POINTS:":"แต้มสเตตัสที่เหลือ:",
 "SKILL":"สกิล","ATTACK":"โจมตี","GUARD":"ป้องกัน",
 "YOUR PARTY":"Party ของคุณ","YOUR TURN — choose an action!":"เทิร์นของคุณ — เลือกคำสั่ง!",
 "Waiting for party leader to start.":"รอหัวหน้า Party เริ่มเกม",
 "Waiting for party leader...":"รอหัวหน้า Party...",
 "VICTORY! Prepare for the next stage.":"ชนะแล้ว! เตรียมพร้อมสำหรับด่านต่อไป",
 "DEFEAT":"พ่ายแพ้","VICTORY":"ชนะแล้ว",
 "HEALTH":"HP","MANA":"MP","❤️ HEALTH":"❤️ HP","🔷 MANA":"🔷 MP","WEAPON":"อาวุธ","ARMOR":"เกราะ",
 "EQUIPMENT & BAG":"อุปกรณ์ & กระเป๋า","EQUIPMENT & INVENTORY":"อุปกรณ์ & กระเป๋า",
 "ADVENTURE INDEX":"สารานุกรมผจญภัย",
 "THE FORGOTTEN KINGDOM · FIELD ARCHIVE":"อาณาจักรที่ถูกลืม · หอจดหมายเหตุ",
 "Monsters · Bosses · Equipment · Supplies · The World":"มอนสเตอร์ · Boss · อุปกรณ์ · ไอเทม · โลก",
 "BOSSES":"Boss","MONSTERS":"มอนสเตอร์","WEAPONS":"อาวุธ",
 "ACCESSORIES":"เครื่องประดับ","FOOD":"อาหาร","POTIONS":"ยา",
 "WORLD":"โลก","BOSS":"Boss","MONSTER":"มอนสเตอร์",
 "RARITY":"ระดับความหายาก","All rarities":"ทุกระดับ",
 "Common":"Common","Uncommon":"Uncommon","Rare":"Rare","Epic":"Epic","Legendary":"Legendary",
 "LOADING...":"กำลังโหลด...","Loading...":"กำลังโหลด...",
 "Loading game records...":"กำลังโหลดข้อมูลเกม...",
 "Select an entry to see its stats and origin.":"เลือกข้อมูลเพื่อดูค่าสเตตัสและแหล่งที่มา",
 "Choose an entry to view details.":"เลือกข้อมูลเพื่อดูรายละเอียด",
 "No entries match your filters.":"ไม่พบข้อมูลที่ตรงกับการค้นหา",
 "CLOSE INDEX":"ปิดสารานุกรม","CLOSE":"ปิด",
 "ITEM TYPE":"ประเภทไอเทม","ACQUIRED FROM":"ได้รับจาก","DROPPED BY":"ดรอปจาก",
 "DROP CHANCE":"โอกาสดรอป","MERCHANT PRICE":"ราคาในร้านค้า",
 "DESCRIPTION":"รายละเอียด","REWARDS":"รางวัล","LOCATION":"พื้นที่",
 "EXCLUSIVE BOSS DROPS":"ไอเทมเฉพาะของ Boss",
 "FIELD NOTES":"ข้อมูลจากสารานุกรม",
 "All boss items":"ไอเทม Boss ทั้งหมด",
 "STAGE":"ด่าน","STAGES":"ด่าน","RECORDS":"รายการ",
 "MERCHANT":"ร้านค้า","DROP":"ดรอป","SOURCE":"แหล่งที่มา",
 "VIEW BOSS":"ดูข้อมูล Boss",
 "9 gear slots enabled":"ใช้งานช่องอุปกรณ์ครบ 9 ช่อง",
 "HELMET":"หมวก","CHEST ARMOR":"เกราะอก","PANTS":"กางเกง",
 "BOOTS":"รองเท้า","MAIN WEAPON":"อาวุธหลัก","OFF-HAND":"อาวุธรอง",
 "NECKLACE":"สร้อยคอ","LEFT RING":"แหวนซ้าย","RIGHT RING":"แหวนขวา",
 "ARMOR":"เกราะ","WEAPONS & ACCESSORIES":"อาวุธและเครื่องประดับ",
 "EQUIPMENT · DRAG GEAR INTO A SLOT":"อุปกรณ์ · ลากไอเทมใส่ช่อง",
 "INVENTORY":"กระเป๋า","EMPTY":"ว่าง","WORN":"สวมอยู่",
 "GEAR ITEMS":"อุปกรณ์","BAG SLOTS":"ช่องกระเป๋า","GOLD":"Gold",
 "DRAG GEAR INTO A SLOT":"ลากไอเทมไปใส่ช่อง",
 "Drag an item onto a matching slot, or select an item and then click its slot.":"ลากไอเทมไปช่องที่ตรงกัน หรือคลิกไอเทมแล้วเลือกช่อง",
 "Drag gear to a matching slot, or tap an item and then a slot.":"ลากไอเทมไปใส่ช่อง หรือแตะไอเทมแล้วเลือกช่อง",
 "Gear may only be changed between battles.":"เปลี่ยนอุปกรณ์ได้เฉพาะนอกการต่อสู้",
 "Equipment can only be changed between battles.":"เปลี่ยนอุปกรณ์ได้เฉพาะนอกการต่อสู้",
 "CLOSE INDEX":"ปิดสารานุกรม","CLOSE":"ปิด",
 "DISCARD SELECTED":"ทิ้งไอเทมที่เลือก",
 "SMALL":"เล็ก","MEDIUM":"กลาง","LARGE":"ใหญ่",
 "ATTACK +":"ATK +","DEFENSE +":"DEF +",
 "YOU":"คุณ","WAITING":"รอเริ่ม",
 "SEND":"ส่ง","SHOP":"ร้านค้า",
 "TRAVELING MERCHANT":"พ่อค้าเดินทาง",
 "Spend gold on supplies, gear and camp food.":"ใช้ Gold ซื้ออุปกรณ์ ยา และอาหาร",
 "CAMP FOOD · ACTIVE BUFFS":"อาหารแคมป์ · บัฟที่ใช้งาน",
 "COMMON":"COMMON","UNCOMMON":"UNCOMMON","RARE":"RARE",
 "EPIC":"EPIC","LEGENDARY":"LEGENDARY",
 "HUMAN":"มนุษย์","Human":"มนุษย์",
 "SUMMON RACE · 1 PT":"สุ่มเผ่า · 1 แต้ม",
 "UNKNOWN":"ยังไม่ทราบ","SKIP ANIMATION":"ข้ามแอนิเมชัน",
 "CLAIM & CLOSE":"รับรางวัลแล้วปิด",
 "No extra gear yet.":"ยังไม่มีอุปกรณ์เพิ่มเติม",
 "Your inventory is empty. Weapons and armor purchased from the merchant will appear here.":"กระเป๋าว่าง อุปกรณ์ที่ซื้อหรือดรอปจะปรากฏที่นี่",
 "No random equipment drops":"ไม่มีอุปกรณ์สุ่มดรอป",
 "Choose specialization":"เลือกสายอาชีพ",
 "CHOOSE SPECIALIZATION":"เลือกสายอาชีพ",
 "VIEW EQUIPMENT":"ดูอุปกรณ์",
 "SAVE":"บันทึก","CANCEL":"ยกเลิก",
 "SWORDS MAN":"นักดาบ",
 "SWORDSMAN":"นักดาบ","MAGE":"จอมเวท","TANK":"แทงก์",
 "A NEW WORLD AWAITS":"โลกใบใหม่รอคุณอยู่",
 "Gather your party. Explore eight regions. Defeat the sovereigns and reclaim the realm.":"รวมทีม ออกเดินทางทั่ว 8 เขต และปราบเหล่าผู้ปกครองเพื่อกอบกู้อาณาจักร",
 "BEGIN YOUR LEGEND":"เริ่มต้นตำนานของคุณ",
 "▶ PLAY / CONTINUE":"▶ เล่นเกม / เล่นต่อ",
 "✧ HERO & PARTY":"✧ ตัวละครและปาร์ตี้",
 "♜ ACCOUNT":"♜ บัญชีผู้เล่น",
 "⚙ SETTINGS":"⚙ ตั้งค่า",
 "♫ MUSIC · TOGGLE":"♫ เปิด / ปิดเพลง",
 "🔊 SFX · TOGGLE":"🔊 เปิด / ปิดเสียงเอฟเฟกต์",
 "01 / ACCOUNT":"01 / บัญชีผู้เล่น",
 "02 / HERO & PARTY":"02 / ตัวละครและปาร์ตี้",
 "← MAIN MENU":"← เมนูหลัก",
 "Prepare your character, select the save mode and gather your party.":"เตรียมตัวละคร เลือกเซฟ และรวมทีมกับเพื่อนก่อนออกผจญภัย",
 "Your character and boss clears are saved using your selected account or Guest save.":"เลเวล อุปกรณ์ และการปราบบอสจะบันทึกตามบัญชีหรือ Guest ที่เลือก",
 "PARTY MEMBERS":"สมาชิกปาร์ตี้",
 "☏ CHAT":"☏ แชต",
 "▤ LOG":"▤ บันทึก",
 "♟ PARTY":"♟ ปาร์ตี้",
 "✕ CLOSE":"✕ ปิด",
 "Customize the game without leaving your character.":"ปรับแต่งการตั้งค่าโดยไม่ต้องออกจากตัวละคร",
 "More sound controls are available in the game toolbar.":"ตั้งค่าเสียงเพิ่มเติมได้ที่แถบเครื่องมือระหว่างเล่น",
 "8 REGIONS":"8 พื้นที่",
 "40 STAGES":"40 ด่าน",
 "4-PLAYER ONLINE":"เล่นออนไลน์ 4 คน",
 "ONLINE RPG":"เกม RPG ออนไลน์",
 "WORLD ATLAS":"แผนที่โลก",
 "WORLD MAP · เลือกแมพ":"แผนที่โลก · เลือกพื้นที่",
 "THE FORGOTTEN CAPITAL":"นครหลวงที่ถูกลืม",
 "CENTRAL CITY":"เมืองศูนย์กลาง",
 "🏰 CITY / WORLD":"🏰 เมือง / แผนที่",
 "🏰 BACK TO CITY":"🏰 กลับเมือง",
 "🏰 RETURN TO CITY":"🏰 กลับเมือง",
 "🏪 MERCHANT":"🏪 ร้านค้า",
 "⚔ EQUIPMENT & BAG":"⚔ อุปกรณ์และกระเป๋า",
 "REGION CLEARED ✦":"ผ่านพื้นที่แล้ว ✦",
 "THE PARTY HAS FALLEN":"ทีมพ่ายแพ้",
 "MERCHANT DISTRICT":"ย่านร้านค้า",
 "RECOMMENDED":"เลเวลแนะนำ",
 "ENTRY MINIMUM":"เลเวลขั้นต่ำ",
 "BOSS DEFEATS":"จำนวนครั้งที่ปราบบอส",
 "REPLAY THIS MAP":"เล่นแมพนี้อีกครั้ง",
 "ENTER REGION":"เข้าสู่พื้นที่",
 "TRAVELING...":"กำลังเดินทาง...",
 "Only the party leader can start travel.":"หัวหน้า Party เท่านั้นที่เลือกเดินทางได้",
 "Return to the city after battle to travel.":"กลับเมืองหลังจบการต่อสู้ก่อนเปลี่ยนพื้นที่",
 "STAGE 1 / 40":"ด่าน 1 / 40",
 "WORLD":"โลก",
 "Party leader selects a region. Each member keeps personal rewards.":"หัวหน้า Party เลือกพื้นที่ สมาชิกแต่ละคนได้รับรางวัลของตัวเอง",
 "Rest at the town, prepare your party, and choose a region to explore.":"พักในเมือง เตรียมสมาชิก และเลือกพื้นที่ออกสำรวจ",
 "Gather the party, prepare your hero, and inspect the world map before departing.":"รวม Party เตรียมตัวละคร และดูแผนที่โลกก่อนออกเดินทาง",
 "The main boss is defeated. Your clear and loot are saved. Replay the map or visit another region.":"ชนะบอสหลักแล้ว บันทึกความคืบหน้าและไอเทมไว้แล้ว สามารถฟาร์มซ้ำหรือไปแมพอื่นได้",
 "Your hero keeps level, gold and equipment. Return to the city, then retry the dungeon.":"ยังคงเลเวล เงิน และอุปกรณ์เดิม กลับเมืองแล้วเริ่มดันเจี้ยนใหม่ได้",
 "Supplies, equipment and food for the next adventure.":"เตรียมยา อุปกรณ์ และอาหารสำหรับการผจญภัยรอบต่อไป",
 "Select a map pin to inspect the area. The leader may start a run if every party member meets the minimum level.":"เลือกหมุดบนแผนที่เพื่อดูรายละเอียด หัวหน้า Party จะพาเข้าพื้นที่ได้เมื่อสมาชิกทุกคนถึงเลเวลขั้นต่ำ."
};
const pattern=[
 [/^STAGE\s+(\d+)(\s*\/\s*\d+)?$/i,(_,n,rest)=>"ด่าน "+n+(rest||"")],
 [/^LEVEL\s+(\d+)$/i,(_,n)=>"เลเวล "+n],
 [/^AVAILABLE POINTS:\s*(\d+)$/i,(_,n)=>"แต้มสเตตัสที่เหลือ: "+n],
 [/^(\d+)\s+RECORDS$/i,(_,n)=>n+" รายการ"],
 [/^(\d+)\s+GEAR ITEMS$/i,(_,n)=>"อุปกรณ์ "+n+" ชิ้น"],
 [/^(\d+)\s*\/\s*40\s*BAG SLOTS$/i,(_,n)=>n+" / 40 ช่องกระเป๋า"],
 [/^DROP\s+(\d+)%$/i,(_,n)=>"โอกาสดรอป "+n+"%"],
 [/^No-drop chance:\s*(\d+)%\.?$/i,(_,n)=>"โอกาสไม่ได้ไอเทม: "+n+"%"],
 [/^STAGES\s+(\d+\s*[–-]\s*\d+)$/i,(_,n)=>"ด่าน "+n],
 [/^(\d+)\s*GOLD$/i,(_,n)=>n+" Gold"],
 [/^You need (\d+) Race Points?\.?$/i,(_,n)=>"ต้องใช้ "+n+" แต้มเผ่าพันธุ์"],
 [/^Wait for your turn\.?$/i,()=>"กรุณารอเทิร์นของคุณ"],
 [/^Your inventory is empty\.?$/i,()=>"กระเป๋าของคุณว่าง"],
 [/^Regular encounters do not drop equipment\.?$/i,()=>"มอนสเตอร์ปกติไม่ดรอปอุปกรณ์"],
 [/^Each party member rolls independently\.?$/i,()=>"สมาชิก Party แต่ละคนสุ่มไอเทมแยกกัน"],
 [/^Select an item from the inventory first\.?$/i,()=>"กรุณาเลือกไอเทมในกระเป๋าก่อน"],
 [/^This slot is already empty\.?$/i,()=>"ช่องนี้ว่างอยู่แล้ว"],
 [/^Gear can only be changed before or between battles\.?$/i,()=>"เปลี่ยนอุปกรณ์ได้เฉพาะนอกการต่อสู้"],
 [/^Viewing gear during battle.*$/i,()=>"กำลังดูอุปกรณ์ระหว่างต่อสู้ · เปลี่ยนไม่ได้"],
 [/^Selected (.+?)\. Click a matching slot to equip\.$/i,(_,it)=>"เลือก "+it+" แล้ว คลิกช่องที่ตรงกันเพื่อสวม"],
 [/^(.+?) equipped successfully\.$/i,(_,it)=>"สวม "+it+" สำเร็จ"],
 [/^(.+?) discarded\.$/i,(_,it)=>"ทิ้ง "+it+" แล้ว"],
 [/^(.+?) received ([A-Z]+) boss loot: (.+?)!$/i,(_,hero,rarity,item)=>hero+" ได้รับไอเทมจาก Boss ระดับ "+rarity+": "+item+"!"],
 [/^(.+?) is revived after the victory with 30% HP and 20% MP\.$/i,(_,hero)=>hero+" ถูกชุบชีวิตหลังชนะด้วย HP 30% และ MP 20%"],
 [/^(.+?) earned 1 Race Point for defeating a boss!$/i,(_,hero)=>hero+" ได้รับ 1 แต้มเผ่าพันธุ์จากการชนะ Boss!"],
 [/^Victory! (.+?) defeated\. \+(\d+) EXP · \+(\d+) GOLD\.$/i,(_,boss,xp,gold)=>"ชนะแล้ว! ปราบ "+boss+" สำเร็จ ได้รับ +"+xp+" EXP · +"+gold+" Gold"],
 [/^(.+?) attacks for (\d+) damage\.$/i,(_,hero,n)=>hero+" โจมตีสร้างความเสียหาย "+n],
 [/^(.+?) strikes (.+?) for (\d+) damage\.$/i,(_,monster,hero,n)=>monster+" โจมตี "+hero+" สร้างความเสียหาย "+n],
 [/^(.+?) equipped (.+?)\.$/i,(_,hero,it)=>hero+" สวม "+it],
 [/^(.+?) received no equipment.*$/i,(_,hero)=>hero+" ไม่ได้รับอุปกรณ์"]
];
function translate(source){
 if(!source||typeof source!=="string")return source;
 const trimmed=source.trim();if(!trimmed)return source;
 let result=phrases[trimmed]||null;
 if(result===null){
  result=trimmed;
  // Exact phrases that appear inside prefixed headings/controls.
  const replacements=[
   [/\bEQUIPMENT & BAG\b/g,"อุปกรณ์ & กระเป๋า"],
   [/\bADVENTURE INDEX\b/g,"สารานุกรมผจญภัย"],
   [/\bYOUR TURN\b/g,"เทิร์นของคุณ"],
   [/\bCHARACTER STATUS\b/g,"สถานะตัวละคร"],
   [/\bHERO INVENTORY\b/g,"กระเป๋าตัวละคร"],
   [/\bQUICK POTIONS\b/g,"ยาใช้งานด่วน"],
   [/\bPARTY MEMBERS\b/g,"สมาชิก Party"],
   [/\bPARTY CHAT\b/g,"แชท Party"],
   [/\bBATTLE LOG\b/g,"บันทึกการต่อสู้"],
   [/\bCHOOSE SPECIALIZATION\b/g,"เลือกสายอาชีพ"],
   [/\bFIELD NOTES\b/g,"ข้อมูลจากสารานุกรม"],
   [/\bEXCLUSIVE BOSS DROPS\b/g,"ไอเทมเฉพาะจาก Boss"],
   [/\bDROP CHANCE\b/g,"โอกาสดรอป"],
   [/\bDROPPED BY\b/g,"ดรอปจาก"],
   [/\bSTAGE\b/g,"ด่าน"],
   [/\bRECORDS\b/g,"รายการ"],
   [/\bGEAR ITEMS\b/g,"ไอเทม"],
   [/\bBAG SLOTS\b/g,"ช่องกระเป๋า"],
   [/\bNO DROP\b/gi,"ไม่ได้ของ"]
  ];
  for(const [re,rep]of replacements)result=result.replace(re,rep);
  for(const [re,fn]of pattern)result=result.replace(re,fn);
 }
 return source.replace(trimmed,result);
}
function lang(){try{return localStorage.getItem(KEY)==="en"?"en":"th"}catch{return "th"}}
let current=lang(),observer=null,pending=false;
const stored=new WeakMap();const targets=new Set();
const skipAncestor=el=>!!el?.closest?.('script,style,noscript,textarea,option,pre,code,[contenteditable="true"],#partyChatMessages,#chatInput,#accountEmail');
function applyNode(node){
 if(node.nodeType!==3||!node.parentElement||skipAncestor(node.parentElement))return;
 const value=node.nodeValue;
 const prev=stored.get(node);
 // If game renderer wrote a new value, treat it as the new English original.
 const original=prev&&prev.output===value?prev.original:value;
 const desired=current==="th"?translate(original):original;
 if(desired!==value)node.nodeValue=desired;
 stored.set(node,{original,output:desired});
 targets.add(node);
}
function walk(){
 const root=document.body;if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 let node;while((node=walker.nextNode()))applyNode(node);
 for(const el of root.querySelectorAll("input[placeholder], textarea[placeholder], button[title], [aria-label]")){
  if(skipAncestor(el))continue;
  for(const attr of ["placeholder","title","aria-label"]){
   if(!el.hasAttribute(attr))continue;
   const key="data-v038-original-"+attr;
   const source=el.getAttribute(key)||el.getAttribute(attr);
   if(!el.hasAttribute(key))el.setAttribute(key,source);
   const next=current==="th"?translate(source):source;
   if(el.getAttribute(attr)!==next)el.setAttribute(attr,next);
  }
 }
 const button=document.getElementById("v038Lang");
 if(button){button.textContent=current==="th"?"🌐 ไทย / EN":"🌐 EN / ไทย";button.setAttribute("aria-label",current==="th"?"Switch to English":"เปลี่ยนเป็นภาษาไทย");}
 document.documentElement.lang=current;
}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;walk()})}
function setLanguage(value){
 current=value==="en"?"en":"th";
 try{localStorage.setItem(KEY,current)}catch{}
 // Restore original English text by tracking the last translated output.
 for(const node of targets){if(!node.isConnected){targets.delete(node);continue}applyNode(node)}
 walk();window.dispatchEvent(new CustomEvent("soulbound:language",{detail:{language:current}}));
}
function init(){
 if(document.getElementById("v038Lang"))return;
 const button=document.createElement("button");
 button.type="button";button.id="v038Lang";button.className="v038-language-toggle";
 button.addEventListener("click",()=>setLanguage(current==="th"?"en":"th"));
 const controls=document.querySelector(".header-controls")||document.querySelector(".site-header");
 controls?.appendChild(button);
 walk();
 observer=new MutationObserver(schedule);
 observer.observe(document.body,{subtree:true,childList:true,characterData:true});
}
window.SoulboundI18n={translate,setLanguage,getLanguage:()=>current,refresh:schedule};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
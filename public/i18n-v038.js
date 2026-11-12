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
 "HEALTH":"HP","MANA":"MP","WEAPON":"อาวุธ","ARMOR":"เกราะ",
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
 "SWORDSMAN":"นักดาบ","MAGE":"จอมเวท","TANK":"แทงก์"
};
const pattern=[
 [/(\bSTAGE\s+)(\d+)(\s*\/\s*\d+)?/gi,(_,a,n,rest)=>"ด่าน "+n+(rest||"")],
 [/(\bLEVEL\s+)(\d+)/gi,(_,a,n)=>"เลเวล "+n],
 [/(\bLV\s*)(\d+)/gi,(_,a,n)=>"LV "+n],
 [/(\bAVAILABLE POINTS:\s*)(\d+)/gi,(_,a,n)=>"แต้มสเตตัสที่เหลือ: "+n],
 [/(\b(\d+)\s+RECORDS\b)/gi,(_,__,n)=>n+" รายการ"],
 [/(\b(\d+)\s+GEAR ITEMS\b)/gi,(_,__,n)=>"อุปกรณ์ "+n+" ชิ้น"],
 [/(\b(\d+)\s*\/\s*40\s*BAG SLOTS\b)/gi,(_,__,n)=>n+" / 40 ช่องกระเป๋า"],
 [/(\bDROP\s+(\d+)%\b)/gi,(_,__,n)=>"โอกาสดรอป "+n+"%"],
 [/(\bNo-drop chance:\s*)(\d+)%/gi,(_,a,n)=>"โอกาสไม่ได้ของ: "+n+"%"],
 [/(\bSTAGE\s+(\d+))/gi,(_,__,n)=>"ด่าน "+n],
 [/(\bSTAGES\s+(\d+\s*[–-]\s*\d+))/gi,(_,__,n)=>"ด่าน "+n],
 [/(\b(\d+)\s*GOLD\b)/gi,(_,__,n)=>n+" Gold"],
 [/(\bDROP\s*·\s*)/gi,()=> "ดรอป · "],
 [/(\bMERCHANT\s*·\s*)/gi,()=> "ร้านค้า · "],
 [/(\bYou need \d+ Race Point[s]?.*)/gi,s=>s.replace("You need","ต้องใช้").replace("Race Point","แต้มเผ่าพันธุ์")],
 [/(\bWait for your turn\.)/gi,()=>"กรุณารอเทิร์นของคุณ"],
 [/(\bYour inventory is empty\.)/gi,()=>"กระเป๋าของคุณว่าง"],
 [/(\bNo drop\b)/gi,()=>"ไม่ได้ไอเทม"],
 [/(\bBoss Stage\s*)(\d+)/gi,(_,a,n)=>"Boss ด่าน "+n],
 [/(\b(\d+)% per boss victory, independent for each hero\b)/gi,(_,n)=>"โอกาส "+n+"% ต่อการชนะ Boss แต่ละคนสุ่มแยกกัน"],
 [/(\bRegular encounters do not drop equipment\.)/gi,()=>"มอนสเตอร์ปกติไม่ดรอปอุปกรณ์"],
 [/(\bEach party member rolls independently\.)/gi,()=>"สมาชิก Party แต่ละคนสุ่มไอเทมแยกกัน"],
 [/(\bSelect an item from the inventory first\.)/gi,()=>"กรุณาเลือกไอเทมในกระเป๋าก่อน"],
 [/(\bThis slot is already empty\.)/gi,()=>"ช่องนี้ว่างอยู่แล้ว"],
 [/(\bGear can only be changed before or between battles\.)/gi,()=>"เปลี่ยนอุปกรณ์ได้เฉพาะนอกการต่อสู้"],
 [/(\bViewing gear during battle\b)/gi,()=>"กำลังดูอุปกรณ์ระหว่างต่อสู้"],
 [/(\bEquipment changes are locked\b)/gi,()=>"ไม่สามารถเปลี่ยนอุปกรณ์ระหว่างต่อสู้"],
 [/(\bSelected\s+)(.+?)(\.\s*Click a matching slot to equip\.)/gi,(_,a,item)=>"เลือก "+item+" แล้ว คลิกช่องที่ตรงกันเพื่อสวม"],
 [/(\b(.+?) equipped successfully\.)/gi,(_,item)=>"สวม "+item+" สำเร็จ"],
 [/(\b(.+?) discarded\.)/gi,(_,item)=>"ทิ้ง "+item+" แล้ว"],
 [/(\b(.+?) received\s+([A-Z]+)\s+boss loot:\s*(.+?)!)/gi,(_,hero,rarity,item)=>hero+" ได้รับไอเทมจาก Boss ระดับ "+rarity+": "+item+"!"],
 [/(\b(.+?) is revived after the victory with 30% HP and 20% MP\.)/gi,(_,name)=>name+" ถูกชุบชีวิตหลังชนะด้วย HP 30% และ MP 20%"],
 [/(\b(.+?) earned 1 Race Point for defeating a boss!)/gi,(_,name)=>name+" ได้รับ 1 แต้มเผ่าพันธุ์จากการชนะ Boss!"],
 [/(\bVictory! (.+?) defeated\. \+(\d+) EXP · \+(\d+) GOLD\.)/gi,(_,boss,xp,gold)=>"ชนะแล้ว! ปราบ "+boss+" สำเร็จ ได้รับ +"+xp+" EXP · +"+gold+" Gold"],
 [/(\b(.+?) attacks for (\d+) damage\.)/gi,(_,name,n)=>name+" โจมตีสร้างความเสียหาย "+n],
 [/(\b(.+?) strikes (.+?) for (\d+) damage\.)/gi,(_,monster,hero,n)=>monster+" โจมตี "+hero+" สร้างความเสียหาย "+n],
 [/(\b(.+?) equipped (.+?)\.)/gi,(_,name,it)=>name+" สวม "+it],
 [/(\b(.+?) received no equipment\b)/gi,(_,name)=>name+" ไม่ได้รับอุปกรณ์"],
 [/(\bEquipment may only be changed between battles\b)/gi,()=>"เปลี่ยนอุปกรณ์ได้เฉพาะนอกการต่อสู้"]
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
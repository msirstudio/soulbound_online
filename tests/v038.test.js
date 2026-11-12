"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../public/i18n-v038.js"),"utf8");
function loadTranslator(storageValue){
 const store=new Map();if(storageValue)store.set("soulbound_ui_language_v038",storageValue);
 const dom={readyState:"loading",addEventListener(){}};
 const browser={document:dom,window:{},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};
 vm.runInNewContext(src,browser,{filename:"i18n-v038.js"});
 return {api:browser.window.SoulboundI18n,store};
}
test("default language Thai and saved English respected",()=>{
 assert.equal(loadTranslator().api.getLanguage(),"th");
 assert.equal(loadTranslator("en").api.getLanguage(),"en");
});
test("interface translates while HP, MP, ATK and DEF remain in English",()=>{
 const {api}=loadTranslator();
 for(const [english,expected] of [
 ["CHARACTER STATUS","สถานะตัวละคร"],["BATTLE SKILLS","สกิลต่อสู้"],
 ["PARTY MEMBERS","สมาชิก Party"],["QUICK POTIONS","ยาใช้งานด่วน"],
 ["START ADVENTURE","เริ่มผจญภัย"],["NEXT STAGE →","ไปด่านต่อไป →"],
 ["⚔ EQUIPMENT & BAG","⚔ อุปกรณ์ & กระเป๋า"],
 ["📖 ADVENTURE INDEX","📖 สารานุกรมผจญภัย"],
 ["❤️ HEALTH","❤️ HP"],["🔷 MANA","🔷 MP"],
 ["ATK","ATK"],["DEF","DEF"],["HP","HP"],["MP","MP"]
 ])assert.equal(api.translate(english),expected,english);
});
test("Wiki and equipment terminology",()=>{
 const {api}=loadTranslator();
 for(const [english,expected] of [
 ["BOSSES","Boss"],["MONSTERS","มอนสเตอร์"],
 ["WEAPONS","อาวุธ"],["ACCESSORIES","เครื่องประดับ"],
 ["FOOD","อาหาร"],["POTIONS","ยา"],["HELMET","หมวก"],
 ["CHEST ARMOR","เกราะอก"],["MAIN WEAPON","อาวุธหลัก"],
 ["NECKLACE","สร้อยคอ"],["RARITY","ระดับความหายาก"],
 ["VIEW BOSS","ดูข้อมูล Boss"]
 ])assert.equal(api.translate(english),expected,english);
});
test("battle log translates and preserves proper names",()=>{
 const {api}=loadTranslator();
 const hit=api.translate("Marvin attacks for 24 damage.");
 const win=api.translate("Victory! The Briarfang Alpha defeated. +130 EXP · +90 GOLD.");
 const loot=api.translate("Marvin received RARE boss loot: Briarfang Saber!");
 assert.match(hit,/Marvin.*24/);assert.match(hit,/โจมตี/);
 assert.match(win,/ชนะแล้ว/);assert.match(win,/Briarfang Alpha/);
 assert.match(loot,/Marvin/);assert.match(loot,/RARE/);
 assert.match(loot,/Briarfang Saber/);
});
test("game engine symbols and item identifiers are unchanged",()=>{
 const {api}=loadTranslator();
 for(const word of ["HP","MP","ATK","DEF","boss3_main","iron_sword","130 / 223 HP"])
 assert.equal(api.translate(word),word);
});

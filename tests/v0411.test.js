"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"..");
const read=filename=>fs.readFileSync(path.join(root,filename),"utf8");
function model(){
 const window={};
 const targets={arena:{nodes:[],appendChild(node){node.parentNode=this;this.nodes.push(node)}},
   v040City:{nodes:[],appendChild(node){node.parentNode=this;this.nodes.push(node)}}};
 const timerCallbacks=new Map();let counter=0;
 function element(){
  return{style:{setProperty(){}},children:[],attributes:{},parentNode:null,
   setAttribute(k,v){this.attributes[k]=v},
   appendChild(child){child.parentNode=this;this.children.push(child)},
   remove(){if(this.parentNode?.nodes)this.parentNode.nodes=this.parentNode.nodes.filter(x=>x!==this);
     this.parentNode=null}};
 }
 const document={getElementById:id=>targets[id]||null,createElement:element};
 vm.runInNewContext(read("public/reward-float-v0411.js"),
  {window,document,setTimeout:(fn,ms)=>{const id=++counter;timerCallbacks.set(id,fn);return id},
   clearTimeout:id=>timerCallbacks.delete(id)});
 return{reward:window.SoulboundRewardV411,targets,expire(){for(const fn of timerCallbacks.values())fn();timerCallbacks.clear()}};
}
const player=(id,values={})=>({id,level:1,xp:0,gold:80,inventory:[],...values});
const room=(status,hero,monster={hp:0,boss:true})=>({code:"ROOM1",stage:5,status,monster,
  players:[hero,player("other", {gold:99,inventory:[{uid:"foreign",name:"Other player's item"}]})]});
test("reward uses player's own authoritative before/after deltas, including level-up XP",()=>{
 const {reward}=model(),base=room("battle",player("me",{xp:85,gold:130}),{hp:1,boss:true});
 const won=room("regionClear",player("me",{level:2,xp:18,gold:152,
  inventory:[{uid:"newA",name:"Briarfang Saber",rarity:"rare"}]}));
 const result=reward.rewardFrom(base,won,"me");
 assert.equal(result.gold,22);assert.equal(result.xp,33);
 assert.equal(result.items[0].name,"Briarfang Saber");
 assert.equal(result.items.length,1);
});
test("no rewards on reconnect, repeated state, stage change or defeat",()=>{
 const {reward}=model(),base=room("battle",player("me"),{hp:5,boss:false});
 const won=room("victory",player("me",{gold:110}),{hp:0,boss:false});
 assert.equal(reward.rewardFrom(null,won,"me"),null);
 assert.equal(reward.rewardFrom(won,won,"me"),null);
 assert.equal(reward.rewardFrom(base,{...won,stage:6},"me"),null);
 assert.equal(reward.rewardFrom(base,{...won,status:"defeat"},"me"),null);
 assert.equal(reward.rewardFrom({...base,code:"AAA"},won,"me"),null);
 assert.equal(reward.rewardFrom(base,{...won,monster:{hp:1,boss:false}},"me"),null);
});
test("rewards are nonmodal, show near monster or city and auto-expire",()=>{
 const {reward,targets,expire}=model();
 const base=room("battle",player("me",{gold:80}),{hp:1,boss:true});
 const won=room("victory",player("me",{gold:105,inventory:[{uid:"reward",name:"Alpha Ring",rarity:"uncommon"}]}));
 const result=reward.show(base,won,"me");
 assert.equal(result.gold,25);
 assert.equal(targets.arena.nodes.length,1);
 assert.equal(targets.arena.nodes[0].attributes.role,"status");
 const lines=targets.arena.nodes[0].children.map(x=>x.textContent);
 assert.ok(lines.some(x=>x.includes("+25")&&x.includes("GOLD")));
 assert.ok(lines.some(x=>x.includes("Alpha Ring")));
 assert.ok(lines.every(x=>!x.includes("Other player's item")));
 expire();assert.equal(targets.arena.nodes.length,0);
 const clear=room("regionClear",player("me",{gold:105}));
 reward.show(base,clear,"me");
 assert.equal(targets.v040City.nodes.length,1);
});
test("missing equipment is not invented: show no-drop for boss, gold for normal enemies",()=>{
 const {reward}=model(),base=room("battle",player("me",{gold:80}),{hp:1,boss:true});
 const noDrop=room("regionClear",player("me",{gold:95}),{hp:0,boss:true});
 const result=reward.rewardFrom(base,noDrop,"me");
 assert.equal(result.gold,15);assert.equal(result.items.length,0);assert.equal(result.boss,true);
 const regular=reward.rewardFrom({...base,stage:2,monster:{hp:10,boss:false}},
  {...noDrop,stage:2,status:"victory",monster:{hp:0,boss:false}},"me");
 assert.equal(regular.boss,false);assert.equal(regular.gold,15);
});
test("menu hides finale boss, logo does not split, hero lobby grows, and side tabs never shade gameplay",()=>{
 const html=read("public/index.html"),css=read("public/v0411.css"),ui=read("public/ui-foundation-v041.js");
 assert.doesNotMatch(html,/v041-front-vista[^]*?eclipse_sovereign_normal.png/);
 assert.match(html,/v0411-landscape-art/);assert.match(css,/assets\/scenes\/living-wilds\.svg/);
 assert.match(css,/#v041Front h1\s*\{[^}]*white-space:nowrap!important/);
 assert.match(css,/#lobby \.v041-party-column \.join/);
 assert.match(css,/#game\.v041-drawer-open \.game-layout/);
 assert.match(css,/#game #v041DrawerScrim/);
 assert.doesNotMatch(ui,/createElement\("button"\);scrim/);
 assert.match(html,/reward-float-v0411\.js/);
 assert.match(read("public/game.js"),/SoulboundRewardV411\?\.show\(last,s,myId\)/);
 assert.match(read("public/adventure-index-v035.js"),/spot\.appendChild\(btn\)/);
 assert.match(css,/#game \.roomline \.v041-toolbar #v035Open\.v035-open/);
});

"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
function sourceDelete(){
 const text=read("public/game.js"),start=text.indexOf("async function v561Delete(n){");
 const end=text.indexOf("\nfunction authNotice",start);
 assert.ok(start>0&&end>start,"save delete routine must exist");
 return text.slice(start,end);
}
function harness(settings={}){
 const slots=(settings.slots||[
  {class_id:"mage",username:"Lyra"},
  {class_id:"archer",username:"Noct"},
  {class_id:"priest",username:"Seris"}
 ]).map(x=>x?{...x}:null);
 const files=new Map([["slot_1","one"],["slot_2","two"],["slot_3","three"],["world_1","w1"],["world_2","w2"],["world_3","w3"],["hero_1","h1"],["hero_2","h2"],["hero_3","h3"],["legacy_marker","epoch"],["soulbound_guest_save_v1","guest"]]);
 const removed=[],notices=[],selected=[],deletes=[],snapshots=[];
 const store={removeItem:key=>{removed.push(key);files.delete(key)},getItem:key=>files.get(key)||null};
 const values={
  v561SlotBusy:false,v561Slots:slots,confirm:settings.confirm||(()=>true),
  v564Owner:()=>settings.guest?"guest":"account",
  window:{SoulboundSaveGuardV564:{snapshot:(...args)=>{snapshots.push(args);return settings.backupOK!==false}}},
  v564SnapshotData:(slot,data)=>({...data,world_progress:{slot}}),
  notice:(...args)=>notices.push(args),v57Mode:!!settings.secure,guestMode:!!settings.guest,
  v57Api:async(...args)=>{deletes.push(["secure",...args]);if(settings.failCloud)throw Error("Cloud unavailable");return{ok:true}},
  v57Revisions:{1:7,2:9,3:12},
  supabaseClient:settings.legacy?{from:table=>({
   delete:()=>({eq(field,val){deletes.push(["legacy",table,field,val]);return this},then(resolve){resolve({error:settings.failCloud?{message:"RLS denied"}:null})}})
  })}:null,
  currentUser:{id:"user-001"},localStorage:store,
  v40WorldKeyFor:n=>"world_"+n,v065LegacyMarker:()=>"legacy_marker",
  v561Key:n=>"slot_"+n,v064Key:n=>"hero_"+n,v561CloudSlots:!!settings.legacy,
  v561Select:n=>selected.push(n)
 };
 const params=Object.keys(values),run=new Function(...params,sourceDelete()+"\nreturn v561Delete");
 const del=run(...params.map(p=>values[p]));
 return{del,slots,files,removed,notices,selected,deletes,snapshots,values};
}
test("visible save screen has 3 Continue/Create buttons and DELETE only for occupied slots",()=>{
 const fake={innerHTML:"",hidden:false,classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelectorAll(){return []}};
 const lobby={classList:{add(){},remove(){}},querySelector:q=>q===".v041-lobby-grid"?{before(){}}:q===".v041-view-bar span"?{textContent:""}:null};
 const ids={lobby,v065SlotCards:{innerHTML:""},v065RoomCode:{value:""},v065Status:{textContent:"",classList:{toggle(){}}}};
 const window={SoulboundCharacterSelectV064:{showScene(){}}};
 vm.runInNewContext(read("public/slot-first-v065.js"),{
  window,document:{getElementById:id=>ids[id]||null,createElement:()=>fake}
 });
 const flow=window.SoulboundV065;assert.ok(flow);
 flow.setSlots([{exists:true,name:"Noct",className:"archer",level:1},{exists:false},{exists:true,name:"Lyra",className:"mage",level:4}]);
 const html=ids.v065SlotCards.innerHTML;
 assert.equal((html.match(/data-v065-slot="/g)||[]).length,3);
 assert.equal((html.match(/data-v065-delete="/g)||[]).length,2);
 assert.ok(html.includes('data-v065-delete="1"'));
 assert.ok(html.includes('data-v065-delete="3"'));
 assert.ok(!html.includes('data-v065-delete="2"'));
 assert.match(html,/<\/button><button type="button" class="v065-slot-delete"/,"delete button is a sibling, never a nested button");
 assert.match(html,/aria-label="Delete Slot 1 save"/);
 assert.ok(read("public/slot-first-v065.css").includes(".v065-slot-entry"));
 assert.ok(read("public/game.js").includes("window.SoulboundV065.onSlotDelete=n=>v561Delete(n)"));
 assert.match(read("public/index.html"),/slot-first-v065[.]js[?]v=0[.]65-delete/);
});
test("guest delete only Slot 2 and leaves Slot 1/3 data untouched",async()=>{
 const h=harness({guest:true});
 const result=await h.del(2);
 assert.equal(result.ok,true);
 assert.equal(h.slots[1],null);
 assert.equal(h.slots[0].username,"Lyra");assert.equal(h.slots[2].username,"Seris");
 assert.deepEqual(h.removed,["slot_2","world_2","hero_2"]);
 assert.deepEqual(h.snapshots.map(x=>[x[1],x[3]]),[[2,"before-delete"]]);
 assert.deepEqual(h.selected,[2]);
 assert.equal(h.files.get("slot_1"),"one");
 assert.equal(h.files.get("slot_3"),"three");
 assert.equal(h.deletes.length,0);
});
test("guest Slot 1 delete removes only its guest save and epoch marker",async()=>{
 const h=harness({guest:true});
 assert.equal((await h.del(1)).ok,true);
 assert.deepEqual(h.removed,["world_1","legacy_marker","soulbound_guest_save_v1","hero_1"]);
 assert.ok(h.slots[1]&&h.slots[2]);
 assert.equal(h.files.get("slot_2"),"two");
});
test("authenticated secure delete targets only the requested secure slot and revision",async()=>{
 const h=harness({secure:true});
 const result=await h.del(3);
 assert.deepEqual(result,{ok:true,slot:3});
 assert.deepEqual(h.deletes,[["secure","DELETE","/api/secure-saves/3",{revision:12}]]);
 assert.equal(h.values.v57Revisions[3],null);
 assert.deepEqual(h.removed,["slot_3","world_3","hero_3"]);
 assert.ok(h.slots[0]&&h.slots[1]);
});
test("cancelled dialog never snapshots, writes or clears anything",async()=>{
 const h=harness({guest:true,confirm:()=>false});
 assert.deepEqual(await h.del(1),{ok:false,cancelled:true});
 assert.equal(h.snapshots.length,0);assert.equal(h.removed.length,0);
 assert.equal(h.deletes.length,0);assert.ok(h.slots[0]);
});
test("backup failure blocks delete before accessing storage or server",async()=>{
 const h=harness({secure:true,backupOK:false});
 const result=await h.del(2);
 assert.equal(result.ok,false);assert.match(result.error,/Backup failed/);
 assert.equal(h.snapshots.length,1);
 assert.equal(h.removed.length,0);
 assert.equal(h.deletes.length,0);
 assert.ok(h.slots[1]);
});
test("server error preserves all slots and reports the failure without local cleanup",async()=>{
 const h=harness({secure:true,failCloud:true});
 const result=await h.del(2);
 assert.equal(result.ok,false);assert.match(result.error,/Cloud unavailable/);
 assert.equal(h.removed.length,0);assert.equal(h.slots[1].username,"Noct");
 assert.deepEqual(h.selected,[2]);assert.equal(h.values.v57Revisions[2],9);
});
test("legacy Supabase deletion scopes slot 2 by owner AND slot",async()=>{
 const h=harness({legacy:true});
 const result=await h.del(2);
 assert.equal(result.ok,true);
 assert.deepEqual(h.deletes,[["legacy","hero_save_slots","user_id","user-001"],["legacy","hero_save_slots","slot",2]]);
 assert.equal(h.slots[0].username,"Lyra");assert.equal(h.slots[2].username,"Seris");
});

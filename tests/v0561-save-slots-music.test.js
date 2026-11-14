"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const game=read("public/game.js"),html=read("public/index.html"),music=read("public/music-v0561.js"),css=read("public/v0561-ui.css"),sql=read("SUPABASE-SAVE-SLOTS-V0561.sql");
test("Three independent save slot buttons and scoped delete controls render in the lobby",()=>{
 assert.ok(html.includes('id="v561Slots"'));
 assert.ok(html.includes('id="v561SlotNotice"'));
 assert.ok(game.includes('v561Slots=[null,null,null]'));
 assert.ok(game.includes('data-v561-pick'));
 assert.ok(game.includes('data-v561-delete'));
 assert.ok(game.includes('Delete SLOT '));
 assert.ok(game.includes('v561Slot!==1'));
 assert.ok(game.includes('localStorage.removeItem(v561Key(n))'));
 assert.ok(game.includes('localStorage.removeItem(v40WorldKeyFor(n))'));
 assert.ok(game.includes('const table=n===1?"profiles":"hero_save_slots"'));
 assert.ok(game.includes('savedCharacter=v561Slots[n-1]||{}'));
 assert.ok(game.includes('if(!savedCharacter?.class_id)return notice('));
});
test("Slot 1 uses the legacy profile and subsequent slots use a separate table",()=>{
 assert.ok(game.includes('if(guestMode)v561Slots[0]=v561ReadLocal(1)'));
 assert.ok(game.includes('else v561Slots[0]=await loadProfile()'));
 assert.ok(game.includes('supabaseClient.from("hero_save_slots").select("slot,data")'));
 assert.ok(game.includes('await v561PersistExtra(v561Slot,full);return'));
 assert.ok(game.includes('user_id:currentUser.id,slot,data'));
 assert.ok(game.includes('slot===1?"":"_slot_"+slot'));
 assert.ok(game.includes('slot===1&&guestMode?"soulbound_guest_save_v1"'));
 assert.match(sql,/primary key \(user_id, slot\)/);
 assert.match(sql,/check \(slot in \(2,3\)\)/);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/auth.uid\(\) = user_id/);
});
test("Nine original compositions are distinct, with city + eight region keys",()=>{
 const keys=["city","cursed_wilds","dreadforge_bastion","ember_caverns","hollow_sanctum","frostbound_peaks","titanfall_ruins","abyssal_rift","eclipse_throne"];
 for(const key of keys)assert.ok(music.includes(key+':{name:'),"missing "+key);
 assert.ok(music.includes("new AudioContext()"));
 assert.ok(music.includes("new AudioContext();master=ctx.createGain()"));
 assert.ok(music.includes("setInterval(scheduler,100)"));
 assert.ok(game.includes('setRegion(s.region?.id||"cursed_wilds",s.status==="city")'));
 assert.ok(music.includes('original.setMusic(false)'));
 assert.ok(!music.includes('old.setMusic(false)'));
});
test("Audio shares Equipment/INDEX toolbar instead of taking a standalone row",()=>{
 const dock=html.indexOf('class="v22-command-dock"'),audio=html.indexOf('id="audioSettingsToggle"'),layout=html.indexOf('class="game-layout"');
 assert.ok(dock>=0&&dock<audio&&audio<layout);
 assert.equal((html.match(/id="audioSettingsToggle"/g)||[]).length,1);
 assert.ok(!html.includes('v0559-audio-row'));
 assert.ok(css.includes('#game .v22-command-dock #audioSettingsToggle'));
 assert.ok(css.includes('bottom:calc(100% + 8px)'));
});
test("Release and API versions agree",()=>{
 assert.ok(html.includes('<small>v0.57</small>'));
 assert.ok(html.includes('VERSION 0.57 · SECURE SAVES'));
 assert.equal(require("../package.json").version,"0.57.0");
 assert.ok(read("server.js").includes("version:APP_VERSION"));
});

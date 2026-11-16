/* SOULBOUND v0.67 · Authenticated owner-only GM panel. This UI has NO authority. */
(()=>{
"use strict";
const bridge=()=>window.SoulboundGMBridgeV067;
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const btn=document.createElement("button");
btn.id="v067GMOpen";btn.type="button";btn.textContent="👑 GM";btn.title="Owner-only Game Master";btn.hidden=true;
const toolbar=document.querySelector("#game .v041-toolbar")||document.querySelector("#game .roomline");
if(!toolbar)return;
toolbar.appendChild(btn);
const modal=document.createElement("section");
modal.id="v067GMModal";modal.className="v067-gm-overlay";modal.hidden=true;
modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");modal.setAttribute("aria-label","Game Master");
modal.innerHTML=[
 '<div class="v067-gm-window"><header><span>👑 SOULBOUND · GAME MASTER</span><button id="v067GMClose" type="button" aria-label="Close GM panel">✕</button></header>',
 '<p class="v067-gm-sub">OWNER ONLY · Give rewards to verified online party members. Changes are saved to their secure character slot.</p>',
 '<label for="v067GMTarget">TARGET PLAYER</label><select id="v067GMTarget"></select>',
 '<label for="v067GMKind">REWARD TYPE</label><select id="v067GMKind"><option value="gold">🪙 Gold</option><option value="race_points">💎 Race Points</option><option value="equipment">⚔ Equipment / Armor</option><option value="material">💎 Enhancement Stones</option></select>',
 '<div id="v067GMAmountWrap"><label for="v067GMAmount">AMOUNT</label><input id="v067GMAmount" type="number" min="1" max="100000" step="1" value="1000"></div>',
 '<div id="v067GMStoneWrap" hidden><label for="v067GMStone">STONE TYPE</label><select id="v067GMStone"><option value="basic">🔹 Enhancement Stone</option><option value="refined">💠 Refined Stone</option><option value="ancient">💎 Ancient Stone</option></select></div><div id="v067GMItemWrap" hidden><label for="v067GMItem">ITEM TO SPAWN</label><select id="v067GMItem"></select><small>The receiver must match the class/armor weight. High-level items cannot be equipped early.</small></div>',
 '<div id="v067GMInfo" class="v067-gm-status" role="status" aria-live="polite">Rewards are available only outside battle.</div>',
 '<div class="v067-gm-actions"><button type="button" id="v067GMCancel">CANCEL</button><button type="button" id="v067GMGive">👑 GIVE REWARD</button></div></div>'
].join("");
document.body.appendChild(modal);
const $=id=>document.getElementById(id);
let allowed=false,room=null,self=null,busy=false;
const close=()=>{modal.hidden=true;btn.focus()};
const status=(message,error=false)=>{const el=$("v067GMInfo");el.textContent=message;el.classList.toggle("error",error)};
const updateKind=()=>{
 const gear=$("v067GMKind").value==="equipment";
 $("v067GMItemWrap").hidden=!gear;
 $("v067GMStoneWrap").hidden=$("v067GMKind").value!=="material";
 $("v067GMAmountWrap").hidden=gear;
 $("v067GMAmount").max=["race_points","material"].includes($("v067GMKind").value)?"20":"100000";
 if(["race_points","material"].includes($("v067GMKind").value)&&Number($("v067GMAmount").value)>20)$("v067GMAmount").value="1";
};
function updateTargets(){
 if(!allowed||!room)return;
 const select=$("v067GMTarget"),old=select.value;
 const members=(room.players||[]).filter(p=>p.verified&&!p.guest&&!p.disconnected);
 select.innerHTML=members.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+" · "+esc(p.className||p.classId)+(p.id===self?" (YOU)":"")+'</option>').join("");
 if(members.some(p=>p.id===old))select.value=old;
 updateItems();
 const safe=["city","shop","victory","regionClear"].includes(room.status);
 $("v067GMGive").disabled=busy||!safe||!members.length;
 if(!safe)status("Return to the city or finish this fight before giving rewards.",true);
 else if(!members.length)status("No verified party members available.",true);
}
function updateItems(){
 const selected=(room?.players||[]).find(p=>p.id===$("v067GMTarget").value);
 const items=(room?.shopItems||[]).filter(i=>["weapon","armor"].includes(i.slot)&&
  (!i.class||i.class===selected?.classId)&&(!i.allowedClasses||i.allowedClasses.includes(selected?.classId)));
 const old=$("v067GMItem").value;
 $("v067GMItem").innerHTML=items.map(i=>'<option value="'+esc(i.id)+'">'+esc(i.name)+" · "+esc(i.slot.toUpperCase())+" · Lv "+Number(i.level||1)+'</option>').join("");
 if(items.some(i=>i.id===old))$("v067GMItem").value=old;
}
btn.onclick=()=>{updateTargets();modal.hidden=false;$("v067GMTarget").focus()};
$("v067GMClose").onclick=close;$("v067GMCancel").onclick=close;
modal.addEventListener("click",e=>{if(e.target===modal)close()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)close()});
$("v067GMTarget").onchange=updateItems;$("v067GMKind").onchange=updateKind;
$("v067GMGive").onclick=async()=>{
 if(busy||!allowed||!room)return;
 const targetId=$("v067GMTarget").value,kind=$("v067GMKind").value;
 const requestId=globalThis.crypto?.randomUUID?.();
 if(!requestId)return status("A secure HTTPS connection is required to send a GM reward.",true);
 const payload={targetId,kind,requestId};
 if(kind==="equipment"){payload.itemId=$("v067GMItem").value;if(!payload.itemId)return status("Select equipment first.",true)}
 else{
  const v=Number($("v067GMAmount").value);
  if(!Number.isSafeInteger(v)||v<1||v>(kind==="gold"?100000:20))return status("Invalid reward amount.",true);
  payload.amount=v;
  if(kind==="material")payload.stoneType=$("v067GMStone").value;
 }
 busy=true;$("v067GMGive").disabled=true;status("Authenticating GM and saving reward…");
 try{
  const accessToken=await bridge()?.token();
  if(!accessToken)throw Error("Sign in with the verified GM account.");
  const result=await bridge()?.send("gmGrant",{...payload,accessToken});
  if(!result?.ok)throw Error(result?.error||"GM gift was rejected.");
  if(result.duplicate)status("This reward was already delivered. No duplicate was created.");
  else status("Reward saved: "+result.receipt.name+" ×"+result.receipt.amount+".");
 }catch(e){status(e?.message||"Could not save reward.",true)}
 finally{busy=false;updateTargets()}
};
async function refresh(){
 const api=bridge();
 allowed=false;btn.hidden=true;modal.hidden=true;
 if(!api?.canUse?.())return;
 try{
  const accessToken=await api.token();
  if(!accessToken)return;
  const result=await api.send("gmStatus",{accessToken});
  allowed=!!result?.isGM;
  btn.hidden=!allowed;
 }catch{allowed=false;btn.hidden=true}
}
function onState(next,myId){room=next;self=myId;if(allowed)updateTargets()}
window.SoulboundGMV067={refresh,onState};
})();
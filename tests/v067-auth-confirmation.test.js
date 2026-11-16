"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const game=read("public/game.js"),html=read("public/index.html");
const start=game.indexOf("function v067AuthDeliveryError(error){"),end=game.indexOf("\nfunction v067ShowResend(",start);
assert.ok(start>0&&end>start,"auth error helper must be present");
const classify=new Function(game.slice(start,end)+"\nreturn v067AuthDeliveryError")();
test("signup messages tell owner when Supabase refuses emails to non-team members",()=>{
 assert.match(classify({code:"email_address_not_authorized",message:"Email address not authorized"}),/Custom SMTP/);
 assert.match(classify({code:"email_address_not_authorized"}),/email_address_not_authorized/);
});
test("auth rate-limit response does not claim email was sent",()=>{
 assert.match(classify({code:"over_email_send_rate_limit"}),/2 emails per hour/);
 assert.match(classify({status:429,message:"Too Many Requests"}),/limit reached/);
});
test("other auth failures preserve their actual safe Supabase error text",()=>{
 assert.equal(classify({message:"Invalid login credentials"}),"Invalid login credentials");
});
test("email resend control is optional and confirmation remains enabled",()=>{
 assert.match(html,/id="resendConfirmation"[^>]*hidden/);
 assert.ok(game.includes('supabaseClient.auth.resend({type:"signup",email})'));
 assert.ok(game.includes('v067ShowResend(true)'));
 assert.ok(game.includes('data?.session'));
 assert.ok(game.includes('data?.user'));
 assert.ok(game.includes("email_not_confirmed"));
 assert.ok(!game.includes("auth.admin.updateUserById"));
 assert.ok(!game.includes("disableEmailConfirmation"));
 assert.ok(html.includes('game.js?v=0.68'));
});

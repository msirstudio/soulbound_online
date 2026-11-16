# SOULBOUND v0.67 — Game Master (GM) setup

**One owner account only.** GM is disabled until all of the following are true:
1. v0.67 branch is deployed to your Render Web Service.
2. The existing v0.57 **Secure Saves** backend is configured and working with Supabase.
3. You set the Render environment variable **SOULBOUND_GM_OWNER_ID** to the **UUID** of YOUR Supabase Auth account (not a display name, email, or password), then restart/redeploy Render.
4. Log into SOULBOUND with that exact account (Guest mode will not work) and open a secure save slot.

To find the UUID: Supabase Dashboard → Authentication → Users → select your account → copy **User UID**. Paste only that UUID into Render → your Web Service → Environment → Add Environment Variable `SOULBOUND_GM_OWNER_ID` → Save and Deploy. **Do not paste your account password, access token, service role key or other secrets into chat or GitHub.** Keep the existing SUPABASE_SECRET_KEY on the server only.

The GM button appears next to PARTY / CHAT after your hero has successfully authenticated into the game. It is hidden for all other players. Choose an online player in your room (including yourself) and grant:
- Gold: 1–100,000 per grant (99,999,999 maximum character balance)
- Race Points: 1–20 per grant (999,999 maximum character balance)
- One registered weapon or chest armor per grant (uses existing inventory catalog and class restrictions; 40 free-slot limit)

The recipient must be in the same online party, verified through Secure Saves, and not a Guest. The party must be outside active combat. The recipient can equip a gifted item once they meet its class and level requirement. Normal game rules are not bypassed for equipping.

**Persistence:** GM actions are handled only by the Node server. The server re-authenticates the owner JWT for each request, confirms its active Secure Save claim, checks the recipient, then writes the gift to the recipient's secure slot. Each grant has a unique request ID and a receipt retained in the secure save (`gm_grants`, up to 50 records) to prevent duplicate rewards. Render also receives a token-free [GM-GRANT] log line. If persistence fails, no success is reported; the in-memory reward is rolled back.

**No SQL migration required** beyond the existing v0.57 Secure Saves migration because `gm_grants` is part of the character save JSON. Do not make public Supabase tables writable for this feature.

**Limitations of v0.67:** no offline player grants, no custom item definitions, no force-equip, no account bans, no free-form console, and no GM authority in legacy/Guest save mode. Existing save slots, classes, battle pacing, and equipment logic are intentionally unchanged. Test with two authenticated accounts before using on a live server.

If the 👑 GM button does not show: visit `/health` to confirm `secureSavesEnabled: true`, verify the Render UUID, redeploy/restart the service, sign in using the owner account, enter a secure character slot, and hard-refresh with Ctrl+F5. Do not turn off account authorization to make the button show.

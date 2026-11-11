# SOULBOUND Online v0.2 setup

## What v0.2 adds
- Supabase email/password account registration and sign-in
- One persistent character profile per account
- Saves username, level, EXP, gold, HP/MP, attack, defense and potions
- Restores the saved stats when the account joins a new party
- Keeps the existing Socket.IO party flow and 4-player battles

## Important: v0.2 is on a separate branch
This update is prepared on branch `v0.2-persistent-characters`. Your working `main` branch is not changed. Test this branch first; merge it into main only after it works.

## Setup (one-time)

### 1. Create the database table
1. Open your Supabase project.
2. Go to SQL Editor > New query.
3. Open `supabase-schema-v0.2.sql` from this repository.
4. Copy all SQL into the editor and click Run.
5. Confirm that the `profiles` table appears under Table Editor.

### 2. Add the public Supabase key
1. In Supabase open Project Settings > API (or API Keys).
2. Copy the **anon / publishable** key. It is intended for browser use.
3. In GitHub open `public/config.js` on branch `v0.2-persistent-characters`.
4. Replace `PASTE_YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY_HERE` with that key and commit.

Never use the `service_role`, `secret`, or private key in `public/config.js`, GitHub, or the browser. Those keys must never be exposed.

### 3. Deploy the test branch
In Render, open the existing Web Service > Settings > Branch and change it to `v0.2-persistent-characters`, then save and deploy. This does not change the GitHub main branch. To roll back, set the Render branch back to `main`.

### 4. Test
1. Open the Render URL in a private/incognito window.
2. Create an account with email and password. If Supabase email confirmation is enabled, confirm the email before signing in.
3. Sign in, create a party, and play a battle.
4. Win a battle to gain XP and gold. Wait for the save status to show a successful save.
5. Refresh the page, sign in again, create/join a party and check that your character stats are restored.

## Current limitations
- This is still an early prototype, not an MMO launch build.
- Character saves are per account, but battle rooms and live party state remain in server memory and disappear when Render restarts/redeploys.
- Players currently need to create/join a new party after reconnecting; automatic reconnect/rejoin is not included yet.
- This browser-based prototype uses Supabase RLS for per-account profile access. It is not a full anti-cheat economy: a determined user can manipulate their own browser-side save values. Server-side trusted persistence and transaction validation should be a later upgrade.
- Email/password is used; OAuth providers, password reset UI, equipment, inventory and skill trees are future updates.

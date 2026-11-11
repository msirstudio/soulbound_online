# SOULBOUND Online v0.2

A browser-based co-op turn-based RPG. Version 0.2 adds Supabase email/password accounts and persistent character profiles while preserving the existing Socket.IO party gameplay.

## Features
- Create/join parties with a 5-character room code
- Up to four players per party
- Eight turn-based encounters and server-authoritative battle actions
- XP, level-ups, gold, HP/MP and potions
- Supabase account registration and sign-in
- Per-account character profile save and restore

## Run locally
Node.js 20+
```bash
npm install
npm start
```
Open http://localhost:3000.

## Deploy
Render uses the existing `render.yaml`. For v0.2, deploy the `v0.2-persistent-characters` branch after following [SETUP-V0.2.md](SETUP-V0.2.md).

## Important limitations
Battle rooms remain in server memory and are lost on server restart/redeploy. Players must create or join a party again after reconnecting. The profile is saved in Supabase using browser authentication and Row Level Security; this is an early prototype and not a tamper-proof economy or production MMO.

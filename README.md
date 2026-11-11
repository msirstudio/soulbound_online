# SOULBOUND Online

A browser-based, pixel-inspired co-op turn-based RPG starter. Up to four players can join a room with a short code and fight through four encounters together.

## Run locally

Requirements: Node.js 20+

```bash
npm install
npm start
```

Open http://localhost:3000 in multiple browser tabs or devices on the same network. Create a party, share the room code, join from another tab, then start the adventure.

## Deploy publicly (Render)

1. Create a GitHub account if you do not already have one.
2. Create a new GitHub repository and upload the contents of this folder.
3. Sign in to https://render.com and choose **New + → Blueprint**.
4. Connect the repository containing `render.yaml`.
5. Render reads `render.yaml`, installs dependencies, and deploys the web service.
6. Open the generated `https://....onrender.com` URL and share it with friends.

The free service may sleep after inactivity; the first visit after sleeping can take a little longer. Socket.IO uses WebSocket with polling fallback.

## Current prototype scope

- Real-time room creation and joining with 5-character room codes
- Up to four players per party
- Server-authoritative turn-based actions
- Four encounters, XP, level-ups, gold, potions and basic co-op progression
- Responsive pixel-inspired browser UI

## Important limitations before a public launch

This is a playable multiplayer prototype, not a production MMO. Room/player state is stored in server memory and is lost when the server restarts or redeploys. There is no account system, persistent character save, matchmaking, moderation, rate limiting, database, or anti-cheat beyond server-side action validation. Add a persistent database (for example PostgreSQL/Supabase), authentication, reconnect handling, and operational safeguards before treating it as a long-running public service.

## Notes

- No build step is required.
- The server serves the frontend and Socket.IO from the same origin.
- `GET /health` is available for health checks.

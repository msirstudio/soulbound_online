# SOULBOUND 0.59 — Multiplayer Stability (Staging)

## Goal

Improve reconnects and duplicate-action safety **without changing game damage, skills, loot tables, save schemas or rewards**. This branch builds on 0.58 Unified Combat and 0.57 Secure Save.

## Implemented

1. **Private reconnect tickets.** Each hero receives a 256-bit random ticket in the individual create/join acknowledgement. It is NOT broadcast in game state. The browser holds it in tab-scoped `sessionStorage`, along with the room code.
2. **120-second disconnect grace.** A disconnected hero remains in the room with the same HP, MP, gold, inventory and exact turn order. During that time the battle is paused and queued enemy attacks stop progressing. On a valid reconnect the old player object is remapped to the new Socket ID, preserving battle progression and rotated reconnect ticket.
3. **Authenticated account resumption.** If Secure Save is enabled, a signed-in hero's new Socket must also authenticate a Supabase session that matches the original authoritative save owner. Guest-only rooms use the ticket alone.
4. **Automatic browser reconnect.** An active tab retries resuming when Socket.IO reconnects. On refresh, the tab attempts to resume after account or Guest initialization. Reconnect is not possible if the ticket is lost, expires, or the Node process restarts.
5. **Idempotent combat requests.** Every new client attack includes an `actionId`. The server stores up to 512 successful receipts per room, rejecting reuse of the same action ID for different commands and acknowledging duplicates without consuming extra turns, MP or doing damage twice. The receipt identity stays stable across a successful room reconnect.
6. **Once-only victory guard.** Each battle has a unique `encounterId`, and victory rewards are applied only once per encounter in a running process.
7. **Grace expiry.** If a player does not resume within two minutes, they are removed from the party. The leader may be reassigned naturally by party order. The remaining party continues.
8. **Client feedback.** While a hero is offline, the UI shows a paused-party message and disables combat buttons.

## Tested

- Actual Socket harness: two-player battle, disconnect, unauthorized rejoin attempt, authorized reconnect, preserved hero object/HP/Gold/turn.
- Duplicate attack acknowledgement, duplicate combat damage prevention and mismatched replay rejection.
- Timeout expiry and party cleanup.
- Victory EXP/Gold only once when finish is invoked again.
- No reconnect secrets in public room state; action receipt cap.
- All historical tests run with the new suite in GitHub Actions.

## Limitations: do not call this crash-proof

- Room membership, active boss state, tickets, pending attack beats and action receipts are **in process memory only**. A Render restart or scaling to multiple Node instances loses the ongoing battle and prevents reconnect.
- "Exactly once" guards apply within the live in-memory encounter only. Full crash-safe rewards need durable event IDs, atomic transactions and a persisted room state.
- Secure Saves remains opt-in. Verify `/health` reports `secureSavesEnabled:true` on your staging Render service before expecting authenticated ownership checks.
- Guest saves are local-only and should not back a public competitive economy.
- Automated Socket tests are **not equivalent to browser-based QA** across multiple devices and varying network conditions.

## Staging QA checklist

1. Keep the existing production Render branch unchanged. Deploy `v0.59-multiplayer-stability` only in the test Web Service.
2. Confirm 0.57 Secure Save migration and secrets are already configured and test accounts load 3 slots correctly.
3. Open two browser windows (separate player accounts). Create/join a party; start a boss battle. Disconnect player B's network for 15 seconds, reconnect, verify same battle/turn/HP.
4. Repeat with a refresh of player B's tab; sign in to the same account, confirm automatic room resume within 120 seconds.
5. Attempt to rejoin using only the room code or another account: no ownership transfer should occur.
6. Disconnect longer than two minutes; verify expiry and the remaining party can continue. A reconnection to expired ticket should fail safely.
7. Double-click skills/normal attacks; ensure at most one server action per successful `actionId`.
8. Win a boss battle, refresh and verify EXP, Gold, equipment and save revisions; check no duplicated rewards.
9. Test solo and 4-player parties, all classes, area attacks and free/paid Render behavior.
10. Preserve a database backup of `profiles`, `hero_save_slots`, and `hero_secure_saves` before any migration/deploy.

## Rollback

Branch `v0.58-unified-combat-engine` remains unchanged. Switching the frontend/server branch back does not undo cloud saves written by 0.59; compare save revisions carefully. This release makes no DB migration.

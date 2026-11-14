# SOULBOUND v0.56.1 — Audio + Save Slots setup

## Game update

Deploy Git branch `v0.56.1-city-ost-save-slots` on Render. A hard refresh (`Ctrl+F5`) loads the versioned JavaScript and CSS. **Do not upload a ZIP.**

The AUDIO button is now integrated into the lower battle control toolbar alongside EQUIPMENT; it no longer occupies a separate empty row.

Music is a set of **nine original procedural Web Audio scores**, not external MP3 files. There is one score for the city plus one for each region. Music begins only after a browser user gesture and can be toggled and adjusted from AUDIO.

## Save slots

**Slot 1** is your existing Supabase `public.profiles` row (or the existing Guest local save). It is preserved; the update does not erase it.

**Slots 2 and 3** are separate per-user JSONB saves in `public.hero_save_slots`. The game also writes browser-local backups of these slots.

### Required one-time setup for cloud saves

1. Open your original Supabase project, then **SQL Editor → New query**.
2. Copy the entire contents of `SUPABASE-SAVE-SLOTS-V0561.sql` from this repository and run it once.
3. The SQL creates `hero_save_slots` with owner-only row-level security. It does not migrate or rewrite the original `profiles` table.
4. Return to the game and refresh. Sign in, select Slot 2 or Slot 3, select NEW GAME, and create your hero. Return later and choose CONTINUE on the same slot.
5. To test cloud syncing, load the same account on another browser. Your extra slots should appear.

**Without the SQL setup**, Slots 2–3 still save in the same browser using localStorage, but they do **not** sync across devices, and clearing browser data will lose those local-only saves. Guest saves are also browser-only.

Deletion requires explicit confirmation. It targets the chosen slot. For signed-in Slot 1 deletion, the migration adds an owner-only DELETE policy to existing `profiles`, without deleting any data by itself.

No slot operations are connected to combat balance or enemy AI. Do not change slots during an active party battle; return to the menu first. The interface is accessible from the hero selection screen.

## Rollback

The source branch `v0.56.0-combat-pacing-animation` remains available in GitHub. Preserve your Supabase backups before testing deletion.

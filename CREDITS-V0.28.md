# Audio sources and licensing — SOULBOUND v0.28

This build streams externally hosted *recorded audio files* rather than generating tones with Web Audio. No MP3/OGG binaries are bundled in this branch; runtime internet access and host availability are required. A fallback recorded combat track is used when a music URL fails. The previous synthesized `audio.js` remains in Git history, but the HTML loads `audio-real.js` instead.

## Music (original recordings / produced music; licensed CC0 on listed source pages)

- **Medieval: The Bard's Tale** — RandomMind — [OpenGameArt](https://opengameart.org/content/medieval-the-bards-tale) — CC0. Primary wilds theme.
- **Town Theme RPG** — cynicmusic — [OpenGameArt](https://opengameart.org/content/town-theme-rpg) — CC0. Secondary wilds/frost track.
- **Medieval: The Old Tower Inn** — RandomMind — [OpenGameArt](https://opengameart.org/content/medieval-the-old-tower-inn) — CC0. Ruins track.
- **Medieval: Exploration** — RandomMind — [OpenGameArt](https://opengameart.org/content/medieval-exploration) — CC0. Ruins alternative.
- **Battle Theme** — Wolfgang_ — [OpenGameArt](https://opengameart.org/content/battle-theme-0) — CC0. Cavern/castle music.
- **Greyarms** — Tozan — [OpenGameArt](https://opengameart.org/content/greyarms) — CC0. Frost theme.
- **Epic Boss Battle** — Juhani Junkala — [OpenGameArt](https://opengameart.org/content/boss-battle-music) — CC0. Recorded orchestral fallback hosted on [jarlah/dungeon-haskell](https://github.com/jarlah/dungeon-haskell/blob/master/assets/CREDITS.md).

The zone playlist automatically tries the next CC0 source if the current URL reports an error. Distinct music per zone is **subject to remote music URLs working in browsers**; this was not live-tested. No claim of a unique composed track for every stage.

## Recorded game sound effects

- [Kenney RPG Audio](https://kenney.nl/assets/rpg-audio) — CC0, weapon swishes, knife slices, chops, coins, metal handling, etc.
- [Kenney Impact Sounds](https://kenney.nl/assets/impact-sounds) — CC0, metal and other collision effects.
- Public GitHub mirror for streaming these originals: [GeorgeQLe/assets-sfx-combat](https://github.com/GeorgeQLe/assets-sfx-combat), CC0-1.0 as documented by that mirror.

## Deployment note

These source links do not constitute a promise that outside hosts allow hotlinking, will remain available indefinitely, or work on slow devices. For a production release, download, verify and self-host the audio in `public/assets/audio/`, then update paths in `public/audio-real.js` to the self-hosted copies. Streaming on every user's client is not the same as uploading sound binaries to GitHub.

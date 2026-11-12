# SOULBOUND v0.38 — Thai / English Language

**Base:** `v0.37-curated-boss-loot-wiki-cleanup`  
**Feature branch:** `v0.38-thai-english-language`

## Added

- Persistent **🌐 ไทย / EN** language toggle in the top header, available before sign-in and during gameplay.
- **Thai by default** for new visitors. Click the button to switch to English; the choice is saved to browser `localStorage` under `soulbound_ui_language_v038`.
- Thai text for common game navigation, account and character setup, action commands, stage controls, hero status, skill/potion panels, party chat headings, equipment/bag modal, item slots, Wiki tabs/details, loot explanations and common dynamic combat log lines.
- Existing game conventions remain in English where recognizable: **HP, MP, ATK, DEF, EXP, Boss, Rare, Epic, Legendary, Inventory item names and character names.**
- No machine translation service required, no remote calls, no database migration.
- Runtime DOM text presentation layer observes newly rendered UI: when the game updates its panels, logs or Wiki, the supported strings get localized without changing the underlying data.
- All player-entered chat messages, email, text fields, profile data, socket action/event names, item IDs and save payloads remain unchanged.
- Language choice is **per browser/device**, not a saved player profile preference. A guest on another device starts with Thai unless they switch language there.

## Files
- `public/i18n-v038.js` — new dictionary, safe dynamic text replacements, language persistence and toggle.
- `public/v038.css` — Thai font fallback and layout styling.
- `public/index.html` — include language assets and version label.
- `package.json` — v0.38.0 metadata.
- `tests/v038.test.js` — translations and engine symbol regression checks.

## Manual QA
1. Deploy the feature branch to Render, then Ctrl+F5. The header should show **🌐 ไทย / EN** and most game headings/buttons should display Thai.
2. Switch to **EN** and verify the initial English copy reappears immediately, without reloading or losing progress.
3. Switch back to Thai and refresh: the preference should persist.
4. Log in / Continue an older character. Confirm **HP, MP, ATK, DEF, EXP, equipment data, gold and stats** are unchanged.
5. Open **Equipment & Bag**, click and drag a piece of gear, close the modal. Check localized labels and unchanged item names.
6. Open **Adventure Index**, change categories, search a boss and item, navigate between them. Confirm data and percentages are the same in both languages.
7. Win a boss encounter to check the basic victory/reward log is displayed in Thai in Thai mode.
8. Send a Thai message to party chat and confirm **the chat content itself is not translated or altered**.
9. Check desktop and narrow/mobile view for overflowing buttons.

## Known limitations

This first translation pass focuses on frequent gameplay/interface text and common server-generated lines. Some niche dialogs, class-specific skill descriptions, long quest/flavor strings and uncommon errors may remain in English; this is intentional for the user-requested Thai–English mix. No player-facing text content is sent to an external translation API.

Automated static/source translation checks passed, but **Render browser and live multiplayer testing have not been performed** as part of this branch commit.

**No changes:** `server.js`, `loot-v034.js`, Supabase settings/schema, loot rules, multiplayer turns, or character saves.

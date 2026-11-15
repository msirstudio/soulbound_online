# Female Knight Idle — original 12-frame 12 FPS upgrade (v0.62.2)

## Correct original source
The source user sheet has **12 frames**, dimension **2048x260**, not 8 frames / 8 FPS.
A lossless (no scaling) conversion to regular 256x256 animation cells is provided as
`female_swordsman_idle_12f.png` with overall size **3072x256** and alpha transparency.

To activate on this branch, upload the provided PNG here:

`public/assets/hero-animations/female_swordsman_idle_12f.png`

The renderer already loads this path first. There is no code change after upload.
Once present, the 12-frame sprite plays at **12 FPS**, cycling every **1 second**.
The existing 8-frame file is retained as an optional fallback and is played at 12 FPS
until the new PNG has been added to GitHub. It is NOT the original 12-frame artwork.

Attack and Hit continue to use the existing high-res images. This patch only changes
female Swordsman Idle and the corresponding lobby preview. Other classes, combat,
multiplayer and saves are unchanged.

After upload: inspect GitHub Actions; deploy branch on Render; Ctrl+F5; select
Swordsman (Female) and inspect battle + hero preview. When testing at live server,
do not overwrite valuable existing save slots.

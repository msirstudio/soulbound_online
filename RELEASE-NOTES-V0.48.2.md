# SOULBOUND v0.48.2 — Generated Main Menu Cover

The code is ready and all existing gameplay remains unchanged. The actual generated picture is a separate WebP file and **must be uploaded to this GitHub branch** before it appears live.

## One-time asset upload
1. Download **title-cover.webp** from ChatGPT (1672×941, about 333 KiB).
2. Open https://github.com/msirstudio/soulbound_online/upload/v0.48.2-title-cover/public/assets/ui
3. Upload `title-cover.webp`, commit changes to the same branch.
4. Verify the file exists at `public/assets/ui/title-cover.webp`.

## What was changed
- New last-loaded stylesheet `public/v0482-title-cover.css` sets the generated image as background of the title panel `#v041Front`.
- A dark transparent linear gradient helps the SOULBOUND title and body copy remain readable.
- Previous generated silhouette layers (ruins, horizon, sun) are hidden on the title only.
- Right-hand buttons remain clickable with a semitransparent panel and blur.
- Smaller screens reposition the image while leaving menu controls accessible.
- Game scene, player profile, lobby, city, battles, shops, loot, world map, saves and online party unchanged.
- Version labels updated to 0.48.2 and Update Log includes a new entry.

## Testing
GitHub Actions runs Node syntax checks and the full regression suite. Source tests validate scoping, menu links and CSS, but cannot visually test the new art until the WebP upload.

## Deployment
After uploading the WebP, Render → Settings → Branch → `v0.48.2-title-cover`. Save, trigger Deploy latest commit as needed, refresh the game with Ctrl+F5 and verify the home menu.

# Brambleroot

A cozy witch farming game for phones. Grow herbs through four seasons, brew potions, befriend the village, forage the Old Wood and explore the Hollow.

The whole game is a single file, `index.html`. Saves live in the browser on the device; use **Back up my save** in the cottage to keep a backup file.

**Play on iPhone:** open the site in Safari, tap Share, then Add to Home Screen, and always play from that icon.

## Working on the game
- `src/brambleroot.html` is the source (no cloud keys). `index.html` is the built site:
  `cd src && python3 build_site.py brambleroot.html ../index.html <firebase apiKey> <projectId>` (keys are in the current index.html, `const CLOUD`).
- `tests/` holds the save, balance and gameplay checks used so far (Node + Playwright). They expect to run from a folder holding the built page as `local.html`, plus the files in tests/.
- `PLAN-shop.md` is the plan for the current big update (the shop on Old Market Row). The other `PLAN-*.md` files are finished plans.

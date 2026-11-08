# Brambleroot: handoff notes

A cozy witch farming game (Stardew-like), built for Matt's wife. She plays it on her **iPhone** (Safari, added to the Home Screen). Matt tests on **Android**. Read this file fully before changing anything.

- Live site: https://mfleshner.github.io/brambleroot/ (GitHub Pages, deploys from `main` root)
- Next work: **PLAN-villagers.md** (15 villagers plus marriage, in 3 parts)

## Files
- `src/brambleroot.html`: **the source** (about 250 KB, one file: HTML, CSS and JS in one IIFE). Cloud keys are empty here.
- `src/build_site.py`: `python3 build_site.py brambleroot.html ../index.html <apiKey> <projectId>`
  - Fills in `const CLOUD = { apiKey:'', projectId:'' };`.
  - Wraps the page with doctype, apple-mobile-web-app metas, theme color and the home-screen icon (icon180.png as a data URI).
  - Leave the keys off when you want a local test build.
- `index.html`: the built site. Never hand-edit it; edit src and rebuild. The current keys are inside it (`const CLOUD`). The Firebase web apiKey is public by design.
- `tests/`: see Testing.

## Who she is as a player (design rules)
- Phone-first, portrait, **tap only**. Nothing fiddly. Big buttons and bottom sheets.
- She loves the **relationship side** (portraits, hearts, scenes, letters).
- She does **not** like complex combat. The Hollow is deliberately simple: tap a creature to throw a Firebolt, and creatures take 1 to 3 hits. The only risk is tiredness: at 0 energy you faint and wake at home, keeping your loot.
- **No game over.**
  - Season charters have 3 stars.
  - Missed goals carry over to the same season next year.
  - Each star earned gives a head start next season.
  - Goals must be reachable in one go.
- Don't auto-scroll sheets when she buys or sells (the market scroll position was a complaint).
- After every feature, **run the balance sims again** (Matt asks every time) and report the numbers in plain words.
- When a change ships, Matt usually wants a **short, sweet Telegram message** to send her.

## Game systems (where to look in src)
- **Data:**
  - `CROPS` (11 crops, by season)
  - `POTIONS` (base, wild forage and Hollow potions)
  - `FISH`, `FORAGE`, `MISC`, `ITEMS`
  - `UPGRADES`: watering cans can, can2, can3 (gold can, gated on the Hollow), cauldron upgrades pot2 to pot4, rod, sprinkler
- **Clock:** `S.time` is minutes since midnight. A day starts at 360 (6 am); `passOut()` is midnight (later with the lantern or the longday perk).
  - In `update()`, time moves `7.2 × paceMul()` game minutes per real second, and **only while she's busy** (queue, walking, acting, or a firebolt in flight). Standing still and open sheets both stop it.
  - `S.pace` is 'brisk' (×1, default), 'gentle' (×½) or 'slow' (×⅓), in `PACES`. Change it by tapping the clock in the HUD or "Clock speed" in the sleep sheet.
  - `S.clockTip` shows a one-time morning line about this.
  - The econ sims are energy-limited, so the clock pace doesn't change their numbers.
- **Calendar:** 28-day seasons (`DAYS`), 4 seasons, then a new year.
  - Spring debt is 3,000.
  - ★★★ earning targets: spring 16k, summer 35k, autumn 33k.
  - `CHARTER_Y1`, `charterDef`, `checkStars`, `seasonReview`, `headStart`
- **Villagers:** `VILLAGERS`
  - Ids: mara, fen, pip, odile, wren.
  - Fields: look, loves/likes/hates, bday, story per season, odd jobs, talk tiers, heart scenes at 2/4/6/8, heart gifts at 3/6, `arrive` season.
  - Functions: `heartsOf` (cap 8), `addFr` (cap 850), `talkTo`, `giveGift`, `portrait(v, mood, size)` (an SVG generator).
- **Life:**
  - `LOOKS` and `witchSVG` (the wardrobe)
  - `SPELLS` and `ONCE` (once-a-day spells), `castToday`/`markCast`. `manaMaxFor = 20 + 5 × spells`.
  - `FEST` and `FEST_DAY = 14` (festivals)
  - Letters: `LETTERS`, `BDAY_NOTES`, `THANKS`, `HEART_LETTERS`, `mailMorning`
  - Garden visits: `VISIT_SPOT`, `genVisits`
- **Old Wood:** `genWood`, `collectForage` (3 energy).
  - The grove opens after 12 finds.
  - The shrine refills mana once a day.
  - The cave is at grove tile (7,1).
- **Hollow:**
  - `MOBS`, `HOLLOW_BOTTOM = 15`, `hollowFloor`
  - `hollowMilestone`: Frost Ring at floor 5, satchel at floor 10, 1,500 coins at floor 15
  - `firebolt` (2 mana, retargets so no bolt is wasted), `frostRing` (6 mana)
  - Aggro range is 6 tiles.
  - `MANA_PER_KILL = 1`, `SPRING_FRAC = .1` (a cleared floor gives back 10% of max mana)
  - The lift offers floors 1, 5, 10 and 15, plus her deepest floor reached.
- **Saves:** see below.

## Gotchas found so far (important)
1. **Saves inside claude.ai are not safe on iPhone.** Safari partitions or wipes storage for the embedded artifact frame; she lost a save overnight that way. The GitHub site is the real home now. Don't steer her back to an artifact.
2. **`save()` only writes when `mode === 'play'`.** Before this, sitting on the title screen and then leaving (pagehide) overwrote a real save with a blank one. Keep that guard.
3. **Save format:**
   - localStorage key `brambleroot-save-v1`, `v:2`.
   - Every load goes through `migrate()`; v1 saves and pre-charter saves must keep loading (`tests/mig.js`).
   - New fields need defaults in migrate or at their use site.
4. **Save codes:**
   - `BRAMBLE2:` is deflate-raw (CompressionStream) plus base64, about 3.5 KB. `BRAMBLE1:` is plain base64 (legacy). Raw JSON is also accepted.
   - Phones mangle codes: the **"BRAMBLE" prefix got lowercased**, Telegram adds **line breaks**, and people paste **extra words** around a code.
   - `readCode` forgives all of that. `loadAny` lets **either restore box** take a code or a cloud name.
   - Keep `tests/savesuite.js` at 32/32.
5. **iOS zooms into inputs under 16px**, and the body has `touch-action:none`, so she can't pinch back out. Every input and textarea must be **16px or larger**, and nothing should auto-focus.
6. **Backup files:**
   - In claude.ai, the `downloads` capability is *unavailable* on phones (it says "Saving a file isn't available here").
   - On the site, `saveFile` shares a **text/plain `.txt`** file through the share sheet. Android won't share `application/json`.
   - If sharing fails, it falls back to an `<a download>` link.
   - Restore uses a hidden `#fileIn`.
7. **Cloud saves:** Firebase Firestore through the REST API (no SDK).
   - Project `brambleroot-80f9e`, owned by Matt's Google account.
   - Document `saves/{name}` with fields `data` (the code string), `updated`, `v`.
   - The security rules allow **get, create and update only**, for names of 12+ characters. There is **no delete and no list**: test docs can't be removed from the game; delete them in the Firebase console.
   - Names look like `word-word-word-NN` (`newCloudName`). `cleanCloudName` lowercases them and turns spaces into dashes.
   - When it pushes:
     - every 120 s of play
     - after `endDay`
     - on `visibilitychange` (hidden), with keepalive
     - 1.5 s after the game starts
   - `cloudOn()` is false inside claude.ai (`window.claude.use` exists there) and in builds with no keys.
   - A restored cloud save keeps its name; an imported code gets a new name.
8. **The `data-act` names on sheet buttons must be unique across all sheets.** One click handler runs an if/else chain, so a duplicate silently runs the wrong branch. That's how the fishing **Cast** button ran the spellbook's `cast`; the fishing action is now `fishcast`. Check with `grep -o "act === '[a-z0-9]*'" src/brambleroot.html | sort | uniq -d` (it should print nothing).
9. **`learnSpell()` refills mana to full.** It matters for balance and for simulation bots: the Frost Ring at floor 5 gives a free refill the first time.
10. Z-index: title 10, scrim 11, sheet 12, toast 13. Sheets must sit above the title, because restoring happens from the title screen.
11. Tutorial toasts can cover sheet text in screenshots. That's cosmetic.

## Testing
- Headless logic sims:
  - `python3 tests/extract.py` (run from the folder with brambleroot.html) writes `b.js`, the script only.
  - The sims `eval` it with a mocked DOM, replacing `"requestAnimationFrame(frame);\n})();"` with a line that exposes internals on `globalThis.__t`.
  - Examples: `sim7.js` (Hollow flow), `manasim.js` (mana per dive; the bot is idealized and sometimes plateaus around floor 6–7, so read it as relative), `econ4.js` (season economy), `mig.js` (old saves; needs `brambleroot.v10.bak`/`v12.bak`).
- Browser tests:
  - Playwright Chromium is preinstalled (don't reinstall it). Use `devices['iPhone 13']` and `devices['Pixel 7']`.
  - Build a test page with fake keys: `python3 build_site.py brambleroot.html local.html testkey test-proj`.
  - Mock Firestore with `ctx.route('**/firestore.googleapis.com/**', …)`; savesuite.js has a stateful mock.
  - Tests: `savesuite.js` (32 save checks), `clocktest.js` (12 clock checks on iPhone 13 and Pixel 7), `filetest.js`, `pastetest.js`, `fishtest.js`/`spelltest.js` (these need an exposed `__pond`/`__spells` hook; see how fishtest.html was made), `shot-save.json` (a realistic mid-game save, summer day 14).
  - A failed proxy connection to fonts.googleapis.com during tests is harmless.
- The sandbox can't reach `*.github.io`. Check a deploy with `gh run list -R mfleshner/brambleroot -L 1`, or with a real browser if one is linked.

## Deploy
1. Edit `src/brambleroot.html`.
2. Run the sims and tests.
3. Rebuild `index.html` with the keys.
4. Commit as **`Claude <noreply@anthropic.com>`** (a hook rejects other authors) and push to `main`.
5. Wait for the Pages run to succeed. She needs to fully close and reopen the home-screen app, and the Pages cache can take about 10 minutes.

## History (short)
1. One-evening prototype.
2. Seasons and years, portraits and hearts, charters with 3 stars and carry-over, 28-day seasons.
3. Village life: festivals, letters, garden visits. The spellbook, the Old Wood, the wardrobe.
4. The Hollow (combat).
5. Saves: lost-save fixes, codes, files, then the GitHub site and Firebase cloud saves.
6. Fixes:
   - mana in the Hollow: mana back per kill and per cleared floor, and the lift remembers her deepest floor
   - fishing Cast button
   - restore-box forgiveness
7. Clock: pauses while she stands still, plus a Brisk/Gentle/Slow pace setting (Nov 8, 2026).

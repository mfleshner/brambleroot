# Brambleroot: handoff notes

A cozy witch farming game (Stardew-like), built for Matt's wife. She plays it on her **iPhone** (Safari, added to the Home Screen). Matt tests on **Android**. Read this file fully before changing anything.

- Live site: https://mfleshner.github.io/brambleroot/ (GitHub Pages, deploys from `main` root)
- The villager plan (**PLAN-villagers.md**) is finished: all three parts shipped Nov 8, 2026.
- **Next: PLAN-hollow.md** (the deep Hollow, 100 floors plus the Endless Below, in 3 parts). Decided Nov 8, 2026; no part built yet. Start with Part 1.

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
  - `UPGRADES`: watering cans can, can2, can3 (gold can, gated on the Hollow), cauldron upgrades pot2 to pot4, rod, sprinkler, sprhead
- **Garden tools (Nov 8, 2026):**
  - Silver sprinkler heads (`UPGRADES.sprhead`, 1,000 coins, from summer year 1, `S.up.sprhead`): every sprinkler waters all 8 beds around it instead of 4. `sprReach()`, `sprBeds()` (text), drawn with a silver top and a wider spray. The brass sprinkler's `desc` is a getter so its text follows.
  - Trowel (`S.sel === 'trowel'`, a row at the top of the seed pouch): tap a plant to dig it up (`dig` in `predict`/`doField`). A seed with `d === 0` goes back in the pouch; otherwise it's just cleared. The bed stays tilled and watered. Ripe crops are harvested instead, sprinklers still pick up, empty soil gives a toast (`nodig`). Dragging never digs. No energy cost.
  - Notice board stays open after Give: the card turns into a thank-you card in the same spot (`boardOrder`, `boardDone`, cleared when the board opens or closes). Heart gifts list on the card; a heart scene waits behind "See the N-heart scene" (`boardscene`), which has "Back to requests" (`boardback`) and keeps the scroll position.
- **Clock:** `S.time` is minutes since midnight. A day starts at 360 (6 am); `passOut()` is midnight (later with the lantern or the longday perk).
  - In `update()`, time moves `7.2 × paceMul()` game minutes per real second, and **only while she's busy** (queue, walking, acting, or a firebolt in flight). Standing still and open sheets both stop it.
  - `S.pace` is 'brisk' (×1, default), 'gentle' (×½) or 'slow' (×⅓), in `PACES`. Change it by tapping the clock in the HUD or "Clock speed" in the sleep sheet.
  - `S.clockTip` shows a one-time morning line about this.
  - The econ sims are energy-limited, so the clock pace doesn't change their numbers.
- **Calendar:** 28-day seasons (`DAYS`), 4 seasons, then a new year.
  - Spring debt is 3,000.
  - ★★★ earning targets: spring 16k, summer 35k, autumn 33k.
  - `CHARTER_Y1`, `charterDef`, `checkStars`, `seasonReview`, `headStart`
- **Villagers:** `VILLAGERS` (15 since Part 1 of the villager plan)
  - Ids: mara, fen, pip, odile, wren, rowan, silas, theo, isolde, juno, hettie, aldous, zara, bertram, tilly. Pip and Tilly are kids: friend only, never dance partners.
  - Friend only (`romance:false`): fen, pip, hettie, aldous, bertram, tilly. `canRomance(v)`.
  - Fields: look, loves/likes/hates, bday (no two share one, none on day 14), `place`, story per season, odd jobs, talk tiers, heart scenes at 2/4/6/8, heart gifts at 3/6, `arrive` season. Story requests only post in year 1.
  - `place` groups the village list under `PLACES` (square, inn, row, mill, river, lanes). Part 3's schedules can reuse these.
  - `arrive`: Silas autumn, Zara and Wren summer, everyone else spring.
  - Zara has `market:true`. Her cart comes on days 5, 12, 19 and 26 (`marketDay()`), plus festivals. `inValley(v)` is true only when someone is around; it gates garden visits, chat and gifts. `nextMarket()` names her next day.
  - Heart gift kinds: sprinkler, rod, lantern, energy, almanac, bell, hive (the original five), plus `discount` (Rowan: `S.upDisc`, 10% then 25% off upgrades through `upCost(up)`), `coins`, `items`, `seeds` (`seedGift(n, rare)`). The new ten give one-off items or coins, not permanent perks, to protect the economy.
  - Heart letters at 4 hearts (`HEART_LETTERS`) can also give `items` and `sprinkler`.
  - Aldous has a special talk line about this season's charter stars (in `talkTo`).
  - Portrait styles: scarf, cap, messy, bun, curls, plus short, long, braid, ponytail, pigtails, wisps, wrap, beanie. Options: beard, moustache, glasses, earrings, freckles, flour, apron (true or a colour).
  - Festivals: every villager needs a line in all four `FEST[i].lines`, and every adult needs a `dance` line.
  - Functions: `heartsOf` (cap 8, or 10 for her partner), `addFr` (cap 850, or 1050 for her partner; points above a cap are kept, never trimmed), `talkTo`, `giveGift`, `portrait(v, mood, size)` (an SVG generator).
  - **Romance (Part 2):** `ROMANCE[v]` holds every romance line (yes, s9, s10, bye, propose, vow, date, wed, morn, bday). `isPartner(v)` = dating or spouse.
    - State: `S.dating` (one at a time), `S.wedding = { v, at }` (engaged; `at` is an `absDay()`), `S.spouse`, `S.weddingDay = { y, s, d, at }`. Migrate needs nothing: newState defaults are null.
    - Hearts 9 and 10 show padlocks (`hearts(n, v)`) until dating. Scenes 9/10 come through `nextScene` for the partner.
    - Moonpetal Bouquet: Market buy tab, 200 coins, shows once anyone romanceable is at 6+ hearts (`bouquetOnSale`). Give at 8 hearts (`giveBouquet`).
    - Kind goodbye (`kindGoodbye`, act `goodbye` → confirm sheet → `byeyes`): ends dating, keeps all points. Not allowed once engaged.
    - Witch's Ring: brewed overnight at the cauldron from `RING_NEED` (1 crystal + 1 starshard), only while dating. It's in `ITEMS` but not `POTIONS` (so it never counts for potion variety or head starts). `NOGIFT` keeps bouquet and ring out of gift, fair and swap lists.
    - `propose` at 10 hearts. `weddingAt()`: the next festival day or 3 days later, whichever is sooner.
    - Wedding: full-screen `#wed` overlay (z-index 14) with `sheetOpen = 'wedding'`; `maybeWedding()` runs when the morning (or gift) sheet closes and on load. `closeSheet` ignores it. Buttons use `data-wact`.
    - Married life: `romanceMorning(lines)` in `endDay` (after sprinklers): greeting every morning (`morn` or `GREET`), birthday breakfast, anniversary (+1 Starshard), and `SPOUSE_HELP[v]` on 60% of mornings. Spouse is in the garden 80% of days (`genVisits`, `spouse:true`, 7 am to 8 pm). Spouse is always `inValley` (Zara included). Spouse friendship can't drop. Energy and mana may go over max for the day; HUD bars clamp.
  - **Schedules and the village (Part 3):** `SCHED[v]` (day list, optional `rest` for days 7/21/28, optional `wet` rain swaps), `where(v, t, d, wet)` returns a `VPLACES` key, 'garden' (a visit in `S.visits`), 'cottage' (spouse at home), 'home' or 'away'. Rain sends outdoor people indoors (default the inn). Festival evening (from 5 pm): everyone in the square.
    - `canMeet(v)`: chat, gifts, bouquet, ring and goodbye buttons need her in the village (for village places) or on the farm (garden/cottage). The sims call `talkTo`/`giveGift` directly, so they're unaffected. The villager page shows where someone is, until when, and a "Go to…" button (`seekVillager`) that walks her there.
    - Village scene `S.scene === 'village'`: `VB` buildings, `VSPOTS` standing spots per place ([villager c, r, her c, r]), `villageFolk()` (extras and rainy indoor places show as a count over the door; tapping a building opens the `place` sheet). The board opens the calendar. Exit signpost at (4,12). The farm gate now opens a `gate` sheet: village or Old Wood.
    - Gift notebook: `notebook(v)` on each page (from `S.known`), `notebookCount()` on the village list. Calendar sheet `calendar` (`calSeason`), opened by tapping the date in the HUD (`#calBtn`) or the village board.
    - Tests: `schedsim.js` (headless, ~2,990 checks), `villagemaptest.js` (25 phone checks + screenshots; the Pixel "tap someone by the inn" check is occasionally flaky on timing, rerun it). `romancetest.js`/`villagetest.js` now put Rowan, Fen and Zara in the garden all day so they can be chatted with.
    - Square and docks have 8 and 6 standing spots (extra ones for group events). The mill's stand tile is (2,2), so it's no longer a villager spot.
  - **Story quests (Part 3):** `QUESTS` (secret, brews, goat, lamp, deep, archive), state `S.quests[id] = { s, at, done }`.
    - Step kinds: `{ v }` meet (v may be a list), `{ v, give }` bring, `{ at, need, after, give }` at a village place, `{ floor }` reach a Hollow floor (`questHollow` in `hollowFloor`). `give.pick` is item ids or 'crop'/'forage'/'potion'; `qTake` uses the cheapest first. The last step's text is the ending; `reward` pays then (`questReward`).
    - `questMorning` (in `endDay`) unlocks stories when `when()` is true and announces them. No deadlines.
    - UI: story cards on villager pages (`questsFor`) and place sheets (`questsAt`), `qscene` sheet, Journal **Stories** tab (with Go buttons: `seek`, or `goplace` → `seekPlace(p)`, which walks through the gate).
    - Hettie's ending teaches **Bramble's Charm** (`SPELLS.kin`, 15 mana, once a day: +15 friendship with everyone she chatted with today). The lamp story lights the lighthouse (`lampLit()`, part of `bgKeyNow` in the village; it's drawn dark and cracked until then).
  - **Group events (Part 3):** `EVENTS` picnic (spring 21, square, 11–2, needs 3 villagers at 4+ hearts, guests are those friends), bonfire (summer 21, docks, 7–10 pm), supper (winter 21, inn, 6–9 pm). Once a year each (`S.events['<id>y<year>']`).
    - `eventMorning` sends the host's invitation 2 days before and sets `S.evToday = { id, key, who }` on the day (fixed in the morning). `where()` puts the guests at the place in its hours (rain moves outdoor ones to the inn); `genVisits` leaves guests out of the garden.
    - She joins from the place sheet (`evjoin` → `joinEvent`): everyone there +60 friendship, a small treat, about 2 hours pass. The calendar shows each event and a "Go to" card on the day. Picnic blanket and bonfire are drawn in the village (`drawEventProp`).
    - Tests: `questsim.js` (headless, ~390 checks, plus when stories open for a busy and a social player), `questtest.js` (13 phone checks per phone + screenshots).
  - The winter "befriend" star is **6 villagers at 5+ hearts** (`req.friends`, +1 per year), not "every villager".
- **Life:**
  - `LOOKS` and `witchSVG` (the wardrobe)
  - `SPELLS` and `ONCE` (once-a-day spells), `castToday`/`markCast`. `manaMaxFor = 20 + 5 × spells`.
  - `FEST` and `FEST_DAY = 14` (festivals)
  - Letters: `LETTERS`, `BDAY_NOTES`, `THANKS`, `HEART_LETTERS`, `mailMorning`
  - Garden visits: `VISIT_SPOT`, `VISIT_STAND`, `VISIT_LINES`, `genVisits` (1 to 3 visitors a day, a proper shuffle, and no two sharing a spot or standing tile)
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
- **Play time:** `S.play = { first, last, sessions, days:{ 'YYYY-MM-DD': seconds } }` (her local dates, last 120 days), counted by `trackPlay()` in `frame()` from wall-clock time, only while playing and visible; `startGame` counts sessions. Matt has a standalone `brambleroot-stats.html` (not in this repo, so it isn't published) that lists every cloud save with a Google access token, or looks saves up by name, and reads this field. Keep `S.play`'s shape stable.
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
  - Village checks:
    - `villagercheck.js` (headless): every villager has all fields, valid items, in-season story items, unique birthdays, portraits in every mood, and festival, letter and visit lines.
    - `yearsim.js` (headless): 2 years of sleeping, visits, Zara's days, festival renders and every villager page.
    - `villagetest.js` (18 phone checks, grouped list, Zara's days).
    - `romancesim.js` (headless, 144 checks): hearts and padlocks, bouquet rules, goodbye, ring, wedding dates, wedding overlay, 2 years married, every spouse's help, saves.
    - `spousesim.js` (headless): value of each spouse's help per season against the charter earning goals.
    - `romancetest.js` (36 phone checks, iPhone 13 and Pixel 7): bouquet → dating → ring → proposal → wedding → married morning. Pass a folder for screenshots.
    - `gallery.js` writes gallery.html with every portrait in every mood; screenshot it to eyeball new faces.
  - `choretest.js` (headless, 39 checks: sprinkler heads, trowel, board) and `choreshots.js` (13 phone checks + screenshots).
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
8. Villager plan, Part 1: ten new villagers, a village list grouped by place, 1 to 3 garden visits a day, Zara's market days (Nov 8, 2026).
9. Villager plan, Part 2: 10 hearts, dating, the kind goodbye, the Witch's Ring, weddings and married life (Nov 8, 2026).
10. Villager plan, Part 3: schedules, the walkable village, gift notebook, calendar, six story quests and three group events (Nov 8, 2026).
11. Play-time tracking in the save, for Matt's stats page (Nov 8, 2026).
12. Silver sprinkler heads, the trowel, and the notice board staying open after Give (Nov 8, 2026).

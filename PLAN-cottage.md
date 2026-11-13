# Brambleroot: the cottage, inside (plan)

Matt's idea (Nov 12, 2026): cottage decorations. She buys furniture and things and places them herself.

Claude's choices (Matt to confirm, see "Open questions"):
- **She can walk inside the cottage** for the first time. It's a room like the shop's: `S.scene === 'home'`, 9 × 13 tiles.
- **Bramble's things are still up in the attic** under dust sheets. A story in Part 3 brings them down one at a time with villagers' help, the same way the shop was restored.
- **Mostly for looks, with one small perk**: a cosy room adds a little morning energy (at most +10). It never touches charters, and an empty cottage stays fine.
- **3 parts**, deploying after each. Her save must load at every step.

## Design rules (from CLAUDE.md, applied here)
- Tap only, portrait, big targets. **No dragging.** Placing a piece takes two taps: pick it, then tap where it goes.
- Nothing can be lost or broken. Putting a piece away always returns it to her storage. Every piece can be moved any time, for free.
- The room never blocks the daily routine: sleeping stays **one tap** away, as it is now.
- It feeds the relationship side: villagers notice the room, her spouse lives in it, and friends come round for tea.

## Where things live
- **The way in:** tapping the cottage still opens the Sleep sheet, which gets a new top row, **"Go inside"** (act `gohome`). She has slept from that sheet every night for months, so the habit stays. Inside, the bed also opens the Sleep sheet.
- **The room** (`buildHome`, `drawHomeDynamic`, reusing the shop's room drawing helpers):
  - Back wall (row 0): the window (shows the time of day and the season), the fireplace at (4,0), **wall slots** at c1–3 and c5–7 for paintings, clocks, garlands and shelves.
  - Fixed pieces she can't move: the **bed** (c6–7, r1–2), the **fireplace**, the **door** (4,12). Everything else is hers.
  - The floor is tiles c0–8, r1–11, apart from the bed and a clear path from the door (`HOME_PATH`, so she can always walk in and reach the bed).
  - Layers: **floor** (wallpaper and boards, room-wide), **rugs** (under everything, 2×2 or 3×2), **furniture** (1×1, 2×1, 1×2, 2×2), **on-top** (a lamp or plant on a table or shelf), **wall** (back-wall slots).
- **The cat** has a real place at last: she naps on the cat bed, the rug or the bed by the fire (picked each morning), and follows her round the room a little.
- **Her spouse** (`where() === 'cottage'`) stands in the room when home, on a free tile near the fire. Tapping them opens their page, as in the garden.

## Decorating (tap only)
1. The **Decor** button (bottom tray inside the cottage, `#bDeco`, in place of Board) turns on decorate mode: the clock stops, a faint grid shows, and free tiles glow.
2. **Tap an empty tile** → the `deco` sheet: what she owns that fits there, grouped by tab (Furniture, Rugs, Wall, Lights, Plants, Odds and ends). Tap one to place it with its top-left corner on that tile. If it doesn't fit, the sheet greys it out with the reason ("needs 2 × 2 of floor").
3. **Tap a placed piece** → a small card: **Move** (the piece lifts and glows; tap its new tile), **Turn** (left/right facing, for pieces that have one), **Put away**.
4. **Tap a wall slot** → the wall things she owns.
5. **Done** ends decorate mode and saves.
- Wallpaper and floor are chosen from the `deco` sheet's **Room** tab. They swap instantly and can be swapped back free.
- Owned counts: `S.home.own[id]` (how many she has); placed: `S.home.at` [{ id, c, r, f }] (f = facing). A piece in storage is `own − placed`.

## The catalogue (about 70 pieces by Part 3)
Pieces sit in **styles** (Rustic, Witchy, Cosy, Fancy, Seaside, Seasonal) for villager comments and a few sets. Prices are coin sinks for a year-2 player who has the shop; nothing is needed for anything.
- **Mara's Woodworks** (the mill's place sheet, Part 1): tables, chairs, benches, a dresser, bookcases, a wardrobe, a cat basket, plant stands, rugs, wallpapers and floors. 120 to 1,200 coins.
- **Rowan's forge** (Part 1): lanterns, a wood stove, iron candlesticks, a weather vane for the mantel, a brass bed frame (swaps the bed's look). 200 to 1,500.
- **Isolde's linens** (the inn, Part 2): rugs, quilts (swap the bedspread), cushions, curtains (swap the window's look). Woollen ones later take **yarn** from the barn plan; until then they're coins only.
- **Zara's Curios / cart** (Part 2): two far-off pieces a week from `ZARA_DECO` (a Seaside globe, a lacquered screen, a brass telescope…), hashed by week like her road stock. 600 to 2,500.
- **Festival prize stall** (Part 2): one piece per festival for tickets (a maypole ribbon garland, a lantern string, a harvest wreath, a star mobile), 20 tickets each. A new use for spare tickets.
- **From her own garden** (Part 2): potted plants, one per crop, made at the Kitchen-tab style "Pot it" row from 1 of that crop plus 40 coins. Potted Glowcap glows at night.
- **Things she already has** (Part 2, no cost): a **relic cabinet** (shows her Hollow relics), a **keepsake mantel** (shows up to 6 heart-quest keepsakes), a **ribbon board** (festival ribbons), her **wardrobe treasures** on a stand. These read from existing state, so they fill in as she earns them.
- **Bramble's attic** (Part 3, the story): eight of Bramble's own pieces, which can't be bought.
- **Hew** (Part 3): a huge, smug portrait of himself, mailed uninvited. "Hang it somewhere prominent." She can put it in storage. He notices (one line).

## Cosiness
- `cosy()` scores the room: each placed piece is worth 1 to 4 points (`HOME_COSY`), lights count double after dark, and a full style set adds 5.
- Levels Bare, Homely, Snug, Cosy, Perfectly cosy at 0 / 15 / 35 / 60 / 90 (`COSY_LEVELS`).
- Waking up: +2 / +4 / +7 / +10 energy above the usual start (inside `maxEnergy`, so it isn't the over-max kind). The morning sheet says so in one line. Balance check: econ4 with the bonus should come out at about +1 to 3% of a season, since beds rather than energy cap a good player past early spring.
- Shown on the Sleep sheet as hearts-style dots, with "Add a few lights" style hints.

## Visitors and tea (Part 2)
- **Comments:** a garden visitor or a villager chatted to in the village sometimes mentions the room (`HOME_TALK[v]`: 3 lines each, all 18, plus one per style they love, `V.decoLikes`). Only ever nice.
- **Tea:** once the room has a table and two chairs, a villager's page offers **"Invite round for tea"** (needs 2+ hearts, they're `inValley`, once a day). The next free hour they're in the cottage, sitting at her table. Tapping them: +40 friendship, +60 if a piece in their favourite style is out, one line, about an hour passes. Spouses and best friends say yes any day; others are busy on their work days (from `SCHED`).

## The parts

### Part 1: Inside the cottage (shipped Nov 12, 2026)
- As built: wall slots are columns 0, 2, 6, 7 and 8 (the window is column 1); 43 catalogue entries (29 pieces, 6 wallpapers, 5 floors, 3 beds) totalling 18,680 coins; the tray's Board button becomes **Decor** inside; she walks round furniture (breadth-first path); no planks or other materials yet, coins only.
- `S.scene === 'home'`: "Go inside" on the Sleep sheet, the room drawing (window by time and season, fire glow at night, rain on the window), the bed → Sleep sheet, the door → back to the garden on the stand tile (1,2). Loading still starts on the farm.
- Decorate mode, the `deco` sheet, placing, moving, turning, putting away, wallpaper and floor (6 of each; 2 free to start).
- Mara's Woodworks and Rowan's forge catalogues (about 30 pieces) on their place sheets (act `decobuy`).
- The cat on her spot; the spouse at home.
- A **starter set** already in the room on every save (her aunt's old table, two chairs, a rug, a lantern), so it doesn't look empty the first time.
- State `S.home = homeState()` (null in `newState`, filled at use; no migrate).
- Tests: `hometest.js` (headless: fit rules, the path from the door always clear, move/turn/put-away, counts, saves and old saves), `homephone.js` (iPhone 13 and Pixel 7 by tapping: Sleep sheet → inside → buy at the mill → place → move → put away → sleep from the bed, + screenshots).

### Part 2: Filling it up (shipped Nov 12, 2026)
- As built: Isolde sells an armchair, three rugs, bunting, four quilts and three curtains (quilts and curtains are new room kinds); Zara's two pieces a week show at her cart and in her Curios; the cosiness bonus lands on top of full energy, like a spouse's help; tea guests stay for the two hours and can be chatted to after tea.
- Isolde's linens, Zara's rotating pieces, festival prize pieces, potted plants from her own crops.
- The relic cabinet, keepsake mantel, ribbon board and treasure stand.
- Cosiness and the morning bonus; villager comments; tea.
- Lights glow at night (`homeGlows`, like `rowGlows`).
- Tests: `home2test.js`, `home2phone.js`; econ4 `{"cosy":4}` for the morning bonus.

### Part 3: Bramble's attic (shipped Nov 12, 2026)
- As built: Hettie, Mara, Rowan, Isolde, Bertram, Theo and Odile mend the eight things (Marigold sent her half of the portrait by post, so the story works in year 1); the ladder stands by the bed; the extension became a nook (a new row of floor either side of the door, 4,000 coins) instead of a side bay, because the room keeps its 9 columns.
- **The story** `QUESTS.attic` (host Hettie; cast Mara, Rowan, Isolde, Marigold from year 2): a ladder hatch above the bed that she's never noticed. Up there, eight of Bramble's things under dust sheets. Each is mended by someone: her rocking chair (Mara, 4 Wood finds), her brass kettle (Rowan, 300 coins), her patchwork quilt (Isolde, 3 crops), her star chart (Bertram), her cauldron-shaped clock, her spell-book stand, the portrait of Bramble young (Marigold, who has the other half), and her armchair (the last, a scene by the fire).
- Each mended piece comes with a short memory, like the shop's ledger pages, and goes into storage to place.
- **The extension** (Mara and Rowan, 4,000 coins, after the story): the room grows a nook on the left (an extra 2 columns of floor drawn as a bay with a window seat). Optional.
- **Hew's portrait** letter.
- **"Show someone"**: a button in decorate mode that saves a picture of the room and opens the share sheet (canvas to PNG, the same share path as `saveFile`), so she can send Matt her room on Telegram.
- Tests: `questsim.js attic`, `home3test.js`, `home3phone.js`.

## Balance targets (checked with the sims after every part)
- The whole catalogue costs about **30,000 coins** (Part 1 about 9,000), so it's a long, gentle sink in year 2. A year-1 player can afford a few pieces a season.
- The cosiness bonus adds **under 3%** to a good season.
- No charter, story or star ever needs a single piece.

## Save and code notes
- `S.home` = { own:{}, at:[], wall:'', floor:'', paper:{}, cosyAt } . Defaults filled at use.
- The scene is never saved as 'home'.
- New `data-act` names stay unique (gotcha 8): `gohome`, `decobuy`, `decoput`, `decomove`, `decoturn`, `decoaway`, `decotab`, `decodone`, `homeroom`, `teainvite`.
- `stats.html`: add pieces owned and the cosiness level to the player card.

## Open questions for Matt
1. Keep the Sleep sheet as the way in (my pick), or make tapping the cottage walk her inside, with the bed for sleeping?
2. The cosiness morning energy: in, or keep decor purely for looks?
3. Do Bramble's attic things belong here (Part 3), or would you rather this stay a shopping-and-placing update only?

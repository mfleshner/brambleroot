# Brambleroot: the barn (plan)

Matt's idea (Nov 12, 2026): a barn with animals that produce goods.

Claude's choices (Matt to confirm, see "Open questions"):
- **The farm map is full** (the field, the cottage, the well, the pond, the keepsakes), so the animals live in a new place: **the back meadow**, a 9 × 13 scene through the garden gate (`S.scene === 'meadow'`). The gate sheet gets "Out to the meadow".
- **Bramble kept animals once.** The old barn and coop are still standing, just tumbledown. A short story fixes them up (Mara, Rowan, Tilly).
- **Animals:** hens, ducks, goats, sheep and cows, plus one witchy one, the **Moon Hare**, in Part 3.
- **Gentle care.** Animals never get sick, never run away and never die. A missed day just means no goods. They're there to love, like the villagers.
- **3 parts**, deploying after each. Her save must load at every step.

## Design rules (from CLAUDE.md, applied here)
- Tap only, big targets. **Tap an animal to pet it**; tap a good on the floor to pick it up. Nothing to drag, nothing timed.
- **No game over, nothing punishing.** No hunger meter going red, no sad faces that guilt her. A hungry animal is simply "waiting for hay".
- **Not a money printer.** A full barn and coop should add a modest share to a good season, and help most in **winter**, when the field only grows frostmoss.
- Every animal has a **name** and **hearts**, which suits how she plays.

## Where things live
- **The back meadow** (`buildMeadow`, `drawMeadowDynamic`): grass, a fence, a duck pond (c6–8, r9–11), the **coop** (c0–2, r0–2, door (1,3)), the **barn** (c5–8, r0–3, door (6,4)), a **hay loft** door on the barn, a **trough** (4,6), the gate back to the garden at (0,12). Seasonal dressing like the farm; snow in winter.
- **Outside:** on dry days from spring to autumn, the animals are let out at 7 am (automatically) and wander the meadow (`grazeWander`, slow and calm). They graze, so they need no hay. In rain, snow, winter or after 6 pm they're inside.
- **Inside the coop and the barn** (`S.scene === 'coop'` / `'barn'`, small rooms like the shop): pens along the walls, each with the animal's name on a little board, a hay rack, and the goods on the straw.

## The animals
| Animal | Lives in | Costs | Gives | Every | Sells | From |
|---|---|---|---|---|---|---|
| Hen | coop | 400 | Egg | day | 30 | Part 1 |
| Duck | coop | 700 | Duck egg | 2 days | 70 (feather 40 at 4+ hearts, now and then) | Part 1 |
| Goat | barn | 1,800 | Goat's milk | 2 days | 120 | Part 2 |
| Sheep | barn | 2,200 | Wool | 3 days | 220 | Part 2 |
| Cow | barn | 2,600 | Milk | day | 110 | Part 2 |
| Moon Hare | coop | (story) | Moonfluff | 4 days, only after a clear night | 300 | Part 3 |

- The coop holds **4**, later **8**; the barn holds **4**, later **8**.
- Bought from **Mara** (hens, ducks, goats; she has Turnip and knows everyone's flocks) and a **drover** who comes through on Zara's market days (sheep and cows). Each comes with a suggested name (`ANIMAL_NAMES`, 3 choices plus "name it yourself", input 16px, never auto-focused).
- Numbers are a first guess: `barnsim.js` sets them so an animal pays for itself in about a season and a half of care.

## A day with the animals (all optional)
1. **Pet** each animal once a day: +affection, a happy hop, a little heart. Costs no energy; about 5 game minutes for the whole barn.
2. **Hay** only matters when they're indoors. The hay rack fills from the loft by itself (`S.barn.hay`). Hay comes from **cutting meadow grass** (tap a long-grass tile, 2 energy, 3 hay; it grows back in 3 days) or buying it from Mara (10 coins). The loft holds 120 (240 with the silo upgrade). Every animal eats 1 a day indoors. No hay: no goods that day, a gentle "waiting for hay" in the barn, and nothing worse.
3. **Pick up goods** by tapping them (inside, or on the grass if they were out). Uncollected goods wait; they don't spoil.
4. **Affection** `a.fr` 0–1,000 → 5 hearts. +15 a pet, +5 a fed day, +5 a day outside. A day without a pet is −5 at most, and never below the heart she's reached (same "no losing what you earned" idea as the spouse).
5. **Quality** by hearts: plain, **fine** (×1.25) at 3, **golden** (×1.6) at 5. Golden goods show a little star, like fish do.

## What the goods are for
- **Selling** at the stall, at Zara's, and on shop shelves (villagers' loves updated: Isolde cheese, Wren butter, Pip and Tilly eggs, Mara milk, Silas wool for lute strings…).
- **Cooking:** new Kitchen recipes (omelette, custard, cheese toast, milk pudding, egg-fried glowcap), all energy food, so they never make money (same half-ingredients rule as `DISHES`).
- **Machines** in the barn (Part 2), each a 1-night wait like the cauldron: the **churn** (milk → butter), the **cheese press** (milk or goat's milk → cheese, 2 nights), the **spinning wheel** (wool → yarn). Butter, cheese and yarn sell for about 2× their milk or wool.
- **The cottage plan:** yarn makes Isolde's woollen rugs and quilts.
- **The shop:** special orders and out-of-town buyers can ask for eggs, cheese and yarn (a new buyer, the **dairy cart**).

## The parts

### Part 1: The meadow and the coop
- **The story** `QUESTS.barn` (host Mara; opens from summer of year 1, or the next morning on later saves; a spring-year-1 save waits so the first season stays simple):
  1. Mara: "Bramble kept hens, you know. Out the back. Your coop's still there."
  2. In the meadow: the coop is falling down, the barn's roof has a hole you can see sky through. Clear 6 tiles of brambles (tap, 2 energy each).
  3. Rowan mends the coop: **600 coins**.
  4. Tilly brings straw and asks to name the first hen (she picks from three silly names; she's proud of it).
  5. Mara gives her **two hens**. Reward: the coop, the hens, a letter from Tilly.
- The meadow scene, the gate row, the coop inside, hens and ducks, petting, hay, cutting grass, goods, affection, quality.
- The `animal` sheet (tap a pen board): portrait, name (rename), hearts, what it gives and when, today's pet. The **Journal** gets an Animals row on the Almanac tab (`animals` sheet).
- State `S.barn = barnState()` (null in `newState`, filled at use; no migrate): `animals` [{ id, kind, name, fr, last, got, born }], `hay`, `grass` (tile regrowth), `up`, `mach`.
- `endDay`: `barnEndDay(lines)` after sprinklers: goods appear, hay eaten, a morning line ("Clover laid a golden egg").
- Tests: `barntest.js` (headless: the story, buying, goods by kind and day, quality, hay and no-hay days, rain and winter indoors, no losing hearts, saves and old saves), `barnsim.js` (balance), `barnphone.js` (iPhone 13 and Pixel 7 by tapping: gate → meadow → story card → clear brambles → coop → pet → collect, + screenshots).

### Part 2: The big barn
- The barn story step (Rowan and Mara mend the roof, **1,500 coins + 10 Wood finds**), then goats, sheep and cows, the drover on market days.
- The churn, cheese press and spinning wheel (Rowan, 800 / 1,200 / 1,000).
- New recipes (5 recipe cards on the Market buy tab, 2 from letters: Isolde and Mara), villager loves, shop orders, the dairy cart buyer.
- Tests: `barn2test.js`, `barn2phone.js`; `barnsim.js` with a full barn.

### Part 3: Babies, the Moon Hare and the fair
- **Babies:** an animal at 5 hearts with an empty pen in its building has a small chance each spring and summer morning (about once a season) of a baby: a chick, duckling, kid, lamb or calf. A morning scene; she names it (Pip and Tilly beg to help with the first). It grows up in 14 days.
- **The Moon Hare:** a story with Zara and Juno (it was seen near the Hollow's mouth on clear nights). A gentle night visit to the Old Wood with a carrot, three nights running. It comes to live in the coop and gives Moonfluff, a new potion ingredient (a "Moonfluff Draught", full energy at bedtime, once a week).
- **Best in Show** at the Harvest Fair: a new main-stage entry. She picks one animal; the score is its hearts, its golden goods this season, and a little luck. Tickets and a ribbon like the other games, and the animal wears its rosette in the meadow.
- **Helpers:** Tilly (after school, like Pip at the shop) or her spouse can see to the animals: petting, hay and picking up goods while she's away. Her spouse's `SPOUSE_HELP` gets an animals line.
- **Upgrades** (Rowan and Mara): bigger coop (4 → 8, 2,500), bigger barn (4 → 8, 4,000), a silo (hay 120 → 240, 1,500), a self-filling trough (outdoor water, cosmetic plus +5 affection a day, 1,000).
- **Hew:** a ninth curse, the **Grumpy Herd Hex** (goods every other day), only offered to a player with 3+ animals; broken like the others.
- Tests: `barn3test.js`, `barn3phone.js`, `festtest.js` for Best in Show bots, `hewtest.js` for the new curse.

## Balance targets (checked with the sims after every part)
- **A full coop (Part 1):** about +4 to 8% to a good season. **A full barn and coop (Part 2):** about +10 to 15%, and **+25 to 40% in winter**, where the farm is weakest.
- **Payback:** each animal pays back its price in about 1.5 seasons of normal care.
- **Time:** looking after a full barn and coop takes about 1 real minute a day.
- **No-hay days** cost only that day's goods.
- `barnsim.js` (headless) runs real barn code for a careful player (pets every day, keeps hay), a relaxed one (pets half the days) and one who forgets for a week, and reports coins per season next to econ4's farm baseline.

## Save and code notes
- `S.barn` defaults to `null`; old saves need nothing in `migrate`. The scenes are never saved as 'meadow', 'coop' or 'barn'.
- Goods go in `MISC` (egg, duckegg, feather, goatmilk, wool, milk, butter, cheese, yarn, moonfluff) with `q` for quality on the item key (`egg`, `egg_f`, `egg_g`), the way fish shows stars, or a quality map, whichever keeps `ITEMS` lookups simplest. Decide in Part 1.
- `orderPool` and `cartRoad` need to learn about goods only once a player owns the animal.
- New `data-act` names stay unique (gotcha 8): `gomeadow`, `animalopen`, `animalpet`, `animalname`, `animalbuy`, `hayload`, `cutgrass`, `machput`, `machtake`.
- `stats.html`: animals owned and the best hearts.

## Open questions for Matt
1. A new meadow scene through the gate (my pick, since the farm map is full), or squeeze a small barn onto the farm itself (smaller, fewer animals)?
2. Is hay too much like a chore for her? The alternative: animals always eat on their own, and petting is the only daily thing.
3. Babies: in or out? (They're the cutest part, but they mean naming and a growing-up timer.)
4. Which first, the cottage or the barn? I'd do **the cottage first**: it's smaller, it's pure cosiness, and the barn's yarn then has rugs waiting for it.

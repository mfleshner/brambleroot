# Brambleroot: the deep Hollow (plan)

Decided Nov 8, 2026. She wants **100+ floors**. Matt's choices:
- **100 designed floors with a finale, then the Endless Below** (101+).
- **A steady climb with Wardens** every 10th floor. Still tap to fire.
- **No companions.** Nobody joins her dives.
- **3 parts**, deploying after each.
Ship it in 3 parts, deploying after each one. Her save must load at every step, and her deepest floor and lift stops must carry over.

## Where the Hollow is today
- 15 floors, each one screen. 2 to 8 creatures (slime 1 hit, bat 2, beetle 3), tap to Firebolt (2 mana), Frost Ring at floor 5 (6 mana).
- A dive is limited by **mana**: about 40 mana gets her down 4 to 5 floors (`manasim.js`: average deepest floor 8 to 10).
- The lift stops at 1, 5, 10, 15 and her deepest floor.
- Rewards: Frost Ring (5), aunt's satchel with 2 Starshards and 500 coins (10), 1,500 coins (15).

### What breaks past floor 15 (the formulas grow with the floor)
| Formula | Floor 15 | Floor 100 |
|---|---|---|
| Energy lost per touch: `6 + floor` | 21 | 106 (instant faint) |
| Creature speed: `× (1 + .03 × floor)` | ×1.45 | ×4 |
| Crystal chance per kill: `.06 + .01 × floor` | 21% | 100% |
| Coin find: `10 × floor` | ~150 | ~1,000 per find |

So Part 1 replaces these with **per-band numbers** that level off.

## The shape: ten bands of ten floors
Each band has its own look (wall colours, crystals, light), 2 or 3 creatures, one new drop and one new potion recipe. Floor 10 of each band has a **Warden** (see below), and beating it opens a lift stop.

| Floors | Band | Creatures (idea) | New drop | Feel |
|---|---|---|---|---|
| 1–10 | Mossy Hollow (today's) | slime, bat, beetle | jelly, wing, shell | as now |
| 11–20 | Glowcap Grotto | puffcap, glowworm | spore | blue mushrooms, soft light |
| 21–30 | Crystal Caves | shard crab, prism sprite | prism | glittering, the crystal floor |
| 31–40 | Underriver | cave frog, eel | pearl | water and little bridges |
| 41–50 | The Roots | thornling, sapwisp | heartwood | the roots of the bramble itself |
| 51–60 | Ember Deep | salamander, cinder moth | ember glass | warm, glowing cracks |
| 61–70 | Frozen Reach | frost hare, ice wisp | rime | snow underground |
| 71–80 | Guild Ruins | lantern ghost, stone golem | old coin, relics | the old Guild's lost halls |
| 81–90 | Starfall | star moth, comet slime | stardust | night sky in the rock |
| 91–100 | Heart of the Bramble | the oldest creatures, all bands mixed | heartstone | the finale |
| 101+ | The Endless Below | bands repeat, a little tougher | stays rare | for after |

### Creatures stay tap-to-fire
Every creature is still "tap it to throw a Firebolt". Deeper ones get **one** simple, readable trait each, never a combo, for example:
- **splits** (a big slime pops into two small ones)
- **hides** (only glowing creatures can be hit; it glows every few seconds)
- **shy** (runs away, drops extra if caught)
- **shielded** (the first bolt knocks off a shell)
- **sleepy** (doesn't chase until hit)

The design rule "1 to 3 hits" holds for ordinary creatures. Wardens are the only exception.

### Wardens (every 10th floor)
- One big, slow creature (10 to 20 hits) with a few friends. Its moves are easy to see coming (it glows before it lunges).
- Beating it: a lift stop for the next band, a band reward (see Rewards), and a page of the aunt's journal.
- **No game over still holds.** Fainting keeps her loot, the Warden's health doesn't reset for that day, and from the second try a gentler "Warden is tired" version appears (half health).

## Pace and the lift
- Goal: once she's set up, a dive covers about **5 to 8 floors**, so reaching floor 100 takes roughly 15 to 25 dives. That's a goal for year 2, not a single season.
- Lift stops every 5 floors she has reached, shown as a tidy grid grouped by band (the current row of buttons won't fit 20+ stops).
- Mana is what makes deeper dives possible. Ways to grow it (pick in Part 2):
  - a few new spells (more spells already raise max mana by 5 each)
  - a **Hollow pouch**: 1 to 3 potions she can drink mid-dive with one tap (new mana or energy potions brewed from deep drops)
  - a mana upgrade bought with deep materials (like the gold can uses crystals)

## Rewards (keep the farm economy safe)
- Hollow coins and drop prices rise by band but **level off**, so diving never beats farming for the season charters. The sims will check the coins per dive against the charter goals, like `spousesim.js` does for spouses.
- What deep floors give instead of piles of coins:
  - **Relics** for a collection shelf in the cottage (one per band, plus rare ones): something to complete, not to sell.
  - **Wardrobe pieces** (a crystal circlet, a star cloak and so on): she cares about looks.
  - **Aunt Bramble's journal**: a page from each Warden, telling what the aunt was looking for down there. Floor 100 ends the story.
  - New potion recipes from the new drops (the cauldron and the market get variety).
  - Upgrade materials: a fifth cauldron and a better sprinkler or can could need deep drops.

## Ties to the village (no companions)
- Villager reactions: Juno, Bertram and Aldous comment on her deepest floor; letters at floors 25, 50, 75 and 100.
- The existing story quest **"deep"** has a step at floor 15. It must keep pointing at floor 15, not at the new bottom (`HOLLOW_BOTTOM` is used there today).

## Parts (one session each)

### Part 1: the engine and floors 1–30
- Band data (`BANDS`), per-band creature stats and counts, drawn per band. Replace the formulas that grow with the floor.
- Glowcap Grotto and Crystal Caves, their creatures and traits, drops and recipes.
- Wardens at 10, 20 and 30. Lift stops every 5 floors, as a grid.
- Floor 15's "bottom of the Hollow" text changes (it isn't the bottom any more); its 1,500 coins stay.
- `hollowsim.js`: a headless bot that dives to floor 30 at different mana levels. It reports dives needed, faints, and coins per dive against the charter goals.

### Part 2: floors 31–70 and growing stronger
- Underriver, The Roots, Ember Deep, Frozen Reach, and their Wardens.
- The mana growth from "Pace and the lift", the Hollow pouch, and the relic shelf.

### Part 3: floors 71–100, the finale, and beyond
- Guild Ruins, Starfall, Heart of the Bramble.
- Floor 100: the last journal page and the end of the aunt's story, a big reward, and a scene.
- The Endless Below (101+), with her record shown in the Journal.

### Every part
- Saves: new state in one place, `S.hollow = { wardens:{}, relics:{}, pages:{} }`, with defaults in `migrate`. `S.hollowMax` stays as it is.
- Run all the existing suites, plus `hollowsim.js`, and phone checks for the new sheets (lift grid, relic shelf).

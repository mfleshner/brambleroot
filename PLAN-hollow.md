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
Each band has its own look (wall colours, crystals, light), 3 creatures (see the roster below), one new drop and one new potion recipe. Floor 10 of each band has a **Warden** (see below), and beating it opens a lift stop.

| Floors | Band | Creatures | New drop | Feel |
|---|---|---|---|---|
| 1–10 | Mossy Hollow (today's) | Slime, Cave Bat, Stone Beetle | jelly, wing, shell | as now |
| 11–20 | Glowcap Grotto | Puffcap, Glowworm, Spore Slime | spore | blue mushrooms, soft light |
| 21–30 | Crystal Caves | Shard Crab, Prism Sprite, Geode Beetle | prism | glittering, the crystal floor |
| 31–40 | Underriver | Cave Frog, River Eel, Pearl Snail | pearl | water and little bridges |
| 41–50 | The Roots | Thornling, Sapwisp, Rootworm | heartwood | the roots of the bramble itself |
| 51–60 | Ember Deep | Salamander, Cinder Moth, Magma Slime | ember glass | warm, glowing cracks |
| 61–70 | Frozen Reach | Frost Hare, Ice Wisp, Snow Golem | rime | snow underground |
| 71–80 | Guild Ruins | Lantern Ghost, Stone Golem, Mimic Chest | old coin, relics | the old Guild's lost halls |
| 81–90 | Starfall | Star Moth, Comet Slime, Void Bat | stardust | night sky in the rock |
| 91–100 | Heart of the Bramble | Heartwisp, Bramble Hound, Elder Slime, plus all bands mixed | heartstone | the finale |
| 101+ | The Endless Below | bands repeat, a little tougher | stays rare | for after |

### Creature roster: 30 kinds and 10 Wardens
Today there are 3 (Slime, Cave Bat, Stone Beetle). The plan adds 27, three per band, so each band feels new. Earlier creatures still turn up deeper, mixed in, so floors get more varied as she goes down.

| Band | Creature | Hits | Trait | Drop |
|---|---|---|---|---|
| Mossy Hollow | Slime | 1 | hops | jelly |
| | Cave Bat | 2 | zigzags | bat wing |
| | Stone Beetle | 3 | slow | shell |
| Glowcap Grotto | Puffcap | 1 | sleepy | spore |
| | Glowworm | 2 | hides (hit it while it glows) | spore |
| | Spore Slime | 2 | splits into two Slimes | jelly |
| Crystal Caves | Shard Crab | 2 | shielded | prism |
| | Prism Sprite | 1 | blinks to a new spot | prism |
| | Geode Beetle | 3 | slow, drops extra crystals | crystal |
| Underriver | Cave Frog | 1 | leaps | pearl |
| | River Eel | 2 | hides (hit it when it surfaces) | pearl |
| | Pearl Snail | 3 | shy (runs off, rich drop) | pearl |
| The Roots | Thornling | 2 | sleepy | heartwood |
| | Sapwisp | 1 | shy | heartwood |
| | Rootworm | 3 | burrows (hides) | heartwood |
| Ember Deep | Salamander | 2 | dashes | ember glass |
| | Cinder Moth | 1 | comes in threes | ember glass |
| | Magma Slime | 3 | splits | ember glass |
| Frozen Reach | Frost Hare | 1 | shy | rime |
| | Ice Wisp | 2 | hides (fades in and out) | rime |
| | Snow Golem | 3 | shielded | rime |
| Guild Ruins | Lantern Ghost | 2 | hides (hit it while lit) | old coin |
| | Stone Golem | 3 | slow, shielded | relic chance |
| | Mimic Chest | 2 | sleepy (looks like treasure), drops coins | old coin |
| Starfall | Star Moth | 1 | comes in threes | stardust |
| | Comet Slime | 2 | splits | stardust |
| | Void Bat | 3 | blinks | stardust |
| Heart of the Bramble | Heartwisp | 1 | shy, rare drop | heartstone |
| | Bramble Hound | 3 | dashes | heartstone |
| | Elder Slime | 3 | splits | heartstone |

Wardens (floor 10 of each band):

| Floor | Warden |
|---|---|
| 10 | Old Mossback, a huge beetle |
| 20 | The Great Puffball, which puffs out Puffcaps |
| 30 | The Crystal Queen, a shielded crab |
| 40 | Old Whiskers, a giant cave catfish that dives and surfaces |
| 50 | The Briar Knot, roots that pop up around the room |
| 60 | Emberback, a lava tortoise |
| 70 | The Rime Owl, which fades in and out |
| 80 | The Clockwork Steward of the Guild |
| 90 | The Moon Moth, with a swarm of Star Moths |
| 100 | The Heart of the Bramble. It is calmed, not killed: the cozy ending to the aunt's story. |

After 100, the Endless Below picks bands at random, with a Warden rematch every 10 floors.

**Keeping 27 new creatures buildable:**
- **Shared body shapes.** Each creature is drawn from a few body shapes (blob, flyer, crawler, wisp, golem), with its own colours and one or two features (eyes, shell, cap, glow). They aren't 27 separate drawings.
- **Traits are written once and reused:** hops, zigzags, slow, sleepy, hides, splits, shielded, shy, blinks, dashes, leaps, comes in threes.
- **One trait per creature,** shown by how it looks or moves, plus a one-line tip the first time she meets it (for example, "Glowworms can only be hit while they glow").
- **A bestiary in the Journal** fills in as she meets each creature. It gives her one more thing to complete, and it's where those tips live.

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
- Mana is what makes deeper dives possible. Decided Nov 8, 2026:
  - **A floor never costs more mana deeper down** (creature counts and hits stay level). Part 1.
  - **Lift stops every 5 floors**, so she never re-fights old floors. Part 1.
  - **A mana spring on every 5th floor**: a quarter of her mana, once a dive. Part 1.
  - **Mana potions** brewed from deep drops, up to 3 in a **Hollow pouch**, drunk with one tap. Part 2.
  - **Crystal Focus** upgrades at the Market (coins + band materials), +10 max mana each, about 45 → 90 by the late floors. Part 2.

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

### Part 1: the engine and floors 1–30 — DONE Nov 8, 2026
Shipped as planned, with these choices:
- Mana: a floor never costs more as she goes deeper (bands 2+ have 3 to 6 creatures), lift stops every 5 floors, and a spring on every 5th floor. Potions and Crystal Focus wait for Part 2.
- Little Slimes from a split, and the Puffball's Puffcaps, give mana but no loot.
- `hollowsim.js` at 45 mana: about 7 dives from a new Hollow to beating the Crystal Queen, 5 to 8 floors per later dive, and about 1,200 to 1,450 coins of value per dive in every band.
- The bestiary lives on the rope lift sheet, not in the Journal.

- Band data (`BANDS`), per-band creature stats and counts, drawn per band. Replace the formulas that grow with the floor.
- Glowcap Grotto and Crystal Caves: 6 new creatures, their traits, drops and recipes. The shared body shapes and the trait code, and the Journal bestiary.
- Wardens at 10, 20 and 30. Lift stops every 5 floors, as a grid.
- Floor 15's "bottom of the Hollow" text changes (it isn't the bottom any more); its 1,500 coins stay.
- `hollowsim.js`: a headless bot that dives to floor 30 at different mana levels. It reports dives needed, faints, and coins per dive against the charter goals.

### Part 2: floors 31–70 and growing stronger — DONE Nov 9, 2026
Shipped as planned, with these choices:
- Mana Draught: 2 Slime Jelly + 1 Glowcap Spore, +15 mana, sells for 40 (less than its makings). Up to 3 a dive from the Pouch button, which takes the Board's place in the tray while she's in the Hollow.
- Crystal Focus I–IV: +10 max mana each (45 → 85), 1,200 to 4,000 coins plus band materials.
- Springs and cleared floors give back shares of her mana *without* Focus. With the full Focus share, a floor paid for itself and the bot's dives ran 30+ floors.
- Relic shelf from the Sleep sheet: 14 relics so far (7 from Wardens, 7 rare). Old saves get relics for Wardens already beaten.
- Letters at 25 (Juno) and 50 (Bertram, with 2 Mana Draughts); depth chat from Juno, Bertram and Aldous. Wardrobe pieces wait for Part 3.
- `hollowsim.js` (perfect-aim bot, 20 runs): at a flat 45 mana, about 17 dives from a new Hollow to beating the Rime Owl, 5 to 10 floors per later dive, 1,300 to 2,100 coins per dive. Buying Focus as it goes: about 12 dives. Focus plus 3 draughts every dive: about 7 dives, 9 to 24 floors and 3,200 to 5,400 coins per later dive (before the cauldron nights the draughts cost).

- Underriver, The Roots, Ember Deep, Frozen Reach: 12 new creatures, and their Wardens.
- Mana potions and the Hollow pouch, Crystal Focus upgrades, and the relic shelf.

### Part 3: floors 71–100, the finale, and beyond — DONE Nov 9, 2026
Shipped as planned, with these choices:
- The Heart is calmed, not fought: Firebolts turn to soft pink light on floor 100, it never moves, and its beat (a glow, then a ring) only costs energy if she stands close.
- Finale: a scene sheet with the aunt's last page, 5,000 coins, 3 Heartstones, 3 Starshards, the Heartseed relic and the Heartbloom. Hettie writes the next morning; Aldous writes at 75.
- Wardrobe pieces (from Part 2's list) are five treasures tied to Wardens 30, 70, 80, 90, 100, toggled at the mirror. Old saves get the ones they've earned.
- Endless Below: bands 0–8 repeat ten floors at a time in a fixed shuffled order, one more creature a floor, 30 energy a touch, and a Warden rematch every tenth floor (800 coins, no page). Record on the lift sheet and in the Almanac.
- `hollowsim.js` (20 runs, 45 base mana): about 29 dives from a new Hollow to calming the Heart with no Focus, about 18 buying Focus as it goes, about 10 with Focus and 3 draughts. Later dives level off at 1,200 to 2,000 coins (flat), 2,300 to 3,700 (Focus), 3,100 to 5,100 (Focus + draughts) in every band, the Endless Below included. Farm sims unchanged.

- Guild Ruins, Starfall, Heart of the Bramble: 9 new creatures, and their Wardens.
- Floor 100: the last journal page and the end of the aunt's story, a big reward, and a scene.
- The Endless Below (101+), with her record shown in the Journal.

### Every part
- Saves: new state in one place, `S.hollow = { wardens:{}, relics:{}, pages:{} }`, with defaults in `migrate`. `S.hollowMax` stays as it is.
- Run all the existing suites, plus `hollowsim.js`, and phone checks for the new sheets (lift grid, relic shelf).

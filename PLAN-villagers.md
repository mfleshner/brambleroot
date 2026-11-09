# Brambleroot: the big villager update (plan)

Decided Nov 8, 2026: build everything below. Every adult can be romanced, men and women.
Ship it in 3 parts, deploying after each one. Her save must load at every step, with no lost progress.

## The village: 15 people

### Current (5)
| id | Name | Role | Age | Romance |
|---|---|---|---|---|
| mara | Mara | Miller (widowed, goat Turnip) | mid | yes |
| fen | Old Fen | Ferryman | old | **no, friend only** |
| pip | Pip | Baker's kid | kid | **no, friend only** |
| odile | Odile | Schoolteacher | mid | yes |
| wren | Wren | Beekeeper, arrives in summer | young | yes |

### New (10)
| id | Name | Role | Age | Romance | Hook |
|---|---|---|---|---|---|
| rowan | Rowan (M) | Blacksmith | young | yes | Gruff but soft. Discounts on tool upgrades as hearts rise |
| silas | Silas (M) | Wandering musician at the inn | young | yes | Poetic, a little sad. Plays at every festival |
| theo | Theo (M) | Apothecary, rival potion-maker | young | yes | Nerdy. Trades rare potion recipes |
| isolde | Isolde (W) | Innkeeper, Kettle & Crow | mid | yes | Warm, knows all the gossip |
| juno | Juno (W) | Fisher and Hollow explorer | young | yes | Adventurous. Fishing and Hollow tips |
| hettie | Granny Hettie (W) | Old herbwife who knew the aunt | old | **no, friend only** | Story reveals the aunt's past |
| aldous | Mayor Aldous (M) | Runs the Guild charters | old | **no, friend only** | Reacts to her charter stars |
| zara | Zara (W) | Traveling merchant, Fridays only | mid | yes | Rare seeds and items stall |
| bertram | Bertram (M) | Old lighthouse keeper, Fen's friend | old | **no, friend only** | Sea stories, storm warnings |
| tilly | Tilly | Pip's best friend | kid | **no, friend only** | Mischief duo with Pip |

Decided Nov 8, 2026: the four elders (Fen, Hettie, Aldous, Bertram) are **not** romanceable, and neither are the kids (Pip, Tilly). Romanceable: Mara, Odile, Wren, Rowan, Silas, Theo, Isolde, Juno, Zara (9 people). Give the six friend-only villagers `romance:false`.

Every villager gets:
- a portrait (`look` for `portrait()`)
- loves, likes and hates
- a birthday (spread so no two share one)
- a seasonal story chain
- odd jobs and talk at three tiers
- heart scenes
- heart gifts (3 and 6)
- a garden visit spot

## Part 1: 10 new villagers (the base) — DONE Nov 8, 2026
Shipped as planned, with these choices:
- The winter star "every villager at 5+ hearts" became "6 villagers at 5+ hearts" (+1 per year).
- The new ten's heart favours are one-off gifts (items, coins, seeds), except Rowan's upgrade discount. All 15 favours together are worth about 7,000 coins once.
- "Fridays" are Zara's market days: days 5, 12, 19 and 26, plus festivals.
- Elders decided: friend only (see the note under the village table).

- Add the 10 entries to `VILLAGERS`, in the same shape as mara and the others.
- New items they reference are allowed, but keep them few. Prefer existing crops, forage, fish, potions and Hollow drops.
- `arrive`: most from spring year 1. Zara from summer, and only on Fridays (day % 7 === 5). Silas from autumn, arriving for the Harvest Fair.
- Garden visits: extend `VISIT_SPOT`/`genVisits` so 1 to 3 visitors come per day, chosen from the bigger pool.
- Village sheet layout: 15 people is too many for one list, so group them by place (see Part 3, Village scene). In part 1, only group the list.
- Odd-job board and season charters: the draw pool gets bigger. Check that the charter "befriend" goals don't get easier.
- Letters: add BDAY_NOTES, THANKS and HEART_LETTERS for the new people.
- **Migration:** `S.fr` is keyed by id, so new ids start at 0. Nothing else is needed. Add a test that a pre-update save still loads.

## Part 2: hearts, stories, marriage — DONE Nov 8, 2026
Shipped as planned, with these choices:
- Hearts 9 and 10 stay locked (padlocks) for everyone she isn't dating. Friendship points above the cap are kept, so a kind goodbye costs nothing and re-dating brings the hearts straight back.
- The bouquet shows at the Market once someone romanceable is at 6+ hearts, and disappears once she's married.
- The ring is brewed overnight (it takes a cauldron pot) and only appears while she's dating.
- Wedding date: the next festival day or 3 days after the proposal, whichever is sooner. The wedding plays after the morning sheet that day.
- "Birthday breakfast" is on the spouse's birthday. The anniversary gives a Starshard.
- Spouse help, tuned with `tests/spousesim.js`: about 5 to 6% of a year-1 summer or autumn earning goal for most spouses (about 4% in year 2). Rowan: +20 energy, waters up to 8 beds, fills the can. Silas: +20 mana (+30 energy without spells), about 3%. Theo: a potion worth 200 or less. Zara: 1 seed of the season's best crop. Odile's help is friendship only (+25 with 3 villagers), worth 0 coins.

- Hearts: romanceable people go to **10** hearts (`heartsOf` cap 8 becomes 10, and `addFr` cap 850 becomes 1050 for them). Everyone else stays at 8.
  - Hearts 9 and 10 are locked until dating starts. Show a padlock on hearts 9 and 10.
  - Heart scenes at 2, 4, 6 and 8 for everyone. Dating scenes at 9 and 10 for the person she's dating.
- **Moonpetal Bouquet:** sold at the market, about 200 coins. Give it at 8+ hearts to start dating, and only one person at a time.
  - To date someone else, give the current partner a "kind goodbye" talk first. It costs no friendship (cozy rule).
- **Witch's Ring:** brewed at the cauldron from 1 crystal and 1 starshard. Give it at 10 hearts while dating to propose.
- **Wedding:** happens at the next festival (`FEST_DAY` 14), or 3 days later if that comes sooner.
  - Full-screen scene: everyone attends, a few villagers say a line each, petals fall.
  - Add `S.spouse = id`, `S.weddingDay`.
- **Married life:**
  - Spouse sleeps in the cottage and has a morning greeting line (pool by season and weather).
  - Spouse appears in the garden most days.
  - About 60% of days the spouse helps. Each spouse has a specialty:
    - Rowan: repairs/upgrades a tool, or waters 6 beds
    - Juno: brings 2 fish
    - Isolde: brings a meal (+40 energy)
    - Theo: brings a potion
    - Wren: honey
    - Mara: flour/bread (energy)
    - Odile: letters/stories, +friendship with others
    - Silas: plays music (+mana)
    - Zara: a rare seed
  - Spouse talk tier 4: daily affectionate lines, birthday breakfast, anniversary each year.
  - No jealousy, no divorce. Spouse friendship can't drop.
- Balance: run the spouse help through the econ sims. Target: marriage worth about 5 to 8% extra per season. It's nice, not required.

## Part 3: extras (all of them) — DONE Nov 8, 2026
Shipped as planned, with these choices:
- Stories open at these friendships: Hettie 4 hearts; Isolde and Theo 3 each; Pip and Tilly 2 each; Bertram 4 and Fen 2; Juno 4 (once she has found the Hollow); Aldous 4. They never expire.
- Hettie's secret: Bramble was fined by the Guild for teaching magic to the villagers. The new spell page is Bramble's Charm (+15 friendship with everyone she chatted with that day, once a day).
- The lighthouse stays dark until the lamp story, then shines every night.
- Group events are on day 21 (a rest day): the picnic in the square, the bonfire at the docks, the lantern supper at the inn. Once a year each, with an invitation 2 days before. Rain moves outdoor ones into the inn.
- Story rewards together are worth about 2,650 coins once (about 3% of the year-1 earning goals), plus the spell.

1. **Daily schedules:** `where(v, day, time, weather)` returns a place: mill, school, inn, smithy, apothecary, docks, lighthouse, square, garden, or home (unavailable).
   - Rain moves people indoors.
   - Talk and gifts only work when you're where they are.
2. **Village scene:** a walkable village map, like the farm and the Wood.
   - Places: square with notice board, inn, smithy, apothecary, mill, school, docks/lighthouse path, and Zara's cart (Fridays).
   - Villagers stand at their scheduled spot. Tap one to talk or gift.
   - The farm gate leads to both the Wood and the village.
3. **Gift notebook:** records each person's loves, likes and hates once she discovers them by giving gifts. Shown on the person's page.
4. **Birthday calendar:** a season grid showing birthdays and festivals. Opened from the HUD or village board.
5. **Story quests:** multi-step chains with a small reward and a scene at the end:
   - Hettie: the aunt's secret, which ends in a new spell page
   - Theo and Isolde: "rival brews"
   - Pip and Tilly: "the lost goat", Turnip escapes
   - Bertram and Fen: "the lighthouse lamp"
   - Juno: "the deepest floor", ties into Hollow floor 15
   - Aldous: "the charter archive"
6. **Group events:**
   - a picnic: spring, needs 3+ villagers at 4+ hearts
   - a summer bonfire night
   - a winter "lantern supper" at the inn
   - Several villagers react together, and everyone present gets + friendship.

## After every part
- Run econ/sims again: charter stars still reachable but not trivial, and gift and odd-job income in line.
- Run savesuite.js (32 checks), mig.js (old saves), fishtest/spelltest, and a phone-sized Playwright run with screenshots of the new portraits and the village.
- Build: `python3 build_site.py brambleroot.html /home/claude/brambleroot/index.html <apiKey> <projectId>`. Commit as Claude, then push to main. Check the Pages run.
- Write a short Telegram note for her about what's new.

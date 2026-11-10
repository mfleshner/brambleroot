# Brambleroot: the festival overhaul (plan)

Matt's idea (Nov 10, 2026): festivals become real places she walks around, with mini games. Matt's choices:
- **The grounds open at 10 am** on day 14, and farm work that day is optional.
- **Tickets and a prize stall.**
- **Every game has a host with a score to beat.**
- **The four festivals only** for now (no smaller fairs in between).
Ship it in **3 parts**, deploying after each. Her save must load at every step.

## Today
Day 14 shows a card on the notice board. "Go to the festival" opens one sheet with a hello list (+30 friendship each) and one main thing: a dance partner (+150), a lantern wish, an entry for the judges (300 to 1,500 coins × year), or the secret gift swap (Starshard + 200). "Head home" ends the day at 10 pm. `FEST`, `festRender`, `festAct`, `festState` (`S.fest[key]`), `where()` puts everyone in the square from 5 pm.

## The festival day
- **Before 10 am:** an ordinary morning. A wedding set for the festival still happens that morning.
- **10 am to 10 pm:** the festival grounds are open. Everyone's `where()` is the festival place, at their own spot. Zara's cart is parked there as the prize stall.
- **It never rains on day 14** (snow is fine for the Star Feast).
- **Leaving:** she can walk back to the farm and return whenever she likes. At 10 pm she walks home under the lanterns (the old `endFestival` toast), and the day ends as today.
- Games cost **no energy**. Each play passes **30 game minutes**, so a full day fits about 20 plays.

## The grounds
The village map, dressed for the night, with its own decorations drawn per festival. Booths are tappable objects, like the buildings in the village scene today.

| Festival | Where | Dressing |
|---|---|---|
| Flower Dance (spring) | The square | Lanterns in the apple trees, flower garlands, a dance floor |
| Lantern Night (summer) | The docks and the river | Fen's ferry strung with lights, lanterns on the water |
| Harvest Fair (autumn) | The square | Stalls of gourds and pies, the judges' table, bunting |
| Star Feast (winter) | The square | Snow, the long table, star lanterns, the cider pot |

- **Tap a villager** to say hello: their festival line and +30, as today (`FEST[i].lines`, once each).
- **Tap a booth** to see its card: the host, what you do, her best, the host's score to beat, and Play.
- **The main event stays** where it was, as its own booth: the dance, the wish, the judging, the gift swap, with today's rewards.

## The games
All tap only, 30 to 60 seconds, played in a full-screen overlay (like the wedding). **You can't lose.** The score sets the tickets: **bronze 2, silver 4, gold 6**. Tickets only come from the first **3 plays of each game** per festival; after that she can play just for fun.

| Festival | Game | Host | How it plays |
|---|---|---|---|
| Flower Dance | The dance | her partner | Tap the flower that glows on the beat. Picking the partner is today's dance (+150). Slow, forgiving timing. |
| | Flower crowns | Pip and Tilly | Memory match: turn over pairs of flowers. |
| | Petal catch | Hettie | Tap the petals falling from the apple trees before they land. |
| Lantern Night | Firefly jars | Theo | Tap the drifting fireflies; golden ones count double. |
| | Duck scoop | Fen | Wooden ducks float past the ferry; tap to scoop the marked ones. |
| | Night fishing | Juno | Three casts of today's fishing game, scored by the size of the catch. |
| | The wish | — | Today's lantern wish. |
| Harvest Fair | Ring toss | Rowan | A swinging arm; tap to throw when it lines up with a peg. |
| | Catch Turnip | Mara | The goat darts between the stalls; tap her when she stops to eat something. |
| | Guess the gourd | Isolde | Pick the heaviest of three gourds, five rounds, with a hint each time. |
| | The judging | Aldous, Odile, Turnip | Today's entry for the judges. |
| Star Feast | Snowball toss | Odile | Tap the targets that pop up, like throwing a Firebolt. |
| | Star map | Bertram | Tap the stars in order to draw a constellation. |
| | Cookie icing | Wren | Copy her honey-cookie pattern by tapping the dots. |
| | The gift swap | — | Today's secret gift swap. |

Hosts are all there by their festival: Wren (summer arrival) only hosts in winter. Silas plays music at every festival from his arrival but hosts nothing.

## Scores to beat
- Each host has a best score for their game. It's a bit above gold, and goes up a little each year.
- Beating it: **a ribbon** for that game (one a year), +80 friendship with the host, and a short reaction line the first time.
- Ribbons are kept in a new **Festivals** page in the Journal: each festival, its games, her best, the host's score and her ribbons by year.

## Tickets and the prize stall
- Tickets are kept between festivals (`S.tickets`).
- **Zara's prize stall**, at every festival. In spring of year 1, before she arrives, Aldous runs the prize table for the Guild.
- Stock changes with the festival:
  - **Wardrobe pieces**, 2 per festival (8 in all): flower crown, petal shawl, lantern earrings, river-blue cloak, harvest ribbon hat, autumn scarf, star cloak, snowflake pin. Worn the same way as the Hollow treasures (`S.look.wear`).
  - **Garden keepsakes** at fixed spots on the farm (no placing them by hand): a maypole, a lantern post, a scarecrow, a star lantern.
  - **A festival recipe**, one per festival (a dish for the Kitchen).
  - **Rare seeds** for the season.
  - **One Starshard** per festival.
- Rough numbers to tune with the sim: a whole festival day pays about 40 to 60 tickets. Wardrobe 30–40, keepsakes 25, recipes 15, seeds 10, Starshard 25. (Shipped: 25 to 57 tickets a festival depending on how keen she is; wardrobe 25, keepsakes 15, recipes 10.) She should get one or two nice things each festival and the full set in about two years.
- **No new coins from games.** The four main events keep today's rewards, so the charters don't get easier.

## Save
- `S.fest[key]` gains `plays` (per game) and `best` (per game). `S.tickets` (0), `S.ribbons` (`{ game: [years] }`) and `S.prizes` (owned prize ids) need defaults in `migrate`.
- Old festival entries (with only `m`, `main`, `txt`, `home`) keep working.
- A festival already in progress when the update lands (her save sitting on day 14) should still open.

## The three parts
1. **The grounds — DONE Nov 10, 2026.** Shipped as planned, plus: scores to beat and ribbons are in from the start (the Journal page comes in Part 2); taking part in the main event pays 4 tickets; the festival recipes are in the stall from Part 1 (wardrobe pieces in Part 2, keepsakes in Part 3). Medal targets come from human-like bots (`festtest.js`). With one game a festival she earns about 10–22 tickets.
   The plan was: the 10 am to 10 pm day, everyone at the festival place, no rain, the four dressed maps, booths and hellos in the world, the game overlay, tickets, Zara's stall (and Aldous's table), and **one game per festival** so every festival has something new from the start: the dance, night fishing, ring toss and snowball toss. The other main events move to booths.
2. **Flower Dance and Lantern Night — DONE Nov 10, 2026.** Flower crowns (a 4×4 memory match), petal catch, firefly jars and duck scoop (only the red-star ducks count). The Festivals page is a row on the Journal's Almanac tab (a sixth tab would crowd the phone). The eight wardrobe pieces at 30 tickets each. With three games, a festival pays a keen player about 45–60 tickets and a relaxed one about 40.
3. **Harvest Fair and Star Feast — DONE Nov 10, 2026.** Catch Turnip, guess the gourd (eight rounds), star map and cookie icing (seven cookies). The four garden keepsakes. Prices came down a little once all twelve games were in (finery 25, keepsakes 15, recipes 10): each festival's one-off prizes cost 75 tickets, so a keen player collects a festival's set in about a year and a half, a relaxed one in about three.

**The plan is finished.**

## Every part
- Old saves load with nothing lost (`mig.js`, `savesuite.js` 32/32).
- `data-act` names stay unique.
- Headless tests for each game's scoring and the ticket and prize rules; phone checks on iPhone 13 and Pixel 7 that play every new game by tapping, plus screenshots.
- A ticket sim: how many tickets a festival pays for a casual player and a keen one, and how long the full prize set takes.
- The balance sims, since farm work on day 14 is now optional: econ4 for a season with a festival day spent at the festival.
- Update CLAUDE.md and this plan when a part ships, and a short Telegram message for her.

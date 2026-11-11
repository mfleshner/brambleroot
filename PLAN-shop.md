# Brambleroot: the shop (plan)

Matt's idea (Nov 11, 2026): a big shopkeeping expansion alongside the farm. She reopens her aunt's old shop and sells what she grows, brews, cooks and finds. Matt's choices:
- **The shop is her aunt's, in a new part of town**: Old Market Row.
- **She can run it herself, or leave it running** while she farms, fishes or dives.
- **Any day she likes**: a shop day, a farm day, or a bit of both.
- **A big expansion: 5 parts**, deploying after each. Her save must load at every step.

Claude's choices (Matt said "you decide"):
- The street is **Old Market Row**, a cobbled lane off the right side of the village square, mostly shut up since the market moved to the square.
- The shop is called **Brambleroot**: the old painted sign is still over the door. It's the game's name, and it was always her aunt's shop.
- **Odile** has the key (she was close to Bramble, and keeps the village's old keys at the school).
- The first helper is **Pip**: after school on school days, all day on rest days. Later her **spouse or a best friend** can mind it all day for a smaller cut.
- The other shopfronts on the row open in Part 5: **Zara's Curios** (her cart gets a home) and **the Little Bakery** (Mara, with Pip and Tilly).

## Design rules (from CLAUDE.md, applied here)
- Tap only, phone portrait, big targets. No timers that punish her: **customers wait patiently**, nobody storms out.
- **No game over, no required shop.** Every charter stays reachable without ever opening the shop.
- The shop is a **different way to spend a day**, not a money printer. Selling herself pays better than the farm stall but costs the day's time; leaving it with a helper pays less and costs nothing.
- Villagers are the customers, so the shop feeds the relationship side: they buy what they love, tip for it, and get fonder of her.

## Where things live
- **Old Market Row** (`S.scene === 'row'`): a 9 × 13 tile map like the village. The way in is a little arch at the right end of the village's lower path, tile (8,8), once the shop story has started.
  - Top: **Brambleroot**, tiles c2–6, r0–2, door at (4,2), stand (4,3). Boarded up until restored.
  - Four other shopfronts, boarded (left c0–1 at r4–6 and r8–10, right c7–8 at r4–6 and r8–10). Tapping one says who used to trade there. Part 5 opens two of them.
  - A little fountain in the middle (4,7), lamp posts, benches, planters. Seasonal dressing like the village.
  - The way back to the square: the signpost at (4,12).
- **Inside the shop** (`S.scene === 'shop'`): its own 9 × 13 room.
  - Back wall (row 0) with the window, Bramble's portrait and a clock. Her place is behind the counter at (4,1).
  - The counter, c2–6 on row 2, with the **ledger** at (4,2): tap it for the shop sheet (open up, close up, today's takings, restock).
  - **Shelves** along both walls: Part 1 has 6 (three each side, two tiles tall). Customers browse from the tile in front.
  - Customers wait in front of the counter on row 3 (up to five).
  - The door at (4,12) leads back out to the row.

## How a shop day works
1. **Stock the shelves.** Tap a shelf: put out up to 10 of one thing from the basket, take it back, and choose its price:
   - **Kind** ×1.05 of the farm-stall price: villagers who buy it get a little fonder of her.
   - **Fair** ×1.2 (default).
   - **Dear** ×1.45: about 4 in 10 customers put it back.
   - "Restock" on the ledger tops every shelf back up with its own item.
2. **Open up** (from the ledger), any time from 9 am to 6 pm. While the shop is open and she's in it, the clock runs (she's working), at her chosen pace.
3. **Customers** come in every 50 game minutes or so (less often in the rain). Most are villagers who are in the valley that day, each at most once a day; the rest are travellers off the road.
   - A villager heads for something they **love** if it's on a shelf, then something they **like**, otherwise anything.
   - They take 1 to 3, then wait at the counter with a bubble showing what they've got.
   - Sometimes a villager **asks for something that isn't out** but is in her basket (one of their loves or likes). Serving them takes it from the basket at the fair price.
4. **Serve** by tapping a waiting customer. Coins, a little line, friendship for villagers (more for a loved or liked thing), and a tip for loved (15%) or liked (5%) things.
5. **Close up** from the ledger, by walking out of the door, or at 6 pm when the last customer is served. Anyone still waiting is served on the way out. A short summary: customers, coins, who came in.

## Balance targets (checked with the sims after every part)
- A full day running the shop herself should earn roughly **20 to 30% more** than the same things fetch at the farm stall (it scales with what she stocks).
- Over a season, running it on 8 days should add **under 10%** to a good player's season, and even 16 days under about 20%.
- Part 1 results (`shopsim.js`): about 11 customers and 13 to 18 things a day; +21 to 30% over the stall (+250 to +750 coins a day by season); 8 days ≈ +3 to 9% of a season, 16 days ≈ +6 to 18% (autumn highest). Friendship about +100 a day across the village.
- Leaving it with a helper (Part 2) should pay **about half** of the premium of running it herself.
- `shopsim.js` (headless) runs the real customer code over whole seasons with realistic shelves and reports these numbers in plain words. `econ4.js` stays the farm baseline.

## The parts

### Part 1: Old Market Row and the restoration (shipped Nov 11, 2026)
- **The shop story** (`QUESTS.shop`, host Odile, cast Odile, Rowan, Mara), opening from summer of year 1 (or the next morning on a later save):
  1. Odile has found a key in Bramble's handwriting: "the shop". She sends her to Old Market Row.
  2. At the boarded shop: she unlocks it. Dust, fallen shelves, the counter, the old ledger with Bramble's last entry, and the faded BRAMBLEROOT sign.
  3. Rowan makes new hinges, a lock and a shop bell: **500 coins** (a new step kind, `pay`).
  4. Mara has planks in the mill loft for shelves, in trade for **8 crops**.
  5. Back at the shop with **4 Old Wood finds** to dress the window. The village turns up; she turns the sign to Open. Reward: the shop, plus friendship.
- **Old Market Row** scene, drawing, way in from the village (only once the story has started), and from the garden gate once the shop is restored.
- **The shop interior**, shelves, ledger, counter, door; customers walking in, browsing, waiting and leaving.
- **Running it herself**: open, stock, price, serve, close; the day summary. State `S.shop` (shelves, today's takings, who came in today, totals).
- Story steps at row places work like village places (`VPLACES[p].scene = 'row'`), including the Journal's Go buttons.
- Tests: `shoptest.js` (headless: the story, shelves, prices, customers, serving, closing, saves, old saves), `shopsim.js` (balance), `shopphone.js` (iPhone 13 and Pixel 7: story to the open shop, stock a shelf, open up, serve by tapping, close, screenshots).

### Part 2: Leaving it open (shipped Nov 11, 2026)
- **Helpers**: Pip (after school, all day on rest days; a small daily wage), then her spouse or a best friend at 10 hearts (all day, a smaller cut). Picked on the ledger.
- **Idle selling**: with a helper, the shop sells while she's away, at a slower rate and minus the helper's cut. Takings arrive in the evening; a morning note says how it went ("Pip sold 9 things and 40 coins of sweets have gone missing").
- The shop shown as open on the row with the helper behind the counter; walking in lets her take over.
- Tests and sims: helper days against running it herself and against the farm stall.

### Part 3: Making it hers (shipped Nov 11, 2026)
- **Upgrades** (coins and materials): more shelves (6 → 8 → 10), a display case in the middle of the room (dishes and potions sell at a better price), a painted sign, a window display (more customers), a bell over the door.
- **Decor** from festival prizes and keepsakes on the shop's walls and window.
- **Reputation**: grows with happy customers. It brings people in more often and unlocks travellers who pay more.
- **Regulars**: each villager gets a few shop lines and favourite things; a villager who has bought from her often enough becomes a regular, with a chip on the village list.
- (Moved to Part 5: the row fills up when its other two shops open, and their keepers stand in them.)
- Upgrades as built: two little tables (1,500), a window display (2,000), a painted sign (800), a glass case (3,000, after the tables). Reputation levels New, Known, Popular, Beloved, Famous.

### Part 4: Orders and trade (shipped Nov 11, 2026)
- **Special orders**: a villager asks for a set of things by a day ("six honey cakes by Friday"), on the ledger. Better than shelf prices, plus friendship. No penalty for missing one: it just lapses kindly.
- **Gift baskets**: bundle three things in a basket on the counter for a bonus.
- **Out-of-town buyers** on certain days (a Guild buyer for potions, a cook from the coast for fish), with a list of what they're after.

### Part 5: The aunt's ledger
- A story told through Bramble's old shop ledger: each page unlocks as the shop reaches a milestone.
- A friendly rivalry with Theo's apothecary, ending in a joint venture.
- A Guild inspector visits.
- The finale opens **Zara's Curios** and **the Little Bakery** on the row, each a shop she can visit.

## Save and code notes
- `S.shop` defaults to `null` in `newState`; `shopState()` fills it in at use. Old saves need nothing in `migrate`.
- The scene is never saved as 'row' or 'shop' (loading always starts on the farm), so the shop's open state is not saved; shelves and takings are.
- New `data-act` names must stay unique across all sheets (CLAUDE.md gotcha 8).
- `stats.html` doesn't need to read the shop yet; Part 3 can add takings to the player card.

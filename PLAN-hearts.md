# Brambleroot: after full hearts (plan)

Matt, Nov 10, 2026: his wife is close to full hearts with everyone in autumn of year 1. He picked four things to add. Each part ships on its own, and her save loads at every step.

## Part 1: best friends — DONE Nov 10, 2026 (Build 24, with the growing-crop drawings)
- Hearts 9 and 10 for friends too. Every villager now shows 10 hearts; 9 and 10 stay padlocked until she's their partner or their best friend.
- **Friendship Bracelet:** sold at the Market (150 coins) once anyone is at 8 hearts. Give it to someone at 8 hearts who isn't her partner, and they become a best friend. There's no limit on how many she can have. It's in `NOGIFT`.
- A thank-you line when they get the bracelet, then a scene at 9 hearts and one at 10, for all 15 villagers (`BFF[v]`: yes, s9, s10).
- Best friends cap at 1,050 points, like a partner. Hearts 9 and 10 have to be earned (points never went past 850 before, so nothing jumps).
- **Best-friend help:** most mornings, one best friend at 10 hearts leaves something small (`BFF_HELP[v]`): a breakfast, a fish, a jar of honey, herbs, a little favour. One-off items or a bit of energy, never a permanent perk, so the economy holds.
- If she later dates a best friend, the romance scenes take over as usual (the best-friend scenes use their own keys).

## Part 2: heart quests — DONE Nov 10, 2026 (Build 25). Four steps each; one opens a morning; keepsakes go on the relic shelf.
- At 8 hearts, each villager starts a personal story of three or four steps: a scene, a favour or a place to meet, and an ending with a keepsake gift. They use the story-quest system (`QUESTS`) and show in the Journal's Stories tab.
- 15 stories, one each. They build on the 2/4/6/8 scenes (Mara and the mill, Fen and the ferry, Silas's song, Juno's mother, Hettie's letters, and so on).

## Part 3: matchmaking — DONE Nov 10, 2026 (Build 26). As planned; weddings are a week after the story ends, at the couple's own place.
- Five pairs who are sweet on each other: Silas and Isolde, Rowan and Juno, Fen and Bertram, Wren and Zara, Mara and Aldous.
- A pair opens once both are at 6+ hearts with her and neither is her partner (or engaged to her). One of them confides in her, she carries notes and sets up a meeting, and it ends in a village wedding she's invited to.
- Once paired, they can't be dated, and the game asks her to confirm before that happens. Each married pair gets new chat lines about each other, and they stand together at festivals.

## Part 4: newcomers — DONE Nov 10, 2026 (Build 27). Rosa (spring), Corin (summer), Marigold (autumn); friend only.
- Three new villagers move in during year 2 (spring, summer and autumn), each starting at zero hearts. They come with everything the others have: portraits, loves, a birthday, a schedule, chat lines, scenes at 2/4/6/8, heart gifts, festival lines, best-friend scenes and a heart quest.
- They're friend-only to start with (romance for a newcomer is a possible follow-up).
- `arrive` gains a year.

## Every part
- Old saves load (`mig.js`, `savesuite.js` 32/32), and `data-act` names stay unique.
- Headless tests for the new rules and content, plus phone checks on iPhone 13 and Pixel 7 with screenshots.
- Balance sims after each part, plus a short Telegram message.

# Cat Royale — Design Document

**Pitch:** Clash Royale's real-time card battles, played with Battle Cats' goofy white cats, silly enemies, evolution forms and world-by-world campaign. Built for a 12-year-old, runs in the browser on iPhone (add to Home Screen for full-screen play).

## Research summary

| | Battle Cats (PONOS) | Clash Royale (Supercell) | What Cat Royale takes |
|---|---|---|---|
| Core loop | Side-scrolling lane defense: deploy cats, destroy the enemy base | 3-minute, 2-lane tower battles from an 8-card deck | Clash Royale's arena, deck, hand cycle, timer and towers |
| Resource | Worker Cat generates money, upgradable mid-battle | Elixir: 1 per 2.8 s, max 10, doubles in the last minute | **Kibble**: 1 per 2.5 s, max 10, doubles in the last minute |
| Signature | The Cat Cannon (a charged base blast) | Spells, King and Princess towers | Cat Cannon is a chargeable button on your base; spells are cards |
| Units | Cheap blob cats through Uber Rares, each with Normal → Evolved → True Form | Troops, spells, buildings; card levels | Every cat has 3 forms (evolve at level 5 and 10) plus 10 levels |
| Enemies | Doge, Snache, Those Guys, Hippoe, Gory... with traits Red / Floating / Metal / Alien | Player-vs-player | Original enemy roster with the same trait idea; cats have "strong vs" bonuses |
| Progression | Chapters (Empire of Cats → Into the Future → Cats of the Cosmos), stages named after places | Arenas unlocked by trophies, chests, card upgrades with gold | 8 worlds × 5 stages, NPC opponents that scale, Toy Boxes after every win |
| Currency | XP, Cat Food (premium), tickets, gacha capsules | Gold, gems, chests | **Cat Food** (upgrades), **Catnip** (capsules + evolutions), **Toy Boxes**, **Toy Capsule Machine** |

## Battle rules

- Portrait arena, two lanes with a fence in the middle (two gates = bridges).
- Each side: **Cat Base** (king tower) and two **Scratching Posts** (princess towers). Enemies have a Big Doghouse and two Doghouses.
- Deck of 8 cards, 4 in hand, next card previewed. Tap a card, then tap your half of the arena (or drag).
- Kibble: starts at 5, +1 per 2.5 s, max 10. **Double Kibble** in the final 60 s.
- 3:00 match. Destroy the Cat Base to win instantly. Otherwise most towers wins; tie → 60 s **Overtime** (first tower wins) → lowest tower HP loses.
- **Paws** (1–3) awarded per win = towers destroyed; stored per stage.
- Cat Cannon: charges over 25 s, tap to send a shockwave up both lanes (damage + knockback). The NPC has one too.

## Unit roles (Clash Royale archetypes, Battle Cats flavor)

Meat shield (Kitty), Wall (Chonk), DPS (Hatchet Cat), Ranged (Noodle Legs), Win condition / tower rusher (Zoomies Cat), Flying splash (Birdy Cat), Anti-air bruiser (Fishy Cat), Long range (Lizard Cat), Big tank (Colossal Cat), assassin (Ninja), knockback tank (Sumo), reviver (Zombie Cat), area melee (Samurai), spawner building (Cardboard Box), splash mage (Wizard), slow (Ice Cat), cheap ranged (Archer), suicide bomber (Bomber), healer (Angel), armor-piercer (Knight), lane laser (Laser Cat), lifesteal (Dracula), armored (Robo Cat), and Ubers (Valkyrie, Cosmic, Dragon King, Fluffy Overlord). Spells: Fish Bomb, Yarn Ball (stun), Laser Pointer (distract), Catnip Cloud (rage).

Enemy traits: 🔴 Red, 🎈 Floating, ⚙️ Metal (takes 25% damage unless the attacker is strong vs Metal), 👽 Alien. "Strong vs" = ×1.5 damage dealt, ×0.5 taken.

## Progression & economy

- **Cat Food** 🥫: earned every battle; levels cats 1→10 (+10% HP/damage per level) and upgrades the Cat Base.
- **Catnip** 🌿: first-clears and bosses; spends on **Evolutions** (level 5 → Evolved, level 10 → True Form: +25% / +55% stats, new look) and the **Toy Capsule Machine** (30 Catnip per pull; Special / Rare / Super Rare / Uber odds 40/32/20/8, duplicates refund Cat Food).
- **Toy Box** after every win: Cat Food, chance of Catnip, chance of a cat.
- **Worlds**: Backyard → Alley → City Park → Rooftops → Frosty Peaks → Haunted Mansion → Robot Factory → The Moon. Each has 5 stages, the 5th is a boss that appears 40 s in. Clearing a boss unlocks the next world and a guaranteed new cat.
- NPC difficulty scales by stage index: stat multiplier, tower HP, smarter AI (counters lanes, builds tank+DPS pushes, uses its cannon), and deeper decks with trait-heavy enemies.

## Tech

- Vanilla JS + Canvas, no dependencies. `index.html` + `js/*.js` for dev; `node build.js` produces a single-file `dist/index.html` you can host anywhere or open on a phone.
- Logical 360×720 stage scaled to fit any screen, pointer events, `apple-mobile-web-app-capable`, no zoom, safe-area aware.
- All art is procedurally drawn (Battle Cats-style blob cats) with emoji props. Sound is synthesized with WebAudio.
- Save data in `localStorage` (`catroyale.save.v1`).
- PvP later: the engine is symmetric (two players, same rules); the NPC module is the only thing that would be swapped for network input.

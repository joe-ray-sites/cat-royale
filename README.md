# 🐱 Cat Royale

Battle Cats meets Clash Royale, in the browser. Real-time 2-lane tower battles with an 8-card deck of goofy cats, 8 worlds of NPC opponents that get tougher, cat upgrades and evolutions, Toy Boxes and a Toy Capsule Machine.

Read [DESIGN.md](DESIGN.md) for the full design.

## Play it

**Live:** https://joe-ray-sites.github.io/cat-royale/ (GitHub Pages, updates on every push to `main`).

**Single file:** open `dist/index.html` in any browser, or host it anywhere (GitHub Pages, Netlify, a Dropbox link...). Everything is inlined: no build, no server, no dependencies.

**On iPhone:** open the hosted link in Safari, tap **Share → Add to Home Screen**. It launches full-screen like an app and saves progress on the device.

## Develop

```
python3 -m http.server 8765      # then open http://localhost:8765
node build.js                    # bundles into dist/index.html
node tools/sim.js 5 4 mid 3      # headless balance sim: level, runs, deck, player-AI level
```

Files:

| File | What it does |
|---|---|
| `js/data.js` | Every cat (with 3 forms), spell, enemy, boss and world. Balance knobs live here (`enemyMult`, `towerMult`, `aiLevel`, rewards). |
| `js/art.js` | Procedural Battle-Cats-style drawing of cats, enemies, towers and arenas. |
| `js/engine.js` | The battle: kibble, deck cycling, movement, targeting, damage, spells, towers, Cat Cannon, overtime. Symmetric for both sides so PvP can be added later. |
| `js/ai.js` | NPC opponent (5 skill levels). Works for either side; used for the headless sim too. |
| `js/save.js` | Profile in `localStorage`: cats, levels, forms, deck, paws, currencies. |
| `js/ui.js` | Home screens: worlds, cats/deck, capsule machine, settings, modals. |
| `js/main.js` | Boot, battle loop, touch input, result screen and rewards. |
| `js/sound.js` | Synthesized sound effects (WebAudio). |

## Icons

Source artwork is `cat royale icon.png`. Everything below is generated from it:

| Path | Use |
|---|---|
| `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png` | Linked from `index.html` for the website and iPhone Home Screen |
| `manifest.webmanifest` | PWA manifest (standalone, portrait) pointing at the 192/512 icons |
| `icons/web/` | Full favicon set 16–512, maskable Android icons, 1024 rounded and square masters |
| `icons/ios/AppIcon.appiconset/` | Drop into an Xcode project: every iPhone/iPad size plus the 1024 App Store icon, with `Contents.json` |
| `icons/ios/AppStore-1024.png` | App Store Connect upload (1024×1024, opaque, square corners) |

The web icons keep transparent rounded corners. The iOS icons are square and opaque as Apple requires; the corners are filled by extending the art's own colors, and iOS applies its rounded mask on device.

## Adding content

- **New cat:** add an entry to `CATS` in `js/data.js` with 3 `forms` (name + look). It shows up in the collection and the capsule pool automatically.
- **New enemy:** add to `ENEMIES`, then reference it in a world's `pool` (or `boss`).
- **New world:** add to `WORLDS` with 5 stage names, a `pool`, a `boss`, a `rewardCat` and a color palette.

## Roadmap ideas

PvP (the engine already runs two identical players; swap the NPC for network input), daily quests, cat "talents", more spells and buildings, a proper soundtrack.

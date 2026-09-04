/* ============ CAT ROYALE DATA ============ */
const DATA = (() => {
  const RARITY = {
    basic:     { name: 'Basic',      color: '#9aa5c4', upgrade: 40,  evo1: 10, evo2: 25 },
    special:   { name: 'Special',    color: '#5ec8ff', upgrade: 60,  evo1: 15, evo2: 35 },
    rare:      { name: 'Rare',       color: '#5ee08c', upgrade: 90,  evo1: 20, evo2: 45 },
    superrare: { name: 'Super Rare', color: '#c78bff', upgrade: 140, evo1: 30, evo2: 60 },
    uber:      { name: 'Uber Rare',  color: '#ffb347', upgrade: 200, evo1: 40, evo2: 80 },
    spell:     { name: 'Spell',      color: '#ff6b6b', upgrade: 50,  evo1: 0,  evo2: 0 },
  };
  const FORM_MULT = [1, 1.25, 1.55];
  const LEVEL_MULT = lv => 1 + 0.1 * (lv - 1);
  const MAX_LEVEL = 10;

  // look: body shape/color + props. All cats share the "white blob" DNA of Battle Cats.
  const cat = (o) => Object.assign({ kind: 'unit', hp: 100, dmg: 10, range: 22, speed: 55, rate: 1, count: 1, hitsAir: false, flying: false, target: 'any', area: 0 }, o);
  const look = (o) => Object.assign({ body: 'blob', color: '#ffffff', ears: 'cat', mouth: 'w', eyes: 'dot', scale: 1 }, o);

  const CATS = [
    // ---------------- BASIC ----------------
    cat({ id: 'kitty', name: 'Kitty', rarity: 'basic', cost: 1, hp: 110, dmg: 14, range: 22, speed: 55, rate: 0.9,
      desc: 'The classic. Cheap, brave, and a little bit dumb. Great for soaking up hits.',
      forms: [
        { name: 'Kitty', look: look({}) },
        { name: 'Tough Kitty', look: look({ body: 'wide', eyes: 'angry', hat: '💪' }) },
        { name: 'Mohawk Kitty', look: look({ body: 'wide', eyes: 'angry', hair: 'mohawk', item: '🎸' }) },
      ] }),
    cat({ id: 'chonk', name: 'Chonk', rarity: 'basic', cost: 2, hp: 560, dmg: 8, range: 22, speed: 40, rate: 1.2,
      desc: 'A living wall of fluff. Barely fights back but takes forever to knock down.',
      forms: [
        { name: 'Chonk', look: look({ body: 'round', scale: 1.15 }) },
        { name: 'Big Chonk', look: look({ body: 'round', scale: 1.3, hat: '🛡️' }) },
        { name: 'Absolute Unit', look: look({ body: 'round', scale: 1.45, hat: '🧱', eyes: 'closed' }) },
      ] }),
    cat({ id: 'hatchet', name: 'Hatchet Cat', rarity: 'basic', cost: 3, hp: 230, dmg: 62, range: 26, speed: 60, rate: 1.0, strongVs: ['red'],
      desc: 'Chop chop! Solid damage up close. Strong against 🔴 Red enemies.',
      forms: [
        { name: 'Hatchet Cat', look: look({ item: '🪓' }) },
        { name: 'Brave Hatchet', look: look({ item: '🪓', hat: '⛑️', eyes: 'angry' }) },
        { name: 'Shadow Hatchet', look: look({ item: '🪓', color: '#3a3a4a', eyes: 'glow', hat: '🌑' }) },
      ] }),
    cat({ id: 'noodle', name: 'Noodle Legs', rarity: 'basic', cost: 3, hp: 140, dmg: 46, range: 130, speed: 50, rate: 1.4, hitsAir: true,
      desc: 'Kicks from across the yard with ridiculously long legs. Can hit flying enemies.',
      forms: [
        { name: 'Noodle Legs', look: look({ body: 'tall', legs: 'long' }) },
        { name: 'Longer Legs', look: look({ body: 'tall', legs: 'longer', hat: '🩰' }) },
        { name: 'Mega Legs', look: look({ body: 'tall', legs: 'longer', hat: '👑', eyes: 'angry' }) },
      ] }),
    cat({ id: 'zoomies', name: 'Zoomies Cat', rarity: 'basic', cost: 4, hp: 400, dmg: 72, range: 24, speed: 135, rate: 1.3, target: 'buildings',
      desc: 'Has the zoomies at 3am. Ignores enemies and sprints straight for the Doghouse!',
      forms: [
        { name: 'Zoomies Cat', look: look({ body: 'long', eyes: 'wide', speedlines: true }) },
        { name: 'Giraffe Cat', look: look({ body: 'long', eyes: 'wide', neck: true, color: '#fff2c4', speedlines: true }) },
        { name: 'Lion Cat', look: look({ body: 'long', eyes: 'angry', mane: true, color: '#ffe0a0', speedlines: true }) },
      ] }),
    cat({ id: 'birdy', name: 'Birdy Cat', rarity: 'basic', cost: 4, hp: 270, dmg: 56, range: 110, speed: 55, rate: 1.5, flying: true, hitsAir: true, area: 42,
      desc: 'A cat with wings?! Flies over the fight and drops splash damage on groups.',
      forms: [
        { name: 'Birdy Cat', look: look({ wings: true }) },
        { name: 'UFO Cat', look: look({ ufo: true, color: '#e8fff6' }) },
        { name: 'Rocket Cat', look: look({ ufo: true, hat: '🚀', eyes: 'glow', color: '#e8fff6' }) },
      ] }),
    cat({ id: 'fishy', name: 'Fishy Cat', rarity: 'basic', cost: 4, hp: 430, dmg: 84, range: 30, speed: 45, rate: 1.6, hitsAir: true, strongVs: ['floating'],
      desc: 'Swings a big fish. Whacks flying enemies right out of the sky. Strong vs 🎈 Floating.',
      forms: [
        { name: 'Fishy Cat', look: look({ item: '🐟' }) },
        { name: 'Whale Cat', look: look({ item: '🐋', body: 'wide', color: '#e6f2ff' }) },
        { name: 'Island Cat', look: look({ item: '🐋', body: 'wide', hat: '🌴', color: '#e6f2ff', scale: 1.15 }) },
      ] }),
    cat({ id: 'lizard', name: 'Lizard Cat', rarity: 'basic', cost: 5, hp: 300, dmg: 150, range: 175, speed: 45, rate: 2.2, hitsAir: true,
      desc: 'Spits fireballs from way, way back. Huge single hits, but keep it protected.',
      forms: [
        { name: 'Lizard Cat', look: look({ color: '#c9f5c9', tail: 'lizard', item: '🦎' }) },
        { name: 'Dragon Cat', look: look({ color: '#b6f0b6', tail: 'lizard', wings: true, item: '🔥' }) },
        { name: 'King Dragon', look: look({ color: '#a8e8a8', tail: 'lizard', wings: true, hat: '👑', item: '🔥', scale: 1.15 }) },
      ] }),
    cat({ id: 'colossal', name: 'Colossal Cat', rarity: 'basic', cost: 6, hp: 1350, dmg: 115, range: 32, speed: 35, rate: 2.0, area: 50, knockback: true,
      desc: 'An enormous slow cat that smashes everything in front of it and shoves enemies back.',
      forms: [
        { name: 'Colossal Cat', look: look({ body: 'wide', scale: 1.5, eyes: 'closed' }) },
        { name: 'Mega Colossal', look: look({ body: 'wide', scale: 1.65, eyes: 'angry', hat: '⛰️' }) },
        { name: 'Ancient Colossal', look: look({ body: 'wide', scale: 1.8, eyes: 'glow', hat: '🗿', color: '#e7e2d3' }) },
      ] }),
    // ---------------- SPECIAL ----------------
    cat({ id: 'ninja', name: 'Ninja Cat', rarity: 'special', cost: 3, hp: 170, dmg: 58, range: 24, speed: 110, rate: 0.5,
      desc: 'Fast, sneaky, and slices super quickly. Melts tanks, but pops if you look at it.',
      forms: [
        { name: 'Ninja Cat', look: look({ color: '#444a5a', mask: true, item: '🗡️' }) },
        { name: 'Shadow Ninja', look: look({ color: '#2b2f3d', mask: true, item: '🗡️', eyes: 'glow' }) },
        { name: 'Master Ninja', look: look({ color: '#1e2130', mask: true, item: '⚔️', eyes: 'glow', hat: '🎋' }) },
      ] }),
    cat({ id: 'sumo', name: 'Sumo Cat', rarity: 'special', cost: 4, hp: 950, dmg: 32, range: 26, speed: 35, rate: 1.5, knockback: true,
      desc: 'Dosukoi! Shoves enemies backwards with every hit and just will not go down.',
      forms: [
        { name: 'Sumo Cat', look: look({ body: 'round', scale: 1.3, belt: true }) },
        { name: 'Yokozuna Cat', look: look({ body: 'round', scale: 1.4, belt: true, hat: '🎀' }) },
        { name: 'Grand Champion', look: look({ body: 'round', scale: 1.55, belt: true, hat: '🏆', eyes: 'angry' }) },
      ] }),
    cat({ id: 'zombie', name: 'Zombie Cat', rarity: 'special', cost: 3, hp: 210, dmg: 38, range: 24, speed: 60, rate: 1.0, revive: 1,
      desc: 'Braaains... I mean, tuna. When it dies, it digs back up once with half health.',
      forms: [
        { name: 'Zombie Cat', look: look({ color: '#b8e0b0', eyes: 'x', bandage: true }) },
        { name: 'Ghoul Cat', look: look({ color: '#9fd39a', eyes: 'x', bandage: true, hat: '🪦' }) },
        { name: 'Lich Cat', look: look({ color: '#88c489', eyes: 'glow', bandage: true, hat: '👑', item: '🔮' }) },
      ], formAdd: [null, { revive: 1 }, { revive: 2 }] }),
    cat({ id: 'samurai', name: 'Samurai Cat', rarity: 'special', cost: 5, hp: 520, dmg: 135, range: 30, speed: 50, rate: 1.6, area: 46,
      desc: 'One clean slash hits everyone in front of it. Honorable and very sharp.',
      forms: [
        { name: 'Samurai Cat', look: look({ item: '🗡️', hat: '👹' }) },
        { name: 'Ronin Cat', look: look({ item: '⚔️', hat: '👹', eyes: 'angry', color: '#f4f0e0' }) },
        { name: 'Shogun Cat', look: look({ item: '⚔️', hat: '🏯', eyes: 'angry', color: '#f4f0e0', scale: 1.15 }) },
      ] }),
    cat({ id: 'box', name: 'Cardboard Box', rarity: 'special', cost: 3, hp: 380, dmg: 0, range: 0, speed: 0, rate: 4, kind: 'building', spawns: 'kitty', spawnEvery: 4, lifetime: 30,
      desc: 'If it fits, it sits. Drops a new Kitty out of the box every few seconds for 30 seconds.',
      forms: [
        { name: 'Cardboard Box', look: look({ body: 'box', color: '#d9a066', eyes: 'peek' }) },
        { name: 'Delivery Box', look: look({ body: 'box', color: '#c98a4b', eyes: 'peek', hat: '📦' }) },
        { name: 'Cat Condo', look: look({ body: 'box', color: '#b87333', eyes: 'peek', hat: '🏠', scale: 1.2 }) },
      ], formAdd: [null, { spawnEvery: 3.5 }, { spawnEvery: 3, lifetime: 40 }] }),
    // ---------------- RARE ----------------
    cat({ id: 'wizard', name: 'Wizard Cat', rarity: 'rare', cost: 5, hp: 250, dmg: 95, range: 120, speed: 50, rate: 1.5, area: 46, hitsAir: true,
      desc: 'Flings fireballs that splash on everything nearby. Hates swarms of rats.',
      forms: [
        { name: 'Wizard Cat', look: look({ hat: '🧙', item: '🔥' }) },
        { name: 'Sorcerer Cat', look: look({ hat: '🧙', item: '🔥', color: '#e8dcff', eyes: 'glow' }) },
        { name: 'Archmage Cat', look: look({ hat: '🧙', item: '☄️', color: '#d8c8ff', eyes: 'glow', scale: 1.1 }) },
      ] }),
    cat({ id: 'ice', name: 'Ice Cat', rarity: 'rare', cost: 4, hp: 270, dmg: 42, range: 115, speed: 50, rate: 1.2, hitsAir: true, slow: 2,
      desc: 'Brrr. Every hit slows enemies down to half speed. Perfect for stalling a big push.',
      forms: [
        { name: 'Ice Cat', look: look({ color: '#dff6ff', item: '🧊' }) },
        { name: 'Frost Cat', look: look({ color: '#cbefff', item: '❄️', hat: '🧣' }) },
        { name: 'Blizzard Cat', look: look({ color: '#b8e8ff', item: '❄️', hat: '🌨️', eyes: 'glow' }) },
      ], formAdd: [null, { slow: 2.5 }, { slow: 3 }] }),
    cat({ id: 'archer', name: 'Archer Cat', rarity: 'rare', cost: 2, hp: 120, dmg: 34, range: 150, speed: 55, rate: 1.1, hitsAir: true,
      desc: 'Cheap and long range. Pings at anything, including flying enemies. Great cycle card.',
      forms: [
        { name: 'Archer Cat', look: look({ item: '🏹' }) },
        { name: 'Sniper Cat', look: look({ item: '🏹', hat: '🎯' }) },
        { name: 'Hawkeye Cat', look: look({ item: '🏹', hat: '🦅', eyes: 'angry' }) },
      ] }),
    cat({ id: 'bomber', name: 'Bomber Cat', rarity: 'rare', cost: 3, hp: 210, dmg: 280, range: 24, speed: 75, rate: 1, area: 62, suicide: true,
      desc: 'Runs at the enemy and goes KABOOM. Massive splash damage, one time only.',
      forms: [
        { name: 'Bomber Cat', look: look({ item: '💣', eyes: 'wide' }) },
        { name: 'Big Bomber', look: look({ item: '💣', eyes: 'wide', hat: '🧨', scale: 1.1 }) },
        { name: 'Nuke Cat', look: look({ item: '☢️', eyes: 'glow', hat: '🧨', scale: 1.2, color: '#f0ffd0' }) },
      ] }),
    cat({ id: 'angel', name: 'Angel Cat', rarity: 'rare', cost: 4, hp: 390, dmg: 30, range: 24, speed: 60, rate: 1.0, flying: true, heal: 14,
      desc: 'Floats along healing every cat nearby. Keep it behind your tank!',
      forms: [
        { name: 'Angel Cat', look: look({ wings: true, halo: true }) },
        { name: 'Seraph Cat', look: look({ wings: true, halo: true, color: '#fff9d6', hat: '✨' }) },
        { name: 'Archangel Cat', look: look({ wings: true, halo: true, color: '#fff5c0', hat: '✨', item: '🎺', scale: 1.1 }) },
      ], formAdd: [null, { heal: 20 }, { heal: 28 }] }),
    // ---------------- SUPER RARE ----------------
    cat({ id: 'knight', name: 'Knight Cat', rarity: 'superrare', cost: 4, hp: 620, dmg: 78, range: 26, speed: 55, rate: 1.1, strongVs: ['metal'],
      desc: 'Tough, reliable, and its sword goes right through armor. Strong vs ⚙️ Metal.',
      forms: [
        { name: 'Knight Cat', look: look({ hat: '⛑️', item: '🗡️', color: '#e8e8f0' }) },
        { name: 'Paladin Cat', look: look({ hat: '🛡️', item: '🗡️', color: '#e8e8f0', eyes: 'angry' }) },
        { name: 'Crusader Cat', look: look({ hat: '👑', item: '⚔️', color: '#e8e8f0', eyes: 'angry', scale: 1.15 }) },
      ] }),
    cat({ id: 'laser', name: 'Laser Cat', rarity: 'superrare', cost: 6, hp: 290, dmg: 125, range: 180, speed: 45, rate: 2.0, hitsAir: true, pierce: true,
      desc: 'Fires a beam that goes through EVERY enemy in the lane. Pew pew pew.',
      forms: [
        { name: 'Laser Cat', look: look({ eyes: 'laser', hat: '🥽' }) },
        { name: 'Beam Cat', look: look({ eyes: 'laser', hat: '🥽', color: '#ffe0e0' }) },
        { name: 'Death Ray Cat', look: look({ eyes: 'laser', hat: '🛸', color: '#ffd0d0', scale: 1.15 }) },
      ] }),
    cat({ id: 'dracula', name: 'Dracula Cat', rarity: 'superrare', cost: 5, hp: 460, dmg: 92, range: 26, speed: 65, rate: 1.0, lifesteal: 0.5,
      desc: 'Bleh! Heals itself for half the damage it deals. Loves the night life.',
      forms: [
        { name: 'Dracula Cat', look: look({ color: '#f0e6ff', cape: true, fangs: true }) },
        { name: 'Vampire Lord', look: look({ color: '#e6d6ff', cape: true, fangs: true, hat: '🎩' }) },
        { name: 'Nosferatu Cat', look: look({ color: '#d8c8ff', cape: true, fangs: true, hat: '🦇', eyes: 'glow', scale: 1.1 }) },
      ] }),
    cat({ id: 'robo', name: 'Robo Cat', rarity: 'superrare', cost: 5, hp: 720, dmg: 64, range: 26, speed: 45, rate: 1.0, armor: 0.5, strongVs: ['alien'],
      desc: 'Beep boop. Metal plating halves all damage taken. Strong vs 👽 Alien.',
      forms: [
        { name: 'Robo Cat', look: look({ color: '#c8d0e0', antenna: true, eyes: 'glow', body: 'box' }) },
        { name: 'Mecha Cat', look: look({ color: '#b0bcd4', antenna: true, eyes: 'glow', body: 'box', hat: '⚙️' }) },
        { name: 'Titan Mech', look: look({ color: '#98a8c8', antenna: true, eyes: 'glow', body: 'box', hat: '🤖', scale: 1.25 }) },
      ] }),
    cat({ id: 'goggles', name: 'Goggles Cat', rarity: 'superrare', cost: 4, hp: 280, dmg: 50, range: 125, speed: 55, rate: 1.0, hitsAir: true, critEvery: 5, critMult: 1.5,
      desc: 'Swim team captain. Squirts enemies with a water gun for 50 damage, and every 5th shot is a CRITICAL HIT for 75!',
      forms: [
        { name: 'Goggles Cat', look: look({ goggles: true, swimcap: '#2f7bff', item: '🔫' }) },
        { name: 'Lifeguard Cat', look: look({ goggles: true, swimcap: '#ff4d4d', item: '🔫', hat: '🛟' }) },
        { name: 'Olympic Cat', look: look({ goggles: true, swimcap: '#ffd166', item: '🔫', hat: '🥇', color: '#f4fbff', scale: 1.1 }) },
      ], formAdd: [null, { critEvery: 4 }, { critEvery: 3, critMult: 1.75 }] }),
    cat({ id: 'hubba', name: 'Hubba Bubba Cat', rarity: 'superrare', cost: 3, hp: 320, dmg: 0, range: 120, speed: 55, rate: 5, area: 50, hitsAir: true, stick: 2.5, exclusive: true,
      desc: 'Chews an entire pack at once. Every 5 seconds it throws a wad of gum: zero damage, but everyone it splats is STUCK in place for a few seconds. Gift-only!',
      forms: [
        { name: 'Hubba Bubba Cat', look: look({ bubble: 1, eyes: 'wide' }) },
        { name: 'Bubble Blower Cat', look: look({ bubble: 1.4, eyes: 'wide', hat: '🧢' }) },
        { name: 'Gum Master Cat', look: look({ bubble: 1.8, eyes: 'glow', hat: '👑', color: '#fff0f6', scale: 1.1 }) },
      ], formAdd: [null, { stick: 3, rate: 4.5 }, { stick: 3.5, rate: 4, area: 60 }] }),
    // ---------------- UBER ----------------
    cat({ id: 'valkyrie', name: 'Valkyrie Cat', rarity: 'uber', cost: 6, hp: 820, dmg: 165, range: 32, speed: 65, rate: 1.3, area: 50, knockback: true,
      desc: 'A legendary warrior. Sweeps whole groups back with a giant spear.',
      forms: [
        { name: 'Valkyrie Cat', look: look({ hat: '⛑️', item: '🔱', color: '#fff0f5', hair: 'long' }) },
        { name: 'Holy Valkyrie', look: look({ hat: '⛑️', item: '🔱', color: '#fff0f5', hair: 'long', wings: true }) },
        { name: 'Valkyrie Queen', look: look({ hat: '👑', item: '🔱', color: '#fff0f5', hair: 'long', wings: true, eyes: 'glow', scale: 1.15 }) },
      ] }),
    cat({ id: 'cosmic', name: 'Cosmic Cat', rarity: 'uber', cost: 7, hp: 520, dmg: 125, range: 140, speed: 50, rate: 1.8, flying: true, hitsAir: true, area: 42, freeze: 1.5,
      desc: 'From beyond the stars. Its blasts freeze enemies solid for a moment.',
      forms: [
        { name: 'Cosmic Cat', look: look({ color: '#d0d8ff', hat: '🪐', eyes: 'glow', ufo: true }) },
        { name: 'Galaxy Cat', look: look({ color: '#c0c8ff', hat: '🌌', eyes: 'glow', ufo: true }) },
        { name: 'Nebula Cat', look: look({ color: '#b0b8ff', hat: '🌌', eyes: 'glow', ufo: true, item: '⭐', scale: 1.15 }) },
      ], formAdd: [null, { freeze: 2 }, { freeze: 2.5 }] }),
    cat({ id: 'dragonking', name: 'Dragon King Cat', rarity: 'uber', cost: 8, hp: 920, dmg: 420, range: 190, speed: 40, rate: 3.0, hitsAir: true, area: 60,
      desc: 'The boss of all dragons. Rare, slow, and absolutely devastating.',
      forms: [
        { name: 'Dragon King Cat', look: look({ color: '#ffd9a0', wings: true, hat: '👑', item: '🔥', scale: 1.2 }) },
        { name: 'Emperor Dragon', look: look({ color: '#ffcc80', wings: true, hat: '👑', item: '🌋', scale: 1.3, eyes: 'angry' }) },
        { name: 'Celestial Dragon', look: look({ color: '#ffe0b0', wings: true, hat: '☀️', item: '🌋', scale: 1.4, eyes: 'glow' }) },
      ] }),
    cat({ id: 'overlord', name: 'Fluffy Overlord', rarity: 'uber', cost: 9, hp: 2300, dmg: 210, range: 36, speed: 35, rate: 2.0, area: 62, knockback: true,
      desc: 'Behold. The floofiest cat in the universe. Nothing survives the fluff.',
      forms: [
        { name: 'Fluffy Overlord', look: look({ body: 'round', scale: 1.9, fluffy: true, eyes: 'closed' }) },
        { name: 'Supreme Floof', look: look({ body: 'round', scale: 2.0, fluffy: true, hat: '👑', eyes: 'closed' }) },
        { name: 'The Floofinity', look: look({ body: 'round', scale: 2.2, fluffy: true, hat: '👑', eyes: 'glow', color: '#fff8e0' }) },
      ] }),
    // ---------------- EXCLUSIVE UBERS (gift codes only) ----------------
    cat({ id: 'facetime', name: 'Facetime Cat', rarity: 'uber', exclusive: true, cost: 5, hp: 480, dmg: 92, range: 125, speed: 55, rate: 1.3, area: 40, hitsAir: true, slow: 1.5, kibbleOnDeploy: 2,
      desc: 'Always on a call, always gaming. Its splash attacks LAG enemies so they crawl, and its fans tip you 2 Kibble whenever it shows up. Gift-only: ask the Game Master!',
      forms: [
        { name: 'Facetime Cat', look: look({ tablet: 'base' }) },
        { name: 'Facetime Cat HD', look: look({ tablet: 'base', hat: '🎧', eyes: 'wide' }) },
        { name: 'Facetime Cat 4K', look: look({ tablet: 'base', hat: '🎧', eyes: 'glow', color: '#f0f4ff', scale: 1.1 }) },
      ], formAdd: [null, { slow: 2, kibbleOnDeploy: 3 }, { slow: 2.5, kibbleOnDeploy: 4 }] }),
    cat({ id: 'facetimepro', name: 'Facetime Cat Pro', rarity: 'uber', exclusive: true, cost: 6, hp: 540, dmg: 135, range: 26, speed: 120, rate: 0.6, lifesteal: 0.3,
      desc: 'Pro gamer reflexes. Sprints in, mashes buttons at lightning speed, and heals off every combo. Gift-only!',
      forms: [
        { name: 'Facetime Cat Pro', look: look({ tablet: 'pro', hat: '🎧', eyes: 'angry' }) },
        { name: 'Facetime Cat Pro HD', look: look({ tablet: 'pro', hat: '🎧', eyes: 'angry', color: '#f3f3f3', speedlines: true }) },
        { name: 'Facetime Cat Pro 4K', look: look({ tablet: 'pro', hat: '🏆', eyes: 'glow', color: '#eeeeff', speedlines: true, scale: 1.1 }) },
      ] }),
    cat({ id: 'facetimemax', name: 'Facetime Cat Max', rarity: 'uber', exclusive: true, cost: 8, hp: 2000, dmg: 150, range: 34, speed: 38, rate: 1.9, area: 56, knockback: true,
      desc: 'The biggest screen. The biggest cat. Smashes whole groups back with a giant iPad. Gift-only!',
      forms: [
        { name: 'Facetime Cat Max', look: look({ tablet: 'max', body: 'wide', scale: 1.55, eyes: 'closed' }) },
        { name: 'Facetime Cat Max HD', look: look({ tablet: 'max', body: 'wide', scale: 1.7, eyes: 'angry', hat: '🎧' }) },
        { name: 'Facetime Cat Max 4K', look: look({ tablet: 'max', body: 'wide', scale: 1.85, eyes: 'glow', hat: '👑', color: '#fff8e8' }) },
      ] }),
    cat({ id: 'facetimeultra', name: 'Facetime Cat Ultra', rarity: 'uber', exclusive: true, cost: 7, hp: 560, dmg: 210, range: 150, speed: 50, rate: 2.0, flying: true, hitsAir: true, area: 50, freeze: 1.5,
      desc: 'Flies on a hover-iPad and screen-FREEZES everything it hits. The rarest cat in the game. Gift-only!',
      forms: [
        { name: 'Facetime Cat Ultra', look: look({ tablet: 'ultra', ufo: true, eyes: 'glow', color: '#e8f0ff' }) },
        { name: 'Facetime Cat Ultra HD', look: look({ tablet: 'ultra', ufo: true, eyes: 'glow', color: '#dce8ff', hat: '🎧' }) },
        { name: 'Facetime Cat Ultra 4K', look: look({ tablet: 'ultra', ufo: true, eyes: 'glow', color: '#d0e0ff', hat: '🌟', scale: 1.15 }) },
      ], formAdd: [null, { freeze: 2 }, { freeze: 2.5 }] }),
    // ---------------- SPELLS ----------------
    { id: 'fishbomb', name: 'Fish Bomb', rarity: 'spell', cost: 3, kind: 'spell', radius: 72, dmg: 230, knockback: true, hitsAir: true,
      desc: 'Drop an exploding can of tuna anywhere. Big splash damage plus knockback.',
      forms: [{ name: 'Fish Bomb', look: look({ emoji: '🐟' }) }, { name: 'Fish Bomb', look: look({ emoji: '🐟' }) }, { name: 'Fish Bomb', look: look({ emoji: '🐟' }) }] },
    { id: 'yarn', name: 'Yarn Ball', rarity: 'spell', cost: 2, kind: 'spell', radius: 56, dmg: 95, stun: 1.2, hitsAir: true,
      desc: 'Toss a ball of yarn. Small damage, and every enemy stops to play with it for a second.',
      forms: [{ name: 'Yarn Ball', look: look({ emoji: '🧶' }) }, { name: 'Yarn Ball', look: look({ emoji: '🧶' }) }, { name: 'Yarn Ball', look: look({ emoji: '🧶' }) }] },
    { id: 'pointer', name: 'Laser Pointer', rarity: 'spell', cost: 4, kind: 'spell', radius: 66, dmg: 0, stun: 2.5, hitsAir: true,
      desc: 'The little red dot! Enemies in the circle are distracted for a long time.',
      forms: [{ name: 'Laser Pointer', look: look({ emoji: '🔦' }) }, { name: 'Laser Pointer', look: look({ emoji: '🔦' }) }, { name: 'Laser Pointer', look: look({ emoji: '🔦' }) }] },
    { id: 'catnip', name: 'Catnip Cloud', rarity: 'spell', cost: 4, kind: 'spell', radius: 80, rage: 6,
      desc: 'A cloud of catnip! Your cats inside go wild: faster and hit harder for 6 seconds.',
      forms: [{ name: 'Catnip Cloud', look: look({ emoji: '🌿' }) }, { name: 'Catnip Cloud', look: look({ emoji: '🌿' }) }, { name: 'Catnip Cloud', look: look({ emoji: '🌿' }) }] },
  ];
  const CAT_BY_ID = {}; CATS.forEach(c => CAT_BY_ID[c.id] = c);

  // ---------------- ENEMIES ----------------
  // traits: red, floating, metal, alien
  const en = (o) => Object.assign({ kind: 'unit', hp: 100, dmg: 10, range: 22, speed: 55, rate: 1, count: 1, hitsAir: false, flying: false, target: 'any', area: 0, traits: [] }, o);
  const elook = (o) => Object.assign({ body: 'blob', color: '#c48a4a', ears: 'floppy', mouth: 'smile', eyes: 'dot', scale: 1, snout: true }, o);
  const ENEMIES = [
    en({ id: 'pupper', name: 'Pupper', cost: 1, hp: 120, dmg: 14, speed: 55, rate: 1.0, desc: 'Just a dog. A very persistent dog.', look: elook({}) }),
    en({ id: 'wormy', name: 'Wormy', cost: 1, hp: 70, dmg: 26, speed: 105, rate: 0.9, desc: 'Fast and slippery.', look: elook({ body: 'long', color: '#7ccf6a', ears: 'none', snout: false, eyes: 'dot', mouth: 'tongue' }) }),
    en({ id: 'mailmen', name: 'Mailmen', cost: 2, hp: 60, dmg: 11, speed: 60, rate: 1.0, count: 3, desc: 'Three of them. They have packages.', look: elook({ body: 'tall', color: '#8fb3ff', ears: 'none', snout: false, hat: '🧢', item: '✉️', scale: 0.85 }) }),
    en({ id: 'sheep', name: 'Baa Baa', cost: 2, hp: 420, dmg: 10, speed: 40, rate: 1.4, desc: 'Fluffy meat shield.', look: elook({ body: 'round', color: '#f2f2f2', ears: 'round', snout: true, snoutColor: '#333', fluffy: true, scale: 1.1 }) }),
    en({ id: 'rats', name: 'Rat Pack', cost: 2, hp: 42, dmg: 9, speed: 90, rate: 0.7, count: 4, desc: 'A swarm of trash rats.', look: elook({ body: 'blob', color: '#8d8d8d', ears: 'round', snout: true, snoutColor: '#f0a0a0', scale: 0.6, tail: 'rat' }) }),
    en({ id: 'raccoon', name: 'Trash Panda', cost: 3, hp: 290, dmg: 58, speed: 70, rate: 0.8, desc: 'Steals garbage AND hearts.', look: elook({ color: '#9a9a9a', ears: 'pointy', mask: true, tail: 'ring' }) }),
    en({ id: 'piggy', name: 'Piggy', cost: 3, hp: 260, dmg: 64, speed: 55, rate: 1.0, desc: 'Hits harder than it looks.', look: elook({ color: '#ffb3c6', ears: 'pointy', snoutColor: '#ff8fae' }) }),
    en({ id: 'hippo', name: 'Hippo', cost: 3, hp: 580, dmg: 32, speed: 35, rate: 1.2, desc: 'A wall of hippo.', look: elook({ body: 'wide', color: '#9aa2b8', ears: 'round', scale: 1.3, snoutColor: '#b8bfd2' }) }),
    en({ id: 'pengu', name: 'Pengu', cost: 3, hp: 230, dmg: 52, range: 110, speed: 50, rate: 1.5, area: 36, hitsAir: true, desc: 'Throws snowballs that splash.', look: elook({ body: 'tall', color: '#2d3142', ears: 'none', snout: false, belly: '#fff', beak: true, item: '❄️' }) }),
    en({ id: 'gorilla', name: 'Gorilla', cost: 4, hp: 470, dmg: 92, speed: 65, rate: 1.1, area: 40, traits: ['red'], desc: 'Angry, red, and swinging.', look: elook({ body: 'wide', color: '#c9442f', ears: 'round', snout: true, snoutColor: '#e07a68', eyes: 'angry', scale: 1.2 }) }),
    en({ id: 'seal', name: 'Sir Seal', cost: 4, hp: 520, dmg: 72, speed: 50, rate: 1.2, traits: ['red'], desc: 'A fancy red seal. Very rude.', look: elook({ body: 'long', color: '#d9534f', ears: 'none', snout: true, snoutColor: '#f0a0a0', hat: '🎩', eyes: 'dot' }) }),
    en({ id: 'kangaroo', name: 'Kanga', cost: 4, hp: 320, dmg: 66, speed: 120, rate: 1.2, target: 'buildings', desc: 'Bounces straight at your towers!', look: elook({ body: 'tall', color: '#d2a06d', ears: 'pointy', snout: true, item: '🥊' }) }),
    en({ id: 'pigeon', name: 'Pigeon', cost: 3, hp: 220, dmg: 46, range: 90, speed: 60, rate: 1.3, flying: true, hitsAir: true, traits: ['floating'], desc: 'City bird. Floats above your cats.', look: elook({ color: '#8b9bb4', ears: 'none', snout: false, beak: true, wings: true, scale: 0.9 }) }),
    en({ id: 'crow', name: 'Crow Gang', cost: 4, hp: 110, dmg: 30, range: 80, speed: 70, rate: 1.0, count: 3, flying: true, hitsAir: true, traits: ['floating'], desc: 'Three crows. Caw.', look: elook({ color: '#2b2b33', ears: 'none', snout: false, beak: true, wings: true, scale: 0.75, eyes: 'glow' }) }),
    en({ id: 'yeti', name: 'Yeti', cost: 5, hp: 950, dmg: 105, speed: 40, rate: 1.6, area: 44, desc: 'Big, cold, and cranky.', look: elook({ body: 'wide', color: '#eef6ff', ears: 'round', snout: true, snoutColor: '#bcd', fluffy: true, scale: 1.4, eyes: 'angry' }) }),
    en({ id: 'walrus', name: 'Walrus', cost: 5, hp: 760, dmg: 80, speed: 40, rate: 1.4, traits: ['red'], desc: 'Red walrus with tusks.', look: elook({ body: 'wide', color: '#c85a4a', ears: 'none', snout: true, snoutColor: '#e8907f', tusks: true, scale: 1.3 }) }),
    en({ id: 'ghostdog', name: 'Ghost Pup', cost: 3, hp: 260, dmg: 52, speed: 60, rate: 1.0, flying: true, hitsAir: true, traits: ['floating'], desc: 'Boo! Floats through anything.', look: elook({ color: '#e0f0ffcc', ghost: true, eyes: 'glow', snout: false, ears: 'floppy' }) }),
    en({ id: 'zombiepup', name: 'Zombie Pup', cost: 2, hp: 190, dmg: 32, speed: 55, rate: 1.0, revive: 1, desc: 'Keeps coming back.', look: elook({ color: '#98b58a', eyes: 'x', bandage: true }) }),
    en({ id: 'bat', name: 'Bat Swarm', cost: 3, hp: 60, dmg: 16, speed: 95, rate: 0.6, count: 4, flying: true, hitsAir: true, traits: ['floating'], desc: 'Tiny, many, annoying.', look: elook({ color: '#4a3a5a', ears: 'pointy', snout: false, wings: true, scale: 0.55, eyes: 'glow' }) }),
    en({ id: 'robodog', name: 'Robo Dog', cost: 4, hp: 420, dmg: 74, speed: 50, rate: 1.0, traits: ['metal'], desc: 'Armored. Most attacks barely scratch it.', look: elook({ color: '#aab4c8', body: 'box', antenna: true, eyes: 'glow', snoutColor: '#8090a8' }) }),
    en({ id: 'drone', name: 'Drone', cost: 3, hp: 160, dmg: 44, range: 100, speed: 60, rate: 1.1, flying: true, hitsAir: true, traits: ['metal', 'floating'], desc: 'Bzzzz. Metal and flying.', look: elook({ color: '#b8c4d8', body: 'box', ears: 'none', snout: false, rotor: true, eyes: 'glow', scale: 0.8 }) }),
    en({ id: 'tankbot', name: 'Tank Bot', cost: 6, hp: 1100, dmg: 90, speed: 35, rate: 1.5, area: 40, traits: ['metal'], desc: 'A rolling metal fortress.', look: elook({ color: '#8894a8', body: 'box', ears: 'none', snout: false, antenna: true, eyes: 'glow', scale: 1.4, treads: true }) }),
    en({ id: 'grey', name: 'Little Grey', cost: 3, hp: 250, dmg: 62, range: 100, speed: 65, rate: 1.1, hitsAir: true, traits: ['alien'], desc: 'Take me to your kibble.', look: elook({ color: '#b8f0c8', ears: 'none', snout: false, eyes: 'alien', item: '🔫', body: 'tall' }) }),
    en({ id: 'ufo', name: 'Saucer', cost: 5, hp: 520, dmg: 92, range: 120, speed: 50, rate: 1.5, flying: true, hitsAir: true, area: 46, traits: ['alien', 'floating'], desc: 'Beams down splash damage.', look: elook({ color: '#c8ffd8', ears: 'none', snout: false, eyes: 'alien', ufo: true }) }),
    en({ id: 'blob', name: 'Space Blob', cost: 4, hp: 700, dmg: 40, speed: 45, rate: 1.2, traits: ['alien'], revive: 1, desc: 'Squishy. Re-forms once.', look: elook({ color: '#a0e0ffcc', ears: 'none', snout: false, eyes: 'alien', body: 'round', scale: 1.25 }) }),
    // ---- BOSSES ----
    en({ id: 'b_bigpupper', name: 'Big Pupper', cost: 6, hp: 1500, dmg: 110, speed: 40, rate: 1.6, area: 50, knockback: true, boss: true, desc: 'The backyard bully.', look: elook({ scale: 1.8, eyes: 'angry', hat: '🦴' }) }),
    en({ id: 'b_trashking', name: 'Trash King', cost: 7, hp: 1900, dmg: 140, speed: 45, rate: 1.4, area: 50, boss: true, desc: 'King of the dumpsters.', look: elook({ color: '#9a9a9a', ears: 'pointy', mask: true, tail: 'ring', scale: 1.8, hat: '👑', eyes: 'angry' }) }),
    en({ id: 'b_gorillachief', name: 'Gorilla Chief', cost: 7, hp: 2200, dmg: 170, speed: 55, rate: 1.3, area: 55, traits: ['red'], boss: true, desc: 'Beats its chest. A lot.', look: elook({ body: 'wide', color: '#b33a26', ears: 'round', snoutColor: '#e07a68', eyes: 'angry', scale: 1.9, hat: '👑' }) }),
    en({ id: 'b_megapigeon', name: 'Mega Pigeon', cost: 8, hp: 2000, dmg: 150, range: 100, speed: 50, rate: 1.5, area: 55, flying: true, hitsAir: true, traits: ['floating'], boss: true, desc: 'It ate ALL the bread.', look: elook({ color: '#8b9bb4', ears: 'none', snout: false, beak: true, wings: true, scale: 1.9, eyes: 'angry' }) }),
    en({ id: 'b_yetiking', name: 'Yeti King', cost: 8, hp: 2900, dmg: 210, speed: 40, rate: 1.7, area: 60, knockback: true, boss: true, desc: 'Avalanche with legs.', look: elook({ body: 'wide', color: '#eef6ff', ears: 'round', fluffy: true, snoutColor: '#bcd', scale: 2.1, eyes: 'angry', hat: '👑' }) }),
    en({ id: 'b_vampdoge', name: 'Count Dogula', cost: 9, hp: 2700, dmg: 200, speed: 55, rate: 1.2, flying: true, hitsAir: true, lifesteal: 0.5, traits: ['floating'], boss: true, desc: 'Vants to suck your kibble.', look: elook({ color: '#d8d0e8', cape: true, fangs: true, eyes: 'glow', scale: 1.8, hat: '🎩' }) }),
    en({ id: 'b_mechabear', name: 'Mecha Bear', cost: 10, hp: 3400, dmg: 260, speed: 38, rate: 1.8, area: 65, traits: ['metal'], boss: true, desc: 'Teacher Bear got an upgrade.', look: elook({ color: '#7f8ca6', body: 'box', ears: 'round', antenna: true, eyes: 'glow', snoutColor: '#5a6480', scale: 2.0, hat: '🎓' }) }),
    en({ id: 'b_emperor', name: 'Alien Emperor', cost: 10, hp: 4200, dmg: 320, range: 70, speed: 40, rate: 2.0, area: 70, knockback: true, traits: ['alien'], boss: true, desc: 'Ruler of the Moon. Final boss!', look: elook({ color: '#9ff0b8', ears: 'none', snout: false, eyes: 'alien', body: 'tall', scale: 2.1, hat: '👑', item: '🔱' }) }),
  ];
  const ENEMY_BY_ID = {}; ENEMIES.forEach(e => ENEMY_BY_ID[e.id] = e);

  // ---------------- WORLDS ----------------
  const WORLDS = [
    { id: 0, name: 'Backyard', icon: '🏡', bg: { grass: '#6cc06a', lane: '#8fd48a', river: '#c9a06a', accent: '#4b9a48' }, desc: 'Where every cat begins. Watch out for the neighbor’s dogs.',
      rewardCat: 'lizard', pool: ['pupper', 'wormy', 'mailmen', 'sheep'], boss: 'b_bigpupper',
      stages: ['Front Porch', 'Flower Bed', 'The Sandbox', 'Doghouse Row', 'Big Pupper’s Yard'] },
    { id: 1, name: 'Alley', icon: '🗑️', bg: { grass: '#6d6d78', lane: '#8a8a96', river: '#4a4a55', accent: '#55555f' }, desc: 'Dark, damp, and full of rats. Trash never smelled so dangerous.',
      rewardCat: 'colossal', pool: ['pupper', 'rats', 'raccoon', 'piggy', 'sheep', 'wormy'], boss: 'b_trashking',
      stages: ['Dumpster Dive', 'Fire Escape', 'Rat Central', 'Smelly Corner', 'Trash King’s Throne'] },
    { id: 2, name: 'City Park', icon: '🌳', bg: { grass: '#4fae5c', lane: '#7ccf7e', river: '#5ab6e6', accent: '#2f8a3e' }, desc: 'Picnics, ponds, and an unreasonable amount of angry gorillas.',
      rewardCat: 'ninja', pool: ['hippo', 'piggy', 'gorilla', 'mailmen', 'rats', 'kangaroo'], boss: 'b_gorillachief',
      stages: ['Picnic Blanket', 'Duck Pond', 'Jungle Gym', 'Red Zone', 'Gorilla Chief’s Grove'] },
    { id: 3, name: 'Rooftops', icon: '🌆', bg: { grass: '#6a5b8f', lane: '#8d7cb8', river: '#3a2f5c', accent: '#4d4070' }, desc: 'High above the city. Flying enemies rule up here. Bring anti-air!',
      rewardCat: 'wizard', pool: ['pigeon', 'crow', 'raccoon', 'kangaroo', 'pengu', 'gorilla'], boss: 'b_megapigeon',
      stages: ['Water Tower', 'Pigeon Ledge', 'Neon Sign', 'Sky Bridge', 'Mega Pigeon’s Nest'] },
    { id: 4, name: 'Frosty Peaks', icon: '❄️', bg: { grass: '#dbeeff', lane: '#f2f8ff', river: '#8cc8f0', accent: '#b8d8f0' }, desc: 'Freezing cold. Yetis, walruses and a whole lot of penguins.',
      rewardCat: 'ice', pool: ['pengu', 'walrus', 'yeti', 'seal', 'sheep', 'crow'], boss: 'b_yetiking',
      stages: ['Snowball Fight', 'Frozen Lake', 'Icicle Cave', 'Blizzard Pass', 'Yeti King’s Summit'] },
    { id: 5, name: 'Haunted Mansion', icon: '👻', bg: { grass: '#3b2a4a', lane: '#55406a', river: '#1f1530', accent: '#2a1d3a' }, desc: 'Spooky! Ghosts float, zombies revive, and bats are everywhere.',
      rewardCat: 'knight', pool: ['ghostdog', 'zombiepup', 'bat', 'seal', 'raccoon', 'crow'], boss: 'b_vampdoge',
      stages: ['Creaky Gate', 'Cobweb Hall', 'Graveyard', 'Bat Attic', 'Count Dogula’s Tower'] },
    { id: 6, name: 'Robot Factory', icon: '🤖', bg: { grass: '#4a5568', lane: '#6a7488', river: '#f0a020', accent: '#3a4354' }, desc: 'Metal enemies shrug off normal hits. Armor-piercing cats shine here.',
      rewardCat: 'dracula', pool: ['robodog', 'drone', 'tankbot', 'walrus', 'kangaroo', 'yeti'], boss: 'b_mechabear',
      stages: ['Assembly Line', 'Drone Bay', 'Scrap Heap', 'Reactor Core', 'Mecha Bear’s Lab'] },
    { id: 7, name: 'The Moon', icon: '🌙', bg: { grass: '#8a8f9e', lane: '#b4b9c8', river: '#1a1d2e', accent: '#5c6070' }, desc: 'The final frontier. The Alien Emperor wants Earth’s kibble. Stop him!',
      rewardCat: 'dragonking', pool: ['grey', 'ufo', 'blob', 'tankbot', 'drone', 'ghostdog'], boss: 'b_emperor',
      stages: ['Crater Camp', 'Dark Side', 'Saucer Landing', 'Blob Fields', 'Emperor’s Palace'] },
  ];
  // Extra mid-world cat rewards (stage 3 of some worlds)
  const STAGE_CAT_REWARDS = { '0-2': 'zombie', '1-2': 'archer', '2-2': 'sumo', '3-2': 'angel', '4-2': 'bomber', '5-2': 'samurai', '6-2': 'robo', '7-2': 'laser' };

  const STARTER_DECK = ['kitty', 'chonk', 'hatchet', 'noodle', 'zoomies', 'birdy', 'fishy', 'fishbomb'];
  const STARTER_OWNED = ['kitty', 'chonk', 'hatchet', 'noodle', 'zoomies', 'birdy', 'fishy', 'fishbomb', 'yarn', 'box'];

  const CAPSULE_COST = 30;
  const CAPSULE_ODDS = { special: 40, rare: 32, superrare: 20, uber: 8 };
  const DUPE_REFUND = { special: 120, rare: 200, superrare: 320, uber: 500, basic: 80, spell: 100 };

  const TRAIT_INFO = { red: { icon: '🔴', name: 'Red' }, floating: { icon: '🎈', name: 'Floating' }, metal: { icon: '⚙️', name: 'Metal' }, alien: { icon: '👽', name: 'Alien' } };

  // Difficulty scaling by global stage index (0..39)
  const stageIndex = (w, s) => w * 5 + s;
  const enemyMult = idx => 1 + 0.04 * idx;
  const aiLevel = idx => Math.min(5, 1 + Math.floor(idx / 9));
  const towerMult = idx => 1 + 0.03 * idx;

  const stageRewards = (w, s, firstClear, paws) => {
    const idx = stageIndex(w, s);
    const isBoss = s === 4;
    const food = firstClear ? 120 + 45 * idx + 30 * paws : 40 + 12 * idx + 10 * paws;
    let nip = firstClear ? (isBoss ? 30 : 8) : (Math.random() < 0.25 ? 2 : 0);
    return { food, nip };
  };

  return { RARITY, FORM_MULT, LEVEL_MULT, MAX_LEVEL, CATS, CAT_BY_ID, ENEMIES, ENEMY_BY_ID, WORLDS, STAGE_CAT_REWARDS, STARTER_DECK, STARTER_OWNED, CAPSULE_COST, CAPSULE_ODDS, DUPE_REFUND, TRAIT_INFO, stageIndex, enemyMult, aiLevel, towerMult, stageRewards };
})();

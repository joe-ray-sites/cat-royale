// Headless balance simulator: node tools/sim.js [playerLevel] [runs]
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = { console, Math, Set, Map, performance: { now: () => Date.now() }, document: { createElement: () => ({ getContext: () => new Proxy({}, { get: () => () => {} }), width: 0, height: 0 }) }, window: {} };
vm.createContext(ctx);
for (const f of ['data.js', 'art.js', 'engine.js', 'ai.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
vm.runInContext('this.DATA=DATA;this.ENGINE=ENGINE;this.AI=AI;', ctx);
const { DATA, ENGINE, AI } = ctx;

function enemyDeckFor(w, s) {
  const world = DATA.WORLDS[w]; const prev = w > 0 ? DATA.WORLDS[w - 1].pool : ['pupper', 'wormy'];
  const ids = world.pool.slice(0, 3 + s);
  for (const id of prev) if (ids.length < 8 && !ids.includes(id)) ids.push(id);
  for (const id of world.pool) if (ids.length < 8 && !ids.includes(id)) ids.push(id);
  while (ids.length < 8) ids.push(['pupper', 'wormy', 'mailmen'][ids.length % 3]);
  return ids.slice(0, 8);
}
function run(w, s, deckIds, level, form, towerLevel, playerAiLevel) {
  const idx = DATA.stageIndex(w, s); const world = DATA.WORLDS[w]; const mult = DATA.enemyMult(idx);
  const playerCards = deckIds.map(id => ENGINE.makeCard(DATA.CAT_BY_ID[id], { level, form }, 0));
  const enemyCards = enemyDeckFor(w, s).map(id => ENGINE.makeCard(DATA.ENEMY_BY_ID[id], { mult }, 1));
  const boss = s === 4 ? ENGINE.makeCard(DATA.ENEMY_BY_ID[world.boss], { mult: mult * 0.8 }, 1) : null;
  const pai = new AI.NpcAI(playerAiLevel, 0);
  const b = new ENGINE.Battle({ world, stage: s, playerCards, enemyCards, enemyMult: mult, enemyTowerMult: DATA.towerMult(idx), playerTowerMult: 1 + 0.08 * (towerLevel - 1), ai: new AI.NpcAI(DATA.aiLevel(idx)), boss, onEvent: () => {} });
  let steps = 0;
  while (!b.over && steps < 60 * 300) { pai.update(1 / 60, b); b.step(1 / 60); steps++; }
  return { win: b.winner === 0, paws: b.paws.slice(), t: b.t };
}
const level = +process.argv[2] || 1, runs = +process.argv[3] || 6;
const decks = {
  starter: DATA.STARTER_DECK,
  mid: ['kitty', 'chonk', 'hatchet', 'noodle', 'zoomies', 'lizard', 'colossal', 'fishbomb'],
  late: ['kitty', 'ninja', 'wizard', 'knight', 'zoomies', 'lizard', 'colossal', 'fishbomb'],
  uber: ['kitty', 'ninja', 'wizard', 'knight', 'valkyrie', 'dragonking', 'cosmic', 'fishbomb'],
};
const deckName = process.argv[4] || 'starter';
const form = level >= 10 ? 2 : level >= 5 ? 1 : 0;
const tower = Math.min(15, 1 + Math.floor(level * 1.2));
console.log(`Player: deck=${deckName} level=${level} form=${form} tower=${tower} playerAI=${process.argv[5] || 3}`);
for (let w = 0; w < 8; w++) {
  let line = `W${w + 1} `;
  for (let s = 0; s < 5; s++) {
    let wins = 0, paws = 0;
    for (let r = 0; r < runs; r++) { const o = run(w, s, decks[deckName], level, form, tower, +process.argv[5] || 3); if (o.win) wins++; paws += o.paws[0]; }
    line += `s${s + 1}:${Math.round(wins / runs * 100)}%(${(paws / runs).toFixed(1)}🐾) `;
  }
  console.log(line);
}

/* ============ SAVE / PROFILE ============ */
const SAVE = (() => {
  const KEY = 'catroyale.save.v1';
  let P = null;

  function fresh() {
    const cats = {};
    DATA.STARTER_OWNED.forEach(id => cats[id] = { level: 1, form: 0 });
    return {
      v: 1, food: 150, nip: 30, cats, deck: DATA.STARTER_DECK.slice(),
      paws: {},               // 'w-s' -> 1..3
      unlockedWorld: 0,
      towerLevel: 1,
      sound: true, tutorialSeen: false, battles: 0, wins: 0, capsules: 0,
      daily: { lastClaim: '', streak: 0, questDate: '', quests: [], bonusClaimed: false },
      created: Date.now(),
    };
  }
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) { P = JSON.parse(raw); if (!P.cats || !P.deck) P = fresh(); } else P = fresh(); }
    catch (e) { P = fresh(); }
    if (!P.daily) P.daily = { lastClaim: '', streak: 0, questDate: '', quests: [], bonusClaimed: false };
    // migrate: ensure every owned deck card exists
    P.deck = P.deck.filter(id => DATA.CAT_BY_ID[id] && P.cats[id]);
    while (P.deck.length < 8) { const cand = Object.keys(P.cats).find(id => !P.deck.includes(id)); if (!cand) break; P.deck.push(cand); }
    return P;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* ignore */ } }
  function reset() { P = fresh(); save(); return P; }
  const get = () => P;

  const owns = id => !!P.cats[id];
  function grant(id) { if (!P.cats[id]) { P.cats[id] = { level: 1, form: 0 }; save(); return true; } return false; }
  function upgradeCost(id) { const def = DATA.CAT_BY_ID[id]; const c = P.cats[id]; return DATA.RARITY[def.rarity].upgrade * c.level; }
  function canUpgrade(id) { const c = P.cats[id]; return c && c.level < DATA.MAX_LEVEL && P.food >= upgradeCost(id); }
  function upgrade(id) { if (!canUpgrade(id)) return false; P.food -= upgradeCost(id); P.cats[id].level++; save(); return true; }
  function evolveInfo(id) {
    const def = DATA.CAT_BY_ID[id]; const c = P.cats[id];
    if (!c || def.kind === 'spell' || c.form >= 2) return null;
    const needLevel = c.form === 0 ? 5 : 10;
    const cost = c.form === 0 ? DATA.RARITY[def.rarity].evo1 : DATA.RARITY[def.rarity].evo2;
    return { needLevel, cost, ok: c.level >= needLevel && P.nip >= cost, nextName: def.forms[c.form + 1].name };
  }
  function evolve(id) { const e = evolveInfo(id); if (!e || !e.ok) return false; P.nip -= e.cost; P.cats[id].form++; save(); return true; }
  function towerCost() { return 150 * P.towerLevel + 50 * P.towerLevel * P.towerLevel; }
  function upgradeTower() { const c = towerCost(); if (P.towerLevel >= 15 || P.food < c) return false; P.food -= c; P.towerLevel++; save(); return true; }
  function towerMult() { return 1 + 0.08 * (P.towerLevel - 1); }
  function setDeckSlot(slot, id) { if (P.deck.includes(id)) return false; P.deck[slot] = id; save(); return true; }
  function stageUnlocked(w, s) {
    if (w > P.unlockedWorld) return false;
    if (s === 0) return true;
    return !!P.paws[`${w}-${s - 1}`];
  }
  function recordWin(w, s, paws) {
    const k = `${w}-${s}`; const first = !P.paws[k];
    P.paws[k] = Math.max(P.paws[k] || 0, paws);
    if (s === 4 && P.unlockedWorld === w && w < DATA.WORLDS.length - 1) P.unlockedWorld = w + 1;
    P.wins++; save(); return first;
  }
  function addRewards(food, nip) { P.food += food; P.nip += nip; save(); }
  function capsulePull() {
    const odds = DATA.CAPSULE_ODDS; const total = Object.values(odds).reduce((a, b) => a + b, 0);
    let r = Math.random() * total, rarity = 'special';
    for (const k in odds) { r -= odds[k]; if (r <= 0) { rarity = k; break; } }
    let pool = DATA.CATS.filter(c => c.rarity === rarity);
    const unowned = pool.filter(c => !P.cats[c.id]);
    if (unowned.length && (Math.random() < 0.65 || unowned.length === pool.length)) pool = unowned;
    const def = pool[Math.floor(Math.random() * pool.length)];
    const isNew = grant(def.id);
    let refund = 0;
    if (!isNew) { refund = DATA.DUPE_REFUND[def.rarity]; P.food += refund; }
    P.capsules++; save();
    return { def, isNew, refund };
  }
  // ---------- Daily reward (7-day streak) ----------
  const STREAK = [
    { food: 100 }, { food: 150 }, { food: 200 }, { food: 250, nip: 5 }, { food: 300 }, { food: 400 }, { food: 600, nip: 20 },
  ];
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function dailyStatus() {
    const D = P.daily; const claimedToday = D.lastClaim === today();
    // streak continues if last claim was today or yesterday, else it restarts at day 1
    const streak = claimedToday ? D.streak : (D.lastClaim === yesterday() ? D.streak : 0);
    const dayIndex = claimedToday ? (streak - 1) : (streak % 7);   // 0..6 = which chip is "today"
    return { claimedToday, streak, dayIndex, reward: STREAK[((claimedToday ? streak - 1 : streak) % 7 + 7) % 7] };
  }
  function claimDaily() {
    const st = dailyStatus(); if (st.claimedToday) return null;
    const D = P.daily; D.streak = st.streak + 1; D.lastClaim = today();
    const r = STREAK[(D.streak - 1) % 7];
    P.food += r.food; if (r.nip) P.nip += r.nip; save();
    return { food: r.food, nip: r.nip || 0, day: ((D.streak - 1) % 7) + 1, streak: D.streak };
  }
  // ---------- Daily quests ----------
  const QUEST_TEMPLATES = [
    { id: 'win', icon: '🏆', title: n => `Win ${n} battle${n > 1 ? 's' : ''}`, goals: [1, 2, 3], reward: n => 90 * n },
    { id: 'play', icon: '⚔️', title: n => `Play ${n} battles`, goals: [2, 3, 4], reward: n => 45 * n },
    { id: 'deploy', icon: '🐱', title: n => `Send out ${n} cats`, goals: [15, 20, 30], reward: n => 5 * n },
    { id: 'spell', icon: '🧶', title: n => `Cast ${n} spells`, goals: [3, 4, 6], reward: n => 30 * n },
    { id: 'tower', icon: '🏠', title: n => `Knock down ${n} doghouses`, goals: [3, 4, 6], reward: n => 35 * n },
    { id: 'cannon', icon: '🔫', title: n => `Fire the Cat Cannon ${n} times`, goals: [2, 3, 4], reward: n => 45 * n },
    { id: 'paws3', icon: '🐾', title: () => 'Win a battle with 3 paws', goals: [1], reward: () => 220 },
    { id: 'boss', icon: '👑', title: () => 'Beat a boss stage', goals: [1], reward: () => 260 },
    { id: 'upgrade', icon: '⬆️', title: n => `Upgrade a cat ${n} time${n > 1 ? 's' : ''}`, goals: [1, 2], reward: n => 70 * n },
  ];
  const QUEST_BONUS_NIP = 10;
  function ensureQuests() {
    const D = P.daily; const t = today();
    if (D.questDate === t && D.quests.length === 3) return D.quests;
    // seeded by date so a refresh never rerolls today's quests
    let seed = 0; for (const ch of t) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const pool = QUEST_TEMPLATES.slice(); const picks = [];
    while (picks.length < 3) { const tpl = pool.splice(Math.floor(rnd() * pool.length), 1)[0]; const goal = tpl.goals[Math.floor(rnd() * tpl.goals.length)]; picks.push({ id: tpl.id, goal, progress: 0, claimed: false }); }
    D.questDate = t; D.quests = picks; D.bonusClaimed = false; save();
    return D.quests;
  }
  function questView() {
    return ensureQuests().map(q => { const tpl = QUEST_TEMPLATES.find(t => t.id === q.id); return { ...q, icon: tpl.icon, title: tpl.title(q.goal), reward: tpl.reward(q.goal), done: q.progress >= q.goal }; });
  }
  function questEvent(id, amount = 1) {
    const qs = ensureQuests(); let changed = false;
    for (const q of qs) { if (q.id === id && !q.claimed && q.progress < q.goal) { q.progress = Math.min(q.goal, q.progress + amount); changed = true; } }
    if (changed) save();
    return changed;
  }
  function claimQuest(idx) {
    const q = ensureQuests()[idx]; if (!q || q.claimed || q.progress < q.goal) return 0;
    const tpl = QUEST_TEMPLATES.find(t => t.id === q.id); const r = tpl.reward(q.goal);
    q.claimed = true; P.food += r; save(); return r;
  }
  function claimQuestBonus() {
    const D = P.daily; const qs = ensureQuests();
    if (D.bonusClaimed || !qs.every(q => q.claimed)) return 0;
    D.bonusClaimed = true; P.nip += QUEST_BONUS_NIP; save(); return QUEST_BONUS_NIP;
  }
  function dailyHasClaimable() {
    const st = dailyStatus(); if (!st.claimedToday) return true;
    const qs = questView(); if (qs.some(q => q.done && !q.claimed)) return true;
    return qs.every(q => q.claimed) && !P.daily.bonusClaimed;
  }
  // ---------- Shop ----------
  const FOOD_BUNDLES = [
    { nip: 10, food: 300, icon: '🥫', name: 'Snack Pack' },
    { nip: 25, food: 850, icon: '🍱', name: 'Dinner Box' },
    { nip: 50, food: 2000, icon: '🛒', name: 'Mega Haul' },
  ];
  function buyFood(i) { const b = FOOD_BUNDLES[i]; if (!b || P.nip < b.nip) return null; P.nip -= b.nip; P.food += b.food; save(); return b; }
  const PROMO_CODES = { lawsonisthebest: { nip: 50 } };
  function redeemPromo(raw) {
    const code = String(raw || '').trim().toLowerCase().replace(/\s+/g, '');
    const promo = PROMO_CODES[code];
    if (!promo) return { ok: false, reason: 'invalid' };
    if (!P.promo) P.promo = {};
    if (P.promo[code] === today()) return { ok: false, reason: 'used' };
    P.promo[code] = today(); P.nip += promo.nip; save();
    return { ok: true, nip: promo.nip };
  }
  function msUntilReset() { const d = new Date(); const n = new Date(d); n.setHours(24, 0, 0, 0); return n - d; }

  return { load, save, reset, get, owns, STREAK, QUEST_BONUS_NIP, dailyStatus, claimDaily, ensureQuests, questView, questEvent, claimQuest, claimQuestBonus, dailyHasClaimable, msUntilReset, FOOD_BUNDLES, buyFood, redeemPromo, grant, upgradeCost, canUpgrade, upgrade, evolveInfo, evolve, towerCost, upgradeTower, towerMult, setDeckSlot, stageUnlocked, recordWin, addRewards, capsulePull };
})();

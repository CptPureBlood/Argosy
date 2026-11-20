/* Argosy – headless logic tests: routing, economy, wind, voyage, combat, shipyard, save/load, i18n coverage. */
'use strict';
const fs = require('fs');
const path = require('path');
global.window = global;
const root = path.join(__dirname, '..', 'www', 'js');
['data.js', 'world-data.js', 'ports.js', 'world.js', 'game.js', 'content.js', 'game2.js', 'i18n.js'].forEach((f) => require(path.join(root, f)));
const A = global.A, R = A.game, W = A.world;

let failed = 0;
const ok = (c, msg) => { if (!c) { failed++; console.error('FAIL: ' + msg); } else console.log('ok   ' + msg); };

// ---- world
W.build();
let unreachable = 0;
for (const a of A.PORTS) for (const b of A.PORTS) if (a.id < b.id && !W.findPath(a.lon, a.lat, b.lon, b.lat)) unreachable++;
ok(unreachable === 0, 'all port pairs have a sea route');
const vr = W.route('venice', 'alexandria').total;
ok(vr > 900 && vr < 1700, 'Venice-Alexandria distance plausible: ' + Math.round(vr) + ' nm');

// ---- new game / market / trade
const S = R.newGame();
ok(S.ships.length === 1 && S.gold === A.C.START_GOLD, 'new game starts with one ship and starting gold');
const g0 = S.gold;
const b = R.buy('glass', 5);
ok(b.ok && S.cargo.glass === 5 && S.gold < g0, 'buy works');
const sl = R.sell('glass', 5);
ok(sl.ok && !S.cargo.glass, 'sell works');
ok(R.buyPrice('venice', 'glass') < A.GOOD_BY_ID.glass.base, 'producer port sells cheap');
ok(R.buyPrice('venice', 'spice') > A.GOOD_BY_ID.spice.base, 'demand port prices high');

// ---- wind
S.wind.dir = 90; // blowing toward east
ok(R.windFactor(90) > 1 && R.windFactor(270) < 1, 'tailwind faster, headwind slower');

// ---- ships, yard
S.gold = 20000;
ok(R.hasYard() && R.buyShip('caravel') && S.ships.length === 2, 'buy ship at a shipyard');
const cv = S.ships[1];
ok(R.buyCannons(cv.id, 3) === 3, 'buy cannons');
ok(R.buyCannons(cv.id, 99) <= A.SHIPS.caravel.cannons, 'cannon limit enforced');
ok(R.hireCrew(cv.id, 5) === 5, 'hire crew');
S.port = 'naples';
ok(!R.buyShip('galley'), 'no shipyard in Marseille');
S.port = 'venice';

// ---- escort, insurance, voyage
ok(R.hireEscort('light') && S.escortShip, 'hire escort');
R.cancelEscort();
const est = R.estimate('ragusa');
ok(est.days > 0 && est.nm > 200, 'estimate Ragusa ' + est.days + ' days ' + Math.round(est.nm) + ' nm');

// ---- full simulation with a trading bot (also exercises combat)
function bot(days) {
  R.newGame(); const s = R.S(); let fights = 0, wins = 0, flees = 0, boards = 0, defeats = 0, prizes = 0;
  while (s.day < days) {
    const here = s.port;
    Object.keys(s.cargo).forEach((g) => R.sell(g, s.cargo[g]));
    if (R.hasYard() && s.gold > 5000 && s.ships.length < 3) R.buyShip('caravel');
    if (R.hasYard()) s.ships.forEach((sh) => { R.repair(sh.id); R.hireCrew(sh.id, 3); R.buyCannons(sh.id, 2); });
    let best = null;
    A.PORTS.forEach((d) => { if (d.id === here) return; A.GOODS.forEach((g) => {
      const est2 = R.estimate(d.id);
      const per = R.sellPrice(d.id, g.id) - R.buyPrice(here, g.id);
      const score = per / Math.max(1, est2.days);
      if (per > 0 && (!best || score > best.score)) best = { d: d.id, g: g.id, score };
    }); });
    if (!best) { R.rest(); continue; }
    R.buy(best.g, 999);
    const sv = R.startVoyage(best.d, { insure: Math.random() < 0.5 && s.gold >= R.insuranceCost() });
    if (!sv.ok) { R.rest(); continue; }
    let arrived = false, lost = false;
    while (!arrived && !lost) {
      const r = R.stepVoyage();
      for (const ev of r.events) {
        if (ev.type !== 'pirates') continue;
        fights++;
        const c = R.newCombat(R.genPirates(ev.zone));
        let t = 0;
        while (!c.over && t < 300) {
          R.stepCombat(c, 0.5); t += 0.5; c.events.length = 0;
          if (t > 6 && Math.random() < 0.15 && R.boardChance(c) > 0.3) { if (R.board(c)) boards++; }
          if (t > 10 && R.fleeChance(c) > 0.6 && Math.random() < 0.05 && c.p.length) R.flee(c);
        }
        if (!c.over) c.over = 'fled';
        const res = R.finishCombat(c);
        if (res.result === 'win') wins++; if (res.result === 'fled') flees++;
        if (res.result === 'lose') { defeats++; lost = true; }
        res.prizes.forEach((p) => { prizes++; Math.random() < 0.5 ? R.keepPrize(p) : R.sellPrize(p); });
        ok_(R.cargoCount() <= R.fleetCap(), 'cargo within capacity after combat');
        break;
      }
      if (lost) break;
      if (r.arrived) arrived = true;
    }
    if (arrived) R.arrive();
    ok_(s.gold >= 0 && s.morale >= 0 && s.morale <= 100, 'sane gold/morale');
    ok_(s.ships.length >= 1 && s.ships.length <= A.C.MAX_FLEET, 'fleet size in range');
  }
  return { gold: s.gold, ships: s.ships.length, fights, wins, flees, boards, defeats, prizes, rep: Object.keys(s.rep).length, morale: Math.round(s.morale) };
}
function ok_(c, m) { if (!c) { failed++; console.error('FAIL(bot): ' + m); } }
for (let i = 0; i < 3; i++) {
  const t0 = Date.now(); const r = bot(120);
  console.log('bot run', i + 1, JSON.stringify(r), (Date.now() - t0) + ' ms');
}
ok(failed === 0, 'bot simulations raised no invariant failures');

// ---- save / load
R.save();
const snap = JSON.stringify(R.S());
R.load();
ok(R.S() && R.S().day === JSON.parse(snap).day, 'save and load round-trip');

// ---- i18n coverage: every t('key') used in the UI exists in both languages
const keys = new Set();
fs.readdirSync(root).filter((f) => f.endsWith('.js')).forEach((f) => {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  const re = /\bt\(\s*'([A-Za-z0-9_.]+)'/g; let m;
  while ((m = re.exec(src))) { if (!m[1].endsWith('.')) keys.add(m[1]); }
});
// dynamic keys built with string concatenation
for (let i = 0; i <= 5; i++) keys.add('rep.' + i);
for (let i = 0; i <= 4; i++) keys.add('morale.' + i);
['low', 'mid', 'high'].forEach((k) => keys.add('risk.' + k));
['weak', 'even', 'strong', 'deadly'].forEach((k) => keys.add('threat.' + k));
const missing = [];
keys.forEach((k) => { if (!(k in A.I18N.en)) missing.push('en:' + k); if (!(k in A.I18N.tr)) missing.push('tr:' + k); });
ok(missing.length === 0, 'i18n keys complete (' + keys.size + ' keys)' + (missing.length ? ' missing: ' + missing.join(', ') : ''));

console.log(failed ? '\n' + failed + ' FAILED' : '\nALL PASSED');
process.exit(failed ? 1 : 0);

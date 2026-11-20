/* Argosy – game rules and state (no DOM). Everything the UI needs is exposed on A.game. */
(function (G) {
  const A = G.A, C = A.C;
  const RAD = Math.PI / 180;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri = (a, b) => Math.floor(rnd(a, b + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  A.rnd = rnd; A.ri = ri; A.clamp = clamp; A.pick = pick;

  // storage abstraction (localStorage in the app, memory in tests)
  const mem = {};
  A.storage = {
    get(k) { try { if (typeof localStorage !== 'undefined') return localStorage.getItem(k); } catch (e) {} return mem[k] || null; },
    set(k, v) { try { if (typeof localStorage !== 'undefined') { localStorage.setItem(k, v); return; } } catch (e) {} mem[k] = v; },
    del(k) { try { if (typeof localStorage !== 'undefined') localStorage.removeItem(k); } catch (e) {} delete mem[k]; },
  };

  let S = null;
  const R = (A.game = {});
  R.S = () => S;

  // ------------------------------------------------------------------ ships & fleet
  const T = (type) => A.SHIPS[type];
  R.shipType = T;
  R.mkShip = function (type, o) {
    o = o || {};
    const t = T(type);
    return {
      id: S ? S.nextId++ : 0, type, name: o.name || pick(A.SHIP_NAMES),
      hull: o.hull != null ? o.hull : t.hull, crew: o.crew != null ? o.crew : t.crewMin,
      exp: o.exp != null ? o.exp : 2, cannons: o.cannons != null ? o.cannons : Math.floor(t.cannons * 0.3),
    };
  };
  R.shipSpeed = (s) => T(s.type).speed * (0.7 + 0.3 * (s.hull / T(s.type).hull)) * R.speedMod();
  R.fleetSpeed = () => (S.ships.length ? Math.min.apply(null, S.ships.map(R.shipSpeed)) : 0);
  R.fleetCap = () => Math.floor(S.ships.reduce((a, s) => a + T(s.type).cap, 0) * R.capMod());
  R.cargoCount = () => Object.values(S.cargo).reduce((a, b) => a + b, 0);
  R.power = (s) => s.cannons * 3 + s.hull / 12 + s.crew / 6;
  R.fleetPower = () => S.ships.reduce((a, s) => a + R.power(s), 0);
  R.typePower = (k) => { const t = T(k); return t.cannons * 0.7 * 3 + t.hull / 12 + (t.crewMin + t.crewMax) / 12; };
  R.cargoBaseValue = (c) => Object.keys(c || S.cargo).reduce((a, g) => a + (c || S.cargo)[g] * A.GOOD_BY_ID[g].base, 0);
  R.totalCrew = () => S.ships.reduce((a, s) => a + s.crew, 0);
  R.avgExp = () => (S.ships.length ? S.ships.reduce((a, s) => a + s.exp, 0) / S.ships.length : 0);

  // ------------------------------------------------------------------ market
  const TIER = { p: 0.7, n: 1, d: 1.45 };
  function tier(portId, goodId) { const p = A.port(portId); return p.p.indexOf(goodId) >= 0 ? 'p' : p.d.indexOf(goodId) >= 0 ? 'd' : 'n'; }
  R.tier = tier;
  function initMarket() {
    S.market = {};
    A.PORTS.forEach((p) => {
      S.market[p.id] = {};
      A.GOODS.forEach((g) => {
        const tr = tier(p.id, g.id);
        const ref = tr === 'p' ? ri(90, 130) : tr === 'd' ? ri(14, 24) : ri(40, 60);
        S.market[p.id][g.id] = { ref, stock: Math.round(ref * rnd(0.85, 1.15)) };
      });
    });
  }
  function priceAt(portId, goodId, stock) {
    const m = S.market[portId][goodId];
    const mult = clamp(Math.sqrt(m.ref / (Math.max(0, stock) + 3)), 0.55, 2.4);
    return A.GOOD_BY_ID[goodId].base * TIER[tier(portId, goodId)] * mult * (R.evMult ? R.evMult(portId, goodId) : 1);
  }
  const repOf = (portId) => S.rep[portId] || 0;
  R.rep = repOf;
  R.buyPrice = (portId, goodId, stock) => Math.max(1, Math.round(priceAt(portId, goodId, stock != null ? stock : S.market[portId][goodId].stock) * (1 - repOf(portId) * 0.0008) * R.pBuy()));
  R.sellPrice = (portId, goodId, stock) => Math.max(1, Math.round(priceAt(portId, goodId, stock != null ? stock : S.market[portId][goodId].stock) * 0.94 * (1 + repOf(portId) * 0.0008) * R.pSell()));
  R.stock = (portId, goodId) => Math.floor(S.market[portId][goodId].stock);
  R.trendPct = (portId, goodId) => Math.round((R.buyPrice(portId, goodId) / A.GOOD_BY_ID[goodId].base - 1) * 100);
  function addRep(portId, v) { S.rep[portId] = clamp(repOf(portId) + (v > 0 ? v * R.repMod() : v), 0, 100); }

  R.quoteBuy = function (goodId, q) {
    const p = S.port; const m = S.market[p][goodId];
    const free = R.fleetCap() - R.cargoCount();
    q = Math.max(0, Math.min(q, Math.floor(m.stock), free));
    let cost = 0, n = 0;
    for (let k = 0; k < q; k++) { const c = R.buyPrice(p, goodId, m.stock - k); if (cost + c > S.gold) break; cost += c; n++; }
    return { q: n, cost };
  };
  R.buy = function (goodId, q) {
    const p = S.port; const qt = R.quoteBuy(goodId, q);
    if (qt.q <= 0) return { ok: false, q: 0 };
    const old = S.cargo[goodId] || 0;
    S.basis[goodId] = ((S.basis[goodId] || 0) * old + qt.cost) / (old + qt.q);
    S.cargo[goodId] = old + qt.q; S.market[p][goodId].stock -= qt.q; S.gold -= qt.cost;
    addRep(p, qt.cost / 700); S.stats.trades++; R.save();
    return { ok: true, q: qt.q, cost: qt.cost };
  };
  R.quoteSell = function (goodId, q) {
    const p = S.port; const m = S.market[p][goodId];
    q = Math.max(0, Math.min(q, S.cargo[goodId] || 0));
    let rev = 0;
    for (let k = 0; k < q; k++) rev += R.sellPrice(p, goodId, m.stock + k);
    return { q, rev };
  };
  R.sell = function (goodId, q) {
    const p = S.port; const qt = R.quoteSell(goodId, q);
    if (qt.q <= 0) return { ok: false, q: 0 };
    const profit = qt.rev - (S.basis[goodId] || 0) * qt.q;
    S.cargo[goodId] -= qt.q; if (S.cargo[goodId] <= 0) { delete S.cargo[goodId]; delete S.basis[goodId]; }
    S.market[p][goodId].stock += qt.q; S.gold += qt.rev; S.stats.profit += profit;
    addRep(p, qt.rev / 700); S.stats.trades++; R.save();
    return { ok: true, q: qt.q, rev: qt.rev, profit };
  };

  // ------------------------------------------------------------------ wind
  function stepWind() { S.wind.dir = (S.wind.dir + rnd(-35, 35) + 360) % 360; S.wind.str = clamp(S.wind.str + rnd(-0.45, 0.45), 0.4, 3); }
  R.windFactor = function (heading) {
    const wf = S.ships.length ? S.ships.reduce((a, s) => a + T(s.type).windF, 0) / S.ships.length : 1;
    const diff = Math.abs(((heading - S.wind.dir + 540) % 360) - 180); // 0 = wind pushes along our course
    const tail = Math.cos((180 - diff) * RAD) * -1; // diff 0 -> +1 ... diff 180 -> -1
    return clamp(1 + 0.17 * S.wind.str * tail * wf, 0.55, 1.6);
  };

  // ------------------------------------------------------------------ pirates & danger
  function rollSkulls() {
    const ids = A.PORTS.map((p) => p.id).sort(() => Math.random() - 0.5);
    S.skulls = ids.slice(0, 3); S.skullUntil = S.day + ri(8, 14);
  }
  R.zone = function (lon, lat) {
    let z = 0;
    S.skulls.forEach((id) => { const p = A.port(id); z = Math.max(z, clamp(1 - A.nm(lon, lat, p.lon, p.lat) / 260, 0, 1)); });
    return z;
  };
  R.routeZone = function (r) { let z = 0; for (let d = 0; d <= r.total; d += 40) { const p = A.world.posAt(r, d); z = Math.max(z, R.zone(p.lon, p.lat)); } return z; };
  R.estimate = function (toId) {
    const from = S.port || S.voyage.from;
    const r = A.world.route(from, toId);
    const v = R.fleetSpeed() || 5;
    let t = 0;
    for (let i = 1; i < r.pts.length; i++) {
      const len = r.cum[i] - r.cum[i - 1];
      const hd = A.bearing(r.pts[i - 1][0], r.pts[i - 1][1], r.pts[i][0], r.pts[i][1]);
      t += len / (v * C.NM_PER_KNOT_DAY * R.windFactor(hd));
    }
    const zone = R.routeZone(r);
    return { route: r, nm: r.total, days: Math.max(1, Math.round(t * 10) / 10), zone, risk: zone > 0.55 ? 'high' : zone > 0.2 ? 'mid' : 'low' };
  };
  function mkPirate(type) {
    const t = T(type);
    const sc = clamp(0.55 + S.day / 70, 0.55, 1); // early-game pirates are poorly armed
    return { id: 'e' + (S.nextId++), type, name: pick(A.PIRATE_NAMES), hull: Math.round(t.hull * rnd(0.7, 1) * (0.6 + 0.4 * sc) * 0.6), crew: Math.max(3, Math.round(ri(t.crewMin, t.crewMax) * sc * 0.6)), exp: Math.round(clamp(0.5 + S.day / 25 + rnd(0, 1.5), 0.5, 7) * 10) / 10, cannons: Math.max(1, Math.round(t.cannons * rnd(0.35, 0.9) * sc * 0.6)) };
  }
  R.genPirates = function (zone) {
    const mine = R.fleetPower() + (S.escortShip ? R.power(S.escortShip) * 0.5 : 0);
    const early = clamp(0.3 + S.day / 80, 0.3, 1.2);
    const target = Math.max(7, mine * rnd(0.45, 0.85) * early * (1 + zone * 0.8));
    const out = []; let sum = 0;
    while (out.length < 3) {
      const cand = A.SHIP_ORDER.filter((k) => R.typePower(k) <= (target - sum) * 1.25);
      const k = out.length === 0 && !cand.length ? 'felucca' : cand.length ? pick(cand.slice(-2)) : null;
      if (!k) break;
      const s = mkPirate(k); out.push(s); sum += R.power(s);
      if (sum >= target * 0.9) break;
    }
    return out;
  };
  R.threat = function (pirates) {
    const ep = pirates.reduce((a, s) => a + R.power(s), 0);
    const mp = R.fleetPower() + (S.escortShip ? R.power(S.escortShip) : 0);
    const r = ep / Math.max(1, mp);
    return r < 0.6 ? 'weak' : r < 1.0 ? 'even' : r < 1.5 ? 'strong' : 'deadly';
  };

  // ------------------------------------------------------------------ voyage
  R.moraleForDays = (d) => (d <= 1 ? -2 : d <= 2 ? -1 : d <= 4 ? 1 : d <= 8 ? 5 : d <= 11 ? 1 : -Math.min(5, d - 11));
  R.insuranceCost = () => Math.max(20, Math.round(R.cargoBaseValue() * C.INSURE_RATE));
  R.canDepart = () => S.port && S.ships.length > 0;
  R.startVoyage = function (toId, opts) {
    opts = opts || {};
    if (!S.port || toId === S.port) return { ok: false, err: 'bad' };
    let cost = 0;
    if (opts.insure && R.cargoCount() > 0) cost = R.insuranceCost();
    if (cost > S.gold) return { ok: false, err: 'gold' };
    S.gold -= cost; S.insured = cost > 0;
    const r = A.world.route(S.port, toId);
    S.voyage = { from: S.port, to: toId, travelled: 0, days: 0, total: r.total, startDay: S.day };
    S.port = null; R.save();
    return { ok: true };
  };
  R.voyagePos = function () { const v = S.voyage; const r = A.world.route(v.from, v.to); return A.world.posAt(r, v.travelled); };

  function advanceDay() {
    S.day++; stepWind();
    A.GOODS.forEach((g) => A.PORTS.forEach((p) => {
      const m = S.market[p.id][g.id];
      m.stock = Math.max(0, m.stock + (m.ref - m.stock) * 0.06 + rnd(-1, 1) * m.ref * 0.02);
    }));
    const up = Math.round(S.ships.reduce((a, s) => a + s.crew, 0) * C.UPKEEP_PER_CREW * R.upkeepMod()) + R.wages();
    R.dailyLife();
    S.gold -= up; let broke = false;
    if (S.gold < 0) { S.gold = 0; S.morale = clamp(S.morale - 4, 0, 100); broke = true; }
    if (S.day >= S.skullUntil) rollSkulls();
    const gone = S.quests.filter((q) => q.deadline < S.day);
    gone.forEach((q) => { addRep(q.to, -5); });
    S.quests = S.quests.filter((q) => q.deadline >= S.day);
    return { upkeep: up, broke, expired: gone };
  }
  R.advanceDay = advanceDay;

  // returns {events:[...], arrived:bool}
  R.stepVoyage = function () {
    const v = S.voyage; const r = A.world.route(v.from, v.to);
    const pos = A.world.posAt(r, v.travelled);
    const events = [];
    let f = R.windFactor(pos.heading);
    if (S.wind.str < 0.8 && Math.random() < 0.1) { f *= 0.3; events.push({ type: 'calm' }); }
    v.travelled = Math.min(v.total, v.travelled + R.fleetSpeed() * C.NM_PER_KNOT_DAY * f);
    v.days++;
    const d = advanceDay();
    if (d.broke) events.push({ type: 'broke' });
    d.expired.forEach((q) => events.push({ type: 'questExpired', q }));
    const np = A.world.posAt(r, v.travelled);
    if (Math.random() < (0.011 + 0.011 * S.wind.str) * R.stormMod()) {
      const sh = pick(S.ships); if (!R.has('weather')) sh.hull = Math.max(1, sh.hull - T(sh.type).hull * rnd(0.03, 0.08));
      let lost = {};
      Object.keys(S.cargo).forEach((g) => { const q = Math.floor(S.cargo[g] * rnd(0.02, 0.06)); if (q > 0) { lost[g] = q; S.cargo[g] -= q; if (S.cargo[g] <= 0) delete S.cargo[g]; } });
      S.morale = clamp(S.morale - 3, 0, 100);
      events.push({ type: 'storm', ship: sh.name, lost, refund: R.refundLoss(lost) });
    }
    const zone = R.zone(np.lon, np.lat);
    const early = S.day < 6 ? 0 : S.day < 14 ? 0.5 : 1;
    let pc = (0.03 + 0.3 * zone) * early * (S.escort ? 0.85 : 1) * R.lookoutMod();
    if (v.total - v.travelled < 35) pc = 0;
    if (Math.random() < pc) events.push({ type: 'pirates', zone });
    if (R.has('shipwright')) S.ships.forEach((sh) => { sh.hull = Math.min(T(sh.type).hull, sh.hull + T(sh.type).hull * 0.01); });
    const arrived = v.travelled >= v.total - 0.01;
    if (!events.some((e) => e.type === 'pirates')) R.save();
    return { events, arrived, pos: np };
  };
  R.arrive = function () {
    const v = S.voyage;
    const dm = R.moraleForDays(v.days);
    S.morale = clamp(S.morale + dm + (R.has('cheer') ? 1 : 0), 0, 100);
    const xp = Math.min(0.4, 0.06 + 0.04 * v.days) * (R.has('veterans') ? 2 : 1); S.ships.forEach((sh) => { sh.exp = Math.min(10, Math.round((sh.exp + xp) * 100) / 100); });
    S.port = v.to; S.voyage = null; S.insured = false; S.escort = null; S.escortShip = null;
    S.visited[S.port] = true; refreshOffers(S.port); R.save();
    return { days: v.days, dm, port: S.port };
  };
  // abort at sea (after defeat): back to departure port
  R.abortVoyage = function () { const v = S.voyage; S.port = v.from; S.voyage = null; S.insured = false; S.escort = null; S.escortShip = null; R.save(); };

  R.refundLoss = function (lost) {
    if (!S.insured) return 0;
    const val = Math.round(R.cargoBaseValue(lost) * C.INSURE_PAYOUT);
    S.gold += val; return val;
  };
  function clampCargo() {
    const cap = R.fleetCap(); let cnt = R.cargoCount(); const lost = {};
    while (cnt > cap) {
      const ks = Object.keys(S.cargo); if (!ks.length) break;
      const g = pick(ks); const q = Math.min(S.cargo[g], Math.max(1, Math.ceil((cnt - cap) / 2)));
      S.cargo[g] -= q; lost[g] = (lost[g] || 0) + q; cnt -= q; if (S.cargo[g] <= 0) delete S.cargo[g];
    }
    return lost;
  }

  // ------------------------------------------------------------------ combat
  R.hireEscort = function (id) {
    const e = A.ESCORTS[id]; if (!S.port || S.escort || S.gold < e.cost) return false;
    S.gold -= e.cost; S.escort = id;
    S.escortShip = { id: 'esc', type: e.type, name: e.n.en, hull: e.hull, crew: e.crew, exp: e.exp, cannons: e.cannons, escort: true, spd: e.speed };
    R.save(); return true;
  };
  R.cancelEscort = function () { if (!S.escort) return; S.gold += A.ESCORTS[S.escort].cost; S.escort = null; S.escortShip = null; R.save(); };

  const spd = (s) => (s.spd ? s.spd : R.shipSpeed(s));
  const alive = (a) => a.filter((s) => !s.sunk);
  R.newCombat = function (pirates) {
    const mine = S.ships.map((s) => s);
    if (S.escortShip) mine.push(S.escortShip);
    const c = { p: mine, e: pirates, t: 0, over: null, boardCd: 0, fleeCd: 0, events: [], prizes: [], startEnemyPower: pirates.reduce((a, s) => a + R.power(s), 0), startMine: S.ships.length, log: [] };
    const init = (s, side) => { s.sunk = false; s._side = side; s._cd = []; s._cdm = []; for (let i = 0; i < s.cannons; i++) { const v = rnd(0.8, 4.2); s._cd.push(v); s._cdm.push(4.4); } };
    c.p.forEach((s) => init(s, 'p')); c.e.forEach((s) => init(s, 'e'));
    return c;
  };
  function cooldown(s) { return clamp((4.4 - s.exp * 0.17 - (s._side === 'p' ? (S.morale - 50) * 0.01 : 0) + rnd(-0.3, 0.3)) * (s._side === 'p' ? R.cdMod() : 1), 1.4, 6); }
  R.hitChance = function (s, t) {
    let h = 0.5 + s.exp * 0.03 - clamp((spd(t) - 6) * 0.03, -0.1, 0.12) + (s._side === 'p' ? (S.morale - 50) * 0.002 : 0);
    if (s.crew < s.cannons * 2) h *= 0.8;
    if (s._side === 'p') h += R.hitBonus();
    return clamp(h, 0.2, 0.85);
  };
  function fire(c, s, foes) {
    const t = pick(foes);
    const hit = Math.random() < R.hitChance(s, t);
    const ev = { kind: 'shot', from: s.id, to: t.id, hit, side: s._side, sunk: false, cannonLost: false };
    if (hit) {
      const dmg = rnd(2.5, 5) * (1 + s.exp * 0.02);
      t.hull -= dmg; ev.dmg = dmg;
      if (Math.random() < 0.5) t.crew = Math.max(1, t.crew - ri(0, 2));
      if (t.cannons > 0 && Math.random() < 0.08) { t.cannons--; t._cd.pop(); t._cdm.pop(); ev.cannonLost = true; }
      if (t.hull <= 0) { t.hull = 0; t.sunk = true; ev.sunk = true; }
    }
    c.events.push(ev);
  }
  R.stepCombat = function (c, dt) {
    if (c.over) return;
    c.t += dt; c.boardCd = Math.max(0, c.boardCd - dt); c.fleeCd = Math.max(0, c.fleeCd - dt);
    [[c.p, c.e], [c.e, c.p]].forEach((pair) => {
      alive(pair[0]).forEach((s) => {
        for (let i = 0; i < s._cd.length; i++) {
          s._cd[i] -= dt;
          if (s._cd[i] <= 0) {
            const foes = alive(pair[1]);
            if (!foes.length) { s._cd[i] = 1; continue; }
            fire(c, s, foes); s._cd[i] = cooldown(s); s._cdm[i] = s._cd[i];
          }
        }
      });
    });
    c.t += 0;
    if (!alive(c.e).length) c.over = 'win';
    else if (!S.ships.some((s) => !s.sunk)) c.over = 'lose';
  };
  const avg = (a, f) => (a.length ? a.reduce((x, s) => x + f(s), 0) / a.length : 0);
  R.boardChance = function (c) {
    const mine = alive(c.p), en = alive(c.e); if (!mine.length || !en.length) return 0;
    const crewRatio = clamp(avg(mine, (s) => s.crew) * mine.length / Math.max(1, avg(en, (s) => s.crew) * en.length) - 1, -1, 1);
    return clamp(0.22 + 0.18 * (mine.length - 1) + 0.06 * (avg(mine, spd) - avg(en, spd)) + 0.03 * (avg(mine, (s) => s.exp) - avg(en, (s) => s.exp)) + 0.1 * crewRatio + (S.morale - 50) * 0.002 + R.discipline(), 0.05, 0.9);
  };
  R.fleeChance = function (c) {
    const mine = alive(c.p), en = alive(c.e); if (!mine.length || !en.length) return 0;
    const slow = Math.min.apply(null, mine.map(spd)), fast = Math.max.apply(null, en.map(spd));
    return clamp(0.25 + 0.08 * (slow - fast) + 0.02 * avg(mine, (s) => s.exp) + (S.morale - 50) * 0.002 - 0.03 * (mine.length - 1) + R.discipline(), 0.1, 0.92);
  };
  R.board = function (c) {
    if (c.over || c.boardCd > 0) return null;
    const chance = R.boardChance(c); const ok = Math.random() < chance;
    c.boardCd = 15;
    const en = alive(c.e).sort((a, b) => a.hull - b.hull)[0];
    if (ok) {
      en.sunk = true; en._captured = true;
      const t = T(en.type);
      c.prizes.push({ type: en.type, name: en.name, hull: Math.round(R.has('privateer') ? clamp(en.hull, t.hull * 0.35, t.hull * 0.7) : clamp(en.hull, t.hull * 0.12, t.hull * 0.4)), crew: Math.max(3, Math.ceil(t.crewMin * 0.5)), exp: 2, cannons: Math.max(0, Math.floor(en.cannons / 2)) });
      c.events.push({ kind: 'board', ok: true, target: en.id });
      if (!alive(c.e).length) c.over = 'win';
    } else {
      const me = pick(alive(c.p)); const lost = Math.floor(me.crew * rnd(0.2, 0.4)); me.crew = Math.max(1, me.crew - lost);
      S.morale = clamp(S.morale - 2, 0, 100);
      c.events.push({ kind: 'board', ok: false, target: en.id, lost, ship: me.id });
    }
    return { ok, chance };
  };
  R.flee = function (c) {
    if (c.over || c.fleeCd > 0) return null;
    const chance = R.fleeChance(c); const ok = Math.random() < chance;
    if (ok) { c.over = 'fled'; } else {
      c.fleeCd = 12; alive(c.e).forEach((s) => s._cd.forEach((_, i) => { s._cd[i] -= 1.2; }));
    }
    c.events.push({ kind: 'flee', ok });
    return { ok, chance };
  };
  // Settles the result; returns a summary for the UI.
  R.finishCombat = function (c) {
    const res = { result: c.over, gold: 0, goods: {}, refund: 0, lostCargo: {}, prizes: c.prizes, sunk: [] };
    const sunkMine = S.ships.filter((s) => s.sunk); res.sunk = sunkMine.map((s) => s.name);
    S.ships = S.ships.filter((s) => !s.sunk);
    S.profile = S.profile || { name: 'Argosy Co.', flag: 'lion' }; S.events = S.events || []; S.loans = S.loans || []; S.captains = S.captains || []; S.tavern = S.tavern || {}; S.met = S.met || {};
    S.ships.forEach((s) => { delete s.sunk; delete s._cd; delete s._cdm; delete s._side; });
    S.escortShip = null; S.escort = null;
    if (c.over === 'win') {
      res.gold = Math.round(c.startEnemyPower * 12 + ri(40, 140)); S.gold += res.gold;
      for (let i = 0; i < ri(1, 2); i++) { const g = pick(A.GOODS).id; const q = Math.min(ri(5, 20), R.fleetCap() - R.cargoCount()); if (q > 0) { S.cargo[g] = (S.cargo[g] || 0) + q; res.goods[g] = (res.goods[g] || 0) + q; } }
      S.morale = clamp(S.morale + 18, 0, 100); S.stats.wins++;
    } else if (c.over === 'fled') {
      const cnt = R.cargoCount(); const dump = Math.floor(cnt * rnd(0.05, 0.15));
      const lost = {}; for (let i = 0; i < dump; i++) { const ks = Object.keys(S.cargo); if (!ks.length) break; const g = pick(ks); S.cargo[g]--; lost[g] = (lost[g] || 0) + 1; if (S.cargo[g] <= 0) delete S.cargo[g]; }
      Object.keys(lost).forEach((g) => { res.lostCargo[g] = lost[g]; });
      S.morale = clamp(S.morale - 8, 0, 100);
    } else if (c.over === 'lose') {
      Object.keys(S.cargo).forEach((g) => { const keep = Math.floor(S.cargo[g] * 0.4); res.lostCargo[g] = S.cargo[g] - keep; if (keep > 0) S.cargo[g] = keep; else delete S.cargo[g]; });
      S.gold = Math.floor(S.gold * 0.2);
      S.ships = [R.mkShip('felucca', { hull: 12, crew: 4, cannons: 0 })];
      S.morale = 40; S.stats.losses++;
    }
    const clampLost = clampCargo();
    Object.keys(clampLost).forEach((g) => { res.lostCargo[g] = (res.lostCargo[g] || 0) + clampLost[g]; });
    res.refund = R.refundLoss(res.lostCargo);
    S.morale = clamp(S.morale, 0, 100);
    if (c.over === 'lose') R.abortVoyage(); else R.save();
    return res;
  };
  R.prizeValue = (p) => Math.round(T(p.type).cost * 0.35 * (p.hull / T(p.type).hull));
  R.keepPrize = function (p) {
    if (S.ships.length >= C.MAX_FLEET) { R.sellPrize(p); return false; }
    S.ships.push(R.mkShip(p.type, { hull: p.hull, crew: p.crew, exp: p.exp, cannons: p.cannons, name: p.name })); R.save(); return true;
  };
  R.sellPrize = function (p) { S.gold += R.prizeValue(p); R.save(); };

  // ------------------------------------------------------------------ shipyard
  const yard = () => S.port && A.port(S.port).yard;
  R.hasYard = yard;
  R.shipPrice = (type) => Math.round(T(type).cost * (1 - repOf(S.port) * 0.0006));
  R.buyShip = function (type) {
    if (!yard() || S.ships.length >= C.MAX_FLEET) return false;
    const c = R.shipPrice(type); if (S.gold < c) return false;
    S.gold -= c; S.ships.push(R.mkShip(type)); addRep(S.port, c / 2000); R.save(); return true;
  };
  R.shipSellValue = (s) => Math.round(T(s.type).cost * 0.55 * (0.4 + 0.6 * (s.hull / T(s.type).hull)));
  R.sellShip = function (id) {
    if (!yard() || S.ships.length <= 1) return false;
    const s = S.ships.find((x) => x.id === id); if (!s) return false;
    S.gold += R.shipSellValue(s); S.ships = S.ships.filter((x) => x.id !== id); clampCargo(); R.save(); return true;
  };
  R.repairCost = (s) => Math.ceil((T(s.type).hull - s.hull) * C.REPAIR_PER_HULL * (R.has('carpenter') ? 0.8 : 1));
  R.repair = function (id) {
    const s = S.ships.find((x) => x.id === id); if (!yard() || !s) return false;
    const c = R.repairCost(s); if (c <= 0 || S.gold < c) return false;
    S.gold -= c; s.hull = T(s.type).hull; R.save(); return true;
  };
  R.hireCrew = function (id, n) {
    const s = S.ships.find((x) => x.id === id); if (!yard() || !s) return 0;
    const t = T(s.type); n = Math.min(n, t.crewMax - s.crew, Math.floor(S.gold / C.CREW_COST)); if (n <= 0) return 0;
    s.exp = (s.exp * s.crew + 1 * n) / (s.crew + n); s.crew += n; S.gold -= n * C.CREW_COST; R.save(); return n;
  };
  R.buyCannons = function (id, n) {
    const s = S.ships.find((x) => x.id === id); if (!yard() || !s) return 0;
    n = Math.min(n, T(s.type).cannons - s.cannons, Math.floor(S.gold / C.CANNON_COST)); if (n <= 0) return 0;
    s.cannons += n; S.gold -= n * C.CANNON_COST; R.save(); return n;
  };
  R.rest = function () { advanceDay(); S.morale = clamp(S.morale + 3, 0, 100); R.save(); };

  // ------------------------------------------------------------------ quests
  function refreshOffers(portId) {
    if (S.offerDay[portId] != null && S.day - S.offerDay[portId] < 10) return;
    S.offerDay[portId] = S.day; S.offers[portId] = [];
    const p = A.port(portId);
    for (let i = 0; i < ri(0, 2); i++) {
      const near = A.PORTS.filter((x) => x.id !== portId && A.nm(p.lon, p.lat, x.lon, x.lat) < 1800); const dest = pick(near.length ? near : A.PORTS.filter((x) => x.id !== portId));
      const g = pick(p.p); const base = A.GOOD_BY_ID[g].base; const qty = ri(6, 18);
      const nm = A.world.route(portId, dest.id).total;
      S.offers[portId].push({ id: S.nextId++, good: g, qty, from: portId, to: dest.id, deadline: S.day + Math.ceil(nm / 110) + ri(7, 11), reward: Math.round(qty * base * rnd(1.9, 2.4) + nm * 0.8), rep: ri(3, 6) });
    }
  }
  R.offers = () => (S.port ? S.offers[S.port] || [] : []);
  R.acceptQuest = function (id) {
    if (S.quests.length >= 3) return false;
    const list = S.offers[S.port] || []; const q = list.find((x) => x.id === id); if (!q) return false;
    S.offers[S.port] = list.filter((x) => x.id !== id); S.quests.push(q); R.save(); return true;
  };
  R.canComplete = (q) => S.port === q.to && (S.cargo[q.good] || 0) >= q.qty;
  R.completeQuest = function (id) {
    const q = S.quests.find((x) => x.id === id); if (!q || !R.canComplete(q)) return false;
    S.cargo[q.good] -= q.qty; if (S.cargo[q.good] <= 0) delete S.cargo[q.good];
    S.gold += q.reward; addRep(q.to, q.rep); S.quests = S.quests.filter((x) => x.id !== id); R.save(); return true;
  };

  // ------------------------------------------------------------------ lifecycle
  R.newGame = function (profile) {
    S = { v: 1, day: 1, gold: C.START_GOLD, port: 'venice', ships: [], cargo: {}, basis: {}, morale: 70, wind: { dir: rnd(0, 360), str: 1.5 }, rep: {}, market: {}, skulls: [], skullUntil: 0, insured: false, escort: null, escortShip: null, quests: [], offers: {}, offerDay: {}, nextId: 1, stats: { trades: 0, wins: 0, losses: 0, profit: 0 }, voyage: null, visited: { venice: true }, events: [], loans: [], captains: [], tavern: {}, met: {}, nextLoan: 1 };
    S.profile = { name: String((profile && profile.name) || 'Argosy Co.').slice(0, 24), flag: (profile && profile.flag) || 'lion' };
    S.ships.push(R.mkShip('felucca', { cannons: 1 }));
    initMarket(); rollSkulls(); refreshOffers('venice'); R.save();
    return S;
  };
  R.save = function () { if (!S) return; try { A.storage.set(C.SAVE_KEY, JSON.stringify(S)); } catch (e) {} };
  R.hasSave = () => !!A.storage.get(C.SAVE_KEY);
  R.load = function () {
    try { const raw = A.storage.get(C.SAVE_KEY); if (!raw) return null; S = JSON.parse(raw); } catch (e) { return null; }
    if (!S || !S.ships || !S.market) { S = null; return null; }
    S.ships.forEach((s) => { delete s.sunk; delete s._cd; delete s._cdm; delete s._side; });
    S.escortShip = S.escort ? S.escortShip : null;
    return S;
  };
  R.reset = function () { A.storage.del(C.SAVE_KEY); return R.newGame(); };
})(typeof globalThis !== 'undefined' ? globalThis : window);

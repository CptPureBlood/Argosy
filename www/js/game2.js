/* Argosy – price events, mayors, loans, tavern captains and perks (extends A.game). */
(function (G) {
  const A = G.A, R = A.game, C = A.C;
  const rnd = A.rnd, ri = A.ri, clamp = A.clamp, pick = A.pick;
  const S = () => R.S();

  // ------------------------------------------------------------------ perks
  R.has = (id) => !!(S() && S().captains && S().captains.some((c) => c.perk === id));
  const sum = (pairs) => pairs.reduce((a, p) => a + (R.has(p[0]) ? p[1] : 0), 0);
  R.pBuy = () => 1 - sum([['haggler', 0.04], ['prince', 0.08]]);
  R.pSell = () => 1 + sum([['haggler', 0.04], ['smuggler', 0.08], ['prince', 0.08]]);
  R.repMod = () => 1 + sum([['diplomat', 0.25]]);
  R.speedMod = () => 1 + sum([['fairwinds', 0.06], ['navigator', 0.12]]);
  R.capMod = () => 1 + sum([['packer', 0.1], ['prince', 0.15]]);
  R.upkeepMod = () => 1 - sum([['cook', 0.15]]);
  R.stormMod = () => 1 - sum([['pilot', 0.4]]);
  R.lookoutMod = () => 1 - sum([['lookout', 0.15]]);
  R.cdMod = () => 1 - sum([['reloader', 0.1], ['seawolf', 0.2]]);
  R.hitBonus = () => sum([['gunner', 0.05], ['seawolf', 0.2]]);
  R.discipline = () => sum([['discipline', 0.15]]);
  R.wages = () => S().captains.reduce((a, c) => a + c.wage, 0);

  // ------------------------------------------------------------------ price events
  const evMatch = (ev, portId, goodId) => (ev.port === null || ev.port === portId) && ev.goods.some((g) => g[0] === goodId);
  R.evMult = function (portId, goodId) {
    const s = S(); if (!s || !s.events) return 1; let m = 1;
    s.events.forEach((ev) => { if (evMatch(ev, portId, goodId)) ev.goods.forEach((g) => { if (g[0] === goodId) m *= g[1]; }); });
    return m;
  };
  R.eventsAt = (portId) => S().events.filter((ev) => ev.port === null || ev.port === portId);
  R.eventText = function (ev) {
    const def = A.EVENTS.find((e) => e.id === ev.id); const p = ev.port ? A.name(A.port(ev.port)) : '';
    const lang = A.lang;
    return { title: def.n[lang] || def.n.en, text: (def.t[lang] || def.t.en).replace('{port}', p), goods: ev.goods, left: Math.max(0, ev.until - S().day), mult: ev.goods[0][1] };
  };
  function spawnEvent() {
    const s = S(); if (s.events.length >= 7) return;
    const free = A.EVENTS.filter((d) => !s.events.some((e) => e.id === d.id)); if (!free.length) return;
    const def = pick(free); let port = null;
    if (def.scope !== 'all') {
      const first = def.goods[0][0]; let pool = A.PORTS;
      if (def.at === 'p' && A.GOOD_BY_ID[first]) pool = A.PORTS.filter((p) => p.p.indexOf(first) >= 0);
      port = pick(pool.length ? pool : A.PORTS).id;
    }
    const goods = [];
    def.goods.forEach((g) => {
      if (g[0] === 'all') A.GOODS.forEach((x) => goods.push([x.id, g[1]]));
      else if (g[0] === 'own') A.port(port).p.forEach((x) => goods.push([x, g[1]]));
      else goods.push([g[0], g[1]]);
    });
    s.events.push({ id: def.id, port, goods, until: s.day + ri(def.days[0], def.days[1]) });
  }
  R.dailyLife = function () {
    const s = S();
    s.events = s.events.filter((e) => e.until >= s.day);
    if (Math.random() < 0.2) spawnEvent();
    // loans accrue interest; overdue loans cost reputation once and compound faster
    s.loans.forEach((l) => {
      const over = s.day > l.due; l.balance *= 1 + l.rate * (over ? 2 : 1);
      if (over && !l.late) { l.late = true; s.rep[l.port] = clamp((s.rep[l.port] || 0) - 12, 0, 100); }
    });
  };

  // ------------------------------------------------------------------ mayors & loans
  R.mayor = (portId) => A.MAYOR_BY_ID[portId];
  R.hasMet = (portId) => !!S().met[portId];
  R.meet = (portId) => { S().met[portId] = true; R.save(); };
  R.loanDebt = () => S().loans.reduce((a, l) => a + l.balance, 0);
  R.loanLimit = (portId) => {
    const used = S().loans.filter((l) => l.port === portId).reduce((a, l) => a + l.balance, 0);
    const lim = 1000 + 40 * (S().rep[portId] || 0) + Math.min(2000, S().stats.trades * 8);
    return Math.max(0, Math.floor((lim - used) / 50) * 50);
  };
  R.loanRate = (portId) => 0.003 * (1 - (S().rep[portId] || 0) * 0.004) * (R.has('prince') ? 0.6 : 1);
  R.takeLoan = function (amount) {
    const s = S(); if (!s.port) return false;
    amount = Math.min(amount, R.loanLimit(s.port)); if (amount < 100) return false;
    const ex = s.loans.find((l) => l.port === s.port && !l.late);
    if (ex) { ex.principal += amount; ex.balance += amount; ex.due = Math.max(ex.due, s.day + 30); }
    else s.loans.push({ id: s.nextLoan++, port: s.port, principal: amount, balance: amount, due: s.day + 30, rate: R.loanRate(s.port), late: false });
    s.gold += amount; R.save(); return amount;
  };
  R.repayLoan = function (id, amount) {
    const s = S(); const l = s.loans.find((x) => x.id === id); if (!l) return 0;
    const pay = Math.min(Math.ceil(l.balance), amount, s.gold); if (pay <= 0) return 0;
    s.gold -= pay; l.balance -= pay;
    if (l.balance <= 0.5) { s.loans = s.loans.filter((x) => x.id !== id); s.rep[l.port] = clamp((s.rep[l.port] || 0) + 3, 0, 100); }
    R.save(); return pay;
  };

  // ------------------------------------------------------------------ tavern
  function mkCaptain(portId) {
    const r = Math.random(); const rar = r < 0.07 ? 'l' : r < 0.35 ? 'r' : 'c';
    const pool = A.PERKS.filter((p) => p.r === rar); const perk = pick(pool).id;
    const fee = rar === 'l' ? ri(5500, 7500) : rar === 'r' ? ri(1400, 2600) : ri(350, 700);
    const wage = rar === 'l' ? ri(30, 40) : rar === 'r' ? ri(10, 14) : ri(3, 5);
    return { id: 'c' + (S().nextId++), name: pick(A.CAPTAIN_NAMES), perk, fee, wage, rar, port: portId };
  }
  R.tavern = function (portId) {
    const s = S(); let t = s.tavern[portId];
    if (!t || s.day - t.day >= 12) { t = s.tavern[portId] = { day: s.day, list: [mkCaptain(portId), mkCaptain(portId), mkCaptain(portId)] }; }
    return t.list;
  };
  R.captainSlots = () => S().ships.length;
  R.hireCaptain = function (id) {
    const s = S(); const t = s.tavern[s.port]; if (!t) return false; const c = t.list.find((x) => x.id === id);
    if (!c || s.captains.length >= R.captainSlots() || s.gold < c.fee) return false;
    s.gold -= c.fee; s.captains.push({ id: c.id, name: c.name, perk: c.perk, wage: c.wage, rar: c.rar });
    t.list = t.list.filter((x) => x.id !== id); R.save(); return true;
  };
  R.dismissCaptain = function (id) { const s = S(); s.captains = s.captains.filter((c) => c.id !== id); R.save(); };
  R.treatCost = () => Math.max(10, S().ships.reduce((a, x) => a + x.crew, 0) * 4);
  R.treatCrew = function () {
    const s = S(); const c = R.treatCost(); if (s.gold < c || s.treatDay === s.day) return false;
    s.gold -= c; s.morale = clamp(s.morale + 7, 0, 100); s.treatDay = s.day; R.save(); return true;
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);

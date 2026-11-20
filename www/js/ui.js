/* Argosy – screens, navigation, voyage controller, encounters and results. */
(function (G) {
  const A = G.A, R = A.game, W = A.world, C = A.C, h = A.h, t = A.t;
  const U = (A.ui = { screen: 'port', tab: 'market', good: null, qty: 5, sel: null, insure: false, scroll: 0 });
  const $ = (id) => document.getElementById(id);
  const voy = { mul: 1, paused: false, busy: false };
  const S = () => R.S();

  // ------------------------------------------------------------------ helpers
  A.toast = function (msg, kind) {
    const el = h('div', { class: 'toast ' + (kind || '') }, msg); $('toasts').append(el);
    setTimeout(() => el.classList.add('out'), 2800); setTimeout(() => el.remove(), 3300);
  };
  U.modal = function (o) {
    const close = () => { back.classList.add('out'); setTimeout(() => back.remove(), 180); };
    const btns = (o.buttons || []).map((b) => h('button', { class: 'btn ' + (b.kind || ''), disabled: b.disabled, onClick: () => { const r = b.onClick && b.onClick(); if (r !== false) close(); } }, b.label));
    const back = h('div', { class: 'modalback' }, h('div', { class: 'modal ' + (o.cls || '') }, o.title ? h('h2', {}, o.title) : null, o.body, h('div', { class: 'mbtns' }, btns)));
    $('overlay').append(back); return close;
  };
  U.floatGold = function (txt, cls) {
    const el = h('span', { class: 'gfloat ' + cls }, txt); $('top').append(el); setTimeout(() => el.remove(), 1300);
  };
  const stars = (rep) => h('span', { class: 'stars' }, [0, 1, 2, 3, 4].map((i) => h('span', { class: 'ic star' + (i < Math.floor(rep / 20) ? ' on' : '') , html: A.svg(A.ICONS.star, 14) })));
  const bar = (pct, cls) => h('span', { class: 'bar ' + (cls || '') }, h('i', { style: { width: Math.max(0, Math.min(100, pct)) + '%' } }));
  const chip = (g, kind) => h('span', { class: 'chip ' + kind, title: A.name(A.GOOD_BY_ID[g]) }, A.goodIcon(g, 15), h('b', {}, A.name(A.GOOD_BY_ID[g])));
  const moraleKey = (m) => 'morale.' + (m >= 80 ? 0 : m >= 60 ? 1 : m >= 40 ? 2 : m >= 20 ? 3 : 4);
  const goodsLine = (o) => Object.keys(o).filter((g) => o[g] > 0).map((g) => h('span', { class: 'gl' }, A.goodIcon(g, 15), ' ' + o[g]));

  // ------------------------------------------------------------------ top bar & nav
  U.renderTop = function () {
    const s = S(); if (!s) return;
    const where = s.port ? A.name(A.port(s.port)) : t('top.atSea');
    const arrow = h('span', { class: 'windarrow', style: { transform: 'rotate(' + Math.round(s.wind.dir) + 'deg)' }, html: A.svg('M12 20V5M6 11l6-6 6 6', 18) });
    const top = $('top');
    const keep = [...top.querySelectorAll('.gfloat')];
    top.replaceChildren(
      h('div', { class: 'trow' }, h('div', { class: 'tl' }, h('b', {}, t('top.day', { n: s.day })), h('span', {}, ' · ' + where)),
        h('div', { class: 'gold' }, A.icon('coin', 16), h('b', {}, A.fmt(s.gold)))),
      h('div', { class: 'trow small' },
        h('span', { class: 'tw', title: t('top.wind') }, arrow, ' ' + t('wind.force', { n: Math.round(s.wind.str * 2) })),
        h('span', { class: 'tm' }, A.icon('heart', 14), bar(s.morale, s.morale < 30 ? 'low' : ''), h('em', {}, t(moraleKey(s.morale)))),
        h('span', { class: 'tc' }, A.icon('ship', 14), ' ' + R.cargoCount() + '/' + R.fleetCap())));
    keep.forEach((k) => top.append(k));
  };
  const NAVS = [['port', 'market', 'nav.port'], ['map', 'compass', 'nav.map'], ['fleet', 'ship', 'nav.fleet'], ['quests', 'scroll', 'nav.quests'], ['menu', 'menu', 'nav.menu']];
  U.renderNav = function () {
    $('nav').replaceChildren(...NAVS.map(([id, ic, key]) => h('button', { class: 'navb' + (U.screen === id ? ' on' : ''), onClick: () => U.go(id) }, A.icon(ic, 21), h('span', {}, t(key)))));
  };

  U.go = function (screen) {
    A.audio.unlock();
    const s = S();
    if (screen === 'port' && !s.port) { A.toast(t('err.atSea')); screen = 'map'; }
    U.screen = screen; A.map.active = screen === 'map';
    U.renderNav(); U.render();
    if (screen === 'port' && s.port) A.audio.gullsStart(); else A.audio.gullsStop();
  };

  U.render = function () {
    const scr = $('screen'); const prev = scr.querySelector('.list'); if (prev) U.scroll = prev.scrollTop;
    U.renderTop();
    const fn = { port: renderPort, map: renderMap, fleet: renderFleet, quests: renderQuests, menu: renderMenu }[U.screen];
    const node = fn(); if (U.screen !== 'map') { node.classList.add('enter'); }
    scr.replaceChildren(node);
    const list = scr.querySelector('.list'); if (list && U.keepScroll) list.scrollTop = U.scroll;
    U.keepScroll = false;
    if (U.screen === 'map') { A.map.resize(); }
  };
  const rerender = () => { U.keepScroll = true; U.render(); };

  // ------------------------------------------------------------------ PORT
  function renderPort() {
    const s = S(), p = A.port(s.port);
    const skull = s.skulls.indexOf(p.id) >= 0;
    const head = h('div', { class: 'phead' },
      h('div', { class: 'pname' }, h('h1', {}, A.name(p)), p.yard ? h('span', { class: 'badge' }, A.icon('anchor', 15), t('yard.badge')) : null, skull ? h('span', { class: 'badge bad' }, A.icon('skull', 15), t('port.pirates')) : null),
      h('div', { class: 'prow' }, h('span', { class: 'lbl' }, t('port.produces')), p.p.map((g) => chip(g, 'p'))),
      h('div', { class: 'prow' }, h('span', { class: 'lbl' }, t('port.needs')), p.d.map((g) => chip(g, 'd'))),
      h('div', { class: 'prow' }, h('span', { class: 'lbl' }, t('rep.label')), stars(R.rep(p.id)), h('span', { class: 'sub' }, t('rep.' + Math.min(5, Math.floor(R.rep(p.id) / 20))))));
    const tabs = h('div', { class: 'seg' },
      h('button', { class: U.tab === 'market' ? 'on' : '', onClick: () => { U.tab = 'market'; rerender(); } }, t('tab.market')),
      p.yard ? h('button', { class: U.tab === 'yard' ? 'on' : '', onClick: () => { U.tab = 'yard'; rerender(); } }, t('tab.yard')) : null,
      h('button', { onClick: () => { R.rest(); A.audio.gullsStart(); A.toast(t('port.rested')); rerender(); } }, t('port.rest')),
      h('button', { class: 'go', onClick: () => U.go('map') }, t('port.depart')));
    if (U.tab === 'yard' && !p.yard) U.tab = 'market';
    return h('div', { class: 'scr port' }, head, tabs, U.tab === 'market' ? marketBody(p) : yardBody(p));
  }

  function marketBody(p) {
    const s = S();
    const head = h('div', { class: 'row head' }, h('span'), h('span', {}, t('mkt.good')), h('span', {}, t('mkt.have')), h('span', {}, t('mkt.price')), h('span', {}, t('mkt.diff')));
    const rows = A.GOODS.map((g) => {
      const tr = R.tier(p.id, g.id), price = R.buyPrice(p.id, g.id), have = s.cargo[g.id] || 0, pct = R.trendPct(p.id, g.id);
      return h('button', { class: 'row' + (U.good === g.id ? ' sel' : ''), onClick: () => { U.good = g.id; rerender(); } },
        A.goodIcon(g.id, 28), h('span', { class: 'gname' }, A.name(g), tr !== 'n' ? h('i', { class: 'dot ' + tr }) : null), h('span', { class: 'have' }, have || '–'),
        h('span', { class: 'price' }, price), h('span', { class: 'pct ' + (pct > 0 ? 'up' : 'dn') }, (pct > 0 ? '▲' : '▼') + Math.abs(pct) + '%'));
    });
    return h('div', { class: 'market' }, h('div', { class: 'list' }, head, rows), tradePanel(p));
  }

  function tradePanel(p) {
    const s = S(); const g = U.good && A.GOOD_BY_ID[U.good];
    if (!g) return h('div', { class: 'trade hint' }, t('mkt.pick'));
    const buyP = R.buyPrice(p.id, g.id), sellP = R.sellPrice(p.id, g.id), stock = R.stock(p.id, g.id), have = s.cargo[g.id] || 0;
    const free = R.fleetCap() - R.cargoCount();
    U.qty = Math.max(1, U.qty);
    const setQ = (q) => { U.qty = Math.max(1, q); rerender(); };
    const qb = R.quoteBuy(g.id, U.qty), qs = R.quoteSell(g.id, U.qty);
    return h('div', { class: 'trade' },
      h('div', { class: 'tline' }, h('b', {}, A.name(g)), h('span', {}, t('mkt.buy') + ' ' + buyP), h('span', {}, t('mkt.sell') + ' ' + sellP), h('span', {}, t('mkt.stock') + ' ' + stock)),
      h('div', { class: 'tctl' },
        h('button', { class: 'sq', onClick: () => setQ(U.qty - 1), 'aria-label': '-' }, '−'), h('b', { class: 'qty' }, U.qty), h('button', { class: 'sq', onClick: () => setQ(U.qty + 1), 'aria-label': '+' }, '+'),
        [1, 5, 10].map((n) => h('button', { class: 'chipb', onClick: () => setQ(n) }, n)),
        h('button', { class: 'chipb', onClick: () => setQ(Math.max(1, Math.max(have, Math.min(stock, free)))) }, t('mkt.max'))),
      h('div', { class: 'tact' },
        h('button', { class: 'btn buy', disabled: qb.q <= 0, onClick: () => { const r = R.buy(g.id, U.qty); if (r.ok) { A.audio.coin(); U.floatGold('−' + A.fmt(r.cost), 'neg'); if (r.q < U.qty) A.toast(t('mkt.partial', { n: r.q })); } rerender(); } }, t('mkt.buyN', { n: qb.q, c: A.fmt(qb.cost) })),
        h('button', { class: 'btn sell', disabled: qs.q <= 0, onClick: () => { const r = R.sell(g.id, U.qty); if (r.ok) { A.audio.coin(); U.floatGold('+' + A.fmt(r.rev), 'pos'); } rerender(); } }, t('mkt.sellN', { n: qs.q, c: A.fmt(qs.rev) }))));
  }

  // ------------------------------------------------------------------ SHIPYARD
  function yardBody() {
    const s = S();
    const shipCards = A.SHIP_ORDER.map((k) => {
      const T = A.SHIPS[k], price = R.shipPrice(k);
      return h('div', { class: 'card ship' }, A.shipThumb(k, 96, 54, 'p'),
        h('div', { class: 'info' }, h('b', {}, A.name(T)),
          h('div', { class: 'stats' }, stat('ship', T.cap), stat('wind', T.speed), stat('shield', T.hull), stat('cannon', T.cannons), stat('crew', T.crewMax))),
        h('button', { class: 'btn', disabled: s.gold < price || s.ships.length >= C.MAX_FLEET, onClick: () => { if (R.buyShip(k)) { A.audio.coin(); A.toast(t('yard.bought', { n: A.name(T) })); } rerender(); } }, A.fmt(price)));
    });
    const mine = s.ships.map((sh) => {
      const T = A.SHIPS[sh.type]; const rc = R.repairCost(sh);
      return h('div', { class: 'card mine' }, h('div', { class: 'mtop' }, A.shipThumb(sh.type, 64, 38, 'p'), h('div', { class: 'info' }, h('b', {}, sh.name), h('span', { class: 'sub' }, A.name(T)), bar((sh.hull / T.hull) * 100, sh.hull / T.hull < 0.4 ? 'low' : ''))),
        h('div', { class: 'stats' }, stat('shield', Math.round(sh.hull) + '/' + T.hull), stat('crew', sh.crew + '/' + T.crewMax), stat('cannon', sh.cannons + '/' + T.cannons)),
        h('div', { class: 'acts' },
          h('button', { class: 'btn sm', disabled: rc <= 0 || s.gold < rc, onClick: () => { R.repair(sh.id); rerender(); } }, t('yard.repair') + (rc > 0 ? ' ' + A.fmt(rc) : '')),
          h('button', { class: 'btn sm', disabled: sh.crew >= T.crewMax || s.gold < C.CREW_COST, onClick: () => { R.hireCrew(sh.id, 5); rerender(); } }, t('yard.crew') + ' ' + C.CREW_COST * 5),
          h('button', { class: 'btn sm', disabled: sh.cannons >= T.cannons || s.gold < C.CANNON_COST, onClick: () => { R.buyCannons(sh.id, 1); rerender(); } }, t('yard.cannon') + ' ' + C.CANNON_COST),
          h('button', { class: 'btn sm ghost', disabled: s.ships.length <= 1, onClick: () => { if (R.sellShip(sh.id)) A.audio.coin(); rerender(); } }, t('yard.sell') + ' ' + A.fmt(R.shipSellValue(sh)))));
    });
    return h('div', { class: 'list yard' }, h('h3', {}, t('yard.ships')), shipCards, h('h3', {}, t('yard.fleet') + ' (' + s.ships.length + '/' + C.MAX_FLEET + ')'), mine);
  }
  function stat(ic, v) { return h('span', { class: 'st' }, A.icon(ic, 14), ' ' + v); }

  // ------------------------------------------------------------------ MAP
  U.mapWrap = null;
  function renderMap() {
    const s = S();
    if (!U.mapWrap) { U.mapWrap = h('div', { class: 'mapwrap' }); A.map.init(U.mapWrap); A.map.onSelect = (id) => { if (S().voyage) return; U.sel = id; selectDest(); }; }
    const root = h('div', { class: 'scr mapscr' }, U.mapWrap, h('div', { class: 'sheet', id: 'sheet' }));
    queueMicrotask(() => { A.map.resize(); renderSheet(); if (!s.voyage && !A.map.ship && s.port) A.map.setShipDocked(s.port); });
    return root;
  }
  function selectDest() {
    const s = S(); if (!s.port) return;
    if (U.sel && U.sel !== s.port) { A.map.sel = U.sel; A.map.preview = W.route(s.port, U.sel); A.map.fit(s.port, U.sel); } else { A.map.sel = U.sel; A.map.preview = null; }
    renderSheet();
  }
  function renderSheet() {
    const sh = $('sheet'); if (!sh) return; const s = S();
    if (s.voyage) {
      const v = s.voyage; const left = Math.max(0, v.total - v.travelled);
      sh.replaceChildren(h('div', { class: 'sbody' }, h('div', { class: 'sh1' }, h('b', {}, t('sea.sailing', { p: A.name(A.port(v.to)) })), h('span', {}, t('sea.day', { n: v.days }))),
        bar((v.travelled / v.total) * 100), h('div', { class: 'sh2' }, h('span', {}, t('sea.left', { n: Math.round(left) })), h('span', {}, t('sea.speed', { n: R.fleetSpeed().toFixed(1) }))),
        h('div', { class: 'seg' }, [1, 2, 4].map((m) => h('button', { class: voy.mul === m ? 'on' : '', onClick: () => { voy.mul = m; renderSheet(); } }, '×' + m)), h('button', { class: voy.paused ? 'on' : '', onClick: () => { voy.paused = !voy.paused; if (!voy.paused) voyTick(); renderSheet(); } }, voy.paused ? t('sea.resume') : t('sea.pause')))));
      return;
    }
    if (!U.sel || U.sel === s.port) { sh.replaceChildren(h('div', { class: 'sbody hint' }, t(U.sel ? 'sheet.here' : 'sheet.hint'), h('div', { class: 'legend' }, h('span', {}, A.icon('anchor', 15), ' ' + t('legend.yard')), h('span', {}, A.icon('skull', 15), ' ' + t('legend.skull'))))); return; }
    const d = A.port(U.sel), est = R.estimate(U.sel);
    const baseDays = est.nm / ((R.fleetSpeed() || 5) * C.NM_PER_KNOT_DAY); const wr = baseDays / est.days;
    const windTxt = wr > 1.06 ? t('sheet.tail') : wr < 0.94 ? t('sheet.head') : t('sheet.crosswind');
    const icost = R.cargoCount() > 0 ? R.insuranceCost() : 0;
    if (icost === 0) U.insure = false;
    const skulls = est.risk === 'high' ? 3 : est.risk === 'mid' ? 2 : 1;
    const esc = (id, label, cost) => h('button', { class: 'chipb' + ((s.escort || '') === id ? ' on' : ''), onClick: () => { R.cancelEscort(); if (id && !R.hireEscort(id)) A.toast(t('err.gold')); U.renderTop(); renderSheet(); } }, label + (cost ? ' · ' + cost : ''));
    sh.replaceChildren(h('div', { class: 'sbody' },
      h('div', { class: 'sh1' }, h('b', {}, A.name(d)), h('span', {}, t('sheet.days', { n: est.days }) + ' · ' + t('sheet.nm', { n: Math.round(est.nm) }))),
      h('div', { class: 'prow' }, d.p.map((g) => chip(g, 'p')), d.yard ? h('span', { class: 'badge' }, A.icon('anchor', 14), t('yard.badge')) : null),
      h('div', { class: 'sh2' }, h('span', {}, windTxt), h('span', { class: 'risk ' + est.risk }, [0, 1, 2].map((i) => h('span', { class: 'ic' + (i < skulls ? ' on' : ''), html: A.svg(A.ICONS.skull, 15) })), ' ' + t('risk.' + est.risk))),
      h('div', { class: 'opts' },
        h('button', { class: 'chipb' + (U.insure ? ' on' : ''), disabled: icost === 0, onClick: () => { U.insure = !U.insure; renderSheet(); } }, A.icon('shield', 14), ' ' + t('ins.label', { c: icost })),
        h('span', { class: 'lbl' }, t('esc.label')), esc('', t('esc.none')), esc('light', A.name(A.ESCORTS.light), A.ESCORTS.light.cost), esc('war', A.name(A.ESCORTS.war), A.ESCORTS.war.cost)),
      h('button', { class: 'btn go big', onClick: () => depart(U.sel) }, t('sheet.sail'))));
  }

  function depart(id) {
    const r = R.startVoyage(id, { insure: U.insure });
    if (!r.ok) { A.toast(t(r.err === 'gold' ? 'err.gold' : 'err.generic')); return; }
    A.audio.gullsStop(); U.insure = false; U.sel = null; A.map.sel = null; A.map.preview = null;
    const s = S(); A.map.setShipDocked(s.voyage.from); A.map.follow = true; A.map.tk = 16;
    voy.paused = false; voy.busy = false; U.renderTop(); renderSheet(); setTimeout(voyTick, 500);
  }

  // ------------------------------------------------------------------ voyage controller
  function voyTick() {
    const s = S(); if (!s || !s.voyage || voy.busy || voy.paused) return;
    voy.busy = true; const v = s.voyage; const prev = v.travelled; const route = W.route(v.from, v.to);
    const res = R.stepVoyage(); const ms = 900 / voy.mul;
    A.map.animateVoyage(route, prev, v.travelled, ms);
    const fin = () => afterTick(res);
    if (A.map.vAnim) A.map.vAnim.done = fin; else fin();
    U.renderTop(); if (U.screen === 'map') renderSheet();
  }
  U.voyTick = voyTick;
  function afterTick(res) {
    U.renderTop(); if (U.screen === 'map') renderSheet();
    let enc = null;
    res.events.forEach((ev) => {
      if (ev.type === 'storm') { A.toast(t('ev.storm', { s: ev.ship }) + (ev.refund ? ' ' + t('ev.refund', { n: A.fmt(ev.refund) }) : ''), 'bad'); A.audio.hit(); }
      else if (ev.type === 'calm') A.toast(t('ev.calm'));
      else if (ev.type === 'broke') A.toast(t('ev.broke'), 'bad');
      else if (ev.type === 'questExpired') A.toast(t('ev.questExpired'), 'bad');
      else if (ev.type === 'pirates') enc = ev;
    });
    if (enc) { showEncounter(enc.zone); return; }
    if (res.arrived) { finishVoyage(); return; }
    voy.busy = false; setTimeout(voyTick, 140);
  }
  function finishVoyage() {
    const a = R.arrive(); voy.busy = false; A.map.follow = false; A.map.setShipDocked(a.port);
    A.audio.unlock(); A.audio.gong();
    const sign = a.dm >= 0 ? '+' : '';
    A.toast(t('arr.msg', { p: A.name(A.port(a.port)), d: a.days }) + ' ' + t('arr.morale', { n: sign + a.dm }), a.dm < 0 ? 'bad' : '');
    U.tab = 'market'; U.sel = null; A.map.sel = null; A.map.preview = null;
    U.go('port');
  }

  function showEncounter(zone) {
    const s = S(); const pirates = R.genPirates(zone); const threat = R.threat(pirates);
    voy.busy = true;
    const list = h('div', { class: 'enc' }, pirates.map((e) => h('div', { class: 'ecard' }, A.shipThumb(e.type, 74, 42, 'e'), h('div', {}, h('b', {}, e.name), h('div', { class: 'sub' }, A.name(A.SHIPS[e.type])), h('div', { class: 'stats' }, stat('cannon', e.cannons), stat('crew', e.crew))))));
    const fc = Math.round(R.fleeChance(R.newCombat(pirates)) * 100);
    U.modal({ title: t('enc.title'), cls: 'bad', body: h('div', {}, h('p', {}, t('enc.text', { n: pirates.length })), h('p', { class: 'threat ' + threat }, t('enc.threat') + ': ' + t('threat.' + threat)), list, s.escortShip ? h('p', { class: 'sub' }, t('enc.escort', { n: A.name(A.ESCORTS[s.escort]) })) : null),
      buttons: [
        { label: t('enc.fight'), kind: 'danger', onClick: () => { startCombat(pirates, {}); } },
        { label: t('enc.flee', { p: fc }), onClick: () => {
          const c = R.newCombat(pirates); const r = R.flee(c);
          if (r && r.ok) { const res = R.finishCombat(c); showResult(res); } else { startCombat(pirates, { enemyVolley: true }); }
        } },
      ] });
  }
  function startCombat(pirates, opts) {
    $('nav').classList.add('hide'); $('top').classList.add('hide');
    A.combat.start(pirates, opts, (res) => { $('nav').classList.remove('hide'); $('top').classList.remove('hide'); showResult(res); });
  }
  function showResult(res) {
    const s = S(); const titleKey = res.result === 'win' ? 'res.win' : res.result === 'fled' ? 'res.fled' : 'res.lose';
    const prizeState = res.prizes.map(() => null);
    const body = h('div', {});
    const loot = [];
    if (res.gold) loot.push(h('p', {}, t('res.gold', { n: A.fmt(res.gold) })));
    if (Object.keys(res.goods).length) loot.push(h('p', {}, t('res.goods') + ' ', goodsLine(res.goods)));
    if (Object.keys(res.lostCargo).length) loot.push(h('p', { class: 'bad' }, t('res.lost') + ' ', goodsLine(res.lostCargo)));
    if (res.refund) loot.push(h('p', { class: 'good' }, t('res.refund', { n: A.fmt(res.refund) })));
    if (res.sunk.length) loot.push(h('p', { class: 'bad' }, t('res.sunk', { n: res.sunk.join(', ') })));
    if (res.result === 'lose') loot.push(h('p', {}, t('res.rescued')));
    body.append(...loot);
    res.prizes.forEach((p, i) => {
      const box = h('div', { class: 'ecard prize' });
      const draw = () => {
        box.replaceChildren(A.shipThumb(p.type, 74, 42, 'p'), h('div', {}, h('b', {}, p.name), h('div', { class: 'sub' }, A.name(A.SHIPS[p.type]) + ' · ' + t('res.hull', { n: Math.round((p.hull / A.SHIPS[p.type].hull) * 100) })),
          prizeState[i] ? h('div', { class: 'sub' }, t(prizeState[i] === 'keep' ? 'res.kept' : 'res.soldPrize')) : h('div', { class: 'acts' },
            h('button', { class: 'btn sm', disabled: S().ships.length >= C.MAX_FLEET, onClick: () => { R.keepPrize(p); prizeState[i] = 'keep'; U.renderTop(); draw(); } }, t('res.keep')),
            h('button', { class: 'btn sm ghost', onClick: () => { R.sellPrize(p); A.audio.coin(); prizeState[i] = 'sell'; U.renderTop(); draw(); } }, t('res.sellPrize', { n: A.fmt(R.prizeValue(p)) })))));
      };
      draw(); body.append(box);
    });
    U.renderTop();
    U.modal({ title: t(titleKey), cls: res.result === 'lose' ? 'bad' : res.result === 'win' ? 'good' : '', body, buttons: [{ label: t('res.continue'), kind: 'go', onClick: () => {
      res.prizes.forEach((p, i) => { if (!prizeState[i]) { R.sellPrize(p); } });
      U.renderTop();
      if (res.result === 'lose') { A.map.setShipDocked(S().port); A.map.follow = false; U.go('port'); }
      else { voy.busy = false; setTimeout(voyTick, 200); }
    } }] });
  }

  U.resumeIfAtSea = function () {
    const s = S(); if (s.voyage) { const v = s.voyage; const r = W.route(v.from, v.to); A.map.shipAt(r, v.travelled); A.map.follow = true; U.screen = 'map'; A.map.active = true; voy.busy = false; setTimeout(voyTick, 800); }
  };

  // ------------------------------------------------------------------ FLEET
  function renderFleet() {
    const s = S();
    const cards = s.ships.map((sh) => {
      const T = A.SHIPS[sh.type];
      return h('div', { class: 'card mine' }, h('div', { class: 'mtop' }, A.shipThumb(sh.type, 84, 46, 'p'), h('div', { class: 'info' }, h('b', {}, sh.name), h('span', { class: 'sub' }, A.name(T) + ' · ' + t('fleet.exp', { n: sh.exp.toFixed(1) })), bar((sh.hull / T.hull) * 100, sh.hull / T.hull < 0.4 ? 'low' : ''))),
        h('div', { class: 'stats' }, stat('shield', Math.round(sh.hull) + '/' + T.hull), stat('crew', sh.crew + '/' + T.crewMax), stat('cannon', sh.cannons + '/' + T.cannons), stat('wind', R.shipSpeed(sh).toFixed(1)), stat('ship', T.cap)));
    });
    const cargo = Object.keys(s.cargo).length ? h('div', { class: 'cargo' }, Object.keys(s.cargo).map((g) => h('span', { class: 'chip n' }, A.goodIcon(g, 15), h('b', {}, A.name(A.GOOD_BY_ID[g]) + ' ' + s.cargo[g])))) : h('p', { class: 'sub' }, t('fleet.empty'));
    const repList = Object.keys(s.rep).filter((id) => s.rep[id] > 0).sort((a, b) => s.rep[b] - s.rep[a]).slice(0, 6).map((id) => h('div', { class: 'rrow' }, h('span', {}, A.name(A.port(id))), stars(s.rep[id])));
    return h('div', { class: 'scr list pad' },
      h('div', { class: 'sumcard' }, h('div', {}, h('b', {}, t('fleet.cap')), ' ' + R.cargoCount() + '/' + R.fleetCap()), h('div', {}, h('b', {}, t('fleet.speed')), ' ' + R.fleetSpeed().toFixed(1)), h('div', {}, h('b', {}, t('fleet.morale')), ' ' + Math.round(s.morale) + ' · ' + t(moraleKey(s.morale))), h('p', { class: 'sub' }, t('fleet.moraleHelp'))),
      h('h3', {}, t('fleet.ships') + ' (' + s.ships.length + '/' + C.MAX_FLEET + ')'), cards,
      h('h3', {}, t('fleet.cargo')), cargo,
      h('h3', {}, t('fleet.rep')), repList.length ? repList : h('p', { class: 'sub' }, t('fleet.noRep')));
  }

  // ------------------------------------------------------------------ QUESTS
  function renderQuests() {
    const s = S();
    const act = s.quests.map((q) => {
      const g = A.GOOD_BY_ID[q.good]; const have = Math.min(q.qty, s.cargo[q.good] || 0);
      return h('div', { class: 'card quest' }, h('div', { class: 'qtop' }, A.goodIcon(q.good, 26), h('div', { class: 'info' }, h('b', {}, t('q.title', { q: q.qty, g: A.name(g) })), h('span', { class: 'sub' }, t('q.to', { p: A.name(A.port(q.to)), d: Math.max(0, q.deadline - s.day) }))), h('b', { class: 'reward' }, '+' + A.fmt(q.reward))),
        h('div', { class: 'qbar' }, bar((have / q.qty) * 100), h('span', {}, have + '/' + q.qty), h('button', { class: 'btn sm', disabled: !R.canComplete(q), onClick: () => { if (R.completeQuest(q.id)) { A.audio.coin(); A.toast(t('q.done', { n: A.fmt(q.reward) })); } rerender(); } }, t('q.deliver'))));
    });
    const offers = s.port ? R.offers().map((q) => {
      const g = A.GOOD_BY_ID[q.good];
      return h('div', { class: 'card quest' }, h('div', { class: 'qtop' }, A.goodIcon(q.good, 26), h('div', { class: 'info' }, h('b', {}, t('q.title', { q: q.qty, g: A.name(g) })), h('span', { class: 'sub' }, t('q.to', { p: A.name(A.port(q.to)), d: q.deadline - s.day }))), h('b', { class: 'reward' }, '+' + A.fmt(q.reward))),
        h('div', { class: 'acts' }, h('button', { class: 'btn sm', disabled: s.quests.length >= 3, onClick: () => { R.acceptQuest(q.id); rerender(); } }, t('q.accept'))));
    }) : [];
    return h('div', { class: 'scr list pad' }, h('h3', {}, t('q.active') + ' (' + s.quests.length + '/3)'), act.length ? act : h('p', { class: 'sub' }, t('q.none')),
      s.port ? [h('h3', {}, t('q.offers', { p: A.name(A.port(s.port)) })), offers.length ? offers : h('p', { class: 'sub' }, t('q.noOffers'))] : null);
  }

  // ------------------------------------------------------------------ MENU
  function renderMenu() {
    const s = S();
    return h('div', { class: 'scr list pad' },
      h('h3', {}, t('menu.language')), h('div', { class: 'seg' }, ['en', 'tr'].map((l) => h('button', { class: A.lang === l ? 'on' : '', onClick: () => { A.setLang(l); U.renderNav(); rerender(); } }, l === 'en' ? 'English' : 'Türkçe'))),
      h('h3', {}, t('menu.sound')), h('div', { class: 'seg' }, h('button', { class: A.audio.on ? 'on' : '', onClick: () => { A.audio.setOn(true); A.audio.unlock(); A.audio.gong(); try { A.storage.set('argosy_sound', '1'); } catch (e) {} rerender(); } }, t('menu.on')), h('button', { class: !A.audio.on ? 'on' : '', onClick: () => { A.audio.setOn(false); try { A.storage.set('argosy_sound', '0'); } catch (e) {} rerender(); } }, t('menu.off'))),
      h('h3', {}, t('menu.stats')),
      h('div', { class: 'sumcard' }, h('div', {}, t('stats.day', { n: s.day })), h('div', {}, t('stats.trades', { n: s.stats.trades })), h('div', {}, t('stats.profit', { n: A.fmt(s.stats.profit) })), h('div', {}, t('stats.wins', { n: s.stats.wins })), h('div', {}, t('stats.losses', { n: s.stats.losses }))),
      h('h3', {}, t('menu.game')),
      h('button', { class: 'btn danger', onClick: () => U.modal({ title: t('menu.newTitle'), body: h('p', {}, t('menu.newText')), buttons: [{ label: t('menu.cancel') }, { label: t('menu.newYes'), kind: 'danger', onClick: () => { R.reset(); A.map.ship = null; A.map.trail = []; U.sel = null; A.map.sel = null; A.map.preview = null; U.tab = 'market'; U.good = null; U.go('port'); } }] }) }, t('menu.new')),
      h('p', { class: 'sub about' }, t('menu.about')));
  }

  // ------------------------------------------------------------------ splash / boot
  U.splash = function () {
    const has = R.hasSave();
    const langs = h('div', { class: 'seg' }, ['en', 'tr'].map((l) => h('button', { class: A.lang === l ? 'on' : '', onClick: () => { A.setLang(l); U.splash(); } }, l === 'en' ? 'English' : 'Türkçe')));
    $('splash')?.remove();
    const el = h('div', { id: 'splash', class: 'splash' }, h('div', { class: 'sbox' }, h('div', { class: 'logo', html: A.svg(A.ICONS.ship, 56) }), h('h1', {}, 'ARGOSY'), h('p', { class: 'tag' }, t('splash.tag')), langs,
      has ? h('button', { class: 'btn go big', onClick: () => start(true) }, t('splash.continue')) : null,
      h('button', { class: 'btn big' + (has ? ' ghost' : ' go'), onClick: () => { if (has) { R.reset(); } else R.newGame(); start(false, true); } }, t('splash.new'))));
    document.body.append(el);
  };
  function start(load, fresh) {
    A.audio.unlock();
    if (load) { if (!R.load()) R.newGame(); }
    $('splash').remove();
    U.screen = 'port'; U.renderNav(); U.go(S().voyage ? 'map' : 'port');
    if (S().voyage) U.resumeIfAtSea();
    setTimeout(() => A.audio.gong(), 250);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && S()) R.save(); });
})(typeof globalThis !== 'undefined' ? globalThis : window);

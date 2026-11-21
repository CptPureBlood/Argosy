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
  const stars = (rep) => h('span', { class: 'stars' }, [0, 1, 2, 3, 4].map((i) => h('img', { class: 'starimg', src: 'img/ui_star_' + (i < Math.floor(rep / 20) ? 'on' : 'off') + '.png', alt: '' })));
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
  const NAVS = [['port', 'market', 'nav.port'], ['map', 'compass', 'nav.map'], ['fleet', 'fleetnav', 'nav.fleet'], ['quests', 'mayornav', 'nav.mayor'], ['menu', 'menu', 'nav.menu']];
  U.renderNav = function () {
    $('nav').replaceChildren(...NAVS.map(([id, ic, key]) => h('button', { class: 'navb' + (U.screen === id ? ' on' : ''), onClick: () => U.go(id) }, A.icon(ic, 26), h('span', {}, t(key)))));
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
    const REG = { tripoli: 'arab', alexandria: 'arab', beirut: 'arab', jeddah: 'arab', aden: 'arab', hormuz: 'arab', calicut: 'india', colombo: 'india', malacca: 'sea', ayutthaya: 'sea', manila: 'sea', canton: 'china' };
    const head = h('div', { class: 'phead' },
      h('div', { class: 'pbanner', style: { backgroundImage: 'url(img/port_' + (REG[p.id] || 'med') + '.jpg)' } }),
      h('div', { class: 'pname' }, h('h1', {}, A.name(p)), p.yard ? h('span', { class: 'badge' }, A.icon('anchor', 15), t('yard.badge')) : null, skull ? h('span', { class: 'badge bad' }, A.icon('skull', 15), t('port.pirates')) : null),
      h('div', { class: 'prow' }, h('span', { class: 'lbl' }, t('port.produces')), p.p.map((g) => chip(g, 'p'))),
      h('div', { class: 'prow' }, h('span', { class: 'lbl' }, t('port.needs')), p.d.map((g) => chip(g, 'd'))),
      h('div', { class: 'prow' }, h('span', { class: 'lbl' }, t('rep.label')), stars(R.rep(p.id)), h('span', { class: 'sub' }, t('rep.' + Math.min(5, Math.floor(R.rep(p.id) / 20))))));
    const tabs = h('div', { class: 'seg' },
      h('button', { class: U.tab === 'market' ? 'on' : '', onClick: () => { U.tab = 'market'; rerender(); } }, t('tab.market')),
      p.yard ? h('button', { class: U.tab === 'yard' ? 'on' : '', onClick: () => { U.tab = 'yard'; rerender(); } }, t('tab.yard')) : null,
      h('button', { class: U.tab === 'estate' ? 'on' : '', onClick: () => { U.tab = 'estate'; rerender(); } }, t('tab.estate')),
      h('button', { class: U.tab === 'tavern' ? 'on' : '', onClick: () => { U.tab = 'tavern'; rerender(); } }, t('tab.tavern')),
      h('button', { onClick: () => { R.rest(); A.audio.gullsStart(); A.toast(t('port.rested')); rerender(); } }, t('port.rest')),
      h('button', { class: 'go', onClick: () => U.go('map') }, t('port.depart')));
    if (U.tab === 'yard' && !p.yard) U.tab = 'market';
    const body = U.tab === 'market' ? (R.ruined(p.id, 'market') ? ruinBody('market') : marketBody(p)) : U.tab === 'tavern' ? (R.ruined(p.id, 'inn') ? ruinBody('inn') : tavernBody(p)) : U.tab === 'estate' ? (R.ruined(p.id, 'estate') ? ruinBody('estate') : estateBody(p)) : yardBody(p);
    return h('div', { class: 'scr port' }, head, tabs, body);
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
  const repOf0 = (need) => R.rep(S().port) >= need;
  function yardBody() {
    const s = S();
    const shipCards = A.SHIP_ORDER.map((k) => {
      const T = A.SHIPS[k], price = R.shipPrice(k);
      return h('div', { class: 'card ship' }, A.shipThumb(k, 96, 54, 'p'),
        h('div', { class: 'info' }, h('b', {}, A.name(T)),
          h('div', { class: 'stats' }, stat('ship', T.cap), stat('wind', T.speed), stat('shield', T.hull), stat('cannon', T.cannons), stat('crew', T.crewMax))),
        h('button', { class: 'btn', disabled: s.gold < price || s.ships.length >= R.fleetLimit(), onClick: () => { if (R.buyShip(k)) { A.audio.coin(); A.toast(t('yard.bought', { n: A.name(T) })); } rerender(); } }, A.fmt(price)));
    });
    const UPI = { hull: 'up_hull', sail: 'up_sail', hold: 'up_hold', gun: 'up_cannon', crew: 'up_quarters' };
    const mine = s.ships.map((sh) => {
      const T = A.SHIPS[sh.type]; const rc = R.repairCost(sh); const mh = R.maxHull(sh), cm = R.crewMaxOf(sh); const open = U.upShip === sh.id;
      const rows = !open ? null : h('div', { class: 'uppanel' },
        h('div', { class: 'uprow' }, h('img', { class: 'px upic', src: 'img/ui_cannon.png' }), h('div', { class: 'info' }, h('b', {}, t('up.cannon') + ' ' + sh.cannons + '/' + T.cannons), h('span', { class: 'sub' }, t('up.cannon.d'))),
          h('button', { class: 'btn sm', disabled: sh.cannons >= T.cannons || s.gold < R.cannonCost(), onClick: () => { R.buyCannons(sh.id, 1); rerender(); } }, R.cannonCost())),
        R.UP_KEYS.map((k) => {
          const lv = R.upLv(sh, k), c = R.upCost(sh, k), m = R.UPM[k][Math.min(3, lv + 1)];
          const pips = h('span', { class: 'pips' }, [1, 2, 3].map((i) => h('i', { class: i <= lv ? 'on' : '' })));
          const txt = k === 'gun' ? t('up.gun.d', { n: Math.round(m * 100), d: Math.round(Math.min(3, lv + 1) * 10) }) : t('up.' + k + '.d', { n: Math.round(m * 100) });
          let need = null;
          if (c) { need = h('div', { class: 'need' }, Object.keys(c.goods).map((g) => h('span', { class: 'chip ' + ((s.cargo[g] || 0) >= c.goods[g] ? 'n' : 'd') }, A.goodIcon(g, 14), h('b', {}, (s.cargo[g] || 0) + '/' + c.goods[g]))), repOf0(c.rep) ? null : h('span', { class: 'sub' }, t('up.rep', { n: c.rep }))); }
          return h('div', { class: 'uprow' }, h('img', { class: 'px upic', src: 'img/' + UPI[k] + '.png' }), h('div', { class: 'info' }, h('b', {}, t('up.' + k), ' ', pips), h('span', { class: 'sub' }, c ? txt : t('up.max')), need),
            c ? h('button', { class: 'btn sm', disabled: !R.canUpgrade(sh, k), onClick: () => { if (R.upgrade(sh.id, k)) A.audio.coin(); rerender(); } }, A.fmt(c.gold)) : null);
        }));
      return h('div', { class: 'card mine' }, h('div', { class: 'mtop' }, A.shipThumb(sh.type, 64, 38, 'p'), h('div', { class: 'info' }, h('b', {}, sh.name), h('span', { class: 'sub' }, A.name(T)), bar((sh.hull / mh) * 100, sh.hull / mh < 0.4 ? 'low' : ''))),
        h('div', { class: 'stats' }, stat('shield', Math.round(sh.hull) + '/' + mh), stat('crew', sh.crew + '/' + cm), stat('cannon', sh.cannons + '/' + T.cannons), stat('ship', R.capOf(sh))),
        h('div', { class: 'acts' },
          h('button', { class: 'btn sm', disabled: rc <= 0 || s.gold < rc, onClick: () => { R.repair(sh.id); rerender(); } }, t('yard.repair') + (rc > 0 ? ' ' + A.fmt(rc) : '')),
          h('button', { class: 'btn sm', disabled: sh.crew >= cm || s.gold < R.crewCost(), onClick: () => { R.hireCrew(sh.id, 5); rerender(); } }, t('yard.crew') + ' ' + R.crewCost() * 5),
          h('button', { class: 'btn sm' + (open ? '' : ' ghost'), onClick: () => { U.upShip = open ? null : sh.id; rerender(); } }, t('yard.upg')),
          h('button', { class: 'btn sm ghost', disabled: s.ships.length <= 1, onClick: () => { if (R.sellShip(sh.id)) A.audio.coin(); rerender(); } }, t('yard.sell') + ' ' + A.fmt(R.shipSellValue(sh)))), rows);
    });
    return h('div', { class: 'list yard' }, h('h3', {}, t('yard.ships')), shipCards, h('h3', {}, t('yard.fleet') + ' (' + s.ships.length + '/' + R.fleetLimit() + ')'), R.nextFleetRep() ? h('p', { class: 'sub' }, t('fleet.next', { n: R.nextFleetRep() })) : null, mine);
  }
  function stat(ic, v) { return h('span', { class: 'st' }, A.icon(ic, 14), ' ' + v); }

  // ------------------------------------------------------------------ MAP
  U.mapWrap = null;
  function renderMap() {
    const s = S();
    if (!U.mapWrap) { U.mapWrap = h('div', { class: 'mapwrap' }); A.map.init(U.mapWrap); A.map.onSelect = (id) => { if (S().voyage) return; U.sel = id; selectDest(); }; }
    const root = h('div', { class: 'scr mapscr' }, U.mapWrap, h('div', { class: 'sheet', id: 'sheet' }));
    queueMicrotask(() => { A.map.resize(); renderSheet(); if (!s.voyage && !A.map.ship && s.port) A.map.setShipDocked(s.port); if (A.map.needCenter && !s.voyage && s.port) { const pp = A.port(s.port); A.map.needCenter = false; A.map.cx = A.map.tcx = pp.lon; A.map.cy = A.map.tcy = pp.lat; A.map.k = A.map.tk = Math.max(A.map.tk, 15); } });
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
    if (!U.sel || U.sel === s.port) { sh.replaceChildren(h('div', { class: 'sbody hint' }, U.sel ? h('button', { class: 'xbtn', onClick: () => { U.sel = null; selectDest(); } }, '✕') : null, t(U.sel ? 'sheet.here' : 'sheet.hint'), h('div', { class: 'legend' }, h('span', {}, A.icon('anchor', 15), ' ' + t('legend.yard')), h('span', {}, A.icon('skull', 15), ' ' + t('legend.skull'))))); return; }
    const d = A.port(U.sel), est = R.estimate(U.sel);
    const baseDays = est.nm / ((R.fleetSpeed() || 5) * C.NM_PER_KNOT_DAY); const wr = baseDays / est.days;
    const windTxt = wr > 1.06 ? t('sheet.tail') : wr < 0.94 ? t('sheet.head') : t('sheet.crosswind');
    const skulls = est.risk === 'high' ? 3 : est.risk === 'mid' ? 2 : 1;
    sh.replaceChildren(h('div', { class: 'sbody' },
      h('div', { class: 'sh1' }, h('b', {}, A.name(d)), h('span', {}, t('sheet.days', { n: est.days }) + ' · ' + t('sheet.nm', { n: Math.round(est.nm) })), h('button', { class: 'xbtn', 'aria-label': 'close', onClick: () => { U.sel = null; selectDest(); } }, '✕')),
      h('div', { class: 'prow' }, d.p.map((g) => chip(g, 'p')), d.yard ? h('span', { class: 'badge' }, A.icon('anchor', 14), t('yard.badge')) : null),
      h('div', { class: 'sh2' }, h('span', {}, windTxt), h('span', { class: 'risk ' + est.risk }, [0, 1, 2].map((i) => h('span', { class: 'ic' + (i < skulls ? ' on' : ''), html: A.svg(A.ICONS.skull, 15) })), ' ' + t('risk.' + est.risk))),
      h('button', { class: 'btn go big', onClick: () => depart(U.sel) }, t('sheet.sail'))));
  }

  function depart(id) {
    const r = R.startVoyage(id, {});
    if (!r.ok) { A.toast(t(r.err === 'gold' ? 'err.gold' : 'err.generic')); return; }
    A.audio.gullsStop(); A.audio.seaStart(); U.sel = null; A.map.sel = null; A.map.preview = null;
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
    let enc = null, sea = null;
    res.events.forEach((ev) => {
      if (ev.type === 'storm') { A.toast(t('ev.storm', { s: ev.ship }) + (ev.refund ? ' ' + t('ev.refund', { n: A.fmt(ev.refund) }) : ''), 'bad'); A.audio.hit(); }
      else if (ev.type === 'calm') A.toast(t('ev.calm'));
      else if (ev.type === 'broke') A.toast(t('ev.broke'), 'bad');
      else if (ev.type === 'questExpired') A.toast(t('ev.questExpired'), 'bad');
      else if (ev.type === 'pirates') enc = ev;
      else if (ev.type === 'sea') sea = ev;
    });
    if (enc) { showEncounter(enc.zone); return; }
    if (sea) { showSeaEvent(sea.id, res.arrived); return; }
    if (res.arrived) { finishVoyage(); return; }
    voy.busy = false; setTimeout(voyTick, 140);
  }
  U.showSeaEvent = showSeaEvent;
  function showSeaEvent(id, arrived) {
    const e = A.SEA_BY_ID[id], L = A.lang === 'tr' ? 1 : 0; A.audio.gong && A.audio.gong();
    const body = h('div', { class: 'seaev' }, h('p', { class: 'evq' }, e[A.lang === 'tr' ? 'tr' : 'en']));
    const buttons = e.o.map((o, i) => ({ label: o[L] + (R.seaHint(o[2], A.lang) ? '  [' + R.seaHint(o[2], A.lang) + ']' : ''), kind: i ? '' : 'go', onClick: () => {
      const done = R.seaApply(id, i); A.toast(R.seaSummary(done, A.lang), done.some((d) => (d.m < 0 || d.g < 0 || d.s < 0 || d.h)) ? 'bad' : '');
      U.renderTop(); if (U.screen === 'map') renderSheet();
      setTimeout(() => { if (arrived) finishVoyage(); else { voy.busy = false; setTimeout(voyTick, 140); } }, 250);
    } }));
    U.modal({ title: A.lang === 'tr' ? 'Seyirde olay!' : 'Event at sea!', body, buttons });
  }
  function finishVoyage() {
    const a = R.arrive(); voy.busy = false; A.map.follow = false; A.map.setShipDocked(a.port);
    A.audio.unlock(); A.audio.gong();
    const sign = a.dm >= 0 ? '+' : '';
    A.toast(t('arr.msg', { p: A.name(A.port(a.port)), d: a.days }) + ' ' + t('arr.morale', { n: sign + a.dm }), a.dm < 0 ? 'bad' : '');
    U.tab = 'market'; U.sel = null; A.map.sel = null; A.map.preview = null;
    U.go('port');
    setTimeout(() => { const pid = a.port; if (!R.hasMet(pid) || R.eventsAt(pid).length) U.mayorModal(pid); }, 900);
  }

  function showEncounter(zone) {
    const s = S(); A.audio.alarm && A.audio.alarm(); const pirates = R.genPirates(zone); const threat = R.threat(pirates);
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
            h('button', { class: 'btn sm', disabled: S().ships.length >= R.fleetLimit(), onClick: () => { R.keepPrize(p); prizeState[i] = 'keep'; U.renderTop(); draw(); } }, t('res.keep')),
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
      return h('div', { class: 'card mine' }, h('div', { class: 'mtop' }, A.shipThumb(sh.type, 84, 46, 'p'), h('div', { class: 'info' }, h('b', { class: 'rn', title: t('up.rename'), onClick: () => U.renameModal(sh) }, sh.name, ' ✎'), h('span', { class: 'sub' }, A.name(T) + ' · ' + t('fleet.exp', { n: sh.exp.toFixed(1) })), bar((sh.hull / R.maxHull(sh)) * 100, sh.hull / R.maxHull(sh) < 0.4 ? 'low' : ''))),
        h('div', { class: 'stats' }, stat('shield', Math.round(sh.hull) + '/' + R.maxHull(sh)), stat('crew', sh.crew + '/' + R.crewMaxOf(sh)), stat('cannon', sh.cannons + '/' + T.cannons), stat('wind', R.shipSpeed(sh).toFixed(1)), stat('ship', R.capOf(sh))));
    });
    const cargo = Object.keys(s.cargo).length ? h('div', { class: 'cargo' }, Object.keys(s.cargo).map((g) => h('span', { class: 'chip n' }, A.goodIcon(g, 15), h('b', {}, A.name(A.GOOD_BY_ID[g]) + ' ' + s.cargo[g])))) : h('p', { class: 'sub' }, t('fleet.empty'));
    const repList = Object.keys(s.rep).filter((id) => s.rep[id] > 0).sort((a, b) => s.rep[b] - s.rep[a]).slice(0, 6).map((id) => h('div', { class: 'rrow' }, h('span', {}, A.name(A.port(id))), stars(s.rep[id])));
    return h('div', { class: 'scr list pad' },
      h('div', { class: 'sumcard' }, h('div', {}, h('b', {}, t('fleet.cap')), ' ' + R.cargoCount() + '/' + R.fleetCap()), h('div', {}, h('b', {}, t('fleet.speed')), ' ' + R.fleetSpeed().toFixed(1)), h('div', {}, h('b', {}, t('fleet.morale')), ' ' + Math.round(s.morale) + ' · ' + t(moraleKey(s.morale))), h('p', { class: 'sub' }, t('fleet.moraleHelp'))),
      h('div', { class: 'company' }, h('span', { html: A.flagSvg(s.profile.flag, 44) }), h('b', {}, s.profile.name)),
      h('h3', {}, t('fleet.ships') + ' (' + s.ships.length + '/' + R.fleetLimit() + ')'), cards,
      h('h3', {}, t('fleet.captains') + ' (' + s.captains.length + '/' + R.captainSlots() + ')'), s.captains.length ? s.captains.map(captainRow) : h('p', { class: 'sub' }, t('fleet.noCaptains')),
      h('h3', {}, t('fleet.cargo')), cargo,
      h('h3', {}, t('fleet.rep')), repList.length ? repList : h('p', { class: 'sub' }, t('fleet.noRep')));
  }

  // ------------------------------------------------------------------ QUESTS
  const ptIdx = (k) => { if (typeof k === 'number') return k; const mi = A.MAYORS.findIndex((m) => m.id === k); if (mi >= 0) return mi; let x = 0; for (const ch of String(k)) x = (x * 31 + ch.charCodeAt(0)) >>> 0; return 29 + (x % 16); };
  const portrait = (k, size) => h('span', { class: 'portrait', html: '<img class="px" width="' + size + '" height="' + size + '" src="img/pt_' + String(ptIdx(k)).padStart(2, '0') + '.png" alt="">' });
  function capLook(name) {
    let x = 0; for (let i = 0; i < name.length; i++) x = (x * 31 + name.charCodeAt(i)) >>> 0;
    const pk = (a, k) => a[(x >>> k) % a.length];
    return { sk: pk(['#e8bf94', '#d9a877', '#c58c5a', '#a06a3f', '#7a4a2a', '#e8c08a'], 1), rb: pk(['#2f4f7a', '#7a2430', '#3a6a5a', '#5a3a6a', '#8a5a2a', '#2a4a6a'], 4), hat: pk(['cap', 'beret', 'turban', 'hood', 'fez', 'kufi', 'conical'], 7), hc: pk(['#2f4f7a', '#8a3b24', '#e8e2d0', '#3a6a5a', '#6a2a4a'], 10), bd: pk(['none', 'short', 'mustache', 'long'], 13), bc: '#3a2a1a', ac: '#d9a93a' };
  }
  const rarName = (r) => t('rar.' + r);
  function captainRow(c, hire) {
    const pk = A.PERK_BY_ID[c.perk]; const s = S();
    return h('div', { class: 'card captain rar-' + c.rar }, portrait(c.name, 52),
      h('div', { class: 'info' }, h('b', {}, c.name), h('span', { class: 'perk' }, h('img', { class: 'px perkic', src: 'img/perk_' + c.perk + '.png', width: 22, height: 22, onerror: function () { this.remove(); } }), h('i', { class: 'rar rar-' + c.rar }, rarName(c.rar)), ' ' + A.name(pk)), h('span', { class: 'sub' }, pk.d[A.lang] || pk.d.en),
        h('span', { class: 'sub' }, hire ? t('tavern.cost', { f: A.fmt(c.fee), w: c.wage }) : t('tavern.wage', { w: c.wage }))),
      hire ? h('button', { class: 'btn sm', disabled: s.gold < c.fee || s.captains.length >= R.captainSlots(), onClick: () => { if (R.hireCaptain(c.id)) { A.audio.coin(); A.toast(t('tavern.hired', { n: c.name })); } rerender(); } }, t('tavern.hire'))
        : h('button', { class: 'btn sm ghost', onClick: () => { R.dismissCaptain(c.id); rerender(); } }, t('tavern.dismiss')));
  }
  function estateBody(p) {
    const s = S(); const wi = R.whInfo(); const th = R.thAt();
    const goodsRow = (src, act, label, off) => Object.keys(src).map((g) => h('div', { class: 'uprow' }, A.goodIcon(g, 26), h('div', { class: 'info' }, h('b', {}, A.name(A.GOOD_BY_ID[g]) + ' ' + src[g])),
      h('button', { class: 'btn sm', disabled: off, onClick: () => { act(g, 10); rerender(); } }, label)));
    const whCard = h('div', { class: 'card' }, h('h3', {}, t('est.wh')), h('p', { class: 'sub' }, t('est.wh.d', { n: R.WH_CAP })),
      h('p', {}, wi ? (wi.active ? t('est.left', { n: wi.left }) + ' · ' + wi.used + '/' + R.WH_CAP : t('est.expired')) : t('est.none')),
      h('div', { class: 'acts' }, R.WH.map((o, i) => h('button', { class: 'btn sm', disabled: s.gold < o.c, onClick: () => { if (R.whRent(i)) A.audio.coin(); rerender(); } }, t('est.rent', { d: o.d }) + ' ' + o.c))),
      wi && wi.used ? h('div', {}, h('h4', {}, t('est.stored')), goodsRow(wi.goods, R.whTake, t('est.take'), false)) : null,
      wi && wi.active && Object.keys(s.cargo).length ? goodsRow(s.cargo, R.whPut, t('est.put'), false) : null);
    const thCard = h('div', { class: 'card' }, h('h3', {}, t('est.th')), h('p', { class: 'sub' }, t('est.th.d', { n: R.TH_CAP, u: 6 })),
      th ? h('div', {}, h('p', {}, R.thCount(th) + '/' + R.TH_CAP), Object.keys(th.stock).length ? goodsRow(th.stock, () => {}, '', true).length && h('div', { class: 'cargo' }, Object.keys(th.stock).map((g) => h('span', { class: 'chip n' }, A.goodIcon(g, 15), h('b', {}, th.stock[g])))) : h('p', { class: 'sub' }, t('est.empty')),
        h('button', { class: 'btn sm', disabled: !R.thCount(th), onClick: () => { R.thCollect(); A.audio.coin(); rerender(); } }, t('est.collect')))
        : h('button', { class: 'btn sm', disabled: s.gold < R.TH_COST, onClick: () => { if (R.thBuy()) A.audio.gong(); rerender(); } }, t('est.buy') + ' ' + R.TH_COST));
    const fitCard = h('div', { class: 'card' }, h('h3', {}, t('est.fit')), h('p', { class: 'sub' }, t('est.fit.d', { c: R.FIT_COST })),
      h('button', { class: 'btn sm' + (s.fitter ? ' ghost' : ''), onClick: () => { R.fitterToggle(); rerender(); } }, s.fitter ? t('est.fire') + ' (' + t('est.on') + ')' : t('est.hire') + ' ' + R.fitterCost() + '/d'));
    const bk = R.bankAt();
    const bankCard = h('div', { class: 'card' }, h('h3', {}, t('est.bank')), h('p', { class: 'sub' }, t('est.bank.d', { r: (R.BANK_RATE * 100).toFixed(2) })),
      bk ? h('div', {}, h('p', {}, t('est.bal') + ': ' + A.fmt(R.bankBal())),
        h('div', { class: 'acts' }, [100, 1000, 'all'].map((n) => h('button', { class: 'btn sm', disabled: !s.gold, onClick: () => { if (R.bankDeposit(n === 'all' ? s.gold : n)) A.audio.coin(); rerender(); } }, t('est.dep') + ' ' + (n === 'all' ? t('est.all') : n)))),
        h('div', { class: 'acts' }, [100, 1000, 'all'].map((n) => h('button', { class: 'btn sm ghost', disabled: !R.bankBal(), onClick: () => { if (R.bankWithdraw(n === 'all' ? R.bankBal() : n)) A.audio.coin(); rerender(); } }, t('est.wd') + ' ' + (n === 'all' ? t('est.all') : n)))))
        : h('button', { class: 'btn sm', disabled: s.gold < R.BANK_OPEN, onClick: () => { if (R.bankOpen()) A.audio.gong(); rerender(); } }, t('est.open') + ' ' + R.BANK_OPEN),
      R.bankTotal() ? h('p', { class: 'sub' }, t('est.bank.all', { n: A.fmt(R.bankTotal()) })) : null);
    return h('div', { class: 'list yard' }, bankCard, whCard, thCard, fitCard);
  }
  // ---- Colombo town (the player is the mayor here)
  const bimg = (b, ok, size) => h('img', { class: 'bimg', width: size, height: size, src: 'img/town_' + b + (ok ? '_ok' : '_ruin') + '.png', onError: (e) => { e.target.style.visibility = 'hidden'; } });
  function ruinBody(b) {
    return h('div', { class: 'list yard' }, h('div', { class: 'card ruin' }, bimg(b, false, 160), h('h3', {}, t('town.b.' + b) + ' - ' + t('town.ruined')), h('p', { class: 'sub' }, t('town.ruin.hint'))));
  }
  function townView() {
    const s = S();
    const costLine = (d) => [h('span', { class: 'gl' }, A.icon('coin', 15), ' ' + A.fmt(d.gold)), Object.keys(d.goods).map((g) => h('span', { class: 'gl' + ((s.cargo[g] || 0) < d.goods[g] ? ' lack' : '') }, A.goodIcon(g, 15), ' ' + (s.cargo[g] || 0) + '/' + d.goods[g]))];
    const cards = R.TOWN_ORDER.map((b) => {
      const d = R.TOWN[b], ok = R.townBuilt(b);
      return h('div', { class: 'tb' + (ok ? ' ok' : '') }, bimg(b, ok, 96), h('b', {}, t('town.b.' + b)),
        ok ? h('span', { class: 'sub' }, t('town.tax', { n: d.tax })) : h('div', { class: 'cost' }, costLine(d)),
        ok ? h('span', { class: 'sub' }, t('town.done')) : h('button', { class: 'btn sm', disabled: !R.townCan(b), onClick: () => { if (R.townRepair(b)) { A.audio.gong(); A.toast(t('town.fixed', { b: t('town.b.' + b) })); } rerender(); } }, t('town.repair')));
    });
    return h('div', { class: 'card town' }, h('h3', {}, t('town.title')), h('p', { class: 'sub' }, t('town.d', { n: R.townCount(), t: R.townTax() })), h('div', { class: 'tgrid' }, cards));
  }
  function escortCard() {
    const s = S();
    return h('div', { class: 'card' }, h('h3', {}, t('esc.title')), h('p', { class: 'sub' }, t('esc.d')),
      h('div', { class: 'acts' }, ['light', 'war', 'grand'].map((id) => { const e = A.ESCORTS[id]; const on = s.escort === id;
        return h('button', { class: 'btn sm' + (on ? ' go' : ''), disabled: !on && s.gold < e.cost && !s.escort, onClick: () => { const was = s.escort; R.cancelEscort(); if (was !== id && !R.hireEscort(id)) A.toast(t('err.gold')); else if (was !== id) A.audio.coin(); U.renderTop(); rerender(); } }, A.name(e) + ' ' + e.cost); })),
      h('p', { class: 'sub' }, s.escort ? t('esc.on', { n: A.name(A.ESCORTS[s.escort]) }) : t('esc.off')));
  }
  U.introModal = function (done) {
    const pages = [1, 2, 3, 4, 5]; let i = 0, endType = null;
    const bubble = h('p', { class: 'bubble' }, ''); const scene = h('img', { class: 'iscene', src: '' });
    const btn = h('button', { class: 'btn go' }, ''); const skip = h('button', { class: 'btn ghost' }, t('intro.skip'));
    const back = h('div', { class: 'modalback' }, h('div', { class: 'modal intro' }, scene,
      h('div', { class: 'mtop' }, h('img', { class: 'mustafa', src: 'img/mustafa.png', onError: (e) => { e.target.style.visibility = 'hidden'; } }), h('div', { class: 'info' }, h('b', {}, 'Steel Mustafa'), h('span', { class: 'sub' }, t('intro.role')))), bubble, h('div', { class: 'mbtns' }, skip, btn)));
    const close = () => { if (endType) endType(); A.audio.voiceStop(); back.remove(); done && done(); };
    const show = () => { scene.style.display = 'none'; scene.onload = () => { scene.style.display = 'block'; }; scene.onerror = () => { scene.style.display = 'none'; }; scene.src = 'img/intro_' + Math.min(i + 1, 4) + '.jpg';
      btn.textContent = i === pages.length - 1 ? t('intro.start') : t('intro.next'); if (endType) endType(); endType = U.typeText(bubble, t('intro.' + pages[i]), 5, null, 22); };
    btn.onclick = () => { if (i < pages.length - 1) { i++; show(); } else close(); }; skip.onclick = close;
    $('overlay').append(back); show();
  };
  function tavernBody() {
    const s = S(); const list = R.tavern(s.port);
    return h('div', { class: 'list yard' },
      h('p', { class: 'sub tavhint' }, t('tavern.intro', { a: s.captains.length, b: R.captainSlots() })),
      h('h3', {}, t('tavern.title')), list.length ? list.map((c) => captainRow(c, true)) : h('p', { class: 'sub' }, t('tavern.none')),
      s.captains.length ? [h('h3', {}, t('tavern.yours')), s.captains.map((c) => captainRow(c, false))] : null,
      h('h3', {}, t('tavern.crew')), h('button', { class: 'btn big', disabled: s.gold < R.treatCost() || s.treatDay === s.day, onClick: () => { if (R.treatCrew()) { A.audio.coin(); A.toast(t('tavern.treated')); } rerender(); } }, t('tavern.treat', { c: A.fmt(R.treatCost()) })));
  }

  // typewriter text: faster than reading speed, with the cello mumble while it flows
  U.typeText = function (el, text, voice, done, speed) {
    const cps = speed || 62; const t0 = Date.now(); let fin = false;
    const end = () => { if (fin) return; fin = true; clearInterval(iv); el.textContent = text; A.audio.voiceStop(); done && done(); };
    A.audio.voiceStart(voice);
    const iv = setInterval(() => { if (!el.isConnected) { clearInterval(iv); fin = true; A.audio.voiceStop(); return; } const n = Math.floor((Date.now() - t0) / 1000 * cps); if (n >= text.length) end(); else el.textContent = text.slice(0, n); }, 30);
    el.addEventListener('click', end); return end;
  };
  const voiceOf = (id) => { let x = 0; for (let i = 0; i < id.length; i++) x = (x * 31 + id.charCodeAt(i)) >>> 0; return x % 5; };
  const addr = (txt) => { const n = (S().profile && S().profile.name) || 'captain'; return txt.replace(/\bcaptain\b/gi, n).replace(/\bkaptan\b/gi, n); };

  U.renameModal = function (sh) {
    const input = h('input', { class: 'pname', maxlength: 18, value: sh.name });
    U.modal({ title: t('up.rename'), body: h('div', {}, h('p', { class: 'sub' }, t('up.name')), input), buttons: [{ label: t('up.save'), kind: 'go', onClick: () => { R.renameShip(sh.id, input.value); rerender(); } }] });
    setTimeout(() => input.focus(), 200);
  };
  U.profileModal = function (cb) {
    let flag = 'lion'; const input = h('input', { class: 'pname', maxlength: 24, placeholder: t('profile.ph'), value: '' });
    const grid = h('div', { class: 'flaggrid' });
    const draw = () => { grid.innerHTML = ''; A.FLAGS.forEach((f) => grid.append(h('button', { class: 'flagbtn' + (f.id === flag ? ' on' : ''), title: t('flag.' + f.id), onClick: () => { flag = f.id; draw(); A.audio.coin(); }, html: A.flagSvg(f.id, 54) }))); };
    draw();
    U.modal({ title: t('profile.title'), cls: 'profile', body: h('div', {}, h('p', { class: 'sub' }, t('profile.name')), input, h('p', { class: 'sub' }, t('profile.flag')), grid),
      buttons: [{ label: t('profile.start'), kind: 'go', onClick: () => { cb({ name: input.value.trim() || t('profile.def'), flag }); } }] });
    setTimeout(() => input.focus(), 200);
  };

  U.mayorModal = function (portId) {
    if (portId === 'colombo') { R.meet(portId); U.modal({ title: t('town.title'), body: h('div', {}, h('p', {}, t('town.mayor', { n: R.townCount() }))), buttons: [{ label: t('mayor.visit'), kind: 'go', onClick: () => U.go('quests') }, { label: t('mayor.ok'), kind: 'ghost' }] }); return; }
    const m = R.mayor(portId); if (!m) return; const first = !R.hasMet(portId); R.meet(portId);
    const evs = R.eventsAt(portId).map(R.eventText).slice(0, 2);
    const news = evs.map((e) => h('div', { class: 'news' }, h('b', {}, e.title), h('div', { class: 'sub' }, e.text)));
    const bubble = h('p', { class: 'bubble' }, '');
    const line = addr(first ? (m.say[A.lang] || m.say.en) : t('mayor.back'));
    const stopVoice = () => A.audio.voiceStop();
    U.modal({ title: '', cls: 'mayor', body: h('div', { class: 'mayorbox' },
      h('div', { class: 'mtop' }, portrait(m.id, 88), h('div', { class: 'info' }, h('b', {}, m.name), h('span', { class: 'sub' }, m.title[A.lang] || m.title.en))),
      bubble, news.length ? [h('div', { class: 'lbl' }, t('mayor.news')), news] : null),
      buttons: [{ label: t('mayor.visit'), kind: 'go', onClick: () => { stopVoice(); U.go('quests'); } }, { label: t('mayor.ok'), kind: 'ghost', onClick: stopVoice }] });
    U.typeText(bubble, line, voiceOf(portId));
  };

  function renderQuests() {
    const s = S(); const p = s.port && A.port(s.port); const m = p && R.mayor(p.id);
    const questCard = (q, active) => {
      const g = A.GOOD_BY_ID[q.good]; const have = Math.min(q.qty, s.cargo[q.good] || 0);
      return h('div', { class: 'card quest' }, h('div', { class: 'qtop' }, A.goodIcon(q.good, 28), h('div', { class: 'info' }, h('b', {}, t('q.title', { q: q.qty, g: A.name(g) })), h('span', { class: 'sub' }, t('q.to', { p: A.name(A.port(q.to)), d: Math.max(0, q.deadline - s.day) }))), h('b', { class: 'reward' }, '+' + A.fmt(q.reward))),
        active ? h('div', { class: 'qbar' }, bar((have / q.qty) * 100), h('span', {}, have + '/' + q.qty), h('button', { class: 'btn sm', disabled: !R.canComplete(q), onClick: () => { if (R.completeQuest(q.id)) { A.audio.coin(); A.toast(t('q.done', { n: A.fmt(q.reward) })); } rerender(); } }, t('q.deliver')))
          : h('div', { class: 'acts' }, h('button', { class: 'btn sm', disabled: s.quests.length >= 3, onClick: () => { R.acceptQuest(q.id); A.audio.quill && A.audio.quill(); rerender(); } }, t('q.accept'))));
    };
    const head = m ? h('div', { class: 'card mayorcard' }, portrait(m.id, 64), h('div', { class: 'info' }, h('b', {}, m.name), h('span', { class: 'sub' }, (m.title[A.lang] || m.title.en) + ' · ' + A.name(p)), h('span', { class: 'sub' }, t('mayor.hello', { n: (s.profile && s.profile.name) || '' })))) : h('p', { class: 'sub' }, t('mayor.atSea'));
    const evs = p ? R.eventsAt(p.id).map(R.eventText) : [];
    const news = h('div', {}, evs.length ? evs.map((e) => h('div', { class: 'card news' }, h('b', {}, e.title), h('div', { class: 'sub' }, e.text), h('div', { class: 'evg' }, e.goods.slice(0, 6).map((g) => h('span', { class: 'chip ' + (g[1] > 1 ? 'd' : 'p') }, A.goodIcon(g[0], 15), h('b', {}, (g[1] > 1 ? '▲' : '▼') + Math.abs(Math.round((g[1] - 1) * 100)) + '%'))), h('span', { class: 'sub' }, t('mayor.days', { n: e.left }))))) : h('p', { class: 'sub' }, t('mayor.noNews')));
    const offers = p ? R.offers().map((q) => questCard(q, false)) : [];
    let loan = null;
    if (p) {
      const lim = R.loanLimit(p.id), rate = R.loanRate(p.id);
      loan = h('div', { class: 'card' }, h('div', { class: 'sub' }, t('loan.info', { lim: A.fmt(lim), r: (rate * 100).toFixed(2) })),
        h('div', { class: 'acts' }, [500, 1000, 2000].map((n) => h('button', { class: 'btn sm', disabled: lim < n, onClick: () => { if (R.takeLoan(n)) { A.audio.quill && A.audio.quill(); A.audio.coin(); U.floatGold('+' + A.fmt(n), 'pos'); } rerender(); } }, '+' + A.fmt(n))), h('button', { class: 'btn sm', disabled: lim < 100, onClick: () => { const n = R.takeLoan(lim); if (n) { A.audio.coin(); U.floatGold('+' + A.fmt(n), 'pos'); } rerender(); } }, t('loan.max'))));
    }
    const loans = s.loans.length ? [h('h3', {}, t('loan.yours')), s.loans.map((l) => {
      const dl = l.due - s.day;
      return h('div', { class: 'card loan' + (dl < 0 ? ' late' : '') }, h('div', { class: 'info' }, h('b', {}, t('loan.line', { p: A.name(A.port(l.port)), b: A.fmt(l.balance) })), h('span', { class: 'sub' }, dl >= 0 ? t('loan.due', { d: dl, r: (l.rate * 100).toFixed(2) }) : t('loan.late'))),
        h('div', { class: 'acts' }, h('button', { class: 'btn sm', disabled: s.gold < 100, onClick: () => { R.repayLoan(l.id, 500); rerender(); } }, t('loan.repay', { n: 500 })), h('button', { class: 'btn sm', disabled: s.gold < Math.ceil(l.balance), onClick: () => { R.repayLoan(l.id, Math.ceil(l.balance)); A.audio.coin(); rerender(); } }, t('loan.repayAll'))));
    })] : null;
    return h('div', { class: 'scr list pad' }, p && p.id === 'colombo' ? townView() : head, p ? escortCard() : null,
      p ? [h('h3', {}, t('mayor.news')), news] : null,
      h('h3', {}, t('q.active') + ' (' + s.quests.length + '/3)'), s.quests.length ? s.quests.map((q) => questCard(q, true)) : h('p', { class: 'sub' }, t('q.none')),
      p ? [h('h3', {}, t('q.offers', { p: A.name(p) })), offers.length ? offers : h('p', { class: 'sub' }, t('q.noOffers')), h('h3', {}, t('loan.title')), loan] : null,
      loans);
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
    const el = h('div', { id: 'splash', class: 'splash' }, h('div', { class: 'sbox' }, h('h1', {}, 'MARE NOSTRUM'), h('p', { class: 'tag' }, t('splash.tag')), langs,
      has ? h('button', { class: 'btn go big', onClick: () => start(true) }, t('splash.continue')) : null,
      h('button', { class: 'btn big' + (has ? ' ghost' : ' go'), onClick: () => { A.audio.unlock(); U.profileModal((pf) => { if (has) R.reset(); R.newGame(pf); A.audio.quill && A.audio.quill(); start(false, true); }); } }, t('splash.new'))));
    document.body.append(el);
  };
  function start(load, fresh) {
    A.audio.unlock();
    if (load) { if (!R.load()) R.newGame(); }
    $('splash').remove();
    U.screen = 'port'; U.renderNav(); U.go(S().voyage ? 'map' : 'port');
    if (S().voyage) U.resumeIfAtSea();
    setTimeout(() => A.audio.gong(), 250);
    if (!S().introSeen) { setTimeout(() => U.introModal(() => { S().introSeen = true; R.save(); }), 600); return; }
    if (!S().voyage) setTimeout(() => { const pid = S().port; if (pid && (!R.hasMet(pid) || (fresh && R.eventsAt(pid).length))) U.mayorModal(pid); }, 900);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && S()) R.save(); });
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* Argosy – animated Mediterranean map (canvas): coast, waves, wind, skull zones, routes, ship. */
(function (G) {
  const A = G.A, W = A.world, R = A.game, C = A.C;
  const RAD = Math.PI / 180, YS = 1.27, PAD = 1.6, PADY = 8, MINK = 3.4;
  const M = (A.map = { active: false, sel: null, onSelect: null, preview: null, ship: null, vAnim: null, follow: false, trail: [] });
  let cv, ctx, w = 0, h = 0, dpr = 1, time = 0, last = 0;
  const pts = new Map(); let moved = false, pinch = null;
  M.cx = 15; M.cy = 38; M.k = 13; M.tcx = 15; M.tcy = 38; M.tk = 13;

  // seeded decoration
  let seed = 7; const srnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const waves = [], peaks = [], parts = [];
  function buildDecor() {
    W.build();
    let guard = 0;
    while ((waves.length < 900 || peaks.length < 320) && guard++ < 90000) {
      const lon = C.LON_MIN + srnd() * (C.LON_MAX - C.LON_MIN), lat = C.LAT_MIN + srnd() * (C.LAT_MAX - C.LAT_MIN);
      const c = W.toCell(lon, lat);
      if (W.isLandCell(c[0], c[1])) { if (peaks.length < 320) peaks.push([lon, lat, 0.6 + srnd() * 0.8]); }
      else if (!W.nearCoast[c[1] * W.cols + c[0]] && waves.length < 900) waves.push([lon, lat, srnd() * 6.28]);
    }
    for (let i = 0; i < 90; i++) parts.push({ x: srnd(), y: srnd(), s: 0.5 + srnd() });
  }

  const proj = (lon, lat) => [w / 2 + (lon - M.cx) * M.k, h / 2 - (lat - M.cy) * M.k * YS];
  M.proj = proj;
  function clampCam() {
    M.tk = Math.max(Math.max(MINK, w / (C.LON_MAX - C.LON_MIN + 2 * PAD)), Math.min(46, M.tk)); M.k = Math.max(MINK, Math.min(46, M.k));
    [['cx', 'tcx'], ['cy', 'tcy']].forEach(() => {});
    const vw = w / M.k, vh = h / (M.k * YS);
    const minX = C.LON_MIN - PAD + vw / 2, maxX = C.LON_MAX + PAD - vw / 2, minY = C.LAT_MIN - PADY + vh / 2, maxY = C.LAT_MAX + PADY - vh / 2;
    M.cx = minX > maxX ? (C.LON_MIN + C.LON_MAX) / 2 : Math.max(minX, Math.min(maxX, M.cx));
    M.cy = minY > maxY ? (C.LAT_MIN + C.LAT_MAX) / 2 : Math.max(minY, Math.min(maxY, M.cy));
  }

  M.init = function (wrap) {
    buildDecor();
    cv = document.createElement('canvas'); cv.className = 'mapcv'; wrap.appendChild(cv); ctx = cv.getContext('2d');
    new ResizeObserver(resize).observe(wrap);
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.offsetX, y: e.offsetY, sx: e.offsetX, sy: e.offsetY }); moved = false; if (pts.size === 2) { const p = [...pts.values()]; pinch = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), k: M.tk }; } });
    cv.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId); if (!p) return;
      const dx = e.offsetX - p.x, dy = e.offsetY - p.y; p.x = e.offsetX; p.y = e.offsetY;
      if (pts.size === 1) {
        if (Math.hypot(p.x - p.sx, p.y - p.sy) > 7) moved = true;
        if (moved) { M.follow = false; M.cx -= dx / M.k; M.cy += dy / (M.k * YS); M.tcx = M.cx; M.tcy = M.cy; clampCam(); M.tcx = M.cx; M.tcy = M.cy; }
      } else if (pts.size === 2 && pinch) {
        moved = true; const q = [...pts.values()]; const d = Math.hypot(q[0].x - q[1].x, q[0].y - q[1].y);
        M.tk = pinch.k * (d / pinch.d); M.k = M.tk; clampCam();
      }
    });
    const up = (e) => {
      const p = pts.get(e.pointerId); pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
      if (p && !moved && pts.size === 0) tap(p.x, p.y);
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); pinch = null; });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); M.tk *= e.deltaY < 0 ? 1.15 : 0.87; clampCam(); }, { passive: false });
    requestAnimationFrame(loop);
  };
  function resize() {
    if (!cv) return; dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = cv.parentElement.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height);
    cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    clampCam();
  }
  M.resize = resize;

  function tap(x, y) {
    let best = null, bd = 34;
    A.PORTS.forEach((p) => { const q = proj(p.lon, p.lat); const d = Math.hypot(q[0] - x, q[1] - y); if (d < bd) { bd = d; best = p.id; } });
    if (best && M.onSelect) M.onSelect(best);
  }

  M.centerOn = function (lon, lat, k) { M.tcx = lon; M.tcy = lat; if (k) M.tk = k; };
  M.fit = function (idA, idB) {
    const a = A.port(idA), b = A.port(idB);
    const lo = Math.min(a.lon, b.lon), hi = Math.max(a.lon, b.lon), la = Math.min(a.lat, b.lat), ha = Math.max(a.lat, b.lat);
    const kx = (w - 90) / Math.max(2, hi - lo), ky = (h - 150) / (Math.max(1.5, ha - la) * YS);
    M.tk = Math.max(8, Math.min(26, Math.min(kx, ky))); M.tcx = (lo + hi) / 2; M.tcy = (la + ha) / 2 - 0.4; M.follow = false;
  };
  M.setShipDocked = function (portId) { const p = A.port(portId); M.ship = { lon: p.lon, lat: p.lat, heading: 90 }; M.vAnim = null; M.trail = []; };
  // animate ship along its route from travelled a to b over ms
  M.animateVoyage = function (route, a, b, ms) { M.vAnim = { route, a, b, t: 0, ms }; };
  M.shipAt = (route, d) => { const p = W.posAt(route, d); M.ship = { lon: p.lon, lat: p.lat, heading: p.heading }; };

  // Organic coastline: midpoint displacement (seeded by position) + Chaikin smoothing, cached per polygon.
  const detailCache = new Map();
  function hash2(a, b) { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); }
  function detail(poly) {
    let out = detailCache.get(poly); if (out) return out;
    let pts = poly.slice();
    for (let lv = 0; lv < 3; lv++) {
      const nx = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length]; nx.push(a);
        const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy); if (len < 0.18 || len > 3) continue;
        const r = Math.max(-0.1, Math.min(0.1, (hash2(a[0] + lv * 7.3, a[1] + b[0] * 1.7 + b[1]) - 0.5) * len * 0.34));
        nx.push([(a[0] + b[0]) / 2 - (dy / len) * r, (a[1] + b[1]) / 2 + (dx / len) * r]);
      }
      pts = nx;
    }
    const sm = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      sm.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    detailCache.set(poly, sm); return sm;
  }
  function polyPath(poly0) { const poly = detail(poly0); ctx.beginPath(); poly.forEach((p, i) => { const q = proj(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); }
  function icon(d, x, y, s, col, lw) { ctx.save(); ctx.translate(x - 12 * s, y - 12 * s); ctx.scale(s, s); ctx.strokeStyle = col; ctx.lineWidth = lw || 1.8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(pathOf(d)); ctx.restore(); }
  const iconCache = {}; function pathOf(d) { return iconCache[d] || (iconCache[d] = new Path2D(d)); }

  const worldImg = new Image(); worldImg.src = 'img/world.jpg';
  function drawBase() {
    if (worldImg.complete && worldImg.naturalWidth) { drawBaseImg(); return; }
    drawBaseVec();
  }
  function drawBaseImg() {
    ctx.fillStyle = '#1a4a63'; ctx.fillRect(0, 0, w, h);
    const a = proj(C.LON_MIN, C.LAT_MAX), b = proj(C.LON_MAX, C.LAT_MIN); ctx.imageSmoothingEnabled = M.k < 20;
    ctx.drawImage(worldImg, a[0], a[1], b[0] - a[0], b[1] - a[1]);
    // soft sea sparkle (animated)
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
    waves.forEach((v) => { const q = proj(v[0], v[1]); if (q[0] < -10 || q[0] > w + 10 || q[1] < -10 || q[1] > h + 10) return; const ws = (R.S() ? R.S().wind.str : 1); const bb = Math.sin(time * (1.2 + 0.4 * ws) + v[2]) * (1.5 + ws); ctx.beginPath(); ctx.moveTo(q[0] - 5, q[1]); ctx.quadraticCurveTo(q[0] - 2.5, q[1] - 2.5 + bb, q[0], q[1]); ctx.quadraticCurveTo(q[0] + 2.5, q[1] + 2.5 - bb, q[0] + 5, q[1]); ctx.stroke(); });
    drawOverlays();
  }
  function drawBaseVec() {
    ctx.fillStyle = '#e4d6ad'; ctx.fillRect(0, 0, w, h);
    const gr = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.8);
    gr.addColorStop(0, 'rgba(255,248,224,0.35)'); gr.addColorStop(1, 'rgba(120,90,40,0.22)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    // graticule
    ctx.strokeStyle = 'rgba(138,106,59,0.22)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let lo = -5; lo <= 35; lo += 5) { const x = proj(lo, 0)[0]; ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let la = 30; la <= 45; la += 5) { const y = proj(0, la)[1]; ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    // waves
    ctx.strokeStyle = 'rgba(110,90,60,0.4)'; ctx.lineWidth = 1;
    waves.forEach((v) => {
      const q = proj(v[0], v[1]); if (q[0] < -10 || q[0] > w + 10 || q[1] < -10 || q[1] > h + 10) return;
      const ws = (R.S() ? R.S().wind.str : 1); const b = Math.sin(time * (1.2 + 0.4 * ws) + v[2]) * (1.5 + ws);
      ctx.beginPath(); ctx.moveTo(q[0] - 6, q[1]); ctx.quadraticCurveTo(q[0] - 3, q[1] - 3 + b, q[0], q[1]); ctx.quadraticCurveTo(q[0] + 3, q[1] + 3 - b, q[0] + 6, q[1]); ctx.stroke();
    });
    // land: shoreline glow, outline, fill, inland waters
    const lands = [A.OLDWORLD].concat(A.ISLANDS);
    ctx.lineJoin = 'round';
    lands.forEach((p) => { polyPath(p); ctx.strokeStyle = 'rgba(120,90,50,0.13)'; ctx.lineWidth = 11; ctx.stroke(); ctx.lineWidth = 6; ctx.stroke(); });
    lands.forEach((p) => { polyPath(p); ctx.strokeStyle = '#5b4326'; ctx.lineWidth = 3; ctx.stroke(); });
    lands.forEach((p) => { polyPath(p); ctx.fillStyle = '#d6bd84'; ctx.fill(); });
    A.WATERS.forEach((p) => { polyPath(p); ctx.fillStyle = '#e4d6ad'; ctx.fill(); });
    ctx.strokeStyle = '#e4d6ad'; ctx.lineCap = 'round';
    A.CHANNELS.forEach((ch) => { ctx.beginPath(); ch.pts.forEach((p, i) => { const q = proj(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.lineWidth = Math.max(2, ch.w * M.k * 0.55); ctx.stroke(); });
    ctx.strokeStyle = '#5b4326'; ctx.lineWidth = 1.5;
    ctx.save(); ctx.beginPath(); lands.forEach((p) => { detail(p).forEach((pt, i) => { const q = proj(pt[0], pt[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); }); ctx.clip();
    A.WATERS.forEach((p) => { polyPath(p); ctx.stroke(); }); ctx.restore();
    // mountains
    if (M.k > 10) { ctx.strokeStyle = 'rgba(91,67,38,0.55)'; ctx.lineWidth = 1.1; peaks.forEach((v) => { const q = proj(v[0], v[1]); if (q[0] < 0 || q[0] > w || q[1] < 0 || q[1] > h) return; const s = 4 * v[2] * Math.min(1.6, M.k / 14); ctx.beginPath(); ctx.moveTo(q[0] - s, q[1] + s * 0.6); ctx.lineTo(q[0], q[1] - s * 0.6); ctx.lineTo(q[0] + s, q[1] + s * 0.6); ctx.stroke(); }); }
    drawOverlays();
  }
  function drawOverlays() {
    // political map (close zoom only)
    const pol = Math.max(0, Math.min(1, (M.k - 15) / 7));
    if (pol > 0) {
      ctx.save(); ctx.globalAlpha = pol * 0.7; ctx.strokeStyle = '#6b3e1d'; ctx.lineWidth = 1.3; ctx.setLineDash([7, 4, 1.5, 4]);
      A.BORDERS.forEach((b) => { ctx.beginPath(); b.forEach((pt, i) => { const q = proj(pt[0], pt[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.stroke(); });
      ctx.setLineDash([]); ctx.globalAlpha = pol; ctx.textAlign = 'center';
      A.COUNTRIES.forEach((c) => { const q = proj(c.lon, c.lat); if (q[0] < -80 || q[0] > w + 80 || q[1] < -20 || q[1] > h + 20) return; const fs = Math.max(10, Math.min(c.big ? 22 : 16, M.k * (c.big ? 0.72 : 0.5))); ctx.font = '600 ' + fs + 'px Georgia, serif'; ctx.fillStyle = worldImg.complete ? 'rgba(255,244,214,0.88)' : 'rgba(107,62,29,0.62)'; ctx.lineWidth = 3.5; ctx.strokeStyle = worldImg.complete ? 'rgba(30,18,6,0.7)' : 'rgba(228,214,173,0.55)'; const tx = c.n[A.lang] || c.n.en; ctx.strokeText(tx.toUpperCase(), q[0], q[1]); ctx.fillText(tx.toUpperCase(), q[0], q[1]); });
      ctx.restore();
    }
    // free-standing landmarks
    if (M.k > 7) { const ls = Math.max(15, Math.min(34, M.k * 1.05)); A.LANDMARKS.forEach((m) => { const q = proj(m.lon, m.lat); if (q[0] < -30 || q[0] > w + 30 || q[1] < -10 || q[1] > h + 40) return; A.drawLandmark(ctx, m.t, q[0], q[1], ls); }); }
    // sea labels
    ctx.fillStyle = worldImg.complete ? 'rgba(210,235,245,0.85)' : 'rgba(91,67,38,0.55)'; ctx.shadowColor = worldImg.complete ? 'rgba(5,25,40,0.9)' : 'transparent'; ctx.shadowBlur = 3; ctx.font = 'italic ' + Math.max(10, Math.min(22, M.k * 0.9)) + 'px Georgia, serif'; ctx.textAlign = 'center';
    [['sea.med', 17, 34], ['sea.adriatic', 15.8, 43], ['sea.aegean', 25, 38.9], ['sea.tyrrhenian', 12, 39.8], ['sea.black', 34, 43.4], ['sea.atlantic', -7.5, 41], ['sea.red', 38.8, 19.5], ['sea.persian', 52.2, 27], ['sea.caspian', 50.8, 42], ['sea.arabian', 64, 16], ['sea.bengal', 88, 14], ['sea.indian', 80, 0], ['sea.scs', 114, 12], ['sea.andaman', 96.5, 10.5]].forEach((s2) => { const q = proj(s2[1], s2[2]); ctx.fillText(A.t(s2[0]), q[0], q[1]); }); ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
  }

  function drawDanger() {
    const S = R.S(); if (!S) return;
    S.skulls.forEach((id) => {
      const p = A.port(id); const q = proj(p.lon, p.lat); const r = (260 / 60) * M.k * YS * (1 + Math.sin(time * 1.5) * 0.03);
      const g = ctx.createRadialGradient(q[0], q[1], r * 0.1, q[0], q[1], r); g.addColorStop(0, 'rgba(140,30,20,0.28)'); g.addColorStop(1, 'rgba(140,30,20,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, 6.3); ctx.fill();
    });
  }

  function drawRoute(r, from, fresh) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const line = (a, b) => { ctx.beginPath(); for (let d = a; d <= b; d += Math.max(8, (b - a) / 60)) { const p = W.posAt(r, d); const q = proj(p.lon, p.lat); d === a ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]); } const p2 = W.posAt(r, b); const q2 = proj(p2.lon, p2.lat); ctx.lineTo(q2[0], q2[1]); ctx.stroke(); };
    ctx.strokeStyle = fresh ? '#8a3b24' : '#8a3b24'; ctx.lineWidth = 2.4;
    if (from > 0) { ctx.setLineDash([]); ctx.globalAlpha = 0.55; line(0, from); ctx.globalAlpha = 1; }
    ctx.setLineDash([7, 6]); ctx.lineDashOffset = -time * 14; line(from, r.total);
    ctx.restore();
  }

  function drawGulls() {
    const g = A.img('ev_gull'); if (!g.complete || !g.naturalWidth) return; ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < 4; i++) { const sp = 14 + i * 5, x = ((time * sp + i * 173) % (w + 80)) - 40, y = h * (0.15 + i * 0.2) + Math.sin(time * 1.3 + i * 2) * 10, fl = 1 + Math.sin(time * 9 + i) * 0.35; ctx.globalAlpha = 0.85; ctx.drawImage(g, x, y - 7 * fl, 18, 14 * fl); ctx.globalAlpha = 1; }
  }
  function drawPorts() {
    const S = R.S(); const lang = A.lang; const placed = []; const fs = Math.max(10, Math.min(15, M.k * 0.9)); const lm = Math.max(16, Math.min(32, M.k * 1.0));
    const order = A.PORTS.slice().sort((a, b) => (b.id === M.sel ? 2 : 0) + (S && S.port === b.id ? 1 : 0) - ((a.id === M.sel ? 2 : 0) + (S && S.port === a.id ? 1 : 0)) || (b.yard ? 1 : 0) - (a.yard ? 1 : 0));
    ctx.font = '600 ' + fs + 'px Georgia, serif';
    const draws = [];
    order.forEach((p) => {
      const q = proj(p.lon, p.lat); if (q[0] < -80 || q[0] > w + 80 || q[1] < -40 || q[1] > h + 40) return;
      const sel = M.sel === p.id; const name = p.n[lang]; const tw = ctx.measureText(name).width + (p.yard ? fs + 3 : 0); const showGoods = M.k > 9 || sel; const bh = fs + 6 + (showGoods ? 17 : 0); const bwid = Math.max(tw + 10, showGoods ? 3 * 17 + 6 : 0);
      const cand = [[q[0] + 8, q[1] + 6], [q[0] - bwid - 8, q[1] + 6], [q[0] - bwid / 2, q[1] + 10], [q[0] + 8, q[1] - bh - 4], [q[0] - bwid - 8, q[1] - bh - 4], [q[0] - bwid / 2, q[1] - bh - 14]];
      let spot = null;
      for (const c of cand) { const r = [c[0], c[1], bwid, bh]; if (!placed.some((o) => r[0] < o[0] + o[2] && r[0] + r[2] > o[0] && r[1] < o[1] + o[3] && r[1] + r[3] > o[1])) { spot = r; break; } }
      if (!spot && sel) spot = [cand[0][0], cand[0][1], bwid, bh];
      if (spot) placed.push(spot);
      draws.push({ p, q, spot, sel, name, showGoods, bwid, bh });
    });
    draws.forEach((d) => {
      const { p, q, spot, sel } = d; const here = S && S.port === p.id;
      if (spot) { ctx.fillStyle = 'rgba(244,234,206,0.82)'; ctx.strokeStyle = 'rgba(91,67,38,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(spot[0], spot[1], spot[2], spot[3], 5); ctx.fill(); ctx.stroke(); }
      if (M.k > 8 && p.lm) A.drawLandmark(ctx, p.lm, q[0] - lm * 0.7, q[1] - 4, lm);
      if (sel) { ctx.strokeStyle = 'rgba(138,59,36,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q[0], q[1], 11 + Math.sin(time * 4) * 2, 0, 6.3); ctx.stroke(); }
      ctx.fillStyle = here ? '#8a3b24' : '#f6ecd0'; ctx.strokeStyle = '#2c1d0e'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(q[0], q[1], 5.5, 0, 6.3); ctx.fill(); ctx.stroke();
      if (here) { const fl = A.img('mk_flag'); if (fl.complete && fl.naturalWidth) { ctx.imageSmoothingEnabled = false; const fw = 20, fh = fw * fl.naturalHeight / fl.naturalWidth, rr = 18; for (let r = 0; r < rr; r++) { const dx = Math.sin(time * 5 + r * 0.45) * 1.6 * (r / rr); ctx.drawImage(fl, 0, r * fl.naturalHeight / rr, fl.naturalWidth, fl.naturalHeight / rr + 0.5, q[0] - 3 + dx, q[1] - 6 - fh + r * fh / rr, fw, fh / rr + 0.5); } } }
      if (S && S.skulls.indexOf(p.id) >= 0) { const sk = A.img('mk_skull'); const ps = Math.max(30, Math.min(44, M.k * 2.4)); const bob = Math.sin(time * 2.5) * 1.5; if (sk.complete && sk.naturalWidth) { ctx.imageSmoothingEnabled = false; const sh = ps * sk.naturalHeight / sk.naturalWidth; ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(q[0], q[1] - 8, ps * 0.4, ps * 0.14, 0, 0, 6.3); ctx.fill(); ctx.drawImage(sk, q[0] - ps / 2, q[1] - 12 - sh + bob, ps, sh); } else { ctx.fillStyle = 'rgba(246,236,208,0.9)'; ctx.beginPath(); ctx.arc(q[0], q[1] - 22 + bob, 13, 0, 6.3); ctx.fill(); icon(A.ICONS.skull, q[0], q[1] - 22 + bob, 0.9, '#8a1f14', 2.2); } }
      if (spot) {
        ctx.font = '600 ' + fs + 'px Georgia, serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#2c1d0e'; ctx.fillText(d.name, spot[0] + 5, spot[1] + fs); if (p.yard) { const ya = A.img('ui_anchor'); if (ya.complete && ya.naturalWidth) { ctx.imageSmoothingEnabled = false; const ah = fs + 1, aw = ah * ya.naturalWidth / ya.naturalHeight; ctx.drawImage(ya, spot[0] + 8 + ctx.measureText(d.name).width, spot[1] + 2, aw, ah); } }
        if (d.showGoods) p.p.forEach((g, i) => { const im = A.goodImg(g); if (im.complete && im.naturalWidth) ctx.drawImage(im, spot[0] + 3 + i * 17, spot[1] + fs + 5, 16, 16); });
      }
    });
  }

  function drawWindFx() {
    const S = R.S(); if (!S) return; const b = S.wind.dir * RAD; const dx = Math.sin(b), dy = -Math.cos(b); const str = S.wind.str;
    ctx.lineCap = 'round';
    parts.forEach((p, i) => {
      const sp = (0.012 + 0.016 * str) * p.s; p.x = (p.x + dx * sp * 0.25 + 1) % 1; p.y = (p.y + dy * sp * 0.25 + 1) % 1;
      const x = p.x * w, y = p.y * h, L = (14 + 10 * str) * p.s, sway = Math.sin(time * 1.6 + i) * 3;
      const fade = Math.sin(((p.x + p.y * 1.7 + time * 0.05 * p.s) % 1) * Math.PI);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.18 + 0.32 * fade).toFixed(2) + ')'; ctx.lineWidth = 1.2 + p.s * 0.6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + dx * L * 0.5 - dy * sway, y + dy * L * 0.5 + dx * sway, x + dx * L, y + dy * L); ctx.stroke();
    });
    // wind badge
    ctx.save(); ctx.translate(36, 36); ctx.fillStyle = 'rgba(246,236,208,0.9)'; ctx.strokeStyle = '#2c1d0e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 22, 0, 6.3); ctx.fill(); ctx.stroke();
    const sw = Math.sin(time * 2.2) * 0.07 * str;
    ctx.rotate(b + sw); ctx.strokeStyle = '#8a3b24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -12); ctx.moveTo(-6, -5); ctx.lineTo(0, -12); ctx.lineTo(6, -5); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#2c1d0e'; ctx.font = '600 11px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(A.t('wind.force', { n: Math.round(str * 2) }), 36, 70);
  }

  function drawCompass() {
    const x = w - 46, y = h - 120; ctx.save(); ctx.translate(x, y); ctx.strokeStyle = 'rgba(91,67,38,0.8)'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, 6.3); ctx.arc(0, 0, 14, 0, 6.3); ctx.moveTo(0, -30); ctx.lineTo(0, 30); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.moveTo(-16, -16); ctx.lineTo(16, 16); ctx.moveTo(-16, 16); ctx.lineTo(16, -16); ctx.stroke();
    ctx.fillStyle = '#8a3b24'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(5, -12); ctx.lineTo(-5, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2c1d0e'; ctx.font = 'bold 11px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('N', 0, -34); ctx.restore();
  }

  function drawShip() {
    const S = R.S(); if (!S || !M.ship) return; const s = M.ship; const q = proj(s.lon, s.lat);
    const u = Math.max(9, Math.min(17, M.k * 0.85)); const dir = Math.sin(s.heading * RAD) >= 0 ? 1 : -1;
    // wake
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 1; i < M.trail.length; i++) { const a = proj(M.trail[i - 1][0], M.trail[i - 1][1]), b = proj(M.trail[i][0], M.trail[i][1]); ctx.globalAlpha = i / M.trail.length * 0.6; ctx.beginPath(); ctx.moveTo(a[0], a[1] + 3); ctx.lineTo(b[0], b[1] + 3); ctx.stroke(); }
    ctx.globalAlpha = 1;
    const t = S.ships.length ? S.ships.slice().sort((a, b) => A.SHIPS[b.type].cost - A.SHIPS[a.type].cost)[0].type : 'felucca';
    A.drawShip(ctx, q[0], q[1] - u * 0.2, u, t, { dir, time, side: 'p', cannons: 0 });
    for (let i = 1; i < Math.min(S.ships.length, 4); i++) A.drawShip(ctx, q[0] - dir * i * u * 1.5, q[1] - u * 0.2 + i * 2, u * 0.7, S.ships[i].type, { dir, time, side: 'p', phase: i, cannons: 0 });
  }

  function loop(ts) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts; if (!w) return;
    time += dt;
    if (M.vAnim) {
      const v = M.vAnim; v.t += dt * 1000; const f = Math.min(1, v.t / v.ms); M.shipAt(v.route, v.a + (v.b - v.a) * f);
      if (!M.trail.length || Math.hypot(M.trail[M.trail.length - 1][0] - M.ship.lon, M.trail[M.trail.length - 1][1] - M.ship.lat) > 0.12) { M.trail.push([M.ship.lon, M.ship.lat]); if (M.trail.length > 14) M.trail.shift(); }
      if (f >= 1) { M.vAnim = null; if (v.done) v.done(); }
    }
    if (M.follow && M.ship) { M.tcx = M.ship.lon; M.tcy = M.ship.lat; M.tk = Math.max(M.tk, 15); }
    if (!M.active) return;
    M.k += (M.tk - M.k) * 0.14; M.cx += (M.tcx - M.cx) * 0.14; M.cy += (M.tcy - M.cy) * 0.14; clampCam();
    ctx.clearRect(0, 0, w, h);
    drawBase(); drawDanger();
    const S = R.S();
    if (S && S.voyage) { const r = W.route(S.voyage.from, S.voyage.to); const trv = M.vAnim ? M.vAnim.a + (M.vAnim.b - M.vAnim.a) * Math.min(1, M.vAnim.t / M.vAnim.ms) : S.voyage.travelled; drawRoute(r, trv, false); }
    else if (M.preview) drawRoute(M.preview, 0, true);
    drawWindFx(); drawGulls(); drawPorts(); drawShip(); drawCompass();
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);

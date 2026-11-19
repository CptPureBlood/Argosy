/* Argosy – procedural ship drawing (side view) shared by map, combat and fleet screens. */
(function (G) {
  const A = G.A;

  // opts: {dir:1|-1, side:'p'|'e', time, sink:0..1, hullPct:0..1, cannons:n, firing:0..1}
  A.drawShip = function (ctx, x, y, u, type, o) {
    o = o || {};
    const T = A.SHIPS[type]; const dir = o.dir || 1; const time = o.time || 0; const sink = o.sink || 0;
    const L = u * T.len; const bob = Math.sin(time * 1.6 + (o.phase || 0)) * u * 0.04;
    ctx.save();
    ctx.translate(x, y + bob + sink * u * 1.3);
    ctx.rotate(dir * (Math.sin(time * 1.1 + (o.phase || 0)) * 0.03 + sink * 0.5));
    ctx.scale(dir, 1);
    if (sink > 0) ctx.globalAlpha = 1 - sink * 0.6;
    const pirate = o.side === 'e';
    const hullCol = pirate ? '#2f2a2a' : '#7a4a26';
    const trim = pirate ? '#7a1f1f' : '#c9a24f';
    const sailCol = pirate ? '#cfc7b3' : '#f2e8cf';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#2c1d0e'; ctx.lineWidth = Math.max(1, u * 0.04);

    // oars (galley)
    if (T.oars) {
      ctx.strokeStyle = '#4a3320'; ctx.lineWidth = Math.max(1, u * 0.05);
      for (let i = 0; i < 7; i++) {
        const ox = -L * 0.7 + (i * L * 1.4) / 6; const sw = Math.sin(time * 3 + i * 0.5) * u * 0.18;
        ctx.beginPath(); ctx.moveTo(ox, u * 0.05); ctx.lineTo(ox + sw - u * 0.1, u * 0.55); ctx.stroke();
      }
      ctx.strokeStyle = '#2c1d0e'; ctx.lineWidth = Math.max(1, u * 0.04);
    }

    // masts + sails
    const masts = T.masts; const mh = u * (1.05 + masts * 0.18);
    for (let m = 0; m < masts; m++) {
      const mx = masts === 1 ? 0 : -L * 0.45 + (m * L * 0.9) / (masts - 1);
      const lateen = type === 'felucca' || type === 'galley' || (type === 'caravel' && m === masts - 1);
      ctx.strokeStyle = '#4a3320'; ctx.lineWidth = Math.max(1.2, u * 0.05);
      ctx.beginPath(); ctx.moveTo(mx, -u * 0.35); ctx.lineTo(mx, -mh); ctx.stroke();
      ctx.strokeStyle = '#2c1d0e'; ctx.lineWidth = Math.max(1, u * 0.035);
      const bill = Math.sin(time * 1.8 + m) * u * 0.05 + u * 0.12;
      ctx.fillStyle = sailCol;
      ctx.beginPath();
      if (lateen) {
        ctx.moveTo(mx, -mh); ctx.quadraticCurveTo(mx + L * 0.55 + bill, -mh * 0.55, mx + L * 0.7, -u * 0.4); ctx.lineTo(mx - L * 0.15, -u * 0.4); ctx.closePath();
      } else {
        const w = L * 0.34; const top = -mh * 0.95, bot = -u * 0.45 - (masts - m) * 0.0;
        ctx.moveTo(mx - w, top); ctx.lineTo(mx + w, top); ctx.quadraticCurveTo(mx + w + bill, (top + bot) / 2, mx + w * 0.9, bot); ctx.lineTo(mx - w * 0.9, bot); ctx.quadraticCurveTo(mx - w - bill * 0.4, (top + bot) / 2, mx - w, top); ctx.closePath();
      }
      ctx.fill(); ctx.stroke();
      if (!lateen && !pirate) { ctx.fillStyle = '#8a3b24'; ctx.fillRect(mx - L * 0.07, -mh * 0.78, L * 0.14, u * 0.28); }
      // flag
      if (m === 0) {
        const fl = Math.sin(time * 5) * u * 0.05;
        ctx.fillStyle = pirate ? '#101010' : '#8a3b24';
        ctx.beginPath(); ctx.moveTo(mx, -mh); ctx.lineTo(mx - u * 0.38, -mh - u * 0.06 + fl); ctx.lineTo(mx - u * 0.36, -mh + u * 0.14 + fl); ctx.lineTo(mx, -mh + u * 0.1); ctx.closePath(); ctx.fill();
        if (pirate && u > 24) { ctx.fillStyle = '#f2e8cf'; ctx.beginPath(); ctx.arc(mx - u * 0.18, -mh + u * 0.04 + fl * 0.6, u * 0.035, 0, 6.3); ctx.fill(); }
      }
    }

    // hull
    ctx.fillStyle = hullCol; ctx.strokeStyle = '#2c1d0e'; ctx.lineWidth = Math.max(1, u * 0.04);
    ctx.beginPath();
    ctx.moveTo(-L * 1.0, -u * 0.42); ctx.lineTo(-L * 0.9, u * 0.22); ctx.quadraticCurveTo(0, u * 0.42, L * 0.82, u * 0.22); ctx.lineTo(L * 1.08, -u * 0.5); ctx.lineTo(L * 0.2, -u * 0.38); ctx.lineTo(-L * 0.3, -u * 0.38); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // castles
    if (type === 'carrack' || type === 'galleon' || type === 'caravel') {
      ctx.fillStyle = hullCol; ctx.beginPath(); ctx.rect(-L * 1.0, -u * 0.72, L * 0.45, u * 0.34); ctx.fill(); ctx.stroke();
      if (type !== 'caravel') { ctx.beginPath(); ctx.rect(L * 0.72, -u * 0.62, L * 0.3, u * 0.14); ctx.fill(); ctx.stroke(); }
    }
    // trim stripe
    ctx.strokeStyle = trim; ctx.lineWidth = Math.max(1, u * 0.05);
    ctx.beginPath(); ctx.moveTo(-L * 0.95, -u * 0.12); ctx.lineTo(L * 0.98, -u * 0.18); ctx.stroke();
    // gun ports
    const nc = Math.min(o.cannons != null ? o.cannons : 0, 12);
    ctx.fillStyle = '#120c06';
    for (let i = 0; i < nc; i++) { const gx = -L * 0.75 + ((i + 0.5) * L * 1.5) / Math.max(nc, 1); ctx.fillRect(gx - u * 0.04, -u * 0.04, u * 0.08, u * 0.09); }
    // damage cracks
    if (o.hullPct != null && o.hullPct < 0.6) {
      ctx.strokeStyle = '#120c06'; ctx.lineWidth = Math.max(1, u * 0.03);
      ctx.beginPath(); ctx.moveTo(-L * 0.2, -u * 0.3); ctx.lineTo(-L * 0.1, -u * 0.05); ctx.lineTo(-L * 0.25, u * 0.1);
      if (o.hullPct < 0.3) { ctx.moveTo(L * 0.3, -u * 0.3); ctx.lineTo(L * 0.4, 0); ctx.lineTo(L * 0.3, u * 0.15); }
      ctx.stroke();
    }
    ctx.restore();
  };

  // Mini canvas thumbnail of a ship type for lists.
  A.shipThumb = function (type, w, h, side) {
    const c = document.createElement('canvas'); const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px';
    const x = c.getContext('2d'); x.scale(dpr, dpr);
    A.drawShip(x, w / 2, h * 0.62, Math.min(w, h * 1.6) * 0.3, type, { dir: 1, side, time: 0, cannons: 0 });
    return c;
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* Mare Nostrum – world geometry: land mask from coastline polygons, sea routing (A*), distance helpers. */
(function (G) {
  const A = G.A;
  const C = A.C;
  const RAD = Math.PI / 180;

  A.nm = function (lon1, lat1, lon2, lat2) {
    const dLat = (lat2 - lat1) * 60;
    const dLon = (lon2 - lon1) * 60 * Math.cos(((lat1 + lat2) / 2) * RAD);
    return Math.sqrt(dLat * dLat + dLon * dLon);
  };
  // compass bearing, 0 = north, clockwise
  A.bearing = function (lon1, lat1, lon2, lat2) {
    const dy = lat2 - lat1;
    const dx = (lon2 - lon1) * Math.cos(((lat1 + lat2) / 2) * RAD);
    let b = (Math.atan2(dx, dy) / RAD + 360) % 360;
    return b;
  };

  function inPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function distSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * dx, cy = ay + t * dy;
    return Math.hypot(px - cx, py - cy);
  }

  const W = (A.world = {});
  W.cols = Math.ceil((C.LON_MAX - C.LON_MIN) / C.GRID);
  W.rows = Math.ceil((C.LAT_MAX - C.LAT_MIN) / C.GRID);
  W.land = null;
  W.cache = {};

  W.cellLon = (i) => C.LON_MIN + (i + 0.5) * C.GRID;
  W.cellLat = (j) => C.LAT_MAX - (j + 0.5) * C.GRID;
  W.toCell = (lon, lat) => [
    Math.max(0, Math.min(W.cols - 1, Math.floor((lon - C.LON_MIN) / C.GRID))),
    Math.max(0, Math.min(W.rows - 1, Math.floor((C.LAT_MAX - lat) / C.GRID))),
  ];

  W.build = function () {
    if (W.land) return;
    W.building = true;
    const land = new Uint8Array(W.cols * W.rows);
    const polys = [A.OLDWORLD].concat(A.ISLANDS);
    const bbs = polys.map((p) => {
      let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
      p.forEach((q) => { a = Math.min(a, q[0]); b = Math.max(b, q[0]); c = Math.min(c, q[1]); d = Math.max(d, q[1]); });
      return [a, b, c, d];
    });
    for (let j = 0; j < W.rows; j++) {
      const lat = W.cellLat(j);
      for (let i = 0; i < W.cols; i++) {
        const lon = W.cellLon(i);
        let isLand = false;
        for (let k = 0; k < polys.length && !isLand; k++) {
          const bb = bbs[k];
          if (lon < bb[0] || lon > bb[1] || lat < bb[2] || lat > bb[3]) continue;
          if (inPoly(lon, lat, polys[k])) isLand = true;
        }
        if (!isLand && lat > 47.5 && lon > -4) isLand = true;
        if (isLand) for (const wp of A.WATERS) { if (inPoly(lon, lat, wp)) { isLand = false; break; } }
        if (isLand) {
          for (const ch of A.CHANNELS) {
            for (let s = 0; s < ch.pts.length - 1; s++) {
              if (distSeg(lon, lat, ch.pts[s][0], ch.pts[s][1], ch.pts[s + 1][0], ch.pts[s + 1][1]) < ch.w / 2) { isLand = false; break; }
            }
            if (!isLand) break;
          }
        }
        land[j * W.cols + i] = isLand ? 1 : 0;
      }
    }
    W.land = land;
    W.cols0 = W.cols;
    // coast-adjacent flag (cost penalty keeps routes slightly off the shore)
    W.nearCoast = new Uint8Array(land.length);
    for (let j = 0; j < W.rows; j++)
      for (let i = 0; i < W.cols; i++) {
        if (land[j * W.cols + i]) continue;
        for (let dj = -1; dj <= 1; dj++)
          for (let di = -1; di <= 1; di++) {
            const ii = i + di, jj = j + dj;
            if (ii >= 0 && jj >= 0 && ii < W.cols && jj < W.rows && land[jj * W.cols + ii]) W.nearCoast[j * W.cols + i] = 1;
          }
      }
    W.snapPorts();
  };

  // keep every port marker on water so routes and markers agree
  W.snapPorts = function () {
    A.PORTS.forEach((p) => {
      if (p._snapped) return; const c = W.toCell(p.lon, p.lat);
      if (W.isLandCell(c[0], c[1])) { const s = W.nearestSea(p.lon, p.lat); p.lon = W.cellLon(s[0]); p.lat = W.cellLat(s[1]); }
      p._snapped = true;
    });
  };
  W.isLandCell = (i, j) => i < 0 || j < 0 || i >= W.cols || j >= W.rows || W.land[j * W.cols + i] === 1;
  W.isLand = (lon, lat) => { const c = W.toCell(lon, lat); return W.isLandCell(c[0], c[1]); };

  W.nearestSea = function (lon, lat) {
    const c = W.toCell(lon, lat);
    if (!W.isLandCell(c[0], c[1])) return c;
    for (let r = 1; r < 30; r++) {
      let best = null, bd = 1e9;
      for (let dj = -r; dj <= r; dj++)
        for (let di = -r; di <= r; di++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
          const i = c[0] + di, j = c[1] + dj;
          if (W.isLandCell(i, j)) continue;
          const d = di * di + dj * dj;
          if (d < bd) { bd = d; best = [i, j]; }
        }
      if (best) return best;
    }
    return c;
  };

  // tiny binary heap
  function Heap() { this.a = []; }
  Heap.prototype.push = function (n, p) {
    const a = this.a; a.push([n, p]); let i = a.length - 1;
    while (i > 0) { const q = (i - 1) >> 1; if (a[q][1] <= a[i][1]) break; [a[q], a[i]] = [a[i], a[q]]; i = q; }
  };
  Heap.prototype.pop = function () {
    const a = this.a; const top = a[0]; const last = a.pop();
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        let l = 2 * i + 1, r = l + 1, m = i;
        if (l < a.length && a[l][1] < a[m][1]) m = l;
        if (r < a.length && a[r][1] < a[m][1]) m = r;
        if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  };

  function los(i0, j0, i1, j1) {
    const steps = Math.ceil(Math.max(Math.abs(i1 - i0), Math.abs(j1 - j0)) * 2);
    for (let s = 0; s <= steps; s++) {
      const t = steps ? s / steps : 0;
      const i = Math.round(i0 + (i1 - i0) * t), j = Math.round(j0 + (j1 - j0) * t);
      if (W.isLandCell(i, j)) return false;
    }
    return true;
  }

  W.findPath = function (lonA, latA, lonB, latB) {
    W.build();
    const s = W.nearestSea(lonA, latA), e = W.nearestSea(lonB, latB);
    const cols = W.cols, N = cols * W.rows;
    const g = new Float32Array(N).fill(1e9);
    const from = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const sI = s[1] * cols + s[0], eI = e[1] * cols + e[0];
    const heap = new Heap();
    g[sI] = 0; heap.push(sI, 0);
    const hf = (i, j) => Math.hypot(i - e[0], j - e[1]);
    const D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];
    let found = false;
    while (heap.a.length) {
      const [cur] = heap.pop();
      if (closed[cur]) continue;
      closed[cur] = 1;
      if (cur === eI) { found = true; break; }
      const ci = cur % cols, cj = (cur / cols) | 0;
      for (const d of D) {
        const ni = ci + d[0], nj = cj + d[1];
        if (W.isLandCell(ni, nj)) continue;
        if (d[0] && d[1] && (W.isLandCell(ci + d[0], cj) || W.isLandCell(ci, cj + d[1]))) continue;
        const n = nj * cols + ni;
        if (closed[n]) continue;
        const cost = g[cur] + d[2] + (W.nearCoast[n] ? 0.5 : 0);
        if (cost < g[n]) { g[n] = cost; from[n] = cur; heap.push(n, cost + hf(ni, nj)); }
      }
    }
    if (!found) return null;
    const cells = [];
    for (let c = eI; c !== -1; c = from[c]) cells.push([c % cols, (c / cols) | 0]);
    cells.reverse();
    // string pulling
    const out = [cells[0]];
    let anchor = 0;
    for (let k = 2; k < cells.length; k++) {
      if (!los(cells[anchor][0], cells[anchor][1], cells[k][0], cells[k][1])) { out.push(cells[k - 1]); anchor = k - 1; }
    }
    out.push(cells[cells.length - 1]);
    const pts = [[lonA, latA]];
    for (let k = 1; k < out.length - 1; k++) pts.push([W.cellLon(out[k][0]), W.cellLat(out[k][1])]);
    pts.push([lonB, latB]);
    return pts;
  };

  W.route = function (idA, idB) {
    const key = idA + '>' + idB;
    if (W.cache[key]) return W.cache[key];
    const pa = A.port(idA), pb = A.port(idB);
    let pts = W.findPath(pa.lon, pa.lat, pb.lon, pb.lat);
    if (!pts) pts = [[pa.lon, pa.lat], [pb.lon, pb.lat]];
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + A.nm(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]));
    const r = { from: idA, to: idB, pts, cum, total: cum[cum.length - 1] };
    W.cache[key] = r;
    // reverse route for free
    const rp = pts.slice().reverse();
    const rc = [0];
    for (let i = 1; i < rp.length; i++) rc.push(rc[i - 1] + A.nm(rp[i - 1][0], rp[i - 1][1], rp[i][0], rp[i][1]));
    W.cache[idB + '>' + idA] = { from: idB, to: idA, pts: rp, cum: rc, total: rc[rc.length - 1] };
    return r;
  };

  // position along a route at distance d (nm)
  W.posAt = function (r, d) {
    d = Math.max(0, Math.min(r.total, d));
    let k = 1;
    while (k < r.cum.length - 1 && r.cum[k] < d) k++;
    const a = r.pts[k - 1], b = r.pts[k];
    const seg = r.cum[k] - r.cum[k - 1] || 1;
    const t = (d - r.cum[k - 1]) / seg;
    return { lon: a[0] + (b[0] - a[0]) * t, lat: a[1] + (b[1] - a[1]) * t, heading: A.bearing(a[0], a[1], b[0], b[1]) };
  };

  A.port = function (id) { return A.PORT_BY_ID[id]; };
  A.PORT_BY_ID = {};
  A.PORTS.forEach((p) => { A.PORT_BY_ID[p.id] = p; });
  A.GOOD_BY_ID = {};
  A.GOODS.forEach((g) => { A.GOOD_BY_ID[g.id] = g; });
})(typeof globalThis !== 'undefined' ? globalThis : window);

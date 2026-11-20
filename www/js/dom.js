/* Argosy – tiny DOM helpers. */
(function (G) {
  const A = G.A;
  A.h = function (tag, props) {
    const e = document.createElement(tag);
    for (const k in props || {}) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k === 'html') e.innerHTML = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (let i = 2; i < arguments.length; i++) {
      const kids = [].concat(arguments[i]);
      for (const c of kids.flat(Infinity)) { if (c == null || c === false) continue; e.append(c.nodeType ? c : String(c)); }
    }
    return e;
  };
  A.svg = (d, size, cls) => '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) + '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  const PNG = { market: 'mk_port', compass: 'ui_map', fleetnav: 'mk_ship', mayornav: 'mk_hall', menu: 'ui_scroll', ship: 'ui_crate', shield: 'ui_hull', crew: 'ui_crew', cannon: 'ui_cannon', wind: 'ui_wind', coin: 'ui_coin', heart: 'ui_heart', anchor: 'ui_anchor', skull: 'mk_skull' };
  A.icon = (name, size, cls) => PNG[name] ? A.h('span', { class: 'ic ' + (cls || '') }, A.h('img', { class: 'px', src: 'img/' + PNG[name] + '.png', style: 'height:' + size + 'px;width:auto;max-width:' + Math.round(size * 1.3) + 'px;image-rendering:pixelated;vertical-align:middle' })) : A.h('span', { class: 'ic ' + (cls || ''), html: A.svg(A.ICONS[name] || name, size) });
  A.SPR = { oil: 'glass' };
  A.goodIcon = (id, size, cls) => A.h('span', { class: 'ic ' + (cls || ''), html: '<img class="px" width="' + (size || 18) + '" height="' + (size || 18) + '" src="img/' + (A.SPR[id] || id) + '.png" alt="" onerror="this.outerHTML=A.goodSvg(\'' + id + '\',' + (size || 18) + ')">' });
  A.fmt = (n) => Math.round(n).toLocaleString(A.lang === 'tr' ? 'tr-TR' : 'en-US');
  A.name = (o) => (o.n ? o.n[A.lang] || o.n.en : o.name || '');
})(typeof globalThis !== 'undefined' ? globalThis : window);

/* Argosy – static game data (goods, ports, ship types, coastline). No DOM access here. */
(function (G) {
  const A = (G.A = G.A || {});

  // Icon paths are 24x24, stroke-only, shared by DOM (SVG) and canvas (Path2D).
  A.GOODS = [
    { id: 'wheat', base: 18, n: { en: 'Wheat', tr: 'Buğday' }, d: 'M12 21V6M12 9c-2-1-3-3-3-5 2 0 3 2 3 5zM12 9c2-1 3-3 3-5-2 0-3 2-3 5zM12 14c-2-1-3-3-3-5M12 14c2-1 3-3 3-5' },
    { id: 'oil', base: 31, n: { en: 'Olive oil', tr: 'Zeytinyağı' }, d: 'M10 3h4v3l2 3v11a1 1 0 01-1 1H9a1 1 0 01-1-1V9l2-3zM8 13h8' },
    { id: 'wine', base: 44, n: { en: 'Wine', tr: 'Şarap' }, d: 'M7 3h10l-1 7a4 4 0 01-8 0zM12 14v6M8 21h8' },
    { id: 'salt', base: 12, n: { en: 'Salt', tr: 'Tuz' }, d: 'M5 8l7-4 7 4v8l-7 4-7-4zM5 8l7 4 7-4M12 12v8' },
    { id: 'fish', base: 9, n: { en: 'Fish', tr: 'Balık' }, d: 'M3 12c3-4 8-5 12-2l5-3v10l-5-3c-4 3-9 2-12-2zM8 11h.01' },
    { id: 'timber', base: 27, n: { en: 'Timber', tr: 'Kereste' }, d: 'M4 16a3 3 0 106 0 3 3 0 10-6 0M14 16a3 3 0 106 0 3 3 0 10-6 0M9 9a3 3 0 106 0 3 3 0 10-6 0' },
    { id: 'iron', base: 58, n: { en: 'Iron', tr: 'Demir' }, d: 'M3 8h14c0 3-2 4-5 4v3h4v3H8v-3h4v-3C8 12 6 11 3 8z' },
    { id: 'marble', base: 73, n: { en: 'Marble', tr: 'Mermer' }, d: 'M4 10l4-4h12v8l-4 4H4zM4 10h12v8M16 10l4-4' },
    { id: 'wool', base: 36, n: { en: 'Wool', tr: 'Yün' }, d: 'M7 17a4 4 0 010-8 5 5 0 019-1 4 4 0 011 9z' },
    { id: 'cloth', base: 64, n: { en: 'Cloth', tr: 'Kumaş' }, d: 'M4 6c4-2 6 2 10 0s4-1 6 0v12c-2-1-2-1-6 0s-6-2-10 0z' },
    { id: 'silk', base: 142, n: { en: 'Silk', tr: 'İpek' }, d: 'M7 12a5 8 0 1010 0 5 8 0 10-10 0M7 9c3 1 7 1 10 0M7 15c3-1 7-1 10 0' },
    { id: 'spice', base: 86, n: { en: 'Spice', tr: 'Baharat' }, d: 'M9 4h6M8 7h8l2 12a1 1 0 01-1 1H7a1 1 0 01-1-1zM9 12h6' },
    { id: 'glass', base: 97, n: { en: 'Glass', tr: 'Cam' }, d: 'M9 3h6M10 3v4c-3 2-4 5-4 8a6 6 0 0012 0c0-3-1-6-4-8V3' },
    { id: 'gems', base: 310, n: { en: 'Gems', tr: 'Mücevher' }, d: 'M6 4h12l3 5-9 11L3 9zM3 9h18M9 4l-2 5 5 11 5-11-2-5' },
  ];

  A.GOODS.sort((a, b) => a.base - b.base); // cheapest first, everywhere

  A.ICONS = {
    anchor: 'M12 3a2 2 0 100 4 2 2 0 000-4zM12 7v14M7 11h10M5 15c0 3 3 6 7 6s7-3 7-6',
    skull: 'M12 3c-4 0-7 3-7 7 0 2 1 3 2 4v3h10v-3c1-1 2-2 2-4 0-4-3-7-7-7zM9 11h.01M15 11h.01M10 17v3M14 17v3M12 14v1',
    market: 'M4 9l8-5 8 5v2H4zM6 11v8M12 11v8M18 11v8M4 20h16',
    compass: 'M3 12a9 9 0 1018 0 9 9 0 10-18 0M15.5 8.5l-2 5-5 2 2-5z',
    ship: 'M3 15h18l-3 5H6zM12 3v12M12 4l6 8h-6M12 6l-5 7h5',
    scroll: 'M6 4h11a2 2 0 012 2v12H8a2 2 0 01-2-2zM6 4a2 2 0 00-2 2v1h2M10 9h6M10 13h6',
    menu: 'M4 7h16M4 12h16M4 17h16',
    star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
    coin: 'M3 12a9 9 0 1018 0 9 9 0 10-18 0M9.5 9.5h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4',
    wind: 'M3 8h11a3 3 0 10-3-3M3 12h15a3 3 0 11-3 3M3 16h7',
    shield: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z',
    cannon: 'M3 14h11l3-3 4 2-1 3-3 1-3-2H3zM6 17a2 2 0 100 4 2 2 0 000-4z',
    crew: 'M12 4a3 3 0 100 6 3 3 0 000-6zM5 20c0-4 3-6 7-6s7 2 7 6',
    hammer: 'M14 4l6 6-3 3-6-6zM12 9L4 17l3 3 8-8',
    heart: 'M12 20s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.500-7 10-7 10z',
  };

  A.SHIPS = {
    felucca: { n: { en: 'Felucca', tr: 'Feluka' }, cap: 24, speed: 7.0, hull: 50, cannons: 2, crewMin: 5, crewMax: 10, cost: 900, windF: 1.0, masts: 1, len: 0.8 },
    caravel: { n: { en: 'Caravel', tr: 'Karavel' }, cap: 50, speed: 7.5, hull: 80, cannons: 6, crewMin: 12, crewMax: 22, cost: 3200, windF: 1.0, masts: 2, len: 0.95 },
    galley: { n: { en: 'Galley', tr: 'Kadırga' }, cap: 40, speed: 8.0, hull: 90, cannons: 10, crewMin: 30, crewMax: 50, cost: 4800, windF: 0.4, masts: 1, len: 1.15, oars: true },
    carrack: { n: { en: 'Carrack', tr: 'Nao' }, cap: 130, speed: 5.5, hull: 140, cannons: 14, crewMin: 28, crewMax: 45, cost: 8500, windF: 1.15, masts: 3, len: 1.1 },
    galleon: { n: { en: 'Galleon', tr: 'Galyon' }, cap: 95, speed: 6.5, hull: 180, cannons: 22, crewMin: 45, crewMax: 80, cost: 15500, windF: 1.1, masts: 3, len: 1.3 },
  };
  A.SHIP_ORDER = ['felucca', 'caravel', 'galley', 'carrack', 'galleon'];

  A.ESCORTS = {
    light: { id: 'light', n: { en: 'Light escort', tr: 'Hafif eskort' }, type: 'caravel', cannons: 3, hull: 60, crew: 12, exp: 3, speed: 7.5, cost: 300 },
    war: { id: 'war', n: { en: 'War galley', tr: 'Savaş kadırgası' }, type: 'galley', cannons: 8, hull: 95, crew: 32, exp: 4, speed: 8.0, cost: 950 },
  };

  A.SHIP_NAMES = ['Santa Lucia', 'Stella Maris', 'Aurora', 'La Sirena', 'San Marco', 'Fortuna', 'Delfino', 'Tramontana', 'Il Leone', 'Gabbiano', 'Zephyr', 'Alcyone', 'Meltem', 'Bora', 'Sirocco', 'Levante'];
  A.PIRATE_NAMES = ['Black Gull', 'Red Corsair', 'Sea Wolf', 'Barbary Rose', 'Night Heron', 'Sable Fox', 'Iron Tide', 'Crimson Crab'];

  A.C = {
    MAX_FLEET: 5, START_GOLD: 1200, NM_PER_KNOT_DAY: 19.2, SAVE_KEY: 'argosy_save_v2', LANG_KEY: 'argosy_lang',
    UPKEEP_PER_CREW: 0.35, REPAIR_PER_HULL: 2.2, CREW_COST: 20, CANNON_COST: 140, INSURE_RATE: 0.04, INSURE_PAYOUT: 0.75,
    LON_MIN: -10, LON_MAX: 125, LAT_MIN: -9.5, LAT_MAX: 47.5, GRID: 0.25,
  };

})(typeof globalThis !== 'undefined' ? globalThis : window);

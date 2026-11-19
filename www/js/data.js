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

  // x/y reference in degrees. produces = cheap here, demands = expensive here.
  A.PORTS = [
    { id: 'venice', lon: 12.33, lat: 45.44, yard: true, n: { en: 'Venice', tr: 'Venedik' }, p: ['glass', 'salt', 'cloth'], d: ['spice', 'silk', 'gems'] },
    { id: 'genoa', lon: 8.93, lat: 44.41, yard: true, n: { en: 'Genoa', tr: 'Cenova' }, p: ['cloth', 'marble', 'iron'], d: ['wheat', 'wine', 'gems'] },
    { id: 'barcelona', lon: 2.17, lat: 41.38, yard: true, n: { en: 'Barcelona', tr: 'Barselona' }, p: ['wool', 'wine', 'iron'], d: ['spice', 'glass', 'silk'] },
    { id: 'valencia', lon: -0.37, lat: 39.46, n: { en: 'Valencia', tr: 'Valensiya' }, p: ['oil', 'wheat', 'fish'], d: ['cloth', 'iron', 'glass'] },
    { id: 'marseille', lon: 5.37, lat: 43.3, n: { en: 'Marseille', tr: 'Marsilya' }, p: ['wine', 'salt', 'oil'], d: ['iron', 'timber', 'spice'] },
    { id: 'naples', lon: 14.25, lat: 40.85, n: { en: 'Naples', tr: 'Napoli' }, p: ['wine', 'oil', 'wheat'], d: ['cloth', 'timber', 'iron'] },
    { id: 'palermo', lon: 13.36, lat: 38.13, yard: true, n: { en: 'Palermo', tr: 'Palermo' }, p: ['wheat', 'salt', 'fish'], d: ['glass', 'iron', 'cloth'] },
    { id: 'algiers', lon: 3.06, lat: 36.78, n: { en: 'Algiers', tr: 'Cezayir' }, p: ['wool', 'fish', 'oil'], d: ['cloth', 'timber', 'iron'] },
    { id: 'tunis', lon: 10.2, lat: 36.82, n: { en: 'Tunis', tr: 'Tunus' }, p: ['oil', 'wheat', 'wool'], d: ['cloth', 'glass', 'iron'] },
    { id: 'ragusa', lon: 18.09, lat: 42.65, n: { en: 'Ragusa', tr: 'Ragusa' }, p: ['timber', 'salt', 'fish'], d: ['cloth', 'glass', 'wine'] },
    { id: 'athens', lon: 23.65, lat: 37.94, n: { en: 'Athens', tr: 'Atina' }, p: ['marble', 'oil', 'wine'], d: ['wheat', 'iron', 'cloth'] },
    { id: 'candia', lon: 25.14, lat: 35.34, n: { en: 'Candia', tr: 'Kandiye' }, p: ['wine', 'oil', 'fish'], d: ['cloth', 'iron', 'timber'] },
    { id: 'rhodes', lon: 28.23, lat: 36.44, n: { en: 'Rhodes', tr: 'Rodos' }, p: ['fish', 'wine', 'salt'], d: ['timber', 'wheat', 'iron'] },
    { id: 'smyrna', lon: 27.14, lat: 38.42, n: { en: 'Smyrna', tr: 'İzmir' }, p: ['wool', 'cloth', 'oil'], d: ['iron', 'glass', 'timber'] },
    { id: 'constantinople', lon: 28.97, lat: 41.0, yard: true, n: { en: 'Constantinople', tr: 'İstanbul' }, p: ['silk', 'wheat', 'timber'], d: ['wine', 'wool', 'glass'] },
    { id: 'famagusta', lon: 33.95, lat: 35.12, n: { en: 'Famagusta', tr: 'Magosa' }, p: ['salt', 'wheat', 'wine'], d: ['cloth', 'timber', 'iron'] },
    { id: 'beirut', lon: 35.5, lat: 33.89, n: { en: 'Beirut', tr: 'Beyrut' }, p: ['silk', 'glass', 'spice'], d: ['wool', 'iron', 'wheat'] },
    { id: 'alexandria', lon: 29.92, lat: 31.2, yard: true, n: { en: 'Alexandria', tr: 'İskenderiye' }, p: ['wheat', 'spice', 'gems'], d: ['timber', 'wine', 'iron'] },
  ];

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
    MAX_FLEET: 5, START_GOLD: 1200, NM_PER_KNOT_DAY: 19.2, SAVE_KEY: 'argosy_save_v1', LANG_KEY: 'argosy_lang',
    UPKEEP_PER_CREW: 0.35, REPAIR_PER_HULL: 2.2, CREW_COST: 20, CANNON_COST: 140, INSURE_RATE: 0.04, INSURE_PAYOUT: 0.75,
    LON_MIN: -7, LON_MAX: 37.5, LAT_MIN: 29, LAT_MAX: 47.5, GRID: 0.2,
  };

  // ---- Coastline (hand-traced, simplified; lon/lat). Land polygons are closed implicitly. ----
  A.EURASIA = [
    [-7, 47.6], [-7, 37.2], [-6.3, 36.8], [-5.65, 36.0], [-5.35, 36.12], [-4.7, 36.5], [-4.4, 36.72], [-3.5, 36.72], [-2.5, 36.8], [-2.15, 36.72], [-1.6, 36.95], [-0.95, 37.55], [-0.7, 37.6], [-0.5, 38.3], [0.2, 38.7], [-0.2, 39.1], [-0.3, 39.5], [0.0, 39.95], [0.8, 40.7], [1.25, 41.1], [2.2, 41.4], [2.9, 41.75], [3.3, 42.3], [3.1, 42.8], [3.0, 43.1], [3.7, 43.4], [4.5, 43.5], [4.85, 43.4], [5.4, 43.28], [5.9, 43.1], [6.6, 43.1], [7.3, 43.7], [8.0, 43.85], [8.9, 44.4], [9.8, 44.1], [10.3, 43.55], [10.5, 42.95], [11.2, 42.4], [11.8, 42.1], [12.3, 41.75], [13.0, 41.3], [13.6, 41.2], [14.25, 40.85], [14.35, 40.6], [14.8, 40.65], [15.3, 40.0], [15.8, 39.8], [16.0, 39.35], [15.85, 38.6], [15.65, 38.1], [16.05, 37.93], [16.55, 38.7], [17.15, 39.1], [16.6, 39.7], [17.2, 40.45], [18.35, 39.8], [18.0, 40.65], [16.85, 41.1], [16.2, 41.9], [14.2, 42.45], [13.5, 43.6], [12.6, 44.1], [12.45, 44.95], [12.3, 45.4], [13.75, 45.65], [13.85, 44.85], [14.4, 45.3], [15.2, 44.1], [16.45, 43.5], [18.1, 42.65], [18.75, 42.4], [19.45, 41.3], [19.45, 40.45], [20.25, 39.5], [20.75, 38.95], [21.1, 38.4], [21.73, 38.24], [21.6, 37.25], [21.7, 36.8], [22.5, 36.4], [23.2, 36.45], [23.05, 37.0], [22.8, 37.55], [23.3, 37.65], [23.65, 37.93], [24.0, 37.65], [24.55, 38.0], [23.9, 38.9], [23.3, 39.2], [22.95, 39.35], [22.6, 40.0], [22.9, 40.6], [23.35, 40.25], [23.4, 39.95], [24.4, 40.15], [24.0, 40.7], [24.4, 40.93], [25.9, 40.85], [26.6, 40.45], [26.2, 40.05], [26.2, 39.9], [26.05, 39.5], [26.7, 39.3], [26.85, 39.07], [26.75, 38.65], [27.1, 38.4], [26.3, 38.3], [26.8, 38.2], [27.25, 37.85], [27.2, 37.4], [27.4, 37.0], [28.3, 36.8], [29.1, 36.6], [29.6, 36.2], [30.15, 36.3], [30.7, 36.85], [32.0, 36.5], [32.8, 36.05], [33.9, 36.2], [34.6, 36.8], [35.35, 36.55], [36.15, 36.7], [37.5, 36.7], [37.5, 47.6],
  ];
  A.AFRICA = [
    [-7, 29], [-7, 35.5], [-5.9, 35.8], [-5.3, 35.9], [-3.9, 35.25], [-2.95, 35.3], [-1.9, 35.1], [-0.7, 35.8], [0.1, 36.05], [1.4, 36.5], [2.4, 36.6], [3.06, 36.78], [4.5, 36.9], [5.1, 36.75], [6.0, 36.9], [6.9, 36.9], [8.0, 36.95], [9.0, 37.2], [9.85, 37.3], [10.3, 37.2], [11.0, 37.35], [11.05, 37.08], [10.6, 36.45], [10.65, 35.8], [10.8, 34.75], [10.1, 33.9], [10.8, 33.7], [11.5, 33.2], [12.5, 33.0], [13.2, 32.9], [14.2, 32.7], [15.1, 32.4], [16.0, 31.7], [16.6, 31.2], [17.5, 30.6], [18.5, 30.35], [19.6, 30.6], [20.1, 31.0], [20.07, 32.12], [20.6, 32.65], [21.5, 32.95], [22.65, 32.77], [23.6, 32.35], [23.97, 32.08], [25.15, 31.6], [27.0, 31.4], [28.0, 31.1], [29.0, 30.85], [29.9, 31.15], [30.4, 31.5], [31.2, 31.55], [31.8, 31.45], [32.3, 31.25], [34.2, 31.3], [34.65, 31.85], [35.0, 32.8], [35.2, 33.2], [35.5, 33.9], [35.95, 34.6], [35.9, 35.0], [35.75, 35.55], [35.9, 35.9], [36.2, 36.55], [37.5, 36.55], [37.5, 29],
  ];
  A.ISLANDS = [
    [[2.4, 39.55], [3.1, 39.95], [3.45, 39.7], [3.1, 39.3], [2.6, 39.35]], // Mallorca
    [[9.35, 43.0], [9.55, 42.4], [9.4, 41.4], [9.0, 41.4], [8.6, 41.9], [8.65, 42.55]], // Corsica
    [[9.3, 41.25], [9.8, 40.5], [9.65, 39.6], [9.2, 39.2], [8.5, 39.1], [8.4, 39.9], [8.2, 40.6], [8.5, 41.0]], // Sardinia
    [[12.45, 37.9], [12.6, 38.15], [13.4, 38.2], [15.65, 38.28], [15.1, 37.6], [15.3, 37.0], [15.0, 36.7], [14.3, 36.8], [13.0, 37.1], [12.5, 37.7]], // Sicily
    [[14.3, 35.85], [14.55, 35.97], [14.55, 35.8]], // Malta
    [[23.5, 35.6], [24.2, 35.55], [25.1, 35.4], [26.3, 35.3], [26.2, 35.0], [25.0, 34.95], [24.0, 35.2], [23.55, 35.3]], // Crete
    [[27.8, 36.35], [28.2, 36.45], [28.25, 36.1], [27.8, 36.0]], // Rhodes
    [[32.35, 34.95], [32.4, 35.15], [33.0, 35.35], [34.0, 35.6], [34.6, 35.7], [34.05, 35.05], [33.5, 34.95], [32.9, 34.65], [32.4, 34.7]], // Cyprus
    [[26.1, 39.2], [26.55, 39.3], [26.6, 39.05], [26.2, 38.95]], // Lesbos
    [[24.9, 37.3], [25.4, 37.2], [25.3, 36.8], [24.9, 36.9]], // Cyclades blob
  ];
  A.BLACK_SEA = [[29.1, 41.25], [29.6, 41.2], [30.25, 41.2], [31.8, 41.45], [33.75, 41.98], [35.15, 42.03], [36.3, 41.3], [37.6, 41.0], [37.6, 47.6], [31, 47.6], [30.7, 46.5], [29.7, 45.2], [28.65, 44.15], [27.9, 43.2], [27.5, 42.5], [28.0, 41.85]];
  A.CHANNELS = [{ w: 0.3, pts: [[25.9, 39.95], [26.3, 40.1], [26.8, 40.4], [27.6, 40.7], [28.4, 40.85], [29.0, 41.0], [29.1, 41.28]] }];
})(typeof globalThis !== 'undefined' ? globalThis : window);

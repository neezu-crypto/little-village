// 3-1/3-2 월드 레이아웃 — 구역 폭, 작업 오브젝트 위치, 주거지 고정 슬롯 20개.
(function (global) {
  var TILE_SIZE = 32;

  var ZONES = [
    { id: 'forest_edge', name: '숲 어귀', widthTiles: 20 },
    { id: 'farmland', name: '논밭', widthTiles: 30 },
    { id: 'square', name: '광장', widthTiles: 20 },
    { id: 'market', name: '상점가', widthTiles: 30 },
    { id: 'residential', name: '주거지', widthTiles: 100 },
    { id: 'hill', name: '언덕', widthTiles: 20 }
  ];

  var startTile = 0;
  ZONES.forEach(function (z) {
    z.startTile = startTile;
    z.startPx = startTile * TILE_SIZE;
    z.widthPx = z.widthTiles * TILE_SIZE;
    startTile += z.widthTiles;
  });
  var WORLD_WIDTH_TILES = startTile;

  function zoneById(id) {
    for (var i = 0; i < ZONES.length; i++) if (ZONES[i].id === id) return ZONES[i];
    return null;
  }

  function spreadPositionsInZone(zone, count) {
    var positions = [];
    var step = zone.widthPx / (count + 1);
    for (var i = 1; i <= count; i++) positions.push(zone.startPx + step * i);
    return positions;
  }

  // 3-1 작업 오브젝트 배치
  var farmland = zoneById('farmland');
  var square = zoneById('square');
  var market = zoneById('market');
  var forestEdge = zoneById('forest_edge');
  var hill = zoneById('hill');

  var OBJECTS = [];
  spreadPositionsInZone(farmland, 3).forEach(function (x) {
    OBJECTS.push({ type: 'field', x: x, label: '텃밭', minDuration: [30, 45] });
  });
  spreadPositionsInZone(square, 2).forEach(function (x) {
    OBJECTS.push({ type: 'well', x: x, label: '우물', minDuration: [10, 15] });
  });
  // 모닥불은 광장 정중앙 — 시대가 바뀌어도 철거되지 않는 유일한 영구 랜드마크(3-1).
  OBJECTS.push({ type: 'hearth', x: square.startPx + square.widthPx / 2, label: '모닥불', minDuration: [20, 30], permanent: true });
  spreadPositionsInZone(market, 2).forEach(function (x) {
    OBJECTS.push({ type: 'shop', x: x, label: '가게', minDuration: [60, 999] });
  });
  spreadPositionsInZone(forestEdge, 1).forEach(function (x) {
    OBJECTS.push({ type: 'bench', x: x, label: '벤치', minDuration: [5, 8] });
  });
  spreadPositionsInZone(hill, 1).forEach(function (x) {
    OBJECTS.push({ type: 'bench', x: x, label: '벤치', minDuration: [5, 8] });
  });

  // 3-2 주거지 고정 슬롯 20개, 5타일 간격
  var residential = zoneById('residential');
  var SLOT_COUNT = 20;
  var SLOT_PITCH_TILES = 5;
  var BUILDING_SLOTS = [];
  for (var s = 0; s < SLOT_COUNT; s++) {
    BUILDING_SLOTS.push({
      index: s,
      x: residential.startPx + s * SLOT_PITCH_TILES * TILE_SIZE + TILE_SIZE
    });
  }

  global.World = {
    TILE_SIZE: TILE_SIZE,
    ZONES: ZONES,
    WORLD_WIDTH_TILES: WORLD_WIDTH_TILES,
    WORLD_WIDTH_PX: WORLD_WIDTH_TILES * TILE_SIZE,
    OBJECTS: OBJECTS,
    BUILDING_SLOTS: BUILDING_SLOTS,
    zoneById: zoneById
  };
})(window);

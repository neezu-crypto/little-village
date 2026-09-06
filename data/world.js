// 3-1 월드 레이아웃 — 지금은 카메라 클램핑에 필요한 전체 폭만 정의.
// 구역/건물슬롯 상세는 4단계에서 이 파일을 확장한다.
(function (global) {
  var TILE_SIZE = 32;
  var WORLD_WIDTH_TILES = 220; // 3-1: 20+30+20+30+100+20

  global.World = {
    TILE_SIZE: TILE_SIZE,
    WORLD_WIDTH_TILES: WORLD_WIDTH_TILES,
    WORLD_WIDTH_PX: WORLD_WIDTH_TILES * TILE_SIZE
  };
})(window);

// 19장: 가축(마당)·차량(주차) 스프라이트 — buildingSprites.js와 같은 블록 방식.
(function (global) {
  function rect(ctx, gx, gy, gw, gh, color, cell, ox, oy) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(ox + gx * cell), Math.round(oy + gy * cell), Math.round(gw * cell), Math.round(gh * cell));
  }

  var LIVESTOCK_DRAW = {
    chicken: function (ctx, cell, ox, oy) {
      rect(ctx, 2, 3, 5, 4, '#E8DFC8', cell, ox, oy);
      rect(ctx, 6, 2, 2, 1, '#C93B3B', cell, ox, oy);
      rect(ctx, 7, 4, 1, 1, '#D4B96A', cell, ox, oy);
      rect(ctx, 2, 7, 1, 1, '#3A2E22', cell, ox, oy);
      rect(ctx, 5, 7, 1, 1, '#3A2E22', cell, ox, oy);
    },
    goat: function (ctx, cell, ox, oy) {
      rect(ctx, 1, 3, 7, 4, '#C9C2B0', cell, ox, oy);
      rect(ctx, 6, 1, 1, 2, '#6E6259', cell, ox, oy);
      rect(ctx, 7, 1, 1, 2, '#6E6259', cell, ox, oy);
      rect(ctx, 1, 7, 1, 2, '#4A4438', cell, ox, oy);
      rect(ctx, 6, 7, 1, 2, '#4A4438', cell, ox, oy);
    },
    cow: function (ctx, cell, ox, oy) {
      rect(ctx, 0, 3, 9, 5, '#EDEAE0', cell, ox, oy);
      rect(ctx, 1, 4, 2, 2, '#2B2823', cell, ox, oy);
      rect(ctx, 5, 5, 2, 2, '#2B2823', cell, ox, oy);
      rect(ctx, 0, 8, 1, 2, '#4A4438', cell, ox, oy);
      rect(ctx, 7, 8, 1, 2, '#4A4438', cell, ox, oy);
    }
  };

  function drawLivestock(ctx, cell, cx, groundY, type) {
    var fn = LIVESTOCK_DRAW[type];
    if (!fn) return;
    var gridW = 10, gridH = 10;
    fn(ctx, cell, cx - (gridW / 2) * cell, groundY - gridH * cell);
  }

  // 차량은 시대별 컨셉이 라벨 문자열로만 저장돼 있어(eras.js era.vehicle.label),
  // 모양 자체는 공통 카트/자동차 실루엣 하나로 통일하고 색만 시대 팔레트를 따른다.
  function drawVehicle(ctx, cell, cx, groundY, era) {
    var gridW = 14, gridH = 12;
    var ox = cx - (gridW / 2) * cell, oy = groundY - gridH * cell;
    var body = era.wallColor, wheel = '#241f19';
    rect(ctx, 1, gridH - 6, 12, 3, body, cell, ox, oy);
    rect(ctx, 3, gridH - 9, 8, 3, era.accentColor, cell, ox, oy); // 지붕/포인트
    rect(ctx, 2, gridH - 3, 2, 2, wheel, cell, ox, oy);
    rect(ctx, 9, gridH - 3, 2, 2, wheel, cell, ox, oy);
  }

  global.AssetSprites = { drawLivestock: drawLivestock, drawVehicle: drawVehicle };
})(window);

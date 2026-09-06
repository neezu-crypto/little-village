// 3-1 작업 오브젝트 — buildingSprites.js와 같은 블록형 픽셀아트 원칙(원/호 대신
// 사각형만 사용)으로 통일. 화면에서 회색 원(우물)·주황 점(모닥불)처럼 추상적으로
// 보이던 걸 실제 형태를 알아볼 수 있는 블록 구성으로 교체.
(function (global) {
  function shade(hex, amt) {
    var c = hex.replace('#', '');
    var num = parseInt(c, 16);
    var r = Math.min(255, Math.max(0, (num >> 16) + amt));
    var g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
    var b = Math.min(255, Math.max(0, (num & 0xff) + amt));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function rect(ctx, gx, gy, gw, gh, color, cell, ox, oy) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(ox + gx * cell), Math.round(oy + gy * cell), Math.round(gw * cell), Math.round(gh * cell));
  }

  function originFor(gridW, gridH, cell, cx, groundY) {
    return { x: cx - (gridW / 2) * cell, y: groundY - gridH * cell };
  }

  function drawField(ctx, cell, cx, groundY) {
    var gridW = 12, gridH = 6;
    var o = originFor(gridW, gridH, cell, cx, groundY);
    rect(ctx, 0, gridH - 2, gridW, 2, '#5a4530', cell, o.x, o.y);
    var tuftX = [1, 3.5, 6, 8.5, 10.5];
    var tuftH = [2, 3, 2.5, 3, 2];
    for (var i = 0; i < tuftX.length; i++) {
      rect(ctx, tuftX[i], gridH - 2 - tuftH[i], 1, tuftH[i], '#5c7a3f', cell, o.x, o.y);
      rect(ctx, tuftX[i], gridH - 2 - tuftH[i], 1, 1, '#7fae54', cell, o.x, o.y);
    }
  }

  function drawWell(ctx, cell, cx, groundY) {
    var gridW = 8, gridH = 10;
    var o = originFor(gridW, gridH, cell, cx, groundY);
    // 돌담 테두리
    rect(ctx, 1, gridH - 4, 6, 4, '#8c8677', cell, o.x, o.y);
    rect(ctx, 2, gridH - 3, 4, 3, '#4a4438', cell, o.x, o.y); // 안쪽 구멍
    // 기둥
    rect(ctx, 1, gridH - 9, 1, 5, '#6b4a2f', cell, o.x, o.y);
    rect(ctx, 6, gridH - 9, 1, 5, '#6b4a2f', cell, o.x, o.y);
    // 지붕(계단식)
    rect(ctx, 0, gridH - 10, 8, 1, '#4a3320', cell, o.x, o.y);
    rect(ctx, 1, gridH - 11, 6, 1, '#4a3320', cell, o.x, o.y);
    rect(ctx, 3, gridH - 12, 2, 1, '#4a3320', cell, o.x, o.y);
  }

  function drawHearth(ctx, cell, cx, groundY) {
    var gridW = 8, gridH = 8;
    var o = originFor(gridW, gridH, cell, cx, groundY);
    rect(ctx, 1, gridH - 2, 6, 1, '#4a3320', cell, o.x, o.y);
    rect(ctx, 2, gridH - 3, 4, 1, '#5a4028', cell, o.x, o.y);
    // 불꽃(위로 좁아짐)
    rect(ctx, 2, gridH - 6, 4, 2, '#E8763C', cell, o.x, o.y);
    rect(ctx, 3, gridH - 8, 2, 2, '#F2A65A', cell, o.x, o.y);
  }

  function drawShop(ctx, cell, cx, groundY, era) {
    var gridW = 12, gridH = 10;
    var o = originFor(gridW, gridH, cell, cx, groundY);
    rect(ctx, 1, gridH - 7, 10, 7, '#7a6248', cell, o.x, o.y);
    rect(ctx, 0, gridH - 9, 12, 2, era.accentColor, cell, o.x, o.y); // 차양(시대 포인트 컬러)
    rect(ctx, 5, gridH - 4, 2, 4, '#241f19', cell, o.x, o.y); // 문
    rect(ctx, 2, gridH - 6, 2, 2, era.accentColor, cell, o.x, o.y); // 창문
  }

  function drawBench(ctx, cell, cx, groundY) {
    var gridW = 8, gridH = 4;
    var o = originFor(gridW, gridH, cell, cx, groundY);
    rect(ctx, 0, gridH - 3, 8, 1, '#6E6259', cell, o.x, o.y);
    rect(ctx, 1, gridH - 2, 1, 2, '#4a4438', cell, o.x, o.y);
    rect(ctx, 6, gridH - 2, 1, 2, '#4a4438', cell, o.x, o.y);
  }

  global.ObjectSprites = {
    field: drawField,
    well: drawWell,
    hearth: drawHearth,
    shop: drawShop,
    bench: drawBench
  };
})(window);

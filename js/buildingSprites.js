// 4단계: 25-1/25-2/17-2 기준 건물 블록형 픽셀아트 — 스프라이트 프리뷰(9월 6일 작업)에서
// 검증된 사각형 블록 렌더링 방식을 실제 게임 좌표계에 맞게 이식.
(function (global) {
  var GRID_W = 16, GRID_H = 18;

  function shade(hex, amt) {
    var c = hex.replace('#', '');
    var num = parseInt(c, 16);
    var r = Math.min(255, Math.max(0, (num >> 16) + amt));
    var g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
    var b = Math.min(255, Math.max(0, (num & 0xff) + amt));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // gx/gy/gw/gh: 그리드 단위. originPxX/Y: 화면 픽셀 원점(그리드 (0,0) 위치).
  function rect(ctx, gx, gy, gw, gh, color, cell, originPxX, originPxY) {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(originPxX + gx * cell),
      Math.round(originPxY + gy * cell),
      Math.round(gw * cell),
      Math.round(gh * cell)
    );
  }

  function steppedTriangle(ctx, cx, topY, baseW, height, color, cell, ox, oy) {
    for (var row = 0; row < height; row++) {
      var w = Math.max(2, Math.round(((row + 1) / height) * baseW));
      var x = cx - Math.floor(w / 2);
      rect(ctx, x, topY + row, w, 1, color, cell, ox, oy);
    }
  }

  // 건물 그리드 중심이 (screenCenterX, groundScreenY)에 오도록 화면 픽셀 원점을 역산해 그린다.
  function draw(ctx, era, grade, cell, screenCenterX, groundScreenY) {
    var originPxX = screenCenterX - (GRID_W / 2) * cell;
    var originPxY = groundScreenY - GRID_H * cell;

    var bodyW = 8 + grade * 2, bodyH = 6 + grade;
    var startX = Math.floor((GRID_W - bodyW) / 2);
    var groundY = GRID_H - 2;
    var bodyTop = groundY - bodyH;
    var wallColor = grade === 0 ? shade(era.wallColor, -10) : era.wallColor;

    rect(ctx, 0, groundY, GRID_W, 2, '#33301f', cell, originPxX, originPxY);
    rect(ctx, 0, groundY, GRID_W, 1, '#3f4a35', cell, originPxX, originPxY);

    if (grade === 2) {
      for (var f = 0; f < startX - 1; f += 2) rect(ctx, f, groundY - 1, 1, 1, shade(era.wallColor, -20), cell, originPxX, originPxY);
      for (var f2 = startX + bodyW + 1; f2 < GRID_W; f2 += 2) rect(ctx, f2, groundY - 1, 1, 1, shade(era.wallColor, -20), cell, originPxX, originPxY);
    }

    rect(ctx, startX, bodyTop, bodyW, bodyH, wallColor, cell, originPxX, originPxY);
    rect(ctx, startX + Math.floor(bodyW / 2) - 1, groundY - 3, 2, 3, '#241f19', cell, originPxX, originPxY);

    var winCount = grade * 2;
    if (era.roofType !== 'flat-glass') {
      for (var w2 = 0; w2 < winCount; w2++) {
        var side = w2 % 2 === 0 ? -1 : 1;
        var rowIdx = Math.floor(w2 / 2);
        var wx = side < 0 ? startX + 1 : startX + bodyW - 2;
        var wy = bodyTop + 1 + rowIdx * 2;
        rect(ctx, wx, wy, 1, 1, era.accentColor, cell, originPxX, originPxY);
      }
    } else {
      var floors = grade + 1;
      for (var fl = 0; fl < floors; fl++) {
        for (var col = 1; col < bodyW - 1; col += 2) {
          var wy2 = bodyTop + 1 + fl * Math.floor((bodyH - 1) / floors);
          var isLit = (fl + col) % 3 !== 0;
          rect(ctx, startX + col, wy2, 1, 1, isLit ? era.accentColor : shade(era.wallColor, -25), cell, originPxX, originPxY);
        }
      }
    }

    var roofH = 3 + grade;
    var cx = startX + Math.floor(bodyW / 2);
    if (era.roofType === 'flat' || era.roofType === 'flat-glass') {
      rect(ctx, startX - 1, bodyTop - 2, bodyW + 2, 2, era.roofColor, cell, originPxX, originPxY);
    } else {
      var steepness = era.roofType === 'gable-steep' ? roofH + 2 : (era.roofType === 'gable-low' ? roofH - 1 : roofH);
      steppedTriangle(ctx, cx, bodyTop - steepness, bodyW + 2, steepness, era.roofColor, cell, originPxX, originPxY);
    }

    if (grade >= 1) {
      var ornY = era.roofType === 'flat' || era.roofType === 'flat-glass' ? bodyTop - 4 : bodyTop - roofH - 2;
      rect(ctx, cx + 2, ornY, 1, 2, shade(era.roofColor, -20), cell, originPxX, originPxY);
      rect(ctx, cx + 2, ornY - 1, 1, 1, era.accentColor, cell, originPxX, originPxY);
    }
  }

  // 빈 슬롯(3-2) — 잔디밭만 표시.
  function drawEmptyLot(ctx, cell, screenCenterX, groundScreenY) {
    var originPxX = screenCenterX - (GRID_W / 2) * cell;
    var originPxY = groundScreenY - GRID_H * cell;
    rect(ctx, 2, GRID_H - 2, GRID_W - 4, 2, '#3f4a35', cell, originPxX, originPxY);
  }

  global.BuildingSprites = { draw: draw, drawEmptyLot: drawEmptyLot, GRID_W: GRID_W, GRID_H: GRID_H };
})(window);

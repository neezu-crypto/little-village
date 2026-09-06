// 25-1 캐릭터 스펙(24×32px) — 그리드 12×16, 셀=2월드px. 성격별 외형 차이 없음(확정).
(function (global) {
  var GRID_W = 12, GRID_H = 16;
  var SKIN = '#E8B98C', SHIRT = '#7A8B99', PANTS = '#4A3B2E';

  function rect(ctx, gx, gy, gw, gh, color, cell, ox, oy) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(ox + gx * cell), Math.round(oy + gy * cell), Math.round(gw * cell), Math.round(gh * cell));
  }

  function draw(ctx, cell, screenCenterX, groundScreenY, facing) {
    var ox = screenCenterX - (GRID_W / 2) * cell;
    var oy = groundScreenY - GRID_H * cell;
    rect(ctx, 4, 1, 4, 4, SKIN, cell, ox, oy);
    rect(ctx, 2, 5, 1, 4, SKIN, cell, ox, oy);
    rect(ctx, 9, 5, 1, 4, SKIN, cell, ox, oy);
    rect(ctx, 3, 5, 6, 6, SHIRT, cell, ox, oy);
    rect(ctx, 3, 11, 3, 5, PANTS, cell, ox, oy);
    rect(ctx, 6, 11, 3, 5, PANTS, cell, ox, oy);
    // 진행 방향 표시(단순 명암) — 왼쪽으로 갈 땐 살짝 어둡게, 오른쪽은 원색.
    if (facing < 0) {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#000';
      ctx.fillRect(Math.round(ox), Math.round(oy), Math.round(GRID_W * cell), Math.round(GRID_H * cell));
      ctx.restore();
    }
  }

  global.CharacterSprites = { draw: draw, GRID_W: GRID_W, GRID_H: GRID_H, UNIT: 2 };
})(window);

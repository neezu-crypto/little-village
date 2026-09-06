// 25-1 캐릭터 스펙(24×32px) — 그리드 12×16, 셀=2월드px.
// 25-7: 시대별 패션 — 신규 이주민만 스폰 시점의 시대 스타일을 입고, 기존
// 주민은 시대가 바뀌어도 그대로(건물과 같은 원칙, 사람은 재건축이 없어서
// 평생 유지). 성격별 외형 차이는 없음(확정).
(function (global) {
  var GRID_W = 12, GRID_H = 16;
  var SKIN = '#E8B98C', PANTS = '#4A3B2E';

  var FASHION = {
    primitive: { shirt: '#8B6B4A', accessory: 'fur' },
    agrarian: { shirt: '#D9C9A8', accessory: null },
    ancient: { shirt: '#E8E4D8', accessory: 'belt-gold' },
    medieval: { shirt: '#8B4A3B', accessory: 'belt-dark' },
    industrial: { shirt: '#6E6259', accessory: 'hat' },
    modern: { shirt: null, accessory: null } // null = 개인별 랜덤 컬러(현대는 옷이 다양함)
  };
  var MODERN_COLORS = ['#D96B6B', '#6BA5D9', '#6BD9A0', '#D9C36B', '#B06BD9'];

  function rect(ctx, gx, gy, gw, gh, color, cell, ox, oy) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(ox + gx * cell), Math.round(oy + gy * cell), Math.round(gw * cell), Math.round(gh * cell));
  }

  function draw(ctx, cell, screenCenterX, groundScreenY, facing, fashionEraId, colorSeed) {
    var ox = screenCenterX - (GRID_W / 2) * cell;
    var oy = groundScreenY - GRID_H * cell;
    var fashion = FASHION[fashionEraId] || FASHION.agrarian;
    var shirtColor = fashion.shirt || MODERN_COLORS[(colorSeed || 0) % MODERN_COLORS.length];

    rect(ctx, 4, 1, 4, 4, SKIN, cell, ox, oy);
    rect(ctx, 2, 5, 1, 4, SKIN, cell, ox, oy);
    rect(ctx, 9, 5, 1, 4, SKIN, cell, ox, oy);
    rect(ctx, 3, 5, 6, 6, shirtColor, cell, ox, oy);
    rect(ctx, 3, 11, 3, 5, PANTS, cell, ox, oy);
    rect(ctx, 6, 11, 3, 5, PANTS, cell, ox, oy);

    switch (fashion.accessory) {
      case 'fur':
        rect(ctx, 2, 4, 1, 1, '#6B4A2F', cell, ox, oy);
        rect(ctx, 9, 4, 1, 1, '#6B4A2F', cell, ox, oy);
        break;
      case 'belt-gold':
        rect(ctx, 3, 9, 6, 1, '#D4B96A', cell, ox, oy);
        break;
      case 'belt-dark':
        rect(ctx, 3, 9, 6, 1, '#3A2E22', cell, ox, oy);
        break;
      case 'hat':
        rect(ctx, 3, 0, 6, 1, '#3A3A3A', cell, ox, oy);
        break;
    }

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

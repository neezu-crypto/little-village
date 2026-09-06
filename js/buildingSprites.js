// 4단계: 25-1/25-2/17-2 기준 건물 블록형 픽셀아트 — 스프라이트 프리뷰(9월 6일 작업)에서
// 검증된 사각형 블록 렌더링 방식을 실제 게임 좌표계에 맞게 이식.
// 25-6: 저녁·밤 창문 불빛(60~80% 랜덤 점등+깜빡임), 그레이드1+ 굴뚝 연기(현대는
// 안테나 깜빡임으로 대체), 작업 중 임시 증기. prefers-reduced-motion 존중.
(function (global) {
  var GRID_W = 16, GRID_H = 18;
  function reduceMotion() { return global.Settings ? global.Settings.getReducedMotion() : false; }

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

  // seed+index 조합의 결정적 0~1 의사난수 - 매 프레임 같은 창문이 같은 결과를 내야
  // "깜빡이는 창문 집합"이 프레임마다 안 바뀐다.
  function pseudoRandom(seed, index) {
    var x = Math.sin(seed * 1000 + index * 37.13) * 10000;
    return x - Math.floor(x);
  }

  function blinkAlpha(seed, index) {
    if (reduceMotion()) return 1;
    var phase = pseudoRandom(seed, index) * Math.PI * 2;
    return 0.65 + 0.35 * Math.sin(Date.now() / 1800 + phase);
  }

  // 건물 그리드 중심이 (screenCenterX, groundScreenY)에 오도록 화면 픽셀 원점을 역산해 그린다.
  // dynamic: { lightSeed, isWorking } - 25-6 동적 요소용(없으면 정적으로만 그림).
  function draw(ctx, era, grade, cell, screenCenterX, groundScreenY, dynamic) {
    dynamic = dynamic || {};
    var lightSeed = dynamic.lightSeed || 0;
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

    // 저녁·밤에만 불빛 점등(25-6) - 그 외 시간대엔 어두운 창문만.
    var phase = global.Time ? global.Time.getPhaseName() : 'day';
    var lightsOn = phase === 'evening' || phase === 'night';

    var winCount = grade * 2;
    if (era.roofType !== 'flat-glass') {
      for (var w2 = 0; w2 < winCount; w2++) {
        var side = w2 % 2 === 0 ? -1 : 1;
        var rowIdx = Math.floor(w2 / 2);
        var wx = side < 0 ? startX + 1 : startX + bodyW - 2;
        var wy = bodyTop + 1 + rowIdx * 2;
        var lit = lightsOn && pseudoRandom(lightSeed, w2) < 0.7; // 60~80% 중간값
        if (lit) {
          ctx.save();
          ctx.globalAlpha = blinkAlpha(lightSeed, w2);
          rect(ctx, wx, wy, 1, 1, era.accentColor, cell, originPxX, originPxY);
          ctx.restore();
        } else {
          rect(ctx, wx, wy, 1, 1, shade(era.wallColor, -25), cell, originPxX, originPxY);
        }
      }
    } else {
      var floors = grade + 1;
      var winIdx = 0;
      for (var fl = 0; fl < floors; fl++) {
        for (var col = 1; col < bodyW - 1; col += 2) {
          var wy2 = bodyTop + 1 + fl * Math.floor((bodyH - 1) / floors);
          var litGlass = lightsOn && pseudoRandom(lightSeed, winIdx) < 0.7;
          if (litGlass) {
            ctx.save();
            ctx.globalAlpha = blinkAlpha(lightSeed, winIdx);
            rect(ctx, startX + col, wy2, 1, 1, era.accentColor, cell, originPxX, originPxY);
            ctx.restore();
          } else {
            rect(ctx, startX + col, wy2, 1, 1, shade(era.wallColor, -25), cell, originPxX, originPxY);
          }
          winIdx++;
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
      var isModern = era.roofType === 'flat-glass';
      if (isModern) {
        // 현대: 연기 대신 안테나 끝이 깜빡임.
        ctx.save();
        ctx.globalAlpha = lightsOn ? blinkAlpha(lightSeed, 99) : 0.5;
        rect(ctx, cx + 2, ornY - 1, 1, 1, era.accentColor, cell, originPxX, originPxY);
        ctx.restore();
      } else {
        rect(ctx, cx + 2, ornY - 1, 1, 1, era.accentColor, cell, originPxX, originPxY);
        drawSmoke(ctx, era, cell, originPxX + (cx + 2.5) * cell, originPxY + (ornY - 1) * cell, lightSeed, dynamic.isWorking);
      }
    }
  }

  // 25-6 굴뚝 연기 — 시대별 차등(원시=항상, 근대=진하고 잦게, 그 외=약하게).
  // 작업 중 임시 증기는 지속 여부와 무관하게 살짝 더 자주 보이게 한다.
  var SMOKE_DENSITY = { primitive: 1.0, agrarian: 0.4, ancient: 0.4, medieval: 0.4, industrial: 0.8 };
  function drawSmoke(ctx, era, cell, px, py, seed, isWorking) {
    if (reduceMotion()) return;
    var density = (SMOKE_DENSITY[era.id] || 0.4) + (isWorking ? 0.2 : 0);
    var t = Date.now() / 1000;
    var puffCount = 3;
    for (var i = 0; i < puffCount; i++) {
      var localSeed = seed * 10 + i;
      var cycle = (t * 0.3 + pseudoRandom(localSeed, 0)) % 1;
      if (pseudoRandom(localSeed, 1) > density) continue; // 밀도 낮은 시대는 일부 퍼프 생략
      var riseY = -cycle * cell * 6;
      var driftX = Math.sin(cycle * Math.PI * 2 + localSeed) * cell * 1.5;
      var alpha = (1 - cycle) * 0.35;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = '#cfcabf';
      ctx.beginPath();
      ctx.arc(px + driftX, py + riseY, cell * (0.6 + cycle * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
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

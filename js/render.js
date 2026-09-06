// 4단계: 실제 월드 콘텐츠(구역/오브젝트/건물) 렌더링. 6-2 다수결 팔레트 사용.
(function (global) {
  var canvas = document.getElementById('worldCanvas');
  var ctx = canvas.getContext('2d');

  var pixelScale = 1;
  var GROUND_Y_RATIO = 0.78;
  var FONT_STACK = '-apple-system, BlinkMacSystemFont, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif'; // 25-3

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    pixelScale = Math.max(1, Math.floor(canvas.height / 320));
  }

  function visibleWorldWidth() {
    return canvas.width / pixelScale;
  }

  function worldToScreenX(worldX, cameraX) {
    return (worldX - cameraX) * pixelScale;
  }

  function groundScreenY() {
    return canvas.height * GROUND_Y_RATIO;
  }

  // 건물 그리드 1칸 = 몇 월드px인지(25-1 소형 건물 64px 기준 - 8칸*8px=64px).
  // pixelScale은 "월드px→화면px" 줌 배율이라 이것과는 별개 축이다 - 둘을 곱해야
  // 실제 화면 셀 크기가 나온다. (스크린샷 확인 후 발견 - 이전엔 pixelScale만
  // 셀 크기로 써서 건물이 16~18화면px짜리 점으로 찌그러져 있었다.)
  var WORLD_UNIT = 8;

  // 원경 언덕 실루엣(0.25배) — 지평선(땅 시작선)에 중심을 걸쳐서, 땅 채우기가
  // 아래쪽 절반을 자연스럽게 가려 "떠 있는 얼룩"이 아니라 능선처럼 보이게 한다.
  var FAR_LAYER = { depth: 0.25, color: 'rgba(20,18,14,0.22)', gap: 260, radius: 70 };

  function drawFarLayer(cameraX) {
    var w = visibleWorldWidth();
    var offset = (cameraX * FAR_LAYER.depth) % FAR_LAYER.gap;
    var y = groundScreenY();
    ctx.fillStyle = FAR_LAYER.color;
    for (var x = -offset - FAR_LAYER.gap; x < w + FAR_LAYER.gap; x += FAR_LAYER.gap) {
      ctx.beginPath();
      ctx.ellipse(x * pixelScale, y, FAR_LAYER.gap * 0.5 * pixelScale, FAR_LAYER.radius * pixelScale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawObject(obj, cameraX, era) {
    var sx = worldToScreenX(obj.x, cameraX);
    if (sx < -80 || sx > canvas.width + 80) return; // 화면 밖 컬링
    var gy = groundScreenY();
    var cell = pixelScale * WORLD_UNIT * 0.5; // 오브젝트는 건물보다 한 단계 작게
    var fn = global.ObjectSprites[obj.type];
    if (!fn) return;
    fn(ctx, cell, sx, gy, era);
  }

  function drawBuildings(cameraX) {
    var slots = global.World.BUILDING_SLOTS;
    var buildingsByIndex = {};
    global.Village.getBuildings().forEach(function (b) { buildingsByIndex[b.slotIndex] = b; });
    var gy = groundScreenY();
    var cell = pixelScale * WORLD_UNIT;

    slots.forEach(function (slot) {
      var sx = worldToScreenX(slot.x, cameraX);
      var margin = global.BuildingSprites.GRID_W * cell;
      if (sx < -margin || sx > canvas.width + margin) return;
      var b = buildingsByIndex[slot.index];
      if (b && b.occupied) {
        var era = global.ERAS.filter(function (e) { return e.id === b.builtEraId; })[0] || global.WorldState.currentEra;
        global.BuildingSprites.draw(ctx, era, b.gradeIndex, cell, sx, gy);
        drawHomeAssets(b, era, sx, gy);
      } else {
        global.BuildingSprites.drawEmptyLot(ctx, cell, sx, gy);
      }
    });
  }

  // 19장: 이 집에 사는 주민 중 가축/차량 보유자가 있으면 마당에 표시.
  // 차량은 소유자가 이동 중이 아닐 때만(19-2 "유휴 시 거주지 앞에 주차").
  function drawHomeAssets(b, era, sx, gy) {
    if (!global.Villagers) return;
    var residents = global.Villagers.getVillagers().filter(function (v) { return v.homeSlotIndex === b.slotIndex; });
    var assetCell = pixelScale * WORLD_UNIT * 0.5;
    var withLivestock = residents.filter(function (v) { return v.assets.livestock; })[0];
    if (withLivestock) {
      global.AssetSprites.drawLivestock(ctx, assetCell, sx - global.BuildingSprites.GRID_W * pixelScale * WORLD_UNIT * 0.35, gy, withLivestock.assets.livestock);
    }
    var withVehicle = residents.filter(function (v) { return v.assets.vehicle && v.state !== 'move'; })[0];
    if (withVehicle) {
      global.AssetSprites.drawVehicle(ctx, assetCell, sx + global.BuildingSprites.GRID_W * pixelScale * WORLD_UNIT * 0.35, gy, era);
    }
  }

  // 10장 감정 표시 — 교류>작업>욕구 우선순위, 욕구는 60 이상일 때만(60~79/80~100 2단계)
  var NEED_EMOJI = {
    hunger: ['🍞', '😋'],
    fatigue: ['😪', '😴'],
    loneliness: ['🥺', '💭'],
    vanity: ['✨', '😏']
  };

  function getIndicator(v) {
    if (v.state === 'social') return '💬';
    if (v.leaving) return '🧳'; // 16-2 떠날 준비/퇴장 중
    if (v.state === 'work') return '🔨';
    var needs = v.needs, maxKey = null, maxVal = 0;
    ['hunger', 'fatigue', 'loneliness', 'vanity'].forEach(function (k) {
      if (needs[k] > maxVal) { maxVal = needs[k]; maxKey = k; }
    });
    if (maxKey && maxVal >= 60) return NEED_EMOJI[maxKey][maxVal >= 80 ? 1 : 0];
    return null;
  }

  function drawVillagers(cameraX) {
    if (!global.Villagers) return;
    var cell = pixelScale * global.CharacterSprites.UNIT;
    var gy = groundScreenY();
    var headY = gy - global.CharacterSprites.GRID_H * cell;
    ctx.textAlign = 'center';
    global.Villagers.getVillagers().forEach(function (v) {
      var sx = worldToScreenX(v.x, cameraX);
      var margin = global.CharacterSprites.GRID_W * cell;
      if (sx < -margin || sx > canvas.width + margin) return;
      global.CharacterSprites.draw(ctx, cell, sx, gy, v.facing);

      var indicator = getIndicator(v);
      if (indicator) {
        ctx.font = Math.round(14 * pixelScale / 3) + 'px sans-serif';
        ctx.fillText(indicator, sx, headY - 4);
      }
      if (v.state === 'social' && v.speechText) {
        ctx.font = Math.round(11 * pixelScale / 3) + 'px ' + FONT_STACK;
        var textW = ctx.measureText(v.speechText).width;
        var boxY = headY - 24;
        ctx.fillStyle = 'rgba(20,18,14,0.75)';
        ctx.fillRect(sx - textW / 2 - 6, boxY - 14, textW + 12, 18);
        ctx.fillStyle = '#eee7d8';
        ctx.fillText(v.speechText, sx, boxY);
      }
    });
    ctx.textAlign = 'left';
  }

  function draw() {
    var paletteEra = (global.Village && global.Village.getMajorityEra()) || global.WorldState.currentEra;
    var cameraX = (global.Camera && global.Camera.x) || 0;
    var w = canvas.width, h = canvas.height;

    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, paletteEra.skyColor);
    grad.addColorStop(1, paletteEra.groundColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    drawFarLayer(cameraX);

    // 지면 — 팔레트 땅색을 그대로 써서 시대마다 달라지게(6-2)
    ctx.fillStyle = paletteEra.groundColor;
    ctx.fillRect(0, groundScreenY(), w, h - groundScreenY());

    global.World.OBJECTS.forEach(function (obj) { drawObject(obj, cameraX, paletteEra); });
    drawBuildings(cameraX);
    drawVillagers(cameraX);
  }

  window.addEventListener('resize', resize);
  resize();

  global.Render = {
    draw: draw,
    resize: resize,
    getPixelScale: function () { return pixelScale; },
    getVisibleWorldWidth: visibleWorldWidth,
    worldToScreenX: worldToScreenX,
    groundScreenY: groundScreenY,
    canvas: canvas,
    ctx: ctx
  };
})(window);

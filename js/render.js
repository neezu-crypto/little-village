// 4단계: 실제 월드 콘텐츠(구역/오브젝트/건물) 렌더링. 6-2 다수결 팔레트 사용.
(function (global) {
  var canvas = document.getElementById('worldCanvas');
  var ctx = canvas.getContext('2d');

  var pixelScale = 1;
  var GROUND_Y_RATIO = 0.78;

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
      } else {
        global.BuildingSprites.drawEmptyLot(ctx, cell, sx, gy);
      }
    });
  }

  function drawVillagers(cameraX) {
    if (!global.Villagers) return;
    var cell = pixelScale * global.CharacterSprites.UNIT;
    var gy = groundScreenY();
    global.Villagers.getVillagers().forEach(function (v) {
      var sx = worldToScreenX(v.x, cameraX);
      var margin = global.CharacterSprites.GRID_W * cell;
      if (sx < -margin || sx > canvas.width + margin) return;
      global.CharacterSprites.draw(ctx, cell, sx, gy, v.facing);
    });
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

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

  // 원경 실루엣(0.25배) — 장식용, 구역 콘텐츠와 무관.
  var FAR_LAYER = { depth: 0.25, color: 'rgba(255,255,255,0.10)', gap: 220, baseY: 0.4, radius: 40 };

  function drawFarLayer(cameraX) {
    var w = visibleWorldWidth();
    var offset = (cameraX * FAR_LAYER.depth) % FAR_LAYER.gap;
    var y = canvas.height * FAR_LAYER.baseY;
    ctx.fillStyle = FAR_LAYER.color;
    for (var x = -offset - FAR_LAYER.gap; x < w + FAR_LAYER.gap; x += FAR_LAYER.gap) {
      ctx.beginPath();
      ctx.ellipse(x * pixelScale, y, FAR_LAYER.gap * 0.4 * pixelScale, FAR_LAYER.radius * pixelScale * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawObject(obj, cameraX) {
    var sx = worldToScreenX(obj.x, cameraX);
    if (sx < -60 || sx > canvas.width + 60) return; // 화면 밖 컬링
    var gy = groundScreenY();
    var cell = pixelScale;
    ctx.save();
    switch (obj.type) {
      case 'field':
        ctx.fillStyle = '#5c7a3f';
        for (var r = 0; r < 3; r++) ctx.fillRect(sx - 5 * cell, gy - (r + 1) * cell * 1.5, 10 * cell, cell);
        break;
      case 'well':
        ctx.fillStyle = '#8c8677';
        ctx.beginPath();
        ctx.arc(sx, gy - 2 * cell, 4 * cell, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a4438';
        ctx.beginPath();
        ctx.arc(sx, gy - 2 * cell, 2 * cell, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'hearth':
        ctx.fillStyle = '#4a4438';
        ctx.fillRect(sx - 3 * cell, gy - cell, 6 * cell, cell);
        ctx.fillStyle = '#E8763C';
        ctx.beginPath();
        ctx.arc(sx, gy - 2.5 * cell, 2.5 * cell, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'shop':
        ctx.fillStyle = '#7a6248';
        ctx.fillRect(sx - 5 * cell, gy - 8 * cell, 10 * cell, 8 * cell);
        ctx.fillStyle = '#B89A5A';
        ctx.fillRect(sx - 6 * cell, gy - 9 * cell, 12 * cell, 2 * cell);
        break;
      case 'bench':
        ctx.fillStyle = '#6E6259';
        ctx.fillRect(sx - 3 * cell, gy - 1.5 * cell, 6 * cell, 1.5 * cell);
        break;
    }
    ctx.restore();
  }

  function drawBuildings(cameraX) {
    var slots = global.World.BUILDING_SLOTS;
    var buildingsByIndex = {};
    global.Village.getBuildings().forEach(function (b) { buildingsByIndex[b.slotIndex] = b; });
    var gy = groundScreenY();
    var cell = pixelScale;

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

    // 지면선
    ctx.fillStyle = '#3f4a35';
    ctx.fillRect(0, groundScreenY(), w, h - groundScreenY());

    global.World.OBJECTS.forEach(function (obj) { drawObject(obj, cameraX); });
    drawBuildings(cameraX);
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

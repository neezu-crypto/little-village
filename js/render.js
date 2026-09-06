// 2단계: 픽셀 배율 계산 + 패럴랙스 레이어(4장). 실제 건물/주민 렌더는 4~5단계.
(function (global) {
  var canvas = document.getElementById('worldCanvas');
  var ctx = canvas.getContext('2d');

  var pixelScale = 1;

  // 4장: 픽셀아트 유지를 위한 정수 배율 — 기준 논리 해상도(세로 320px 기준)에
  // 맞춰 화면이 커질수록 배율도 정수 단위로 커진다.
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    pixelScale = Math.max(1, Math.floor(canvas.height / 320));
  }

  function visibleWorldWidth() {
    return canvas.width / pixelScale;
  }

  // 3~4레이어 패럴랙스(4장) — 지금은 자리만 잡아둔 장식용 실루엣.
  // 실제 지형/건물 콘텐츠는 4단계(월드 레이아웃)에서 이 자리를 대체한다.
  var PARALLAX_LAYERS = [
    { depth: 0.25, color: 'rgba(255,255,255,0.10)', shapeH: 40, gap: 220, baseY: 0.35 },
    { depth: 0.6, color: 'rgba(0,0,0,0.18)', shapeH: 70, gap: 160, baseY: 0.55 }
  ];

  function drawParallaxLayer(layer, cameraX) {
    var w = visibleWorldWidth();
    var offset = (cameraX * layer.depth) % layer.gap;
    var startX = -offset - layer.gap;
    var y = canvas.height * layer.baseY;
    ctx.fillStyle = layer.color;
    for (var x = startX; x < w + layer.gap; x += layer.gap) {
      var sx = (x) * pixelScale;
      ctx.beginPath();
      ctx.ellipse(sx, y, layer.gap * 0.4 * pixelScale, layer.shapeH * pixelScale * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw() {
    var era = (global.WorldState && global.WorldState.currentEra) || global.ERAS[0];
    var cameraX = (global.Camera && global.Camera.x) || 0;
    var w = canvas.width, h = canvas.height;

    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, era.skyColor);
    grad.addColorStop(1, era.groundColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    PARALLAX_LAYERS.forEach(function (layer) {
      drawParallaxLayer(layer, cameraX);
    });
  }

  window.addEventListener('resize', resize);
  resize();

  global.Render = {
    draw: draw,
    resize: resize,
    getPixelScale: function () { return pixelScale; },
    getVisibleWorldWidth: visibleWorldWidth,
    canvas: canvas,
    ctx: ctx
  };
})(window);

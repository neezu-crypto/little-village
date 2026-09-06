// 1단계: 캔버스 세팅 + 최소한의 스모크 테스트 렌더(하늘/땅 배경).
// 카메라·패럴랙스·픽셀아트 스프라이트는 2단계에서 구현.
(function (global) {
  var canvas = document.getElementById('worldCanvas');
  var ctx = canvas.getContext('2d');

  var pixelScale = 1;

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    // 픽셀아트 유지를 위한 정수 배율 (4장) — 기준 논리 해상도 320px 높이 대비.
    pixelScale = Math.max(1, Math.floor((h * dpr) / 320));
  }

  function draw() {
    var era = (global.WorldState && global.WorldState.currentEra) || global.ERAS[0];
    var w = canvas.width, h = canvas.height;
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, era.skyColor);
    grad.addColorStop(1, era.groundColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  window.addEventListener('resize', resize);
  resize();

  global.Render = { draw: draw, getPixelScale: function () { return pixelScale; }, canvas: canvas, ctx: ctx };
})(window);

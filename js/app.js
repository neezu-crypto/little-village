// 2단계: delta-time 기반 메인 루프 — 카메라(키보드)·모바일(터치 관성) 갱신 후 렌더.
(function (global) {
  var WorldState = {
    currentEra: global.ERAS[0]
  };
  global.WorldState = WorldState;

  var lastTime = performance.now();

  function loop(now) {
    var deltaTime = Math.min(0.1, (now - lastTime) / 1000); // 탭 전환 후 급점프 방지
    lastTime = now;

    global.Camera.update(deltaTime);
    if (global.Mobile && global.Mobile.updateMomentum) global.Mobile.updateMomentum(deltaTime);
    global.Render.draw();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})(window);

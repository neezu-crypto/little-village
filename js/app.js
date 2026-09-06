// 1단계: 전역 상태 부트스트랩 + 렌더 루프 시작.
(function (global) {
  var WorldState = {
    currentEra: global.ERAS[0]
  };
  global.WorldState = WorldState;

  function loop() {
    global.Render.draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})(window);

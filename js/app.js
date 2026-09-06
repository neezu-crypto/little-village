// 3단계: 시간 시스템 + 자동저장을 메인 루프에 연결, 시작 시 기존 저장 불러오기.
(function (global) {
  var WorldState = { currentEra: global.ERAS[0] };
  global.WorldState = WorldState;

  var savedState = global.Save.loadSave();
  if (savedState) global.Save.applyState(savedState);

  function syncEra() {
    WorldState.currentEra = global.ERAS[global.Time.getCurrentEraIndex()];
  }
  syncEra();

  var lastTime = performance.now();

  function loop(now) {
    var deltaTime = Math.min(0.1, (now - lastTime) / 1000); // 탭 전환 후 급점프 방지
    lastTime = now;

    global.Camera.update(deltaTime);
    if (global.Mobile && global.Mobile.updateMomentum) global.Mobile.updateMomentum(deltaTime);
    global.Time.update(deltaTime);
    global.Save.update(deltaTime);
    syncEra();
    global.Render.draw();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})(window);

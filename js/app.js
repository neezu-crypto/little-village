// 4단계: Day0 스폰(6-3) — 저장 데이터가 없으면 새 마을을 시작하고 카메라를 주거지 중심에 둔다.
(function (global) {
  var WorldState = { currentEra: global.ERAS[0] };
  global.WorldState = WorldState;

  var savedState = global.Save.loadSave();
  if (savedState) {
    global.Save.applyState(savedState);
  } else {
    global.Village.initDay0();
    var residential = global.World.zoneById('residential');
    global.Camera.setX(residential.startPx + residential.widthPx / 2 - global.Render.getVisibleWorldWidth() / 2);
  }

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

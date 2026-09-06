// 5단계: 이름 목록 로드(21장) 이후 Day0 스폰, 메인 루프에 주민 AI 갱신 추가.
(function (global) {
  var WorldState = { currentEra: global.ERAS[0] };
  global.WorldState = WorldState;

  var savedState = global.Save.loadSave();

  function afterInit() {
    function syncEra() {
      WorldState.currentEra = global.ERAS[global.Time.getCurrentEraIndex()];
    }
    syncEra();

    var lastTime = performance.now();
    function loop(now) {
      var deltaTime = Math.min(0.1, (now - lastTime) / 1000); // 탭 전환 후 급점프 방지
      lastTime = now;

      // 배속은 시뮬레이션(시간/주민 AI)에만 곱한다 - 카메라 조작감과 자동저장
      // 주기(실제 10초)는 배속과 무관하게 실시간 그대로 유지.
      var simDeltaTime = deltaTime * global.GameSpeed.getMultiplier();

      global.Camera.update(deltaTime);
      if (global.Mobile && global.Mobile.updateMomentum) global.Mobile.updateMomentum(deltaTime);
      global.Time.update(simDeltaTime);
      global.Villagers.update(simDeltaTime);
      global.Save.update(deltaTime);
      syncEra();
      global.Render.draw();

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // applyState는 저장이 없거나 schemaVersion이 안 맞으면 false를 반환한다 -
  // 이 경우를 체크 안 하면(예전 버그) 구버전 저장을 조용히 무시한 채 Day0
  // 스폰도 안 돌아서 주민이 영영 0명으로 남는다.
  var restored = savedState && global.Save.applyState(savedState);

  if (restored) {
    global.Names.load(); // 이후 이사 등 신규 스폰을 대비해 조용히 로드만 해둠
    afterInit();
  } else {
    global.Names.load().then(function () {
      global.Village.initDay0();
      global.Villagers.initDay0();
      var residential = global.World.zoneById('residential');
      global.Camera.setX(residential.startPx + residential.widthPx / 2 - global.Render.getVisibleWorldWidth() / 2);
      afterInit();
    });
  }
})(window);

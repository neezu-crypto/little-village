// 2단계 (4-1): 모바일 자동 가로 전환 + 전체화면 + 터치 드래그.
// iOS Safari는 Screen Orientation lock() 미지원 — CSS 강제 회전을 항상 폴백으로 둔다.
(function (global) {
  var viewport = document.getElementById('viewport');
  var rotatePrompt = document.getElementById('rotatePrompt');
  var exitBtn = document.getElementById('exitFullscreenBtn');
  var canvas = document.getElementById('worldCanvas');

  function isMobile() {
    return window.matchMedia('(pointer: coarse)').matches &&
      Math.min(window.innerWidth, window.innerHeight) < 768;
  }

  function isPortrait() {
    return window.innerHeight > window.innerWidth;
  }

  var forcedLandscape = false;

  function applyCssForcedLandscape() {
    if (forcedLandscape) return;
    forcedLandscape = true;
    viewport.classList.add('forced-landscape');
    exitBtn.classList.remove('hidden');
    rotatePrompt.classList.add('hidden');
    if (global.Render) global.Render.resize && global.Render.resize();
  }

  function clearForcedLandscape() {
    forcedLandscape = false;
    viewport.classList.remove('forced-landscape');
  }

  function exitLandscapeMode() {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
    if (screen.orientation && screen.orientation.unlock) {
      try { screen.orientation.unlock(); } catch (e) {}
    }
    clearForcedLandscape();
    exitBtn.classList.add('hidden');
    updateOrientationUI();
  }

  function attemptLandscapeLock() {
    if (!isMobile() || !isPortrait()) return;
    var req = document.documentElement.requestFullscreen ? document.documentElement.requestFullscreen() : Promise.reject();
    req.then(function () {
      exitBtn.classList.remove('hidden');
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(applyCssForcedLandscape);
      } else {
        applyCssForcedLandscape();
      }
    }).catch(function () {
      // 전체화면 자체가 막힌 환경(iOS Safari 등) — CSS 강제 회전만이라도 적용.
      applyCssForcedLandscape();
    });
  }

  function updateOrientationUI() {
    if (!isMobile()) {
      rotatePrompt.classList.add('hidden');
      return;
    }
    if (isPortrait() && !forcedLandscape) {
      rotatePrompt.classList.remove('hidden');
    } else {
      rotatePrompt.classList.add('hidden');
    }
  }

  // 전체화면/orientation lock은 사용자 제스처 안에서만 허용되므로,
  // 모바일에서 처음 화면을 터치하는 순간에 걸어 사실상 "자동 진입"처럼 보이게 한다.
  function armFirstGesture() {
    if (!isMobile()) return;
    function handler() {
      attemptLandscapeLock();
      document.removeEventListener('touchend', handler);
      document.removeEventListener('click', handler);
    }
    document.addEventListener('touchend', handler, { once: true });
    document.addEventListener('click', handler, { once: true });
  }

  exitBtn.addEventListener('click', exitLandscapeMode);
  window.addEventListener('resize', updateOrientationUI);
  window.addEventListener('orientationchange', updateOrientationUI);

  armFirstGesture();
  updateOrientationUI();

  // ---------- 터치 드래그 스크롤 (관성 + 탭/드래그 구분) ----------
  var TAP_THRESHOLD = 8; // px
  var drag = null; // { lastX, lastT, totalMove }
  var velocity = 0;

  canvas.addEventListener('touchstart', function (e) {
    var t = e.touches[0];
    drag = { lastX: t.clientX, lastT: performance.now(), totalMove: 0, startX: t.clientX, startY: t.clientY };
    velocity = 0;
  }, { passive: true });

  canvas.addEventListener('touchmove', function (e) {
    if (!drag) return;
    var t = e.touches[0];
    var now = performance.now();
    var dx = t.clientX - drag.lastX;
    var dt = Math.max(1, now - drag.lastT) / 1000;
    var scale = (global.Render && global.Render.getPixelScale()) || 1;
    global.Camera.move(-dx / scale);
    velocity = (-dx / scale) / dt;
    drag.totalMove += Math.abs(dx) + Math.abs(t.clientY - drag.startY);
    drag.lastX = t.clientX;
    drag.lastT = now;
  }, { passive: true });

  canvas.addEventListener('touchend', function (e) {
    if (!drag) return;
    if (drag.totalMove < TAP_THRESHOLD) {
      var touch = e.changedTouches[0];
      canvas.dispatchEvent(new CustomEvent('villageTap', { detail: { x: touch.clientX, y: touch.clientY } }));
      velocity = 0;
    }
    drag = null;
  });

  function updateMomentum(deltaTime) {
    if (drag || Math.abs(velocity) < 1) {
      velocity = 0;
      return;
    }
    global.Camera.move(velocity * deltaTime);
    velocity *= Math.pow(0.92, deltaTime * 60); // 프레임 독립적인 감쇠
  }

  global.Mobile = {
    isMobile: isMobile,
    updateMomentum: updateMomentum,
    exitLandscapeMode: exitLandscapeMode
  };
})(window);

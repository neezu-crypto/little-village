// 2단계: 카메라 이동 — 키보드(A/D) + delta-time 기반, 마을 양 끝 클램프(4장).
// 터치 드래그는 mobile.js가 Camera.move()를 통해 이 모듈을 그대로 재사용한다.
(function (global) {
  var camera = { x: 0 };
  var KEY_SPEED = 240; // world px/sec — 문서에 없는 값, 임시 페이싱

  var held = { left: false, right: false };

  // 4장: e.key가 아닌 e.code 기준 — 한글 입력 상태에서도 정상 동작.
  window.addEventListener('keydown', function (e) {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') held.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') held.right = true;
  });
  window.addEventListener('keyup', function (e) {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') held.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') held.right = false;
  });
  window.addEventListener('blur', function () {
    held.left = false;
    held.right = false;
  });

  function clamp(x) {
    var world = global.World;
    if (!world || !global.Render) return Math.max(0, x);
    var maxX = Math.max(0, world.WORLD_WIDTH_PX - global.Render.getVisibleWorldWidth());
    return Math.min(maxX, Math.max(0, x));
  }

  function setX(x) {
    camera.x = clamp(x);
  }

  function move(deltaWorldPx) {
    setX(camera.x + deltaWorldPx);
  }

  function update(deltaTime) {
    var dir = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    if (dir !== 0) move(dir * KEY_SPEED * deltaTime);
  }

  global.Camera = camera;
  global.Camera.setX = setX;
  global.Camera.move = move;
  global.Camera.update = update;
})(window);

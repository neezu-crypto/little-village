// 21장: 주민 이름 = 스트리머 이름. streamer-life-game의 정적 파일 패턴 재사용 —
// 실시간 DB 요청 없이 레포에 커밋된 JSON만 fetch(같은 오리진, 서버 없음 원칙 유지).
(function (global) {
  var pool = [];
  var used = {};
  var FALLBACK = ['마을이', '보리', '아랑', '단비', '해든', '초록', '다온', '누리'];

  function load() {
    return fetch('data/streamer-names.json')
      .then(function (res) { return res.json(); })
      .then(function (list) {
        pool = list.map(function (e) { return e.name; }).filter(Boolean);
      })
      .catch(function (e) {
        console.error('이름 목록 로드 실패, 기본 이름 사용:', e);
        pool = FALLBACK.slice();
      });
  }

  // 마을 내 중복 이름 제외(21장)
  function pick() {
    var source = pool.length ? pool : FALLBACK;
    for (var attempt = 0; attempt < 30; attempt++) {
      var name = source[Math.floor(Math.random() * source.length)];
      if (!used[name]) {
        used[name] = true;
        return name;
      }
    }
    // 30번 시도해도 중복만 나오면(풀이 작을 때) 접미사로 구분
    var fallbackName = source[Math.floor(Math.random() * source.length)] + '·' + Math.floor(Math.random() * 1000);
    used[fallbackName] = true;
    return fallbackName;
  }

  function release(name) {
    delete used[name];
  }

  function markUsed(name) {
    used[name] = true;
  }

  global.Names = { load: load, pick: pick, release: release, markUsed: markUsed };
})(window);

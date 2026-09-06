// 10장 클릭 상세 패널 + 11장 발견 일지 등록. 데스크톱 click과 모바일
// villageTap(mobile.js) 둘 다 같은 hit-test 경로를 탄다.
(function (global) {
  var canvas = document.getElementById('worldCanvas');
  var panel = document.getElementById('villagerPanel');
  var journalPanel = document.getElementById('journalPanel');
  var journalList = document.getElementById('journalList');
  var journalBtn = document.getElementById('journalBtn');

  var PERSONALITY_LABEL = {};
  global.PERSONALITIES.forEach(function (p) { PERSONALITY_LABEL[p.id] = p.label; });

  function needPhrase(v) {
    var needs = v.needs, maxKey = null, maxVal = 0;
    ['hunger', 'fatigue', 'loneliness', 'vanity'].forEach(function (k) {
      if (needs[k] > maxVal) { maxVal = needs[k]; maxKey = k; }
    });
    if (!maxKey || maxVal < 60) return '평온해 보여요.';
    var severe = maxVal >= 80;
    var phrases = {
      hunger: severe ? '몹시 배고파 보여요.' : '조금 배고파 보여요.',
      fatigue: severe ? '몹시 지쳐 보여요.' : '조금 피곤해 보여요.',
      loneliness: severe ? '많이 외로워 보여요.' : '조금 외로워 보여요.',
      vanity: severe ? '한껏 뽐내고 싶어해요.' : '뭔가 뽐내고 싶어해요.'
    };
    return phrases[maxKey];
  }

  function statePhrase(v) {
    if (v.state === 'social') return '누군가와 대화하고 있어요.';
    if (v.state === 'work') return '무언가 작업하고 있어요.';
    if (v.state === 'move') return '어딘가로 이동하고 있어요.';
    return needPhrase(v);
  }

  function findVillagerAt(screenX, screenY) {
    var cell = global.Render.getPixelScale() * global.CharacterSprites.UNIT;
    var halfW = (global.CharacterSprites.GRID_W * cell) / 2;
    var gy = global.Render.groundScreenY();
    var top = gy - global.CharacterSprites.GRID_H * cell;
    if (screenY < top - 20 || screenY > gy + 10) return null;
    var candidates = global.Villagers.getVillagers();
    var best = null, bestDist = Infinity;
    candidates.forEach(function (v) {
      var sx = global.Render.worldToScreenX(v.x, global.Camera.x);
      var d = Math.abs(sx - screenX);
      if (d < halfW && d < bestDist) { bestDist = d; best = v; }
    });
    return best;
  }

  function showPanel(v, screenX, screenY) {
    global.Journal.discoverVillager(v);
    var closest = global.Relationships.closestPartner(v.id);
    var closestLine = '';
    if (closest) {
      var partner = global.Villagers.getVillagers().filter(function (o) { return o.id === closest.id; })[0];
      var label = global.Relationships.tierLabel(closest.value);
      if (partner && label) closestLine = '<div class="vp-row">가장 가까운 사이: ' + partner.name + '(' + label + ')</div>';
    }
    var assetLine = '';
    if (v.assets.livestock) assetLine += '<div class="vp-row">가축을 기르고 있어요</div>';
    if (v.assets.vehicle) assetLine += '<div class="vp-row">' + v.assets.vehicle + '을(를) 갖고 있어요</div>';
    panel.innerHTML =
      '<div class="vp-name">' + v.name + '</div>' +
      '<div class="vp-row">' + PERSONALITY_LABEL[v.personalityId] + '</div>' +
      '<div class="vp-row">' + statePhrase(v) + '</div>' +
      assetLine +
      closestLine;
    panel.classList.remove('hidden');
    var x = Math.min(window.innerWidth - 180, Math.max(8, screenX - 90));
    var y = Math.max(8, screenY - 120);
    panel.style.left = x + 'px';
    panel.style.top = y + 'px';
  }

  function hidePanel() {
    panel.classList.add('hidden');
  }

  function handleTapAt(screenX, screenY) {
    var v = findVillagerAt(screenX, screenY);
    if (v) {
      showPanel(v, screenX, screenY);
    } else {
      hidePanel();
    }
  }

  canvas.addEventListener('click', function (e) {
    handleTapAt(e.clientX, e.clientY);
  });
  canvas.addEventListener('villageTap', function (e) {
    handleTapAt(e.detail.x, e.detail.y);
  });

  // ---------- 11장 발견 일지 ----------
  function renderJournal() {
    var discovered = global.Journal.getDiscovered();
    var log = global.Journal.getWitnessedLog();
    var html = '<h3>주민 (' + discovered.length + ')</h3>';
    if (!discovered.length) {
      html += '<p class="journal-empty">아직 아무도 만나보지 않았어요.</p>';
    } else {
      html += discovered.map(function (d) {
        return '<div class="journal-entry"><b>' + d.name + '</b><span>' + PERSONALITY_LABEL[d.personalityId] + '</span></div>';
      }).join('');
    }
    html += '<h3>목격한 순간 (' + log.length + ')</h3>';
    if (!log.length) {
      html += '<p class="journal-empty">아직 목격한 대화가 없어요.</p>';
    } else {
      html += log.slice().reverse().slice(0, 30).map(function (e) {
        return '<div class="journal-line">' + e.line + '</div>';
      }).join('');
    }
    journalList.innerHTML = html;
  }

  journalBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    journalPanel.classList.toggle('open');
    if (journalPanel.classList.contains('open')) renderJournal();
  });

  // 패널이 열리면 그 패널(z-index가 더 높음)이 토글 버튼을 덮어버려서 버튼을
  // 다시 눌러 닫을 수 없었다 - 패널 바깥 아무 곳이나 클릭해도 닫히게 한다.
  document.addEventListener('click', function (e) {
    if (!journalPanel.classList.contains('open')) return;
    if (journalPanel.contains(e.target) || e.target === journalBtn) return;
    journalPanel.classList.remove('open');
  });

  global.Journal.onChange(function () {
    if (journalPanel.classList.contains('open')) renderJournal();
  });

  global.Interactions = { hidePanel: hidePanel };
})(window);

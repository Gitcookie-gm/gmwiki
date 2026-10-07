// 剧透遮蔽开关（旧版黑条，兼容保留）
(function () {
  function init() {
    var btn = document.querySelector('.spoiler-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var on = document.body.classList.toggle('reveal');
        btn.textContent = on ? '🔒 隐藏剧透' : '👁 显示剧透';
      });
    }
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains('spoiler')) {
        t.classList.toggle('revealed');
      }
    });
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

// 幕后（DM）口令门禁：口令 gmzx
(function () {
  function unlock(gate, content) {
    gate.style.display = 'none';
    if (content) content.classList.remove('locked');
  }
  function init() {
    var gate = document.getElementById('dm-gate');
    if (!gate) return;
    var content = document.getElementById('dm-content');
    var pass = document.getElementById('dm-pass');
    var enter = document.getElementById('dm-enter');
    var err = document.getElementById('dm-err');
    var PASS = 'gmzx';
    function tryUnlock() {
      if ((pass.value || '').trim() === PASS) {
        try { sessionStorage.setItem('dm_ok', '1'); } catch (e) {}
        unlock(gate, content);
      } else {
        err.textContent = '口令错误。该信息只能被幕后之人阅读。';
        pass.value = '';
        pass.focus();
      }
    }
    try {
      if (sessionStorage.getItem('dm_ok') === '1') { unlock(gate, content); return; }
    } catch (e) {}
    enter.addEventListener('click', tryUnlock);
    pass.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryUnlock(); });
    pass.focus();
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

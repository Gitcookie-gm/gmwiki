// 剧透遮蔽开关
(function () {
  function init() {
    var btn = document.querySelector('.spoiler-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var on = document.body.classList.toggle('reveal');
        btn.textContent = on ? '🔒 隐藏剧透' : '👁 显示剧透';
      });
    }
    // 点击单个被涂黑处也可单独揭示
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains('spoiler')) {
        t.classList.toggle('revealed');
        t.style.background = t.classList.contains('revealed') ? 'transparent' : '';
        t.style.color = t.classList.contains('revealed') ? 'var(--gold)' : '';
        t.style.boxShadow = t.classList.contains('revealed') ? 'none' : '';
      }
    });
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

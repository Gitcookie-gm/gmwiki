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
    var n = document.querySelector('.topnav.locked-nav');
    if (n) n.classList.remove('locked-nav');
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

// 侧栏目录：滚动高亮当前章节
(function () {
  function init() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.topnav .tnav'));
    if (!links.length) return;
    var map = {}, hs = [];
    links.forEach(function (a) {
      var id = decodeURIComponent((a.getAttribute('href') || '').slice(1));
      var el = document.getElementById(id);
      if (el) { map[id] = a; hs.push(el); }
    });
    function onScroll() {
      var y = window.scrollY + 130, cur = null;
      hs.forEach(function (el) { if (el.offsetTop <= y) cur = el.id; });
      links.forEach(function (a) { a.classList.remove('active'); });
      if (cur && map[cur]) map[cur].classList.add('active');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

/* ================= 首页全局搜索（简单搜索框：回车 / 按钮触发） ================= */
(function () {
  var form = document.getElementById('searchbar');
  if (!form) return;
  var input = document.getElementById('site-search');
  var box = document.getElementById('search-results');
  var IDX = window.LVW_INDEX || [];
  var TOP = { '契约': 1, '魔物': 1, '人物': 1, '国家': 1, '技能': 1 };
  var KINDW = { '契约': 1, '魔物': 1, '人物': 1, '国家': 1, '商品': 1, '等级': 1, '徽记': 1, '货源': 1, '技能': 1 };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[\s·、,，。！？!?.．:：;；"'“”‘’()（）\[\]【】-]+/g, '');
  }
  function score(q, t) {
    t = norm(t); q = norm(q);
    if (!q || !t) return -1;
    var i = t.indexOf(q);
    if (i === 0) return 1200 - t.length;
    if (i > 0) return 800 - i;
    var ti = 0, gaps = 0, last = -1;
    for (var k = 0; k < q.length; k++) {
      var p = t.indexOf(q.charAt(k), ti);
      if (p < 0) return -1;
      if (last >= 0) gaps += p - last - 1;
      last = p; ti = p + 1;
    }
    return 420 - gaps * 4 - (t.length - q.length);
  }
  function hl(text, q) {
    var qs = norm(q).split(''), ti = 0, hits = {}, t = String(text), low = t.toLowerCase();
    for (var k = 0; k < qs.length; k++) {
      var p = low.indexOf(qs[k], ti);
      if (p < 0) break;
      hits[p] = 1; ti = p + 1;
    }
    var out = '', i = 0;
    while (i < t.length) {
      if (hits[i]) { var j = i; while (hits[j]) j++; out += '<mark>' + esc(t.slice(i, j)) + '</mark>'; i = j; }
      else { out += esc(t.charAt(i)); i++; }
    }
    return out;
  }

  function run() {
    var q = input.value.trim();
    if (!q) {
      box.innerHTML = '<div class="sr-head">请输入关键词后再搜索。</div>';
      box.hidden = false; return;
    }
    var res = [];
    for (var i = 0; i < IDX.length; i++) {
      var e = IDX[i], s = score(q, e.t);
      if (s < 0) {
        var s2 = score(q, (e.s || '') + ' ' + (e.d || '') + ' ' + (KINDW[e.k] ? e.k : ''));
        if (s2 < 0) continue;
        s = s2 * 0.42;
      }
      if (TOP[e.k]) s += 30;
      res.push({ e: e, s: s });
    }
    res.sort(function (a, b) { return b.s - a.s; });
    var list = res.slice(0, 50);
    if (!list.length) {
      box.innerHTML = '<div class="sr-head">没有匹配「' + esc(q) + '」的条目，换个关键词试试。</div>';
      box.hidden = false; return;
    }
    box.innerHTML = '<div class="sr-head">共 ' + list.length + ' 条结果 · 关键词「' + esc(q) + '」</div>' +
      '<div class="sr-list">' + list.map(function (x) {
        var e = x.e, path = e.k + (e.s ? ' › ' + e.s : '');
        return '<a class="sr-item" href="' + e.p + (e.a ? '#' + e.a : '') + '">' +
          '<div class="sr-top"><span class="sr-kind">' + esc(e.k) + '</span>' +
          '<span class="sr-title">' + hl(e.t, q) + '</span></div>' +
          '<span class="sr-path">' + esc(path) + '</span>' +
          (e.d ? '<span class="sr-desc">' + hl(e.d, q) + '</span>' : '') + '</a>';
      }).join('') + '</div>';
    box.hidden = false;
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
})();


// 顶部导航栏高度测量（供侧栏粘性定位使用）
(function () {
  function sync() {
    var bar = document.querySelector('.topbar');
    if (!bar) return;
    document.documentElement.style.setProperty('--topbar-h', bar.offsetHeight + 'px');
  }
  sync();
  window.addEventListener('load', sync);
  window.addEventListener('resize', sync);
  window.addEventListener('orientationchange', sync);
})();

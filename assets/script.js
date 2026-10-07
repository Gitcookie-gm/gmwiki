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

// 侧栏目录：滚动高亮当前章节
(function () {
  function init() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
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

/* ================= 全站搜索（首页） ================= */
(function () {
  var input = document.getElementById('site-search');
  if (!input) return;
  var panel = document.getElementById('search-panel');
  var clearBtn = document.getElementById('search-clear');
  var IDX = window.LVW_INDEX || [];
  var HOT = ['契约', '魔物', '里斯特商会', '执契武装', '光幕', '珂莱迪亚', '品质', '徽记', '灵廊', '地域分级', '阿拉纳', '药'];
  var TOP = { '契约': 1, '魔物': 1, '人物': 1, '国家': 1 };
  var KINDW = { '契约': 1, '魔物': 1, '人物': 1, '国家': 1, '商品': 1, '等级': 1, '徽记': 1, '货源': 1 };
  var sel = -1, cur = [];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().replace(/[\s·、,，。！？!?.．:：;；"'“”‘’()（）\[\]【】-]+/g, ''); }

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
    var qs = norm(q).split(''), ti = 0, hits = {}, low = String(text).toLowerCase();
    for (var k = 0; k < qs.length; k++) {
      var p = low.indexOf(qs[k], ti);
      if (p < 0) break;
      hits[p] = 1; ti = p + 1;
    }
    var out = '', i = 0, t = String(text);
    while (i < t.length) {
      if (hits[i]) { var j = i; while (hits[j]) j++; out += '<mark>' + esc(t.slice(i, j)) + '</mark>'; i = j; }
      else { out += esc(t.charAt(i)); i++; }
    }
    return out;
  }

  function search(q) {
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
    return res.slice(0, 40);
  }

  function itemHTML(e, q) {
    var path = e.k + (e.s ? ' › ' + e.s : '');
    return '<a class="sr-item" href="' + e.p + (e.a ? '#' + e.a : '') + '">' +
      '<div class="sr-top"><span class="sr-kind">' + esc(e.k) + '</span>' +
      '<span class="sr-title">' + (q ? hl(e.t, q) : esc(e.t)) + '</span></div>' +
      '<span class="sr-path">' + esc(path) + '</span>' +
      (e.d ? '<span class="sr-desc">' + (q ? hl(e.d, q) : esc(e.d)) + '</span>' : '') + '</a>';
  }

  function render() {
    var q = input.value.trim();
    clearBtn.hidden = !q;
    if (!q) {
      panel.innerHTML = '<div class="sr-head">试试这些关键词</div><div class="sr-hots">' +
        HOT.map(function (h) { return '<span class="sr-hot">' + esc(h) + '</span>'; }).join('') + '</div>';
      panel.hidden = false; sel = -1; cur = []; return;
    }
    var list = search(q);
    cur = list;
    if (!list.length) {
      panel.innerHTML = '<div class="sr-head">没有匹配「' + esc(q) + '」的条目，换个关键词试试</div>';
      panel.hidden = false; sel = -1; return;
    }
    panel.innerHTML = '<div class="sr-head">找到 ' + list.length + ' 条 · 关键词「' + esc(q) + '」</div>' +
      list.map(function (x) { return itemHTML(x.e, q); }).join('');
    panel.hidden = false; sel = -1;
  }

  function move(step) {
    var items = panel.querySelectorAll('.sr-item');
    if (!items.length) return;
    if (sel >= 0 && items[sel]) items[sel].classList.remove('sel');
    sel = (sel + step + items.length) % items.length;
    items[sel].classList.add('sel');
    items[sel].scrollIntoView({ block: 'nearest' });
  }

  var timer = null;
  input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(render, 90); });
  input.addEventListener('focus', render);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { var it = panel.querySelectorAll('.sr-item'); if (it.length) { e.preventDefault(); it[sel < 0 ? 0 : sel].click(); } }
    else if (e.key === 'Escape') { input.value = ''; render(); input.blur(); }
  });
  clearBtn.addEventListener('click', function () { input.value = ''; input.focus(); render(); });
  panel.addEventListener('click', function (e) {
    var hot = e.target.closest('.sr-hot');
    if (hot) { input.value = hot.textContent; input.focus(); render(); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.searchbar')) panel.hidden = true;
  });
})();

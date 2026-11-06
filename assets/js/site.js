/* Small progressive enhancements. The site works fully without this file. */
(function () {
  var root = document.documentElement;
  root.classList.remove('no-js');

  // ?preview shows draft content (hidden on the live site)
  if (/[?&]preview\b/.test(location.search)) root.classList.add('preview');

  // header hairline once the page scrolls
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // reveal-on-scroll, once
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach(function (el) { io.observe(el); });
})();

/* case study: highlight the current act in the table of contents */
(function () {
  var links = document.querySelectorAll('.cs-toc a');
  if (!links.length || !('IntersectionObserver' in window)) return;
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) { a.removeAttribute('aria-current'); });
      var a = map[e.target.id]; if (a) a.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
})();

/* theme: system preference by default, the visitor's choice remembered */
(function () {
  var root = document.documentElement;
  var btn = document.querySelector('.theme-toggle');
  var meta = document.querySelector('meta[name="theme-color"]');
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function stored() { try { return localStorage.getItem('theme'); } catch (e) { return null; } }
  function apply(theme, fromToggle) {
    var was = root.getAttribute('data-theme');
    root.setAttribute('data-theme', theme);
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#1B1A18' : '#F4F1EB');
    if (btn) {
      btn.setAttribute('aria-pressed', String(theme === 'dark'));
      btn.setAttribute('title', theme === 'dark' ? 'Lights on' : 'Lights off');
    }
    if (was === 'dark' && theme === 'light' && fromToggle) {   // sunglasses back on
      root.classList.add('glasses-return');
      setTimeout(function () { root.classList.remove('glasses-return'); }, 900);
    }
  }
  apply(root.getAttribute('data-theme') || (mq.matches ? 'dark' : 'light'));
  if (btn) btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', next); } catch (e) {}
    apply(next, true);
  });
  var onSystem = function (e) { if (!stored()) apply(e.matches ? 'dark' : 'light', true); };
  if (mq.addEventListener) mq.addEventListener('change', onSystem); else if (mq.addListener) mq.addListener(onSystem);
})();

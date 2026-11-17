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

/* click-to-load embeds (e.g. Figma prototypes): nothing loads until asked */
(function () {
  document.querySelectorAll('[data-embed]').forEach(function (box) {
    var btn = box.querySelector('button');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = box.getAttribute('data-embed');
      f.title = box.getAttribute('data-embed-title') || 'Embedded content';
      f.setAttribute('allowfullscreen', '');
      box.classList.add('is-loaded');
      box.replaceChildren(f);
      f.focus();
    });
  });
})();

/* click-to-expand images in case studies; before/after pairs open together */
(function () {
  var imgs = document.querySelectorAll('.cs-figure img');
  if (!imgs.length || typeof HTMLDialogElement === 'undefined') return;
  var dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-label', 'Expanded image');
  dlg.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close">×</button><div class="lightbox-stage"></div><p class="lightbox-hint"></p>';
  document.body.appendChild(dlg);
  var stage = dlg.querySelector('.lightbox-stage'), hint = dlg.querySelector('.lightbox-hint');
  function setHint() { hint.textContent = dlg.classList.contains('is-zoomed') ? 'Click to fit · Esc to close' : 'Click image for full size · Esc to close'; }
  function close() { dlg.close(); }
  dlg.querySelector('.lightbox-close').addEventListener('click', close);
  dlg.addEventListener('click', function (e) {
    if (e.target.tagName === 'IMG') { dlg.classList.toggle('is-zoomed'); setHint(); return; }
    if (e.target === dlg || e.target === stage || e.target.classList.contains('lightbox-pair')) close();
  });
  dlg.addEventListener('close', function () { document.documentElement.classList.remove('has-lightbox'); stage.replaceChildren(); if (dlg._from) dlg._from.focus(); });
  function shot(img, label) {
    var fig = document.createElement('figure');
    if (label) { var t = document.createElement('figcaption'); t.textContent = label; fig.appendChild(t); }
    var i = document.createElement('img'); i.src = img.currentSrc || img.src; i.alt = img.alt; fig.appendChild(i);
    return fig;
  }
  imgs.forEach(function (img) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'zoomable';
    var pair = img.closest('.ba-pair');
    b.setAttribute('aria-label', pair ? 'Expand before and after' : 'Expand image: ' + (img.alt || ''));
    img.parentNode.insertBefore(b, img); b.appendChild(img);
    b.addEventListener('click', function () {
      stage.replaceChildren();
      if (pair) {
        var wrap = document.createElement('div'); wrap.className = 'lightbox-pair';
        pair.querySelectorAll('figure').forEach(function (f) {
          var t = f.querySelector('.ba-tag'); wrap.appendChild(shot(f.querySelector('img'), t ? t.textContent : ''));
        });
        var cap = pair.querySelector('.ba-cap');
        if (cap) { var p = document.createElement('p'); p.className = 'lightbox-cap'; p.innerHTML = cap.innerHTML; wrap.appendChild(p); }
        stage.appendChild(wrap);
      } else {
        stage.appendChild(shot(img, ''));
      }
      dlg.classList.remove('is-zoomed'); setHint(); dlg._from = b;
      document.documentElement.classList.add('has-lightbox');
      dlg.showModal(); stage.scrollTo(0, 0);
    });
  });
})();

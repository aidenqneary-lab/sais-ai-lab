/* ============================================================
   AI Club — shared site behaviour
   Loaded by every page. Vanilla JS, no dependencies, works from file://
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. Starscape — slowly drifting, twinkling stars behind everything
     --------------------------------------------------------- */
  function initStarscape() {
    var canvas = document.getElementById('starscape');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var stars = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      // Fewer stars on small screens keeps phones at a steady frame rate
      var count = w < 700 ? 90 : 180;
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.25 + 0.25,
          drift: (Math.random() - 0.5) * 0.055,
          driftY: (Math.random() - 0.5) * 0.035,
          base: Math.random() * 0.5 + 0.25,
          tSpeed: Math.random() * 0.018 + 0.004,
          tPhase: Math.random() * Math.PI * 2,
          hue: Math.random() > 0.78 ? (Math.random() > 0.5 ? '62,231,255' : '157,123,255') : '255,255,255'
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.tPhase += s.tSpeed;
        s.x += s.drift;
        s.y += s.driftY;
        if (s.x < -2) s.x = w + 2; else if (s.x > w + 2) s.x = -2;
        if (s.y < -2) s.y = h + 2; else if (s.y > h + 2) s.y = -2;

        var a = s.base + Math.sin(s.tPhase) * 0.3;
        if (a < 0.04) a = 0.04;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + s.hue + ',' + a.toFixed(3) + ')';
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    if (reduceMotion) {
      // Draw one static field instead of animating
      ctx.clearRect(0, 0, w, h);
      stars.forEach(function (s) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + s.hue + ',' + s.base.toFixed(3) + ')';
        ctx.fill();
      });
    } else {
      requestAnimationFrame(frame);
    }
  }

  /* ---------------------------------------------------------
     2. Navbar — pill transform on scroll + mobile drawer
     --------------------------------------------------------- */
  function initNav() {
    var nav = document.querySelector('.nav');
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (!nav) return;

    function onScroll() {
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      // Close the drawer after tapping any link
      links.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
          links.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Mark the current page's link as active
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').toLowerCase();
      if (href === here || (here === 'index.html' && href === 'index.html')) {
        if (href.indexOf('#') === -1) a.classList.add('active');
      }
    });
  }

  /* ---------------------------------------------------------
     3. Same-page anchor scrolling
     Done in JS (not `scroll-behavior: smooth`) because smooth scrolling
     in CSS would interfere with the hero's frame-accurate scroll mapping.
     --------------------------------------------------------- */
  function initAnchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href*="#"]') : null;
      if (!a) return;
      var href = a.getAttribute('href');
      var hash = href.substring(href.indexOf('#'));
      var path = href.substring(0, href.indexOf('#'));
      var here = location.pathname.split('/').pop() || 'index.html';

      // Only intercept links that point at a section on THIS page
      if (path && path !== here) return;
      if (hash.length < 2) return;
      var target = document.querySelector(hash);
      if (!target) return;

      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', hash);
    });

    // Honour a #hash arriving from another page.
    // Pages with a loader (the home page) handle this themselves once the
    // loader releases the scroll lock — doing it here too would land short.
    if (location.hash && !document.getElementById('loader')) {
      var t = document.querySelector(location.hash);
      if (t) {
        window.addEventListener('load', function () {
          setTimeout(function () {
            window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 90, behavior: 'auto' });
          }, 60);
        });
      }
    }
  }

  /* ---------------------------------------------------------
     4. Scroll progress bar
     --------------------------------------------------------- */
  function initProgress() {
    var bar = document.getElementById('scroll-progress');
    if (!bar) return;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = p.toFixed(2) + '%';
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ---------------------------------------------------------
     5. Reveal on scroll
     --------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(function () { entry.target.classList.add('in'); }, delay);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     6. Count-up numbers
     --------------------------------------------------------- */
  function initCountUp() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length || !('IntersectionObserver' in window)) {
      nums.forEach(function (el) { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        var target = parseFloat(el.dataset.count);
        var suffix = el.dataset.suffix || '';
        if (reduceMotion) { el.textContent = target + suffix; return; }
        var dur = 1600, start = null;
        setTimeout(function () {
          function step(ts) {
            if (start === null) start = ts;
            var t = Math.min((ts - start) / dur, 1);
            var eased = 1 - Math.pow(2, -10 * t);   // easeOutExpo
            if (t === 1) eased = 1;
            el.textContent = Math.round(target * eased) + suffix;
            if (t < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        }, i * 180);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     7. Typewriter helper (shared by the hero and the tagline)
     Types `text` into `el`, then calls done().
     --------------------------------------------------------- */
  function typewrite(el, text, speed, done) {
    if (reduceMotion) {
      el.textContent = text;
      if (done) done();
      return function () {};
    }
    var cancelled = false;
    var caret = document.createElement('i');
    caret.className = 'caret';
    el.textContent = '';
    el.appendChild(caret);
    var i = 0;
    (function tick() {
      if (cancelled) return;
      if (i <= text.length) {
        caret.remove();
        el.textContent = text.slice(0, i);
        el.appendChild(caret);
        i++;
        // Slight jitter makes the typing feel human rather than mechanical
        setTimeout(tick, speed + Math.random() * 26);
      } else {
        caret.classList.add('done');
        if (done) done();
      }
    })();
    // Returns a cancel handle so a caller can abort a run mid-type
    return function () { cancelled = true; };
  }
  window.SAIS = window.SAIS || {};
  window.SAIS.typewrite = typewrite;
  window.SAIS.reduceMotion = reduceMotion;

  /* ---------------------------------------------------------
     8. Standalone typewriter targets (e.g. the tagline)
     --------------------------------------------------------- */
  function initTaglineTypers() {
    var els = document.querySelectorAll('[data-typewriter]');
    if (!els.length) return;
    els.forEach(function (el) {
      var text = el.dataset.typewriter;
      if (!('IntersectionObserver' in window)) { el.textContent = text; return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          typewrite(entry.target, text, 26);
        });
      }, { threshold: 0.6 });
      io.observe(el);
    });
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  function boot() {
    initStarscape();
    initNav();
    initAnchors();
    initProgress();
    initReveal();
    initCountUp();
    initTaglineTypers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

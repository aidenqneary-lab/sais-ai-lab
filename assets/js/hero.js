/* ============================================================
   AI Club — hero scroll animation (home page only)

   Three layers share one sticky, fully transparent stage:
     1. #frameCanvas — the pre-extracted video frames, drawn by scroll
                       position, feathered at the edges by CSS mask
     2. #netCanvas   — a live, mouse-reactive neural constellation that
                       cross-fades in as the video's zoom completes
     3. text layers  — the opening slogan, then the typewriter lines

   Because the stage has no background of its own, the page background
   shows through everywhere — so the animation has no visible box or edge.
   ============================================================ */
(function () {
  'use strict';

  var section   = document.querySelector('.hero-scroll');
  var stage     = document.querySelector('.hero-stage');
  var frameCv   = document.getElementById('frameCanvas');
  var netCv     = document.getElementById('netCanvas');
  var slogan    = document.querySelector('.hero-slogan');
  var typedWrap = document.querySelector('.hero-typed');
  var hint      = document.querySelector('.scroll-hint');

  var loader    = document.getElementById('loader');
  if (!section || !frameCv || !netCv) return;

  var reduceMotion = (window.SAIS && window.SAIS.reduceMotion) || false;

  /* ---------- Scroll choreography (fractions of the hero section) ----------
     The frame sequence covers only the camera push-in, so the zoom gets the
     bulk of the scroll and stays cinematic. Everything after the hand-off is
     the live network, which leaves room for the typewriter lines to play out. */
  var FRAME_END   = 0.58;   // the zoom finishes here
  var SLOGAN_FROM = 0.04, SLOGAN_TO = 0.19;   // slogan fades out
  var NET_FROM    = 0.54, NET_TO    = 0.70;   // live network fades in
  var FRAME_FROM  = 0.60, FRAME_TO  = 0.74;   // video frames fade out
  var TYPE_START  = 0.70;   // typewriter sequence begins

  var TOTAL_FRAMES = 104;
  var FRAME_PATH   = 'assets/frames/frame_';

  var images = [];
  var loadedCount = 0;
  var currentFrame = -1;
  var ready = false;

  var fctx = frameCv.getContext('2d');
  var nctx = netCv.getContext('2d');
  var dpr  = Math.min(window.devicePixelRatio || 1, 2);
  var vw = 0, vh = 0;

  /* ---------- Helpers ---------- */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function ramp(p, from, to) { return clamp((p - from) / (to - from), 0, 1); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function pad(n) { return ('0000' + n).slice(-4); }

  /* ---------------------------------------------------------
     Canvas sizing (Retina-aware)
     --------------------------------------------------------- */
  function sizeCanvases() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    [frameCv, netCv].forEach(function (cv) {
      cv.width  = vw * dpr;
      cv.height = vh * dpr;
      cv.style.width  = vw + 'px';
      cv.style.height = vh + 'px';
    });
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    currentFrame = -1;          // force a redraw at the new size
    seedNetwork();
  }

  /* ---------------------------------------------------------
     Frame drawing

     Desktop: cover-fit, so the frame fills the viewport edge to edge.
     Narrow/portrait screens: start near contain-fit so the whole laptop
     is visible, then ease toward cover-fit as the camera pushes in — that
     way the network still fills the phone screen at the end.
     --------------------------------------------------------- */
  function drawFrame(idx, framePos) {
    var img = images[idx];
    if (!img || !img.complete || !img.naturalWidth) return;

    var iw = img.naturalWidth, ih = img.naturalHeight;
    var sCover   = Math.max(vw / iw, vh / ih);
    var sContain = Math.min(vw / iw, vh / ih);
    var s;

    if (vw / vh >= 1.2) {
      s = sCover;
    } else {
      var t = easeInOut(clamp(framePos * 1.15, 0, 1));
      var startS = sContain * 1.18;
      s = startS + (sCover - startS) * t;
    }

    var dw = iw * s, dh = ih * s;
    fctx.clearRect(0, 0, vw, vh);
    fctx.drawImage(img, (vw - dw) / 2, (vh - dh) / 2, dw, dh);
  }

  /* ---------------------------------------------------------
     Live neural constellation
     Nodes drift slowly, link to nearby neighbours, and react to the
     pointer: nearby nodes brighten and lines reach toward the cursor.
     --------------------------------------------------------- */
  var nodes = [];
  var LINK_DIST = 150;
  var MOUSE_DIST = 190;
  var mouse = { x: -9999, y: -9999, active: false };
  var netVisible = false;

  /* Halo sprites: the soft glow around each node is drawn once into an
     offscreen canvas per colour, then stamped with drawImage. Building a
     radial gradient per node per frame is the expensive way to do this. */
  var haloSprites = {};
  var HALO_PX = 64;

  function makeHalo(rgb) {
    var c = document.createElement('canvas');
    c.width = c.height = HALO_PX;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(HALO_PX / 2, HALO_PX / 2, 0, HALO_PX / 2, HALO_PX / 2, HALO_PX / 2);
    grad.addColorStop(0, 'rgba(' + rgb + ',0.55)');
    grad.addColorStop(0.4, 'rgba(' + rgb + ',0.16)');
    grad.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, HALO_PX, HALO_PX);
    return c;
  }

  function seedNetwork() {
    // Node count scales with screen size so phones stay smooth
    var count;
    if (vw < 520)       count = 34;
    else if (vw < 900)  count = 52;
    else                count = 76;

    LINK_DIST  = vw < 520 ? 118 : (vw < 900 ? 150 : 178);
    MOUSE_DIST = vw < 520 ? 130 : 195;

    haloSprites = {
      '62,231,255': makeHalo('62,231,255'),
      '157,123,255': makeHalo('157,123,255')
    };

    nodes = [];
    for (var i = 0; i < count; i++) {
      var violet = Math.random() > 0.62;
      nodes.push({
        x: Math.random() * vw,
        y: Math.random() * vh,
        vx: (Math.random() - 0.5) * 0.26,
        vy: (Math.random() - 0.5) * 0.26,
        r: Math.random() * 1.8 + 1.9,
        glow: 0,
        rgb: violet ? '157,123,255' : '62,231,255',
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.008
      });
    }
  }

  function drawNetwork() {
    nctx.clearRect(0, 0, vw, vh);

    var i, j, a, b, dx, dy, dist;

    // Links between neighbouring nodes
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = a.x - b.x; dy = a.y - b.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= LINK_DIST) continue;
        var alpha = (1 - dist / LINK_DIST) * 0.42;
        // Links near the cursor light up along with their nodes
        var boost = Math.max(a.glow, b.glow);
        alpha += boost * 0.4;
        nctx.beginPath();
        nctx.moveTo(a.x, a.y);
        nctx.lineTo(b.x, b.y);
        nctx.strokeStyle = 'rgba(150,205,255,' + alpha.toFixed(3) + ')';
        nctx.lineWidth = 0.7 + boost * 0.6;
        nctx.stroke();
      }
    }

    // Lines reaching from nearby nodes toward the cursor
    if (mouse.active) {
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        dx = a.x - mouse.x; dy = a.y - mouse.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= MOUSE_DIST) continue;
        var ma = (1 - dist / MOUSE_DIST) * 0.55;
        nctx.beginPath();
        nctx.moveTo(a.x, a.y);
        nctx.lineTo(mouse.x, mouse.y);
        nctx.strokeStyle = 'rgba(' + a.rgb + ',' + ma.toFixed(3) + ')';
        nctx.lineWidth = 0.9;
        nctx.stroke();
      }
    }

    // Nodes
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      var twinkle = 0.72 + Math.sin(a.pulse) * 0.24;
      var op = clamp(twinkle + a.glow * 0.8, 0, 1);
      var rad = a.r + a.glow * 2.4;

      // Soft halo — stamped from a pre-rendered sprite
      var sprite = haloSprites[a.rgb];
      if (sprite) {
        var hs = rad * 11;
        nctx.globalAlpha = op;
        nctx.drawImage(sprite, a.x - hs / 2, a.y - hs / 2, hs, hs);
        nctx.globalAlpha = 1;
      }

      // Core
      nctx.beginPath();
      nctx.arc(a.x, a.y, rad, 0, Math.PI * 2);
      nctx.fillStyle = 'rgba(' + a.rgb + ',' + op.toFixed(3) + ')';
      nctx.fill();
    }
  }

  function stepNetwork() {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;
      n.pulse += n.pulseSpeed;

      // Wrap softly around the edges
      if (n.x < -30) n.x = vw + 30; else if (n.x > vw + 30) n.x = -30;
      if (n.y < -30) n.y = vh + 30; else if (n.y > vh + 30) n.y = -30;

      // Ease the glow toward its target based on cursor proximity
      var target = 0;
      if (mouse.active) {
        var dx = n.x - mouse.x, dy = n.y - mouse.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < MOUSE_DIST) target = 1 - d / MOUSE_DIST;
      }
      n.glow += (target - n.glow) * 0.09;
    }
  }

  function netLoop() {
    if (netVisible) {
      if (!reduceMotion) stepNetwork();
      drawNetwork();
    }
    requestAnimationFrame(netLoop);
  }

  // Pointer tracking (desktop only — on touch the network just drifts)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('mousemove', function (e) {
      var rect = stage.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        mouse.x = x; mouse.y = y; mouse.active = true;
      } else {
        mouse.active = false;
      }
    }, { passive: true });
    window.addEventListener('mouseout', function () { mouse.active = false; });
  }

  /* ---------------------------------------------------------
     Typewriter sequence
     --------------------------------------------------------- */
  var LINES = [
    'Learn how to use A.I. to innovate and create',
    'Learn how to build A.I.',
    'Learn to use A.I. responsibly'
  ];
  var typedStarted = false;
  var typedTimers = [];
  var cancelActiveType = null;

  function runTypewriter() {
    if (!typedWrap) return;
    var els = typedWrap.querySelectorAll('.typed-line');
    els.forEach(function (el) { el.textContent = ''; });
    typedWrap.classList.add('on');

    var idx = 0;
    function next() {
      if (idx >= LINES.length || idx >= els.length) return;
      var el = els[idx];
      var text = LINES[idx];
      idx++;
      cancelActiveType = window.SAIS.typewrite(el, text, 34, function () {
        cancelActiveType = null;
        // Pause between lines so each one lands on its own
        typedTimers.push(setTimeout(next, 520));
      });
    }
    next();
  }

  function resetTypewriter() {
    typedTimers.forEach(clearTimeout);
    typedTimers = [];
    if (cancelActiveType) { cancelActiveType(); cancelActiveType = null; }
    typedStarted = false;
    if (typedWrap) {
      typedWrap.classList.remove('on');
      typedWrap.querySelectorAll('.typed-line').forEach(function (el) { el.textContent = ''; });
    }
  }

  /* ---------------------------------------------------------
     Scroll handling
     --------------------------------------------------------- */
  var progress = 0;
  var pending = false;

  function readScroll() {
    var rect = section.getBoundingClientRect();
    var total = section.offsetHeight - window.innerHeight;
    progress = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
    if (!pending) {
      pending = true;
      requestAnimationFrame(render);
    }
  }

  function render() {
    pending = false;
    if (!ready) return;

    var p = progress;

    // --- video frames ---
    var framePos = clamp(p / FRAME_END, 0, 1);
    var idx = Math.min(TOTAL_FRAMES - 1, Math.round(framePos * (TOTAL_FRAMES - 1)));
    if (idx !== currentFrame) {
      currentFrame = idx;
      drawFrame(idx, framePos);
    }

    // --- cross-fade: frames out, live network in ---
    var netOpacity   = ramp(p, NET_FROM, NET_TO);
    var frameOpacity = 1 - ramp(p, FRAME_FROM, FRAME_TO);
    netCv.style.opacity   = netOpacity.toFixed(3);
    frameCv.style.opacity = frameOpacity.toFixed(3);
    netVisible = netOpacity > 0.01;

    // --- opening slogan ---
    if (slogan) {
      var out = ramp(p, SLOGAN_FROM, SLOGAN_TO);
      slogan.style.opacity = (1 - out).toFixed(3);
      // Drift the slogan back slightly as the camera pushes in
      slogan.style.transform = 'scale(' + (1 + out * 0.13).toFixed(4) + ')';
    }

    // --- scroll hint ---
    if (hint) hint.style.opacity = (1 - ramp(p, 0.01, 0.07)).toFixed(3);

    // --- typewriter ---
    if (p >= TYPE_START && !typedStarted) {
      typedStarted = true;
      runTypewriter();
    } else if (p < 0.40 && typedStarted) {
      resetTypewriter();
    }
  }

  /* ---------------------------------------------------------
     Preload frames, then start
     --------------------------------------------------------- */
  function setLoaderProgress(pct) {
    if (!loader) return;
    var fill = loader.querySelector('.l-fill');
    var txt  = loader.querySelector('.l-pct');
    if (fill) fill.style.width = pct + '%';
    if (txt) txt.textContent = pct + '%';
  }

  function finishLoading() {
    if (ready) return;
    ready = true;
    if (loader) {
      setLoaderProgress(100);
      setTimeout(function () {
        loader.classList.add('hidden');
        document.body.style.overflow = '';
        // Scrolling was locked while loading, so an incoming #section link
        // couldn't take effect until now. Wait a frame for the unlocked
        // layout to settle before measuring, or the jump lands short.
        if (location.hash) {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              var t = document.querySelector(location.hash);
              if (t) window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - 90);
            });
          });
        }
      }, 320);
    }
    currentFrame = -1;
    readScroll();
    render();
  }

  function preload() {
    // The browser would otherwise restore the previous scroll offset after load,
    // dropping the visitor into the middle of the animation. The hero must always
    // start from the opening scene — unless we arrived on a #section link from
    // another page, in which case that section wins.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (!location.hash) window.scrollTo(0, 0);

    document.body.style.overflow = 'hidden';   // hold the page still while loading

    for (var i = 1; i <= TOTAL_FRAMES; i++) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = function () {
        loadedCount++;
        var pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
        setLoaderProgress(Math.min(pct, 99));
        // The first frame is enough to paint something immediately
        if (loadedCount === 1) { currentFrame = -1; render(); }
        if (loadedCount >= TOTAL_FRAMES) finishLoading();
      };
      img.src = FRAME_PATH + pad(i) + '.jpg';
      images.push(img);
    }

    // Safety net: never trap the visitor behind the loader
    setTimeout(finishLoading, 15000);
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  sizeCanvases();
  window.addEventListener('resize', function () {
    sizeCanvases();
    render();
  });
  window.addEventListener('scroll', readScroll, { passive: true });
  requestAnimationFrame(netLoop);
  preload();
})();

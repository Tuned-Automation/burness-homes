(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);
  history.scrollRestoration = 'manual';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var _heroTl = null;

  /* ═══════════════════════════════════════════════════
     UTILITIES
     ═══════════════════════════════════════════════════ */

  function killST() {
    ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
  }

  function killHero() {
    if (_heroTl) { _heroTl.kill(); _heroTl = null; }
  }

  function waitForImg(el, ms) {
    var img = el.querySelector('.hero-bg img');
    if (!img || img.complete) return Promise.resolve();
    return new Promise(function (resolve) {
      var fired = false;
      function done() { if (!fired) { fired = true; resolve(); } }
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
      setTimeout(done, ms || 2500);
    });
  }

  /* ═══════════════════════════════════════════════════
     NAV
     ═══════════════════════════════════════════════════ */

  var NAV = {
    home:    'test-home.html',
    about:   'test-about.html',
    contact: 'test-contact.html'
  };

  function syncNav(ns) {
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === NAV[ns]);
    });
  }

  function initNavScroll() {
    ScrollTrigger.create({
      start: 80,
      onUpdate: function (self) {
        var nav = document.querySelector('.nav');
        if (nav) nav.classList.toggle('scrolled', self.scroll() > 80);
      }
    });
  }

  /* ═══════════════════════════════════════════════════
     HERO: HOME  (full-bleed, zoom-in reveal)

     Execution order (bulletproof):
       1. gsap.set() every animated element to hidden state
       2. Build the timeline (fromTo immediateRender bakes in)
       3. gsap.set(container, autoAlpha:1) — LAST step
       4. Timeline delay → animations play

     Nothing is visible until step 3. By that point every
     element is already in its hidden "from" state.
     ═══════════════════════════════════════════════════ */

  function homeHero(c, trans) {
    var bg     = c.querySelector('.hero-bg');
    var ov     = c.querySelector('.hero-overlay');
    var titles = c.querySelectorAll('.hero-title-line span');
    var desc   = c.querySelector('.hero-desc');
    var btn    = c.querySelector('.hero-btn');
    var btnO   = c.querySelector('.hero-btn-outline');
    var dets   = c.querySelectorAll('.hero-detail');
    var stats  = c.querySelectorAll('.hero-stat');
    var hero   = c.querySelector('.hero');

    if (REDUCED) {
      gsap.set(c, { autoAlpha: 1 });
      gsap.set('.nav', { autoAlpha: 1, y: 0 });
      return;
    }

    /* ── 1. Hide every animated element ── */
    gsap.set(ov, { autoAlpha: 0 });
    if (titles.length) gsap.set(titles, { autoAlpha: 0, yPercent: 110 });
    if (desc) gsap.set(desc, { autoAlpha: 0, y: 25 });
    if (btn)  gsap.set(btn,  { autoAlpha: 0, y: 20 });
    if (btnO) gsap.set(btnO, { autoAlpha: 0, y: 20 });
    if (dets.length)  gsap.set(dets,  { autoAlpha: 0, y: 12 });
    if (stats.length) gsap.set(stats, { autoAlpha: 0, y: 20 });

    function afterHero() {
      document.body.style.overflow = '';
      _heroTl = null;
      ScrollTrigger.refresh();
      if (bg && hero) {
        gsap.to(bg, {
          yPercent: 18, ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
        });
      }
    }

    /* ── 2. Build timeline ── */
    _heroTl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: afterHero });

    if (!trans) {
      gsap.set(bg, { scale: 0.48, borderRadius: '16px', autoAlpha: 0 });
      gsap.set('.nav', { autoAlpha: 0, y: -20 });
      document.body.style.overflow = 'hidden';

      _heroTl.delay(0.25);
      _heroTl.to(titles, { autoAlpha: 1, yPercent: 0, duration: 1.0, ease: 'power4.out', stagger: 0.15 });
      _heroTl.to(bg, { autoAlpha: 1, duration: 0.6, ease: 'power2.out' }, '-=0.15');
      _heroTl.to(bg, {
        scale: 1, borderRadius: '0px', duration: 2.4, ease: 'power3.inOut',
        onComplete: function () { gsap.set(bg, { clearProps: 'scale,borderRadius' }); }
      }, '-=0.4');
      _heroTl.to(ov, { autoAlpha: 1, duration: 1.0, ease: 'power2.out' }, '-=1.2');
      _heroTl.to('.nav', { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.8');
    } else {
      gsap.set(bg, { clipPath: 'inset(12px round 28px)' });

      _heroTl.delay(0.1);
      _heroTl.to(bg, {
        clipPath: 'inset(0px round 0px)', duration: 1.0, ease: 'power3.inOut',
        onComplete: function () { gsap.set(bg, { clearProps: 'clipPath' }); }
      });
      _heroTl.to(ov, { autoAlpha: 1, duration: 0.8, ease: 'power2.out' }, '-=0.6');
      _heroTl.to(titles, { autoAlpha: 1, yPercent: 0, duration: 1.0, ease: 'power4.out', stagger: 0.15 }, '-=0.4');
    }

    if (desc) _heroTl.to(desc, { autoAlpha: 1, y: 0, duration: 0.8 }, '-=0.4');
    if (btn)  _heroTl.to(btn,  { autoAlpha: 1, y: 0, duration: 0.7 }, '-=0.5');
    if (btnO) _heroTl.to(btnO, { autoAlpha: 1, y: 0, duration: 0.7 }, '-=0.55');
    if (dets.length)  _heroTl.to(dets,  { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.6 }, '-=0.5');
    if (stats.length) _heroTl.to(stats, { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.6 }, '-=0.5');

    /* ── 3. Reveal container — everything above is already hidden ── */
    gsap.set(c, { autoAlpha: 1 });
  }

  /* ═══════════════════════════════════════════════════
     HERO: SUB-PAGE  (rounded container, eyebrow+title)
     Same bulletproof order: hide → build → reveal.
     ═══════════════════════════════════════════════════ */

  function subHero(c, trans) {
    var ov     = c.querySelector('.hero-overlay');
    var eye    = c.querySelector('.hero-eyebrow');
    var titles = c.querySelectorAll('.hero-title-line span');
    var ctas   = c.querySelector('.hero-ctas');
    var hint   = c.querySelector('.hero-scroll-hint');
    var stats  = c.querySelector('.hero-stats');
    var img    = c.querySelector('.hero-bg img');
    var hero   = c.querySelector('.hero');

    if (REDUCED) {
      gsap.set(c, { autoAlpha: 1 });
      gsap.set('.nav', { autoAlpha: 1, y: 0 });
      return;
    }

    /* ── 1. Hide every animated element ── */
    if (ov)    gsap.set(ov,    { autoAlpha: 0 });
    if (eye)   gsap.set(eye,   { autoAlpha: 0, y: 10 });
    if (titles.length) gsap.set(titles, { autoAlpha: 0, yPercent: 115 });
    if (ctas)  gsap.set(ctas,  { autoAlpha: 0, y: 25 });
    if (hint)  gsap.set(hint,  { autoAlpha: 0 });
    if (stats) gsap.set(stats, { autoAlpha: 0, x: 30 });

    if (!trans) {
      gsap.set('.nav', { autoAlpha: 0, y: -20 });
      document.body.style.overflow = 'hidden';
    }

    /* ── 2. Build timeline ── */
    _heroTl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      delay: trans ? 0.1 : 0.3,
      onComplete: function () {
        document.body.style.overflow = '';
        _heroTl = null;
        ScrollTrigger.refresh();
      }
    });

    if (ov)            _heroTl.to(ov,   { autoAlpha: 1, duration: 1, ease: 'power2.out' });
    if (eye)           _heroTl.to(eye,  { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.6');
    if (titles.length) _heroTl.to(titles, { autoAlpha: 1, yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.15 }, '-=0.4');
    if (!trans) _heroTl.to('.nav', { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.5');
    if (ctas)  _heroTl.to(ctas,  { autoAlpha: 1, y: 0, duration: 0.8 }, '-=0.3');
    if (stats) _heroTl.to(stats, { autoAlpha: 1, x: 0, duration: 0.7 }, '-=0.4');
    if (hint)  _heroTl.to(hint,  { autoAlpha: 1, duration: 0.5 }, '-=0.2');

    /* ── 3. Reveal container — everything above is already hidden ── */
    gsap.set(c, { autoAlpha: 1 });

    if (img && hero) {
      gsap.fromTo(img, { yPercent: -10 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      });
    }
  }

  /* ═══════════════════════════════════════════════════
     INIT & BARBA
     ═══════════════════════════════════════════════════ */

  function initPage(ns, container, trans) {
    window.scrollTo(0, 0);
    syncNav(ns);
    initNavScroll();
    if (ns === 'home') homeHero(container, trans);
    else subHero(container, trans);
  }

  barba.init({
    preventRunning: true,
    transitions: [{
      name: 'fade',

      once: function (data) {
        initPage(data.next.namespace, data.next.container, false);
      },

      leave: function (data) {
        killHero();
        killST();
        var nav = document.querySelector('.nav');
        if (nav) nav.classList.remove('scrolled');
        return gsap.to(data.current.container, {
          autoAlpha: 0, duration: 0.4, ease: 'power2.inOut'
        });
      },

      enter: function (data) {
        window.scrollTo(0, 0);
        return waitForImg(data.next.container, 2500).then(function () {
          initPage(data.next.namespace, data.next.container, true);
        });
      },

      after: function (data) {
        var m = (data.next.html || '').match(/<title[^>]*>([^<]+)<\/title>/i);
        if (m) document.title = m[1];
      }
    }]
  });

  /* ── Mobile menu (GSAP drawer + staggered items) ── */
  var _menuState = { open: false, tl: null, backdrop: null };

  function _ensureBackdrop() {
    if (_menuState.backdrop && document.body.contains(_menuState.backdrop)) {
      return _menuState.backdrop;
    }
    var bd = document.querySelector('.nav-backdrop');
    if (!bd) {
      bd = document.createElement('div');
      bd.className = 'nav-backdrop';
      bd.setAttribute('aria-hidden', 'true');
      document.body.appendChild(bd);
    }
    _menuState.backdrop = bd;
    return bd;
  }

  function openMenu() {
    if (_menuState.open) return;
    var links = document.querySelector('.nav-links');
    var toggle = document.querySelector('.nav-mobile-toggle');
    if (!links || !toggle) return;

    _menuState.open = true;
    if (_menuState.tl) _menuState.tl.kill();
    var backdrop = _ensureBackdrop();
    var items = links.querySelectorAll('li');

    links.classList.add('open');
    toggle.classList.add('open');
    backdrop.classList.add('open');
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');

    _menuState.tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      .set(links, { visibility: 'visible', x: 0, y: 0 })
      .fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' }, 0)
      .fromTo(links, { xPercent: 100 }, { xPercent: 0, duration: 0.7, ease: 'expo.out' }, 0)
      .fromTo(items, { x: 48, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.55, stagger: 0.07, ease: 'expo.out' }, 0.18);
  }

  function closeMenu(immediate) {
    if (!_menuState.open) return;
    var links = document.querySelector('.nav-links');
    var toggle = document.querySelector('.nav-mobile-toggle');
    if (!links || !toggle) return;

    _menuState.open = false;
    if (_menuState.tl) _menuState.tl.kill();
    var backdrop = _ensureBackdrop();
    var items = links.querySelectorAll('li');

    toggle.classList.remove('open');
    backdrop.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');

    function finalize() {
      links.classList.remove('open');
      document.body.classList.remove('nav-open');
      gsap.set(links, { visibility: 'hidden', x: 0, y: 0, xPercent: 100 });
      gsap.set(items, { clearProps: 'transform,opacity,visibility' });
    }

    if (immediate) { finalize(); return; }

    _menuState.tl = gsap.timeline({ defaults: { ease: 'power2.in' }, onComplete: finalize })
      .to(items, { x: 30, autoAlpha: 0, duration: 0.25, stagger: 0.025 }, 0)
      .to(links, { xPercent: 100, duration: 0.5, ease: 'power3.in' }, 0.05)
      .to(backdrop, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 0);
  }

  var _navToggle = document.querySelector('.nav-mobile-toggle');
  if (_navToggle) _navToggle.setAttribute('aria-expanded', 'false');

  document.addEventListener('click', function (e) {
    if (e.target.closest('.nav-mobile-toggle')) {
      if (_menuState.open) closeMenu(); else openMenu();
      return;
    }
    if (e.target.closest('.nav-links a')) {
      if (_menuState.open) closeMenu();
      return;
    }
    if (e.target.closest('.nav-backdrop')) {
      if (_menuState.open) closeMenu();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && _menuState.open) closeMenu();
  });

  window.addEventListener('resize', function () {
    if (_menuState.open && window.matchMedia('(min-width: 641px)').matches) {
      closeMenu(true);
    }
  });

})();

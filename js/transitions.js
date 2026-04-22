(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);
  history.scrollRestoration = 'manual';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Evaluated per-call so resizing between transitions respects the current viewport */
  function isDesktop() { return window.matchMedia('(min-width: 641px)').matches; }

  /* Inject barba wrapper CSS for sync transition positioning */
  var style = document.createElement('style');
  style.setAttribute('data-barba-style', 'global');
  style.textContent = '[data-barba="wrapper"]{position:relative;overflow:hidden}';
  document.head.appendChild(style);

  /* ╔══════════════════════════════════════════════════════════════╗
     ║  NAV HELPERS                                                ║
     ╚══════════════════════════════════════════════════════════════╝ */

  var NAV_HREF_MAP = {
    home:     'index.html',
    about:    'about.html',
    builds:   'projects.html',
    project:  'projects.html',
    services: 'services.html',
    contact:  'contact.html'
  };

  function updateActiveNav(namespace) {
    var links = document.querySelectorAll('.nav-links a');
    links.forEach(function (a) {
      a.classList.remove('active');
      var href = a.getAttribute('href');
      if (NAV_HREF_MAP[namespace] && href === NAV_HREF_MAP[namespace]) {
        a.classList.add('active');
      }
    });
  }

  function initNavScrollState() {
    ScrollTrigger.create({
      start: 80,
      onUpdate: function (self) {
        var nav = document.querySelector('.nav');
        if (nav) nav.classList.toggle('scrolled', self.scroll() > 80);
      }
    });
  }

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

  function openMobileMenu() {
    if (_menuState.open) return;
    var links  = document.querySelector('.nav-links');
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
      .fromTo(backdrop,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.35, ease: 'power2.out' }, 0)
      .fromTo(links,
        { xPercent: 100 },
        { xPercent: 0, duration: 0.7, ease: 'expo.out' }, 0)
      .fromTo(items,
        { x: 48, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.55, stagger: 0.07, ease: 'expo.out' },
        0.18);
  }

  function closeMobileMenu(immediate) {
    if (!_menuState.open) return;
    var links  = document.querySelector('.nav-links');
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

    _menuState.tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: finalize
    })
      .to(items, { x: 30, autoAlpha: 0, duration: 0.25, stagger: 0.025 }, 0)
      .to(links, { xPercent: 100, duration: 0.5, ease: 'power3.in' }, 0.05)
      .to(backdrop, { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 0);
  }

  function initMobileMenu() {
    var toggle = document.querySelector('.nav-mobile-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');

    document.addEventListener('click', function (e) {
      if (e.target.closest('.nav-mobile-toggle')) {
        if (_menuState.open) closeMobileMenu(); else openMobileMenu();
        return;
      }
      if (e.target.closest('.nav-links a')) {
        if (_menuState.open) closeMobileMenu();
        return;
      }
      if (e.target.closest('.nav-backdrop')) {
        if (_menuState.open) closeMobileMenu();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _menuState.open) closeMobileMenu();
    });

    window.addEventListener('resize', function () {
      if (_menuState.open && window.matchMedia('(min-width: 641px)').matches) {
        closeMobileMenu(true);
      }
    });
  }

  function killScrollTriggers() {
    ScrollTrigger.getAll().forEach(function (st) { st.kill(); });
  }

  /* Shared promise so leave + enter can coordinate on the same image */
  var _nextHeroImageReady = null;

  /**
   * Returns a Promise that resolves once the hero background image inside
   * `container` has finished loading (or immediately if already cached).
   * A timeout guarantees the transition is never blocked indefinitely.
   */
  function waitForHeroImage(container, timeoutMs) {
    var img = container.querySelector('.hero-bg img');
    if (!img || img.complete) return Promise.resolve();
    return new Promise(function (resolve) {
      var resolved = false;
      function done() {
        if (resolved) return;
        resolved = true;
        resolve();
      }
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
      setTimeout(done, timeoutMs || 3000);
    });
  }

  /* ╔══════════════════════════════════════════════════════════════╗
     ║  HERO ENTRANCE — SUB-PAGES                                 ║
     ╚══════════════════════════════════════════════════════════════╝ */

  function initSubpageHero(container, isTransition) {
    if (prefersReduced) return null;

    var overlay    = container.querySelector('.hero-overlay');
    var eyebrow    = container.querySelector('.hero-eyebrow');
    var breadcrumb = container.querySelector('.hero-breadcrumb');
    var titleLines = container.querySelectorAll('.hero-title-line span');
    var ctas       = container.querySelector('.hero-ctas');
    var scrollHint = container.querySelector('.hero-scroll-hint');
    var stats      = container.querySelector('.hero-stats');
    var hero       = container.querySelector('.hero');
    var heroImg    = container.querySelector('.hero-bg img');

    if (!hero) return null;

    if (overlay)    gsap.set(overlay,    { opacity: 0 });
    if (eyebrow)    gsap.set(eyebrow,    { autoAlpha: 0, y: 10 });
    if (breadcrumb) gsap.set(breadcrumb, { autoAlpha: 0, y: 10 });
    if (ctas)       gsap.set(ctas,       { autoAlpha: 0, y: 25 });
    if (scrollHint) gsap.set(scrollHint, { autoAlpha: 0 });
    if (stats)      gsap.set(stats,      { autoAlpha: 0, x: 30 });

    var heroContent = container.querySelector('.hero-content');
    if (heroContent) gsap.set(heroContent, { autoAlpha: 1 });

    if (!isTransition) {
      gsap.set('.nav', { autoAlpha: 0, y: -20 });
      document.body.style.overflow = 'hidden';
      window.addEventListener('error', function () {
        document.body.style.overflow = '';
      }, { once: true, capture: true });
    }

    var tl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      delay: isTransition ? 0.1 : 0.3,
      onComplete: function () {
        if (!isTransition) document.body.style.overflow = '';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { ScrollTrigger.refresh(); });
        });
      }
    });

    if (overlay)    tl.to(overlay, { opacity: 1, duration: 1, ease: 'power2.out' });
    if (breadcrumb) tl.to(breadcrumb, { autoAlpha: 1, y: 0, duration: 0.5 }, '-=0.7');
    if (eyebrow)    tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.6');
    if (titleLines.length) tl.fromTo(titleLines, { yPercent: 115 }, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.15 }, '-=0.4');
    if (!isTransition) tl.to('.nav', { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.5');
    if (ctas)       tl.to(ctas, { autoAlpha: 1, y: 0, duration: 0.8 }, '-=0.3');
    if (stats)      tl.to(stats, { autoAlpha: 1, x: 0, duration: 0.7 }, '-=0.4');
    if (scrollHint) tl.to(scrollHint, { autoAlpha: 1, duration: 0.5 }, '-=0.2');

    if (heroImg && isDesktop()) {
      gsap.fromTo(heroImg, { yPercent: -10 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    return tl;
  }

  /* ╔══════════════════════════════════════════════════════════════╗
     ║  HERO ENTRANCE — HOME (zoom-in reveal)                     ║
     ╚══════════════════════════════════════════════════════════════╝ */

  function initHomeHero(container, isTransition) {
    if (prefersReduced) return null;

    var heroBg      = container.querySelector('.hero-bg');
    var overlay     = container.querySelector('.hero-overlay');
    var titleLines  = container.querySelectorAll('.hero-title-line span');
    var desc        = container.querySelector('.hero-desc');
    var btn         = container.querySelector('.hero-btn');
    var btnOutline  = container.querySelector('.hero-btn-outline');
    var details     = container.querySelectorAll('.hero-detail');
    var stats       = container.querySelectorAll('.hero-stat');
    var hero        = container.querySelector('.hero');

    if (!hero) return null;

    /* Sub-page → Home: expanding hero animation.
       The hero image starts clipped to match the sub-page hero shape
       (rounded rectangle inset 12px) and expands to full-bleed. */
    if (isTransition) {
      if (heroBg)     gsap.set(heroBg,     { clipPath: 'inset(12px round 28px)' });
      if (overlay)    gsap.set(overlay,    { opacity: 0 });
      if (desc)       gsap.set(desc,       { y: 25, autoAlpha: 0 });
      if (btn)        gsap.set(btn,        { y: 20, autoAlpha: 0 });
      if (btnOutline) gsap.set(btnOutline, { y: 20, autoAlpha: 0 });
      if (details.length) gsap.set(details, { y: 12, autoAlpha: 0 });
      if (stats.length)   gsap.set(stats,   { y: 20, autoAlpha: 0 });

      var heroContent = container.querySelector('.hero-content');
      var ctasWrap = container.querySelector('.hero-ctas');
      var statsWrap = container.querySelector('.hero-stats');
      if (heroContent) gsap.set(heroContent, { autoAlpha: 1 });
      if (ctasWrap) gsap.set(ctasWrap, { autoAlpha: 1 });
      if (statsWrap) gsap.set(statsWrap, { autoAlpha: 1 });

      var tlT = gsap.timeline({
        defaults: { ease: 'expo.out' },
        delay: 0.1,
        onComplete: function () {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              ScrollTrigger.refresh();
              if (heroBg && isDesktop()) {
                gsap.to(heroBg, {
                  yPercent: 18, ease: 'none',
                  scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
                });
              }
            });
          });
        }
      });

      if (heroBg) {
        tlT.to(heroBg, {
          clipPath: 'inset(0px round 0px)',
          duration: 1.0,
          ease: 'power3.inOut',
          onComplete: function () { gsap.set(heroBg, { clearProps: 'clipPath' }); }
        });
      }
      if (overlay)    tlT.to(overlay, { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.6');
      if (titleLines.length) tlT.fromTo(titleLines, { yPercent: 110 }, { yPercent: 0, duration: 1.0, ease: 'power4.out', stagger: 0.15 }, '-=0.4');
      if (desc)       tlT.to(desc,       { y: 0, autoAlpha: 1, duration: 0.8 }, '-=0.4');
      if (btn)        tlT.to(btn,        { y: 0, autoAlpha: 1, duration: 0.7 }, '-=0.5');
      if (btnOutline) tlT.to(btnOutline, { y: 0, autoAlpha: 1, duration: 0.7 }, '-=0.55');
      if (details.length) tlT.to(details, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.6 }, '-=0.5');
      if (stats.length)   tlT.to(stats,   { y: 0, autoAlpha: 1, stagger: 0.12, duration: 0.6 }, '-=0.5');

      return tlT;
    }

    /* First page load — full dramatic zoom-in reveal */
    document.body.style.overflow = 'hidden';
    window.addEventListener('error', function () {
      document.body.style.overflow = '';
    }, { once: true, capture: true });
    gsap.set('.nav', { autoAlpha: 0 });

    if (heroBg)     gsap.set(heroBg,     { scale: 0.48, borderRadius: '16px', opacity: 0 });
    if (overlay)    gsap.set(overlay,     { opacity: 0 });
    if (desc)       gsap.set(desc,        { y: 25, autoAlpha: 0 });
    if (btn)        gsap.set(btn,         { y: 20, autoAlpha: 0 });
    if (btnOutline) gsap.set(btnOutline,  { y: 20, autoAlpha: 0 });
    if (details.length) gsap.set(details, { y: 12, autoAlpha: 0 });
    if (stats.length)   gsap.set(stats,   { y: 20, autoAlpha: 0 });

    var zoomDur = isDesktop() ? 2.4 : 1.6;

    var tl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      delay: 0.25,
      onComplete: function () {
        document.body.style.overflow = '';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            ScrollTrigger.refresh();
            if (heroBg && isDesktop()) {
              gsap.to(heroBg, {
                yPercent: 18, ease: 'none',
                scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
              });
            }
          });
        });
      }
    });

    if (titleLines.length) {
      tl.from(titleLines, { yPercent: 110, duration: 1.0, ease: 'power4.out', stagger: 0.15 });
    }
    if (heroBg) {
      tl.to(heroBg, { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.15');
      tl.to(heroBg, {
        scale: 1, borderRadius: '0px', duration: zoomDur, ease: 'power3.inOut',
        onComplete: function () { gsap.set(heroBg, { clearProps: 'scale,borderRadius,opacity' }); }
      }, '-=0.4');
    }
    if (overlay)    tl.to(overlay,    { opacity: 1, duration: 1.2 }, '-=1.2');
    tl.to('.nav', { autoAlpha: 1, duration: 0.6 }, '-=0.8');
    if (desc)       tl.to(desc,       { y: 0, autoAlpha: 1, duration: 0.8 }, '-=0.4');
    if (btn)        tl.to(btn,        { y: 0, autoAlpha: 1, duration: 0.7 }, '-=0.5');
    if (btnOutline) tl.to(btnOutline, { y: 0, autoAlpha: 1, duration: 0.7 }, '-=0.55');
    if (details.length) tl.to(details, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.6 }, '-=0.5');
    if (stats.length)   tl.to(stats,   { y: 0, autoAlpha: 1, stagger: 0.12, duration: 0.6 }, '-=0.5');

    return tl;
  }

  /* ╔══════════════════════════════════════════════════════════════╗
     ║  PAGE-SPECIFIC SCROLL ANIMATIONS                           ║
     ╚══════════════════════════════════════════════════════════════╝ */

  var pageAnimations = {

    home: function (c) {
      gsap.to(c.querySelector('.marquee-track'), {
        xPercent: -50, ease: 'none',
        scrollTrigger: { trigger: c.querySelector('.marquee'), start: 'top bottom', end: 'bottom top', scrub: 0.4 }
      });

      var aboutLabel   = c.querySelector('.about-label');
      var aboutHeading = c.querySelector('.about-heading');
      var aboutBody    = c.querySelector('.about-body');
      var aboutLink    = c.querySelector('.about-link');
      var aboutImage   = c.querySelector('.about-image');

      if (aboutLabel)   gsap.from(aboutLabel,   { y: 20, opacity: 0, duration: 0.6, ease: 'expo.out', scrollTrigger: { trigger: aboutLabel, start: 'top 85%' } });
      if (aboutHeading) gsap.from(aboutHeading, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: aboutHeading, start: 'top 85%' } });
      if (aboutBody)    gsap.from(aboutBody,    { y: 30, opacity: 0, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: aboutBody, start: 'top 85%' } });
      if (aboutLink)    gsap.from(aboutLink,    { y: 20, opacity: 0, duration: 0.7, ease: 'expo.out', scrollTrigger: { trigger: aboutLink, start: 'top 90%' } });
      if (aboutImage) {
        gsap.from(aboutImage, { clipPath: 'inset(100% 0 0 0)', duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: aboutImage, start: 'top 80%' } });
        var img = aboutImage.querySelector('img');
        if (img) gsap.from(img, { scale: 1.3, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: aboutImage, start: 'top 80%' } });
      }

      var servicesLabel  = c.querySelector('.services-label');
      var servicesHeader = c.querySelector('.services-header h2');
      if (servicesLabel)  gsap.from(servicesLabel,  { y: 20, opacity: 0, duration: 0.6, ease: 'expo.out', scrollTrigger: { trigger: servicesLabel, start: 'top 85%' } });
      if (servicesHeader) gsap.from(servicesHeader, { y: 40, opacity: 0, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: servicesHeader, start: 'top 85%' } });
      gsap.from(gsap.utils.toArray(c.querySelectorAll('.service-card')), {
        y: 50, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.12,
        scrollTrigger: { trigger: c.querySelector('.services-grid'), start: 'top 85%' }
      });

      var buildsLabel  = c.querySelector('.builds-label');
      var buildsHeader = c.querySelector('.builds-header h2');
      if (buildsLabel)  gsap.from(buildsLabel,  { y: 20, opacity: 0, duration: 0.6, ease: 'expo.out', scrollTrigger: { trigger: buildsLabel, start: 'top 85%' } });
      if (buildsHeader) gsap.from(buildsHeader, { y: 40, opacity: 0, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: buildsHeader, start: 'top 85%' } });
      var buildCards = gsap.utils.toArray(c.querySelectorAll('.build-card'));
      gsap.from(buildCards, {
        y: 60, opacity: 0, scale: 0.92, duration: 0.9, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: c.querySelector('.builds-grid'), start: 'top 85%' }
      });
      if (isDesktop()) {
        gsap.utils.toArray(c.querySelectorAll('.build-card:not(.build-stat-tile) img')).forEach(function (img) {
          gsap.to(img, {
            yPercent: -8, ease: 'none',
            scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
          });
        });
      }

      var whyH2    = c.querySelector('.why h2');
      var whyIntro = c.querySelector('.why-intro');
      if (whyH2)    gsap.from(whyH2,    { y: 50, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: whyH2, start: 'top 85%' } });
      if (whyIntro) gsap.from(whyIntro, { y: 30, opacity: 0, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: whyIntro, start: 'top 85%' } });
      gsap.from(gsap.utils.toArray(c.querySelectorAll('.why-item')), {
        x: -40, opacity: 0, duration: 0.7, ease: 'expo.out', stagger: 0.06,
        scrollTrigger: { trigger: c.querySelector('.why-list'), start: 'top 88%' }
      });

      var testLabel  = c.querySelector('.testimonials-label');
      var testHeader = c.querySelector('.testimonials-header h2');
      if (testLabel)  gsap.from(testLabel,  { y: 20, opacity: 0, duration: 0.6, ease: 'expo.out', scrollTrigger: { trigger: testLabel, start: 'top 85%' } });
      if (testHeader) gsap.from(testHeader, { y: 40, opacity: 0, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: testHeader, start: 'top 85%' } });
      gsap.from(gsap.utils.toArray(c.querySelectorAll('.testimonial-card')), {
        y: 40, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: c.querySelector('.testimonials-grid'), start: 'top 88%' }
      });

      var ctaTitle = c.querySelector('.cta-title');
      var ctaP     = c.querySelector('.cta-band p');
      var ctaBtn   = c.querySelector('.cta-band .hero-btn');
      if (ctaTitle) gsap.from(ctaTitle, { scale: 0.7, opacity: 0, ease: 'none', scrollTrigger: { trigger: c.querySelector('.cta-band'), start: 'top 85%', end: 'top 35%', scrub: true } });
      if (ctaP)     gsap.from(ctaP,     { y: 30, opacity: 0, duration: 0.8, scrollTrigger: { trigger: ctaP, start: 'top 85%' } });
      if (ctaBtn)   gsap.from(ctaBtn,   { y: 20, opacity: 0, duration: 0.8, scrollTrigger: { trigger: ctaBtn, start: 'top 90%' } });
    },

    about: function (c) {
      var statNums = c.querySelectorAll('.hero-stat-badge-num');
      statNums.forEach(function (el) {
        var raw = el.textContent.trim();
        var numMatch = raw.match(/(\d+)/);
        if (numMatch) {
          var target = parseInt(numMatch[1]);
          var suffix = raw.replace(numMatch[1], '');
          el.textContent = '0' + suffix;
          gsap.to({ val: 0 }, {
            val: target, duration: 2, ease: 'power2.out', delay: 1.2,
            onUpdate: function () { el.textContent = Math.round(this.targets()[0].val) + suffix; }
          });
        }
      });

      var storyImg  = c.querySelector('.about-story-img');
      var storyText = c.querySelector('.about-story-text');
      if (storyImg)  gsap.from(storyImg,  { x: -60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: c.querySelector('.about-story'), start: 'top 78%' } });
      if (storyText) gsap.from(storyText, { x: 60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: c.querySelector('.about-story'), start: 'top 78%' } });

      var teamLabel = c.querySelector('.team-label');
      var teamH2    = c.querySelector('.team h2');
      if (teamLabel) gsap.from(teamLabel, { y: 20, opacity: 0, duration: 0.6, ease: 'expo.out', scrollTrigger: { trigger: c.querySelector('.team'), start: 'top 82%' } });
      if (teamH2)    gsap.from(teamH2,    { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: c.querySelector('.team'), start: 'top 80%' } });
      gsap.utils.toArray(c.querySelectorAll('.team-card')).forEach(function (card, i) {
        gsap.from(card, { y: 60, opacity: 0, scale: 0.96, duration: 0.9, ease: 'expo.out', delay: i * 0.15, scrollTrigger: { trigger: c.querySelector('.team-grid'), start: 'top 80%' } });
      });

      var valLabel = c.querySelector('.values-label');
      var valH2    = c.querySelector('.values h2');
      if (valLabel) gsap.from(valLabel, { y: 20, opacity: 0, duration: 0.6, ease: 'expo.out', scrollTrigger: { trigger: c.querySelector('.values'), start: 'top 82%' } });
      if (valH2)    gsap.from(valH2,    { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: c.querySelector('.values'), start: 'top 80%' } });
      gsap.utils.toArray(c.querySelectorAll('.value-card')).forEach(function (card, i) {
        gsap.from(card, { y: 50, opacity: 0, scale: 0.96, duration: 0.8, ease: 'expo.out', delay: i * 0.12, scrollTrigger: { trigger: c.querySelector('.values-grid'), start: 'top 82%' } });
      });

      var awLabel  = c.querySelector('.awards-label');
      var awH2     = c.querySelector('.awards-header h2');
      var awP      = c.querySelector('.awards-header p');
      if (awLabel) gsap.from(awLabel, { y: 20, opacity: 0, duration: 0.6, ease: 'expo.out', scrollTrigger: { trigger: c.querySelector('.awards'), start: 'top 82%' } });
      if (awH2)    gsap.from(awH2,    { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: c.querySelector('.awards'), start: 'top 80%' } });
      if (awP)     gsap.from(awP,     { y: 25, opacity: 0, duration: 0.7, ease: 'expo.out', scrollTrigger: { trigger: awP, start: 'top 85%' } });
      gsap.utils.toArray(c.querySelectorAll('.award-item')).forEach(function (item, i) {
        gsap.from(item, { x: -40, opacity: 0, duration: 0.8, ease: 'expo.out', delay: i * 0.1, scrollTrigger: { trigger: c.querySelector('.awards-list'), start: 'top 82%' } });
      });

      var ctaTitle = c.querySelector('.cta-title');
      var ctaP     = c.querySelector('.cta-band p');
      var ctaBtn   = c.querySelector('.cta-band .hero-btn');
      if (ctaTitle) gsap.from(ctaTitle, { scale: 0.75, opacity: 0, ease: 'none', scrollTrigger: { trigger: c.querySelector('.cta-band'), start: 'top 85%', end: 'top 35%', scrub: true } });
      if (ctaP)     gsap.from(ctaP,     { y: 30, opacity: 0, duration: 0.8, scrollTrigger: { trigger: ctaP, start: 'top 85%' } });
      if (ctaBtn)   gsap.from(ctaBtn,   { y: 20, opacity: 0, duration: 0.8, scrollTrigger: { trigger: ctaBtn, start: 'top 90%' } });
    },

    builds: function (c) {
      var cards = gsap.utils.toArray(c.querySelectorAll('.project-card'));
      cards.forEach(function (card, i) {
        gsap.from(card, {
          y: 50, opacity: 0, scale: 0.96, duration: 0.9, ease: 'expo.out',
          delay: i * 0.08,
          scrollTrigger: { trigger: c.querySelector('.projects-grid'), start: 'top 82%' }
        });
      });

      var ctaH2  = c.querySelector('.cta-band h2');
      var ctaP   = c.querySelector('.cta-band p');
      var ctaBtn = c.querySelector('.cta-band .hero-btn');
      if (ctaH2)  gsap.from(ctaH2,  { scale: 0.75, opacity: 0, ease: 'none', scrollTrigger: { trigger: c.querySelector('.cta-band'), start: 'top 85%', end: 'top 35%', scrub: true } });
      if (ctaP)   gsap.from(ctaP,   { y: 30, opacity: 0, duration: 0.8, scrollTrigger: { trigger: ctaP, start: 'top 85%' } });
      if (ctaBtn) gsap.from(ctaBtn, { y: 20, opacity: 0, duration: 0.8, scrollTrigger: { trigger: ctaBtn, start: 'top 90%' } });
    },

    services: function (c) {
      var introLabel = c.querySelector('.services-intro .section-label');
      var introH2    = c.querySelector('.services-intro h2');
      var introP     = c.querySelector('.services-intro p');
      if (introLabel) gsap.from(introLabel, { y: 16, opacity: 0, duration: 0.7, ease: 'expo.out', scrollTrigger: { trigger: c.querySelector('.services-intro'), start: 'top 84%' } });
      if (introH2)    gsap.from(introH2,    { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: introH2, start: 'top 86%' } });
      if (introP)     gsap.from(introP,     { y: 25, opacity: 0, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: introP, start: 'top 88%' } });
      gsap.from(gsap.utils.toArray(c.querySelectorAll('.services-quicknav a')), {
        y: 16, opacity: 0, duration: 0.6, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: c.querySelector('.services-quicknav'), start: 'top 90%' }
      });

      c.querySelectorAll('.svc-panel').forEach(function (panel) {
        var inner = panel.querySelector('.svc-panel-inner');
        var img   = panel.querySelector('.svc-panel-img img');
        if (inner) gsap.from(inner, { y: 64, opacity: 0, duration: 1.15, ease: 'expo.out', scrollTrigger: { trigger: panel, start: 'top 82%' } });
        if (img && isDesktop())   gsap.to(img, { scale: 1.08, ease: 'none', scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      var procLabel = c.querySelector('.process-header .section-label');
      var procH2    = c.querySelector('.process-header h2');
      var procP     = c.querySelector('.process-header p');
      if (procLabel) gsap.from(procLabel, { y: 16, opacity: 0, duration: 0.7, ease: 'expo.out', scrollTrigger: { trigger: c.querySelector('.process-header'), start: 'top 84%' } });
      if (procH2)    gsap.from(procH2,    { y: 50, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: procH2, start: 'top 86%' } });
      if (procP)     gsap.from(procP,     { y: 25, opacity: 0, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: procP, start: 'top 88%' } });
      gsap.from(gsap.utils.toArray(c.querySelectorAll('.process-step')), {
        y: 44, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.12,
        scrollTrigger: { trigger: c.querySelector('.process-track'), start: 'top 80%' }
      });
      gsap.from(gsap.utils.toArray(c.querySelectorAll('.process-step-num')), {
        scale: 0.5, opacity: 0, duration: 0.6, ease: 'back.out(2)', stagger: 0.12,
        scrollTrigger: { trigger: c.querySelector('.process-track'), start: 'top 80%' }
      });

      var ctaTitle = c.querySelector('.cta-title');
      var ctaP     = c.querySelector('.cta-band p');
      var ctaBtn   = c.querySelector('.cta-band .hero-btn');
      if (ctaTitle) gsap.from(ctaTitle, { scale: 0.75, opacity: 0, ease: 'none', scrollTrigger: { trigger: c.querySelector('.cta-band'), start: 'top 85%', end: 'top 35%', scrub: true } });
      if (ctaP)     gsap.from(ctaP,     { y: 30, opacity: 0, duration: 0.8, scrollTrigger: { trigger: ctaP, start: 'top 85%' } });
      if (ctaBtn)   gsap.from(ctaBtn,   { y: 20, opacity: 0, duration: 0.8, scrollTrigger: { trigger: ctaBtn, start: 'top 90%' } });
    },

    project: function (c) {
      var infoItems = gsap.utils.toArray(c.querySelectorAll('.project-info-item'));
      gsap.from(infoItems, {
        y: 30, opacity: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: c.querySelector('.project-info-bar'), start: 'top 88%' }
      });

      var overviewLabel = c.querySelector('.overview-label');
      var overviewH2    = c.querySelector('.overview h2');
      var overviewPs    = gsap.utils.toArray(c.querySelectorAll('.overview p'));
      var overviewImg   = c.querySelector('.overview-image');
      if (overviewLabel) gsap.from(overviewLabel, { y: 20, opacity: 0, duration: 0.6, ease: 'expo.out', scrollTrigger: { trigger: overviewLabel, start: 'top 85%' } });
      if (overviewH2)    gsap.from(overviewH2,    { y: 50, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: overviewH2, start: 'top 85%' } });
      if (overviewPs.length) gsap.from(overviewPs, { y: 30, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: overviewPs[0], start: 'top 88%' } });
      if (overviewImg) {
        gsap.from(overviewImg, { clipPath: 'inset(100% 0 0 0)', duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: overviewImg, start: 'top 80%' } });
        var oImg = overviewImg.querySelector('img');
        if (oImg) gsap.from(oImg, { scale: 1.3, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: overviewImg, start: 'top 80%' } });
      }

      var hlLabel = c.querySelector('.highlights-label');
      var hlH2    = c.querySelector('.highlights-header h2');
      if (hlLabel) gsap.from(hlLabel, { y: 20, opacity: 0, duration: 0.6, ease: 'expo.out', scrollTrigger: { trigger: hlLabel, start: 'top 85%' } });
      if (hlH2)    gsap.from(hlH2,    { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: hlH2, start: 'top 85%' } });

      var bentoItems = gsap.utils.toArray(c.querySelectorAll('.bento-item'));
      bentoItems.forEach(function (item, i) {
        var isCard = item.classList.contains('bento-card');
        gsap.from(item, {
          y: isCard ? 40 : 60,
          opacity: 0,
          scale: isCard ? 1 : 0.94,
          duration: 0.9,
          ease: 'expo.out',
          delay: i * 0.08,
          scrollTrigger: { trigger: c.querySelector('.bento'), start: 'top 82%' }
        });
        if (!isCard && isDesktop()) {
          var bImg = item.querySelector('img');
          if (bImg) gsap.to(bImg, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true } });
        }
      });

      var galLabel = c.querySelector('.gallery-label');
      var galH2    = c.querySelector('.gallery-header h2');
      if (galLabel) gsap.from(galLabel, { y: 20, opacity: 0, duration: 0.6, ease: 'expo.out', scrollTrigger: { trigger: galLabel, start: 'top 85%' } });
      if (galH2)    gsap.from(galH2,    { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: galH2, start: 'top 85%' } });

      var galItems = gsap.utils.toArray(c.querySelectorAll('.gallery-item'));
      galItems.forEach(function (item) {
        gsap.from(item, {
          y: 40, opacity: 0, duration: 0.8, ease: 'expo.out',
          scrollTrigger: { trigger: item, start: 'top 92%' }
        });
      });

      var specLabel = c.querySelector('.specs-label');
      var specH2    = c.querySelector('.specs-text h2');
      var specP     = c.querySelector('.specs-text p');
      if (specLabel) gsap.from(specLabel, { y: 20, opacity: 0, duration: 0.6, ease: 'expo.out', scrollTrigger: { trigger: c.querySelector('.specs'), start: 'top 82%' } });
      if (specH2)    gsap.from(specH2,    { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: c.querySelector('.specs'), start: 'top 80%' } });
      if (specP)     gsap.from(specP,     { y: 25, opacity: 0, duration: 0.7, ease: 'expo.out', scrollTrigger: { trigger: specP, start: 'top 85%' } });
      var specItems = gsap.utils.toArray(c.querySelectorAll('.spec-item'));
      gsap.from(specItems, {
        x: 30, opacity: 0, duration: 0.7, ease: 'expo.out', stagger: 0.05,
        scrollTrigger: { trigger: c.querySelector('.specs-list'), start: 'top 82%' }
      });

      var ctaTitle = c.querySelector('.cta-title');
      var ctaP     = c.querySelector('.cta-band p');
      var ctaBtns  = c.querySelector('.cta-actions');
      if (ctaTitle) gsap.from(ctaTitle, { scale: 0.75, opacity: 0, ease: 'none', scrollTrigger: { trigger: c.querySelector('.cta-band'), start: 'top 85%', end: 'top 35%', scrub: true } });
      if (ctaP)     gsap.from(ctaP,     { y: 30, opacity: 0, duration: 0.8, scrollTrigger: { trigger: ctaP, start: 'top 85%' } });
      if (ctaBtns)  gsap.from(ctaBtns,  { y: 20, opacity: 0, duration: 0.8, scrollTrigger: { trigger: ctaBtns, start: 'top 90%' } });
    },

    contact: function (c) {
      var info = c.querySelector('.contact-info');
      var form = c.querySelector('.contact-form');
      if (info) gsap.from(info, { x: -40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: c.querySelector('.contact-layout'), start: 'top 80%' } });
      if (form) gsap.from(form, { x: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: c.querySelector('.contact-layout'), start: 'top 80%' } });

      var projHeader = c.querySelector('.contact-projects-header');
      if (projHeader) gsap.from(projHeader, { y: 30, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: c.querySelector('.contact-projects'), start: 'top 82%' } });
      gsap.utils.toArray(c.querySelectorAll('.project-card')).forEach(function (card, i) {
        gsap.from(card, { y: 50, opacity: 0, scale: 0.97, duration: 0.9, ease: 'expo.out', delay: i * 0.1, scrollTrigger: { trigger: c.querySelector('.projects-mini-grid'), start: 'top 82%' } });
      });
    }
  };

  /* ╔══════════════════════════════════════════════════════════════╗
     ║  INTERACTIVE FEATURES (re-initialised on transition)       ║
     ╚══════════════════════════════════════════════════════════════╝ */

  var pageInteractives = {

    project: function (c) {
      var lightbox  = document.getElementById('lightbox');
      if (!lightbox) return;
      var lbImg     = lightbox.querySelector('.lightbox-img');
      var lbCounter = lightbox.querySelector('.lightbox-counter');
      var lbClose   = lightbox.querySelector('.lightbox-close');
      var lbPrev    = lightbox.querySelector('.lightbox-prev');
      var lbNext    = lightbox.querySelector('.lightbox-next');
      var items     = gsap.utils.toArray(c.querySelectorAll('.gallery-item[data-lb]'));
      var current   = 0;

      function showImage(idx) {
        current = idx;
        var img = items[idx].querySelector('img');
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        lbCounter.textContent = (idx + 1) + ' / ' + items.length;
      }

      function openLightbox(idx) {
        showImage(idx);
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }

      function closeLightbox() {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }

      items.forEach(function (item, i) {
        item.addEventListener('click', function () { openLightbox(i); });
      });
      lbClose.addEventListener('click', closeLightbox);
      lbPrev.addEventListener('click', function () { showImage((current - 1 + items.length) % items.length); });
      lbNext.addEventListener('click', function () { showImage((current + 1) % items.length); });
      lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
      document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') lbPrev.click();
        if (e.key === 'ArrowRight') lbNext.click();
      });
    },

    builds: function (c) {
      var filterBtns   = c.querySelectorAll('.filter-btn[data-filter]');
      var projectCards = c.querySelectorAll('.project-card[data-category]');
      filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          filterBtns.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var filter = btn.dataset.filter;
          projectCards.forEach(function (card) {
            var match = filter === 'all' || card.dataset.category === filter;
            if (match) {
              card.style.display = '';
              requestAnimationFrame(function () {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
              });
            } else {
              card.style.opacity = '0';
              card.style.transform = 'scale(0.97)';
              setTimeout(function () { if (card.style.opacity === '0') card.style.display = 'none'; }, 300);
            }
          });
        });
      });
    }
  };

  /* ╔══════════════════════════════════════════════════════════════╗
     ║  INIT PAGE (hero + scroll animations + interactives)       ║
     ╚══════════════════════════════════════════════════════════════╝ */

  function initPage(namespace, container, isTransition) {
    window.scrollTo(0, 0);

    if (namespace === 'home') {
      initHomeHero(container, isTransition);
    } else {
      initSubpageHero(container, isTransition);
    }

    if (!prefersReduced && pageAnimations[namespace]) {
      pageAnimations[namespace](container);
    }

    if (pageInteractives[namespace]) {
      pageInteractives[namespace](container);
    }

    initNavScrollState();
    updateActiveNav(namespace);
  }

  /* ╔══════════════════════════════════════════════════════════════╗
     ║  BARBA.JS INIT                                             ║
     ╚══════════════════════════════════════════════════════════════╝ */

  var PAGE_TITLES = {
    home:     'Burness Homes — Crafted Living, Not Just Houses',
    about:    'About | Burness Homes',
    builds:   'Our Builds | Burness Homes',
    project:  'Project | Burness Homes',
    services: 'Services | Burness Homes',
    contact:  'Contact | Burness Homes'
  };

  barba.init({
    preventRunning: true,
    transitions: [{
      name: 'hero-crossfade',
      sync: true,

      once: function (data) {
        initPage(data.next.namespace, data.next.container, false);
      },

      leave: function (data) {
        var scrollPos = window.scrollY;

        var oldHero = data.current.container.querySelector('.hero');
        var oldHeroContainer = data.current.container.querySelector('.hero-container');
        var heroImg = data.current.container.querySelector('.hero-bg img');
        if (oldHero) {
          var cs = getComputedStyle(oldHero);
          oldHero.style.padding = cs.padding;
          oldHero.style.height = cs.height;
          oldHero.style.minHeight = cs.minHeight;
          oldHero.style.overflow = cs.overflow;
        }
        if (oldHeroContainer) {
          var cs2 = getComputedStyle(oldHeroContainer);
          oldHeroContainer.style.minHeight = cs2.minHeight;
          oldHeroContainer.style.borderRadius = cs2.borderRadius;
          oldHeroContainer.style.overflow = cs2.overflow;
        }
        var heroBgDiv = data.current.container.querySelector('.hero-bg');
        if (heroBgDiv) {
          var cs4 = getComputedStyle(heroBgDiv);
          heroBgDiv.style.position = cs4.position;
          heroBgDiv.style.inset = cs4.inset;
          heroBgDiv.style.zIndex = cs4.zIndex;
          heroBgDiv.style.overflow = cs4.overflow;
        }
        if (heroImg) {
          var cs3 = getComputedStyle(heroImg);
          heroImg.style.height = cs3.height;
          heroImg.style.objectPosition = cs3.objectPosition;
          heroImg.style.transform = cs3.transform;
        }

        killScrollTriggers();

        var nav = document.querySelector('.nav');
        if (nav) nav.classList.remove('scrolled');

        gsap.set(data.current.container, {
          position: 'fixed', top: -scrollPos + 'px', left: 0, width: '100%', zIndex: 0
        });

        window.scrollTo(0, 0);

        _nextHeroImageReady = waitForHeroImage(data.next.container, 3000);

        var container = data.current.container;
        var done = this.async();
        _nextHeroImageReady.then(function () {
          gsap.to(container, {
            opacity: 0, duration: 0.6, ease: 'power2.inOut',
            onComplete: done
          });
        });
      },

      enter: function (data) {
        killScrollTriggers();

        var rawHtml = data.next.html || '';
        if (rawHtml) {
          var parser = new DOMParser();
          var newDoc = parser.parseFromString(rawHtml, 'text/html');

          /* Inject the incoming page's <style> so section-specific CSS is
             available. Both old and new styles coexist during the cross-fade;
             the swap happens in `after`. */
          var newStyle = newDoc.querySelector('head style');
          if (newStyle) {
            var injected = document.createElement('style');
            injected.setAttribute('data-barba-style', 'next');
            injected.textContent = newStyle.textContent;
            document.head.appendChild(injected);
          }

          /* Inject any external stylesheets the incoming page needs that
             aren't already loaded (e.g. project.css when navigating to a
             project detail page from the homepage or projects grid). */
          var newLinks = newDoc.querySelectorAll('link[rel="stylesheet"]');
          newLinks.forEach(function (link) {
            var href = link.getAttribute('href');
            if (!href) return;
            var already = document.querySelector('link[rel="stylesheet"][href="' + href + '"]');
            if (!already) {
              var el = document.createElement('link');
              el.rel = 'stylesheet';
              el.href = href;
              el.setAttribute('data-barba-css', 'injected');
              document.head.appendChild(el);
            }
          });
        }

        /* Pre-hide ALL hero text so only the background image is visible
           during the cross-fade. Hiding .hero-content covers every child
           (including home-only elements like .hero-detail). Elements outside
           .hero-content (overlay, stats badge, scroll-hint, title spans) are
           hidden individually. The hero entrance plays in `after`. */
        var c = data.next.container;
        var overlay     = c.querySelector('.hero-overlay');
        var heroContent = c.querySelector('.hero-content');
        var stats       = c.querySelector('.hero-stats');
        var scrollHint  = c.querySelector('.hero-scroll-hint');
        var titleSpans  = c.querySelectorAll('.hero-title-line span');

        if (overlay)     gsap.set(overlay,     { opacity: 0 });
        if (heroContent) gsap.set(heroContent, { autoAlpha: 0 });
        if (stats)       gsap.set(stats,       { autoAlpha: 0 });
        if (scrollHint)  gsap.set(scrollHint,  { autoAlpha: 0 });
        if (titleSpans.length) gsap.set(titleSpans, { yPercent: 115 });

        if (data.next.namespace === 'home') {
          var homeBg = c.querySelector('.hero-bg');
          if (homeBg) gsap.set(homeBg, { clipPath: 'inset(12px round 28px)' });
        } else {
          /* Pin the incoming sub-page hero to its correct layout so the
             home page's broad .hero overrides can't shift it during the
             cross-fade. Cleared in `after` once styles are swapped. */
          var newHero = c.querySelector('.hero');
          var newHeroImg = c.querySelector('.hero-bg img');
          if (newHero) {
            newHero.style.padding = '12px';
            newHero.style.height = 'auto';
          }
          if (newHeroImg) {
            newHeroImg.style.objectPosition = data.next.namespace === 'project' ? 'center 40%' : 'center 70%';
            gsap.set(newHeroImg, { yPercent: -10 });
          }
        }

        gsap.set(c, { opacity: 0, position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1 });

        var imgReady = _nextHeroImageReady || Promise.resolve();
        var done = this.async();
        imgReady.then(function () {
          gsap.to(c, {
            opacity: 1, duration: 0.6, ease: 'power2.inOut',
            onComplete: done
          });
        });
      },

      after: function (data) {
        window.scrollTo(0, 0);
        gsap.set(data.next.container, { clearProps: 'position,top,left,width,zIndex' });

        /* Replace the original page style with the newly injected one */
        var oldStyle = document.querySelector('head > style:not([data-barba-style])');
        var nextStyle = document.querySelector('head > style[data-barba-style="next"]');
        if (oldStyle && nextStyle) {
          oldStyle.remove();
          nextStyle.removeAttribute('data-barba-style');
        }

        /* Remove Barba-injected stylesheets the new page doesn't need */
        var rawHtml = data.next.html || '';
        if (rawHtml) {
          var parser = new DOMParser();
          var newDoc = parser.parseFromString(rawHtml, 'text/html');
          var needed = new Set();
          newDoc.querySelectorAll('link[rel="stylesheet"]').forEach(function (l) {
            var h = l.getAttribute('href');
            if (h) needed.add(h);
          });
          document.querySelectorAll('link[data-barba-css="injected"]').forEach(function (el) {
            if (!needed.has(el.getAttribute('href'))) el.remove();
          });
        }

        /* Clear hero layout overrides now that correct styles are active */
        var heroEl = data.next.container.querySelector('.hero');
        var heroImgEl = data.next.container.querySelector('.hero-bg img');
        if (heroEl) { heroEl.style.padding = ''; heroEl.style.height = ''; }
        if (heroImgEl) heroImgEl.style.objectPosition = '';

        var rawTitle = '';
        if (data.next.html) {
          var m = data.next.html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (m) rawTitle = m[1];
        }
        document.title = rawTitle || PAGE_TITLES[data.next.namespace] || document.title;
        initPage(data.next.namespace, data.next.container, true);
      }
    }]
  });

  initMobileMenu();

})();

(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);
  history.scrollRestoration = 'manual';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  function initMobileMenu() {
    document.addEventListener('click', function (e) {
      var toggle = e.target.closest('.nav-mobile-toggle');
      if (!toggle) return;
      var links = document.querySelector('.nav-links');
      if (links) {
        links.classList.toggle('open');
        toggle.classList.toggle('open');
      }
    });
  }

  function killScrollTriggers() {
    ScrollTrigger.getAll().forEach(function (st) { st.kill(); });
  }

  /* ╔══════════════════════════════════════════════════════════════╗
     ║  HERO ENTRANCE — SUB-PAGES                                 ║
     ╚══════════════════════════════════════════════════════════════╝ */

  function initSubpageHero(container, isTransition) {
    if (prefersReduced) return null;

    var overlay    = container.querySelector('.hero-overlay');
    var eyebrow    = container.querySelector('.hero-eyebrow');
    var titleLines = container.querySelectorAll('.hero-title-line span');
    var ctas       = container.querySelector('.hero-ctas');
    var scrollHint = container.querySelector('.hero-scroll-hint');
    var stats      = container.querySelector('.hero-stats');
    var hero       = container.querySelector('.hero');
    var heroImg    = container.querySelector('.hero-bg img');

    if (!hero) return null;

    if (overlay)    gsap.set(overlay,    { opacity: 0 });
    if (eyebrow)    gsap.set(eyebrow,    { autoAlpha: 0, y: 10 });
    if (ctas)       gsap.set(ctas,       { autoAlpha: 0, y: 25 });
    if (scrollHint) gsap.set(scrollHint, { autoAlpha: 0 });
    if (stats)      gsap.set(stats,      { autoAlpha: 0, x: 30 });

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
    if (eyebrow)    tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.6');
    if (titleLines.length) tl.from(titleLines, { yPercent: 115, duration: 1.1, ease: 'power4.out', stagger: 0.15 }, '-=0.4');
    if (!isTransition) tl.to('.nav', { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.5');
    if (ctas)       tl.to(ctas, { autoAlpha: 1, y: 0, duration: 0.8 }, '-=0.3');
    if (stats)      tl.to(stats, { autoAlpha: 1, x: 0, duration: 0.7 }, '-=0.4');
    if (scrollHint) tl.to(scrollHint, { autoAlpha: 1, duration: 0.5 }, '-=0.2');

    if (heroImg) {
      gsap.to(heroImg, {
        yPercent: 10, ease: 'none',
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

    /* On barba transitions, skip the dramatic zoom-in — use a simpler reveal
       so the cross-fade feels smooth rather than jarring. */
    if (isTransition) {
      if (overlay)    gsap.set(overlay,    { opacity: 0 });
      if (desc)       gsap.set(desc,       { y: 25, autoAlpha: 0 });
      if (btn)        gsap.set(btn,        { y: 20, autoAlpha: 0 });
      if (btnOutline) gsap.set(btnOutline, { y: 20, autoAlpha: 0 });
      if (details.length) gsap.set(details, { y: 12, autoAlpha: 0 });
      if (stats.length)   gsap.set(stats,   { y: 20, autoAlpha: 0 });

      var tlT = gsap.timeline({
        defaults: { ease: 'expo.out' },
        delay: 0.1,
        onComplete: function () {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              ScrollTrigger.refresh();
              if (heroBg) {
                gsap.to(heroBg, {
                  yPercent: 18, ease: 'none',
                  scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
                });
              }
            });
          });
        }
      });

      if (overlay)    tlT.to(overlay, { opacity: 1, duration: 0.8, ease: 'power2.out' });
      if (titleLines.length) tlT.from(titleLines, { yPercent: 110, duration: 1.0, ease: 'power4.out', stagger: 0.15 }, '-=0.4');
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

    var tl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      delay: 0.25,
      onComplete: function () {
        document.body.style.overflow = '';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            ScrollTrigger.refresh();
            if (heroBg) {
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
        scale: 1, borderRadius: '0px', duration: 2.4, ease: 'power3.inOut',
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
      gsap.utils.toArray(c.querySelectorAll('.build-card:not(.build-stat-tile) img')).forEach(function (img) {
        gsap.to(img, {
          yPercent: -8, ease: 'none',
          scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });

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
        if (img)   gsap.to(img, { scale: 1.08, ease: 'none', scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: true } });
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
    services: 'Services | Burness Homes',
    contact:  'Contact | Burness Homes'
  };

  barba.init({
    preventRunning: true,
    transitions: [{
      name: 'hero-crossfade',
      sync: true,

      leave: function (data) {
        var done = this.async();
        gsap.set(data.current.container, {
          position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 0
        });
        gsap.to(data.current.container, {
          opacity: 0, duration: 0.6, ease: 'power2.inOut',
          onComplete: done
        });
      },

      enter: function (data) {
        killScrollTriggers();

        /* Inject the incoming page's <style> so section-specific CSS is
           available. Uses data.next.html (barba caches the fetched page)
           or falls back to the data-barba-namespace to try a fetch.
           Both old and new styles coexist during the cross-fade (class
           names are page-scoped so they don't clash). */
        var rawHtml = data.next.html || '';
        if (rawHtml) {
          var parser = new DOMParser();
          var newDoc = parser.parseFromString(rawHtml, 'text/html');
          var newStyle = newDoc.querySelector('head style');
          if (newStyle) {
            var injected = document.createElement('style');
            injected.setAttribute('data-barba-style', 'next');
            injected.textContent = newStyle.textContent;
            document.head.appendChild(injected);
          }
        }

        /* Pre-hide hero text elements so only the hero image is visible
           during the cross-fade. The hero entrance plays in `after`. */
        var c = data.next.container;
        var overlay    = c.querySelector('.hero-overlay');
        var eyebrow    = c.querySelector('.hero-eyebrow');
        var ctas       = c.querySelector('.hero-ctas');
        var scrollHint = c.querySelector('.hero-scroll-hint');
        var stats      = c.querySelector('.hero-stats');
        var titleSpans = c.querySelectorAll('.hero-title-line span');
        var desc       = c.querySelector('.hero-desc');

        if (overlay)    gsap.set(overlay,    { opacity: 0 });
        if (eyebrow)    gsap.set(eyebrow,    { autoAlpha: 0 });
        if (ctas)       gsap.set(ctas,       { autoAlpha: 0 });
        if (scrollHint) gsap.set(scrollHint, { autoAlpha: 0 });
        if (stats)      gsap.set(stats,      { autoAlpha: 0 });
        if (desc)       gsap.set(desc,       { autoAlpha: 0 });
        if (titleSpans.length) gsap.set(titleSpans, { yPercent: 115 });

        gsap.set(c, { opacity: 0, position: 'relative', zIndex: 1 });
        return gsap.to(c, {
          opacity: 1, duration: 0.6, ease: 'power2.inOut'
        });
      },

      after: function (data) {
        gsap.set(data.next.container, { clearProps: 'position,zIndex' });

        /* Replace the original page style with the newly injected one */
        var oldStyle = document.querySelector('head > style:not([data-barba-style])');
        var nextStyle = document.querySelector('head > style[data-barba-style="next"]');
        if (oldStyle && nextStyle) {
          oldStyle.remove();
          nextStyle.removeAttribute('data-barba-style');
        }

        if (PAGE_TITLES[data.next.namespace]) {
          document.title = PAGE_TITLES[data.next.namespace];
        }
        initPage(data.next.namespace, data.next.container, true);
      }
    }]
  });

  barba.hooks.once(function (data) {
    initPage(data.next.namespace, data.next.container, false);
  });

  initMobileMenu();

})();
